# System Spec Update Summary — publish-state-backfill-admin-ui

## 結論: no API/D1/Form schema change; aiworkflow index sync required

本タスクは **admin UI 導線のみ**（dry-run/apply パネルの追加）であり、正本 schema・endpoint 契約・Google Form schema のいずれも変更しない。
よって `docs/00-getting-started-manual/specs/` の API/D1/Form schema 変更は不要。ただし新規 workflow root と Phase 12 strict-7 を作成したため、`.claude/skills/aiworkflow-requirements/` の index / task-workflow / artifact inventory は同 wave で同期する。

## 影響評価

| 対象 | 影響 | 理由 |
|------|------|------|
| `docs/00-getting-started-manual/specs/01-api-schema.md`（form schema） | なし | Google Form schema 不変（不変条件 #1） |
| `docs/00-getting-started-manual/specs/08-free-database.md`（D1） | なし | D1 schema / migration 追加なし |
| endpoint 契約（`POST /admin/sync/backfill-publish-state`） | なし（既存） | endpoint は既に実装済み・変更不要。web は契約を `BackfillResultSchema` で再宣言するのみ |
| `aiworkflow-requirements` references | あり（index / workflow inventory） | API/IPC/状態管理の正本契約は変更しないが、新規 workflow root の検索導線を追加する |
| `task-specification-creator` references | あり（Phase 1 P50 既実装検出 rule） | 本サイクルの skill feedback を同一 wave 反映し、landed 実装を existing-hardening に再分類する手順を正本化する |
| consent キー（`publicConsent` / `rulesConsent`） | なし | 公開判定 3 条件（consent / publish_state / is_deleted）は既存ロジックを参照するのみ |

## 不変条件の遵守

- #1 実フォーム schema をコードに固定しすぎない → backfill は publish_state スイッチのみ操作、form schema 非依存。
- #5 D1 直接アクセスは `apps/api` に閉じる → web は proxy 経由のみ。
- #10 admin mutation は `@/features/admin/hooks/useAdminMutation` 経由 → 遵守。

## 結語

endpoint 契約は既存であり、UI 側は adapter（`backfill.ts` の zod 再宣言）で接続するため、API/D1/Form schema の正本 spec 更新は発生しない。一方で workflow root は新規作成のため、aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / artifact inventory へ同期する。
加えて、Phase 12 skill feedback は `task-specification-creator/references/phase-template-phase1.md` と skill changelog へ同一 wave で反映済み。
