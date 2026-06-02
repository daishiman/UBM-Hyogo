# Phase 8 成果物: リファクタリング

> 本成果物は `docs/30-workflows/completed-tasks/issue-1059-public-members-fields-batch-fetch-n1-prevention/phase-08.md` を
> 正本とする。本ファイルは確定事項の要約であり、仕様の差分が生じた場合は phase-08.md を優先する。

## 確定事項の要約

- 新規抽象化（汎用 groupBy ユーティリティ等）は導入しない。既存 tags batch（issue-224）と同型の
  「ループ外 1 query → `Map` groupBy → per-member lookup」へ揃えるのみ。
- 変更は `対象 / Before / After / 理由` テーブル（RT-03）で記録する。
- `byKey` 構築以降のロジックは AC-4（出力不変）保護のため一切変更しない。

## 変更記録（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| use-case の response_id 渡し | `m.current_response_id as never` | `asResponseId(m.current_response_id)`（ループ外で `responseIds: ResponseId[]` 構築） | `as never` を全廃し `asResponseId` で型安全化 |
| fields 取得経路 | per-member ループ内 `await listFieldsByResponseId(...)`（N+1） | ループ外 `listFieldsByResponseIds(ctx, responseIds)` + `Map<string, ResponseFieldRow[]>`（key=`response_id`）groupBy | N+1 を 1 query 化・tags batch と同型化 |
| 変数命名 | per-member の `fields` | `fieldsByResponseId`（Map）/ `responseIds`（配列） | tags 側 `tagsByMember` / `memberIds` と対称化 |
| per-member lookup | その member 専用取得結果 | `fieldsByResponseId.get(m.current_response_id) ?? []` | `byKey` 以降を不変に保ち供給元のみ差替え |

## 整合観点

- 重複削減: tags batch と fields batch が同一構造で 1 パターンとして理解可能。
- 命名整合: 配列 = `responseIds` / Map = `fieldsByResponseId`。
- 型安全化: `as never` 全廃 → `asResponseId`。
- helper シグネチャ: `listFieldsByResponseIds(c, rids: ResponseId[]): Promise<ResponseFieldRow[]>` を
  `listTagsByMemberIds` と同型に保つ。

## 検証

- `grep -n "as never" apps/api/src/use-cases/public/list-public-members.ts` → 0 件。
- リファクタ後に対象 2 spec を再実行し緑維持。
