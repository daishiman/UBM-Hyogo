# Phase 4: テスト戦略

## テスト方針

- フレームワーク: Vitest
- 環境: jsdom（D1 は MockD1 でモック）
- テストファイル配置: `apps/api/src/repository/__tests__/`

## テストカバレッジ対象

| テストファイル | テスト内容 |
|--------------|-----------|
| `brand.test.ts` | MemberId と ResponseId が型レベルで相互代入不可 |
| `members.test.ts` | findMemberById, listMembersByIds, upsertMember |
| `identities.test.ts` | findIdentityByEmail, findIdentityByMemberId, updateCurrentResponse |
| `status.test.ts` | getStatus, setConsentSnapshot, setPublishState, setDeleted |
| `responses.test.ts` | findResponseById, findCurrentResponse, listResponsesByEmail, upsertResponse |
| `responseSections.test.ts` | listSectionsByResponseId |
| `responseFields.test.ts` | listFieldsByResponseId |
| `fieldVisibility.test.ts` | listVisibilityByMemberId, setVisibility |
| `memberTags.test.ts` | listTagsByMemberId, listTagsByMemberIds |
| `builder.test.ts` | buildPublicMemberProfile, buildMemberProfile, buildAdminMemberDetailView, buildPublicMemberListItems |

## 重要テストケース

### brand.test.ts
```typescript
it("MemberId と ResponseId は相互代入不可（型レベルで防止）", () => {
  const m = asMemberId("m_001");
  const r = asResponseId("r_001");
  // @ts-expect-error
  const _wrongM: MemberId = r;
  // @ts-expect-error
  const _wrongR: ResponseId = m;
});
```

### builder.test.ts
1. `is_deleted=1` の member → `buildPublicMemberProfile` → `null`
2. `public_consent!='consented'` の member → パブリックリスト → 含まれない
3. `visibility='admin'` のフィールド → `PublicMemberProfile` → 含まれない
4. `adminNotes` は `buildAdminMemberDetailView` の引数で受け取り、`PublicMemberProfile` には含まれない

## モック戦略

MockD1: SQL クエリを文字列パターンマッチングで解析し、事前セットされたデータを返す。
完全な SQL パーサーは不要で、テストに必要なクエリパターンのみサポート。
