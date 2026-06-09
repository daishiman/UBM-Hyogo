# Phase 5: 実装（GREEN）

## 0. 目的

Phase 4 の RED テストを GREEN にする最小実装。2 lane は関心分離済みで **並列実装可**。API endpoint / D1 schema / Google Form schema は変更しない（不変条件 #1）。

---

## 1. [Feedback RT-03] 新規作成 / 修正ファイルパス一覧（phase-1.md §5 inventory と一致）

### Lane A: apps/web

| ファイル | 種別 |
| -------- | ---- |
| `apps/web/src/lib/adapters/member-detail.ts` | 編集（adapter 再設計） |
| `apps/web/src/components/public/ProfileHero.tsx` | 編集（hometown / eyebrow / xl） |
| `apps/web/src/components/public/BusinessOverviewSection.tsx` | 新規 |
| `apps/web/src/components/public/PersonalSection.tsx` | 新規 |
| `apps/web/src/components/public/MessageCard.tsx` | 新規 |
| `apps/web/src/components/public/MemberDetail.tsx` | 編集（組み立て・grid-2） |
| `apps/web/src/components/public/MemberDetailSections.tsx` | 編集（other フォールバック転用） |
| `apps/web/src/components/public/MemberLinks.tsx` | 編集（props 形状調整・最小差分） |
| `apps/web/src/styles/globals.css` | 条件付き編集（不足クラスのみ末尾追加） |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | 編集（Phase 4） |
| `apps/web/src/components/public/__tests__/ProfileHero.component.spec.tsx` | 編集（Phase 4） |
| `apps/web/src/components/public/__tests__/BusinessOverviewSection.component.spec.tsx` | 新規（Phase 4） |
| `apps/web/src/components/public/__tests__/PersonalSection.component.spec.tsx` | 新規（Phase 4） |
| `apps/web/src/components/public/__tests__/MessageCard.component.spec.tsx` | 新規（Phase 4） |
| `apps/web/src/components/public/__tests__/MemberDetail.component.spec.tsx` | 新規（Phase 4） |
| `apps/web/src/components/public/__tests__/MemberLinks.component.spec.tsx` | 編集（props 変更に伴う同 wave 更新・Phase 6） |

### Lane B: apps/api

| ファイル | 種別 |
| -------- | ---- |
| `apps/api/src/testing/test-accounts/catalog.ts` | 編集（`profile?` 追加・TEST-MEM-01 全項目） |
| `apps/api/src/testing/test-accounts/build-seed-sql.ts` | 編集（STABLE_KEYS 動的化） |
| `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts` | 編集（Phase 4） |

> `apps/web/src/app/(public)/members/[id]/page.tsx` は **無変更**を原則とする（`toMemberDetailProps` のシグネチャ `(profile, options)` を維持するため、呼び出し側は不変）。MemberDetail への props 受け渡しが page 経由なら最小調整のみ。

---

## 2. Lane A 実装手順

### 2.1 adapter 再設計（`member-detail.ts`）

#### 型（Phase 2 §3.1 を実装）

新 export interface を追加し `MemberDetailProps` を差し替える。

```ts
export interface MemberDetailHero {
  fullName: string; nickname: string; occupation: string; location: string;
  ubmZone: string | null; ubmMembershipType: string | null;
  hometown: string; photoUrl?: string | undefined;
}
export interface MemberDetailBusiness { businessOverview: string; skills: string; canProvide: string; }
export interface MemberDetailKV { stableKey: string; label: string; value: string; }
export interface MemberDetailLink { stableKey: string; label: string; href: string; }
export interface MemberDetailProps {
  memberId: string;
  hero: MemberDetailHero;
  business: MemberDetailBusiness;
  personal: ReadonlyArray<MemberDetailKV>;
  message: string;
  tags: PublicMemberProfile["tags"];
  links: ReadonlyArray<MemberDetailLink>;
  other: ReadonlyArray<NormalizedSection>;
  attendance: PublicMemberProfile["attendance"];
  photoUrl?: string | undefined;
}
```

`NormalizedField` / `NormalizedSection` / `PublicMemberProfile` / `PublicMemberProfileWithUnknownKindZ` / `RawField` / `FieldKind` / `ToMemberDetailPropsOptions` の既存 export は維持（page.tsx / MemberDetail が依存）。

#### 割当定数（`@ubm-hyogo/shared` の `STABLE_KEY` 経由・直書き禁止）

```ts
const HERO_EXTRA_KEYS = new Set<string>([STABLE_KEY.hometown]);
const BUSINESS_KEYS = [STABLE_KEY.businessOverview, STABLE_KEY.skills, STABLE_KEY.canProvide] as const;
const PERSONAL_KEYS = [STABLE_KEY.hobbies, STABLE_KEY.recentInterest, STABLE_KEY.motto, STABLE_KEY.otherActivities] as const;
const MESSAGE_KEY = STABLE_KEY.selfIntroduction;
const SUMMARY_KEYS = new Set<string>([
  STABLE_KEY.fullName, STABLE_KEY.nickname, STABLE_KEY.location,
  STABLE_KEY.occupation, STABLE_KEY.ubmZone, STABLE_KEY.ubmMembershipType,
]);
const ASSIGNED_KEYS = new Set<string>([
  ...SUMMARY_KEYS, ...HERO_EXTRA_KEYS, ...BUSINESS_KEYS, ...PERSONAL_KEYS, MESSAGE_KEY,
]);
```

#### `renderValue` ヘルパ

`MemberDetailSections.tsx` の `renderValue`（配列→ comma join、null/undefined/"" → "—"）と同一ロジックを adapter にも置く（personal / business 文字列化用）。重複は Phase 8 で共通化検討。business 値は "—" 化せず生文字列（空は ""）、personal 値は renderValue で "—" 化。

#### 振り分けアルゴリズム（pure・Phase 2 §3.3）

`toMemberDetailProps(profile, options)` を以下へ書き換える（入力 mutate 禁止）:

1. `onUnknownKindOnce`（WeakSet 重複抑止）は現行ロジックを流用。
2. `links: MemberDetailLink[]`, `business`(可変 record), `personalMap: Map<stableKey,string>`, `message=""`, `hometown=""`, `otherFields: NormalizedField[]`（または NormalizedSection 集約）を用意。
3. `profile.publicSections` を flatten し各 field を走査:
   - `field.visibility !== "public"` → skip（AC-8 二重防御）。
   - `FieldKindZ.safeParse(field.kind)` 失敗 → `onUnknownKindOnce(field)` 後 skip。
   - first-match 分岐:
     - `kind === "url"`: `href = String(value)`。`href` が空文字なら除外、非空なら `links.push({stableKey,label,href})`。
     - `stableKey ∈ BUSINESS_KEYS`: `business[stableKey] = renderValueRaw(value)`（空は ""）。
     - `stableKey ∈ new Set(PERSONAL_KEYS)`: `personalMap.set(stableKey, renderValue(value))`。
     - `stableKey === MESSAGE_KEY`: `message = renderValueRaw(value)`。
     - `stableKey ∈ HERO_EXTRA_KEYS`: `hometown = renderValueRaw(value)`。
     - `stableKey ∈ SUMMARY_KEYS`: 破棄（summary が正本・other へ流さない）。
     - else: `otherFields` へ集約（NormalizedSection に再構成。section key/title は元 section を保持）。
4. `personal` は `PERSONAL_KEYS` の順序で固定生成: 各キー `{ stableKey: key, label: <PERSONAL_LABELS[key] or 元 field label>, value: personalMap.get(key) ?? "—" }`。**4 行常時**（field 不在キーも "—" 行を出す。AC-4 / proto KVList）。label は field がある場合はその label を、無い場合は固定 label 表（`PERSONAL_LABELS`）を使う。
5. `business` は `{ businessOverview: ..., skills: ..., canProvide: ... }`（各空は ""）。
6. `hero` は `profile.summary` の 6 項目をコピー + `hometown`（手順 3 抽出）+ `photoUrl`。
7. `other` は手順 3 の else 集約を section 単位の NormalizedSection 配列に。空セクションは出さない。

> **AC-7 担保**: else が必ず other へ流すため、将来 public 項目追加でも取りこぼさない。`urlOthers`（schema 上 paragraph kind）は url でないため other 行き。

#### `__testInternals` 拡張

```ts
export const __testInternals = {
  DETAIL_KINDS, KIND_ROUTE, LINK_KINDS,
  BUSINESS_KEYS, PERSONAL_KEYS, SUMMARY_KEYS, HERO_EXTRA_KEYS, MESSAGE_KEY,
} as const;
```

**入出力**: in = `PublicMemberProfile`（zod parse 済み）, out = 新 `MemberDetailProps`。**副作用**: なし（pure）。

### 2.2 ProfileHero（編集）

- props に `hometown: string` 追加。
- `<header data-component="profile-hero" className="card card-pad-lg hero-split">`。
- `<Avatar size="xl" .../>`（`lg` → `xl`）。
- eyebrow `MEMBER PROFILE`（既存 eyebrow クラス）。
- 既存 `data-role`（nickname/occupation/location）と `data-key`（zone/status）を維持。
- hometown chip: `props.hometown ? <span data-key="hometown">出身 {props.hometown}</span> : null`（空は非表示・AC-1）。chip-row に zone/status と並置。
- **シグネチャ**: `ProfileHero(props: ProfileHeroProps)` → JSX。副作用なし。

### 2.3 BusinessOverviewSection（新規）

```ts
export interface BusinessOverviewSectionProps { businessOverview: string; skills: string; canProvide: string; }
```

- `<section data-component="business-overview" className="card card-pad-lg">`。
- eyebrow `BUSINESS OVERVIEW` / `<h2 className="h-section">ビジネス概要</h2>`。
- `<p className="body">{businessOverview || "—"}</p>`。
- `skills` 非空時のみ: `divider` + 小見出し「得意分野・スキル」+ 本文。
- `canProvide` 非空時のみ: `divider` + 小見出し「提供できること」+ 本文。
- 副作用なし。

### 2.4 PersonalSection（新規）

```ts
export interface PersonalSectionProps { rows: ReadonlyArray<{ stableKey: string; label: string; value: string }>; }
```

- `<section data-component="personal-section" className="card card-pad-lg">`。
- eyebrow `PERSONAL` / `<h2 className="h-section">パーソナル</h2>`。
- `<dl className="kv-list">` 各 row（`data-stable-key={row.stableKey}` 必須・不変条件 #1）。`<dt className="kv-label">{label}</dt><dd className="kv-value">{value}</dd>`。value は adapter で "—" 化済み。

### 2.5 MessageCard（新規）

```ts
export interface MessageCardProps { message: string; }
```

- `if (!message) return null;`（AC-5）。
- `<section data-component="member-message" className="card card-pad-lg accent-soft">`。
- eyebrow `MESSAGE` / `<p className="serif">「{message}」</p>`。

### 2.6 MemberDetailSections（編集: other フォールバック転用）

- props `sections: ReadonlyArray<NormalizedSection>` を維持（`MemberDetail` から `other` のみ渡す）。`data-section`/`data-stable-key`/`renderValue` 規約は現行維持。役割を「other 汎用 KV renderer」へ意味的に限定する（コードは概ね現状維持で可）。MemberDetail からの import 型を `NormalizedSection` に統一できるなら legacy 変換を削減。

### 2.7 MemberLinks（編集: props 形状・最小差分）

現行は `sections: NormalizedSection[]` を受けて内部で url 抽出している。adapter が `links: MemberDetailLink[]` を完成形で渡す新設計に合わせ、**最小差分**で 2 案のいずれか:

- 案 A（推奨）: props を `links: ReadonlyArray<{stableKey,label,href}>` に変更。内部抽出を削除し、`links.length === 0` で null、`href` を `<a href>` に。
- 案 B: `MemberDetail` 側で `links` を旧 `sections` 形へ逆変換し props 不変。

> 推奨は案 A（責務が adapter に集約され dumb 化）。案 A 採用時は `MemberLinks.component.spec.tsx` を同 wave で props 形状に合わせ更新（Phase 6）。

### 2.8 MemberDetail（編集: 組み立て）

新 `MemberDetailProps` を分割代入し proto 順（AC-6）で組む:

```tsx
<article data-page="public-member-detail" data-member-id={memberId} className="stack-lg">
  <ProfileHero memberId={memberId} {...hero} />
  <div className="grid-2">
    <BusinessOverviewSection {...business} />
    <section data-component="tags-links" className="card card-pad-lg">
      <MemberTags tags={tags} />
      <MemberLinks links={links} />        {/* 案 A */}
    </section>
  </div>
  <PersonalSection rows={personal} />
  {message ? <MessageCard message={message} /> : null}
  {other.length > 0 ? <MemberDetailSections sections={other} /> : null}
  <MemberActivity sections={toLegacyActivitySections(attendance)} />
</article>
```

`toLegacyActivitySections` は現行流用（attendance → activity section）。`MemberTags` は `tags.length===0` で内部的に「タグ未設定」を出す方針（AC-3）なら MemberTags を空時も描画する分岐に最小調整（Phase 6 で確認）。proto では空時「タグ未設定」表示のため、MemberDetail 側の `tags.length>0` ガードを撤廃し MemberTags 内で空表示する。

### 2.9 globals.css

**原則無編集**。Phase 2 §6 の通り `card-pad-lg / eyebrow / h-section / chip-row / grid-2 / hero-split / accent-soft / serif / kv-list / divider / body` は既存。実装後に未定義クラスが判明した場合のみ、**ファイル末尾に OKLch トークン（`var(--...)`）参照で追加**。HEX 直書き / `bg-[#xxx]` 禁止。既存ブロックは非破壊。

---

## 3. Lane B 実装手順

### 3.1 catalog.ts（`profile?` 追加）

`TestMemberAccount` に optional 追加:

```ts
readonly profile?: Readonly<Record<string, string>>;  // 公開 stableKey → [TEST] 値
```

`TEST-MEM-01` に visibility=public 全項目を `[TEST]` プレフィックス付きで設定。stableKey は `STABLE_KEY` を import して **キーに使う**（catalog は shared に依存可。直書き回避）。最低限以下:

`fullName / nickname / location / occupation / hometown / ubmZone / ubmMembershipType / businessOverview / skills / canProvide / hobbies / recentInterest / motto / otherActivities / urlWebsite / urlX / urlInstagram / selfIntroduction`

> 値例: `businessOverview: "[TEST] 神戸で製造業を営んでいます"`, `selfIntroduction: "[TEST] よろしくお願いします"`。`fullName`/`occupation`/`ubmZone` は **既存トップレベル値と一致**させる（profile が正本になっても manifest/summary がブレない）。
> 他の公開 member（TEST-MEM-03/06/07/09/10）には代表値を数項目だけ付与可（全項目は TEST-MEM-01 のみで AC-9 充足）。M-2（Phase 3）に従い最小限。

### 3.2 build-seed-sql.ts（STABLE_KEYS 動的化）

- `const STABLE_KEYS = [...]` 固定配列を **撤廃**または「デフォルト最小キー集合 `DEFAULT_STABLE_KEYS = ["fullName","occupation","ubmZone"]`」へ改名。
- `answersFor(member)` を:
  ```ts
  const answersFor = (member) => member.profile
    ? { ...member.profile }                    // profile があればそれを基底
    : { fullName: member.fullName, occupation: member.occupation, ubmZone: member.ubmZone };
  ```
  後方互換: profile 未指定は従来 3 項目。`notificationOptOut` は現行 member_responses の answers_json に含まれていたが、**response_fields 生成では現行 STABLE_KEYS（3 キー）に含まれず行生成されていなかった**ため、後方互換維持として response_fields は answersFor のキーをそのまま使う（profile が正本のときは profile キー全件、未指定時は 3 キー）。`answers_json` / `raw_answers_json`（member_responses 列）も同じ `answersFor` を使う。
- `responseFieldRows`: `STABLE_KEYS.map(...)` を `Object.keys(answersFor(member)).map(...)` に変更し member ごと可変行数生成。null 値は `sqlJson(null)`。
- `schema_versions.field_count`: 現行 `STABLE_KEYS.length`(=3) を「公開 stableKey の最大数」または定数へ。**Phase 5 で実測値を 1 つに固定**し spec（TC-S-05）と一致させる。最大 answers キー数（= TEST-MEM-01 のキー数）を採用するのが整合的。
- `searchTextFor`: 現行（fullName/occupation/ubmZone/email）を維持。profile の主要テキスト連結は任意（検索性向上）。追加する場合は spec を壊さない範囲で。
- **不変条件**: D1 schema 不変。response_fields 列 `(response_id, stable_key, value_json, raw_value_json)` は不変、行数のみ増。BEGIN/COMMIT を出さない既存規約維持。

**入出力**: in = `TestAccountsCatalog`, out = SQL 文字列。副作用なし（純関数）。

---

## 4. 不変条件遵守チェックリスト（実装時）

- [ ] OKLch トークンのみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を新規追加しない（CI `verify-design-tokens`）。
- [ ] 新規 primitive を生やさない（既存 globals.css クラス + Avatar/Badge のみ）。
- [ ] stableKey 参照は全て `STABLE_KEY.<name>` 経由（adapter / catalog / spec。`lint-stablekey-literal.mjs`）。
- [ ] `apps/web` から D1 binding に直接アクセスしない（データは `toMemberDetailProps` 入力経由のみ）。
- [ ] API endpoint surface 不変（`GET /public/members/:memberId` のみ）。`apps/api/src/routes/` / view-model 契約を変更しない。
- [ ] D1 schema 不変（migration 追加なし）。
- [ ] Google Form schema 不変。
- [ ] adapter は visibility=public 以外を除外（二重防御・AC-8）。
- [ ] `toMemberDetailProps(profile, options)` のシグネチャ維持（page.tsx 非変更）。
- [ ] KV row に `data-stable-key` 必須（PersonalSection / MemberDetailSections）。
- [ ] globals.css は原則無編集、必要時のみ末尾追加・既存ブロック非破壊。

---

## 5. ローカル検証コマンド（GREEN 確認）

```bash
# 型チェック（両 lane）
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/api typecheck

# lint（web は tsc + eslint）
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/api lint

# targeted vitest（Phase 4 と同じ。全ケース GREEN になること）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/adapters/__tests__/member-detail.spec.ts \
  apps/web/src/components/public/__tests__
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts \
  apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts

# design tokens gate（HEX 直書き 0 確認）
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
# 補助 grep（新規 component に HEX が無いこと）
grep -rnE "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" apps/web/src/components/public/BusinessOverviewSection.tsx \
  apps/web/src/components/public/PersonalSection.tsx apps/web/src/components/public/MessageCard.tsx || echo "no HEX (OK)"
```

---

## 6. DoD（CONST_005 必須 6 項目を充足）

| 項目 | 内容 |
| ---- | ---- |
| 変更対象ファイル | §1 の Lane A / Lane B 一覧（phase-1.md §5 と一致） |
| 関数/型シグネチャ | §2.1（adapter 型・割当定数・`toMemberDetailProps`）/ §2.2-2.8（各 component props）/ §3（catalog `profile?` / `answersFor`） |
| 入出力 | adapter: PublicMemberProfile → MemberDetailProps（pure）。seed: Catalog → SQL（pure）。component: props → JSX（副作用なし） |
| テスト方針 | Phase 4 の RED を GREEN 化。targeted vitest（§5） |
| 実行コマンド | §5 |
| DoD | 下記チェック |

- [ ] Phase 4 の全 TC（TC-A-*/TC-H-*/TC-B-*/TC-P-*/TC-M-*/TC-D-*/TC-S-*）が GREEN。
- [ ] typecheck / lint 両 lane green。
- [ ] `verify-design-tokens` green、新規 component に HEX 0。
- [ ] §4 不変条件チェックリスト全項目を満たす。
- [ ] 既存 spec（MemberDetailSections / MemberActivity / MemberTags 等）が壊れていない（Phase 6 で確認）。
