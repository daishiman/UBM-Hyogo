# 受け入れ条件マトリクス

| AC ID | 条件 | テストケース | 結果 |
|-------|------|------------|------|
| AC-01 | 全リポジトリ関数が vitest でテスト済み | 全 __tests__/ | PASS |
| AC-02 | 型チェックがエラーなしで通過 | pnpm typecheck | PASS |
| AC-03 | MemberId と ResponseId が型レベルで相互代入不可 | brand.test.ts | PASS |
| AC-04 | is_deleted=1 の会員の PublicMemberProfile が null | builder.test.ts | PASS |
| AC-05 | public_consent != 'consented' がパブリックリストに含まれない | builder.test.ts | PASS |
| AC-06 | visibility='admin' フィールドが PublicMemberProfile に含まれない | builder.test.ts | PASS |
| AC-07 | adminNotes が PublicMemberProfile に含まれない | builder.test.ts | PASS |
| AC-08 | member_identities upsert が冪等 | members.test.ts | PASS |
| AC-09 | member_status setDeleted が deleted_members に記録 | status.test.ts | PASS |
| AC-10 | responses upsert が partial update を提供しない | responses.ts（設計） | PASS |
| AC-11 | memberTags に write API が存在しない | memberTags.ts（設計） | PASS |
| AC-12 | D1 boundary: repository は apps/api のみ | ディレクトリ構造 | PASS |

## 不変条件対応状況

| 不変条件 | 内容 | 対応 |
|---------|------|------|
| #4 | 本人本文は Form 再回答が正本 | responses.ts に partial update なし |
| #5 | D1 境界 | apps/api/src/repository/ のみ |
| #7 | 型混同防止 | branded type 使用 |
| #11 | admin 本文編集禁止 | setPublishState/setDeleted のみ |
| #12 | adminNotes 分離 | builder.ts で引数受け取り |
