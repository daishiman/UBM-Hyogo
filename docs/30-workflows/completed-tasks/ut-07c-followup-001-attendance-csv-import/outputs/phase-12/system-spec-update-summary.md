# System Spec Update Summary

## 影響を受ける正本仕様

| 文書 | 影響 | 反映内容 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | admin endpoint 一覧に追記 | `POST /admin/meetings/:sessionId/attendance/import` を attendance 系 endpoint テーブルへ追加（既存 3 endpoint と並列） |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | aiworkflow API 正本に追記 | import endpoint、dryRun 安全側 semantics、`attendance.import.add` audit を同期 |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | admin manual に追記 | `/admin/meetings` API 正本と Audit action に CSV import を追加 |

## 変更詳細（specs/01-api-schema.md）

attendance 関連 endpoint テーブルに 1 行追加:

| Method | Path | Status | 説明 |
| --- | --- | --- | --- |
| POST | `/admin/meetings/:sessionId/attendance/import?dryRun=true|false` | 200/400/401/403/404/413 | CSV 由来 attendance bulk import (dry-run / commit)。500 行上限、成功行ごと audit_log 1 record |

## 変更詳細（aiworkflow / admin manual）

- `dryRun=false` 明示時のみ commit。省略 / typo は dry-run。
- `rows.length > 500` は 413。client でも fetch 前に 501 行以上を reject。
- memberId / email 空 row は 400 ではなく row status `invalid` として preview に残す。
- commit は attendance insert と `audit_log.action='attendance.import.add'` を D1 batch に同時投入する。

## 不変条件への影響

なし。CLAUDE.md「重要な不変条件」5（D1 直接アクセス禁止）/ 8（spec ファイル命名）は本タスクで変更なし。

## D1 schema 影響

なし。既存 `member_attendance` / `member_identities` / `member_status` / `meeting_sessions` / `audit_log` を read-only または既存 insert path で使用。

## 関連仕様（変更なし）

- `08-free-database.md`: schema 変更なし
- `13-mvp-auth.md`: 認証経路は既存 middleware (`requireAdmin`) を再利用
- 親 spec UT-07C: 単一 add/remove の挙動は無変更
