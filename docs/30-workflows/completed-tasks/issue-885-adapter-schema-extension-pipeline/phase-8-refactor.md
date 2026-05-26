# Phase 8: リファクタ

## 1. 本タスクでのリファクタ範囲

**なし**。本タスクは README 新規作成 + spec コメント追加に閉じており、`member-detail.ts` 本体は触らない。

## 2. リファクタ機会の記録（将来タスク向けメモ）

将来 schema 拡張時に検討すべき項目を README 末尾に書く案もあったが、scope creep を避けるため本 README には**含めない**。代わりに以下を本仕様書内のメモとして残す（コード反映はしない）:

| 項目 | 内容 | 起票判断 |
|---|---|---|
| `normalizeField` / `normalizeSection` の generics 化 | 第 2 の adapter が追加されたら共通化候補 | 今回は不要（rule of three）|
| `FieldKindZ.safeParse` の error path を logger に渡す | dev 環境で warn を出して unknown kind を可視化 | serial-06-followup-002（別 issue）で扱う |
| `MemberDetail` primitive の strict zod 必須を緩和 | adapter 出力をそのまま受け取れるよう primitive 側 type を緩める | 大規模変更のため別 issue 起票が必要 |

## 3. 不変条件の維持確認

リファクタなしのため、不変条件は serial-06 完了時点と同一。確認のみ:

- visibility filter（`visibility !== "public"` 除外）
- unknown kind silent skip
- 入力 mutate 禁止
- 出力からの `visibility` / `source` 除外（sanitize）
- `MemberDetail` 側で `toLegacySections` による literal 復元
