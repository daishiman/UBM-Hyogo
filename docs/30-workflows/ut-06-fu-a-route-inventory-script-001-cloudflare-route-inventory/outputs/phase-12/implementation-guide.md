# Implementation Guide

## Part 1: 中学生レベルの説明

このタスクは、Cloudflare の route が正しい Worker を向いているかを、あとで機械で確認できるように「確認表の形」を決める作業です。たとえるなら、校内の教室案内板を見て「1年A組はこの教室」と一覧表にするためのルールを作るだけです。教室を移動したり、案内板を書き換えたりはしません。

| 用語 | やさしい意味 |
| --- | --- |
| Worker | Webアプリを動かす係 |
| route | どのURLをどのWorkerにつなぐかの案内 |
| inventory | 一覧表 |
| mismatch | 期待と違うつながり |
| read-only | 読むだけで、変更しないこと |

## Part 2: 技術者向け

後続実装タスクは `bash scripts/cf.sh route-inventory ...` 相当の repository-controlled entrypoint を実装し、Phase 2 の `InventoryReport` を生成する。

必須境界:

- Cloudflare API は GET allowlist のみ。
- output は JSON / Markdown の 2 形式。
- `mismatches` は `targetWorker !== expectedWorker` の派生配列。
- token / OAuth / Bearer / account id / zone id 実値を output に残さない。
- production mutation、deploy、route 付け替え、secret put は実行しない。

後続実装タスク:

`docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-impl-001.md`

## Phase 11 証跡参照

この workflow は UI を持たない `docs-only / NON_VISUAL` タスクのため、スクリーンショットは N/A。代替証跡は次の Phase 11 ファイルで確認する。

| 証跡 | 参照先 | 意味 |
| --- | --- | --- |
| NON_VISUAL 判定 | `outputs/phase-11/main.md` | design-level acceptance と runtime acceptance の分離 |
| 出力サンプル | `outputs/phase-11/route-inventory-output-sample.md` | 後続実装が生成する JSON / Markdown の形 |
| secret leak guard | `outputs/phase-11/secret-leak-grep.md` | token / Bearer / OAuth / account id / zone id 実値を残さない確認範囲 |
| mutation guard | `outputs/phase-11/mutation-endpoint-grep.md` | route / custom domain / secret mutation を実行しない確認範囲 |
| runbook link | `outputs/phase-11/runbook-link-checklist.md` | 親 runbook / 後続実装タスクへの導線 |
