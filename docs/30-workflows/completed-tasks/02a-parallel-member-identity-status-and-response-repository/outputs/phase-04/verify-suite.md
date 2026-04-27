# テスト検証スイート

## 実行コマンド

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260427-133024-wt-2
mise exec -- pnpm test --reporter=verbose 2>&1 | tail -100
```

## テストスイート一覧

### suite-01: branded types
- `brand.test.ts`: MemberId/ResponseId/StableKey の相互代入不可

### suite-02: members repository
- `members.test.ts`: findMemberById（存在/非存在）, listMembersByIds, upsertMember（insert/update）

### suite-03: identities repository
- `identities.test.ts`: findIdentityByEmail, findIdentityByMemberId, updateCurrentResponse

### suite-04: status repository
- `status.test.ts`: getStatus, setConsentSnapshot, setPublishState, setDeleted（deleted_members への INSERT も確認）

### suite-05: responses repository
- `responses.test.ts`: findResponseById, findCurrentResponse, listResponsesByEmail（ページネーション）, upsertResponse

### suite-06: response sections
- `responseSections.test.ts`: listSectionsByResponseId

### suite-07: response fields
- `responseFields.test.ts`: listFieldsByResponseId

### suite-08: field visibility
- `fieldVisibility.test.ts`: listVisibilityByMemberId, setVisibility（insert/update）

### suite-09: member tags (read-only)
- `memberTags.test.ts`: listTagsByMemberId, listTagsByMemberIds

### suite-10: view builder
- `builder.test.ts`:
  - deleted member → null
  - non-consented member → not in list
  - admin-only field → excluded from public profile
  - adminNotes argument separation
