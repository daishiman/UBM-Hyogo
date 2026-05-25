# AdminSectionError retry CTA 追加 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------- |
| タスクID     | admin-ui-prototype-alignment-followup-002-admin-section-error-retry-cta                           |
| タスク名     | AdminSectionError に retry CTA を追加（client boundary 経由 onRetry 注入）                        |
| 分類         | 改善                                                                                              |
| 対象機能     | `apps/web/src/features/admin/components/_shared/AdminSectionError`                                |
| 優先度       | 低                                                                                                |
| 見積もり規模 | 小規模                                                                                            |
| ステータス   | 未実施                                                                                            |
| 発見元       | admin-ui-prototype-alignment Phase 10 final-review                                                |
| 発見日       | 2026-05-23                                                                                        |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
- deferred 宣言: `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-10/final-review.md` line 23「AdminSectionError は v1 では retry button を持たない（YAGNI）。実 traffic で『再読込してください』テキストでの UX 問題が確認されたら retry CTA を追加する」
- 現状実装: `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx`（静的テキスト「再読み込みしてください。」のみ。retry button なし）
- 発火条件: staging / production runtime で UX 問題が報告された場合、もしくは Phase 11 manual test (`pending_user_gate`) で reviewer が retry CTA を要請した場合
- 既存 primitive 群（先行整備済み）:
  - `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx`（server component / props only）
  - `apps/web/src/features/admin/components/_shared/AdminSectionCard.tsx`
  - `apps/web/src/features/admin/components/_shared/AdminEmptyState.tsx`

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

admin-ui-prototype-alignment v1 では `AdminSectionError` を server component compatible な props-only primitive として実装し、retry button を意図的に持たせなかった（YAGNI 判断）。エラー回復は本文テキスト「再読み込みしてください。」によるユーザー手動ブラウザリロード誘導に委ねている。Phase 10 final-review §23 で「実 traffic で UX 問題が確認されたら retry CTA を追加する」と deferred 宣言された。

### 1.2 問題点・課題

- ユーザーが per-section error から回復するにはブラウザ全体リロードが必要で、他 section の state（フィルタ・選択行・展開状態）も巻き戻る
- per-section の独立 retry ができないため、admin dashboard の partial failure 体験が劣化
- AdminSectionError は server component のため、`onRetry` を直接渡せない（client boundary が必要）
- a11y: 「再読み込みしてください。」というテキスト誘導はスクリーンリーダー利用者にとってアクション可能性が不明瞭

### 1.3 放置した場合の影響

- 後続の admin 機能追加で per-section error 発生頻度が増えた場合、UX 退化が加速
- error 表示 → 全体リロード → state 喪失 のループが support 問い合わせ要因になる可能性
- AdminSectionError を採用する全 admin page で UX 問題が横並びで発生

---

## 2. 何を達成するか（What）

### 2.1 目的

`AdminSectionError` に optional `onRetry` props を追加し、client boundary 経由で retry button を注入可能にする。server component compatible なデフォルト挙動（onRetry 未指定時は v1 互換のテキストのみ表示）を維持する。

### 2.2 最終ゴール

- `AdminSectionError.tsx` に optional `onRetry?: () => void` props が追加され、未指定時の DOM は v1 と完全互換
- `AdminSectionErrorClient.tsx`（client wrapper）が新規追加され、`router.refresh()` を含む retry hook を提供
- 各 admin page で client wrapper を採用した箇所が server component の page.tsx を client 化せずに retry を実現
- 既存 `AdminSectionError.spec.tsx` が無修正で pass
- 新規 `AdminSectionErrorClient.spec.tsx` で retry click / loading / a11y を検証

### 2.3 スコープ

#### 含むもの

- `AdminSectionError.tsx` に optional `onRetry` props 追加（破壊的変更なし）
- `AdminSectionErrorClient.tsx`（"use client" wrapper）新規追加
- 採用箇所（client boundary が必要な admin page）の差分
- 単体 spec 追加（retry click / loading state / a11y）

#### 含まないもの

- AdminSectionError 自体の client 化（server component compatible を維持）
- section 単位の cache invalidation API 設計（`router.refresh()` で十分とする）
- 既存 API endpoint surface の変更（不変条件1 遵守）
- 新規 primitive 群の追加（Button 等は既存 primitive を再利用）

### 2.4 成果物

- `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx`（差分: optional props 追加）
- `apps/web/src/features/admin/components/_shared/AdminSectionErrorClient.tsx`（新規）
- `apps/web/src/features/admin/components/_shared/__tests__/AdminSectionErrorClient.spec.tsx`（新規）
- 採用箇所（admin page）の差分

---

## 3. どのように実装するか（How）

### 3.1 設計方針

- `AdminSectionError` 自体は **server component compatible (props only)** を維持。`onRetry` は optional 追加とし、server component 側で渡さない（Phase 10 §4.1 設計遵守チェックの制約「`AdminSectionError` の `onRetry` を server component 側で渡していない」を維持）
- `AdminSectionErrorClient.tsx` を新設し、`"use client"` boundary 内で `useRouter().refresh()` を呼ぶ retry handler を組み立てる
- per-section error の独立 retry は `router.refresh()` で実現（Next.js App Router の RSC re-fetch）
- 採用箇所では page.tsx は server のまま、error 表示部分だけ `<AdminSectionErrorClient ... />` に差し替える
- a11y: retry button は `<button type="button">` + 明示的 `aria-label`、retry 中は `aria-busy="true"` + `disabled` で二度押し防止、retry 完了後は元の focus 位置に戻す
- OKLch トークン: button color は既存 Button primitive のトークン経由（HEX 直書き禁止）

### 3.2 props 設計

```ts
// AdminSectionError.tsx (server component compatible)
export interface AdminSectionErrorProps {
  sectionLabel: string;
  code?: string;
  correlationId?: string;
  message?: string;
  className?: string;
  onRetry?: () => void; // optional 追加。未指定時 v1 互換
  retryLabel?: string;  // 既定: "再読み込み"
  isRetrying?: boolean; // loading state（client 側で管理）
}
```

```ts
// AdminSectionErrorClient.tsx
"use client";
type AdminSectionErrorClientProps = Omit<AdminSectionErrorProps, "onRetry" | "isRetrying">;
// 内部で useRouter().refresh() と useTransition() を使い retry handler を組成
```

### 3.3 変更ファイル一覧

| ファイル                                                                                            | 種別     | 内容                                          |
| --------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------- |
| `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx`                              | 既存変更 | optional `onRetry` / `retryLabel` / `isRetrying` props 追加 |
| `apps/web/src/features/admin/components/_shared/AdminSectionErrorClient.tsx`                        | 新規追加 | "use client" wrapper                          |
| `apps/web/src/features/admin/components/_shared/__tests__/AdminSectionErrorClient.spec.tsx`         | 新規追加 | retry click / loading / a11y 契約             |
| `apps/web/src/features/admin/components/_shared/index.ts`                                           | 既存変更 | `AdminSectionErrorClient` の re-export 追加   |
| 採用 admin page（例: `apps/web/app/(admin)/admin/page.tsx`）                                        | 既存変更 | 該当 section の error 表示を client wrapper 経由に差し替え |

---

## 4. 苦戦箇所・将来の留意点（重要）

admin v1 実装中に observed した点を後続が即解決できるよう残す。

### 4.1 server → client boundary の切り方

- `(admin)/admin/page.tsx` は server component で `getSession()` / API fetch を行う
- error 表示部分だけを client 化するため、`<AdminSectionErrorClient />` を server component の JSX 内に配置する形が正解
- page 全体を `"use client"` にすると server-only data fetch（D1 経由 API call）が壊れる
- props として渡せるのは **serializable 値のみ**（`onRetry` を server から渡す設計にしない理由）

### 4.2 `router.refresh()` の挙動と粒度

- `router.refresh()` は **現在の route の RSC 全体** を再 fetch する（per-section ではない）
- per-section の独立 retry を厳密に実現するには SWR / React Query を別途導入する必要があるが、v1 スコープ外
- 本タスクでは「全体 refresh で許容」と決め、UX 問題が再発した場合に section-scoped cache invalidation を別タスクで検討する
- `useTransition()` の `isPending` を `isRetrying` として AdminSectionError に渡し、ボタン disabled 制御に使う

### 4.3 a11y: retry button の role / aria / focus

- `<button type="button">` を使用（`<a>` でない）
- `aria-label` は `${sectionLabel} を再読み込み` のように section 文脈を含める
- retry 中は `aria-busy="true"` + `disabled`（二度押し防止）
- retry 完了後の focus 戻し: `router.refresh()` 後に同 button が DOM に残るため自動的に focus 維持される（React の reconciliation 任せ）。section が消える場合は focus trap 検討が必要
- `role="alert"` + `aria-live="polite"` は v1 のまま保持

### 4.4 loading state の表現と二度押し防止

- `useTransition()` の `isPending` を `isRetrying` props として渡す
- button text を「再読み込み中…」に切り替えるか、spinner を出すかは既存 Button primitive の loading variant に揃える
- `isRetrying === true` のとき button を `disabled` にする

### 4.5 既存 spec 互換と props 追加の破壊性

- `AdminSectionError.tsx` の既存 spec（`__tests__/AdminSectionError.spec.tsx` 想定）が `onRetry` props 未指定で pass し続ける必要がある
- 既定 DOM（v1 互換）に retry button が出現しないことを spec で明示 assert（regression 防止）
- `index.ts` の re-export 追加時に既存 import path を壊さない

### 4.6 プロトタイプ正本順位（CLAUDE.md 不変条件3）

- `docs/00-getting-started-manual/claude-design-prototype/` の primitives + tokens + rhythm を参照
- **新規 primitive を生やさない**（retry button は既存 Button primitive を再利用）
- 新規 visual 仕様を持ち込まない（color / spacing は既存トークン参照を踏襲）

---

## 5. テスト戦略

### 5.1 Unit (AdminSectionError 既存互換)

`apps/web/src/features/admin/components/_shared/__tests__/AdminSectionError.spec.tsx` を無修正で pass させる。加えて以下を追加 assert:

- `onRetry` props 未指定時に retry button が DOM に存在しないこと（v1 互換 regression 防止）
- `onRetry` props 指定時に retry button が描画されること

### 5.2 Unit (AdminSectionErrorClient 新規)

`apps/web/src/features/admin/components/_shared/__tests__/AdminSectionErrorClient.spec.tsx` で以下を assert:

- retry button が `role="button"` で描画される
- retry button click で `router.refresh()` が呼ばれる（`useRouter` mock）
- retry 中は `aria-busy="true"` + `disabled` 状態になる
- retry 完了後に button が再度 enabled になる
- `aria-label` に section 文脈が含まれる
- OKLch トークン経由の color class が button に付与される（HEX 直書きでないこと）

### 5.3 Integration

- 採用 admin page で client wrapper 採用箇所が server component を巻き込んで client 化していないこと（page.tsx に `"use client"` が追加されていないこと）を grep で確認

### 5.4 a11y

- `axe` critical violation 0 を維持
- retry button の role / aria-label / aria-busy / disabled が WCAG 準拠

### 5.5 検証コマンド

```bash
mise exec -- pnpm --dir apps/web exec vitest run src/features/admin/components/_shared/__tests__/AdminSectionError.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run src/features/admin/components/_shared/__tests__/AdminSectionErrorClient.spec.tsx
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 6. 受け入れ条件（DoD）

- **AC-1**: `AdminSectionError.tsx` に optional `onRetry` / `retryLabel` / `isRetrying` props が追加され、未指定時の DOM が v1 と完全互換
- **AC-2**: `AdminSectionErrorClient.tsx` が新規追加され、`"use client"` boundary 内で `router.refresh()` + `useTransition()` を組成
- **AC-3**: 採用 admin page で page.tsx に `"use client"` を追加せず、error 表示部分のみ client 化されている
- **AC-4**: 既存 `AdminSectionError.spec.tsx` が無修正で pass
- **AC-5**: `AdminSectionErrorClient.spec.tsx` が新規追加され、retry click / loading / a11y を検証
- **AC-6**: retry button の a11y（role / aria-label / aria-busy / disabled）が WCAG 準拠
- **AC-7**: `pnpm typecheck` / `pnpm lint` が 0 error / 0 warning
- **AC-8**: axe critical violation 0 を維持
- **AC-9**: 新規 primitive を導入していない（既存 Button primitive を再利用、不変条件3 遵守）
- **AC-10**: HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を導入していない（不変条件2 OKLch トークン正本化）
- **AC-11**: D1 直接アクセスなし（retry 経路は既存 API endpoint 経由の RSC re-fetch、CLAUDE.md #5 遵守）
- **AC-12**: 新規 test ファイルが `*.spec.tsx` 命名（CLAUDE.md #8 遵守）

---

## 7. 関連 path / refs

- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
- deferred 根拠: `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-10/final-review.md` line 23
- 設計詳細: `docs/30-workflows/admin-ui-prototype-alignment/phase-2-design.md`（AdminSectionError 設計詳細）
- 現状実装: `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx`
- 採用候補 page: `apps/web/app/(admin)/admin/page.tsx`
- 既存 primitive 参考: `apps/web/src/features/admin/components/_shared/AdminSectionCard.tsx` / `AdminEmptyState.tsx`
- design token 正本: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`
- プロトタイプ正本: `docs/00-getting-started-manual/claude-design-prototype/`
- CLAUDE.md「UI prototype alignment / MVP recovery」§不変条件 1「既存 API のみ接続」/ §不変条件 2「OKLch トークン正本化」/ §不変条件 3「プロトタイプ正本順位」
- CLAUDE.md §重要な不変条件 #5「D1 直接アクセス禁止」/ #8「test ファイルは `*.spec.{ts,tsx}` のみ」
