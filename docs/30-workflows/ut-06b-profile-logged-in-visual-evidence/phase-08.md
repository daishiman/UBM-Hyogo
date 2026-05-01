# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| 作成日 | 2026-04-30 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

DevTools snippet、命名規約、secret hygiene grep を 1 箇所に集約し、Phase 11 取得時の重複作業を排除する。

## DRY 候補

| # | 重複箇所 | Before | After |
| --- | --- | --- | --- |
| 1 | DevTools snippet | M-09 / M-10 / M-15 / M-16 で 4 回コピペ | 1 snippet（`devtools-snippets.md` に集約）+ 4 回実行 |
| 2 | 命名規約 | runbook と evidence-naming.md に二重 | `evidence-naming.md` を正本、runbook はリンク参照 |
| 3 | secret hygiene grep | runbook Part C と Phase 9 で重複 | runbook を正本、Phase 9 は再 grep（gate のみ） |
| 4 | session 確立手順 | local と staging で重複 | runbook で Part A/B を「step 1〜2 共通テンプレ + 環境差分」に分割 |

## Before / After

### Before（重複あり）

```
# runbook
1. local: ... DevTools console で querySelectorAll(...) 実行 ...
2. staging: ... DevTools console で querySelectorAll(...) 実行 ...
```

### After（1 snippet 参照）

```
# runbook
1. local: ... `devtools-snippets.md` の snippet-no-form.js を console に貼付 → 実行
2. staging: 同じ snippet を staging 上で実行
```

## 共通化方針

- **snippet 1 個 / 命名規約 1 個 / hygiene grep 1 個** を保ち、各 Phase からはリンクで参照
- 例外: Phase 9 の hygiene gate は実行責務を再度持つ（runbook は説明、Phase 9 は実 grep + PASS/FAIL）

## 実行タスク

- [ ] DRY 候補表を `outputs/phase-08/main.md` に記録
- [ ] Before/After を明示
- [ ] runbook と devtools-snippets / evidence-naming のリンク経路を確認

## 完了条件

- [ ] 4 重複の DRY 案完成
- [ ] runbook 側の参照リンクに置換済み
- [ ] artifacts.json の phase 8 を completed

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 8 を completed

## 次 Phase

- 次: Phase 9 (品質保証)
