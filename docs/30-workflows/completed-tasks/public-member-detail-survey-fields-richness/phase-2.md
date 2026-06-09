# Phase 2: 設計

## 0. 設計方針サマリ

API は変更しない。`apps/web` の **adapter を「stableKey 駆動のセクション再構成器」へ作り直し**、components を proto の 5 セクション構成へ揃える。`apps/api` の seed を全項目化する。状態は持たない（SSR の純表示）。

---

## 1. データフロー（topology）

```
GET /public/members/:memberId  (API・不変)
        │  PublicMemberProfile { summary, publicSections[], attendance[], tags[], photoUrl? }
        ▼
page.tsx (Server Component, force-dynamic)
        │  PublicMemberProfileWithUnknownKindZ.parse()
        ▼
toMemberDetailProps(profile)          ← Lane A 中核（再設計）
        │  MemberDetailProps { memberId, hero, business, personal, message?, tags, links[], other[], attendance[] }
        ▼
<MemberDetail {...props} />
   ├─ <ProfileHero {...hero} />                  AC-1
   ├─ grid-2:
   │    ├─ <BusinessOverviewSection {...business} />   AC-2
   │    └─ <section>{<MemberTags/> + <MemberLinks/>}</section>  AC-3
   ├─ <PersonalSection rows={personal} />         AC-4
   ├─ <MessageCard message={message} />           AC-5（message 有時のみ）
   ├─ <MemberDetailSections sections={other} />   AC-7（other 有時のみ）
   └─ <MemberActivity .../>                        参加履歴
```

> 状態所有権: 本ページは Server Component で表示専用。client state / store は持たない。adapter は pure function（入力 mutate 禁止）。

---

## 2. 責務境界

| レイヤ | 責務 | 持たない責務 |
| ------ | ---- | ------------ |
| API (`apps/api`) | publicSections に visibility=public 全項目を供給（不変） | UI レイアウトの知識 |
| adapter (`member-detail.ts`) | publicSections → proto セクション構造へ **再構成**。visibility 二重防御、hometown 抽出、other-fallback | DOM / スタイル |
| components (`public/*`) | proto レイアウトの描画。空項目分岐 | データ取得・振り分けロジック |
| seed (`test-accounts`) | staging 確認用の全項目データ | 本番データ |

> Facade/Engine/Store の混在なし。adapter が唯一の「振り分け」責務を持ち、components は dumb。

---

## 3. adapter 再設計（`src/lib/adapters/member-detail.ts`）

### 3.1 新 `MemberDetailProps`

```ts
export interface MemberDetailHero {
  fullName: string;
  nickname: string;
  occupation: string;
  location: string;
  ubmZone: string | null;
  ubmMembershipType: string | null;
  hometown: string;           // publicSections から抽出（無ければ ""）
  photoUrl?: string | undefined;
}

export interface MemberDetailBusiness {
  businessOverview: string;   // 無ければ ""（UI 側で "—" 表示）
  skills: string;             // 無ければ ""（空ならブロック非表示）
  canProvide: string;         // 無ければ ""（空ならブロック非表示）
}

export interface MemberDetailKV {
  stableKey: string;
  label: string;
  value: string;              // renderValue 済みの表示文字列（"—" 含む）
}

export interface MemberDetailLink {
  stableKey: string;
  label: string;
  href: string;
}

export interface MemberDetailProps {
  memberId: string;
  hero: MemberDetailHero;
  business: MemberDetailBusiness;
  personal: ReadonlyArray<MemberDetailKV>;   // hobbies/recentInterest/motto/otherActivities（値が空でも行は出す＝proto KVList）
  message: string;                            // selfIntroduction（空なら ""）
  tags: PublicMemberProfile["tags"];
  links: ReadonlyArray<MemberDetailLink>;     // url kind の field
  other: ReadonlyArray<NormalizedSection>;    // 固定割当外の public field（AC-7 フォールバック）
  attendance: PublicMemberProfile["attendance"];
}
```

### 3.2 stableKey → セクション割当マップ（`@ubm-hyogo/shared` の `STABLE_KEY` 経由）

| セクション | stableKey 集合 | 由来 |
| ---------- | -------------- | ---- |
| hero（summary 由来） | fullName, nickname, location, occupation, ubmZone, ubmMembershipType | `profile.summary`（API が summary で提供） |
| hero（publicSections 抽出） | **hometown** | publicSections の basic_profile field から value 抽出 |
| business | businessOverview, skills, canProvide | publicSections |
| personal | hobbies, recentInterest, motto, otherActivities | publicSections |
| message | selfIntroduction | publicSections |
| links | kind==="url" の全 field（urlWebsite … urlOthers 等） | publicSections（kind ベース） |
| other（フォールバック） | 上記いずれにも割当されない visibility=public field | publicSections |

割当判定の定数（実装イメージ）:

```ts
const HERO_EXTRA_KEYS = new Set<string>([STABLE_KEY.hometown]);
const BUSINESS_KEYS = [STABLE_KEY.businessOverview, STABLE_KEY.skills, STABLE_KEY.canProvide] as const;
const PERSONAL_KEYS = [STABLE_KEY.hobbies, STABLE_KEY.recentInterest, STABLE_KEY.motto, STABLE_KEY.otherActivities] as const;
const MESSAGE_KEY = STABLE_KEY.selfIntroduction;
// summary に出る stableKey（other へ流さないため）
const SUMMARY_KEYS = new Set<string>([
  STABLE_KEY.fullName, STABLE_KEY.nickname, STABLE_KEY.location,
  STABLE_KEY.occupation, STABLE_KEY.ubmZone, STABLE_KEY.ubmMembershipType,
]);
// 固定割当済み（other から除外する集合）
const ASSIGNED_KEYS = new Set<string>([
  ...SUMMARY_KEYS, ...HERO_EXTRA_KEYS, ...BUSINESS_KEYS, ...PERSONAL_KEYS, MESSAGE_KEY,
]);
```

### 3.3 振り分けアルゴリズム（pure）

1. `profile.publicSections` の全 field を 1 本に flatten。
2. `field.visibility !== "public"` は除外（AC-8 二重防御）。
3. `FieldKindZ.safeParse(field.kind)` 失敗は `onUnknownKind` 通知の上 skip。
4. 各 field を以下へ振り分け（first-match）:
   - `kind === "url"` → `links`（href = String(value)、空値は除外）
   - `stableKey ∈ BUSINESS_KEYS` → `business[key]`
   - `stableKey ∈ PERSONAL_KEYS` → `personal`（KV、value は renderValue 済み）
   - `stableKey === MESSAGE_KEY` → `message`
   - `stableKey ∈ HERO_EXTRA_KEYS` → `hero.hometown`
   - `stableKey ∈ SUMMARY_KEYS` → 破棄（summary が正本）
   - それ以外（= 未割当 public field） → `other`（NormalizedSection に集約）
5. `hero` の summary 6 項目は `profile.summary` から直接コピー。`hometown` は手順 4 で抽出した値（無ければ ""）。
6. `personal` は PERSONAL_KEYS の順序で固定生成（field 不在のキーは value="—" の行を出す。proto KVList は 4 行常時表示）。
7. `business` は各キー文字列（無ければ ""）。

> **AC-7 担保**: 手順 4 の最終 else が other へ流すため、将来 form に public 項目が増えても必ずどこかに表示され、取りこぼさない。`urlOthers` は kind=url なら links、paragraph なら other に入る（schema 上 `urlOthers` は paragraph kind = other 行き）。

### 3.4 後方互換・公開 API

- `toMemberDetailProps(profile, { onUnknownKind? })` のシグネチャは維持。戻り値の型のみ拡張。
- `PublicMemberProfileWithUnknownKindZ` / `PublicMemberProfile` 型 export は維持（page.tsx が依存）。
- `__testInternals` に割当定数（`BUSINESS_KEYS` 等）を追加し spec から参照可能にする。

---

## 4. component 設計

### 4.1 ProfileHero（編集）

```ts
export interface ProfileHeroProps {
  memberId: string;
  fullName: string;
  nickname: string;
  occupation: string;
  location: string;
  ubmZone: string | null;
  ubmMembershipType: string | null;
  hometown: string;                 // 追加
  photoUrl?: string | undefined;
}
```

- proto `hero-split`: `<header data-component="profile-hero" className="card card-pad-lg hero-split">`
- `<Avatar size="xl" .../>`（lg → xl）
- eyebrow `MEMBER PROFILE`、`<h1>{fullName}</h1>`、nickname（有時）、occupation
- chip-row: zone（有時）/ status（有時）/ location（mapPin）/ **hometown（有時・outline「出身 {hometown}」）**
- 空項目は当該 chip を出さない（AC-1）。既存 `data-role` 属性（nickname/occupation/location）は維持し、hometown は `data-key="hometown"` を付与。

### 4.2 BusinessOverviewSection（新規）

```ts
export interface BusinessOverviewSectionProps {
  businessOverview: string;
  skills: string;
  canProvide: string;
}
```

- `<section data-component="business-overview" className="card card-pad-lg">`
- eyebrow `BUSINESS OVERVIEW` / `<h2 className="h-section">ビジネス概要</h2>`
- `<p className="body">{businessOverview || "—"}</p>`
- skills 有時: `divider` + 小見出し「得意分野・スキル」+ 本文
- canProvide 有時: `divider` + 小見出し「提供できること」+ 本文

### 4.3 PersonalSection（新規）

```ts
export interface PersonalSectionProps {
  rows: ReadonlyArray<{ stableKey: string; label: string; value: string }>;
}
```

- `<section data-component="personal-section" className="card card-pad-lg">`
- eyebrow `PERSONAL` / `<h2 className="h-section">パーソナル</h2>`
- `<dl className="kv-list">` 各 row（`data-stable-key` 必須・不変条件 #1）。value 空は "—"。

### 4.4 MessageCard（新規）

```ts
export interface MessageCardProps {
  message: string;
}
```

- `message` 空なら `return null`（AC-5）
- `<section data-component="member-message" className="card card-pad-lg accent-soft">`
- eyebrow `MESSAGE` / `<p className="serif">「{message}」</p>`

### 4.5 MemberDetailSections（編集: other フォールバック）

- 役割を「other セクション群の汎用 KV renderer」に限定。props は現状の `sections: ReadonlyArray<NormalizedSection>` を維持し、`MemberDetail` から `other` のみ渡す。`data-section` / `data-stable-key` 規約維持。

### 4.6 MemberTags / MemberLinks / MemberActivity（流用）

- 大きな変更なし。`MemberDetail` で `MemberTags` と `MemberLinks` を「TAGS + SNS/WEB」カードとして隣接配置。links の入力は新 `links` 形状に合わせるため、`MemberLinks` の props を `ReadonlyArray<{stableKey,label,href}>` に薄く調整（または `MemberDetail` 側で legacy 形状へ変換）。Phase 5 で最小差分を選択。

### 4.7 MemberDetail（編集: 組み立て）

```tsx
<article data-page="public-member-detail" data-member-id={memberId} className="stack-lg">
  <ProfileHero {...hero} memberId={memberId} />
  <div className="grid-2">
    <BusinessOverviewSection {...business} />
    <section data-component="tags-links" className="card card-pad-lg">
      <MemberTags tags={tags} />
      <MemberLinks links={links} />
    </section>
  </div>
  <PersonalSection rows={personal} />
  <MessageCard message={message} />
  {other.length > 0 ? <MemberDetailSections sections={other} /> : null}
  <MemberActivity .../>
</article>
```

> proto 順（AC-6）。`grid-2` / `card-pad-lg` / `stack-lg` は既存クラス。

---

## 5. 既存コンポーネント再利用可否（FB-SDK-07-1）

| 再利用 | 対象 |
| ------ | ---- |
| そのまま | `Avatar`（size プロパティで xl 指定）, `Badge`, `MemberActivity`, globals.css の proto クラス群 |
| 薄い調整 | `ProfileHero`（hometown 追加）, `MemberLinks`（props 形状）, `MemberTags`（隣接配置のみ） |
| 新規（小） | `BusinessOverviewSection`, `PersonalSection`, `MessageCard` |

新規は全て proto 既出の primitive とクラスの組み合わせで、新 primitive を生やさない（不変条件 #4）。

---

## 6. CSS 設計

`card-pad-lg / eyebrow / h-section / chip-row / grid-2 / hero-split / accent-soft / serif / kv-list / divider` は `apps/web/src/styles/globals.css` に既存（Phase 1 grep 確認済み）。**原則 CSS 追加なし**。Phase 5 で render 後に未定義クラスが判明した場合のみ、OKLch トークン（`tokens.css` の var）参照で globals.css に追加し、HEX 直書きしない（不変条件 #3）。

---

## 7. Lane B: seed 設計（`test-accounts`）

### 7.1 catalog.ts

`TestMemberAccount` に optional フィールドを追加:

```ts
export interface TestMemberAccount {
  // ...既存...
  /** 公開 stableKey → 表示値（visibility=public 項目のみ）。未指定なら従来の最小 3 項目で seed する */
  readonly profile?: Readonly<Record<string, string>>;
}
```

- `TEST-MEM-01` に visibility=public 全項目（fullName/nickname/location/occupation/hometown/ubmZone/ubmMembershipType/businessOverview/skills/canProvide/hobbies/recentInterest/motto/otherActivities/urlWebsite/urlX/urlInstagram/.../selfIntroduction）の `[TEST]` プレフィックス値を設定。
- 他の公開メンバー（TEST-MEM-03 等の公開ケース）にも代表値を数項目付与（全項目は TEST-MEM-01 のみで十分）。

### 7.2 build-seed-sql.ts

- 固定 `const STABLE_KEYS = ["fullName","occupation","ubmZone"]` を撤廃。
- `answersFor(member)` を「member.profile があればそれを基底にし、必須 3 項目（fullName/occupation/ubmZone）と notificationOptOut をマージ」へ変更。後方互換（profile 無し member は従来どおり）。
- `responseFieldRows` を member ごとに `Object.keys(answersFor(member))` で可変生成。
- `schema_versions.field_count` は最大 answers キー数または定数で整合（spec で実測値固定）。
- `search_text` は fullName/occupation/ubmZone/email に加え、profile があれば主要テキスト項目も連結（検索性向上、任意）。

> **不変条件**: D1 schema は変更しない。response_fields は `(response_id, stable_key, value_json, raw_value_json)` の既存形のまま、行数だけ増える。

---

## 8. エラーハンドリング / エッジケース

| ケース | 挙動 |
| ------ | ---- |
| publicSections が空 | hero（summary）のみ表示、business/personal は "—"、message/other 非表示 |
| hometown 不在 | hero に hometown chip 非表示 |
| selfIntroduction 不在 | MessageCard 非表示 |
| url 値が空文字 | links から除外 |
| 未知 kind | onUnknownKind 通知の上 skip（既存挙動踏襲） |
| member/admin field 混入 | adapter で除外（AC-8） |
| seed profile 未指定 member | 従来 3 項目で seed（後方互換） |

---

## 9. テスト設計概要（Phase 4 で詳細化）

| 対象 | 主ケース |
| ---- | -------- |
| adapter | セクション再構成（hero.hometown 抽出 / business 3 項目 / personal 4 行固定 / message / links url のみ / other フォールバック）、visibility filter、url 空除外、pure（入力非 mutate） |
| ProfileHero | hometown 有/無、空 chip 非表示、avatar xl |
| BusinessOverviewSection | businessOverview 空→"—"、skills/canProvide 有無での divider 分岐 |
| PersonalSection | 4 行常時、空値 "—"、data-stable-key |
| MessageCard | 空→null、serif/accent-soft 構造 |
| build-seed-sql | TEST-MEM-01 が全 stableKey 行を生成、後方互換 member は 3 項目、SQL エスケープ |
