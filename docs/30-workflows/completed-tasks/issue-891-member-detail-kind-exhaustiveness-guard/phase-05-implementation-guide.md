# Phase 5: 実装ガイド

## 変更対象ファイル一覧

| ファイル | 種別 |
|---------|------|
| `apps/web/src/lib/adapters/member-detail.ts` | 編集 |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | 編集（ケース追加） |
| `apps/web/src/components/public/MemberDetail.tsx` | 編集（`linkSections` を `MemberLinks` へ接続） |
| `apps/web/src/fixtures/public-member-profile.ts` | 確認のみ。kind 構成によっては既存テストの fixture を補強 |
| `apps/web/playwright/visual/` 配下 baseline | snapshot 差分が出た場合のみ意図的更新 |

## 実装手順

### Step 1: `member-detail.ts` の改修

`import` 直後（既存 `FieldKind` の type alias 定義の直後）に `KindRoute` 型と `KIND_ROUTE` マップ、`DETAIL_KINDS` set を追加する。

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

### Step 2: `normalizeField` の route-aware 化

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

`toMemberDetailProps` では `sections` を `DETAIL_KINDS`、`linkSections` を `LINK_KINDS` から生成する。

### Step 3: 内部 export

`KIND_ROUTE` を test からも参照できるよう、`__test__` namespace で限定 export する（test only）。

```ts
// member-detail.ts 末尾
export const __testInternals = { KIND_ROUTE, DETAIL_KINDS, LINK_KINDS } as const;
```

公開 surface に出さないため命名で意図を明示し、production code から参照しないことを Phase 7 quality gate に明記する。

### Step 4: adapter spec の追加ケース

`apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` に以下を追加する。

```ts
import { FieldKindZ } from "@ubm-hyogo/shared";
import { __testInternals } from "../member-detail";

describe("KIND_ROUTE exhaustiveness", () => {
  it("FieldKindZ.options 全件が KIND_ROUTE に存在する", () => {
    const routed = Object.keys(__testInternals.KIND_ROUTE);
    for (const kind of FieldKindZ.options) {
      expect(routed).toContain(kind);
    }
  });

  it("KIND_ROUTE のキーは FieldKindZ.options と完全一致する（余剰キーなし）", () => {
    const routed = Object.keys(__testInternals.KIND_ROUTE).sort();
    const enumVals = [...FieldKindZ.options].sort();
    expect(routed).toEqual(enumVals);
  });
});

describe("toMemberDetailProps の分類除外", () => {
  it("kind = url の field は detail から除外し linkSections に残す", () => {
    const tampered = structuredClone(samplePublicMemberProfile);
    const target = tampered.publicSections[0].fields[0];
    target.kind = "url";
    target.value = "https://example.com/member";
    const result = toMemberDetailProps(tampered);
    expect(result.sections.flatMap((s) => s.fields).find((f) => f.stableKey === target.stableKey)).toBeUndefined();
    expect(result.linkSections.flatMap((s) => s.fields).find((f) => f.stableKey === target.stableKey)).toMatchObject({ kind: "url" });
  });

  it("kind = consent / system の field は detail に含まれない", () => {
    for (const excluded of ["consent", "system"] as const) {
      const tampered = structuredClone(samplePublicMemberProfile);
      (tampered.publicSections[0].fields[0].kind as unknown as string) = excluded;
      const result = toMemberDetailProps(tampered);
      const all = result.sections.flatMap((s) => s.fields);
      expect(
        all.find((f) => f.stableKey === tampered.publicSections[0].fields[0].stableKey),
      ).toBeUndefined();
    }
  });
});
```

### Step 5: `MemberDetail` の link route 接続

`MemberDetail.tsx` で既存 `MemberLinks` を import し、`linkSections` を `toLegacySections(linkSections)` 経由で渡す。

```tsx
<MemberLinks sections={toLegacySections(linkSections)} />
<MemberDetailSections sections={toLegacySections(sections)} />
```

### Step 6: fixture 確認

- `apps/web/src/fixtures/public-member-profile.ts` を読み、`url` / `consent` / `system` / `unknown` kind を持つ field が含まれているか確認する。
- 含まれていれば既存 happy-path テストが「除外されている」結果に変わる可能性があるため、既存 8 ケースを実行し green を維持できるように fixture を補強する（kind を `shortText` に振り替える等の最小修正）。
- ただし `"unknown kind を silent skip する"` ケースは `"unknown_kind_xyz"` を入れる前提なので影響なし。

### Step 7: typecheck / lint / unit test

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/adapters/__tests__/member-detail.spec.ts
```

### Step 8: visual snapshot 確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --grep "member detail"
```

- diff が出た場合は Phase 10 に従い意図的更新する。
- diff の内容が `url` の links 移動、または `consent` / `system` / `unknown` 由来の KV row 消失に限定されることを確認する。

### Step 9: build

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build
```

## コーディング規約

- 関数・変数命名は既存 adapter のスタイル（camelCase / 短いコメント）に合わせる。
- コメントは KIND_ROUTE 直上に 1 行で意図（exhaustive 分類 / FieldKindZ 拡張時のコンパイル fail 装置）を残す。それ以外のコメントは追加しない。
- `as any` 禁止。
