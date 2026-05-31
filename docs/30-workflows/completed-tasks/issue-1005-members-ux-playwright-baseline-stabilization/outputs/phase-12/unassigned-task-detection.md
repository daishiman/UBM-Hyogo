<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 12 -->

# Unassigned Task Detection — issue-1005-members-ux-playwright-baseline-stabilization

## 検出結果: 0 件

本タスクは 1 サイクルで完結する（CONST_007）。新規未タスクは検出されなかった。

## スコープ完結性の根拠

RC-1〜RC-4 はすべて 1 PR 内で完結する：

| ID | 対策 | 完結性 |
| --- | ---- | ------ |
| RC-1 | warm-up（config ready URL + spec beforeAll） | 同一 PR の config / spec 編集で完結 |
| RC-2 | path drift 補正（workflowRoot + env override + config EVIDENCE_DIR） | 同一 PR で完結 |
| RC-3 | evidence flag gating（単一 project 化） | 同一 PR の config 編集で完結 |
| RC-4 | runtime-notes 文言更新 | 同一 PR の spec 編集で完結 |

いずれも他タスクへの分割・先送りを要しない。

## scope-out 項目の扱い（別タスク化不要）

| 項目 | 扱い | 理由 |
| ---- | ---- | ---- |
| staging visual baseline 更新 | 別タスク化不要 | Gate-C（user-gated runtime ops）として本タスクの Gate に内包。新規タスク起票は不要 |
| Issue #1005 の state 変更 | 別タスク化不要 | user-gated 判断。コード作業ではない |
| `/members` API / UI component 変更 | 非スコープ | INV-1 / 既存実装維持。変更不要のため未タスクではない |

## 結論

未タスク **0 件**。新規 Issue 起票は不要。staging baseline 更新と Issue state 変更は
本タスク Gate-C の user-gated runtime ops に内包され、独立タスク化の必要はない。

## DoD

- [ ] 未タスク件数（0 件）が明記されている
- [ ] 0 件の根拠（1 サイクル完結 + scope-out の Gate 内包）が示されている
