# Phase 7 — カバレッジ確認サマリ

## Status

completed

## サマリ

shell + yaml + package.json 修正で完結するタスクのため、JS/TS のカバレッジツール（istanbul / v8）は適用しない。代わりに **手動 trace 表** で「変更行 × トリガー条件 × 検証ケース」の対応を可視化する [Feedback BEFORE-QUIT-002]。

## 対象範囲（変更行のみ）

| ファイル | 行範囲 | カバー方法 |
| --- | --- | --- |
| `lefthook.yml` | 全行（〜50 行想定） | TC-PRE / TC-PMG / TC-PFT で全 supported lane × commands を 1 回以上発火 |
| `scripts/hooks/staged-task-dir-guard.sh` | 全行（〜30 行想定） | TC-PRE-01〜05 で if/else 分岐を網羅 |
| `scripts/hooks/stale-worktree-notice.sh` | 全行（〜40 行想定） | TC-PMG / TC-PFT で `$1` 分岐の 2 経路を網羅 |
| `package.json` (`prepare` / `indexes:rebuild`) | 2 行 | TC-INST-01 / TC-PMG-05 |
| `.gitignore` (`lefthook-local.yml`) | 1 行 | TC-INST-04 |
| `scripts/new-worktree.sh` | 追加 1 行 | 新規 worktree 作成スモークで確認 |

`generate-index.js` は変更しないためカバレッジ対象外（[Feedback BEFORE-QUIT-002] に従い変更行に限定）。

## カバレッジ表

詳細は `outputs/phase-7/coverage.md`。

## 概念と依存エッジ

| concern | 依存エッジ | 担保するテスト |
| --- | --- | --- |
| pre-commit 起動 | lefthook → guard.sh → branch ↔ task-dir 比較 | TC-PRE-01〜05 |
| post-merge 副作用ゼロ | lefthook → notice.sh post-merge（`generate-index.js` を呼ばない） | TC-PMG-01/02、F4-01〜03 |
| install 冪等性 | `prepare` → `lefthook install` → `.git/hooks/*` 上書き | TC-INST-01〜03 |
| worktree 配布 | 各 `.git/worktrees/<name>/hooks/` への配置 | TC-INST-02 |
| local override | `lefthook-local.yml` の skip 反映 | TC-INST-04、F3-01〜03 |
| bypass 経路 | `--no-verify` / `LEFTHOOK=0` | F1-01〜04 |
| 環境欠落 | `node_modules/.bin/lefthook` 不在等 | F2-01〜04 |
| 回帰ガード（最重要） | post-merge から `generate-index.js` 呼び出しが復活しない | F4-01〜04 |

## 完了条件チェック

- [x] カバレッジ範囲を変更行に限定
- [x] 概念 × 依存エッジ × テスト ID を結合
- [x] coverage.md を作成
- [x] `generate-index.js` を対象外と明記
