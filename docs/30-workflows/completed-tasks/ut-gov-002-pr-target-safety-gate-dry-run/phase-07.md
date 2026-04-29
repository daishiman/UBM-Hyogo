# Phase 07: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-pr-target-safety-gate-dry-run |
| Phase | 7 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

Phase 4 マトリクスと Phase 6 failure-cases が **AC-1〜AC-9 の全条件をカバーしているか**を検証し、ギャップがあれば test-matrix / failure-cases を補強する。docs-only タスクのため「コード coverage」ではなく「観点 coverage」を扱う。

## 実行タスク

- `outputs/phase-7/coverage.md` に観点 × AC の 2 次元マトリクスを作成する：
  - 行：AC-1〜AC-9（index.md の受入条件）。
  - 列：T-1〜T-5（Phase 4）/ FC-1〜FC-8（Phase 6）/ S-1〜S-5（Phase 3 security 観点）/ N-1〜N-3（Phase 3 NO-GO）。
  - セルに ✓ / 空欄を記入し、空行（カバレッジ穴）が出た AC を抽出する。
- カバレッジ穴がある場合は test-matrix.md / failure-cases.md / review.md に追補する旨を coverage.md に記述する（実追補は本 Phase で行う）。
- 重複カバレッジ（同じ AC を 3 観点以上で踏んでいる）を整理し、観点間の役割分担を明確化する。
- 「観点だけ揃って実走証跡がない」状態にならないよう、Phase 9 quality-gate.md で **最低限実走必須**となる項目を 3 件選定する：(M-1)same-repo PR の dry-run、(M-2)fork PR の dry-run、(M-3)`gh run view --log` での secrets 非露出 grep。
- カバレッジ宣言：本ワークフローの観点 coverage は **AC 9 / 9 = 100%** を完了条件とする。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `outputs/phase-4/test-matrix.md`
- `outputs/phase-6/failure-cases.md`
- `outputs/phase-3/review.md`
- `index.md`（AC-1〜AC-9）

## 成果物

- `outputs/phase-7/main.md`
- `outputs/phase-7/coverage.md`

## 統合テスト連携

実走 coverage は後続実装タスクが Phase 9 quality-gate に集約する。本 Phase は観点 coverage の 100% を保証することのみが責務。

## 完了条件

- [ ] coverage.md に AC × 観点の 2 次元マトリクスが作成されている。
- [ ] カバレッジ穴がゼロ、または穴の追補先が明示されている。
- [ ] 最低限実走必須 M-1〜M-3 が選定されている。
- [ ] 観点 coverage が AC 9/9 = 100% で宣言されている。
- [ ] artifacts.json の Phase 7 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
