# Phase 7 — AC matrix 詳細

| AC | 要件 | 検証手段 | コード位置 | テスト | 結果 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 5 repo unit pass | vitest | `apps/api/src/repository/{adminUsers,adminNotes,auditLog,syncJobs,magicTokens}.ts` | `__tests__/{...}.test.ts` 26 件 | pass |
| AC-2 | adminNotes が public/member view model に混ざらない | type check + builder で import せず | `adminNotes.ts` （`PublicMemberProfile` / `MemberProfile` を import しない） | `adminNotes.test.ts` の型不在テスト | pass |
| AC-3 | apps/web → repository を禁止 | boundary lint | `scripts/lint-boundaries.mjs` 禁止 token `apps/api` / `@ubm-hyogo/api` | `apps/web/src/lib/__tests__/boundary.test.ts` の 2nd ケース | pass |
| AC-4 | apps/web → D1Database を禁止 | boundary lint | 禁止 token `D1Database` | 同 1st ケース | pass |
| AC-5 | dep-cruiser 0 violation | `.dependency-cruiser.cjs` 5 rule 案 | `.dependency-cruiser.cjs` | 後続で `pnpm add -D dependency-cruiser` 後に CI 統合 | partial / handoff |
| AC-6 | auditLog append-only | API 不在を型で防ぐ | `auditLog.ts` で UPDATE/DELETE/remove を export しない | `auditLog.test.ts` `// @ts-expect-error` | pass |
| AC-7 | magicTokens single-use | `WHERE used = 0 AND expires_at >= now` の atomic UPDATE + `ConsumeResult` discriminated union | `magicTokens.ts` `consume()` | `magicTokens.test.ts` AC-7 | pass |
| AC-8 | syncJobs status 一方向 | `ALLOWED_TRANSITIONS` + `WHERE status = 'running'` 条件付き UPDATE | `syncJobs.ts` `assertTransition()` | `syncJobs.test.ts` AC-8 | pass |
| AC-9 | in-memory D1 loader 共通利用 | `setupD1()` signature 統一 | `apps/api/src/repository/__tests__/_setup.ts` | `_setup.test.ts` + 5 unit test ファイルで利用 | pass |
| AC-10 | prototype 昇格防止 | dev only コメント + production import path 不在 | `__fixtures__/admin.fixture.ts` 先頭コメント | build 除外固定は 00 foundation / Wave 2 統合へ申し送り | partial / handoff |
| AC-11 | 02a/02b/02c 相互 import 0 | `.dependency-cruiser.cjs` 3 rule 案 + grep 確認 | `.dependency-cruiser.cjs` | 02a/02b 完了後 CI で violation 0 を確認 | partial / handoff |

## 不変条件マッピング

| # | 不変条件 | 検証 |
| --- | --- | --- |
| 5 | apps/web から D1 直接アクセス禁止 | AC-3 / AC-4 で boundary lint がブロック |
| 6 | GAS prototype 昇格防止 | AC-10 dev fixture comment + production import path 不在 |
| 11 | 管理者は他人本文を直接編集できない | adminNotes が `member_responses` を一切触らず（SQL に未出現） |
| 12 | adminNotes が view model に混ざらない | AC-2 type check + repository が view model builder を import しない |
