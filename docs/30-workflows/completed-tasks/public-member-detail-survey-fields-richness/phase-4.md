# Phase 4: テスト作成（TDD RED）

## 0. 方針

Phase 2 で確定した adapter 再設計・新規 component を **テスト先行（RED）** で固める。本 Phase では「テストファイルを追加し、対象がまだ未実装/旧シグネチャのため fail することを確認する」までを仕様とする（実装は Phase 5）。

命名・配置規則（Phase 1 §4 と整合）:

| 対象 | 規則 |
| ---- | ---- |
| component spec | `apps/web/src/components/public/__tests__/<Name>.component.spec.tsx`（PascalCase + `.component.spec.tsx`。既存 `ProfileHero.component.spec.tsx` 等に揃える） |
| adapter spec | `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`（既存ファイルに追記） |
| seed spec | `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts`（既存ファイルに追記） |
| stableKey 参照 | テスト内も `STABLE_KEY.<name>`（`@ubm-hyogo/shared`）経由。リテラル直書き禁止（`lint-stablekey-literal.mjs`） |
| KV row | `data-stable-key` 必須（不変条件 #1） |
| 定数 | adapter の割当集合は `__testInternals` 経由で参照 |

vitest 環境: web は `environment: "jsdom"`（`apps/web/vitest.config.ts:38`）。component は `@testing-library/react` の `render` / `screen` / `cleanup`（既存 spec と同一）。`afterEach(() => cleanup())` を必ず置く。

### モック規約（skill 教訓）

- **FB-VSCPKR-02**: `window` / `window.api` 等をモックする場合は `Object.defineProperty(window, ...)` を使い、`vi.stubGlobal("window", ...)` は **禁止**。ただし本タスクの component は Server Component 由来の dumb 表示で `window` 依存が無いため、原則モック不要（`render` のみ）。`window` モックが必要になった場合のみ本規約を適用する。
- **FB-W0-RV-001**: 境界値（空文字・長文・絵文字）を使うテスト文字列は、実文字数を必ずコメントで明記する（例: `// 0 文字`, `// 1 文字`, `// 絵文字含む 18 文字`）。

### targeted vitest 実行コマンド（メモリ制約・FB-UI-02-2）

web / api とも `package.json` の `test` script が `--root=../..` 前提のため、**個別ファイルを叩く場合も `--root=../..` と `--config` を付ける**。

```bash
# Lane A: adapter + 新規 component（web / jsdom）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/adapters/__tests__/member-detail.spec.ts \
  apps/web/src/components/public/__tests__/ProfileHero.component.spec.tsx \
  apps/web/src/components/public/__tests__/BusinessOverviewSection.component.spec.tsx \
  apps/web/src/components/public/__tests__/PersonalSection.component.spec.tsx \
  apps/web/src/components/public/__tests__/MessageCard.component.spec.tsx \
  apps/web/src/components/public/__tests__/MemberDetail.component.spec.tsx

# Lane B: seed builder（api / node・D1 不要の純関数テスト）
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts \
  apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts
```

> 全件 `pnpm test` は使わない。RED 確認は上記 targeted run のみで足りる。

---

## 1. Lane A — adapter spec（`member-detail.spec.ts` 追記）

### 1.1 テストヘルパ

`PublicMemberProfileWithUnknownKindZ` 互換の最小 profile を組むファクトリを spec 内に用意する。`publicSections` は `{ key, title, fields[] }`、field は `{ stableKey, label, value, kind, visibility, source }`。summary は `{ fullName, nickname, location, occupation, ubmZone, ubmMembershipType }`。`attendance: []`, `tags: []` を既定にする。

新 adapter は戻り値型を `MemberDetailProps = { memberId, hero, business, personal, message, tags, links, other, attendance, photoUrl? }` に拡張する（Phase 2 §3.1）。spec は **新形状を直接 assert** することで、旧形状（`summary`/`sections`/`linkSections`）のままの現実装に対して型不一致 + プロパティ不在で fail（RED）する。

### 1.2 テストケース（TC 番号・期待結果）

| TC | 内容 | 入力 | 期待結果 |
| -- | ---- | ---- | -------- |
| TC-A-01 | hero summary 6 項目転写 | summary に全 6 値 | `props.hero.fullName/nickname/location/occupation/ubmZone/ubmMembershipType` が summary と一致 |
| TC-A-02 | hometown 抽出（有） | publicSections に `STABLE_KEY.hometown`(kind shortText) value="神戸" | `props.hero.hometown === "神戸"` |
| TC-A-03 | hometown 抽出（無） | hometown field 無し | `props.hero.hometown === ""` |
| TC-A-04 | business 3 項目 | `businessOverview`/`skills`/`canProvide` を value 設定 | `props.business` が 3 値を保持 |
| TC-A-05 | business 欠損は空文字 | skills/canProvide field 無し | `props.business.skills === ""` かつ `canProvide === ""`、`businessOverview` のみ値 |
| TC-A-06 | personal 4 行固定 | hobbies のみ value、他 3 キー field 無し | `props.personal.length === 4`、順序 = `[hobbies, recentInterest, motto, otherActivities]`、欠損行の `value === "—"`（renderValue 済み） |
| TC-A-07 | personal value renderValue | otherActivities が配列 `["a","b"]` | 該当行 `value === "a, b"`、空配列は `"—"` |
| TC-A-08 | message 抽出 | `selfIntroduction` value="よろしく" | `props.message === "よろしく"` |
| TC-A-09 | message 無は空 | selfIntroduction 無し | `props.message === ""` |
| TC-A-10 | links は url kind のみ | `urlWebsite`(url)="https://x" + `businessOverview`(paragraph) | `props.links` が 1 件、`{stableKey,label,href}`、href="https://x"。businessOverview は links に出ない |
| TC-A-11 | links 空値除外 | url kind だが value="" | links に含まれない（href 空除外） |
| TC-A-12 | other フォールバック | 固定割当外の public field（例: `urlOthers` kind=paragraph）value="その他活動" | `props.other` に当該 field を含む NormalizedSection が 1 件以上 |
| TC-A-13 | summary 由来キーは other に流さない | publicSections にも `fullName`(shortText) が混在 | `props.other` に fullName を含まない（SUMMARY_KEYS で破棄） |
| TC-A-14 | visibility 二重防御（member） | field.visibility="member" の `birthDate` | hero/business/personal/message/links/other いずれにも出ない（AC-8） |
| TC-A-15 | visibility 二重防御（admin） | field.visibility="admin" | 同上、全セクションから除外 |
| TC-A-16 | 未知 kind skip + 通知 | kind="weird" の field、`onUnknownKind` spy | spy が当該 field で 1 回呼ばれ、戻り値の全セクションに含まれない |
| TC-A-17 | pure（入力非 mutate） | 入力 profile を deep clone した参照と比較 | `toMemberDetailProps(input)` 実行後、input が clone と deep-equal（mutate していない） |
| TC-A-18 | `__testInternals` 公開 | — | `__testInternals.BUSINESS_KEYS` / `PERSONAL_KEYS` / `SUMMARY_KEYS` / `HERO_EXTRA_KEYS` / `MESSAGE_KEY` が export される |
| TC-A-19 | publicSections 空 | publicSections=[] | hero は summary のみ、business 全空、personal 4 行全 "—"、message="", links=[], other=[]（エラーなし） |

> TC-A-13 / TC-A-14 / TC-A-15 が AC-7/AC-8 の中核。TC-A-06 の「4 行常時」は proto KVList の不変表示（AC-4）を担保する。

### 1.3 RED 確認手順

1. 上記 targeted コマンドで `member-detail.spec.ts` を実行。
2. 現 `toMemberDetailProps` は `hero`/`business`/`personal`/`message`/`links`/`other` を返さないため、TypeScript コンパイル時に型エラー、または runtime で `props.hero === undefined` 由来の assertion fail が出ることを確認する。
3. `__testInternals.BUSINESS_KEYS` 等は現状未定義 → `undefined` 参照で fail。
4. fail メッセージが「未実装由来」であることを記録（Phase 5 GREEN の前提）。

---

## 2. Lane A — component spec（新規 4 ファイル + ProfileHero 追記）

### 2.1 ProfileHero（`ProfileHero.component.spec.tsx` 追記）

現行 spec（baseProps に hometown 無し / size lg / badges コンテナ）に以下を追加する。`baseProps` に `hometown: ""` を足し、既存ケースを壊さない。

| TC | 内容 | 期待結果 |
| -- | ---- | -------- |
| TC-H-01 | hometown 有で chip 表示 | `hometown="神戸"`（2 文字）→ `[data-key="hometown"]` が存在し textContent に "神戸" を含む |
| TC-H-02 | hometown 空で chip 非表示 | `hometown=""`（0 文字）→ `[data-key="hometown"]` が `null` |
| TC-H-03 | avatar size xl | render 後、`Avatar` が `size="xl"` で描画（Avatar の size クラス or 既存 Avatar spec 互換で確認。最低限「img/placeholder が描画される」+ 既存 F-1/F-2 が壊れない） |
| TC-H-04 | eyebrow 表示 | eyebrow テキスト "MEMBER PROFILE" が DOM に存在 |

> 既存 TC（zone/status/nickname/occupation/location）は維持。`size="xl"` 化で既存 F-1/F-2（photoUrl 配線）が壊れないことを回帰として確認する。RED: 現 ProfileHero に `hometown` prop / eyebrow / `data-key="hometown"` が無いため TC-H-01/02/04 が fail、size は lg のため TC-H-03 が fail。

### 2.2 BusinessOverviewSection（新規 `BusinessOverviewSection.component.spec.tsx`）

props: `{ businessOverview: string; skills: string; canProvide: string }`。

| TC | 内容 | 期待結果 |
| -- | ---- | -------- |
| TC-B-01 | 本文表示 | `businessOverview="製造業を営む"` → 本文に該当文字列を含む |
| TC-B-02 | 本文空は "—" | `businessOverview=""`（0 文字）→ 本文相当要素の textContent が "—" |
| TC-B-03 | skills 有で divider+小見出し | `skills="React"` → "得意分野・スキル" 見出し + "React" 本文が存在 |
| TC-B-04 | skills 空でブロック非表示 | `skills=""`（0 文字）→ "得意分野・スキル" 見出しが DOM に存在しない |
| TC-B-05 | canProvide 有で divider+小見出し | `canProvide="人脈紹介"` → "提供できること" 見出し + 本文存在 |
| TC-B-06 | canProvide 空でブロック非表示 | `canProvide=""` → "提供できること" 見出し非存在 |
| TC-B-07 | data-component | `[data-component="business-overview"]` が存在 |
| TC-B-08 | eyebrow | "BUSINESS OVERVIEW" eyebrow が存在 |

> RED: component 未作成のため import 解決失敗でファイル全体が fail。

### 2.3 PersonalSection（新規 `PersonalSection.component.spec.tsx`）

props: `{ rows: ReadonlyArray<{ stableKey: string; label: string; value: string }> }`。

| TC | 内容 | 期待結果 |
| -- | ---- | -------- |
| TC-P-01 | 4 行常時描画 | 4 row（うち 1 つ value="—"）→ `.kv-row` が 4 件 |
| TC-P-02 | data-stable-key 必須 | 全 row に `data-stable-key`、件数 = row 件数（不変条件 #1） |
| TC-P-03 | 値表示 | value="読書" の row の `.kv-value` textContent が "読書" |
| TC-P-04 | 空値 "—" | value="—" を渡した row の表示が "—" |
| TC-P-05 | data-component | `[data-component="personal-section"]` 存在 |
| TC-P-06 | eyebrow + h-section | "PERSONAL" eyebrow + "パーソナル" 見出し存在 |

> stableKey は spec 内で `STABLE_KEY.hobbies` 等を使う。RED: component 未作成で import fail。

### 2.4 MessageCard（新規 `MessageCard.component.spec.tsx`）

props: `{ message: string }`。

| TC | 内容 | 期待結果 |
| -- | ---- | -------- |
| TC-M-01 | 本文表示 | `message="よろしくお願いします"`（10 文字）→ 引用カードに該当文字列を含む |
| TC-M-02 | 空で null | `message=""`（0 文字）→ `container.firstChild === null`（セクション非表示・AC-5） |
| TC-M-03 | accent-soft 構造 | 描画要素が `accent-soft` クラスを持ち、`[data-component="member-message"]` 存在 |
| TC-M-04 | serif 引用 | 本文要素が `serif` クラスを持つ |
| TC-M-05 | eyebrow | "MESSAGE" eyebrow が存在 |

> RED: component 未作成で import fail。

### 2.5 MemberDetail（新規 or 追記 `MemberDetail.component.spec.tsx`）

新 props 形状（`hero`/`business`/`personal`/`message`/`tags`/`links`/`other`/`attendance`）で組み立て順（AC-6）を検証する。

| TC | 内容 | 期待結果 |
| -- | ---- | -------- |
| TC-D-01 | proto 順の DOM 出現順 | `[data-component]` を document 順に列挙し、`profile-hero` → `business-overview` → (tags/links) → `personal-section` → `member-message` → `member-activity` の相対順序を満たす |
| TC-D-02 | grid-2 で business と tags+links 横並び | business と tags-links を含む親に `grid-2` クラス |
| TC-D-03 | message 空でカード非描画 | `message=""` → `[data-component="member-message"]` 非存在 |
| TC-D-04 | other 空でセクション非描画 | `other=[]` → other 用 `data-section` 非存在 |
| TC-D-05 | other 有で MemberDetailSections 描画 | `other` に 1 セクション → 対応 `data-section` 存在 |

> RED: MemberDetail が新 props 形状を受けないため型エラー / render 失敗。

---

## 3. Lane B — seed spec（`build-seed-sql.spec.ts` 追記）

既存 3 ケースは維持し、以下を追加。`buildSeedSql()` の出力文字列を直接 assert する純関数テスト（D1 不要）。

stableKey 文字列は spec 内も `STABLE_KEY.<name>` で組む（`@ubm-hyogo/shared` import）。

| TC | 内容 | 期待結果 |
| -- | ---- | -------- |
| TC-S-01 | TEST-MEM-01 が全 public stableKey の response_fields 行を生成 | `buildSeedSql()` 出力に、TEST-MEM-01 の responseId(`TEST-RES-01`) と各 public stableKey（fullName/nickname/location/occupation/hometown/ubmZone/ubmMembershipType/businessOverview/skills/canProvide/hobbies/recentInterest/motto/otherActivities/urlWebsite/urlX/urlInstagram/selfIntroduction 等、catalog で定義した全キー）を含む `('TEST-RES-01', '<key>', ...)` 行が存在する |
| TC-S-02 | profile 未指定 member は後方互換 3 項目 | profile を持たない member（例 TEST-MEM-08）の response_fields 行が `fullName`/`occupation`/`ubmZone` の 3 stableKey のみ（+ notificationOptOut を含めない既存挙動を踏襲。現状 STABLE_KEYS は 3 キー） |
| TC-S-03 | SQL シングルクォートエスケープ | profile 値に `'` を含むケース（例 `[TEST]'引用`）→ 出力で `''` にエスケープ済み（既存 `[TEST] 山田''太郎😀` 同様） |
| TC-S-04 | response_fields 総行数の整合 | 出力の `response_fields` INSERT 行数 = Σ(各 member の answers キー数)。TEST-MEM-01 が全項目、他が 3 項目で算術一致（実測値は Phase 5 確定後に固定） |
| TC-S-05 | schema_versions.field_count 整合 | `field_count` が「最大 answers キー数」または Phase 5 で確定する定数と一致（spec で実値を 1 つに固定） |
| TC-S-06 | manifest 件数不変 | 既存 manifest（members 10 / loginable 7 / publicListed 5 / admins active 2）が seed 拡充後も不変 |

> **RED 注意**: TC-S-01 / TC-S-04 / TC-S-05 は catalog の `profile` 追加 + build-seed-sql の動的化（Phase 5）後に GREEN になる。現状は `profile` フィールドが型に無く catalog にも値が無いため、catalog 参照で TypeScript エラー or 行不在で fail する。TC-S-02 / TC-S-03 / TC-S-06 は後方互換確認で、Phase 5 で「後方互換を壊さない」ことを保証する回帰ケース。

### 3.1 RED 確認手順

1. 上記 Lane B targeted コマンドで実行。
2. catalog に `profile` が無い段階で TC-S-01（全キー行）が「行不在」で fail することを確認。
3. `TestMemberAccount.profile` を spec が参照する場合は型エラーで fail することを確認。

---

## 4. RED 完了の DoD

- [ ] Lane A adapter spec（TC-A-01〜19）が追記され、新形状 assert で fail する。
- [ ] ProfileHero spec に TC-H-01〜04 追加、既存ケース維持。
- [ ] BusinessOverviewSection / PersonalSection / MessageCard / MemberDetail の component spec 新規追加（import fail で RED）。
- [ ] Lane B seed spec に TC-S-01〜06 追加、既存 3 ケース維持。
- [ ] 全 fail が「未実装/旧シグネチャ由来」であることを確認（環境エラーでないこと）。
- [ ] stableKey 直書きが無い（`STABLE_KEY.<name>` 経由）。
- [ ] 境界値テスト文字列に実文字数コメントが付いている（FB-W0-RV-001）。
