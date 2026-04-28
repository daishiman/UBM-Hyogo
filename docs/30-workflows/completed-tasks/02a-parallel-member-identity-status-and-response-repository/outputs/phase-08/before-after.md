# Before / After 比較

## 1. placeholders ヘルパー

### Before（重複コードのリスク）
```typescript
// members.ts
const ph = Array.from({ length: ids.length }, (_, i) => `?${i + 1}`).join(",");

// memberTags.ts
const ph = Array.from({ length: mids.length }, (_, i) => `?${i + 1}`).join(",");
```

### After
```typescript
// _shared/sql.ts
export const placeholders = (n: number): string =>
  Array.from({ length: n }, (_, i) => `?${i + 1}`).join(",");

// members.ts / memberTags.ts
import { placeholders } from "./_shared/sql";
const ph = placeholders(ids.length);
```

## 2. visibility フィルタリング

### Before（重複のリスク）
```typescript
// buildPublicMemberProfile 内
const publicFields = fields.filter(f => {
  const v = visibilityMap.get(f.stable_key) ?? "public";
  return v === "public";
});

// buildMemberProfile 内
const memberFields = fields.filter(f => {
  const v = visibilityMap.get(f.stable_key) ?? "public";
  return ["public", "member"].includes(v);
});
```

### After
```typescript
// _shared/builder.ts 内部ヘルパー
function buildSections(
  sections, fields, visibilityMap,
  allowedVisibilities: FieldVisibility[]
): MemberProfileSection[]

// 呼び出し側
buildSections(sections, fields, visibilityMap, ["public"]);          // public only
buildSections(sections, fields, visibilityMap, ["public", "member"]); // member profile
buildSections(sections, fields, visibilityMap, ["public", "member", "admin"]); // admin
```

## 3. MemberIdentityRow 型の共有

### Before（型定義の重複リスク）
```typescript
// members.ts で定義
interface MemberIdentityRow { ... }

// identities.ts でも定義
interface MemberIdentityRow { ... }
```

### After
```typescript
// members.ts で定義
export interface MemberIdentityRow { ... }

// identities.ts で import
import type { MemberIdentityRow } from "./members";
```
