# 実装ガイド — issue-883 adapter-dev-warn-unknown-kind

## Part 1: 初学者向け説明

### なぜ必要か

会員プロフィールの表示では、API から届く「項目の種類」を画面用に読み替えている。知らない種類が届いたとき、本番画面では何も騒がずにその項目を出さない方がよい。一方で、開発中に黙って消えると、フォーム側に新しい種類が増えたことに気づきにくい。

たとえば、学校の名簿係が「名前」「住所」「電話番号」の欄だけを知っているとする。そこに新しく「好きな係活動」という欄が増えたとき、本番の掲示板には未確認の欄を出さない。でも準備中の教室では「知らない欄が来たよ」と係に知らせる必要がある。このタスクはその知らせる仕組みを追加した。

### 何が変わるか

開発中だけ、知らない種類の項目を見つけたら console に警告を出す。本番では警告文も bundle から消す。画面の見た目は変えない。

### 今回作ったもの

| 作ったもの | 説明 |
| --- | --- |
| unknown kind 用 callback | adapter が知らない kind を見つけたときだけ呼ぶ口 |
| lenient page schema | page 境界では kind を文字列として受け、adapter まで届ける schema |
| dev-only warning | `NODE_ENV === "development"` のときだけ `console.warn` を注入 |
| テスト | silent skip、callback 呼び出し、strict schema では落ちる値が page 境界では adapter まで届くことを検証 |

## Part 2: 技術者向け詳細

### TypeScript 型定義

```ts
export const PublicMemberProfileWithUnknownKindZ =
  PublicMemberProfileZ.extend({
    publicSections: z.array(SectionWithUnknownKindZ),
  });

export type PublicMemberProfile = z.infer<
  typeof PublicMemberProfileWithUnknownKindZ
>;

export interface ToMemberDetailPropsOptions {
  onUnknownKind?: ((field: RawField) => void) | undefined;
}
```

`PublicMemberProfileZ` の正本 contract は変更しない。web の member detail page 境界だけ `publicSections[].fields[].kind` を `z.string()` で受け、`toMemberDetailProps` 内の `FieldKindZ.safeParse` によって known/unknown を判定する。

### APIシグネチャ

```ts
export function toMemberDetailProps(
  profile: PublicMemberProfile,
  options: ToMemberDetailPropsOptions = {},
): MemberDetailProps;
```

第2引数は optional なので既存呼び出し `toMemberDetailProps(profile)` は後方互換で動く。callback 未指定時は従来どおり silent skip する。

### 使用例

```ts
const onUnknownKind =
  process.env.NODE_ENV === "development"
    ? (field: PublicMemberProfile["publicSections"][number]["fields"][number]) =>
        console.warn("[member-detail] unknown kind", field.kind, field.stableKey)
    : undefined;

const profile = PublicMemberProfileWithUnknownKindZ.parse(raw);
const props = toMemberDetailProps(profile, { onUnknownKind });
```

### エラーハンドリング

`PublicMemberProfileWithUnknownKindZ` は kind 以外の shape を strict に検証する。summary、visibility、source、attendance、tags などの不正は従来どおり parse error になり、page の error boundary に委譲する。unknown kind はエラーにせず adapter へ渡し、adapter が該当 field を除外する。

### エッジケース

| ケース | 挙動 |
| --- | --- |
| callback 未指定 | unknown kind field は silent skip |
| callback 指定 + unknown kind | field を除外し、field 全体を callback に渡す |
| `visibility !== "public"` | kind が unknown でも callback は呼ばない |
| `NODE_ENV=test` | page.tsx の warning callback は無効 |
| production build | warning 文字列は `.next/server` / `.open-next` の grep で 0 件 |

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| dev 判定 | `process.env.NODE_ENV === "development"` |
| warning message | `[member-detail] unknown kind` |
| DCE grep 対象 | `apps/web/.next/server` / `apps/web/.open-next` |
| visual category | `NON_VISUAL` |

### テスト構成

| テスト | 目的 |
| --- | --- |
| adapter spec | 既存 8 ケース + unknown kind callback + lenient schema 経路 |
| typecheck | exported schema / type の整合 |
| lint | page.tsx と adapter の静的検査 |
| build + DCE grep | production artifact に warning 文字列が残らないこと |
| visual-snapshot-status | UI/CSS/JSX 不変のためスクリーンショット不要、visual baseline 差分なし |

### 変更対象

| ファイル | 変更内容 |
| --- | --- |
| `apps/web/src/lib/adapters/member-detail.ts` | lenient schema export、options 型、unknown kind callback propagation |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | callback と page 境界到達性のテスト |
| `apps/web/app/(public)/members/[id]/page.tsx` | lenient schema parse と development-only callback 注入 |

### 詳細仕様の正本

| 項目 | 参照先 |
| --- | --- |
| 要件 / 成功基準 | `phase-01-requirements.md` |
| アーキテクチャ判断 | `phase-02-architecture.md` |
| 型 / API contract | `phase-04-contracts.md` |
| テスト戦略 | `phase-06-test-strategy.md` |
| Phase 11 evidence | `phase-11-evidence-inventory.md` |
