# task-18-full-visual-regression-suite-001

## 概要

task-18 W7 の 4 screen baseline を拡張し、17 URL routes x 3 viewport の full visual regression suite を設計・実装する。

## 苦戦箇所

4 screen baseline と 17 URL routes x 3 viewport baseline は変更量・CI 時間・flaky 対策の規模が異なる。
task-18 W7 本体に同梱すると、MVP regression gate の初期導入と full baseline 管理が同時に失敗しやすい。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| screenshot drift の頻発 | ubuntu-latest / fixed viewport / animation stop を必須化する |
| baseline 更新の乱発 | update workflow を user approval gate にする |
| CI 時間増大 | nightly と PR path filter を分離する |

## 検証方法

- `pnpm --filter @ubm-hyogo/web exec playwright test --project=visual-full-chromium`
- baseline update workflow artifact を取得し、tracked screenshot と再実行結果を照合する。

## スコープ

含む: 17 URL routes x desktop/tablet/mobile の screenshot baseline、update runbook、artifact retention、required check 候補の評価。

含まない: task-18 W7 の token verifier、17 URL routes smoke、4 screen MVP baseline。
