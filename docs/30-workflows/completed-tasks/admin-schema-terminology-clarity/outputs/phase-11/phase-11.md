# Phase 11: 手動テスト検証（VISUAL / implemented_local_evidence_captured）

Task ID: `TASK-ADMIN-SCHEMA-TERMINOLOGY-CLARITY-001`

## メタ情報

| 項目 | 値 |
|------|-----|
| workflow_state | implemented_local_evidence_captured |
| capture 状態 | staging_visual_pending_user_gate |
| 対象 route | `/admin/schema`, `/admin/schema/history`, `/admin` dashboard |

## 目的

UI 文言リネームの視覚的差分（サイドバー / 見出し / 現在のフォーム構成 / Diff パネル / ダッシュボード）を、実装済みローカル証跡と authenticated staging screenshot に分けて管理する。

## 実行済みローカル証跡

- focused Vitest 10 files / 84 tests PASS。
- web typecheck PASS。
- lint PASS。
- verify:tokens PASS。
- apps/api diff empty。
- old technical-label grep PASS。

## Screenshot 台帳（user-gated）

| canonical screenshot | 観点 | 状態 |
|----------------------|------|------|
| `admin-schema-terminology-header-renamed.png` | サイドバー「フォーム項目」+ 見出し「フォーム項目の対応づけ」+ パンくず「管理 / フォーム項目」 | staging_visual_pending_user_gate |
| `admin-schema-current-revision-hidden-id.png` | 「現在のフォーム構成 / 最新版 / 適用中 /（取得: 日本語日付）」になり生 revisionId 非表示 | staging_visual_pending_user_gate |
| `admin-schema-diff-panel-japanese-actions.png` | 項目別の変更点 / まとめて対応づけ / 対応づけの記録 | staging_visual_pending_user_gate |
| `admin-dashboard-form-item-alert.png` | ダッシュボード「未対応のフォーム項目: N 件」+ KPI「未対応のフォーム項目」 | staging_visual_pending_user_gate |

## 参照成果物

- [manual-test-result.md](manual-test-result.md) — ローカル証跡と staging visual 境界。
- [screenshot-plan.json](screenshot-plan.json) — 撮影計画。
- [phase11-capture-metadata.json](phase11-capture-metadata.json) — 撮影台帳メタ。
- `screenshots/` — authenticated staging 取得後に PNG を格納。

## 完了条件

- [x] local evidence が記録されている。
- [x] screenshot 台帳（4 枚・staging user-gated）が記録されている。
- [x] API/D1/Form 非変更境界が記録されている。
