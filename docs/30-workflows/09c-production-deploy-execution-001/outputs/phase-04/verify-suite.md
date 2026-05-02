# Verify Suite 詳細

## Layer 1: Preflight (PF-*)

| suite | 目的 | 検証コマンド | 期待 | 失敗時差し戻し先 |
| --- | --- | --- | --- | --- |
| PF-1 | main 昇格 evidence (AC-2) | `git fetch origin main && git rev-parse origin/main && git log -1 origin/main --format='%H %ci %s'` | 最新 merge commit が deploy 対象と一致 | Phase 5 main fetch から再実行 |
| PF-2 | Cloudflare account identity (AC-3) | `bash scripts/cf.sh whoami` | 想定 production account email/id | Phase 5 中断、`.env` op 参照と 1Password 確認 |
| PF-3 | D1 migrations list (AC-4 前提) | `bash scripts/cf.sh d1 migrations list ubm_hyogo_production --remote --env production --config apps/api/wrangler.toml` | 全 Applied、または未適用差分が明示 | Phase 6 で apply 実行 |
| PF-4 | API secrets 4 種 (AC-5) | `bash scripts/cf.sh secret list --env production --config apps/api/wrangler.toml` | GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY / GOOGLE_FORM_ID / MAIL_PROVIDER_KEY 存在 | Phase 5 中断、infra task で provisioning |
| PF-5 | Web Pages secrets 3 種 (AC-5) | `bash scripts/cf.sh pages secret list --project-name ubm-hyogo-web` | AUTH_SECRET / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET 存在 (legacy alias 一時可) | Phase 5 中断、infra task で provisioning |

## Layer 2: Production Smoke + 認可境界 (SM-*)

| suite | 目的 | 検証コマンド | 期待 | 失敗時差し戻し先 |
| --- | --- | --- | --- | --- |
| SM-1 | 公開ページ 200 (AC-7) | `curl -sI ${PRODUCTION_WEB}/{,events,forms,members}` | 200 / Content-Type text/html | Phase 9 で原因切り分け、必要なら Phase 7 rollback |
| SM-2 | 認証ページ疎通 (AC-7) | `curl -sI ${PRODUCTION_WEB}/login` | 200 | Phase 9 で原因切り分け |
| SM-3 | 不変条件 #4 (本人本文 D1 override 不可) | `/profile` を手動確認、編集 form 不在 | 編集 form なし | rollback or hotfix |
| SM-4 | 不変条件 #11 (admin 編集不可) | `/admin/members/<id>` を手動確認 | 本文編集 form なし | rollback or hotfix |
| SM-5 | 認可境界 (AC-7) | `curl -sI ${PRODUCTION_WEB}/admin` (anon) | 302/401 | Phase 7 rollback |

## Layer 3: 24h Metrics (MT-*)

| suite | 目的 | 検証コマンド | 期待 | 失敗時差し戻し先 |
| --- | --- | --- | --- | --- |
| MT-1 | Workers req 24h (AC-10) | Cloudflare Analytics dashboard | < 5,000 req/day (10k 無料枠の 50%、目標 10%) | Phase 11 incident、cron 頻度低下 |
| MT-2 | D1 reads/writes 24h (AC-10) | Cloudflare D1 metrics | reads/5M, writes/100k がいずれも 10% 以下 | Phase 11 incident、query 最適化 |
| MT-3 | 不変条件 #5 (web bundle に D1 import 無し) | `rg "D1Database" apps/web/.open-next/`, `rg "D1Database" apps/web/.vercel/output/` | 0 件 | Phase 7 で再 build |
| MT-4 | 不変条件 #15 (attendance 重複/削除済み除外) | `bash scripts/cf.sh d1 execute ubm_hyogo_production --remote --env production --config apps/api/wrangler.toml --command "SELECT event_id, member_id, COUNT(*) c FROM attendance WHERE deleted_at IS NULL GROUP BY 1,2 HAVING c > 1;"` | 0 行 | Phase 11 incident、データ整合性調査 |

## AC ↔ suite Matrix

| AC | suite ID | 備考 |
| --- | --- | --- |
| AC-2 | PF-1 | main 昇格 evidence |
| AC-3 | PF-2 | account identity |
| AC-4 | PF-3 + Phase 6 apply 実行結果 | dry-run + apply |
| AC-5 | PF-4 + PF-5 | API 4 + Pages 3 |
| AC-7 | SM-1 + SM-2 + SM-5 | 10 ページ + 認可境界 |
| AC-10 | MT-1 + MT-2 | 24h メトリクス |
| AC-11 | SM-3 + SM-4 + MT-3 + MT-4 | 不変条件 #4/#5/#11/#15 |
| AC-13 | Phase 12 で grep | wrangler 直実行 0 件 |

## 失敗時差し戻し先まとめ

| suite | 失敗内容 | 差し戻し先 |
| --- | --- | --- |
| PF-1 | origin/main 未同期 | Phase 5 main fetch から |
| PF-2 | account 不一致 | Phase 5 中断 |
| PF-3 | Applied 不足 | Phase 6 apply |
| PF-4/PF-5 | secret 欠落 | Phase 5 中断、infra task で provisioning |
| SM-1〜5 | smoke 失敗 | Phase 9 切り分け、必要なら Phase 7 rollback |
| MT-1/MT-2 | 無料枠超過 | Phase 11 incident |
| MT-3 | web bundle に D1 import | Phase 7 再 build |
| MT-4 | attendance 重複 | Phase 11 incident |
| AC-13 grep | `wrangler` 検出 | 該当箇所を `bash scripts/cf.sh` ラッパーに修正 |
