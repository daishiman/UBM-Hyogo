<!-- workflow: members-list-ux-clarity / task: C / phase: 11 -->

[実装区分: 実装仕様書]

# Phase 11 — 手動テスト (Task C)

## 1. 手動テスト目的

- Task A/B 統合後の `/members` page を 4 viewport × 3 状態で目視確認
- screenshots を `outputs/phase-11/screenshots/` に保存し、PR レビュー用 evidence とする
- visual baseline の Linux runner 撮影 (Gate-C) とは独立した「macOS ローカル目視確認」レイヤー

## 2. screenshots 計画 (12 枚)

| # | viewport | 状態 | URL | ファイル名 |
| - | -------- | ---- | --- | ---------- |
| 1 | mobile (375×812) | 結果あり | `/members` | `01-mobile-default.png` |
| 2 | mobile | 空 | `/members?q=__none__` | `02-mobile-empty.png` |
| 3 | mobile | フィルタ適用中 | `/members?q=&zone=0_to_1&tag=...` | `03-mobile-filtered.png` |
| 4 | tablet (768×1024) | 結果あり | `/members` | `04-tablet-default.png` |
| 5 | tablet | 空 | `/members?q=__none__` | `05-tablet-empty.png` |
| 6 | tablet | フィルタ適用中 | `/members?q=&zone=0_to_1` | `06-tablet-filtered.png` |
| 7 | desktop (1024×768) | 結果あり | `/members` | `07-desktop-default.png` |
| 8 | desktop | 空 | `/members?q=__none__` | `08-desktop-empty.png` |
| 9 | desktop | フィルタ適用中 | `/members?q=&zone=0_to_1` | `09-desktop-filtered.png` |
| 10 | wide (1440×900) | 結果あり | `/members` | `10-wide-default.png` |
| 11 | wide | 空 | `/members?q=__none__` | `11-wide-empty.png` |
| 12 | wide | フィルタ適用中 | `/members?q=&zone=0_to_1` | `12-wide-filtered.png` |

## 3. 確認項目（screenshot ごと）

- [ ] `<output data-role="result-count">` の文言が状態に整合（"X 件中 Y 件" / "該当者なし"）
- [ ] `<p data-role="pagination-meta">` が視覚上は維持されている
- [ ] DensityToggle (Task A) の sublabel / HelpHint が描画されている
- [ ] MemberFilters (Task B) の live-filter hint / SelectedFiltersBar / クリアボタンが想定通り
- [ ] OKLch tokens 由来の色のみ（HEX 直書きなし）

## 4. screenshot 取得手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev:webpack
# 別ターミナルで playwright を screenshot mode で起動 or browser DevTools で各 viewport を切替
```

または Playwright を screenshot ヘルパーで使用:
```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test members-ux-clarity \
  --project=visual-chromium --update-snapshots
# 生成 PNG を outputs/phase-11/screenshots/ にコピー (リネーム)
```

## 5. evidence 保存先

`docs/30-workflows/completed-tasks/members-list-ux-clarity/tasks/task-c-page-integration-and-visual-baseline/outputs/phase-11/screenshots/`

`outputs/phase-11/manual-test-result.md` に上記 12 ファイル名一覧と確認結果を記述。

## DoD

- [x] 4 viewport × 3 状態 = 12 screenshot の計画が表で示されている
- [x] 確認項目チェックリストが配置されている
- [x] 取得手順が記述されている
- [x] evidence 保存先パスが明示されている
