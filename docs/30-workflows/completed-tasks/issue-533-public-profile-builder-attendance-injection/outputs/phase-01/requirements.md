# Phase 1 Requirements

## Task Type Decision

- taskType: implementation
- visualEvidence: NON_VISUAL
- issue_state: CLOSED
- implementation_status: pending

`PublicMemberProfile` に attendance を追加するには shared type / zod / API route / repository builder / tests の変更が必要なため、docs-only ではない。

## Requirements

| ID | Requirement |
| --- | --- |
| R-1 | `/public/members/:memberId` は公開適格 member のみ `attendance` を返す |
| R-2 | attendance は `sessionId`, `title`, `heldOn` に限定する |
| R-3 | provider 解決は `attendanceProviderMiddleware` + `RepositoryProviderVariables` を使う |
| R-4 | public route は認証不要のまま維持する |
| R-5 | privacy 禁止項目を public response に混入させない |

## Current Code Anchors

| Anchor | Path |
| --- | --- |
| public builder | `apps/api/src/repository/_shared/builder.ts` |
| public route | `apps/api/src/routes/public/member-profile.ts` |
| public use-case | `apps/api/src/use-cases/public/get-public-member-profile.ts` |
| shared response type | `packages/shared/src/types/viewmodel/index.ts` |
| shared zod schema | `packages/shared/src/zod/viewmodel.ts` |
