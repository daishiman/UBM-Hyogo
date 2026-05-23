# Phase 5: 実装ガイド

## S1: adapter 新規作成

`apps/web/src/lib/adapters/member-detail.ts` を新規作成。

```ts
// issue-827: PublicMemberProfile → MemberDetail props の pure adapter
// 不変条件: visibility="public" の二重防御 / unknown kind silent skip / activity 分離
import type { z } from "zod";
import type { PublicMemberProfileZ } from "@ubm-hyogo/shared";

type PublicMemberProfile = z.infer<typeof PublicMemberProfileZ>;
type Section = PublicMemberProfile["publicSections"][number];
type Field = Section["fields"][number];

const DISPLAYABLE_KINDS: ReadonlySet<Field["kind"]> = new Set([
  "shortText",
  "paragraph",
  "checkbox",
  "radio",
  "dropdown",
  "date",
  // url は MemberLinks 側で描画
]);

export interface MemberDetailViewModel {
  detailSections: ReadonlyArray<Section>;
  allSections: ReadonlyArray<Section>;
}

function isDisplayableKind(kind: Field["kind"]): boolean {
  return DISPLAYABLE_KINDS.has(kind);
}

function filterVisibleFields(fields: ReadonlyArray<Field>): ReadonlyArray<Field> {
  return fields.filter(
    (f) => f.visibility === "public" && isDisplayableKind(f.kind),
  );
}

export function buildMemberDetailViewModel(
  profile: PublicMemberProfile,
): MemberDetailViewModel {
  const allSections = profile.publicSections.map((s) => ({
    ...s,
    fields: s.fields.filter((f) => f.visibility === "public"),
  }));

  const detailSections = allSections
    .filter((s) => s.key !== "activity")
    .map((s) => ({ ...s, fields: filterVisibleFields(s.fields) }))
    .filter((s) => s.fields.length > 0);

  return { detailSections, allSections };
}
```

> **注意**: `DISPLAYABLE_KINDS` の中身は `packages/shared/src/zod/primitives.ts` の `FieldKindZ` enum と整合させる。現行表示対象は `shortText` / `paragraph` / `date` / `radio` / `checkbox` / `dropdown`。`url` は visibility filter 済み `allSections` から `MemberLinks`、`activity` は visibility filter 済み `allSections` から `MemberActivity` が描画する。`consent` / `system` / `unknown` は detail 表示対象外。

## S3: `MemberDetailSections.tsx` から filter 撤去

```diff
 export function MemberDetailSections({ sections }: MemberDetailSectionsProps) {
   return (
     <>
       {sections.map((section) => {
-        const visibleFields = section.fields.filter((f) => f.kind !== "url");
-        if (visibleFields.length === 0) return null;
+        // adapter 側で filter 済み (issue-827)
+        if (section.fields.length === 0) return null;
         return (
           <section ... >
             <h2 ...>{section.title}</h2>
             <dl ...>
-              {visibleFields.map((field) => (
+              {section.fields.map((field) => (
```

## S4: page.tsx を adapter 経由に置換

```diff
+import { buildMemberDetailViewModel } from "@/lib/adapters/member-detail";
 ...
   const profile = await fetchProfile(id);
   if (!profile) {
     notFound();
   }

-  const detailSections = profile.publicSections.filter(
-    (s) => s.key !== "activity",
-  );
+  const { detailSections, allSections } = buildMemberDetailViewModel(profile);
   ...
-      <MemberTags tags={profile.tags} />
       <MemberDetailSections sections={detailSections} />
-      <MemberLinks sections={profile.publicSections} />
-      <MemberActivity sections={profile.publicSections} />
+      <MemberLinks sections={allSections} />
+      <MemberActivity sections={allSections} />
```

`MemberTags` の位置は変更しない。

## import alias

`@/lib/adapters/...` は `apps/web/tsconfig.json` の paths で解決。既存 `@/lib/seo/...` と同パターン。
