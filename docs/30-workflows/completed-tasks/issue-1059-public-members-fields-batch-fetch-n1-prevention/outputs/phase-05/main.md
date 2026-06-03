# Phase 5 成果物: 実装

詳細は `../../phase-05.md` を正本とする。

## 確定事項（実装ランブック）
- responseFields.ts: `listFieldsByResponseIds` 追加 + `import { placeholders } from "./_shared/sql";`。単数 helper は温存。
- list-public-members.ts: import 変更（listFieldsByResponseIds / ResponseFieldRow / asResponseId）→ ループ外 1 query → Map(key=response_id) groupBy → per-member lookup。byKey 以降不変。
- 検証: typecheck / lint / 対象 vitest / 単数 helper 残存 grep / apps/web 差分 0。
