# Phase 7: テスト実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Notification Policy 4カテゴリ / 5 policyの IaC 化と drift 検知 (UT-17-Followup-004) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | テスト実装 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 6 (テスト戦略) |
| 次 Phase | 8 (実装本体) |
| 状態 | completed |
| GitHub Issue | #636（CLOSED — Refs として参照） |
| 親 workflow | ut-17-cloudflare-analytics-alerts |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本 Phase は Phase 6 で確定したテスト戦略（API 正規化 / 冪等性 / drift 検知 / 名前→ID 解決 / quota-base 合成）を、bats-core / vitest で動く実コードとして固定する。テストファイルパス・フィクスチャ・assertion を具体に書き下す必要があるため実装仕様書扱いとする。CONST_007（テスト先送り禁止）に従い本 Phase で先に固定する。 |

---

## 目的

Phase 6 で確定したテスト戦略を、以下 4 層のテストファイルとして具体化する:

1. **正規化テスト**: API レスポンス JSON と repo 上の policy JSON を同じ canonical form に揃える純関数のテスト
2. **diff テスト**: canonical 化された 2 つの JSON tree から drift を検出するロジックのテスト
3. **解決ロジックテスト**: webhook destination の name → ID 解決、quota-base × percentage から閾値絶対値を算出するロジックのテスト
4. **シェル統合テスト**: `scripts/cf.sh alerts` サブコマンドの引数解析・exit code・mock API 応答に対する振る舞いを bats-core で検証

実 Cloudflare API は呼ばない。すべて fixture と stub で完結する。

---

## 7-1. テストファイル配置

| 種別 | パス | テストフレームワーク | 対象 |
| --- | --- | --- | --- |
| 純関数 (Node) | `infra/cloudflare-alerts/lib/__tests__/canonicalize.test.ts` | vitest | `canonicalizePolicy()` / `canonicalizeWebhook()` |
| 純関数 (Node) | `infra/cloudflare-alerts/lib/__tests__/diff.test.ts` | vitest | `diffPolicy()` / `diffWebhook()` |
| 純関数 (Node) | `infra/cloudflare-alerts/lib/__tests__/resolve.test.ts` | vitest | `resolveWebhookId()` / `computeThreshold()` |
| 純関数 (Node) | `infra/cloudflare-alerts/lib/__tests__/quota-base.test.ts` | vitest | `applyQuotaBase()` |
| シェル統合 | `scripts/__tests__/cf-alerts.bats` | bats-core | `cf.sh alerts {list,diff,apply,plan}` の引数 / exit code |
| フィクスチャ | `tests/fixtures/cloudflare-alerts/expected-policies.json` | （fixture） | 4 category / 5 policy + 1 webhook の期待値 |
| フィクスチャ | `tests/fixtures/cloudflare-alerts/api-list-policies.json` | （fixture） | Cloudflare API `GET /alerting/v3/policies` の mock レスポンス |
| フィクスチャ | `tests/fixtures/cloudflare-alerts/api-list-webhooks.json` | （fixture） | Cloudflare API `GET /alerting/v3/destinations/webhooks` の mock レスポンス |
| フィクスチャ | `tests/fixtures/cloudflare-alerts/api-drift-policies.json` | （fixture） | drift 検出用 (threshold が改変された変種) |
| フィクスチャ | `tests/fixtures/cloudflare-alerts/quota-base.json` | （fixture） | 無料枠 base 値 |

> vitest config は既存 root の `vitest.config.ts` に `infra/cloudflare-alerts/**/__tests__/**` を include する。

---

## 7-2. canonicalize テスト (vitest)

### 対象関数

```ts
// infra/cloudflare-alerts/lib/canonicalize.ts
export function canonicalizePolicy(input: unknown): CanonicalPolicy;
export function canonicalizeWebhook(input: unknown): CanonicalWebhook;
```

正規化規則:

1. オブジェクトキーを昇順ソート
2. `id` / `created` / `modified` / `account_id` / `enabled` 以外の Cloudflare 側 server-generated field を除去
3. `mechanisms.webhooks[].id` は除去し、代わりに `mechanisms.webhooks[].name`（事前解決済み）のみ保持
4. `conditions.threshold` は number 化（API は文字列で返すことがある）
5. `description` の trailing whitespace 除去

### テストケース表

| # | テスト名 | 入力 fixture | 期待 |
| --- | --- | --- | --- |
| C1 | キー順序が異なっても同一 canonical を返す | `api-list-policies.json` の workers entry と repo `workers-requests.json` | `canonicalizePolicy(api) === canonicalizePolicy(repo)` (deep equal) |
| C2 | server-generated field を除去する | `api-list-policies.json` workers entry | 戻り値に `id` / `created` / `modified` / `account_id` キーが含まれない |
| C3 | threshold が文字列でも number に正規化される | `{ conditions: { threshold: "80000" } }` | `result.conditions.threshold === 80000` |
| C4 | description trailing whitespace を除去 | `{ description: "Workers Requests 80%   " }` | `result.description === "Workers Requests 80%"` |
| C5 | webhook id を name に置換し id は残らない | `{ mechanisms: { webhooks: [{ id: "abc-123" }] } }` + webhook map `{ "abc-123": "ut-17-relay" }` | `result.mechanisms.webhooks[0]` が `{ name: "ut-17-relay" }` で `id` キーなし |
| C6 | enabled が boolean のまま保持される | `{ enabled: false }` | `result.enabled === false` |
| C7 | canonicalizeWebhook が secret field を除去する | `{ secret: "xxx", url: "https://...", name: "ut-17-relay" }` | `result` に `secret` キーなし |
| C8 | 入力が null/undefined で型エラーを投げる | `null` | `expect(() => canonicalizePolicy(null)).toThrow()` |

---

## 7-3. diff テスト (vitest)

### 対象関数

```ts
// infra/cloudflare-alerts/lib/diff.ts
export type Drift = { kind: "missing" | "extra" | "changed"; name: string; path?: string; expected?: unknown; actual?: unknown };
export function diffPolicy(expected: CanonicalPolicy[], actual: CanonicalPolicy[]): Drift[];
export function diffWebhook(expected: CanonicalWebhook[], actual: CanonicalWebhook[]): Drift[];
```

戻り値が空配列なら drift なし、それ以外は drift。`cf.sh alerts diff` の exit code 決定に使う。

### テストケース表

| # | テスト名 | 入力 | 期待 |
| --- | --- | --- | --- |
| D1 | 一致時は空配列を返す | expected = actual = `expected-policies.json` | `diffPolicy(...)` が `[]` |
| D2 | actual に存在しない policy は `missing` として報告 | expected: 5 件 / actual: 3 件（workers-requests 欠落） | `[{ kind: "missing", name: "workers-requests" }]` |
| D3 | actual にだけ存在する policy は `extra` として報告 | expected: 5 件 / actual: 5 件（謎の追加 policy） | `[{ kind: "extra", name: "<unknown>" }]` |
| D4 | threshold だけ違う場合は `changed` + path で報告 | expected: workers `80000` / actual: workers `90000` | `[{ kind: "changed", name: "workers-requests", path: "conditions.threshold", expected: 80000, actual: 90000 }]` |
| D5 | webhook mapping が変わった場合も `changed` | expected: `webhooks[0].name = "ut-17-relay"` / actual: `"old-relay"` | `[{ kind: "changed", name: "workers-requests", path: "mechanisms.webhooks[0].name", ... }]` |
| D6 | 複数 drift を全件返す（早期 return しない） | workers threshold + pages 欠落 | `length === 2` |
| D7 | enabled flag の差分も `changed` で報告 | expected enabled=true / actual enabled=false | `[{ kind: "changed", name: ..., path: "enabled", expected: true, actual: false }]` |
| D8 | diffWebhook が name 単位で照合する | webhook url 違い | `[{ kind: "changed", name: "ut-17-relay", path: "url", ... }]` |

---

## 7-4. resolve / quota-base テスト (vitest)

### 対象関数

```ts
// infra/cloudflare-alerts/lib/resolve.ts
export function resolveWebhookId(name: string, webhookList: Array<{ id: string; name: string }>): string;
export function computeThreshold(percentage: number, base: number): number;

// infra/cloudflare-alerts/lib/quota-base.ts
export function applyQuotaBase(policy: PolicyTemplate, base: QuotaBase): CanonicalPolicy;
```

### テストケース表

| # | テスト名 | 入力 | 期待 |
| --- | --- | --- | --- |
| R1 | resolveWebhookId が name 一致で id を返す | `("ut-17-relay", [{id:"abc", name:"ut-17-relay"}])` | `"abc"` |
| R2 | 一致しない name で例外 | `("ut-17-relay", [])` | `throw` メッセージに name を含む |
| R3 | 同名 webhook が複数の場合は例外（曖昧性） | `[{id:"a",name:"x"},{id:"b",name:"x"}]` | `throw` |
| R4 | computeThreshold は整数を返す（小数切り捨て） | `(0.8, 100000)` | `80000` |
| R5 | computeThreshold は base が 0 で例外 | `(0.8, 0)` | `throw` |
| R6 | computeThreshold は percentage が 0..1 範囲外で例外 | `(1.5, 100)` | `throw` |
| Q1 | applyQuotaBase: workers policy の threshold が `base.workers_requests_per_day * 0.8` | base `{workers_requests_per_day: 100000}` + template `{percentage: 0.8, metric: "workers_requests_per_day"}` | `result.conditions.threshold === 80000` |
| Q2 | applyQuotaBase: D1 read | base `{d1_read_queries_per_day: 5_000_000}` + 0.8 | `4_000_000` |
| Q3 | applyQuotaBase: D1 write | base `{d1_write_queries_per_day: 100_000}` + 0.8 | `80_000` |
| Q4 | applyQuotaBase: Pages | base `{pages_requests_per_month: 100_000}` + 0.8 | `80_000` |
| Q5 | applyQuotaBase: R2 Class A | base `{r2_class_a_per_month: 1_000_000, r2_class_b_per_month: 10_000_000}` + 0.8 | Class A: `800_000`、Class B: `8_000_000`（policy が 2 conditions） |
| Q6 | 未知 metric で例外 | `metric: "unknown"` | `throw` |

---

## 7-5. シェル統合テスト (bats-core)

### 対象

`scripts/cf.sh alerts <sub>` — `list` / `diff` / `apply` / `plan` の 4 サブコマンド。

bats から実 Cloudflare API は呼ばず、`CF_ALERTS_MOCK_DIR` 環境変数に fixture dir を渡すと `cf.sh alerts` 内部の API curl が fixture を返す stub に差し替わる設計とする（Phase 8 で実装）。

### テストケース表

| # | テスト名 | 起動コマンド | 期待 exit | 期待 stdout/stderr |
| --- | --- | --- | --- | --- |
| S1 | サブコマンドなしで usage 表示 | `cf.sh alerts` | `64` | stderr に `usage: cf.sh alerts {list\|diff\|apply\|plan}` |
| S2 | 未知サブコマンドで usage 表示 | `cf.sh alerts unknown` | `64` | stderr に `unknown subcommand: unknown` |
| S3 | `list` が fixture から 4 category / 5 policy + 1 webhook を表示 | `CF_ALERTS_MOCK_DIR=tests/fixtures/cloudflare-alerts cf.sh alerts list` | `0` | stdout に `workers-requests` / `d1-read-queries` / `d1-write-queries` / `pages-build` / `r2-class-a` / `ut-17-relay` の 6 行 |
| S4 | `diff` 一致時は exit 0 で `no drift` を表示 | mock = `api-list-policies.json`（repo と一致）/ `cf.sh alerts diff` | `0` | stdout に `no drift detected` |
| S5 | `diff` 不一致時は exit 2 で drift 一覧を表示 | mock = `api-drift-policies.json`（threshold 変造）/ `cf.sh alerts diff` | `2` | stdout に `changed: workers-requests conditions.threshold expected=80000 actual=90000` |
| S6 | `diff --json` で JSON 配列出力 | `cf.sh alerts diff --json` | `2` | stdout が `[{"kind":"changed",...}]` で `jq -e .` が通る |
| S7 | `plan` は diff と同じ判定だが exit code は常に 0 | `cf.sh alerts plan` | `0` | stdout に drift 一覧 or `no drift` |
| S8 | `apply` は `--yes` なしだと dry-run | `cf.sh alerts apply` | `0` | stdout に `dry-run` を含み、API mock の write log に POST/PUT が 1 件もない |
| S9 | `apply --yes` は webhook→policy 順で適用 | `cf.sh alerts apply --yes` | `0` | mock write log の順序が webhook 先 / policy 後 |
| S10 | `apply --yes` 適用後の `diff` が exit 0 (冪等性) | `apply --yes` の後 `diff` | `0` (diff) | stdout `no drift detected` |
| S11 | `CLOUDFLARE_ALERTS_TOKEN_READ` 未設定 + `--ci` で fail | `cf.sh alerts diff --ci`（env 無し） | `78` | stderr に `CLOUDFLARE_ALERTS_TOKEN_READ is required` |
| S12 | `--ci` モードで `op run` がスキップされる | `CLOUDFLARE_ALERTS_TOKEN_READ=dummy cf.sh alerts diff --ci` | `0` or `2` | stderr に `[cf.sh] CI mode: skipping op run` を含む |
| S13 | secret を含む文字列が stdout/stderr に流れない | 任意のサブコマンド | （任意） | `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ALERTS_TOKEN_READ` の実値が grep にヒットしないこと |

---

## 7-6. フィクスチャ仕様

### `tests/fixtures/cloudflare-alerts/quota-base.json`

```json
{
  "version": 1,
  "source": "https://developers.cloudflare.com/workers/platform/limits/ (snapshot 2026-05-09)",
  "values": {
    "workers_requests_per_day": 100000,
    "d1_read_queries_per_day": 5000000,
    "d1_write_queries_per_day": 100000,
    "pages_requests_per_month": 100000,
    "r2_class_a_per_month": 1000000,
    "r2_class_b_per_month": 10000000
  }
}
```

### `tests/fixtures/cloudflare-alerts/expected-policies.json`

`infra/cloudflare-alerts/policies/*.json` を `quota-base.json` で展開し、`canonicalizePolicy()` 適用後の期待値を 1 配列にまとめたもの（Phase 8 で生成）。

### `tests/fixtures/cloudflare-alerts/api-list-policies.json`

```json
{
  "result": [
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "name": "workers-requests",
      "description": "Workers Requests 80%",
      "alert_type": "billing_usage_alert",
      "enabled": true,
      "conditions": { "metric": "workers_requests_per_day", "threshold": 80000 },
      "mechanisms": { "webhooks": [{ "id": "11111111-1111-1111-1111-111111111111" }] },
      "created": "2026-05-09T00:00:00Z",
      "modified": "2026-05-09T00:00:00Z",
      "account_id": "redacted"
    }
    /* … d1-read-queries / d1-write-queries / pages-build / r2-class-a も同形 */
  ],
  "success": true,
  "errors": [],
  "messages": []
}
```

### `tests/fixtures/cloudflare-alerts/api-drift-policies.json`

`api-list-policies.json` の workers-requests `threshold` を `90000` に書き換え、pages-build entry を削除した変種。drift 検出テスト D2 / D4 / D6 の入力に使う。

### `tests/fixtures/cloudflare-alerts/api-list-webhooks.json`

```json
{
  "result": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "name": "ut-17-relay",
      "type": "generic",
      "url": "https://<relay-worker-host>/internal/alert-relay",
      "created_at": "2026-05-09T00:00:00Z"
    }
  ],
  "success": true,
  "errors": [],
  "messages": []
}
```

> URL の `<relay-worker-host>` は placeholder。実 URL は repo に書かず、`scripts/cf.sh alerts` 実行時に `op://Vault/UT-17-Relay/url` から解決する。

---

## 7-7. テスト実行コマンド（Phase 9 で gate 化）

| 層 | コマンド | 期待 |
| --- | --- | --- |
| vitest | `mise exec -- pnpm vitest run infra/cloudflare-alerts` | C1〜Q6 全 pass |
| bats | `mise exec -- bats scripts/__tests__/cf-alerts.bats` | S1〜S13 全 pass |
| 統合 | `mise exec -- pnpm test:alerts`（package.json に追加・vitest + bats を順次実行） | 全 pass |

bats-core は dev dependency として `pnpm add -D -w bats` で導入する（Phase 8 で固定）。

---

## 7-8. test 用 stub 実装方針

`scripts/cf.sh alerts` の内部 HTTP call は **1 箇所の `cf_alerts_api()` 関数に集約**し、`CF_ALERTS_MOCK_DIR` が設定されていればその dir 配下の `api-list-policies.json` / `api-list-webhooks.json` を `cat` で返す stub に切り替わる。write 系（POST / PUT / DELETE）は同 dir 配下の `write-log.txt` に append するだけで実 API は呼ばない。

これにより S1〜S13 は実 Cloudflare API なしで完結する。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/phase-06.md | テスト戦略 |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-004-cloudflare-notification-policy-iac.md | 苦戦箇所 6.2 / 6.3 を根拠とする resolve / quota-base テスト |
| 必須 | scripts/cf.sh | サブコマンド追加対象 |
| 参考 | https://developers.cloudflare.com/api/operations/notification-policies-list-notification-policies | API スキーマ |
| 参考 | https://bats-core.readthedocs.io/ | bats-core 利用方法 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/test-implementation.md | 7-1〜7-8 の確定版 |
| ドキュメント | outputs/phase-07/fixture-spec.md | 7-6 fixture 仕様の詳細 |
| メタ | artifacts.json | phase-07 を completed に更新 |

---

## 完了条件

- [ ] 7-1 のテストファイル配置が全件パス指定で確定
- [ ] 7-2 / 7-3 / 7-4 のテストケース表が漏れなくケース番号付きで列挙
- [ ] 7-5 の bats テスト S1〜S13 の起動コマンド / 期待 exit code / 期待出力が確定
- [ ] 7-6 のフィクスチャ仕様が JSON 構造で示されている
- [ ] 7-7 のテスト実行コマンドが `mise exec -- pnpm ...` 形式で固定
- [ ] 7-8 の stub 方針が `CF_ALERTS_MOCK_DIR` 経由で確定

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-07 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 8（実装本体）
- 引き継ぎ事項:
  - 7-6 fixture は Phase 8 で `infra/cloudflare-alerts/policies/*.json` から build step で生成可能なものは生成し、それ以外（API mock）は手書きで用意
  - 7-8 の `CF_ALERTS_MOCK_DIR` stub 切替を Phase 8 の `cf.sh alerts` 実装に必ず組み込む
- ブロック条件: bats-core を dev dependency に入れる承認が得られない場合は vitest + child_process で代替する案に切替（Phase 8 着手前に判断）
