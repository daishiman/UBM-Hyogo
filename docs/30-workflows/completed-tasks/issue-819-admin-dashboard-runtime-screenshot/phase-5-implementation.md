# Phase 5: 実装手順

> 本 Phase は **コード実装の本体**。実行者は順に従って手を動かす。コード変更は最終的にすべて revert されることを前提とする。

## 5.1 前提

- Node 24 / pnpm 10（`mise exec --` 経由必須）
- worktree: `feat/issue-819-admin-dashboard-runtime-screenshot` （または等価ブランチ）
- working tree clean

## 5.2 Step 1: caller 構造の確認

`apps/web` 内で `StatusDistribution` を呼び出している箇所を特定する。

```bash
rg -n 'StatusDistribution' apps/web/app apps/web/src --glob '*.tsx' --glob '*.ts'
```

期待される caller: `apps/web/app/(admin)/admin/page.tsx` または `apps/web/src/features/admin/components/AdminDashboard.tsx` 等。
caller が `slices={...}` を SWR 等から渡している場合、その引数を一時上書きする。

## 5.3 Step 2: placeholder 状態の取得

### 5.3.1 fixture 注入

caller (例: `apps/web/app/(admin)/admin/page.tsx`) を一時編集し、`StatusDistribution` への `slices` を `undefined` に固定する:

```tsx
// BEFORE
<StatusDistribution slices={dashboard.byStatus} />

// AFTER (一時)
<StatusDistribution slices={undefined} />
```

### 5.3.2 dev server 起動

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
# http://localhost:3000 等で起動
```

### 5.3.3 admin ログイン

- ブラウザで `/login` を開く
- admin アカウント (`manjumoto.daishi@senpai-lab.com`) で Magic Link or Google OAuth ログイン
- `/admin` (dashboard) に遷移

### 5.3.4 screenshot 撮影

Chrome DevTools:
1. F12 で DevTools 起動
2. Elements パネルで `<section>` (data-testid を含む StatusDistribution 親) を選択
3. 右クリック → "Capture node screenshot"
4. ダウンロードされた PNG を `/tmp/admin-dashboard-placeholder-raw.png` に保存

### 5.3.5 PII strip & 配置

```bash
optipng -strip all -o2 /tmp/admin-dashboard-placeholder-raw.png
cp /tmp/admin-dashboard-placeholder-raw.png \
  docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-placeholder.png
file docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-placeholder.png
# 期待: PNG image data, >=200 x >=100
ls -la docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-placeholder.png
# 期待: size <= 500KB
```

## 5.4 Step 3: populated chart 状態の取得

### 5.4.1 fixture 切替

caller を再度編集し populated 値を渡す:

```tsx
<StatusDistribution
  slices={[
    { status: "public", count: 12 },
    { status: "member_only", count: 7 },
    { status: "hidden", count: 3 },
  ]}
/>
```

### 5.4.2 dev server がホットリロードで反映されたことを確認

`/admin` をリロードし、SVG bar chart 3 本が描画されることを目視確認。

### 5.4.3 screenshot 撮影 & 配置

5.3.4 / 5.3.5 と同じ手順で `admin-dashboard-chart.png` を配置。

## 5.5 Step 4: fixture 注入の revert

```bash
git status apps/web/
# 期待: caller ファイルが modified

git checkout -- 'apps/web/app/(admin)/admin/page.tsx'
# (該当 caller ファイルパス)

git status apps/web/ apps/api/
# 期待: nothing to commit
```

## 5.6 Step 5: 親 workflow ドキュメント更新

### 5.6.1 Phase 11 main.md 更新

```bash
# 編集対象を Read してから patch
cat docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/main.md
```

screenshot 関連行を `runtime_pending` → `runtime_completed` + `captured_at: 2026-05-20` + `captured_by: issue-819-admin-dashboard-runtime-screenshot` に更新。

### 5.6.2 Phase 12 main.md §6 更新

§6 残課題で authenticated runtime screenshot 行を `consumed by issue-819-admin-dashboard-runtime-screenshot (2026-05-20)` に書き換え。

### 5.6.3 unassigned-task-detection.md 更新

`outputs/phase-12/unassigned-task-detection.md` の `step-05-followup-001` 行に `consumed: 2026-05-20 / canonical: docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/` を追記。

### 5.6.4 unassigned-task spec consumed 化

```bash
# 推奨: status 行追記
# `docs/30-workflows/unassigned-task/step-05-followup-001-admin-dashboard-runtime-screenshot-capture.md`
# 冒頭メタ情報の `ステータス` を unassigned → consumed (by issue-819, 2026-05-20) に更新
```

## 5.7 Step 6: 検証コマンド一括実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/features/admin/components/_dashboard/StatusDistribution.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web build
grep -nE 'fill="#|bg-\[#|text-\[#' apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx
git status apps/web/ apps/api/
```

すべて green / clean を確認したら本 Phase 完了。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

一時 fixture 注入、screenshot 取得、revert、親 workflow 更新の実行手順を固定する。

## 実行タスク

- caller を特定し一時 fixture を注入する。
- placeholder / populated chart の PNG を取得する。
- 一時変更を revert し、親 workflow evidence を更新する。

## 参照資料

- `phase-2-design.md`
- `phase-11-manual-test.md`
- 親 workflow `outputs/phase-11/` と `outputs/phase-12/`

## 成果物

- runtime PNG 2 件
- 親 workflow evidence 更新
- source unassigned consumed marker

## 完了条件

runtime PNG と検証 log が保存され、`apps/web` / `apps/api` の一時差分が残っていない。

- [ ] runtime PNG と検証 log が保存され、`apps/web` / `apps/api` の一時差分が残っていない

## 統合テスト連携

Phase 11 の typecheck / lint / focused test / build / grep-gate で実行結果を確認する。
