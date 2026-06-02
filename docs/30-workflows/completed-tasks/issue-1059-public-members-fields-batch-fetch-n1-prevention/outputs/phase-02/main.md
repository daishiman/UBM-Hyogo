# Phase 2 成果物: 設計

詳細は `../../phase-02.md` を正本とする。

## 確定事項
- repository: `listFieldsByResponseIds(c, rids: ResponseId[]): Promise<ResponseFieldRow[]>` を追加（空配列ガード → `placeholders` で IN 句 → フラット配列返却）。
- use-case: ループ外で 1 query 取得 → `Map<string, ResponseFieldRow[]>`（key=`response_id`）に groupBy → per-member は Map lookup（`?? []`）。
- 不変範囲: `byKey` 構築以降（SUMMARY_KEYS フィルタ / parseJson* / items.push / tags 合流）は変更しない。
- 再利用: `placeholders` / `asResponseId` / `ResponseFieldRow` / `listTagsByMemberIds` パターン。
- エッジケース（空 / fields 0 件 / 重複）は before と同値。
