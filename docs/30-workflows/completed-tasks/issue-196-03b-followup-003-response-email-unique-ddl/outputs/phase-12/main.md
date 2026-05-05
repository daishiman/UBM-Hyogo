# Phase 12: ドキュメント更新

Status: `implemented-local-static-evidence-pass`

実装コード変更（DDL コメント + spec doc）は本サイクルで完了し、Phase 11 の typecheck / lint / SQL semantic diff evidence も取得済みである。残るのは Phase 13（PR 作成）のみで、これは CONST_002 によりユーザー明示承認後に実施する。

## 03b 検出表 #4 の正本訂正

03b workflow Phase 12 `unassigned-task-detection.md` の表記「`member_responses.response_email` UNIQUE 制約の DDL 上の明文化」は spec drift 由来の誤記である。履歴ファイルは改ざんしない。

正本: `response_email` の UNIQUE は `member_identities.response_email TEXT NOT NULL UNIQUE`（`apps/api/migrations/0001_init.sql:92` 付近）に存在し、`member_responses.response_email` 側には存在しない。`member_responses` は履歴行のため、同一 email の複数 response を許容する。

本サイクルで上記境界を 3 箇所に明文化した:

1. `.claude/skills/aiworkflow-requirements/references/database-schema.md` 行 50-51（`member_responses` / `member_identities` の責務記述）
2. `apps/api/migrations/0001_init.sql` 行 51-53（`member_responses.response_email` 直前コメント）/ 行 90-92（`member_identities.response_email` 直前コメント）
3. `apps/api/migrations/0005_response_sync.sql` 行 7（既存「再宣言なし」表現を「正本 UNIQUE が宣言済み（再宣言・再付与なし）」に統一）

## 状態境界

- **コード変更**: 完了（worktree に反映済み・未コミット）
- **静的検証**: 完了（typecheck / lint PASS、SQL semantic diff 0 行）
- **runtime D1 確認**: production 接続を伴うため Phase 13 と併せてユーザー承認後
- **PR 作成（Phase 13）**: blocked_until_user_approval

CREATE TABLE / ALTER TABLE / index 定義に SQL レベルの差分はない。wrangler の migration hash 仕様上、コメントのみの編集で drift は発生しない想定だが、production 接続時に最終確認する。

## Strict 7 Files

`outputs/phase-12/` の 7 副成果物（implementation-guide / documentation-changelog / system-spec-update-summary / skill-feedback-report / phase12-task-spec-compliance-check / unassigned-task-detection / elegant-review-30-methods）は実体配置済み。Phase 1-13 の `outputs/phase-XX/main.md` も実体配置済みで、Phase 11 の evidence は実測値で更新済み（PASS）。
