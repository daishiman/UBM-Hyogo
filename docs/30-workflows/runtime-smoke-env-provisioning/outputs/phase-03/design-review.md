# Phase 3: 設計レビュー

## レビュー観点と判定

| # | 観点 | 判定 | コメント |
|---|------|------|---------|
| R-1 | service-token endpoint の HMAC scheme が timing attack に耐性を持つか | PASS | `verifyHmacSignature` は timing-safe 比較必須を明記。実装時は `crypto.subtle.verify` を直接利用 |
| R-2 | nonce リプレイ防止が確実か | PASS | KV による 600 秒 TTL 記録 + 409 で再利用拒否。`ts ±300秒` と組み合わせで 5 分以上前のリプレイも遮断 |
| R-3 | JWT 署名鍵が Auth.js と分離されているか | PASS | `JWT_SIGNING_KEY` を Auth.js 用秘密鍵と別 Cloudflare Secret で管理 |
| R-4 | rate limit が DoS 耐性を持つか | PASS | `kid` あたり 10 req/h は CI smoke 用途として十分。`kid` が漏洩した場合の影響範囲も限定的 |
| R-5 | 監査ログに secret が混入しないか | PASS | metadata に `role` / `jti` / `exp` のみ記録。secret 値 / JWT 本体は記録しない明記あり |
| R-6 | smoke runner の production read-only ガードが確実か | PASS | `SMOKE_READONLY=1` を production で強制、許可リスト 5 件は GET のみ。write 系は早期 skip |
| R-7 | production workflow が staging 版と対称構造か | PASS | trigger / environment / steps が表で対比可能、差分が schedule と SMOKE_READONLY のみに局所化 |
| R-8 | allowlist 拡張行が既存 verify-env-secrets.sh の挙動と整合するか | PASS | スクリプト本体は変更不要、宣言行追加のみで対応 |
| R-9 | provision script の rename が caller 全件を網羅するか | CONDITIONAL | Phase 5 で旧パス参照を grep して全件列挙する手順を明記済み |
| R-10 | service-token endpoint と admin UI 経路の責務分離 | PASS | service-token は CI 専用、admin UI 発行は scope out として明示（FB-CRONVL-002 準拠） |
| R-11 | D1 binding が `apps/api` に閉じているか | PASS | service-token endpoint も `apps/api` 配下に追加、`apps/web` 経由なし |
| R-12 | 命名一貫性（`safeOn` / `safeInvoke` 系の現存命名は本タスクスコープ外） | N/A | 本タスクは Electron Preload を含まないため対象外 |
| R-13 | bearer 値・API token 値の文書混入リスク | PASS | AC-10 で `grep` チェック、runbook テンプレでも `op://...` 参照のみ記述方針 |

## 採用判定

**ALL PASS / Phase 4 へ進行可**

## 残課題（MINOR）

| # | 内容 | 対応先 |
|---|------|--------|
| MINOR-1 | KV namespace を新規作成するか既存流用かの最終決定 | Phase 5 実装計画で確定 |
| MINOR-2 | `kid` の事前登録方法（env var / config file / DB） | Phase 5 で `SERVICE_TOKEN_REGISTERED_KIDS` 環境変数（カンマ区切り）として確定予定 |
| MINOR-3 | 90日 JWT のローテーション手順（user-gated） | `runbooks/service-token-issuance.md` に記載 |

## 完了条件

- 全レビュー観点に判定が付いている
- MINOR を残課題として記録し、対応先 Phase / runbook が明示されている

## 成果物

- `outputs/phase-03/design-review.md`（本ファイル）

## 次 Phase 入力

- Phase 4: service-token endpoint / allowlist / smoke runner のテスト計画
