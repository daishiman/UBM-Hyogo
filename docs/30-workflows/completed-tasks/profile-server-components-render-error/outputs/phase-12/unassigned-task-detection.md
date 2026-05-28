# Unassigned Task Detection

## Summary

新規未タスク: 0 件（同サイクル内で直接原因を解消）。boundary 外 follow-up 候補は以下「Reviewed Candidates」セクションで no-op 判定として明示する。

今回の直接原因（`apps/web/src/lib/fetch/authed.ts` の runtime env 解決違反 + `apps/web/app/(member)/profile/page.tsx` の `/me` SCR ハードクラッシュ）は同サイクルでコード修正と focused regression を完了する設計とする。

## Reviewed Candidates (no-op)

| Candidate | Decision | Reason |
| --- | --- | --- |
| `apps/web/src/lib/fetch/public.ts` の env 経路統一 | not created | 既に `getPublicFetchEnv()` 経由で env.ts に集約済み。今回の `/profile` SCR error の直接原因ではなく、漏れではない。 |
| `apps/web/src/lib/auth.ts` の env 経路一括撤去 | not created | 既存の auth 境界は `getAuthEnv()` 系の fail-closed 契約で別途正本化済み。今回の `/profile` SCR error の直接原因ではなく、漏れではない。 |
| `safeServerFetch` の global migration（他 member routes） | not created | `rg` ベースの影響確認では今回の未捕捉 SCR 直接原因は `/profile` の初回 `/me`。他 routes の仕様変更要求は検出していないため、未タスク化対象ではない。 |
| profile scope の Sentry alert IaC 化 | not created | 監視強化候補であり、今回の修正 DoD では runtime 200 / tail clean / regression spec が正本。必須漏れではない。 |
| 一般 `apps/web` 全 `process.env` 一括撤去 | not created | `authed.ts` の直接違反は解消済み。残存する process env 参照は既存テスト・route handler・Playwright fixture 等の別契約に属し、本タスクの必須漏れではない。 |

CONST_005 に従い、直接原因は同サイクルで解消し、派生候補 5 件は boundary 外として no-op 判定で明示記録した。
