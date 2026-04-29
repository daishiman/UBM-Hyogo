# Phase 09: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-pr-target-safety-gate-dry-run |
| Phase | 9 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

Phase 1〜8 の成果物を **品質ゲート (quality gate)** で総点検し、AC-1〜AC-9 / 観点 coverage / セキュリティレビュー / 用語整合のすべてが PASS であることを確認する。docs-only タスクの quality gate は「文書整合 + 仕様の実行可能性」を保証する。

## 実行タスク

- `outputs/phase-9/quality-gate.md` を作成し、以下のチェック項目を PASS / MINOR / MAJOR で評価する：
  - **G-1**：AC-1〜AC-9 が全て PASS（index.md の AC 一覧と Phase 7 coverage.md を突き合わせる）。
  - **G-2**：失敗ケース FC-1〜FC-8 が MAJOR 0 件（許容 MINOR は FC-7 / FC-8 のみ、運用補強で対応済み）。
  - **G-3**：security 観点 S-1〜S-5 がレビュー記録に残っている。
  - **G-4**：NO-GO 条件 N-1〜N-3 が解消されている（親タスク完了 / UT-GOV-001 適用 / UT-GOV-007 SHA pin）。
  - **G-5**：用語整合チェック（4 用語）の表記揺れゼロ。
  - **G-6**：内部リンク切れゼロ（Phase 11 で再検証）。
  - **G-7**：artifacts.json と本文の Phase status が一致。
- security 節を `quality-gate.md` 内に独立章として記述：
  - "pwn request" 非該当の 5 箇条を最終確認。
  - secrets 棚卸しの結果（実走は後続実装タスク）の記録欄を確保。
  - GITHUB_TOKEN scope 最小化の確認結果。
- MAJOR 0 件 / MINOR 許容 / PASS 多数 を本タスクの quality gate 通過条件とする。
- gate 不通過時の戻り先を記述：MAJOR があれば該当 Phase（2/3/4/5/6 のいずれか）に戻し、修正後に Phase 9 を再評価する。
- 実走必須項目 M-1〜M-3（Phase 7 で選定）の **再確認欄**を quality-gate.md に確保し、後続実装タスクが埋める設計とする。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `index.md`（AC-1〜AC-9）
- `outputs/phase-3/review.md`
- `outputs/phase-4/test-matrix.md`
- `outputs/phase-6/failure-cases.md`
- `outputs/phase-7/coverage.md`
- `outputs/phase-8/before-after.md`

## 成果物

- `outputs/phase-9/main.md`
- `outputs/phase-9/quality-gate.md`

## 統合テスト連携

dry-run 実走は後続実装タスクで実行する。本 Phase は仕様の実行可能性（実走時に必要な情報が漏れていないか）を保証することに専念する。

## 完了条件

- [ ] quality-gate.md に G-1〜G-7 が PASS / MINOR / MAJOR で評価されている。
- [ ] MAJOR 0 件、MINOR は許容範囲内であることが記録されている。
- [ ] security 節（"pwn request" 5 箇条 / secrets 棚卸し / GITHUB_TOKEN scope）が記述されている。
- [ ] gate 不通過時の戻り先ルールが記述されている。
- [ ] 実走必須 M-1〜M-3 の再確認欄が確保されている。
- [ ] artifacts.json の Phase 9 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
