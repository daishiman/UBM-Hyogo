# Output Phase 3: 設計レビュー

## 3 系統レビュー結果

### A. システム系 — 全 OK

- 命名責務一致 / 実装と仕様の同名性 / Variable・Secret 区分の正しさ / API 契約 (200, 502 `MAIL_FAILED`) 保全 / `AuthRouteEnv` 整合 / `defaultBuildMagicLinkUrl` fallback の妥当性。

### B. 戦略・価値系 — 全 OK

- provider 中立化（Resend 以外への耐性）/ solo dev 適合 / Cloudflare free-tier (#14) / 1Password 正本運用 / Auth.js v5 `AUTH_URL` 互換。

### C. 問題解決系

真の論点 = 「provider 固有名 (`RESEND_*`) を契約面に出すか / 抽象名 (`MAIL_*`) を出すか」。抽象名を採用することで provider 切替時の Cloudflare Secrets 名 rename を回避。alias 追加は廃語経路の保守コストと secret 二重投入リスクが利益を上回るため不採用。

優先順位:
1. spec docs 片寄せ（Phase 12）
2. Phase 5 runbook の `secret put` 手順明記
3. Phase 11 staging smoke AC 更新
4. aiworkflow refs cross-reference（任意）

## 4 条件評価

| 条件 | 結果 |
| --- | --- |
| 矛盾なし | PASS — spec 更新方向 / aiworkflow 現状 / 実装挙動 (502 `MAIL_FAILED`) が一致 |
| 漏れなし | PASS — 旧名 3 つ全てに新正本名割当 / 4 環境 × 設定状態マトリクス完備 / runbook + smoke + docs の 3 経路被覆 |
| 整合性 | PASS — Variable / Secret 区分が `wrangler.toml [vars]` 運用と整合 / 1Password vault path が UT-25 / UT-27 と命名規則整合 |
| 依存関係整合 | PASS — 上流 05b は実装据え置きで blocking 解消 / 下流 05b-B / 09a / 09c の前提が確定 |

## 不変条件チェック

| # | 確認 | 判定 |
| --- | --- | --- |
| #16 | env 名・op:// 参照のみ。実値・hash・JSON 抜粋・Resend body を残さない | OK |
| #15 | `AUTH_SECRET` は 05a 共有のまま据え置き。Magic Link send 経路のみ更新 | OK |
| #14 | 新規 Secret / Variable / KV / D1 / cron 追加なし。Resend 1 経路維持 | OK |

## 上流 / 下流ブロック解消条件

### 上流

| タスク | 解消条件 |
| --- | --- |
| 05b Magic Link provider 本体 | 実装 env 命名再変更を要求しないため blocking 解消 |
| `10-notification-auth.md` / `08-free-database.md` | Phase 12 で 3 行置換 + Variable / Secret 種別追記 |
| aiworkflow refs | 既に正本表記。cross-reference を Phase 12 で追加 |

### 下流

| タスク | 解消条件 |
| --- | --- |
| 05b-B-magic-link-callback-credentials-provider | `AUTH_URL` / `MAIL_FROM_ADDRESS` 正本確定により callback URL 組み立て前提が固まる |
| 09a-A-staging-deploy-smoke-execution | smoke AC を `secret list` name 確認 + 200 + 受信トレイ到達に明文化 |
| 09c-A-production-deploy-execution | 未設定時 502 `MAIL_FAILED` 仕様化により deploy readiness で name 不在を検出可 |

## レビュー結果サマリ

| 項目 | 結果 |
| --- | --- |
| 採用 env 名 | `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL` |
| alias | 不採用 |
| fail-closed | request 単位 502 `MAIL_FAILED`（boot fail 不採用） |
| 不変条件 #14 / #15 / #16 | 全 PASS |
| 4 条件評価 | 全 PASS |
| ブロック解消 | 上流 4 / 下流 3 すべて条件確定 |

## 次 Phase への引き渡し

- レビュー PASS 済の env 契約と fail-closed 仕様
- staging smoke AC（name 確認 + 200 + 受信）
- production fail-closed テスト観点（502 `MAIL_FAILED`）
- secret 実値非記録のテスト記録ルール
