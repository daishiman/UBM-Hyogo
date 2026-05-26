# Unassigned Task Detection

## Result

1 unassigned task (current).

## current

| taskId | 分類 | 優先度 | 発見元 | 配置先 |
| ------ | ---- | ------ | ------ | ------ |
| issue-827-followup-001-displayable-kinds-exhaustiveness-guard | ref | low | Phase 9 R-01（独立精査） | `docs/30-workflows/unassigned-task/issue-827-followup-001-displayable-kinds-exhaustiveness-guard.md` |

R-01（`DISPLAYABLE_KINDS` allowlist が `FieldKindZ` enum 拡張に追従しない silent-skip リスク）の緩和策は「enum 変更時に adapter test を人手で更新」という規律依存であり、型/CI レベルの保証がない。これを exhaustiveness ガード（`satisfies Record<FieldKind, KindRoute>` + 網羅テスト）として formalize した。本サイクルでは実装せず未タスク化する（low priority・要件発生待ち）。

## baseline

本サイクルで完了した gap（未タスクではない）:

- adapter source と unit test
- component の責務削減
- page wiring
- specs の schema vocabulary 修正
- Phase 12 strict 7 と aiworkflow sync

## 関連タスク差分確認

- 既存 `docs/30-workflows/unassigned-task/` に `FieldKind` / `DISPLAYABLE_KINDS` 網羅性ガード系の重複タスクなし。新規起票で重複は発生しない。

## 注記

commit / push / PR / issue mutation / deployment verification は user-gated operation であり、未タスク（実装タスク）ではない。
