# Phase 2: アーキテクチャ

## 影響範囲

| 層 | ファイル | 変更種別 |
|----|---------|---------|
| adapter | `apps/web/src/lib/adapters/member-detail.ts` | 編集 |
| adapter spec | `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | 編集（テストケース追記） |
| primitives | `packages/shared/src/zod/primitives.ts` | 参照のみ（`FieldKindZ` を import） |
| component | `apps/web/src/components/public/MemberDetail.tsx` | 編集（既存 `MemberLinks` へ `linkSections` を接続） |
| component | `apps/web/src/components/public/MemberDetailSections.tsx` | 変更なし |

## 設計方針

### 1. exhaustive 分類マップ（型レベルの guard）

```ts
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
```

- `satisfies Record<FieldKind, KindRoute>` により `FieldKindZ` 拡張時にキー追加忘れがコンパイルエラーになる。
- `as const` で値側の literal を保持し、後段の filter で `=== "detail"` を狭めて評価できるようにする。

### 2. derived route sets

```ts
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

- 「route set は exhaustive マップから導出する」原則を満たす。detail / links の手動列挙を分散させない。

### 3. normalizeField の route-aware 化

```ts
function normalizeField(
  field: RawField,
  routeKinds: ReadonlySet<FieldKind>,
): NormalizedField | null {
  if (field.visibility !== "public") return null;
  const parsed = FieldKindZ.safeParse(field.kind);
  if (!parsed.success) return null;
  if (!routeKinds.has(parsed.data)) return null;
  return {
    stableKey: field.stableKey,
    label: field.label,
    value: field.value,
    kind: parsed.data,
  };
}
```

- `visibility !== "public"` のガードは維持（defense-in-depth、不変条件保護）。
- route set チェックは `FieldKindZ.safeParse` 成功後に行うため、未知 kind の silent skip 挙動も変わらない。
- `sections` は `DETAIL_KINDS`、`linkSections` は `LINK_KINDS` で同じ normalizer を使い、重複実装を避ける。

### 4. runtime 網羅性 assert（unit test）

- adapter spec に「`FieldKindZ.options` 全件が `KIND_ROUTE` に存在する」ことを検証するテストを追加する。
- これは型と独立した第二防御線。型が壊れた場合（例: `as any` の混入）でも CI で fail する。

## データフロー

```
PublicMemberProfile
  └─ publicSections[].fields[]
       └─ normalizeField
            ├─ visibility check
            ├─ FieldKindZ.safeParse
            └─ DETAIL_KINDS.has(parsed.data)   ← 本仕様で追加
                 ├─ sections: detail fields
                 └─ linkSections: url fields
```

## 既存テストへの影響

- 既存 8 ケースのうち `"unknown kind を silent skip する"` は意図的に "unknown_kind_xyz" を入れているため挙動不変で green を維持。
- `"happy path"` / `"visibility=member field を除外する"` などは fixture (`samplePublicMemberProfile`) が `url` / `consent` などを含んでいる場合に影響する可能性があるため、fixture を Phase 5 で確認する。

## 既存 visual snapshot への影響

- `url` 種別の field が fixture / 実 API レスポンスに含まれている場合、KV row から `MemberLinks` へ移るため visual diff が発生する。
- `consent` / `system` / `unknown` は detail から除外される。
- 本仕様では「detail に出すべきでないものを出していた」状態と「link 分類を UI へ渡していない」状態を是正する意図的修正なので、baseline 更新は仕様の一部とする。
- baseline 更新の手順は Phase 10 で定義する。
