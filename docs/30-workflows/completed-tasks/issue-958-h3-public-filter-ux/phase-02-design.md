# Phase 2 — 設計

## 0. 既存コンポーネント再利用可否（[FB-SDK-07-1]）

| 既存 | 再利用 | 用途 |
|------|--------|------|
| `src/components/ui/Callout` | ✅ | Track A `PublicConsentCallout`、Track C `AllHiddenFallback` のベース |
| `src/components/ui/Button` | ✅ | CTA ボタン |
| `src/components/feedback/EmptyState` | ✅ | Track C で search-empty 経路は据え置き |
| `src/features/admin/hooks/useAdminMutation` | ✅ | Track B mutation 基盤 |
| `src/components/admin/FormField` | ✅ | Track B checkbox input wrapper |
| `src/components/admin/Drawer`（既存 admin pattern） | ✅ | Track B drawer container |
| `src/lib/api/public.ts getPublicStats` | ✅ | Track C で並列 fetch |
| `STABLE_KEY` `publicConsent` | ✅ | Track A key 統一 |
| `resolveEditResponseUrl` | ✅ | Track A CTA href 解決（既存 `/me/profile` レスポンスに含まれる場合はそれを優先） |

新規 primitive 追加なし。既存 design system のみで完結。

## 1. Track A: Profile `PublicConsentCallout`

### 1.1 配置

```
apps/web/app/(member)/profile/
├── _components/
│   └── PublicConsentCallout.tsx           (新規)
├── _components/__tests__/
│   └── PublicConsentCallout.spec.tsx      (新規)
└── page.tsx                                (mount 追記)
```

### 1.2 props 契約

```ts
// apps/web/app/(member)/profile/_components/PublicConsentCallout.tsx
import type { MeProfileStatusSummary } from "@/lib/api/me-types";

export interface PublicConsentCalloutProps {
  readonly publicConsent: MeProfileStatusSummary["publicConsent"]; // "consented" | "declined" | "unknown"
  /**
   * `/me/profile` レスポンスに含まれる editResponseUrl（個別 Form 再回答 URL）。
   * 取得不能時は responderUrl にフォールバック。
   */
  readonly editResponseUrl: string | null;
  /**
   * Google Form の汎用 responderUrl（CLAUDE.md fixed value）。
   * editResponseUrl が null のとき表示する fallback CTA target。
   */
  readonly responderUrl: string;
}

export function PublicConsentCallout(props: PublicConsentCalloutProps): JSX.Element;
```

### 1.3 表示分岐

| `publicConsent` | tone | 見出し | 本文 | CTA |
|----------------|------|--------|------|-----|
| `"consented"` | success (info) | 「公開メンバー一覧に掲載されています」 | 「現在の同意状態: 公開許可済み。変更したい場合は Google Form の再回答で更新できます。」 | 「Google Form で確認」（外部リンク） |
| `"declined"` | warning | 「公開メンバー一覧に表示されていません」 | 「現在の同意状態: 非公開。掲載に切り替えるには Google Form で再回答してください。」 | 「Google Form で再回答する」 |
| `"unknown"` | warning | 「公開設定が未確認です」 | 「現在の同意状態: 未確認。Google Form で同意状態を確定してください。」 | 「Google Form で再回答する」 |

### 1.4 状態リセット・再同期

純粋表示コンポーネント。internal state なし。**[FB-STATE-DETAIL-001/002/003 該当なし]**

### 1.5 アクセシビリティ

- `role="region"` + `aria-labelledby`
- 外部リンクは `target="_blank" rel="noreferrer noopener"`
- CTA ボタンは `<a>` を `Button` の `as` prop（既存 polymorphic 不可なら `buttonVariants` + `<a>` で代用）

### 1.6 page.tsx mount

`apps/web/app/(member)/profile/page.tsx` で:

```tsx
import { PublicConsentCallout } from "./_components/PublicConsentCallout";

// 既存 profile fetch 後（status.publicConsent / editResponseUrl が解決された後）
<PublicConsentCallout
  publicConsent={status.publicConsent}
  editResponseUrl={profile.editResponseUrl ?? null}
  responderUrl={RESPONDER_URL_CONST}
/>
```

`RESPONDER_URL_CONST` は `apps/web/src/lib/constants/google-form.ts` から re-export（既存になければ新規 1 行追加。fixed value は CLAUDE.md の `responderUrl` を正本）。

## 2. Track B: Admin `BulkRepublishDrawer`

### 2.1 配置

```
apps/web/
├── src/components/admin/BulkRepublishDrawer.tsx                    (新規)
├── src/components/admin/__tests__/BulkRepublishDrawer.spec.tsx     (新規)
├── src/features/admin/hooks/useBulkRepublish.ts                    (新規)
├── src/features/admin/hooks/__tests__/useBulkRepublish.spec.ts     (新規)
└── app/(admin)/admin/members/_components/MembersListClient.tsx     (既存 mount)
```

### 2.2 hook 契約

```ts
// apps/web/src/features/admin/hooks/useBulkRepublish.ts
export type BulkRepublishTarget = {
  readonly memberId: string;
  readonly currentPublishState: "hidden" | "member_only";
};

export type BulkRepublishProgress = {
  readonly total: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly failures: ReadonlyArray<{ memberId: string; code: string; message: string }>;
};

export interface UseBulkRepublishReturn {
  readonly state: "idle" | "running" | "done" | "error";
  readonly progress: BulkRepublishProgress;
  readonly start: (targets: ReadonlyArray<BulkRepublishTarget>) => Promise<void>;
  readonly reset: () => void;
}

export function useBulkRepublish(): UseBulkRepublishReturn;
```

### 2.3 内部実装方針

- `useAdminMutation` インスタンスを 1 個生成し、`start()` 内で targets を逐次（`for...of`）処理
- 並列実行禁止（D1 transaction との race 回避 / audit log の順序保証）
- 各 mutation: `PATCH /api/admin/members/${memberId}/status` body `{ publishState: "public" }`
- 失敗時も次の member へ続行、`failures[]` に記録
- 完了後 `progress.succeeded + progress.failed === total`

### 2.4 Drawer 契約

```tsx
// BulkRepublishDrawer.tsx
export interface BulkRepublishDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** members list から渡される hidden / member_only な candidate 一覧 */
  readonly candidates: ReadonlyArray<{
    readonly memberId: string;
    readonly displayName: string;
    readonly publishState: "hidden" | "member_only";
    readonly hiddenReason: string | null;
  }>;
  /** 成功時のリスト再 fetch trigger */
  readonly onCompleted: () => void;
}
```

UI:
- 一覧（`FormField` の checkbox で multi-select）
- 「選択した N 件を公開状態に戻す」確認ボタン
- 実行中: progress bar + `total / succeeded / failed`
- 完了: 失敗一覧（display name + error code）
- 全成功時は自動 close + `onCompleted` トリガ（refetch）

### 2.5 mount

`MembersListClient.tsx`（または `apps/web/app/(admin)/admin/members/page.tsx` 内の client wrapper）に「一括公開復帰」ボタン追加。`hidden` / `member_only` を含む現在 page だけを candidates に渡す。

ステップ間 state（**[FB-W1-02b-2]** 対応）:

| Step | owner | 引き渡し |
|------|-------|---------|
| candidates 抽出 | MembersListClient | `candidates[]` を Drawer に prop で渡す |
| 選択 | Drawer 内 `useState<Set<memberId>>` | `start()` 呼び出し時に array へ変換 |
| 実行 | `useBulkRepublish` hook | `progress` 状態のみ |
| 完了通知 | Drawer | `onCompleted` callback で list refetch |

### 2.6 INV-1 / INV-7 適合

- 新 endpoint ゼロ（既存 PATCH を反復のみ）
- すべて `useAdminMutation` 経由（直接 `fetch` 禁止）

## 3. Track C: Public `AllHiddenFallback`

### 3.1 配置

```
apps/web/
├── src/components/public/AllHiddenFallback.tsx                     (新規)
├── src/components/public/__tests__/AllHiddenFallback.spec.tsx      (新規)
└── app/(public)/members/page.tsx                                   (既存 fetch 追加 + 分岐)
```

### 3.2 page.tsx 改修

既存:
```tsx
const listResult = await safeServerFetch(() => listMembers(search, { revalidate: ... }), { codePrefix: "PUBLIC_FETCH" });
```

追加:
```tsx
const [listResult, statsResult] = await Promise.all([
  safeServerFetch(() => listMembers(search, { revalidate: PUBLIC_API_REVALIDATE.members }), { codePrefix: "PUBLIC_FETCH" }),
  safeServerFetch(() => getPublicStats({ revalidate: PUBLIC_API_REVALIDATE.stats }), { codePrefix: "PUBLIC_FETCH" }),
]);
```

分岐:
```tsx
const hasSearchFilters = search.q !== "" || search.tag !== "" || search.zone !== "" || search.status !== "";
const allHidden = statsResult.ok
  && statsResult.data.memberCount > 0
  && statsResult.data.publicMemberCount === 0;

{!listResult.ok ? (
  <SectionError ... />
) : allHidden && !hasSearchFilters ? (
  <AllHiddenFallback memberCount={statsResult.data.memberCount} />
) : listResult.data.items.length === 0 ? (
  <EmptyState ... />  // 既存維持
) : (
  <MemberGrid ... />
)}
```

### 3.3 AllHiddenFallback 契約

```tsx
export interface AllHiddenFallbackProps {
  /** 登録 member 総数（公開以外を含む。0 件と区別するために表示） */
  readonly memberCount: number;
}

export function AllHiddenFallback({ memberCount }: AllHiddenFallbackProps): JSX.Element;
```

UI:
- tone: info（warning ではない。来訪者が壊れていないと判断できる文言）
- 見出し: 「現在、公開設定中のメンバーがいません」
- 本文: 「会員 {memberCount} 名が在籍していますが、現時点で公開許可済みのメンバーはいません。会員の方は Google Form での再回答や、ログイン後のマイページから設定を確認できます。」
- CTA: 「マイページにログイン」(`/login`) + 「管理者の方はこちら」(`/admin`)（後者は session 有無で出し分けるかは Phase 4 で決定 → 公開ページなので両方出して常時表示する方針）

### 3.4 statsResult 失敗時の方針

`statsResult.ok === false` のとき: 旧挙動（generic EmptyState）を維持。fallback の判別根拠が取れないため、`AllHiddenFallback` は出さない。安全側に閉じる。

## 4. Track 横断: トークン使用

- 色: 全て `oklch(var(--color-*))` 経由（OKLch トークン正本）
- 余白・rhythm: 既存 admin / member / public それぞれの page-rhythm に整合
- HEX 直書きゼロ（Phase 9 grep gate）

## 5. ステップ間 state ownership 表（[FB-W1-02b-2]）

| Track | external prop | internal state | mutation owner |
|-------|---------------|----------------|----------------|
| A | `publicConsent` / `editResponseUrl` / `responderUrl` | なし | なし（表示のみ） |
| B Drawer | `candidates` / `open` | `Set<memberId>` 選択 | `useBulkRepublish` hook |
| B hook | （引数 targets） | `state` / `progress` | `useAdminMutation` instance |
| C page | `search` | なし | なし（SSR） |
| C fallback | `memberCount` | なし | なし |

## 6. 命名規則整合（[FB-SDK-07-4]）

| 既存 pattern | 本タスク採用 |
|-------------|------------|
| Component: `PascalCase.tsx` | `PublicConsentCallout` / `BulkRepublishDrawer` / `AllHiddenFallback` ✅ |
| Hook: `useCamelCase` | `useBulkRepublish` ✅ |
| Test suffix: `*.spec.{ts,tsx}` (INV-5) | 全 spec ✅ |

## 7. 完了条件

- [x] 3 Track の配置 / 契約 / 分岐 / mount 戦略が確定
- [x] 既存再利用判定済
- [x] state ownership 表
- [x] INV-1〜7 への適合根拠
