# Phase 11: 手動テスト（evidence capture 本体）

> 本 Phase が本タスクの中核。Phase 5 の手順を実行・evidence inventory に物理配置する。

## 11.1 Evidence Inventory

本タスクの canonical evidence root: `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/`

| evidence | 配置先 (本タスク) | 親 workflow への反映先 |
|---|---|---|
| typecheck.log | `outputs/phase-11/typecheck.log` | (親には不要、本タスク内で保管) |
| lint.log | `outputs/phase-11/lint.log` | 同上 |
| test.log | `outputs/phase-11/test.log` | 同上 |
| build.log | `outputs/phase-11/build.log` | 同上 |
| grep-gate.log | `outputs/phase-11/grep-gate.log` | 同上 |
| git-status.log | `outputs/phase-11/git-status.log` | 同上 |
| screenshots/admin-dashboard-placeholder.png | `outputs/phase-11/screenshots/admin-dashboard-placeholder.png` | 親 `completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-placeholder.png` を置換 |
| screenshots/admin-dashboard-chart.png | `outputs/phase-11/screenshots/admin-dashboard-chart.png` | 親 `.../admin-dashboard-chart.png` を置換 |

> 本タスク evidence は **本タスクディレクトリ配下と親 completed-tasks 配下の両方** に置く。本タスク配下は本タスク完了後のトレーサビリティ用、親 completed-tasks 配下は親 workflow evidence 復元用。

## 11.2 実行手順（Phase 5 §5.2-§5.7 をそのまま実行）

省略せず Phase 5 を順に実行する。本ファイルは各ステップ実行時の **ログ集積点** として扱う。

## 11.3 各コマンド出力の保存

```bash
mkdir -p docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11
mise exec -- pnpm --filter @ubm-hyogo/web typecheck 2>&1 | tee docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/typecheck.log
mise exec -- pnpm --filter @ubm-hyogo/web lint 2>&1 | tee docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/lint.log
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/features/admin/components/_dashboard/StatusDistribution.spec.tsx 2>&1 | tee docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/test.log
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/build.log
grep -nE 'fill="#|bg-\[#|text-\[#' apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx | tee docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/grep-gate.log
git status apps/web/ apps/api/ | tee docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/git-status.log
```

> 注: `grep` が 0 hit の場合 exit 1 になるが、`| tee` を経由するため後段は止まらない。空ファイルが grep-gate.log の正常状態。

## 11.4 PNG 配置

Phase 5 §5.3 / §5.4 完了後、PNG を **本タスク outputs と親 completed-tasks の両方** にコピー:

```bash
SRC=/tmp/admin-dashboard-placeholder-raw.png    # optipng -strip 済み
DST_TASK=docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/screenshots/admin-dashboard-placeholder.png
DST_PARENT=docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-placeholder.png
cp "$SRC" "$DST_TASK"
cp "$SRC" "$DST_PARENT"
file "$DST_TASK" "$DST_PARENT"
ls -la "$DST_TASK" "$DST_PARENT"
```

同じ手順を chart PNG にも適用。

## 11.5 親 workflow ドキュメント編集

Phase 5 §5.6 をこの Phase で実行し、編集 diff を `git diff docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/` で確認する。

## 11.6 AC 物理確認

```bash
# AC-3 確認
for f in \
  docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-placeholder.png \
  docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-chart.png; do
  file "$f"
  ls -la "$f"
done
```

期待: 両ファイルが PNG image data, width >= 200, height >= 100, size <= 500KB。

## 11.7 完了報告

本 Phase の完了時に以下が満たされていること:

- AC-1〜AC-8 全部 green
- working tree: `git status apps/web/ apps/api/` clean
- ドキュメント diff: 親 workflow の指定ファイルのみが modified
- 本タスク outputs/phase-11/ に 6 log + 2 PNG + screenshots/ サブディレクトリが存在

ここまでで evidence capture は完了。Phase 12 へ進む。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

authenticated admin runtime screenshot と検証 log を物理 evidence として保存する。

## 実行タスク

- Phase 5 の screenshot 取得手順を実行する。
- typecheck、lint、focused test、build、grep-gate、git status を保存する。
- PNG 2 件を本タスク root と親 workflow に配置する。

## 参照資料

- `phase-5-implementation.md`
- `phase-9-qa.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

- `outputs/phase-11/typecheck.log`
- `outputs/phase-11/lint.log`
- `outputs/phase-11/test.log`
- `outputs/phase-11/build.log`
- `outputs/phase-11/grep-gate.log`
- `outputs/phase-11/git-status.log`
- `outputs/phase-11/screenshots/admin-dashboard-placeholder.png`
- `outputs/phase-11/screenshots/admin-dashboard-chart.png`

## 完了条件

AC-1〜AC-8 が実測 evidence で確認され、runtime screenshots が dummy PNG ではなくなる。

- [ ] AC-1〜AC-8 が実測 evidence で確認され、runtime screenshots が dummy PNG ではなくなる

## 統合テスト連携

`StatusDistribution.spec.tsx` focused test と web package typecheck / lint / build を実行する。
