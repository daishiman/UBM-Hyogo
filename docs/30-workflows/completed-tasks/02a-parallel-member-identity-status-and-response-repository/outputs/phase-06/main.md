# Phase 6: 異常系検証

## 検証結果

テスト実行（vitest）により、以下の異常系を網羅的に検証した。

## 異常系テストケース一覧

| 検証項目 | テストファイル | 結果 |
|---------|--------------|------|
| 存在しない member_id で null を返す | members.test.ts | PASS |
| 存在しない response_id で null を返す | responses.test.ts | PASS |
| 存在しない email で null を返す | identities.test.ts | PASS |
| is_deleted=1 の会員の PublicMemberProfile が null | builder.test.ts | PASS |
| public_consent != 'consented' の会員が null | builder.test.ts | PASS |
| publish_state != 'public' の会員が null | builder.test.ts | PASS |
| 空の member_id 配列で空配列を返す | members.test.ts | PASS |
| 存在しない response_id でセクション空配列 | responseSections.test.ts | PASS |
| 存在しない response_id でフィールド空配列 | responseFields.test.ts | PASS |
| 存在しない member_id で可視性空配列 | fieldVisibility.test.ts | PASS |
| 存在しない member_id でタグ空配列 | memberTags.test.ts | PASS |

## 境界条件

failure-cases.md 参照
