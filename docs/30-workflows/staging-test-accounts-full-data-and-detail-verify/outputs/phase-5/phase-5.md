# Phase 5: 実装

[実装区分: 実装仕様書] / Task: TASK-STAGING-TEST-ACCOUNTS-FULL-DATA-001

> Phase 4 で Red にしたテストを Green にする実装。Lane A（apps/api・主作業＝データ拡充）→ Lane B（apps/web・検証主体 + 最小ギャップ修正）→ 生成物再生成 → validation の順で進める。

## 5.0 実装着手前に必ず読むファイル（推測禁止）

| ファイル | 確認点 |
|----------|--------|
| `apps/api/src/testing/test-accounts/catalog.ts` | `TestMemberAccount.profile?: Readonly<Record<string, string \| null>>`（L23）。各 member の現状 profile（01 のみフル、06 は最小）。 |
| `apps/api/src/testing/test-accounts/build-seed-sql.ts` | `RESPONSE_FIELD_KEYS`（L32-59・31 キー固定リスト）/ `answersFor`（L79-85）/ `responseFieldRows`（L90-101・`Object.hasOwn` でフィルタ）。 |
| `packages/shared/src/zod/field.ts` | `STABLE_KEY`（L70-）31 種。member: birthDate(L74)/ubmJoinDate(L79)/challenges(L82)。admin: publicConsent(L100)/rulesConsent(L101)。 |
| `apps/web/src/lib/adapters/member-detail.ts` | `HERO_KEYS`/`BUSINESS_KEYS`/`PERSONAL_KEYS`/`MESSAGE_KEYS`/`ASSIGNED_DETAIL_KEYS`、`PERSONAL_KEYS` の null fallback（L270-280）。 |

## 5.1 変更対象ファイル一覧（CONST_005・index.md 準拠）

| パス | 種別 | レーン | 役割 |
|------|------|--------|------|
| `apps/api/src/testing/test-accounts/catalog.ts` | 編集 | A | TEST-MEM-01..10 の `profile` を表示バリエーション・マトリクス通りに拡充 |
| `apps/api/src/testing/test-accounts/build-seed-sql.ts` | **無変更見込み** | A | §5.3 で確認。member 固有ハードコードは無く `profile` 全キーを `RESPONSE_FIELD_KEYS` でフィルタする汎用構造のため、原則編集不要 |
| `apps/api/migrations/seed/test-accounts-seed.sql` | 再生成（生成物） | A | gen-test-accounts-seed.mjs で上書き |
| `apps/api/migrations/seed/test-accounts-cleanup.sql` | 再生成（生成物） | A | 同上 |
| `apps/api/migrations/seed/test-accounts.manifest.json` | 再生成（生成物） | A | 同上 |
| `apps/api/src/testing/test-accounts/__tests__/catalog.spec.ts` | 編集 | A | Phase 4 §4.1 のケース追加 |
| `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts` | 編集 | A | Phase 4 §4.2 のケース追加 |
| `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts` | 編集 | A | Phase 4 §4.3 のケース追加 |
| `apps/web/src/lib/adapters/member-detail.ts` | **編集はギャップ時のみ** | B | §5.4 検証。漏れ発見時のみ最小修正 |
| `apps/web/src/components/public/*.tsx` | **編集はギャップ時のみ** | B | 全項目入力描画崩れ発見時のみ最小修正 |
| `apps/web/src/fixtures/public-member-profile.ts` | 編集（追加 export） | B | full/all-fields/edge fixture を追加 |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | 編集 | B | Phase 4 §4.4 のケース追加 |

> 新規ファイルは原則なし。新規 primitive / 新規 HEX / 新規 endpoint は禁止（不変条件 #5・UI prototype alignment #1/#3）。

## 5.2 Lane A: catalog.ts の profile 拡充手順

各 member の `profile` を以下マトリクスで埋める。**キーは必ず `STABLE_KEY.xxx` 経由**（不変条件 #7）。`fullName/occupation/ubmZone` はトップレベルにあるため profile には書かない（`answersFor` が自動合流）。

### 充填マトリクス（表示バリエーション正本）

| member | 充填レベル | profile に入れるキー | 意図 |
|--------|-----------|----------------------|------|
| TEST-MEM-01 | **フル**（既存・概ね充足） | 既存の nickname..selfIntroduction（26 public のうち多数）に **不足分（birthDate/ubmJoinDate/challenges + 不足 SNS）を追補** | 理想会員・全項目フル |
| TEST-MEM-06 | **フル**（最重要・ユーザー目視対象） | public 26 全 + member/admin 3（birthDate/ubmJoinDate/challenges）| ユーザー参照ページ。全項目フル描画 |
| TEST-MEM-07 | **フル + タグ多数**（タグは既存 6 件で充足） | public 26 全 + member/admin 3 | タグ密集 + 全項目 |
| TEST-MEM-09 | **全項目入力** | 必須（nickname/location/hometown/ubmMembershipType/businessOverview/skills/canProvide/selfIntroduction）+ SNS は **urlWebsite のみ** + **motto/hobbies/recentInterest/otherActivities を意図的に省く** | 全項目入力描画（personal fallback / `links` 1 件）検証 |
| TEST-MEM-10 | **エッジ** | public 26 全（**businessOverview は 120 字超の長文日本語**・**selfIntroduction に絵文字 `🌊⚓️`**・**urlOthers 等に `%#&<>` 特殊文字**・**全 URL 系 11 キー埋め**）+ member/admin 3 | 長文/絵文字/特殊文字/全 SNS 堅牢性 |
| TEST-MEM-02 | 中 | 必須 + businessOverview/selfIntroduction + 主要 optional 数件 | declined-public のデータ（/profile 確認） |
| TEST-MEM-03 | 中 | 同上 | hidden のデータ |
| TEST-MEM-04 | 中 | 同上 | gating 維持下のデータ |
| TEST-MEM-05 | 中 | 同上 | deleted のデータ |
| TEST-MEM-08 | 中 | 同上 | unknown-consent のデータ |

### 実コード例（TEST-MEM-06・フル・実 stable_key 経由）

`catalog.ts` の TEST-MEM-06 ブロック（現状 L197-211・profile 無し）へ `profile` を追加する。

```ts
{
  memberId: "TEST-MEM-06",
  responseId: "TEST-RES-06",
  email: email("test-mem-06"),
  fullName: "[TEST] 最小公開 六郎",   // 表示名は既存維持（[TEST] prefix 不変）
  occupation: "製造",
  ubmZone: "Awaji",                    // 既存維持
  publicConsent: "consented",
  rulesConsent: "consented",
  publishState: "public",
  isDeleted: false,
  notificationOptOut: false,
  profile: {
    [STABLE_KEY.nickname]: "ろくちゃん",
    [STABLE_KEY.location]: "兵庫県淡路市",
    [STABLE_KEY.birthDate]: "1985-07-07",          // member 可視性（answers_json のみ・response_fields に出ない）
    [STABLE_KEY.hometown]: "兵庫県洲本市",
    [STABLE_KEY.ubmMembershipType]: "member",
    [STABLE_KEY.ubmJoinDate]: "2023-04",            // member 可視性（answers_json のみ）
    [STABLE_KEY.businessOverview]:
      "淡路島で精密部品の製造業を営んでいます。小ロット試作から量産まで一貫対応します。",
    [STABLE_KEY.skills]: "機械設計、CAD、原価計算",
    [STABLE_KEY.challenges]: "DX 人材の採用に悩んでいます",  // member 可視性（answers_json のみ）
    [STABLE_KEY.canProvide]: "ものづくり全般の相談、工場見学の受け入れ",
    [STABLE_KEY.hobbies]: "釣り、キャンプ",
    [STABLE_KEY.recentInterest]: "生成AIの製造現場活用",
    [STABLE_KEY.motto]: "段取り八分",
    [STABLE_KEY.otherActivities]: "地元商工会青年部で地域活性に取り組んでいます。",
    [STABLE_KEY.urlWebsite]: "https://example.test/test-mem-06",
    [STABLE_KEY.urlFacebook]: "https://facebook.com/test.mem.06",
    [STABLE_KEY.urlInstagram]: "https://instagram.com/test.mem.06",
    [STABLE_KEY.urlThreads]: "https://threads.net/@test.mem.06",
    [STABLE_KEY.urlYoutube]: "https://youtube.com/@test-mem-06",
    [STABLE_KEY.urlTiktok]: "https://www.tiktok.com/@test.mem.06",
    [STABLE_KEY.urlX]: "https://x.com/test_mem_06",
    [STABLE_KEY.urlBlog]: "https://blog.example.test/test-mem-06",
    [STABLE_KEY.urlNote]: "https://note.com/test_mem_06",
    [STABLE_KEY.urlLinkedin]: "https://www.linkedin.com/in/test-mem-06",
    [STABLE_KEY.urlOthers]: "Podcast: https://podcast.example.test/test-mem-06",
    [STABLE_KEY.selfIntroduction]:
      "淡路島から、ものづくりで地域を元気にします。よろしくお願いします。",
  },
  tags: [],          // 既存維持（または表示確認用に最小付与可。マトリクスはタグ多数を 07 が担う）
  attendance: [],    // 既存維持
}
```

> **member/admin 項目の扱い（重要）**: birthDate/ubmJoinDate/challenges を profile に入れても、`build-seed-sql.ts` の `RESPONSE_FIELD_KEYS`（31 キー）に含まれないため `response_fields` 行にはならず、`answers_json` のみに入る。これが「データ投入はするが公開ページに漏れない」構造的二重防御（AC-3 / AC-5 を同時達成）。consent（publicConsent/rulesConsent）は profile に入れない（既存どおりトップレベル → `member_status` に投入される。不変条件 #4）。

### TEST-MEM-09（全項目入力）・TEST-MEM-10（エッジ）の差分指針

- **09**: `motto`/`hobbies`/`recentInterest`/`otherActivities` を **profile から省略**（`undefined`）。SNS は `urlWebsite` のみ。→ adapter で personal が `value:null` fallback、`links` が 1 件、business は present。
- **10**: `businessOverview` を 120 字超の長文に、`selfIntroduction` に絵文字、`urlOthers` に `%#&<>` を含める。URL 系 11 キー全て埋める。`fullName`（トップレベル）の既存エッジ（`'` + 😀）は維持。

### 既存 TEST-MEM-01 への追補

01 は既に public 群の多くを持つ（L102-131）。**不足分のみ追補**: `birthDate`/`ubmJoinDate`/`challenges`（member/admin データ）と、欠けている SNS（`urlThreads` 等は既にある。差分確認の上、`RESPONSE_FIELD_KEYS` の URL 系 11 キーを全て満たす）。`ubmMembershipType` は 01 に既存（L106）。

## 5.3 Lane A: build-seed-sql.ts 確認（汎用性の検証・原則無変更）

Phase 4 §4.0 で確定済の通り、`responseFieldRows`（L90-101）は **全 member を `flatMap` し、`RESPONSE_FIELD_KEYS` を `Object.hasOwn(answers, key)` でフィルタ**して行生成する。member 固有のハードコードは無い。よって:

- **profile を 10 件全てに与えれば、追加コード無しで全 member の response_fields が生成される**（TEST-MEM-01 で成立済の挙動が 9 件へ自動展開）。
- `RESPONSE_FIELD_KEYS` に member/admin キーは無いため、それらは自動的に response_fields から除外される（編集不要）。
- **build-seed-sql.ts は無変更が正**。万一 Phase 6 等で「public キーの追加表示が必要」と判明した場合のみ、`RESPONSE_FIELD_KEYS` への追記で対応（本タスクのスコープ外＝発生しない見込み。発生時は別 PR）。

## 5.4 Lane B: 公開詳細ページ検証（verify_existing 主体）+ 最小ギャップ修正

### 検証フロー（実装ではなく確認が主作業）

1. `member-detail.ts` の adapter が full fixture で visibility=public 全 26 項目を `sections`（hero/business/personal/message）+ `linkSections`（SNS）+ `other`（未割当 public）に割当することを spec で確認。
2. all-fields fixture（09 相当）で `personal` の欠落キーが `value:null` fallback（L270-280）になり行が消えないこと、`business` 空文字が破綻しないことを確認。
3. edge fixture（10 相当）で長文 wrap・特殊文字・全 SNS pill 生成を確認。

### ギャップ修正方針（**発見時のみ・最小差分**）

- 表示漏れ（あるはずの public 項目がどの section にも出ない）→ `member-detail.ts` の `HERO_KEYS`/`BUSINESS_KEYS`/`PERSONAL_KEYS`/`MESSAGE_KEYS` 割当 or `buildOtherSections`（L217-228）の other fallback で拾う最小修正。
- 全項目入力の見た目崩れ → 公開コンポーネント（`PersonalSection`/`MessageCard`/`BusinessOverviewSection` 等）で既存トークン・既存クラスのみで条件付き描画を調整。
- **新規 primitive・新規 HEX・新規 endpoint は作らない**（不変条件 #5）。HEX 直書き禁止・OKLch トークンのみ（`verify-design-tokens` green 維持）。
- ギャップが無い場合は Lane B は「テスト追補 + fixture 追加 + 『ギャップなし』記録」に縮退（Phase 1 R2・正常な verify_existing 帰結）。

### fixture 更新（必須）

`apps/web/src/fixtures/public-member-profile.ts` へ `fullPublicMemberProfile` / `partialPublicMemberProfile` / `edgePublicMemberProfile` を **追加 export**（既存 `samplePublicMemberProfile` は変更しない＝既存 spec 保護）。3 つとも `PublicMemberProfileZ.parse` 通過・`STABLE_KEY` 経由。

## 5.5 生成物再生成（drift guard）

catalog.ts 編集後に必ず実行（contract.spec の byte 一致 it を Green にする）:

```bash
node --import tsx scripts/gen-test-accounts-seed.mjs
# → apps/api/migrations/seed/test-accounts-seed.sql / cleanup.sql / manifest.json を上書き
# 検証（drift 0 確認）:
node --import tsx scripts/gen-test-accounts-seed.mjs --check   # exit 0 を期待
```

## 5.6 実装順序（依存順）

1. catalog.ts の 10 member profile 拡充（§5.2）。
2. `node --import tsx scripts/gen-test-accounts-seed.mjs` で生成物再生成（§5.5）。
3. catalog.spec / build-seed-sql.spec / contract.spec を Green 化（Phase 4 §4.1-4.3）。
4. fixture 追加 + member-detail.spec 追補（§5.4 / Phase 4 §4.4-4.5）。Lane B ギャップ有無を確認、有れば最小修正。
5. validation lane（§5.7）。

## 5.7 検証コマンド（DoD）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
node --import tsx scripts/gen-test-accounts-seed.mjs --check
pnpm exec vitest run apps/api/src/testing/test-accounts --config=vitest.config.ts
pnpm exec vitest run apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts --config=vitest.d1.config.ts
pnpm exec vitest run apps/web/src/lib/adapters/__tests__/member-detail.spec.ts --config=vitest.config.ts
bash scripts/verify-pr-ready.sh
```

## 完了条件

1. catalog.ts の TEST-MEM-01..10 が充填マトリクス通りに `profile` を持ち（フル=01/06/07・全項目入力=09・エッジ=10・中=02/03/04/05/08）、キーは全て `STABLE_KEY` 経由で `pnpm typecheck` 通過。
2. build-seed-sql.ts は汎用構造を確認のうえ **無変更**（member 固有ハードコード無し・`RESPONSE_FIELD_KEYS` フィルタで全 member 展開）。
3. `gen-test-accounts-seed.mjs` 再生成結果が committed 生成物と byte 一致（`--check` exit 0）。
4. member/admin 項目（birthDate/ubmJoinDate/challenges）は answers_json に投入され response_fields に出る（公開漏洩なし）。consent は member_status のみ（不変条件 #4）。
5. Lane B は fixture full/all-fields/edge を追加 export し、adapter が全 public 項目描画 + 全項目保持 を満たすことを検証。ギャップは最小差分修正のみ（新規 primitive/HEX/endpoint 0）。
6. §5.7 の全コマンドが green。Phase 6（テスト拡充）へ進む。
