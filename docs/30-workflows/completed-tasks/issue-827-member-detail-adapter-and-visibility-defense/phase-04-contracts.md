# Phase 4: コントラクト

## 型定義

```ts
// apps/web/src/lib/adapters/member-detail.ts
import type { z } from "zod";
import type { PublicMemberProfileZ } from "@ubm-hyogo/shared";

type PublicMemberProfile = z.infer<typeof PublicMemberProfileZ>;
type Section = PublicMemberProfile["publicSections"][number];
type Field = Section["fields"][number];

export interface MemberDetailViewModel {
  /** activity section を除外し、visibility=public + 表示可能 kind のみに正規化された detail sections */
  detailSections: ReadonlyArray<Section>;
  /** visibility=public に正規化された全 sections (MemberLinks / MemberActivity 側で活用) */
  allSections: ReadonlyArray<Section>;
}

export function buildMemberDetailViewModel(
  profile: PublicMemberProfile,
): MemberDetailViewModel;
```

## 関数シグネチャ

| 関数 | シグネチャ | 純粋性 |
|------|-----------|--------|
| `buildMemberDetailViewModel` | `(profile: PublicMemberProfile) => MemberDetailViewModel` | pure |
| `filterVisibleFields` (内部) | `(fields: ReadonlyArray<Field>) => ReadonlyArray<Field>` | pure |
| `isDisplayableKind` (内部) | `(kind: Field["kind"]) => boolean` | pure |

## filter ルール

| 条件 | 動作 |
|------|------|
| `field.visibility !== "public"` (`member` / `admin`) | 除外 (二重防御) |
| `field.kind === "url"` | 除外 (MemberLinks 側で描画) |
| `field.kind` が表示対象外 (`unknown` / `system` / `consent`) | 除外 (silent skip, defensive) |
| section.fields が filter 後 0 件 | section ごと除外 |
| `section.key === "activity"` | visibility filter 済みのまま `detailSections` から除外（`allSections` には残す） |

## 入出力例

入力:
```json
{
  "publicSections": [
    { "key": "basic", "title": "基本情報", "fields": [
      { "stableKey": "basic:fullName", "kind": "shortText", "visibility": "public", "value": "山田", "label": "氏名", "source": "forms" },
      { "stableKey": "basic:secret", "kind": "shortText", "visibility": "member", "value": "x", "label": "秘密", "source": "forms" }
    ]},
    { "key": "activity", "title": "活動", "fields": [...] }
  ]
}
```

出力 `detailSections`:
```json
[
  { "key": "basic", "title": "基本情報", "fields": [
    { "stableKey": "basic:fullName", ... }
  ]}
]
```
