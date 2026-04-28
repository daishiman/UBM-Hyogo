# Phase 3: 設計レビュー

## レビュー結論: PASS（Phase 4 へ進行可）

## チェック観点と判定
| 観点 | 不変条件 | 判定 | コメント |
| --- | --- | --- | --- |
| D1 boundary | #5 | PASS | repository は `apps/api/src/repository/` 配下に閉じる |
| tag 直接編集禁止 | #13 | PASS | `tagDefinitions.ts` に write API 不在、`tagQueue.transitionStatus` で resolve 経路強制 |
| schema 集約 | #14 | PASS | schema 系 3 ファイルが単一 source |
| attendance 制約 | #15 | PASS | PK 制約で重複阻止、`listAttendableMembers` で is_deleted 除外 |
| 無料枠 | — | PASS | LIMIT/OFFSET + 全クエリで index 利用 |
| 02a / 02c 分離 | — | PASS | dep-cruiser ルールで強制 |

## オープン事項
なし。Phase 4 のテスト戦略へ。
