# モジュールマップ

## リポジトリ層モジュール一覧

| モジュール | ファイルパス | 担当テーブル | 公開関数 |
|-----------|------------|-------------|---------|
| brand | `_shared/brand.ts` | - | re-export のみ |
| db | `_shared/db.ts` | - | `ctx()` |
| sql | `_shared/sql.ts` | - | `placeholders()` |
| builder | `_shared/builder.ts` | 複数 JOIN | `buildPublicMemberProfile`, `buildMemberProfile`, `buildAdminMemberDetailView`, `buildPublicMemberListItems` |
| members | `members.ts` | member_identities | `findMemberById`, `listMembersByIds`, `upsertMember` |
| identities | `identities.ts` | member_identities | `findIdentityByEmail`, `findIdentityByMemberId`, `updateCurrentResponse` |
| status | `status.ts` | member_status, deleted_members | `getStatus`, `setConsentSnapshot`, `setPublishState`, `setDeleted` |
| responses | `responses.ts` | member_responses | `findResponseById`, `findCurrentResponse`, `listResponsesByEmail`, `upsertResponse` |
| responseSections | `responseSections.ts` | response_sections | `listSectionsByResponseId` |
| responseFields | `responseFields.ts` | response_fields | `listFieldsByResponseId` |
| fieldVisibility | `fieldVisibility.ts` | member_field_visibility | `listVisibilityByMemberId`, `setVisibility` |
| memberTags | `memberTags.ts` | member_tags, tag_definitions | `listTagsByMemberId`, `listTagsByMemberIds` |

## インポート関係

```
builder.ts
  ├── members.ts
  ├── identities.ts
  ├── status.ts
  ├── responses.ts
  ├── responseSections.ts
  ├── responseFields.ts
  ├── fieldVisibility.ts
  └── memberTags.ts

各モジュール
  ├── _shared/brand.ts
  ├── _shared/db.ts
  └── _shared/sql.ts
```
