# Phase 2: 設計

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase で確定する `scripts/cf.sh alerts` サブコマンド仕様（apply / diff / list）、`infra/cloudflare-alerts/` JSON schema、API Token scope 分離は Phase 7 実装で直接的に bash + tsx + JSON ファイル群へ展開される実装仕様である。設計ドキュメントは Phase 7 実装エージェントが追加判断なしにコード生成できる粒度まで確定させる。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Notification Policy 4カテゴリ / 5 policyの IaC 化と drift 検知 (ut-17-followup-004) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |
| GitHub Issue | #636（CLOSED — Refs として参照） |

## 目的

Phase 1 で確定した要件・論点をもとに、index.md の AC-1〜AC-8 / AC-11 に対応する 5 種類の設計ドキュメントを作成する。
本 Phase は設計成果物のみを出力し、実コードは含めない。Phase 7 以降への引き渡しを意識し、JSON schema・コマンド仕様・API endpoint 対応・Token scope 配置・ディレクトリ構造を **コード生成可能な粒度** まで具体化する。

## 真の論点（Phase 1 から継承）

1. 採用方式の確定（Terraform vs API + cf.sh）
2. API Token scope 分離（apply / read）
3. 閾値表現の不統一への対応（quota-base 中央集約）
4. webhook destination と policy の順序依存（name 解決）

## 依存境界

| 種別 | 対象 | 本 Phase での扱い |
| --- | --- | --- |
| 上流 | Phase 1 requirements.md | 論点・スコープ・AC・4 条件評価 |
| 上流 | 親 UT-17 phase-02 alert-policy-matrix.md | 4 category / 5 policy の閾値と Notification Type |
| 上流 | 親 UT-17 phase-02 secret-management.md | UT-17 既存 Secret 命名 |
| 上流 | `scripts/cf.sh` 既存実装 | サブコマンド拡張パターン |
| 下流 | Phase 3 レビュー | 5 設計ドキュメント全件と未決事項 |
| 下流 | Phase 7 実装 | JSON schema / コマンド仕様 / API endpoint 対応 |
| 下流 | Phase 12 正本同期 | 親 UT-17 implementation-guide / runbook 差し替え方針 |

## 価値とコスト

- **価値**: 5 設計ドキュメントを揃え、Phase 7 実装エージェントが追加判断なしに JSON / bash / tsx を生成できる状態を作る。
- **コスト**: コマンド仕様・JSON schema・API endpoint 対応・Token scope 設計の決定事項が多いが、各成果物は短文テーブル + コードスニペット中心で重複排除する。

## 4 条件評価

| 条件 | 問い | 判定基準 |
| --- | --- | --- |
| 価値性 | 5 ドキュメントが Phase 7 の不確実性を実質的に下げるか | 各成果物にコマンド shape / JSON schema / API endpoint / Token scope / runbook 差し替え方針が含まれること |
| 実現性 | Cloudflare API v4 alerting/v3 + bash + tsx で AC を満たせるか | `api-mapping.md` に endpoint 一覧 + 確認日時 + 公式 URL が記録され、未確定 alert_type の代替方針が明記されること |
| 整合性 | 既存 `scripts/cf.sh` の拡張パターンと CLAUDE.md 不変条件が遵守されているか | `cf-sh-alerts-spec.md` に既存 `audit-log` / `r2` パターン踏襲が明示されること |
| 運用性 | apply / diff / list / token rotate / quota-base 更新が運用継続可能か | `architecture.md` と README 設計に運用フローが含まれること |

## 設計成果物一覧（AC との対応）

| 成果物 | AC | 概要 |
| --- | --- | --- |
| outputs/phase-02/architecture.md | AC-1, AC-3, AC-4, AC-11 | 採用方式（API + cf.sh）の確定根拠、Terraform 棄却、apply / diff のシーケンス |
| outputs/phase-02/directory-layout.md | AC-1, AC-2, AC-7 | `infra/cloudflare-alerts/` 配下構造、JSON schema、quota-base.json schema、README 雛形 |
| outputs/phase-02/cf-sh-alerts-spec.md | AC-3, AC-4, AC-5, AC-11 | `scripts/cf.sh alerts {apply\|diff\|list}` のコマンド仕様、内部実装方針 |
| outputs/phase-02/api-mapping.md | AC-1, AC-3 | Cloudflare API v4 endpoint 対応表、alert_type 4カテゴリ / 5 policyの閾値表現整理 |
| outputs/phase-02/token-scope-design.md | AC-6, AC-8 | API Token scope 分離、1Password 配置、CI 経路、drift workflow yaml 雛形 |

## architecture.md 設計（AC-1, AC-3, AC-4, AC-11）

### 採用方式の確定

| 候補 | 採否 | 根拠 |
| --- | --- | --- |
| (a) Cloudflare API v4 + `scripts/cf.sh alerts` 拡張 | **採用** | 既存 `scripts/cf.sh` パターンに乗せられる、新規依存ゼロ、小規模（4 category / 5 policy + 1 webhook）に適合 |
| (b) Cloudflare Terraform Provider | 棄却 | learning cost、state 管理運用、provider バージョン依存の alert_type beta 問題。本タスクは LOW 優先度 |
| (c) Cloudflare Pulumi / SDK | 棄却 | 同上＋追加ランタイム導入 |
| (d) Wrangler 直接呼び出し | 棄却（規約違反） | CLAUDE.md「`bash scripts/cf.sh` 経由のみ」不変条件に違反 |

### apply シーケンス（冪等）

```
1. quota-base.json を読み込み、base 値を取得
2. webhooks/*.json を読み込み、name → desired spec の map を構築
3. GET /accounts/:account_id/alerting/v3/destinations/webhooks で現状取得
4. webhook destination ごとに:
   - 同名存在 → spec 比較 → 差分あれば PUT /destinations/webhooks/:id
   - 同名なし → POST /destinations/webhooks → id 取得
5. webhook name → id の map を完成
6. policies/*.json を読み込み、threshold formula を base × 係数で展開
7. policy 内 mechanisms.webhooks[].name を id に置換
8. GET /accounts/:account_id/alerting/v3/policies で現状取得
9. policy ごとに:
   - 同名存在 → spec 比較 → 差分あれば PUT /policies/:id
   - 同名なし → POST /policies
10. apply 結果を JSON で stdout 出力
```

### diff シーケンス

```
1. apply と同じく desired spec を構築（POST/PUT は実行しない）
2. GET で Cloudflare 現状取得
3. 正規化（fields ソート、未知 fields 除外）
4. desired vs current を JSON Pointer 単位で diff
5. drift あれば exit 1、無ければ exit 0
```

### 正規化方針

| 項目 | 方針 |
| --- | --- |
| 比較対象 fields | repo 宣言に存在する key のみ。Cloudflare 側返却の追加 fields は無視 |
| 配列順序 | `mechanisms.webhooks[]` は name 昇順、`mechanisms.emails[]` は address 昇順でソート後比較 |
| 数値 threshold | base × 係数で展開後、整数比較 |
| 文字列 | trim + lowercase 比較は **行わない**（Cloudflare が大小区別する可能性を残す） |
| 未知 alert_type | 公式仕様確認時点の名称で書き、不一致時は warning として exit 0 を保ち、`--strict` フラグで exit 1 に切替可能にする |

### 順序保証（AC-11）

- apply 内部で必ず webhook destination 群 → policy 群の順序で処理
- policy 内 `mechanisms.webhooks[]` は `{ "name": "ut-17-relay" }` 形式で記述し、apply 時に `{ "id": "<resolved>" }` に置換
- repo 上に id 直書き（`{ "id": "<uuid>" }`）された policy 定義は `alerts apply` / `alerts diff` 起動時に検出して fail

## directory-layout.md 設計（AC-1, AC-2, AC-7）

### ディレクトリ構造

```
infra/
└── cloudflare-alerts/
    ├── README.md
    ├── quota-base.json
    ├── policies/
    │   ├── workers-requests.json
    │   ├── d1-read-queries.json
    │   ├── d1-write-rows.json
    │   ├── pages-build.json
    │   └── r2-class-a.json
    └── webhooks/
        └── ut-17-relay.json
```

### `quota-base.json` schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "version": 1,
  "verifiedAt": "2026-05-14",
  "verifiedSource": "https://developers.cloudflare.com/...",
  "limits": {
    "workersDailyRequests": 100000,
    "d1ReadRowsPerDay": 5000000,
    "d1WriteRowsPerDay": 100000,
    "pagesBuildsPerMonth": 500,
    "r2ClassAOperationsPerMonth": 1000000
  }
}
```

### policy JSON schema（例: `workers-requests.json`）

```json
{
  "name": "UBM-Hyogo Workers Daily Requests",
  "description": "Workers daily request quota alert for UBM Hyogo account",
  "enabled": true,
  "alert_type": "billing_usage_alert",
  "filters": {
    "product": ["workers.requests"]
  },
  "conditions": {
    "thresholdFormula": "limits.workersDailyRequests * 0.8",
    "warningCriticalSplit": {
      "warning": 0.8,
      "critical": 0.95
    }
  },
  "mechanisms": {
    "email": [{ "id": "ops@example.invalid" }],
    "webhooks": [{ "name": "ut-17-relay" }]
  }
}
```

> `alert_type` および `filters.product` の正式値は `api-mapping.md` で確定。`thresholdFormula` は apply 時に `quota-base.json` を参照して絶対値に展開する。

### webhook destination JSON schema

```json
{
  "name": "ut-17-relay",
  "url": "https://api.ubm-hyogo.example/internal/alert-relay",
  "secret_ref": "op://Cloudflare/UBM-Hyogo Alert cf-webhook-auth Secret/value"
}
```

> 実 secret 値は JSON に書かない。`secret_ref` は 1Password 参照のみ。apply 時に `op run` 経由で展開し、Cloudflare API へは生値ではなく Cloudflare 側 secret field として送信する。

### README 構造

| セクション | 内容 |
| --- | --- |
| 概要 | このディレクトリの目的、親 UT-17 との関係 |
| 前提 | 1Password Item / Token Permission |
| 操作手順 | `alerts apply` / `alerts diff` / `alerts list` の実行例 |
| Token rotate 手順 | apply / read token の年次ローテーション |
| `quota-base.json` 更新手順 | Cloudflare 無料枠改定時の追従 |
| 障害時切り戻し | apply 失敗時の手動復旧 |
| CI 連携 | drift workflow との関係 |

## cf-sh-alerts-spec.md 設計（AC-3, AC-4, AC-5, AC-11）

### サブコマンド一覧

| サブコマンド | 用途 | 必要 Token |
| --- | --- | --- |
| `bash scripts/cf.sh alerts apply` | 宣言を Cloudflare に冪等適用 | `CLOUDFLARE_ALERTS_TOKEN_APPLY` |
| `bash scripts/cf.sh alerts diff` | drift 検知（exit code で表現） | `CLOUDFLARE_ALERTS_TOKEN_READ` |
| `bash scripts/cf.sh alerts list` | 現状の policy / webhook を JSON 表示 | `CLOUDFLARE_ALERTS_TOKEN_READ` |

### コマンド shape

```
bash scripts/cf.sh alerts apply [--dry-run] [--only policies|webhooks] [--verbose]
bash scripts/cf.sh alerts diff [--ci] [--strict] [--format json|text]
bash scripts/cf.sh alerts list [--type policies|webhooks] [--format json|text]
```

| フラグ | 意味 |
| --- | --- |
| `--dry-run` | apply 内容を表示するが POST/PUT を実行しない |
| `--only policies\|webhooks` | apply 対象を限定 |
| `--ci` | `op run` を skip し、env var を直接読む（CI 用） |
| `--strict` | 未知 alert_type 検出時に exit 1 |
| `--format` | 出力形式 |

### 内部実装方針

- `scripts/cf.sh` の `audit-log` / `r2` サブコマンド拡張パターンを踏襲
- 実処理は `infra/cloudflare-alerts/lib/cli/{apply,diff,list}.ts` に tsx で実装
- `mise exec -- pnpm exec tsx` 経由で起動
- `set_tsx_esbuild_binary_path` 既存関数を再利用
- `op run` ラップは `--ci` 未指定時のみ

### 変更対象ファイル（Phase 7 で生成）

| ファイル | 種別 | 役割 |
| --- | --- | --- |
| `scripts/cf.sh` | 既存拡張 | `alerts` case 分岐追加（約 30 行追加） |
| `infra/cloudflare-alerts/lib/cli/apply.ts` | 新規 | apply 本体 |
| `infra/cloudflare-alerts/lib/cli/diff.ts` | 新規 | diff 本体 |
| `infra/cloudflare-alerts/lib/cli/list.ts` | 新規 | list 本体 |
| `infra/cloudflare-alerts/lib/lib/cloudflare-api.ts` | 新規 | API v4 client（fetch ベース） |
| `infra/cloudflare-alerts/lib/lib/spec-loader.ts` | 新規 | `infra/cloudflare-alerts/` 読み込み + threshold 展開 |
| `infra/cloudflare-alerts/lib/lib/normalize.ts` | 新規 | 正規化 + diff 算出 |
| `infra/cloudflare-alerts/lib/lib/types.ts` | 新規 | Policy / Webhook 型定義 |

### 主要関数シグネチャ

```ts
// spec-loader.ts
export interface QuotaBase {
  version: number;
  verifiedAt: string;
  verifiedSource: string;
  limits: Record<string, number>;
}
export function loadQuotaBase(root: string): QuotaBase;

export interface DesiredPolicy { /* policy JSON 1:1 */ }
export interface DesiredWebhook { /* webhook JSON 1:1 */ }

export function loadDesiredSpecs(root: string): {
  policies: DesiredPolicy[];
  webhooks: DesiredWebhook[];
};

export function expandThresholds(policy: DesiredPolicy, base: QuotaBase): DesiredPolicy;

// cloudflare-api.ts
export interface CloudflareClient {
  listPolicies(accountId: string): Promise<CurrentPolicy[]>;
  createPolicy(accountId: string, body: unknown): Promise<CurrentPolicy>;
  updatePolicy(accountId: string, id: string, body: unknown): Promise<CurrentPolicy>;
  listWebhooks(accountId: string): Promise<CurrentWebhook[]>;
  createWebhook(accountId: string, body: unknown): Promise<CurrentWebhook>;
  updateWebhook(accountId: string, id: string, body: unknown): Promise<CurrentWebhook>;
}
export function createClient(token: string): CloudflareClient;

// normalize.ts
export function diffPolicies(desired: DesiredPolicy[], current: CurrentPolicy[]): DiffResult;
export function diffWebhooks(desired: DesiredWebhook[], current: CurrentWebhook[]): DiffResult;
```

### 入出力

| 操作 | 入力 | 出力 |
| --- | --- | --- |
| `apply` | `infra/cloudflare-alerts/` 配下全件、`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ALERTS_TOKEN_APPLY` | stdout に適用結果 JSON、exit 0 / 非 0 |
| `diff` | 同上（token は READ）、`CLOUDFLARE_ALERTS_TOKEN_READ` | stdout に差分 JSON / text、drift なし exit 0、drift あり exit 1 |
| `list` | 同上 | stdout に現状 JSON / text、exit 0 |

### テスト方針

- unit test: `infra/cloudflare-alerts/lib/lib/*.ts` を vitest で網羅
  - `spec-loader.ts`: 正常ケース / quota-base 不在 / threshold formula parse 失敗
  - `normalize.ts`: 完全一致 / 差分あり / 配列順序違い / 未知 fields
  - `cloudflare-api.ts`: fetch mock で 200 / 401 / 404 / 5xx を網羅
- integration test: 実 Cloudflare account には Phase 7 / Phase 8 で接続。`--dry-run` で stub レスポンス使用
- e2e: `bash scripts/cf.sh alerts diff --dry-run --ci` がテスト fixture でゼロ exit すること

### 実行コマンド

```bash
# apply
bash scripts/cf.sh alerts apply

# diff（ローカル）
bash scripts/cf.sh alerts diff

# diff（CI）
CLOUDFLARE_ALERTS_TOKEN_READ=<from-github-secret> \
CLOUDFLARE_ACCOUNT_ID=<from-github-variable> \
bash scripts/cf.sh alerts diff --ci

# list
bash scripts/cf.sh alerts list --type policies --format text
```

### DoD（Definition of Done）

- `alerts apply` を 2 回連続実行して `alerts diff` の exit code が 0 になる
- `alerts diff` が手動 Dashboard 変更（テスト用の policy 名変更）に対して exit 1 + 差分 JSON 出力
- `alerts list` が現状 JSON を出力し、`infra/cloudflare-alerts/` 宣言と比較できる
- unit test が pass
- `--ci` モードで `op` 不在環境（CI runner）でも動作

## api-mapping.md 設計（AC-1, AC-3）

### Cloudflare API v4 endpoint 対応表

| 操作 | endpoint | 必要 Token Permission |
| --- | --- | --- |
| policy list | `GET /accounts/:account_id/alerting/v3/policies` | `Account.Notifications:Read` |
| policy create | `POST /accounts/:account_id/alerting/v3/policies` | `Account.Notifications:Edit` |
| policy update | `PUT /accounts/:account_id/alerting/v3/policies/:policy_id` | `Account.Notifications:Edit` |
| policy delete | `DELETE /accounts/:account_id/alerting/v3/policies/:policy_id` | `Account.Notifications:Edit` |
| webhook list | `GET /accounts/:account_id/alerting/v3/destinations/webhooks` | `Account.Notifications:Read` |
| webhook create | `POST /accounts/:account_id/alerting/v3/destinations/webhooks` | `Account.Notifications:Edit` |
| webhook update | `PUT /accounts/:account_id/alerting/v3/destinations/webhooks/:webhook_id` | `Account.Notifications:Edit` |

> 各 endpoint の最終確認日と公式 URL を `api-mapping.md` 本文に記録する。Phase 7 着手時に再確認する。

### alert_type 4カテゴリ / 5 policyの閾値表現整理

| メトリクス | 想定 alert_type | 閾値表現 | 注記 |
| --- | --- | --- | --- |
| Workers Daily Requests | `billing_usage_alert`（候補） | 絶対値（req/day） | Cloudflare Dashboard 上は百分率表示。API は絶対値を要求する想定 |
| D1 Read Rows | `billing_usage_alert`（候補） | 絶対値（rows/day） | 親 UT-17 phase-02 で「公式確認済み候補」扱い |
| D1 Write Rows | `billing_usage_alert`（候補） | 絶対値（rows/day） | 同上 |
| Pages Build | `billing_usage_alert`（候補） | 絶対値（builds/month） | 親 UT-17 で「未確認 gate」。Phase 7 着手前に再確認 |
| R2 Class A operations | `billing_usage_alert`（候補） | 絶対値（ops/month） | 親 UT-17 で「未確認 gate」。Phase 7 着手前に再確認 |

> alert_type の正式名称は Cloudflare 公式仕様改定の影響を受けるため、Phase 7 着手時に再確認し、本表の `想定 alert_type` 列を版固定する。

### 未確定メトリクスのフォールバック

| ケース | 対応 |
| --- | --- |
| Pages Build / R2 Class A の alert_type が API で提供されていない | 該当 policy JSON は `enabled: false` で git 管理し、`alerts apply` 時に skip。親 UT-17 phase-02 の baseline（メール通知のみ）に戻し、README に経緯を記録 |
| `Account.Notifications:Edit` Permission が UI で発行不可 | `Account.Account Settings:Edit` などの上位 scope にフォールバック。Phase 1 CONDITIONAL の解消条件として扱う |

## token-scope-design.md 設計（AC-6, AC-8）

### Token 一覧

| Token 名 | Scope | 1Password 正本パス | 利用箇所 |
| --- | --- | --- | --- |
| `CLOUDFLARE_ALERTS_TOKEN_APPLY` | `Account.Notifications:Edit` | `op://Cloudflare/UBM-Hyogo Alerts Apply Token/credential` | ローカル `alerts apply` 実行のみ |
| `CLOUDFLARE_ALERTS_TOKEN_READ` | `Account.Notifications:Read` | `op://Cloudflare/UBM-Hyogo Alerts Read Token/credential` | ローカル `alerts diff` / `alerts list`、および CI |
| `CLOUDFLARE_API_TOKEN`（既存） | Workers / Pages / D1 / R2 deploy 用 | 既存 `op://` パス維持 | `alerts` サブコマンドからは参照しない |

### `.env` 追加例（op:// 参照のみ）

```
CLOUDFLARE_ALERTS_TOKEN_APPLY=op://Cloudflare/UBM-Hyogo Alerts Apply Token/credential
CLOUDFLARE_ALERTS_TOKEN_READ=op://Cloudflare/UBM-Hyogo Alerts Read Token/credential
```

### GitHub Secrets / Variables 配置

| Key | 種別 | 用途 |
| --- | --- | --- |
| `CLOUDFLARE_ALERTS_TOKEN_READ` | Secret | drift 検知 CI |
| `CLOUDFLARE_ACCOUNT_ID` | Variable（既存） | account id |

apply 用 token は CI に置かない（手動 apply 専用）。これにより CI compromise 時の被害を read-only に限定する。

### drift 検知 CI workflow 雛形（`.github/workflows/cloudflare-alerts-drift.yml`）

```yaml
name: cloudflare-alerts-drift
on:
  schedule:
    - cron: "0 0 * * 1"
  workflow_dispatch:
  pull_request:
    paths:
      - "infra/cloudflare-alerts/**"
      - "infra/cloudflare-alerts/lib/**"
      - "scripts/cf.sh"

jobs:
  drift:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Run cloudflare-alerts drift detection
        env:
          CLOUDFLARE_ALERTS_TOKEN_READ: ${{ secrets.CLOUDFLARE_ALERTS_TOKEN_READ }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
        run: bash scripts/cf.sh alerts diff --ci --format json
```

### Token rotate 手順

| ステップ | 操作 |
| --- | --- |
| 1 | Cloudflare Dashboard で新 token を作成（scope を厳密に設定） |
| 2 | 1Password の対応 Item に新 credential 値を保存（旧 credential は履歴として残す） |
| 3 | `bash scripts/cf.sh alerts list` をローカルで実行し動作確認 |
| 4 | GitHub Secret `CLOUDFLARE_ALERTS_TOKEN_READ` を更新（read のみ） |
| 5 | drift workflow を `workflow_dispatch` で手動実行し成功確認 |
| 6 | Cloudflare Dashboard で旧 token を revoke |

## runbook 差し替え方針（AC-10、Phase 12 で実施）

`docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` 内の以下を差し替える:

| 旧 | 新 |
| --- | --- |
| 「Cloudflare Dashboard → Notifications で 4 category / 5 policy + 1 webhook が存在することを目視確認」 | 「`bash scripts/cf.sh alerts diff` を実行し exit 0 を確認」 |
| 「webhook URL の有効性を Dashboard 上で確認」 | 「`bash scripts/cf.sh alerts list --type webhooks` で URL と secret 設定状態を確認」 |
| 「Cloudflare 無料枠 base 値の差分確認」（既存 1 行） | 「`infra/cloudflare-alerts/quota-base.json` の `verifiedAt` を確認し、3 ヶ月以上経過していれば公式ドキュメントと突き合わせ更新」 |

## 親 UT-17 implementation-guide 更新方針（AC-9、Phase 12 で実施）

`docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md` Part 5 の T9 / T10 セクションに以下を追記:

```
## T9 / T10 IaC 化（ut-17-followup-004 完了後）

このセクションの Dashboard 手動設定は ut-17-followup-004 で IaC 化されました。
最新の手順は `docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/` を参照してください。

実適用: `bash scripts/cf.sh alerts apply`
drift 確認: `bash scripts/cf.sh alerts diff`
```

## 実行タスク

- [ ] Phase 1 成果物 (`outputs/phase-01/requirements.md`) を読み、論点と CONDITIONAL の解消条件を確認する
- [ ] 親 UT-17 phase-02 alert-policy-matrix.md / secret-management.md / phase-12 implementation-guide.md を再確認する
- [ ] Cloudflare API v4 alerting/v3/policies および destinations/webhooks の最新仕様を公式ドキュメントで確認し `api-mapping.md` の `verifiedAt` を記録
- [ ] `Account.Notifications:Edit` / `Account.Notifications:Read` Permission の発行可否を Cloudflare Dashboard で確認
- [ ] `outputs/phase-02/architecture.md` を作成（AC-1, AC-3, AC-4, AC-11）
- [ ] `outputs/phase-02/directory-layout.md` を作成（AC-1, AC-2, AC-7）
- [ ] `outputs/phase-02/cf-sh-alerts-spec.md` を作成（AC-3, AC-4, AC-5, AC-11）
- [ ] `outputs/phase-02/api-mapping.md` を作成（AC-1, AC-3）
- [ ] `outputs/phase-02/token-scope-design.md` を作成（AC-6, AC-8）
- [ ] runbook 差し替え方針（AC-10）/ 親 implementation-guide 追記方針（AC-9）を本 Phase に記述
- [ ] Terraform 棄却の根拠を architecture.md に明記
- [ ] Phase 3 レビューへの引き継ぎ事項（未決事項・代替案棄却理由）を明記

## 統合テスト連携

本 Phase は設計のみで実コードを生成しない。

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 7 実装 | `infra/cloudflare-alerts/lib/cli/*.ts` 生成、`scripts/cf.sh` case 分岐追加、JSON 宣言作成、CI workflow 追加 | 関数シグネチャ・JSON schema・コマンド shape を成果物として確定 |
| Phase 8 統合確認 | 実 Cloudflare アカウントへの apply / diff / list 動作確認 | 動作確認手順を `cf-sh-alerts-spec.md` の DoD に記載 |
| Phase 12 正本同期 | 親 UT-17 implementation-guide / runbook 差し替え | 差し替え方針を本 Phase に確定 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/phase-01.md | Phase 1 成果物 |
| 必須 | docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/index.md | AC・スコープの正本 |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-02/alert-policy-matrix.md | 親 UT-17 閾値 |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md | T9 / T10 外部操作残 |
| 必須 | scripts/cf.sh | 拡張対象 |
| 必須 | CLAUDE.md | シークレット管理 / Cloudflare CLI ルール |
| 参考 | https://developers.cloudflare.com/api/operations/notification-policies-create-notification-policy | API v4 policies |
| 参考 | https://developers.cloudflare.com/api/operations/notification-webhooks-create-webhook | API v4 webhooks |
| 参考 | https://developers.cloudflare.com/fundamentals/api/reference/permissions/ | Token Permission 一覧 |
| 参考 | https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/notification_policy | Terraform Provider（棄却判断の根拠確認） |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/architecture.md | 採用方式（API + cf.sh）と apply / diff シーケンス（AC-1, AC-3, AC-4, AC-11） |
| ドキュメント | outputs/phase-02/directory-layout.md | `infra/cloudflare-alerts/` 配下構造と JSON schema（AC-1, AC-2, AC-7） |
| ドキュメント | outputs/phase-02/cf-sh-alerts-spec.md | `scripts/cf.sh alerts {apply\|diff\|list}` コマンド仕様（AC-3, AC-4, AC-5, AC-11） |
| ドキュメント | outputs/phase-02/api-mapping.md | Cloudflare API v4 endpoint 対応表（AC-1, AC-3） |
| ドキュメント | outputs/phase-02/token-scope-design.md | Token scope 分離と CI workflow 雛形（AC-6, AC-8） |

## 完了条件

- [ ] 5 ドキュメント全てが指定パスに配置されている
- [ ] 各ドキュメントが対応する AC を冒頭に明示している
- [ ] architecture.md に Terraform 棄却根拠と apply / diff シーケンスが含まれる
- [ ] directory-layout.md に `infra/cloudflare-alerts/` 配下構造・quota-base.json schema・policy / webhook JSON schema が含まれる
- [ ] cf-sh-alerts-spec.md に変更対象ファイル一覧・関数シグネチャ・入出力・テスト方針・実行コマンド・DoD が含まれる（CONST_005）
- [ ] api-mapping.md に Cloudflare API v4 endpoint 対応表・alert_type 4カテゴリ / 5 policyの閾値表現・未確定メトリクスのフォールバックが含まれる
- [ ] token-scope-design.md に Token scope 分離・1Password 配置・GitHub Secrets 設計・drift workflow 雛形・rotate 手順が含まれる
- [ ] runbook 差し替え方針（AC-10）・親 implementation-guide 追記方針（AC-9）が本 Phase 内に記述されている
- [ ] Phase 3 レビューへの引き継ぎ事項が明記されている

## タスク 100% 実行確認【必須】

- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（Cloudflare API endpoint 廃止 / alert_type 名変更 / Token Permission UI 変更）の影響範囲を記録済み

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項: 5 ドキュメント、Terraform 棄却根拠、未確定 alert_type のフォールバック方針、Token rotate 手順、CI workflow 雛形をレビュー入力として渡す
- ブロック条件: 5 ドキュメントのいずれかが未作成、または Cloudflare API endpoint / Token Permission の事前確認が未完了の場合は Phase 3 に進まない
