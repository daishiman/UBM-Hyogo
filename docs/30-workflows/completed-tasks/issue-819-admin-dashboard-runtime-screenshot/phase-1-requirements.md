# Phase 1: 要件定義

## 1.1 タスクの目的

step-05 admin dashboard `StatusDistribution` SVG bar chart の Phase 11 evidence に物理配置されている **16x16, 445B の dummy PNG 2 件** を、authenticated admin context で撮影した本物の screenshot (placeholder 状態 / populated chart 状態) に置換し、親 workflow の evidence 状態を `runtime_pending` → `runtime_completed` に進める。

## 1.2 入力（前提条件）

| 入力 | 値 / 出典 |
|---|---|
| taskType | `implementation`（runtime screenshot 取得と親 evidence 更新を実施するため） |
| visualEvidence | `VISUAL_ON_EXECUTION`（撮影実行時に screenshot evidence を取得） |
| 親 workflow root | `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/` |
| 親 evidence path | `outputs/phase-11/screenshots/admin-dashboard-{chart,placeholder}.png` |
| 対象コンポーネント | `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` |
| 対象 API | `GET /admin/dashboard` の `byStatus` 配列 (既存) |
| Admin アカウント | `manjumoto.daishi@senpai-lab.com` (project memory) |
| 起動コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web dev` (local) |
| 既存 PNG 状態 | 両ファイル `PNG image data, 16 x 16, 8-bit/color RGB, 445B` |

## 1.3 出力（成果物）

1. `admin-dashboard-placeholder.png`: `slices === undefined` 状態の admin/dashboard 画面 PNG（200x100 ≦ size ≦ 500KB）
2. `admin-dashboard-chart.png`: `slices` populated 状態 (public/member_only/hidden 3 本) の SVG bar chart PNG（同条件）
3. 親 workflow `outputs/phase-11/main.md` の screenshot status 行 update diff
4. 親 workflow `outputs/phase-12/main.md` の §6 残課題 update diff
5. 親 workflow `outputs/phase-12/unassigned-task-detection.md` の consumed 行追記 diff
6. `docs/30-workflows/unassigned-task/step-05-followup-001-admin-dashboard-runtime-screenshot-capture.md` の consumed 化 (削除 or status 更新)

## 1.4 非機能要件

- 撮影後の git working tree: コード変更を含むファイル（`apps/web/**`, `apps/api/**`）は全て revert 済み
- 画像は git に直接コミット可能なサイズ（個別 500KB 以下を目安）
- 撮影解像度: viewport 1280x800 推奨。chart 全体と `公開ステータス` ヘッダが視認できること
- 文字エンコーディング: PNG metadata に PII（admin email 等）を含めない（後段 Phase 11 で `exiftool` または `optipng -strip all` で剥がす）

## 1.5 完了条件（DoD）

artifacts.json の `acceptance_criteria` AC-1〜AC-8 を全て満たすこと。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

runtime screenshot 取得タスクの要件、入力、成果物、DoD を固定する。

## 実行タスク

- 親 workflow、source unassigned、対象 API、対象 UI を確認する。
- runtime evidence の acceptance criteria を AC-1〜AC-8 に分解する。

## 参照資料

- `artifacts.json`
- `docs/30-workflows/unassigned-task/step-05-followup-001-admin-dashboard-runtime-screenshot-capture.md`
- `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/`

## 成果物

- 要件表
- 成果物一覧
- 完了条件

## 完了条件

AC-1〜AC-8 が後続 Phase から参照可能な形で記録されている。

- [ ] AC-1〜AC-8 が `artifacts.json` と本文に同じ意味で記録されている

## 統合テスト連携

Phase 11 で `StatusDistribution.spec.tsx`、typecheck、lint、build、grep-gate を実行する。
