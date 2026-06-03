# システム仕様更新サマリ — admin-attendance-dashboard-ux

workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL`

本タスクは `apps/web` の出席ダッシュボード UI/UX 是正（CSS・ラベル・補助テキスト・表示ロジック）に閉じる
実装仕様書である。Step 1（ドキュメント反映）を完了記録し、Step 2（システム仕様更新）は N/A と判定する。

## Step 1: ドキュメント反映（完了記録）

| Step | 内容 | 状況 |
| --- | --- | --- |
| Step 1-A | 完了タスク記録: 本 spec の Phase 1-13 成果物を workflow root（`index.md` / `phase-12-documentation.md`）に集約。`implemented_local_runtime_pending` の active workflow として aiworkflow-requirements の workflow inventory / quick-reference / resource-map / task-workflow-active / changelog へ同 wave 同期 | done |
| Step 1-B | 実装状況テーブル: `index.md` / `artifacts.json.metadata.workflow_state` を `implemented_local_runtime_pending` で記録（local 実装完了、staging visual / PR は user-gated） | done |
| Step 1-C | 関連タスクテーブル: AC-9 計算意味論是正を `unassigned-task-specs/admin-attendance-analytics-calc-correction.md` 分離として current facts に反映。`unassigned-task-detection.md` に検出 1 件として記録 | done |
| Step 1-H | `skill-feedback-report.md` の各 item を no-op（観察）として routing。promotion 対象なし（理由は skill-feedback-report.md 参照） | done |

> ドメイン仕様（API response shape / D1 schema / shared 型）は変更しないため Step 2 は N/A。ただし active workflow の
> 正本同期は必要なため、aiworkflow-requirements の workflow inventory / quick-reference / resource-map / task-workflow-active / changelog へ追記した。

## Step 2（条件付き）: 新規インターフェース追加時のみ

**判定: N/A**

理由:

- 本タスクは `apps/web` の出席ダッシュボード UI/UX 是正（CSS レイアウト復旧・SVG バー高さ固定・`ZONE_LABEL` 文言是正・
  `KpiPanel` ラベル整合・見方ガイド/凡例追加）のみ。TypeScript インターフェース / API endpoint / IPC 契約 / shared package 型の
  **新規追加なし**。
- 新規 export される識別子は `format-attendance.ts` の `ZONE_HELP`（凡例文字列定数）と `ZONE_LABEL` の値更新のみであり、
  これは UI 表示文言であってドメイン契約（API response shape / D1 schema / 集計セマンティクス）ではない。型 `AttendanceZone` の
  キー集合・`zoneFromCount` の境界・fetch URL・zod schema は不変。
- 計算意味論の是正（出席回数帯境界の妥当性 / 出席率の定義 / 延べ vs unique 集計）は別タスク
  `unassigned-task-specs/admin-attendance-analytics-calc-correction.md`（apps/api）でスコープ化済み。本 Phase 12 ではスコープ外。

> Step 2 を N/A 判定の根拠付きで明記しておくことで、`phase-12-pitfalls.md`「Step 2 必要性判定の記録漏れ」を回避する。
> `pending same-wave sync` は残さない（横断正本の更新対象がそもそも発生しないため）。

## artifacts parity

`outputs/artifacts.json` は root `artifacts.json` の mirror として存在する。
parity check は root / outputs の両方を対象に実施する。
