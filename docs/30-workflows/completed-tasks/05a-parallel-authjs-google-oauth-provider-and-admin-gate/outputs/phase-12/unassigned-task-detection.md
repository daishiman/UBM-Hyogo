# Unassigned Task Detection — 05a

本タスクで触れない / スコープ外の責務を洗い出し、引継ぎ先を明示する。

| # | 未割当責務 | 想定 task | 暫定対応 | 関連 ID |
| --- | --- | --- | --- | --- |
| 1 | Google OAuth verification 申請（unverified app screen の解消） | `docs/30-workflows/unassigned-task/05a-followup-002-google-oauth-verification.md` | MVP は testing user で運用、prod release 前に申請 | **B-03** |
| 2 | admin 剥奪の即時反映（D1 lookup を毎リクエスト or session 失効通知） | `docs/30-workflows/unassigned-task/05a-followup-003-admin-revoke-immediate-effect.md` | MVP は次回ログインで反映、必要時に検討 | **B-01** |
| 3 | session refresh / silent renewal | 別タスク（拡張） | MVP は 24h 期限で十分、refresh 機構は不要 | — |
| 4 | OAuth audit log（gate 拒否 / 成功ログイン） | 07c (audit-log workflow) | 07c の audit-log workflow に gate 拒否を渡す hook を追加 | — |
| 5 | `INTERNAL_AUTH_SECRET` ローテーション運用 | infra 04 (secrets sync) | secrets ローテーション運用は infra 側で定期実行 | — |
| 6 | Magic Link 補助導線（メールでログイン） | **05b（並列タスク）** | 並列で進行、本タスク完了と独立。共有 contract は確定済 | — |
| 7 | Phase 11 実環境 smoke 上書き（screenshot / curl / session JSON） | `docs/30-workflows/unassigned-task/05a-followup-001-staging-oauth-smoke-evidence.md` | `outputs/phase-11/smoke-checklist.md` を実環境で再実行 | R-1, R-2 |
| 8 | `/admin/dashboard` / `/profile` 実 UI 実装 | 06b / 06c | 本タスクは middleware gate のみ。UI は下流タスク | — |
| 9 | contract test 実装 | 08a | api-contract.md を参照して契約 test 化 | — |

## 既知制約（B-01 / B-03）の扱い

- **B-01 (admin 剥奪は次回ログインで反映)**: implementation-guide / changelog に明記済。MVP 範囲では許容。Phase 10 GO 判定でも条件付き GO として承認済
- **B-03 (Google OAuth verification 未取得)**: prod release blocker として運用タスクに引継ぎ。MVP は testing user リストで運用

## 正式作成した未タスク

- `docs/30-workflows/unassigned-task/05a-followup-001-staging-oauth-smoke-evidence.md`
- `docs/30-workflows/unassigned-task/05a-followup-002-google-oauth-verification.md`
- `docs/30-workflows/unassigned-task/05a-followup-003-admin-revoke-immediate-effect.md`

session refresh、OAuth audit log、Magic Link、UI 実装、contract test は既存の下流 workflow（05b / 06b / 06c / 07c / 08a）で所有されるため、本 Phase 12 では新規未タスク化しない。

## 重複検証

本タスクで重複している責務は無い。05b との重複は `GET /auth/session-resolve` の **共有実装**（重複ではなく分担）で解消済。
