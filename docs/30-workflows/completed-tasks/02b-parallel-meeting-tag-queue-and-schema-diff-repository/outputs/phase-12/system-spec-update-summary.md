# 12: system-spec-update-summary

## 仕様面の追加・確定事項
- `apps/api/src/repository/` 配下に 7 repository + `_shared/` を新規追加
- `tagDefinitions.ts` に write API を提供しないことを実装で固定（不変条件 #13）
- `tagQueue.ALLOWED_TRANSITIONS` を export し、後続 07a が再利用可能に
- `attendance.AddAttendanceResult` の reason 列挙を確定 (`duplicate` / `deleted_member` / `session_not_found`)

## 既存仕様への変更
あり。DDL 自体は 08-free-database.md / 11-admin-management.md / 12-search-tags.md の構造をそのまま採用するが、後続タスクが呼ぶ repository 契約は正本仕様へ追記した。

| 仕様書 | 更新内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | `apps/api/src/repository/` の 7 repository、状態遷移、attendance failure reason、schema diff queue の read default を追記 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-completed.md` | 02b close-out 記録を追加 |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | 同波 sync の実施ログを追加 |
| `.claude/skills/task-specification-creator/LOGS.md` | Phase 11 NON_VISUAL / Phase 12 guide 補正の知見を追加 |

## 後続タスクへの影響
- 03a sync 経路は `schemaVersions.upsertManifest` + `supersede` の 2 段階前提
- 07b は `updateStableKey → resolve` の順序（逆順は不整合）

## Phase 11 / Screenshot 判定
- UI 変更なし。スクリーンショットは不要。
- `phase-11.md` の旧 `tagQueue UI` 記述を NON_VISUAL 証跡へ補正済み。
