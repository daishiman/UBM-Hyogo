# Documentation changelog

## 2026-05-26 spec_created

- 新規 workflow `admin-ui-prototype-alignment-followup-001-members-fetch-and-visual` を作成
- 親 `admin-ui-prototype-alignment` (`implemented_local_runtime_pending`) の followup-001
- Phase 1-13 markdown + outputs strict 7 + artifacts.json を物理配置
- scope: `/admin/members` 一覧 + drawer のプロトタイプ準拠化 + `ADMIN_FETCH_404` root cause 修正

## 関連 issue

- 親 staging runtime evidence で発見された 2 件の不適合（404 + UI 乖離）の解決として独立 workflow 化

## skill 反映

- aiworkflow-requirements: same-wave sync completed（quick-reference / resource-map / task-workflow-active / artifact inventory / changelog / LOGS / SKILL-changelog）
- task-specification-creator: same-wave lesson added（`lessons-learned/spec-created-followup-same-wave-sync.md` + SKILL changelog）

## 2026-05-26 automation-30 改善

- Phase 1 AC 表の空欄を AC-1..AC-9 で補完し、outputs の主張と root spec を整合
- `outputs/artifacts.json` を追加して root/output artifacts parity を確保
- Phase 12 の aiworkflow-requirements 同期ステータスを deferred から same-wave completed へ補正
- 30 種思考法 compact evidence と 4 条件の再検証を compliance check に追記
- task-specification-creator / aiworkflow-requirements の 2 skill 定義へ反映
- 実コード差分が存在するため workflow state を `implemented_local_runtime_pending` に再分類
- `GET /admin/members` list に prototype 表示用 optional fields を additive 実装し、テーブルが直接表示できるよう補正
