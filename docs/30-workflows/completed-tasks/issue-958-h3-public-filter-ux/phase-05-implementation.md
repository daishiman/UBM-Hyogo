# Phase 5 — 実装

## 0. implementation_mode

`new`（3 Track 全て新規実装）。`verify_existing` 経路ではない。

## 1. 新規 / 修正ファイル一覧

| 種別 | パス | Track |
|------|------|-------|
| 新規 | `apps/web/app/(member)/profile/_components/PublicConsentCallout.tsx` | A |
| 新規 | `apps/web/app/(member)/profile/_components/__tests__/PublicConsentCallout.spec.tsx` | A |
| 新規 | `apps/web/src/lib/constants/google-form.ts`（既存無ければ） | A |
| 修正 | `apps/web/app/(member)/profile/page.tsx`（mount 追記） | A |
| 新規 | `apps/web/src/features/admin/hooks/useBulkRepublish.ts` | B |
| 新規 | `apps/web/src/features/admin/hooks/__tests__/useBulkRepublish.spec.ts` | B |
| 新規 | `apps/web/src/components/admin/BulkRepublishDrawer.tsx` | B |
| 新規 | `apps/web/src/components/admin/__tests__/BulkRepublishDrawer.spec.tsx` | B |
| 修正 | `apps/web/app/(admin)/admin/members/_components/MembersListClient.tsx`（mount） | B |
| 新規 | `apps/web/src/components/public/AllHiddenFallback.tsx` | C |
| 新規 | `apps/web/src/components/public/__tests__/AllHiddenFallback.spec.tsx` | C |
| 修正 | `apps/web/app/(public)/members/page.tsx`（並列 fetch + 分岐） | C |
| 新規 | `apps/web/src/lib/api/__tests__/me-types-public-consent.spec.ts` | A (MINOR-1) |

## 2. Track A 実装手順

### 2.1 `google-form.ts`

```ts
// apps/web/src/lib/constants/google-form.ts
export const GOOGLE_FORM_RESPONDER_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform" as const;
```

### 2.2 `PublicConsentCallout.tsx`

- `Callout` primitive 使用、tone は表に従う
- CTA: `editResponseUrl ?? responderUrl` を href
- `<a target="_blank" rel="noreferrer noopener">` で `Button` の style を `buttonVariants()` 経由で適用

### 2.3 `profile/page.tsx` 修正点

- 既存 fetch 結果から `status.publicConsent` と `profile.editResponseUrl`（schema 無ければ undefined）を取得
- `<PublicConsentCallout publicConsent={...} editResponseUrl={...} responderUrl={GOOGLE_FORM_RESPONDER_URL} />` を `StatusSummary` 直下に mount
- `RequestActionPanel` は変更しない

### 2.4 MINOR-1 確認

`apps/web/src/lib/api/me-types.ts` の zod schema を確認:
- `editResponseUrl` フィールド有 → `profile.editResponseUrl` で取得
- 無 → page.tsx 側で `null` 固定（responderUrl のみ動作）

## 3. Track B 実装手順

### 3.1 `useBulkRepublish.ts`

```ts
export function useBulkRepublish(): UseBulkRepublishReturn {
  const mutation = useAdminMutation<{ publishState: "public" }, unknown>({
    buildRequest: ({ memberId }) => ({
      method: "PATCH",
      path: `/api/admin/members/${memberId}/status`,
      body: { publishState: "public" },
    }),
  });
  const [state, setState] = useState<"idle"|"running"|"done"|"error">("idle");
  const [progress, setProgress] = useState<BulkRepublishProgress>({ total:0, succeeded:0, failed:0, failures:[] });

  const start = useCallback(async (targets) => {
    if (state === "running") return;
    setState("running");
    setProgress({ total: targets.length, succeeded:0, failed:0, failures:[] });
    for (const t of targets) {
      try {
        await mutation.mutateAsync({ memberId: t.memberId });
        setProgress(p => ({ ...p, succeeded: p.succeeded + 1 }));
      } catch (e) {
        const { code, message } = parseError(e);
        setProgress(p => ({ ...p, failed: p.failed + 1, failures: [...p.failures, { memberId: t.memberId, code, message }] }));
      }
    }
    setState("done");
  }, [mutation, state]);

  const reset = useCallback(() => {
    setState("idle");
    setProgress({ total:0, succeeded:0, failed:0, failures:[] });
  }, []);

  return { state, progress, start, reset };
}
```

注意: `useAdminMutation` の実 API（`mutateAsync` / `buildRequest` 等）は既存実装を Phase 5 着手時に確認し、契約に合わせて調整する。

### 3.2 `BulkRepublishDrawer.tsx`

- Drawer container は既存 admin pattern を踏襲（既存 drawer が無ければ shadcn 互換の simple aside で構成、token 経由色）
- 候補 list: 各行に `FormField` の checkbox（INV-6）
- progress bar: `<div role="progressbar" aria-valuenow={succeeded+failed} aria-valuemax={total}>`
- 完了 callback: `state==="done" && failed===0` で `onClose()` + `onCompleted()`

### 3.3 `MembersListClient.tsx` 修正

- 「一括公開復帰」ボタン追加（既存 toolbar 領域）
- `candidates = items.filter(m => m.publishState === "hidden" || m.publishState === "member_only")`
- Drawer の `onCompleted` で SWR/route refetch

## 4. Track C 実装手順

### 4.1 `AllHiddenFallback.tsx`

- `Callout` tone=info 使用
- 見出し / 本文 / 2 CTA を phase-02 §3.3 通り
- `<Link href="/login">` / `<Link href="/admin">` で内部遷移

### 4.2 `app/(public)/members/page.tsx`

```tsx
const [listResult, statsResult] = await Promise.all([
  safeServerFetch(() => listMembers(search, { revalidate: PUBLIC_API_REVALIDATE.members }), { codePrefix: "PUBLIC_FETCH" }),
  safeServerFetch(() => getPublicStats({ revalidate: PUBLIC_API_REVALIDATE.stats }), { codePrefix: "PUBLIC_FETCH" }),
]);

const hasSearchFilters =
  search.q !== "" || search.tag !== "" || search.zone !== "" || search.status !== "";

const allHidden = statsResult.ok
  && statsResult.data.memberCount > 0
  && statsResult.data.publicMemberCount === 0;
```

render 分岐は phase-02 §3.2 通り。

## 5. 実装順序

1. Track A（最小・独立）
2. Track C（fetch 並列化 + fallback。既存 page 改修のため影響範囲狭い）
3. Track B（drawer + hook + mount。最も大きい）

各 Track は独立に PR 化可能だが、本タスクでは 1 PR にまとめる（CONST_007 1 サイクル）。

## 6. token / 色

- 全て `oklch(var(--color-*))` 経由
- HEX 直書きゼロ
- Phase 9 で `verify-design-tokens` 実行

## 7. DoD

- [ ] 全 spec GREEN（targeted vitest）
- [ ] typecheck / lint green
- [ ] 新 endpoint 追加なし（`git diff dev -- apps/api/src/routes/` 空）
- [ ] HEX 直書きなし
- [ ] `useAdminMutation` 経由（直接 fetch 無し、INV-7）
- [ ] `FormField` 経由（INV-6）

## 8. 完了条件

- [x] ファイル一覧確定
- [x] 各 Track の主要コード骨格を明示
- [x] 実装順序と DoD 明示
