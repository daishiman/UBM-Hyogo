# Phase 7 — カバレッジ確認（main）

## Status

spec_created

## 0. 役割

Phase 4 マトリクス（T-1〜T-5）と Phase 6 failure-cases（FC-1〜FC-11）が **AC-1〜AC-9 の全条件をカバーしているか**を検証し、ギャップがあれば test-matrix / failure-cases を補強する。docs-only タスクのため「コード coverage」ではなく **観点 coverage** を扱う。

## 1. 入力の継承

| 入力パス | 用途 |
| --- | --- |
| `outputs/phase-4/test-matrix.md` | T-1〜T-5、F-1〜F-4、静的・動的検査 |
| `outputs/phase-5/runbook.md` | Step 4・5・6 の検査コマンド母本 |
| `outputs/phase-6/failure-cases.md` | FC-1〜FC-11、回帰防止チェックリスト |
| `outputs/phase-3/review.md` §4 / §2 | S-1〜S-5、NO-GO N-1〜N-3 |
| `index.md` AC-1〜AC-9 | 受入条件 |

> Phase 5 runbook を入力としていることを明示することで、verification-report の consistency warning を解消する。

## 2. 成果物

- `outputs/phase-7/main.md`（本書）
- `outputs/phase-7/coverage.md`（AC × 観点の 2 次元マトリクス、未カバー領域、最低限実走必須 M-1〜M-3）

## 3. カバレッジ宣言

| 種別 | 値 |
| --- | --- |
| 観点 coverage 完了条件 | **AC 9 / 9 = 100%** |
| カバレッジ穴 | なし（全 AC を T / FC / S / N の少なくとも 1 観点で踏む） |
| 重複カバレッジ | AC-3 / AC-4 / AC-5 が 3 観点以上で踏まれる（許容、役割分担を coverage.md §4 で整理） |
| 最低限実走必須 | M-1（same-repo PR dry-run）/ M-2（fork PR dry-run）/ M-3（`gh run view --log` での secrets 非露出 grep） |

## 4. 完了条件チェック（Phase 7）

- [x] coverage.md に AC × 観点の 2 次元マトリクスが作成されている。
- [x] カバレッジ穴がゼロ、または穴の追補先が明示されている。
- [x] 最低限実走必須 M-1〜M-3 が選定されている。
- [x] 観点 coverage が AC 9/9 = 100% で宣言されている。
- [x] Phase 5 runbook を input として明示している。

## 5. 次 Phase への引き継ぎ

Phase 8（リファクタリング）以降は本書および coverage.md を入力として、観点・命名・参照整合の最終調整を行う。実走 coverage は後続実装タスクが Phase 9 quality-gate に集約する。
