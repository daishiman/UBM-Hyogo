# Skill Feedback

## 検出した改善点

| skill | 改善提案 | 根拠 |
| --- | --- | --- |
| `task-specification-creator` | Phase 12 で「参照した DB 正本仕様がある場合、物理 schema drift を未タスク化する前に同一 wave で更新可能か判定する」チェックを追加する | 本タスクでは `08-free-database.md` の更新が一度未タスク扱いになり、migration 0007 と正本 DB 仕様に一時差分が出た |
| `aiworkflow-requirements` | `admin_member_notes` request queue の正本導線に `request_status` / `resolved_at` / `resolved_by_admin_id` を含める | `database-admin-repository-boundary.md` と quick-reference に旧「最新行存在 = pending」記述が残っていた |

## 反映状況

- 上記 2 点は本レビュー内で関連 reference / index を更新済み。
- skill 本体テンプレートの構造変更は横展開影響があるため、このレポートに改善提案として残す。
