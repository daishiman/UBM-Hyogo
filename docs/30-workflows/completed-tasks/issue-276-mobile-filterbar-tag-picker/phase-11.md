# Phase 11: スクリーンショット / 統合テスト evidence

[実装区分: 実装仕様書]

## メタ情報

| Phase | 11 |
| 前提 | Phase 10 完了 |
| 後続 | Phase 12 |

## 目的

Playwright で mobile / desktop のスクリーンショットを取得し、AC の視覚的 evidence を残す。

## 実行タスク

1. Playwright スクリーンショット取得
   ```bash
   mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test members-filter-mobile --reporter=line
   ```
2. 撮影シナリオ:
   - **mobile/initial.png**: width 375, `/members` 初期表示（collapsed summary）
   - **mobile/expanded.png**: summary 展開後の TagPicker 表示
   - **mobile/limit-reached.png**: 5 件選択後 6 件目候補が disabled
   - **desktop/picker-and-selected.png**: width 1280, picker + selected bar 両方
3. 画像を `outputs/phase-11/evidence/` に配置
4. `outputs/phase-11/test-report.md` に AC×screenshot の対応表を記述
5. VISUAL evidence support files を配置
   - `outputs/phase-11/screenshot-plan.json`
   - `outputs/phase-11/manual-test-result.md`
   - `outputs/phase-11/manual-test-report.md`
   - `outputs/phase-11/discovered-issues.md`
   - `outputs/phase-11/ui-sanity-visual-review.md`
   - `outputs/phase-11/phase11-capture-metadata.json`

## 統合テスト evidence

| AC | screenshot | 補足 |
|----|-----------|-----|
| AC-1 | mobile/expanded.png | 候補 chip ≥5 件 |
| AC-3 | mobile/limit-reached.png | hint 文言可視 |
| AC-4 | mobile/initial.png | summary のみ |
| AC-6 | desktop/picker-and-selected.png | URL bar 含む撮影 |

## 完了条件

- [ ] 4 枚以上のスクリーンショットを取得
- [ ] AC×screenshot 対応表完成
- [ ] `outputs/phase-11/evidence/` 配下に画像が物理存在
- [ ] VISUAL evidence support files が全て物理存在

## タスク100%実行確認【必須】

- [ ] Playwright config の viewport 設定が正しい
- [ ] 画像の path が PR 本文から参照可能な相対パス
- [ ] Phase 12 compliance の Phase 11 evidence inventory に present/pending/n/a を正しく反映した

## 次Phase

Phase 12 へ。
