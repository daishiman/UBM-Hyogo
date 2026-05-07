# Phase 2: 設計 — issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 2 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 の AC-P1〜AC-P6 を満たす route 拡張・wrangler binding・secret 配置・Slack 識別戦略・Sentry environment tag・approval gate G1〜G4 を最小責務で設計する。

## 入力

- Phase 1 確定 AC / gate / evidence path / 自走禁止操作 / 用語
- 既存 route 実装（`apps/api/src/routes/admin/smoke-observability.ts`）
- 既存 test（`apps/api/src/routes/admin/smoke-observability.test.ts`）
- `apps/api/wrangler.toml`

## 出力（`outputs/phase-02/main.md` に確定）

1. route 拡張案 A / B 比較と確定（既定: 案 A）
2. 関数・型シグネチャ
3. 入出力・副作用・エラーハンドリング
4. wrangler.toml binding 表（staging / production）
5. 1Password item 構造（production 用 item の追加）
6. Slack channel / prefix 戦略（既定: prefix 識別 + channel 任意分離）
7. Sentry environment tag 戦略
8. approval gate G1〜G4 の前提・通過記録 path

## route 拡張案比較

| 案 | 概要 | pros | cons | 採否 |
| --- | --- | --- | --- | --- |
| **A（既定採用）** | 既存 route を拡張し production を 200 経路化。production の場合のみ `x-smoke-production-confirm: YES` を必須化、Slack message prefix を `[PRODUCTION SMOKE]` に固定、Sentry envelope の `environment` を `production` に設定 | 既存 test の構造を維持・コード重複なし・DRY 化容易 | production 分岐ロジックが route に集中する | 採用 |
| B | production 専用の別 route（例: `POST /admin/smoke/observability/production`） | production 経路の hard separation | route 重複・DRY 阻害・evidence path 二重化 | 不採用 |

## 関数・型シグネチャ（差分）

```ts
// apps/api/src/routes/admin/smoke-observability.ts に追加または変更
export interface SmokeObservabilityEnv {
  readonly ENVIRONMENT?: "production" | "staging" | "development";
  readonly SMOKE_ADMIN_TOKEN?: string;
  readonly SENTRY_DSN_API?: string;
  readonly SLACK_WEBHOOK_INCIDENT?: string;
}

// production_confirm header 名は const として export し test と共有
export const PRODUCTION_CONFIRM_HEADER = "x-smoke-production-confirm";
export const PRODUCTION_CONFIRM_VALUE = "YES";

// env-aware Slack prefix 計算（純関数）
export function smokeMessagePrefix(env: string | undefined): string;
// staging => "[STAGING SMOKE]"
// production => "[PRODUCTION SMOKE]"
// その他 => "[<UPPER> SMOKE]"
```

## route の入出力・副作用・エラーハンドリング（拡張差分）

| 状況 | 期待挙動 |
| --- | --- |
| `ENVIRONMENT === "production"` かつ `x-smoke-production-confirm` 欠落 | `403 { ok: false, errorCode: "PRODUCTION_CONFIRM_REQUIRED" }`（404 を返さない。誤発火防止 gate を明示通知） |
| `ENVIRONMENT === "production"` かつ `x-smoke-production-confirm: YES` かつ Bearer 一致 | 既存 staging と同等の処理を実行。Slack message は `[PRODUCTION SMOKE] ...`、Sentry envelope の `environment` は `production` |
| `ENVIRONMENT === "production"` かつ Bearer 不一致 | 既存通り `401 { ok: false, error: "unauthorized" }`（production 識別ヘッダ有無に関わらず認証先行） |
| `ENVIRONMENT === "staging"` / `development` | 既存挙動を維持。`x-smoke-production-confirm` ヘッダは無視（過剰要求しない） |
| response | DSN URL / webhook URL / token / hash / project numeric id を一切含めない（既存方針継続） |

副作用: Sentry / Slack への外部 HTTP 1 回ずつ（target=both）。production の場合 Slack channel は webhook 設定先に依存し、prefix で識別。

## Cloudflare Secret 配置表

| binding 名 | staging | production |
| --- | --- | --- |
| `ENVIRONMENT` | `"staging"` | `"production"` |
| `SMOKE_ADMIN_TOKEN` | Cloudflare Secret（既存） | Cloudflare Secret（G1 承認後に `cf.sh secret put` 投入） |
| `SENTRY_DSN_API` | Cloudflare Secret（既存） | Cloudflare Secret（G1 承認後に投入） |
| `SLACK_WEBHOOK_INCIDENT` | Cloudflare Secret（既存） | Cloudflare Secret（G1 承認後に投入） |

Workers secrets は `wrangler.toml` に実値や binding 宣言を書かない。Phase 5 Step では `apps/api/wrangler.toml` の `[env.production.vars].ENVIRONMENT = "production"` と Worker name を確認し、3 secret は `bash scripts/cf.sh secret list/put --env production` で env 別に存在確認・投入する。実値は書かない。

## 1Password item 構造（production 追加）

| vault | item | field | 用途 |
| --- | --- | --- | --- |
| UBM-Hyogo | `Sentry DSN (API / production)` | `dsn` | production Sentry project DSN |
| UBM-Hyogo | `Slack Webhook (incident / production)` | `url` | production 用 webhook（任意で `#smoke-test` 等の別 channel） |
| UBM-Hyogo | `Smoke Admin Token (production)` | `token` | production 用 smoke 認証 token（staging とは別値） |

参照は `op://UBM-Hyogo/<item>/<field>` 形式。実値は env / log / docs に書かない。

## Slack channel / prefix 戦略

- 既定: production webhook は `[PRODUCTION SMOKE]` prefix で識別。channel は運用判断で `#ubm-incident-prod` または `#smoke-test` を 1Password 投入時に選択
- prefix は `smokeMessagePrefix()` 純関数で算出し、route 内で 1 箇所のみ参照（DRY 化）
- staging webhook を production secret に誤投入する事故を防ぐため、Phase 11 evidence で smoke message の prefix が一致することを必ず検証する

## Sentry environment tag 戦略

- envelope の event payload に `environment: <ENVIRONMENT>` を埋める（既存実装は既に `c.env.ENVIRONMENT ?? "unknown"` を埋め込んでいる）
- production smoke では `environment: "production"` で Sentry dashboard 上の filter 整合を確保
- tags に `smoke: "09b-A-prod-ext"` 等の識別子追加を検討（Phase 5 で確定）

## approval gate G1〜G4

| gate | 発動条件 | 通過記録 path |
| --- | --- | --- |
| G1 | 1Password に production 用 3 item が登録され、Cloudflare production env への `cf.sh secret put` を行う直前 | `outputs/phase-11/production-smoke-log.md` の G1 セクション |
| G2 | staging smoke が AC-1〜AC-5 で PASS している evidence を user が確認した直後（production 着手の前提） | `outputs/phase-11/staging-smoke-log.md` の PASS 確定 + production-smoke-log の G2 引用 |
| G3 | production `POST /admin/smoke/observability` を `x-smoke-production-confirm: YES` 付で叩く直前 | `outputs/phase-11/production-smoke-log.md` の G3 セクション |
| G4 | production evidence の redaction grep / event id / Slack permalink を確定保存する直前 | `outputs/phase-11/production-smoke-log.md` の G4 セクション |

## 制約事項

- 実 DSN / webhook URL / token を設計内に書かない（INV #16）
- secret 投入は `scripts/cf.sh secret put` 経由のみ
- production smoke 実行は G3 通過後のみ。dry-run も自走禁止

## 検証コマンド

```bash
# 設計に実値混入なし
! rg -n 'hooks\.slack\.com/services/[A-Z0-9]|sentry\.io/[0-9]+/[0-9]+|xox[bp]-' docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/outputs/phase-02/

# 必須セクション
grep -q "案 A\|production_confirm\|x-smoke-production-confirm" docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/outputs/phase-02/main.md
grep -q "G1\|G2\|G3\|G4" docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/outputs/phase-02/main.md
grep -q "wrangler.toml\|env.production" docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/outputs/phase-02/main.md
```

## 成果物

- `outputs/phase-02/main.md`

## 完了条件

- [ ] 案 A 採用根拠が記録されている
- [ ] 関数・型シグネチャ（`PRODUCTION_CONFIRM_HEADER` / `smokeMessagePrefix` 等）が定義
- [ ] route 入出力・副作用・エラーハンドリングが状態別に表化
- [ ] wrangler binding 表（staging / production 4 軸）
- [ ] 1Password item 構造（production 3 item）
- [ ] Slack channel / prefix 戦略が確定
- [ ] Sentry environment tag 戦略が確定
- [ ] G1〜G4 の前提・通過記録 path が明示

## 次 Phase への引き渡し

Phase 3 へ: 案 A 採用設計、関数・型、binding 表、1Password item 構造、prefix 戦略、G1〜G4 設計。
