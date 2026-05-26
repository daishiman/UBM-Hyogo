# Unassigned Task Detection

## Summary

新規未タスク: 3 件（close-out review 段階で boundary 外 follow-up として `docs/30-workflows/unassigned-task/` に投入済み）。

今回の直接原因 (`apps/web/src/lib/admin/server-fetch.ts` の runtime env 解決と localhost fallback) は同サイクルでコード修正と focused regression を完了。close-out review で派生改善 3 件を boundary 外 follow-up として正式に未タスク化した。

## Created Followups

| Task ID | Title | Priority | File |
| --- | --- | --- | --- |
| fix-admin-scr-err-stg-followup-001 | `apps/web/src/auth.ts` の env 参照を `getEnv()` 経由に統一 | 中 | `docs/30-workflows/unassigned-task/fix-admin-scr-err-stg-followup-001-auth-env-via-getenv-migration.md` |
| fix-admin-scr-err-stg-followup-002 | admin scope `error.boundary.caught` Sentry / Cloudflare alert policy IaC 化 | 中 | `docs/30-workflows/unassigned-task/fix-admin-scr-err-stg-followup-002-admin-runtime-sentry-alert-policy.md` |
| fix-admin-scr-err-stg-followup-003 | Phase 11 staging runtime smoke の GitHub Actions post-deploy gate 化 | 高 | `docs/30-workflows/completed-tasks/fix-admin-scr-err-stg-followup-003-staging-runtime-smoke-ci-gate.md`（issue-864 として formalize 済み・#864 CLOSED・completed-tasks へ移動済み） |

## Rationale (boundary 判定)

- followup-001 (`auth.ts` env 経路統一): 親タスク DoD は `apps/web/src/lib/admin/` 配下の `process.env` 参照 0 件であり、`auth.ts` は認証境界（`getCloudflareContext().env` + 既存 global test injection + request header injection）を持つ別レイヤ。同一サイクルに含めると認証フロー全体の retest が必要となり 1 cycle / 1 PR を超過するため分離。
- followup-002 (Sentry / Cloudflare alert IaC): 運用改善であり render error の修正条件ではない。CONST_005 の「直接原因解消」スコープ外。
- followup-003 (staging smoke CI gate): 親タスクの Phase 11 evidence は user-gated 手動実行で完了予定。CI gate 化は `playwright-smoke` workflow の post-deploy 拡張を伴うため別 PR / 別タスクで扱う。

## Reviewed Candidates (no-op)

| Candidate | Decision | Reason |
| --- | --- | --- |
| 一般 `apps/web` 全 `process.env` 一括撤去 | not created | CLAUDE.md / task-02 不変条件で既に regression smoke + lint 監視済み。直近 staging 障害との直接因果なし |
| `getCloudflareContext()` ラッパー導入 | not created | `getEnv()` 経由で抽象化済み。重複レイヤを増やす ROI 不足 |

CONST_005 に従い、直接原因は同サイクルで解消し、派生 3 件は boundary 外 follow-up として `docs/30-workflows/unassigned-task/` に明示登録した。
