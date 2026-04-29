# Phase 06: テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-pr-target-safety-gate-dry-run |
| Phase | 6 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

Phase 4 のハッピーパス・主要シナリオに加え、**境界条件・失敗ケース・エッジケース**のテスト観点を `outputs/phase-6/failure-cases.md` で列挙し、dry-run 実走時に safety gate が想定通り防御できることを後続タスクが検証可能な状態にする。

## 実行タスク

- `outputs/phase-6/failure-cases.md` に失敗ケースを 8 件以上列挙する：
  - **FC-1**：`pull_request_target` で `actions/checkout` を `ref: ${{ github.event.pull_request.head.sha }}` で実行（pwn request 典型）→ 検出されること。
  - **FC-2**：`persist-credentials: false` を欠落させた checkout → 検出されること。
  - **FC-3**：トップレベル `permissions: write-all` → 検出されること。
  - **FC-4**：`pull_request_target` workflow から `${{ secrets.* }}` を参照 → 検出されること。
  - **FC-5**：`workflow_run` 経由で fork PR build に secrets を橋渡し → 検出されること。
  - **FC-6**：`uses:` が SHA ではなく tag / branch ref → UT-GOV-007 と連携し検出されること。
  - **FC-7**：fork PR で labeled trigger（`authorize` ラベル）が誰でも付けられる状態 → 運用ルールでカバーされていることを確認。
  - **FC-8**：`pull_request_target.types` 未指定（全 type で起動）→ 限定すべき types を design.md に追記する。
  - **FC-9**：Dependabot / first-time contributor / maintainer re-run の境界差で secrets 可視性が変わる → actor と approval state を記録する。
  - **FC-10**：cache / artifact poisoning で untrusted output が trusted workflow に流入する → cache key / artifact consumer を分離する。
  - **FC-11**：`workflow_dispatch` 誤用で高権限 job が手動実行される → trigger と permissions の組み合わせを検査する。
- 各 FC に対し検出手段を 3 列で記述：(a)静的（actionlint / grep / yq）、(b)動的（dry-run logs）、(c)レビュー（PR diff チェックリスト）。
- 異常系の期待挙動：FC-1〜FC-6 はいずれも MAJOR、FC-7 は MINOR（運用補強）、FC-8 は MINOR（設計補強）として分類する。
- 回帰防止策：将来 PR で `pull_request_target` を編集する際に reviewer が確認すべきチェックリストを 5 項目記述。
- レポート規約：失敗ケース検出時の通知フロー（GitHub Issue 起票 → security ラベル付与 → 担当割当）を仕様化。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `outputs/phase-4/test-matrix.md`
- `outputs/phase-3/review.md`
- `https://securitylab.github.com/research/github-actions-preventing-pwn-requests/`

## 成果物

- `outputs/phase-6/main.md`
- `outputs/phase-6/failure-cases.md`

## 統合テスト連携

failure-cases.md は dry-run 実走（後続実装タスク）が陥穽を漏れなく検査するための観点表として機能する。本タスクでは実コマンドを走らせない。

## 完了条件

- [ ] failure-cases.md に FC-1〜FC-8 が列挙されている。
- [ ] 各 FC に静的 / 動的 / レビューの 3 検出手段が記述されている。
- [ ] MAJOR / MINOR の分類が固定されている。
- [ ] 回帰防止チェックリスト 5 項目が記述されている。
- [ ] レポート規約が記述されている。
- [ ] artifacts.json の Phase 6 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
