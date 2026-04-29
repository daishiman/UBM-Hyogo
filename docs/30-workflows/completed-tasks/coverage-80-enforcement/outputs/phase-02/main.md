# Phase 2 主成果物 — 設計

詳細は `../../phase-02.md` 参照。本ファイルはサマリ。

## トポロジ

`developer → vitest --coverage → coverage-summary.json → coverage-guard.sh → (lefthook pre-push) → git push → GHA coverage-gate → branch protection`

## 主要設計事項

### scripts/coverage-guard.sh

- 入力: flag (`--changed` / `--package` / `--threshold`) + env (`CI`)
- 処理: vitest 実行 → coverage-summary.json 集計 → 80% 判定 → 未達 top10 抽出 → テスト雛形パス生成
- 出力（stderr）: package 別 FAIL ヘッダ + top10 file リスト（lines% 昇順）+ HINT
- exit code: 0=全 pass / 1=未達 / 2=環境エラー
- 依存: bash / POSIX / jq 1.6+ / Node 24

### vitest.config.ts coverage セクション

- provider: v8
- thresholds: lines/branches/functions/statements 全部 80
- reporter: text / json-summary / lcov / html
- exclude: test files / node_modules / .next / .open-next / .wrangler / page.tsx 等 Next.js 特殊ファイル / middleware / d.ts / config

### CI coverage-gate job

- PR① では `continue-on-error: true`（soft）
- PR③ で削除（hard）+ branch protection contexts に登録
- artifact upload（coverage report）+ Codecov upload（任意）

### lefthook pre-push（PR③）

- `bash scripts/coverage-guard.sh --changed`
- skip: merge / rebase
- 緊急 bypass: `LEFTHOOK=0`（CI で再 block）

## 3 段階 PR 段取り

| PR | 内容 | gate |
| --- | --- | --- |
| PR① | T0+T1+T2+T3+T4（仕組み導入 + soft gate） | warning のみ、merge 可 |
| PR② | T5（package 別テスト追加、複数 sub PR） | warning が消えるまで追加 |
| PR③ | T6+T7+T8（hard gate + lefthook + 正本同期） | hard gate 化 |

## ファイル変更計画

詳細は phase-02.md §ファイル変更計画 を参照。新規 1 件、編集 12 件、PR① / PR② / PR③ で分割。

## リスクと緩和

苦戦想定 7 件すべてに緩和策と紐付き Phase あり（phase-02.md §リスクと緩和策）。

## 次 Phase

Phase 3 設計レビューへ。代替案 A〜F の比較で本設計の優位性を検証。
