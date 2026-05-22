# Adoption Tracker — Issue #749 (post-implementation)

更新日: 2026-05-17
状態: `implemented_local_evidence_captured`
検証コマンド: `bash scripts/verify-primitive-adoption.sh`（exit 0 を Phase 11 evidence で確認）

このファイルは Phase 8 の出力正本。Phase 4-7 実装後の実測値を固定する。

凡例: `O` = 採用済 / `-` = 該当 UI 要素なし / `X` = 残置（禁止）

| # | route | FormField | EmptyState | Pagination | Icon | Breadcrumb | useAdminMutation |
| --- | --- | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | `/` | - | - | - | O | - | - |
| 2 | `/(public)/members` | - | O | O | O | - | - |
| 3 | `/(public)/members/[id]` | - | - | - | O | - | - |
| 4 | `/(public)/register` | O | - | - | O | - | - |
| 5 | `/privacy` | - | - | - | - | - | - |
| 6 | `/terms` | - | - | - | - | - | - |
| 7 | `/login` | O | - | - | O | - | - |
| 8 | `/profile` | O | - | - | O | - | - |
| 9 | `/(admin)/admin` | - | - | - | O | O | - |
| 10 | `/(admin)/admin/members` | O | O | O | O | O | O |
| 11 | `/(admin)/admin/tags` | O | O | - | O | O | O |
| 12 | `/(admin)/admin/meetings` | O | O | O | O | O | O |
| 13 | `/(admin)/admin/schema` | O | O | - | O | O | O |
| 14 | `/(admin)/admin/requests` | - | O | - | O | O | O |
| 15 | `/(admin)/admin/identity-conflicts` | - | O | - | O | O | O |
| 16 | `/(admin)/admin/audit` | O | O | O | O | O | O |
| 17 | `error.tsx` | - | - | - | O | - | - |
| 18 | `not-found.tsx` | - | O | - | O | - | - |
| 19 | `loading.tsx` | - | - | - | O | - | - |

DoD: 全セル `O` または `-`、`X` 0 件 ✅

## 検証サマリ（Phase 11）

| Gate | 結果 |
| --- | --- |
| `bash scripts/verify-primitive-adoption.sh` | PASS (exit 0) |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `grep -rn '<input' apps/web/src/components/admin/ ...` | 0 件 |
| mutating admin panels `.trigger(` + features hook | 4/4 |
| admin pages render `<Breadcrumb>` or `<AdminPageHeader>` | 8/8 |
| EmptyState required surfaces | 7/7 |
| Pagination required surfaces | 3/3 |

## 妥協点（trade-offs）

`MeetingPanel` / `TagQueuePanel` / `SchemaDiffPanel` / `RequestQueuePanel` は、既存 `lib/admin/api` wrapper（`createMeeting` 等）を `useAdminMutation` の `mutationFn` として渡し、`trigger()` から実行する。これにより既存 API wrapper と status-specific toast / refresh 挙動を維持しながら、mutation 実行 entrypoint を共有 hook に集約した。`AuditLogPanel` は read-only surface のため C2 対象外とし、EmptyState / Pagination のみを adoption gate で検査する。

このアプローチは「primitive を確実に共有 entrypoint に集約する」という Issue #749 の本質目標を満たしつつ、import-only / `void` placeholder を禁止する。追加の未タスク化は不要。
