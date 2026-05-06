# Phase 2: 影響範囲調査・対象ファイル一覧

## 変更対象ファイル

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `apps/api/src/repository/auditLog.ts` | 編集 | `AuditTargetType` union に `"admin_member_note"` を追加 |
| `apps/api/src/routes/admin/requests.ts` | 編集 | resolve INSERT の `target_type` を `'member'` → `'admin_member_note'` に変更（target_id は note_id 維持、after_json に memberId / noteId / noteType / resolution を保持） |
| `apps/api/src/routes/admin/requests.test.ts` | 編集 | 期待値 `targetType: 'member'`（line 160 付近）を `'admin_member_note'` に変更し、target_id が note_id、after_json が memberId を含むことの assertion を追加 |
| `apps/api/src/repository/__tests__/auditLog.test.ts` | 編集 | `targetType: 'admin_member_note'` の append / listFiltered / listByTarget ラウンドトリップケースを追加 |
| `apps/api/src/routes/admin/audit.test.ts` | 編集 | `?targetType=admin_member_note` で新規行のみが返る／既存 `'member'` 行が読み取れる／cursor pagination が壊れないことを検証するケースを追加 |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 編集 | line 180 placeholder `"meeting"` → `"meeting | admin_member_note"` 等、複数 type を例示する文言に最小更新 |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.test.tsx` | 編集（条件付） | placeholder assertion がある場合のみ更新 |
| `packages/shared/src/zod/viewmodel.ts` | 編集（最小） | line 182 `targetType: z.string()` のコメントに canonical enum 列挙を追加（API 側 SSOT を参照する旨明記）。型は後方互換のため広く保つ |
| `docs/00-getting-started-manual/specs/` 配下 audit 章 | 編集（存在時） | `admin_member_note` を taxonomy に追記 |
| `.claude/skills/aiworkflow-requirements/references/` audit taxonomy ドキュメント | 編集（存在時） | enum 一覧同期 |

## 新規作成ファイル

なし（既存ファイルへの追記のみ）

## 影響しない領域（参考）

- `apps/api/src/routes/admin/attendance.ts:90-114`（`targetType: 'meeting'` を使用 — 影響なし）
- `apps/api/src/workflows/schemaAliasAssign.ts:405`（`targetType: 'schema_diff'` — 影響なし）
- `apps/api/src/repository/dashboard.ts`（`row.target_type` を string でそのまま伝播 — 自動対応）

## 完了条件

- 上記表に列挙したファイルすべての current 状態を `git status` で本タスク作業ブランチ上で確認可能
- 影響しない領域に副次変更が混入していないこと
