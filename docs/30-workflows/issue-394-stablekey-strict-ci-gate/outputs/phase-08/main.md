# Phase 8: パフォーマンス・運用 — outputs/main

## 判定

`PASS`。

## 性能観点

| 項目 | 計測値 / 想定 | 備考 |
| --- | --- | --- |
| 現行 strict 実行時間（local） | `< 数秒`（148 violations 出力含む） | scripts/lint-stablekey-literal.mjs の AST 走査一巡。`phase-11/evidence/strict-current-blocker.txt` に出力時刻 |
| CI 実行時間増分（想定） | `< 5s` 程度 | 既存 lint と同一スクリプト系 |
| developer DX | 同一コマンド | local `pnpm lint:stablekey:strict` と CI step 完全一致 |

## 運用観点

- developer override: 用意しない（blocking gate の意義を毀損するため）。
- 緊急時: ci step を一時 revert する PR で対応。required context 名は変更しない。
- monitoring: CI 失敗ログで違反行が直接出力されるため別 dashboard 不要。

## 完了条件チェック

- [x] 性能・運用上のリスクが許容範囲。
- [x] override / rollback 方針確定。
