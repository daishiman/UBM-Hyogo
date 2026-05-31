# 2026-05-30 issue-988-identity-conflicts-merge-optimistic-update

`issue-988-identity-conflicts-merge-optimistic-update` を `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` として同期。

- `apps/web/src/components/admin/IdentityConflictRow.tsx` に component-local `optimisticMerged` boolean を追加し、merge 二段階 confirm 後に `if (optimisticMerged) return null` で該当 row を即非表示。`trigger(...).catch` で `setOptimisticMerged(false)` rollback（modal 非閉鎖・reason 保持）。
- `errorMessage(error)` pure helper を追加。`FetchAuthedError.bodyText` を JSON.parse し `message ?? error ?? error.message` を抽出（parse 失敗時 bodyText fallback）して rollback inline alert に API body の文言を surface。
- focused Vitest 1 file / 10 tests PASS（server 応答前 hide / success 後も hide 維持 / 409 rollback の 3 ケース追加）、Playwright desktop 8 tests PASS（`exact: true` で conflict id substring 一致回避、env-gated `PLAYWRIGHT_ISSUE988_SCREENSHOT_DIR` screenshot capture）。
- API endpoint / D1 schema / page.tsx / `useAdminMutation` hook / dismiss は不変。
- workflow を `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/` へ移動。発見元 unassigned spec（`admin-identity-conflicts-followup-002-merge-confirm-optimistic-update`）を consumed trace に更新。
- lessons-learned 新規 `lessons-learned-issue-988-optimistic-merged-2026-05.md`（L-I988-001..006）、artifact inventory に `## Lessons Learned` 節、quick-reference / resource-map / task-workflow-active / LOGS を同一 wave で反映。
- task-specification-creator `patterns-lessons-and-pitfalls.md` に「optimistic row mutation + rollback + API error body surfacing パターン」節（L-OPTMUT-001..006）を汎化追記。

User-gated: commit、push、PR、Issue #988 close。
