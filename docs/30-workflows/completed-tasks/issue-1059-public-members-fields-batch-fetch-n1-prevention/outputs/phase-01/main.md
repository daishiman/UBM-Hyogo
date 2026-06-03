# Phase 1 成果物: 要件定義

詳細は `../../phase-01.md` を正本とする。

## 確定事項
- 問題: `apps/api/src/use-cases/public/list-public-members.ts:94-121` の per-member `listFieldsByResponseId` ループ = fields N+1。
- 方針: `response_id IN (...)` の 1 batch query へ置換（tags 側 `listTagsByMemberIds` と対称）。
- F-1: helper シグネチャ・返り値型を実ファイルから verbatim 確認済み（単数 `listFieldsByResponseId` のみ存在、batch 版未実装）。
- F-2: groupBy キー = `current_response_id`(=`response_id`)。tags の `member_id` と異なる。
- 種別: implementation / NON_VISUAL / implementation_mode: new。
- AC-1〜AC-6 を index.md と一致で固定。4 条件全 PASS。
