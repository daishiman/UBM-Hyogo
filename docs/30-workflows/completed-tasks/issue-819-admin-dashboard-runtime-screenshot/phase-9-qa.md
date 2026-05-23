# Phase 9: QA

## 9.1 QA チェックリスト

### 9.1.1 コード品質

- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` → 0 error
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web lint` → 0 error / 0 warn
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build` → success
- [ ] vitest 全 spec pass

### 9.1.2 grep-gate

- [ ] `grep -nE 'fill="#|bg-\[#|text-\[#' apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` → 0 hit

### 9.1.3 git tree clean

- [ ] `git status apps/web/ apps/api/` → nothing to commit
- [ ] `git diff --stat apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` → 0 lines

### 9.1.4 PNG 検証

- [ ] `file <chart.png>` → PNG image data, width >= 200, height >= 100
- [ ] `file <placeholder.png>` → 同上
- [ ] `ls -la <chart.png>` → size <= 500KB
- [ ] `ls -la <placeholder.png>` → 同上
- [ ] `exiftool <chart.png>` → user / device 情報なし (or optipng -strip all 実行済みログ)

### 9.1.5 親 workflow ドキュメント整合性

- [ ] `outputs/phase-11/main.md` screenshot 行 = `runtime_completed`
- [ ] `outputs/phase-12/main.md` §6 残課題 から authenticated runtime screenshot 削除 or `consumed`
- [ ] `outputs/phase-12/unassigned-task-detection.md` に consumed 行追記
- [ ] `unassigned-task/step-05-followup-001-*.md` の status = consumed

### 9.1.6 視覚 AC

- [ ] AC-1: placeholder PNG に「分布データは現在集計対象外です」可視
- [ ] AC-2: chart PNG に bar 3 本 (公開 / 会員限定 / 非公開) 描画
- [ ] AC-3: 両 PNG ≤ 500KB / ≥ 200x100

## 9.2 検証ログ保存

各コマンド実行結果は本タスクの commit message 本文に貼付するか、`outputs/phase-11/` 配下に `verify.log` として残す（必要に応じ）。

## 9.3 QA 完了条件

9.1 のチェックボックスすべて green。

## 9.4 不合格時のロールバック手順

- PNG が AC を満たさない場合: PNG ファイルのみ差し替え再撮影。コード再 patch → revert を再実行
- typecheck / lint fail: fixture 注入が残存している可能性大 → `git checkout -- apps/web/...` で revert 確認
## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

runtime screenshot evidence の QA 観点を定義する。

## 実行タスク

- PNG の視認性、dimension、size、PII metadata stripping を確認する。
- 親 workflow と source unassigned の状態更新を確認する。

## 参照資料

- `phase-11-manual-test.md`
- 親 workflow `outputs/phase-11/` と `outputs/phase-12/`

## 成果物

- QA checklist
- evidence quality criteria

## 完了条件

Phase 11 完了後に QA checklist をすべて確認できる。

- [ ] Phase 11 完了後に PNG、親 docs、source unassigned、verification logs を確認できる

## 統合テスト連携

Phase 11 の saved logs と PNG file checks を QA evidence とする。
