[実装区分: 実装仕様書]

# Phase 4: 実装計画 / コードレベル詳細設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| 機能名 | ut-15-waf-rate-limiting-rules-setup |
| 作成日 | 2026-05-09 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | cloudflare_edge_security |
| 依存 | phase-01.md / phase-02.md / phase-03.md（PASS 済み前提） |

## 目的

Phase 3 で確定した実装方式（A: Cloudflare API 直叩き bash + 補助 C: `[[ratelimits]]` binding 検討）を、Phase 5 で git step 単位に実装可能な「ファイル単位の詳細設計」に落とし込む。具体的には (a) 変更対象ファイル一覧と差分方針、(b) 各ファイルの関数・型シグネチャ、(c) 入出力・副作用、(d) エラーハンドリング戦略、(e) secret / 1Password 依存パスを Phase 5 開始前に固定する。

## 1. 変更対象ファイル一覧（差分方針付き）

| # | パス | 種別 | 差分方針 |
| --- | --- | --- | --- |
| F-01 | `scripts/cf-waf-apply.sh` | 新規 | エントリ point。引数 parser → preflight（op run / token / config 検証）→ Cloudflare API call → 差分 report。`scripts/cf.sh` の `op run --env-file=.env` 慣習を継承し、`wrangler` を直接呼ばない |
| F-02 | `scripts/cf-waf-apply/config.json` | 新規 | 宣言的構成正本（zone / managed ruleset / custom rules / rate limit rules）。Phase 2 の Concern A/B を JSON 化 |
| F-03 | `scripts/cf-waf-apply/lib.sh` | 新規 | `apply_managed_ruleset` / `apply_custom_rules` / `apply_rate_limit_rules` / `compute_diff` / `print_dry_run` の bash function を分離（テスト容易性のため） |
| F-04 | `scripts/cf-waf-apply/lib.test.ts` | 新規 | vitest（spawn）で `cf-waf-apply.sh --dry-run` の stdout を JSON parse し、fixture とスナップショット比較 |
| F-05 | `scripts/cf-waf-apply/__fixtures__/dry-run.snapshot.json` | 新規 | F-04 の期待出力 fixture。Phase 2 の閾値マトリクスと一致 |
| F-06 | `apps/api/wrangler.toml` | 編集（条件付き）| MINOR-02 解決後、現行 `[[ratelimits]]` binding を 1 件追加するか、追加しないかを Phase 5 で確定。Phase 4 では「追加した場合の TOML 差分」と「追加しない理由」両案を併記 |
| F-07 | `apps/api/src/middleware/edge-rate-limit-headers.ts` | 新規 | 429 応答 helper。`buildRateLimitedResponse(input)` を export |
| F-08 | `apps/api/src/middleware/__tests__/edge-rate-limit-headers.test.ts` | 新規 | helper 単体テスト（5 ケース以上） |
| F-09 | `apps/api/src/middleware/rate-limit-magic-link.ts` | 編集 | 429 生成箇所を F-07 helper 呼び出しに差し替え。**signature は変更しない**（不変条件）|
| F-10 | `apps/api/src/middleware/rate-limit-self-request.ts` | 編集 | 同上 |
| F-11 | `apps/api/src/middleware/__tests__/rate-limit-magic-link.test.ts` | 編集 | 既存テストの retry-after / body shape 期待値を helper 由来に揃える（互換維持・既存ケース数は維持） |
| F-12 | `docs/runbooks/cloudflare-waf-operations.md` | 新規 | Phase 7 で本体作成。Phase 4 では「目次・各セクション必須項目」だけ確定 |
| F-13 | `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/outputs/phase-4/implementation-plan.md` | 新規（任意）| 本 Phase 4 の outputs。Phase 4 完了時に作成 |

> **削除対象なし**: 既存 middleware の signature を維持するため、削除はゼロ。

## 2. 関数・型シグネチャ

### F-01 `scripts/cf-waf-apply.sh`（usage 詳細）

```bash
# usage
bash scripts/cf-waf-apply.sh \
  --mode <simulate|enforce> \
  [--dry-run] \
  [--env <staging|production>] \
  [--zone <ZONE_ID>] \
  [--config <path/to/config.json>]

# 既定値
#   --mode      必須（既定なし）
#   --dry-run   未指定で false（実 apply）
#   --env       既定 staging
#   --zone      未指定時は config.json の zones[*].id を全件
#   --config    既定 scripts/cf-waf-apply/config.json

# pre-flight 検査順序
#   1) command -v op  → 不在なら exit 1
#   2) op run --env-file=.env -- env | grep CLOUDFLARE_API_TOKEN  → 未注入なら exit 1
#   3) jq による config.json schema 検証（zones[].id / customRules[].name 必須）
#   4) Cloudflare API: GET /user/tokens/verify → 200 でなければ exit 1
#
# main flow
#   for zone in zones:
#     a) GET 現状 ruleset → ローカル期待値と diff
#     b) --dry-run なら diff を JSON で stdout、exit 0（差分なし）/ exit 14（差分あり）
#     c) 実行モードなら PUT /zones/{id}/rulesets/phases/http_request_firewall_custom/entrypoint
#        + PUT /zones/{id}/rulesets/phases/http_ratelimit/entrypoint
#        + PUT /zones/{id}/rulesets/phases/http_request_firewall_managed/entrypoint
#     d) 完了後 GET で再取得し、期待値と一致しなければ exit 2
```

### F-03 `scripts/cf-waf-apply/lib.sh`（function signature）

```bash
# 戻り値: 0 成功 / 非 0 はエラー種別（11=token, 12=schema, 13=api, 14=diff）
preflight_check()                                    # 標準出力: 検査結果 JSON
load_config <config_path>                            # 標準出力: normalized JSON
fetch_remote_state <zone_id> <token>                 # 標準出力: 現状 JSON
compute_diff <expected_json> <actual_json>           # 標準出力: 差分 JSON / exit 0=差分なし, 3=差分あり
apply_managed_ruleset <zone_id> <token> <mode>       # 標準出力: API レスポンス
apply_custom_rules <zone_id> <token> <rules_json>    # 標準出力: API レスポンス
apply_rate_limit_rules <zone_id> <token> <rules_json> # 標準出力: API レスポンス
print_dry_run <diff_json>                            # 標準出力: 人間可読 + 機械可読 JSON
```

> bash function は副作用を `printf` のみに集約し、`set -euo pipefail` 前提でテストする。Cloudflare API 呼び出しは `curl --fail-with-body --silent --show-error` で統一し、HTTP code を `-w "%{http_code}"` で取得する。
> Rate Limiting rule の生成では `http_ratelimit` phase と `ratelimit` object を必須にする。Workers binding 候補は現行 `[[ratelimits]]` 形式のみ許容する。

### F-07 `apps/api/src/middleware/edge-rate-limit-headers.ts`（TS signature）

```ts
export type RateLimitedReason = "edge" | "app";

export interface RateLimitedResponseInput {
  readonly retryAfterSec: number;     // 整数秒（>= 1）
  readonly reason: RateLimitedReason;
  readonly nowMs?: number;             // テスト容易性のため任意注入。既定 Date.now()
}

export interface RateLimitedResponseHeaders {
  readonly "retry-after": string;             // ASCII 整数秒
  readonly "content-type": "application/json; charset=utf-8";
  readonly "cache-control": "no-store";
  readonly "x-ratelimit-source": RateLimitedReason;
}

export interface RateLimitedResponse {
  readonly status: 429;
  readonly headers: RateLimitedResponseHeaders;
  readonly body: {
    readonly error: "rate_limited";
    readonly retryAfterSec: number;
    readonly reason: RateLimitedReason;
  };
}

export function buildRateLimitedResponse(
  input: RateLimitedResponseInput,
): RateLimitedResponse;

// Hono Response への変換 helper
export function toHonoResponse(
  res: RateLimitedResponse,
): Response;
```

### F-09 / F-10 既存 middleware への当て込み（差分方針）

```ts
// before（rate-limit-magic-link.ts 概略・既存）
return c.json({ error: "rate_limited" }, 429, {
  "retry-after": String(retryAfterSec),
});

// after（互換維持・helper 経由）
const r = buildRateLimitedResponse({ retryAfterSec, reason: "app" });
return toHonoResponse(r);
```

> signature 不変・public API 不変・テスト互換維持（F-11 で期待値だけ helper 由来に揃える）。

## 3. 入出力・副作用

| ファイル | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| F-01 | CLI args, env (op run 経由), config.json | exit code, stdout JSON | Cloudflare API への PUT（実 apply 時のみ）|
| F-02 | — | — | （静的設定）|
| F-03 | F-01 から呼ばれる | function 戻り値・stdout | curl 経由の Cloudflare API call のみ |
| F-04 | spawn 結果 | vitest assertion | なし（DRY_RUN=1 を渡し API 呼ばない）|
| F-07 | RateLimitedResponseInput | RateLimitedResponse / Response | なし（pure function）|
| F-09/10 | 既存 ctx | 既存 c.json | 既存と同じ |

## 4. エラーハンドリング戦略

| エラー種別 | 検出箇所 | 戦略 | exit code / HTTP |
| --- | --- | --- | --- |
| `op` 未インストール | F-01 preflight | エラー文言を stderr へ・abort | exit 1 |
| `CLOUDFLARE_API_TOKEN` 未注入 | F-01 preflight | 同上（token 値はログに出さない・存在チェックのみ）| exit 1 |
| config.json schema 不正 | F-01 preflight | jq schema 検証で `key not found` を stderr 出力 | exit 1 |
| Cloudflare API 4xx/5xx | F-03 各 apply | レスポンス body を stderr に出力（token 値は含まない）| exit 2 |
| dry-run 差分あり | F-03 compute_diff | diff JSON を stdout、CI gate 用に exit 14 | exit 14 |
| token 権限不足（`Zone.WAF` / `Zone.RateLimit` 欠如）| F-03 verify | API レスポンスの `code: 10000` を判定し、解決手順 URL を stderr | exit 2 |
| F-07 入力バリデーション | `retryAfterSec < 1` または非整数 | throw `TypeError` | （middleware で 500 を返さないよう呼び出し側で事前検証）|
| F-09/F-10 既存ロジックエラー | 既存通り（変更しない）| 既存通り | 既存通り |

> secret 値は **stderr / stdout / file 全てに出さない**。`op run` 経由で env に注入された値は、CLI が完了したら process 終了で揮発する（CLAUDE.md ルール遵守）。

## 5. 依存関係・1Password / Secret 管理

| 種別 | 名称 | 1Password 参照 | 注入経路 |
| --- | --- | --- | --- |
| 必須 secret | `CLOUDFLARE_API_TOKEN` | `op://Cloudflare/API Token/credential`（既存項目を再利用。スコープに `Zone.WAF` / `Zone.RateLimit` / `Zone.Read` を含む token を別 item にしてもよい）| `.env` の `op://...` 参照を `op run --env-file=.env` で解決 |
| 必須 var | `CLOUDFLARE_ACCOUNT_ID` | `op://Cloudflare/Account/account_id` または GitHub Variables | 同上 |
| 任意 var | `CLOUDFLARE_ZONE_ID_API` / `CLOUDFLARE_ZONE_ID_WEB` | `op://Cloudflare/Zone/zone_id_*` | 同上。または config.json に直書き（zone_id は機密ではない） |

> CLAUDE.md「ローカル `.env` の運用ルール」: 実値は 1Password 側に保管。`.env` には `op://...` 参照のみを書く。token 値は `Read` ツール / `cat` / `grep` 等で表示しない（AI 学習混入防止）。

## 6. Workers Rate Limiting binding 採否（MINOR-02 解決方針）

| 観点 | 採用する場合 | 採用しない場合 |
| --- | --- | --- |
| 効果 | Workers 内 burst を Workers 単体で抑制（zone-level Rate Limiting Rules と独立） | zone-level Rate Limiting Rules のみ |
| 配置 | `apps/api/wrangler.toml` の `[[ratelimits]]` に `name = "RL_AUTH"`, `namespace_id = "<<n>>"` 等を 1 件 | 変更なし |
| 二重カウント | edge / binding / app-layer の三重になりうる | edge / app-layer の二重（既設計通り） |
| 推奨 | **採用しない**（無料枠での再現性・運用簡素化を優先）| — |

> Phase 5 step 2 で MINOR-02 を「採用しない」で確定し、`apps/api/wrangler.toml` は本 task では編集しない（F-06 は no-op）。理由は Phase 9 の MINOR 解決確認で記録する。

## 7. CONST_005 必須項目チェック

| 項目 | 記載箇所 |
| --- | --- |
| 変更対象ファイル | §1 |
| 関数・型シグネチャ | §2 |
| 入出力 | §3 |
| 副作用 | §3 |
| エラーハンドリング | §4 |
| secret / 依存 | §5 |
| テスト連携 | Phase 6 で詳細・本 Phase は §1 F-04/F-08/F-11 で言及 |
| 実行コマンド | Phase 5 で集約・本 Phase は §2 usage で先出し |
| DoD（完了条件）| §「完了条件」 |

## 8. 上流ブロッカー（gate 重複明記）

| ブロッカー | NO-GO |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` の `Zone.WAF` / `Zone.RateLimit` / `Zone.Read` 権限不足 | F-01 preflight が exit 1。Phase 5 着手不可 |
| Cloudflare zone 未確定 | F-02 config.json の `zones[].id` を埋められず Phase 5 着手不可 |
| `wrangler` 直叩きコードの混入 | レビューで MAJOR・Phase 2 へ戻る |

## 9. 参照資料

| 資料 | パス |
| --- | --- |
| `index.md` | 受け入れ基準 AC-1〜AC-10 |
| `phase-02.md` | Concern A/B/C のマトリクス（F-02 config.json の根拠）|
| `phase-03.md` | 実装方式選択・MINOR-01/02 |
| `scripts/cf.sh` | op run 慣習・esbuild 解決の前例 |
| 既存 helper 候補 | `apps/api/src/middleware/rate-limit-magic-link.ts`（差し替え対象）|

## 10. 成果物

| 成果物 | パス |
| --- | --- |
| 実装計画書（本ファイル） | `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/phase-04.md` |
| 変更対象ファイル一覧 | §1 |
| 関数・型シグネチャ | §2 |
| エラーハンドリング戦略 | §4 |

## 11. 統合テスト連携【必須】

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ユニットテスト Line | 80%+ | TBD（Phase 6）|
| ユニットテスト Branch | 80%+ | TBD |
| ユニットテスト Function | 80%+ | TBD |
| 結合テスト API | 100% | TBD |
| 結合テスト正常系 | 100% | TBD |
| 結合テスト異常系 | 80%+ | TBD（429 retry-after / dry-run 差分検出）|

## 12. 完了条件（DoD）

- [ ] §1 で 13 ファイルの変更方針（新規/編集/任意）が確定している
- [ ] §2 で `cf-waf-apply.sh` usage / lib.sh function / `edge-rate-limit-headers.ts` TS signature がすべて記述されている
- [ ] §3 で各ファイルの入出力・副作用が表形式で示されている
- [ ] §4 でエラー種別ごとの exit code / HTTP / stderr 戦略が示されている
- [ ] §5 で `CLOUDFLARE_API_TOKEN` の `op://` 参照と CLAUDE.md secret ルールが整合している
- [ ] §6 で MINOR-02（Workers `[[ratelimits]]` binding）採否が記述されている
- [ ] §7 CONST_005 必須項目が全て埋まっている
- [ ] §8 上流ブロッカー / NO-GO が再掲されている
- [ ] coverage 既定閾値（80/80/80/80）が Phase 6 で `bash scripts/coverage-guard.sh` exit 0 となる方針が示されている

## 13. 次の Phase

Phase 5: 実装手順 / Deployment checkpoint（git step 単位の手順 / staging→production の simulate→enforce フロー / rollback 手順）

## 実行タスク

1. Cloudflare API wrapper、config、helper、tests、runbook の詳細設計を固定する。
2. `http_ratelimit` / `ratelimit` object と `[[ratelimits]]` no-op 境界を固定する。

## 参照資料

| 資料 | 用途 |
| --- | --- |
| `phase-02.md` | Rules matrix |
| `phase-03.md` | 実装方式 |
| Cloudflare Rulesets API docs | payload shape |

## 成果物

| 成果物 | パス |
| --- | --- |
| Phase 4 詳細設計 | `phase-04.md` |

## 完了条件

- [ ] ファイル単位の差分方針、関数シグネチャ、error handling、secret 境界が記述されている。

## 統合テスト連携

Phase 6 の unit / dry-run snapshot / coverage gate へ接続する。
