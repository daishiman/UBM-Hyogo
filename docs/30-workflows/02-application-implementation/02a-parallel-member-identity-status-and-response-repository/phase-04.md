# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-identity-status-and-response-repository |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 3 (設計レビュー) |
| 下流 | Phase 5 (実装ランブック) |
| 状態 | pending |

## 目的

実装より先に **テストの形** を確定し、AC-1〜AC-8 を verify suite として定義する。実装 Phase 5 でテストファースト着手を可能にする。

## verify suite 構成

### 1. unit test（vitest）

| ファイル | 対象 | 目的 |
| --- | --- | --- |
| `members.test.ts` | members.ts | findMemberById / listMembersByIds の戻り値 shape |
| `identities.test.ts` | identities.ts | findIdentityByEmail / updateCurrentResponse の整合 |
| `status.test.ts` | status.ts | setConsentSnapshot / setPublishState / setDeleted の更新 |
| `responses.test.ts` | responses.ts | findCurrentResponse の解決ロジック、upsertResponse の idempotency |
| `responseSections.test.ts` / `responseFields.test.ts` | sections.ts / fields.ts | 正規化済み構造体取得 |
| `fieldVisibility.test.ts` | visibility.ts | listVisibilityByMemberId, setVisibility (member self-service) |
| `memberTags.test.ts` | tags.ts | read-only 動作確認、write API 不在の確認（型エラー） |
| `builder.test.ts` | builder.ts | fixture から PublicMemberProfile / MemberProfile / AdminMemberDetailView の組み立て |
| `brand.test.ts` | brand.ts | `MemberId` / `ResponseId` の相互代入が **TypeScript コンパイルエラー** になる test |

### 2. contract test（zod parse）

| 対象 | 検証内容 |
| --- | --- |
| `buildPublicMemberProfile` の戻り値 | `PublicMemberProfileSchema.parse()` が pass |
| `buildMemberProfile` の戻り値 | `MemberProfileSchema.parse()` が pass、`responseEmail` / `rulesConsent` が含まれる |
| `buildAdminMemberDetailView` の戻り値 | `AdminMemberDetailViewSchema.parse()` が pass、`adminNotes` が含まれる |
| `buildPublicMemberListItems` の戻り値 | items 各要素が `PublicMemberListItemSchema.parse()` を pass |

### 3. authorization / boundary test

| シナリオ | 期待動作 |
| --- | --- |
| `is_deleted = 1` の member を `buildPublicMemberProfile` で取得 | `null` を返す |
| `public_consent != 'consented'` の member を list query で取得 | items に含まれない |
| `publish_state = 'hidden'` または `'member_only'` の member を public list で取得 | items に含まれない |
| `member_field_visibility.visibility = 'admin'` の field を `buildPublicMemberProfile` の sections に含める | 含まれない |
| `member_field_visibility.visibility = 'member'` の field を `buildPublicMemberProfile` の sections に含める | 含まれない |
| `member_field_visibility.visibility = 'public'` の field を `buildMemberProfile` の sections に含める | 含まれる（member は public + member の上位互換） |
| `adminNotes` を `PublicMemberProfile` / `MemberProfile` 型に代入 | TypeScript コンパイルエラー |

### 4. type test（tsd / vitest type-only）

| 対象 | 期待 |
| --- | --- |
| `const m: MemberId = "abc" as ResponseId` | コンパイルエラー |
| `const r: ResponseId = "abc" as MemberId` | コンパイルエラー |
| `findCurrentResponse(c, "raw_string")` | コンパイルエラー（`MemberId` が必要） |
| `(p: PublicMemberProfile).adminNotes` | プロパティ存在しないエラー |

### 5. fixture / in-memory D1

```ts
// __fixtures__/members.fixture.ts
export const fixtureMembers: NewMemberRow[] = [
  { memberId: memberId("m_001"), responseEmail: "alice@example.com", ... },
  { memberId: memberId("m_002"), responseEmail: "bob@example.com", ... },
  // 削除済み
  { memberId: memberId("m_003"), responseEmail: "carol@example.com", ... },
];

export const fixtureStatus: NewMemberStatusRow[] = [
  { memberId: memberId("m_001"), publicConsent: "consented", rulesConsent: "consented", publishState: "public", isDeleted: false },
  { memberId: memberId("m_002"), publicConsent: "declined", rulesConsent: "consented", publishState: "member_only", isDeleted: false },
  { memberId: memberId("m_003"), publicConsent: "consented", rulesConsent: "consented", publishState: "public", isDeleted: true },
];

// in-memory D1 setup（miniflare or @miniflare/d1）
export const setupD1 = async () => {
  const db = await createInMemoryD1();
  await db.exec(loadMigrations()); // 01a の migration を流す
  await seedMembers(db, fixtureMembers);
  await seedStatus(db, fixtureStatus);
  return db;
};
```

## verify suite と AC のマッピング

| AC | 検証 test | ファイル |
| --- | --- | --- |
| AC-1 (8 repo unit test pass) | unit test 8 種 | *.test.ts |
| AC-2 (3 view 組み立て) | builder.test.ts | builder.test.ts |
| AC-3 (`MemberId` ≠ `ResponseId` 型エラー) | type test | brand.test.ts |
| AC-4 (deleted / consent != consented を public から除外) | boundary test | builder.test.ts (boundary section) |
| AC-5 (admin field を public/member から除外) | boundary test | builder.test.ts (visibility section) |
| AC-6 (`memberTags` write 不在) | type test | memberTags.test.ts |
| AC-7 (N+1 防止) | query count assertion | builder.test.ts (N+1 section) |
| AC-8 (02b/02c 相互 import ゼロ) | dependency-cruiser CI | depcruise.config.cjs |

## 実行タスク

1. verify suite 表を `outputs/phase-04/verify-suite.md` に作成
2. AC マッピング表を `outputs/phase-04/main.md` に作成
3. fixture file 構造案を verify-suite.md に貼る
4. dependency-cruiser ルール案を verify-suite.md に貼る
5. type test の TS snippet を貼る

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 3 outputs/phase-03/main.md | 採用案 A |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | view model 型 |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | 公開条件（is_deleted/consent/publishState） |
| 参考 | doc/02-application-implementation/01b-parallel-zod-view-models-and-google-forms-api-client/ | zod schema |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | verify suite を実装 Phase の到達目標に |
| Phase 6 | 異常系を verify suite から派生 |
| Phase 7 | AC matrix の検証列に流用 |
| Phase 8 | DRY 化対象を test 重複から検出 |
| 08a (下流 task) | repository contract test を継承 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 本人本文 immutable | #4 | responses.test.ts に partial update test を**書かない** |
| D1 boundary | #5 | dependency-cruiser ルールが `apps/web` → `apps/api/repository` を error |
| 型混同防止 | #7 | brand.test.ts に「**コンパイルエラーになるべき**」コメント付き snippet |
| admin 本文編集禁止 | #11 | responses.test.ts に admin 用 setter test がない |
| view model 分離 | #12 | builder.test.ts で `PublicMemberProfile` に `adminNotes` が無い assertion |
| 無料枠 | #10 | builder.test.ts に query count assertion（N+1 排除） |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | unit test 一覧 | 4 | pending | 9 ファイル |
| 2 | contract test 一覧 | 4 | pending | 4 builder |
| 3 | authz/boundary test | 4 | pending | 7 シナリオ |
| 4 | type test snippet | 4 | pending | 4 ケース |
| 5 | fixture 構造 | 4 | pending | 削除済 / consent declined を含む |
| 6 | AC マッピング | 4 | pending | AC-1〜AC-8 |
| 7 | dependency-cruiser config | 4 | pending | 02b/02c 相互禁止 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | AC-test マッピング + 戦略概要 |
| ドキュメント | outputs/phase-04/verify-suite.md | verify suite 詳細 + fixture + dep-cruiser |

## 完了条件

- [ ] verify suite 表が AC-1〜AC-8 を網羅
- [ ] type test が 4 ケース以上定義
- [ ] fixture が削除済 / consent declined を含む
- [ ] dependency-cruiser ルール案が pseudo config で書かれている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜7 が completed
- [ ] outputs/phase-04/{main,verify-suite}.md が配置済み
- [ ] AC-1〜AC-8 全てに対応 test がマップ
- [ ] artifacts.json の Phase 4 を completed に更新

## 次 Phase

- 次: Phase 5 (実装ランブック)
- 引き継ぎ事項: verify suite / fixture 構造
- ブロック条件: 任意の AC が test なしの場合 Phase 5 に進めない
