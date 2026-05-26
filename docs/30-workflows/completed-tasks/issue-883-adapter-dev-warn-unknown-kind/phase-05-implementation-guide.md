# Phase 5: 実装ガイド

[実装区分: 実装仕様書]

## メタ情報

| 項目     | 内容                                                            |
| -------- | --------------------------------------------------------------- |
| タスクID | issue-883-adapter-dev-warn-unknown-kind                         |
| 対象     | adapter / spec / page.tsx の 3 ファイル編集                     |
| Issue    | #883                                                            |

## 変更対象ファイル一覧（CONST_005 必須項目）

| ファイル                                                                | 変更種別 | 規模目安  |
| ----------------------------------------------------------------------- | -------- | --------- |
| `apps/web/src/lib/adapters/member-detail.ts`                            | 編集     | +12 行    |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`             | 編集     | +18 行    |
| `apps/web/app/(public)/members/[id]/page.tsx`                           | 編集     | +6 行     |

新規ファイル: 0 / 削除ファイル: 0。

## S1+S2: adapter 拡張

`apps/web/src/lib/adapters/member-detail.ts`:

```diff
 export type PublicMemberProfile = z.infer<typeof PublicMemberProfileZ>;
 type RawSection = PublicMemberProfile["publicSections"][number];
-type RawField = RawSection["fields"][number];
+export type RawField = RawSection["fields"][number];
 export type FieldKind = z.infer<typeof FieldKindZ>;

+/**
+ * toMemberDetailProps の第2引数。adapter pure 性を保つため、
+ * 副作用（dev console.warn など）は呼出側から callback として注入する。
+ */
+export interface ToMemberDetailPropsOptions {
+  /** FieldKindZ.safeParse が失敗した field を観測したいときに渡す。throw 禁止。 */
+  onUnknownKind?: (field: RawField) => void;
+}
+
 export interface NormalizedField {
   stableKey: string;
   ...
 }
```

```diff
-function normalizeField(field: RawField): NormalizedField | null {
+function normalizeField(
+  field: RawField,
+  onUnknownKind?: (f: RawField) => void,
+): NormalizedField | null {
   if (field.visibility !== "public") return null;
   const parsed = FieldKindZ.safeParse(field.kind);
-  if (!parsed.success) return null;
+  if (!parsed.success) {
+    onUnknownKind?.(field);
+    return null;
+  }
   return {
     stableKey: field.stableKey,
     label: field.label,
     value: field.value,
     kind: parsed.data,
   };
 }

-function normalizeSection(section: RawSection): NormalizedSection | null {
+function normalizeSection(
+  section: RawSection,
+  onUnknownKind?: (f: RawField) => void,
+): NormalizedSection | null {
   const fields = section.fields
-    .map(normalizeField)
+    .map((f) => normalizeField(f, onUnknownKind))
     .filter((f): f is NormalizedField => f !== null);
   if (fields.length === 0) return null;
   return { key: section.key, title: section.title, fields };
 }

 export function toMemberDetailProps(
   profile: PublicMemberProfile,
+  options: ToMemberDetailPropsOptions = {},
 ): MemberDetailProps {
+  const { onUnknownKind } = options;
   const sections = profile.publicSections
-    .map(normalizeSection)
+    .map((s) => normalizeSection(s, onUnknownKind))
     .filter((s): s is NormalizedSection => s !== null);
   return {
     memberId: profile.memberId,
     summary: profile.summary,
     sections,
     attendance: profile.attendance,
     tags: profile.tags,
   };
 }
```

### 関数シグネチャ（完成形）

```ts
export interface ToMemberDetailPropsOptions {
  onUnknownKind?: (field: RawField) => void;
}

export function toMemberDetailProps(
  profile: PublicMemberProfile,
  options?: ToMemberDetailPropsOptions,
): MemberDetailProps;
```

### 入出力・副作用

| 入力                                       | 出力                                       | 副作用                                                  |
| ------------------------------------------ | ------------------------------------------ | ------------------------------------------------------- |
| `profile` のみ                             | `MemberDetailProps`（既存と完全一致）      | なし                                                    |
| `profile` + `{ onUnknownKind }` + unknown  | `MemberDetailProps`（unknown は除外）      | unknown field 数だけ `onUnknownKind(field)` 呼出       |

副作用境界: adapter 内で `console.*` を呼ばない / `process.env.*` を参照しない / 例外を投げない。

## S4: page.tsx 注入

`apps/web/app/(public)/members/[id]/page.tsx`:

```diff
   if (!profile) {
     notFound();
   }
-  const props = toMemberDetailProps(profile);
+  const props = toMemberDetailProps(profile, {
+    onUnknownKind:
+      process.env.NODE_ENV === "development"
+        ? (f) =>
+            console.warn("[member-detail] unknown kind", f.kind, f.stableKey)
+        : undefined,
+  });
   return (
```

### DCE 信頼根拠

- `next build --webpack`（CLAUDE.md「production build は `next build --webpack` を正本」）の webpack DefinePlugin が `process.env.NODE_ENV` を `"production"` 文字列に静的置換する。
- 結果 `if (false) { ... }` 相当となり terser minify 段階で消える。
- Phase 11 の grep evidence で `"[member-detail] unknown kind"` が 0 件であることを実測確認する。

## S3: spec 追加（+1 ケース）

`apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`:

```diff
-import { describe, expect, it } from "vitest";
+import { describe, expect, it, vi } from "vitest";

 import { PublicMemberProfileZ } from "@ubm-hyogo/shared";

 import { samplePublicMemberProfile } from "../../../fixtures/public-member-profile";
 import { toMemberDetailProps } from "../member-detail";
```

末尾の `})` 直前に追加:

```ts
  it("unknown kind 出現時に onUnknownKind callback が呼ばれる（kind/stableKey が一致）", () => {
    const onUnknownKind = vi.fn();
    const tampered = structuredClone(samplePublicMemberProfile);
    (tampered.publicSections[0].fields[0].kind as unknown as string) =
      "unknown_kind_xyz";
    const expectedStableKey = tampered.publicSections[0].fields[0].stableKey;

    toMemberDetailProps(tampered, { onUnknownKind });

    expect(onUnknownKind).toHaveBeenCalledTimes(1);
    expect(onUnknownKind).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "unknown_kind_xyz",
        stableKey: expectedStableKey,
      }),
    );
  });
```

> 既存 8 ケースは無改修。callback 未注入時に silent skip を維持するという仕様は、既存ケース「unknown kind を silent skip する」が引き続き green であることで担保される（callback 未注入 = `undefined?.()` で no-op）。

## 実装順序（依存上の制約）

1. S1 (型 + options 引数) → tsc が通る最小差分
2. S2 (normalizeField / normalizeSection への propagate + callback 呼出)
3. S3 (spec に新ケース追加 + `vi` import)
4. S4 (page.tsx 注入)
5. S5 (Phase 10 の検証コマンド一括実行 + Phase 11 evidence 取得)

## ローカル実行コマンド（要約・Phase 10 で正本化）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/lib/adapters/__tests__/member-detail.spec.ts
ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 mise exec -- pnpm --filter @ubm-hyogo/web build
grep -R "\[member-detail\] unknown kind" apps/web/.next/server apps/web/.open-next 2>/dev/null | wc -l   # 期待: 0
```

## DoD（要約・Phase 8 で正本化）

- [x] adapter シグネチャに `options` 第2引数が追加され、既存呼出が型エラーにならない
- [x] `normalizeField` の unknown kind ブランチで `onUnknownKind?.(field)` が呼ばれる
- [x] spec ケースが 8 → 9 に増えて全 green
- [x] page.tsx が `NODE_ENV === "development"` 時のみ callback を渡す
- [x] production build artifact に `"[member-detail] unknown kind"` 文字列が **0 件**

## 共通骨格補足

## 目的

本 Phase の仕様観点を固定し、issue-883 の実装・検証・文書同期が後続 Phase と矛盾しない状態にする。

## 実行タスク

- 本文に記載した対象ファイル、契約、検証、証跡を確認する。
- 漏れが見つかった場合は同一サイクル内で修正する。

## 参照資料

- `artifacts.json`
- `outputs/phase-11/`
- `outputs/phase-12/`

## 実行手順

1. 既存本文の仕様・実績を確認する。
2. 実コード、証跡、正本仕様との対応を照合する。
3. 差分があれば同一サイクル内で反映する。

## 統合テスト連携

NON_VISUAL だが実装タスクのため、adapter spec / web tests / typecheck / lint / build / DCE grep を Phase 11 evidence に接続する。

## 多角的チェック観点（AIが判断）

- 矛盾なし
- 漏れなし
- 整合性あり
- 依存関係整合

## サブタスク管理

本タスクは S1-S5 を同一 workflow 内で完了する。未タスク化は検出なし。

## 成果物

- 本 Phase ファイル
- 関連する実コード / evidence / Phase 12 outputs

## 完了条件

- [x] 本 Phase の記述が実装・証跡・正本仕様と一致している。
- [x] coverage AC は adapter spec / web test / typecheck / lint / build evidence で代替確認する。

## タスク100%実行確認【必須】

- [x] この Phase に必要な確認を実施済み。

## 次Phase

次 Phase へ進む前に、本 Phase の差分と evidence を確認する。

