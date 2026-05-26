# System Spec Update Summary — issue-912

## 影響範囲

| spec | 更新有無 | 理由 |
|---|---|---|
| `docs/00-getting-started-manual/specs/01-api-schema.md` | なし | 既存 endpoint surface 利用 |
| `docs/00-getting-started-manual/specs/02-auth.md` | なし | 認証境界に変更なし |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | なし | UI 内部の mutation 経路差し替えのみ |
| `apps/api/src/routes/admin/attendance.ts` | なし | 既存 DELETE endpoint を活用 |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | なし | issue-842 で整備済みの opt-in 経路を利用 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | あり | workflow / evidence / artifact inventory 登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | あり | Issue #912 quick reference 追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | あり | active workflow 状態同期 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-912-idempotent-attendance-remove-retry-artifact-inventory.md` | あり | artifact inventory 追加 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-912-idempotent-attendance-remove-retry-2026-05.md` | あり | L-I912-001..005 追加 |
| `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` | あり | 同 cycle 実コード反映 / caller AC 境界 / Vitest file narrowing 知見を追加 |

## 仕様変更サマリ

- **API 仕様**: 変更なし
- **UI 内部実装**: `MeetingPanel.tsx` の解除経路が POST + mutationFn → DELETE + retry + idempotencyKey へ変更済み
- **観測性**: `Idempotency-Key: <uuid>` header が解除リクエスト時に常に送出されるようになる（server 側 dedupe は followup-003 で別途）

## ロールバックポリシー

`removeAttendance` helper を POST 経路に戻し、`MeetingPanel.tsx` の mutation を 1 本に統合する revert で機能後退（reliability なし）でロールバック可能。データ層への変更がないため安全。
