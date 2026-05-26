# Phase 4: コントラクト

## 型定義

```ts
// apps/web/src/lib/adapters/member-detail.ts

export type FieldKind = z.infer<typeof FieldKindZ>;

type KindRoute = "detail" | "links" | "excluded";

const KIND_ROUTE = {
  shortText: "detail",
  paragraph: "detail",
  date: "detail",
  radio: "detail",
  checkbox: "detail",
  dropdown: "detail",
  url: "links",
  consent: "excluded",
  system: "excluded",
  unknown: "excluded",
} as const satisfies Record<FieldKind, KindRoute>;

const DETAIL_KINDS: ReadonlySet<FieldKind> = new Set(
  (Object.keys(KIND_ROUTE) as FieldKind[]).filter(
    (k) => KIND_ROUTE[k] === "detail",
  ),
);

const LINK_KINDS: ReadonlySet<FieldKind> = new Set(
  (Object.keys(KIND_ROUTE) as FieldKind[]).filter(
    (k) => KIND_ROUTE[k] === "links",
  ),
);
```

## 関数シグネチャ（変更前後）

| 関数 | 変更前 | 変更後 |
|------|--------|--------|
| `normalizeField(field: RawField): NormalizedField \| null` | visibility + safeParse のみ | `normalizeField(field, routeKinds)` として route set を受け取る |
| `normalizeSection(section: RawSection): NormalizedSection \| null` | detail 用のみ | `normalizeSection(section, routeKinds)` として detail / links 共用 |
| `toMemberDetailProps(profile: PublicMemberProfile): MemberDetailProps` | `sections` のみ | `sections` と `linkSections` を返す |

## エクスポート surface

| 識別子 | 種別 | export 有無 | 備考 |
|--------|------|-----------|------|
| `KIND_ROUTE` | const | export しない | adapter 内部実装詳細 |
| `DETAIL_KINDS` | const | export しない | 同上 |
| `LINK_KINDS` | const | export しない | 同上 |
| `KindRoute` | type | export しない | 同上 |
| `FieldKind` | type | 既存 export 維持 | 外部参照あり |
| `NormalizedField` / `NormalizedSection` / `MemberDetailProps` | type | 既存 export 維持 | shape 不変 |
| `toMemberDetailProps` | fn | 既存 export 維持 | 入出力 shape 不変 |

## 入出力契約

- 入力 shape (`PublicMemberProfile`) は変更なし。出力 shape (`MemberDetailProps`) は `linkSections` を追加する。
- `sections[].fields[].kind` が取り得る値は `shortText` / `paragraph` / `date` / `radio` / `checkbox` / `dropdown` の 6 種に限定される。
- `linkSections[].fields[].kind` が取り得る値は `url` に限定される。
- 副作用なし（pure function 不変）。

## エラーハンドリング

- 例外を投げない（既存挙動踏襲）。
- 分類除外は `return null` で表現し、`normalizeSection` 側で `filter` される。
- すべての fields が除外された section も既存通り除外される（`fields.length === 0` で section ごと drop）。

## 互換性

- `MemberDetail.tsx` は `linkSections` を既存 `MemberLinks` へ渡すため変更する。
- `MemberDetailSections.tsx` / `MemberLinks.tsx` / `MemberActivity.tsx` への変更不要。
- API endpoint への影響なし。
- `PublicMemberProfileZ` schema 変更なし。
