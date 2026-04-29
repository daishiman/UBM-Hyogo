# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-pr-target-safety-gate-dry-run |
| Phase | 10 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

Phase 1〜9 の総和をレビュアー視点で再点検し、**Go / No-Go 判定**を `outputs/phase-10/go-no-go.md` に記録する。Phase 13 ユーザー承認ゲートに進む前段の最終レビューとして機能する。

## 実行タスク

- `outputs/phase-10/go-no-go.md` を作成し、AC × 証跡 × 判定の 3 列表で AC-1〜AC-9 を 1 行ずつ並べる。
- 各 AC について：(a)受入条件、(b)裏付け証跡（Phase 2/3/4/5/6/7/9 のどこか）、(c)PASS/MINOR/MAJOR 判定の 3 列を埋める。
- MAJOR / MINOR / 残課題（U-x）の集計：MAJOR 0 件 / MINOR は許容範囲 / 残課題は Phase 12 unassigned-task-detection.md へ送る。
- ロールバック設計の最終確認：単一 revert コミットで safety gate 適用前へ戻せること、required status checks の job 名 drift がないことを再記録。
- 残課題候補の列挙：(a)dry-run 実走の別 PR 切り出し、(b)secrets 棚卸しの自動化（GitHub OIDC / OpenID 化評価）、(c)`workflow_run` を使うケースが将来発生した場合の追加レビュー観点 — を `unassigned-task` 候補として go-no-go.md 末尾に予約。
- レビュアー指定方針：solo 開発のため必須レビュアー数は 0。CI gate / 線形履歴 / 会話解決必須 / force push 禁止で品質を担保する旨を再確認（CLAUDE.md 準拠）。
- Go / No-Go の最終判定：MAJOR 0 件かつ AC 9/9 PASS の場合のみ Go。Go 判定時は Phase 11 へ進む。
- No-Go 条件を独立表にする：PR head checkout、`persist-credentials` 未指定、`workflow_run` secrets 橋渡し、required status check drift、untrusted input eval のいずれかが残る場合は No-Go。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `index.md`（AC-1〜AC-9）
- `outputs/phase-3/review.md`
- `outputs/phase-7/coverage.md`
- `outputs/phase-9/quality-gate.md`
- `CLAUDE.md`（solo 運用ポリシー）

## 成果物

- `outputs/phase-10/main.md`
- `outputs/phase-10/go-no-go.md`

## 統合テスト連携

最終レビューは docs に閉じる。dry-run 実走は後続実装タスクで実行する。

## 完了条件

- [ ] go-no-go.md に AC × 証跡 × 判定の 3 列表が記述されている。
- [ ] MAJOR 0 件・AC 9/9 PASS が記録されている。
- [ ] ロールバック設計が再確認されている。
- [ ] 残課題候補が unassigned-task 候補として末尾に予約されている。
- [ ] レビュアー指定方針（solo 0 名 + CI gate）が再確認されている。
- [ ] Go / No-Go 判定が明示的に記録されている。
- [ ] artifacts.json の Phase 10 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
