# Phase 4 成果物: テスト作成（TDD Red -> Green）

詳細は `../../phase-04.md` を正本とする。

## 確定事項
- repository テスト: `listFieldsByResponseIds`（空配列→[]、複数 response_id でフラット配列）を GREEN 化済み。
- use-case 回帰テスト: `listFieldsByResponseIds` を spy し呼び出し回数=1（fields クエリ ≦ 1 / AC-3）、複数 member の値が正しく引き当たる（F-2）、出力 `PublicMemberListResponse` の形状・値が既存一致（AC-4）。
- mock 戦略: `public-d1.ts` の `response_id IN` dispatch + queryLog、repository 関数 spy。
- current evidence: use-case 10 PASS、repository 5 PASS。
