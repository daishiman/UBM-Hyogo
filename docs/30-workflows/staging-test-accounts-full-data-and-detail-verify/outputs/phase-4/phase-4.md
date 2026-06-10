# Phase 4: テスト作成（TDD Red）

[実装区分: 実装仕様書] / Task: TASK-STAGING-TEST-ACCOUNTS-FULL-DATA-001

> 本 Phase は **テストを先に書いて Red にする** 方針。実装（Phase 5）前に「期待する完成形」を spec で固定する。新規 test ファイルは作らず、既存 spec を拡充する（不変条件 #8: `*.spec.{ts,tsx}` のみ）。
> 各テストは「実装後に Green になる」前提で記述する。implemented_local_evidence_captured ゆえ本プロンプトでは実行しない。

## 4.0 実コード事実（テスト設計の前提・推測禁止）

Phase 5 実装者と齟齬を出さないため、実コードを読んで確定した事実を先に固定する。

| 事実 | 出典 | テスト設計への帰結 |
|------|------|----------------------|
| `build-seed-sql.ts` の `RESPONSE_FIELD_KEYS`（L32-59）は **31 キー**（fullName..selfIntroduction）のみを列挙し、`response_fields` 行はこのリストでフィルタして生成する（`responseFieldRows`, L90-101）。 | `apps/api/src/testing/test-accounts/build-seed-sql.ts` | birthDate/ubmJoinDate/challenges/publicConsent/rulesConsent を `profile` に入れても **`response_fields` には出ない**。よって公開 view 漏洩の negative test は「`response_fields` にこの5キーが無い」で固定できる。 |
| `answersFor(member)`（L79-85）は `fullName/occupation/ubmZone + ...member.profile + notificationOptOut` を返し、`member_responses.answers_json` / `raw_answers_json` に格納する。 | 同上 | member/admin 項目は `answers_json` には入る（=データ投入）。これは AC-3「データとしては投入」を満たす。 |
| `schema_questions` テーブルへの visibility seeding は build-seed-sql に追加済み。公開 view フィルタは `RESPONSE_FIELD_KEYS` 固定リストで成立している。 | 同上（Phase 2.3 の「member_field_visibility seeding」記述は実態と異なるため、本タスクでは触らない） | Lane A は `schema_questions` 31 行を seed する。build-seed-sql の一般化は「`profile` の全キーを `RESPONSE_FIELD_KEYS` でフィルタして回す」既存挙動で 10 件に汎用適用される（member 固有ハードコードは無い）。 |
| contract.spec（`test-accounts-seed.contract.spec.ts`）は既に byte 一致（L52-56）/ 冪等（L58-65, L95-102）/ 公開5件（L67-93）/ photos 4件 / edge 保持（TEST-RES-10 の絵文字）を検証済。 | `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts` | 既存 it は壊さず追補する。 |
| adapter `member-detail.ts` は `visibility==="public"` 以外を除外（L166）、kind=consent/system/unknown を excluded、url を linkSections に振り分ける。`PERSONAL_KEYS` は欠落時 `value:null` の fallback field を必ず出す（L270-280）。 | `apps/web/src/lib/adapters/member-detail.ts` | 全項目入力（09）の検証は「`personal` の該当 field が `value:null` で存在」「business が `""`」で固定。漏洩 negative は「member/admin section が sections に出ない」。 |

## 4.1 Lane A: catalog.spec.ts 追加ケース（AC-1, AC-2, AC-3）

対象: `apps/api/src/testing/test-accounts/__tests__/catalog.spec.ts`
既存 it（10 members / state space / matrix）は保持。以下を `describe("test accounts catalog", ...)` 内末尾へ追加する。

| テスト名 | 対象 | 入力 | 期待値 | AC |
|----------|------|------|--------|----|
| `公開掲載 5 件は visibility=public の主要必須キーを profile に持つ` | 01,06,07,09,10 | `memberById(id).profile` | 各 id について `nickname/location/hometown/ubmMembershipType/businessOverview/selfIntroduction` が非空文字列（`profile[key]` が truthy）。`fullName/occupation/ubmZone` はトップレベルで担保済のため除外。 | AC-2 |
| `フル充填メンバー(01,06,07)は 31 キーを全て持つ` | 01,06,07 | `Object.keys(memberById(id).profile)` ∪ トップレベル `{fullName,occupation,ubmZone}` | `PUBLIC_FILL_KEYS`（テスト内ローカル定数で fullName..selfIntroduction の 26 キーを `STABLE_KEY` 経由で列挙）の全要素が profile かトップレベルに present。 | AC-1, AC-2 |
| `TEST-MEM-09 は optional を全項目入力にして全項目入力を作る` | 09 | `memberById("TEST-MEM-09").profile` | `businessOverview/selfIntroduction` は present。`motto/hobbies/recentInterest/otherActivities` の少なくとも 2 つが `undefined`（profile に無い）または `null`。SNS は `urlWebsite` のみ present で `urlFacebook` 等が無い。 | AC-2 |
| `TEST-MEM-10 はエッジ値(長文/絵文字/特殊文字/全URL)を持つ` | 10 | `memberById("TEST-MEM-10").profile` | `businessOverview` の長さが 120 文字超。`selfIntroduction` に絵文字（`/\p{Emoji}/u` マッチ）を含む。`urlWebsite..urlOthers` の URL 系 11 キーが全て present。`fullName`（トップレベル）に `'` と絵文字を含む（既存）。 | AC-2 |
| `member/admin 項目もデータとして profile に投入される` | 01,06 | `memberById(id).profile` | `birthDate`（`/^\d{4}-\d{2}-\d{2}$/`）/ `ubmJoinDate`（非空）/ `challenges`（非空）が present。これらは公開ページに出ないがデータとして存在することを固定。 | AC-3 |
| `中程度メンバー(02,03,04,05,08)も profile を持つ` | 02,03,04,05,08 | `memberById(id).profile` | 各 id で profile が `undefined` でなく、`businessOverview` と `selfIntroduction` が present（/profile・/admin 確認用）。 | AC-1 |
| `ubmZone のバリエーションがマトリクス通り` | 01,06,07,09,10 | `memberById(id).ubmZone` | enum/値が表示確認用に多様（少なくとも 3 種以上の異なる値。既存値 `0_to_1`/`Awaji`/`Hanshin`/`Tanba`/`Tajima` を尊重し、テストは「重複が全件同一でない」= `new Set(zones).size >= 3` を固定）。 | AC-1 |

> 注: `STABLE_KEY` リテラル禁止（不変条件 #7 / lint-stablekey-literal）。テスト内のキー参照も `STABLE_KEY.xxx` 経由とし、文字列リテラル `"businessOverview"` 直書きは避ける（既存 catalog.spec が `memberId` 文字列のみ使う流儀に合わせ、stable_key は定数経由）。

## 4.2 Lane A: build-seed-sql.spec.ts 追加ケース（AC-1, AC-2, AC-5, AC-9）

対象: `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts`
既存 it（非トランザクション / cleanup / manifest）は保持。`sqlFragment(responseId, stableKey)` ヘルパ（L38-39）を再利用する。

| テスト名 | 対象 | 入力 | 期待値 | AC |
|----------|------|------|--------|----|
| `公開掲載5件の response_fields に主要 public キー行が生成される` | `buildSeedSql()` | 生成 SQL 文字列 | 01,06,07,09,10 の各 responseId（`TEST-RES-01`..`TEST-RES-10` の該当）について `sqlFragment(resId, STABLE_KEY.businessOverview)` と `sqlFragment(resId, STABLE_KEY.selfIntroduction)` を `toContain`。 | AC-2 |
| `フル充填の TEST-RES-06 は全 SNS URL 行を持つ` | `buildSeedSql()` | 同上 | `urlWebsite/urlFacebook/urlInstagram/urlThreads/urlYoutube/urlTiktok/urlX/urlBlog/urlNote/urlLinkedin/urlOthers` の各 `sqlFragment("TEST-RES-06", STABLE_KEY.urlXxx)` を全て `toContain`。 | AC-1 |
| `member/admin 項目は response_fields に生成されない（公開漏洩防止）` | `buildSeedSql()` | 同上 | `sqlFragment("TEST-RES-06", STABLE_KEY.birthDate)` / `..STABLE_KEY.ubmJoinDate` / `..STABLE_KEY.challenges` / `..STABLE_KEY.publicConsent` / `..STABLE_KEY.rulesConsent` を全て `not.toContain`。 | AC-5 |
| `member/admin 項目は answers_json には含まれる（データ投入）` | `buildSeedSql()` | 同上 | `member_responses` の TEST-RES-06 行（`answers_json`）に `birthDate` キーを含む。実装は SQL 文字列なので `sql` に `birthDate` 文字列が（answers_json JSON 内に）出現することを `toContain` で確認。 | AC-3 |
| `09 の空 optional は response_fields 行を生成しない` | `buildSeedSql()` | 同上 | 09 で空にした optional（例: `STABLE_KEY.motto`）について `sqlFragment("TEST-RES-09", STABLE_KEY.motto)` を `not.toContain`（`responseFieldRows` が `Object.hasOwn(answers, key)` フィルタするため未定義キーは行にならない）。 | AC-2 |
| `10 のエッジ値が SQL エスケープされて保持される` | `buildSeedSql()` | 同上 | 既存 `[TEST] 山田''太郎😀` の `toContain`（保持）に加え、businessOverview 長文の一部断片を `toContain`、`'` を含む値が `''` にエスケープされていること。 | AC-2 |

> contract spec 側（in-memory D1 投入後の AC-5/AC-9 検証）は §4.3 で扱う。build-seed-sql.spec は **文字列生成レベル** の検証に閉じる。

## 4.3 Lane A: contract.spec.ts 追加ケース（AC-4, AC-5, AC-9）

対象: `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts`
既存 4 it（byte 一致 / 冪等 10 件 / visibility・photos・edge / cleanup 冪等）は保持。以下を追加する（`setupD1` + `execAll` + `env.db.prepare` の既存ユーティリティを再利用）。

| テスト名 | 対象 | 入力 | 期待値 | AC |
|----------|------|------|--------|----|
| `seed 後 response_fields に公開掲載5件の businessOverview/selfIntroduction が存在` | seed 適用済 env | `SELECT COUNT(*) FROM response_fields WHERE response_id IN ('TEST-RES-01','TEST-RES-06','TEST-RES-07','TEST-RES-09','TEST-RES-10') AND stable_key = 'businessOverview'` | `c === 5`。同様に `selfIntroduction` で `c === 5`。 | AC-5 |
| `seed 後 member/admin 項目は response_fields に存在しない` | 同上 | `SELECT COUNT(*) FROM response_fields WHERE stable_key IN ('birthDate','ubmJoinDate','challenges','publicConsent','rulesConsent')` | `c === 0`（公開 view 二重防御）。 | AC-5 |
| `seed 後 member/admin 項目は answers_json に投入されている` | 同上 | `SELECT answers_json FROM member_responses WHERE response_id='TEST-RES-06'` | `JSON.parse(answers_json).birthDate` が定義済（データ投入の確認）。 | AC-3 |
| `09 の空 optional は response_fields に行が無い` | 同上 | `SELECT COUNT(*) FROM response_fields WHERE response_id='TEST-RES-09' AND stable_key='motto'` | `c === 0`。 | AC-2 |
| `10 のエッジ値が response_fields/answers_json で壊れず保持される` | 同上 | `SELECT value_json FROM response_fields WHERE response_id='TEST-RES-10' AND stable_key='selfIntroduction'` | 取得値（JSON.parse）に絵文字を含み、長さが期待通り（途中切れしない）。 | AC-2 |
| `seed → cleanup → seed の再適用後も公開掲載5件で response_fields が再生成される` | seed→cleanup→seed | cleanup 後 `response_fields` の `TEST-RES-%` 件数 0、再 seed 後 > 0 | 冪等性（重複適用で件数不変・cleanup で 0・再 seed で復元）。 | AC-9 |

> 既存 `count(env, table, column)` は `column LIKE 'TEST-%'` 前提のため、`response_fields`（response_id が `TEST-RES-%`）には `count(env, "response_fields", "response_id")` を使える。byte 一致 it は再生成（Phase 5 の gen 実行）後に Green になる前提で、実装前は **意図的に Red**。

## 4.4 Lane B: member-detail.spec.ts 追加ケース（AC-6）

対象: `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`
既存 it 群（happy path / visibility filter / unknown kind / KIND_ROUTE 網羅 / 分類除外）は保持。`samplePublicMemberProfile` を richer fixture として拡充し、Phase 11 staging evidence で TEST-MEM-09 / 10 の runtime 差分を確認する。

| テスト名 | 対象 | 入力（fixture） | 期待値 | AC |
|----------|------|------------------|--------|----|
| `richer fixture: visibility=public 全項目が detail/link に割当される` | `toMemberDetailProps(samplePublicMemberProfile)` | all-fields fixture | `hero.hometown` 非空 / `business.{businessOverview,skills,canProvide}` 全て非空 / `personal` 4 件が全て `value!==null` / `message` 非空 / `links` に URL 系 10 件 + `urlOthers` が存在。 | AC-6 |
| `richer fixture: photo / tags / attendance を保持する` | `toMemberDetailProps(samplePublicMemberProfile)` | photoUrl / tags / attendance を含む fixture | adapter 出力に `photoUrl` / `tags` / `attendance` が保持される。 | AC-6 |
| `urlOthers は SNS/Web link として扱う` | `toMemberDetailProps(samplePublicMemberProfile)` | `urlOthers` が paragraph kind の fixture | `urlOthers` が `other` ではなく `links` に入り、先頭 URL が href になる。 | AC-6 |
| `richer fixture でも member/admin 項目は sections/links に出ない` | `toMemberDetailProps(samplePublicMemberProfile)` | consent(admin) / responseEmail(member) を含めた section | `sections` / `linkSections` のどの field も `stableKey ∈ {publicConsent, rulesConsent, responseEmail, birthDate, ubmJoinDate, challenges}` に該当しない。`sections.find(s=>s.key==="consent")` が undefined。 | AC-6 |
| `richer fixture: 出力 field に visibility/source が漏れない` | `toMemberDetailProps(samplePublicMemberProfile)` | richer fixture | 全 section の field に `visibility`/`source` プロパティ無し。 | AC-6 |

## 4.5 Lane B: fixture 拡充方針（Red を支える土台）

対象: `apps/web/src/fixtures/public-member-profile.ts`
既存 `samplePublicMemberProfile`（happy path 用）を richer fixture として拡充し、全 public 項目・タグ・出席・写真 URL・SNS/Web link を含める。TEST-MEM-09（全項目入力 + 本人写真）と TEST-MEM-10（エッジ）は Phase 11 staging evidence で runtime 表示を確認する。

```ts
export const samplePublicMemberProfile: PublicMemberProfile = {
  /* 全 public 項目 + responseEmail(member) + consent(admin) + photoUrl + tags + attendance */
};
```

- 3 fixture とも `PublicMemberProfileWithUnknownKindZ`（lenient）ではなく **`PublicMemberProfileZ.parse` を通過**することを member-detail.spec の先頭 it で固定（既存 L14-18 と同型）。
- stableKey は全て `STABLE_KEY` 経由（不変条件 #7）。
- component spec（`apps/web/src/components/public/__tests__/*.spec.tsx`）が存在し fixture を参照する場合のみ、richer fixture を渡す描画 spec を追補する。存在しなければ adapter spec と Phase 11 staging evidence で AC-6 を担保する。

## 4.6 実行コマンド（targeted run・命名規約遵守）

```bash
# Lane A（apps/api・vitest.config.ts）
pnpm exec vitest run apps/api/src/testing/test-accounts/__tests__/catalog.spec.ts --config=vitest.config.ts
pnpm exec vitest run apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts --config=vitest.config.ts

# Lane A（in-memory D1・vitest.d1.config.ts）
pnpm exec vitest run apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts --config=vitest.d1.config.ts

# Lane B（apps/web）
pnpm exec vitest run apps/web/src/lib/adapters/__tests__/member-detail.spec.ts --config=vitest.config.ts
```

- 新規 test ファイルは作らない（既存 spec 拡充のみ）。新規が必要になっても `*.spec.{ts,tsx}` のみ（不変条件 #8）。
- メモリ制約時はファイル単位の targeted run（上記）で実行する（Phase 1 R3）。

## 完了条件

1. catalog.spec / build-seed-sql.spec / contract.spec / member-detail.spec に上記テストケースを **追加記述する方針が確定**し、各ケースの「テスト名・対象・入力・期待値・対応 AC」を表で固定した。
2. 各テストは Phase 5 実装後に Green になる設計で、実装前は意図的に Red（byte 一致 / profile キー網羅 / response_fields 生成 / 全項目保持）。
3. 新規 test ファイルを増やさず既存 spec を拡充する方針（不変条件 #8）と、`STABLE_KEY` 定数経由（不変条件 #7）を明記した。
4. full/all-fields/edge fixture を **追加 export** として用意し既存 happy path を壊さない方針を固定した。
5. targeted 実行コマンド（apps/api 2 + d1 1 + apps/web 1）を明記した。Phase 5（実装）へ進む。
