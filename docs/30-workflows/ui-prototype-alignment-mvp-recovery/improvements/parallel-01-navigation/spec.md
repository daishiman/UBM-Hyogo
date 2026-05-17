# parallel-01-navigation 実装仕様書

[実装区分: 実装仕様書]

## 1. 目的

admin 画面における動線欠落を解決し、ユーザーが効率的にナビゲーションできる環境を整備する。
具体的には、sidebar のロゴからホーム画面への戻り動線、および members 詳細drawer から tags 管理画面への遷移リンクを追加する。

## 2. スコープ

### G1-1: admin layout に logo→`/` 戻り動線追加

ホーム画面でコンテンツ閲覧後、admin 画面で各種管理作業を行ったユーザーが、
sidebar の logo (または該当箇所) をクリックすることで即座に `/` に戻れる体験を実現する。

### G1-2: `/admin/members` drawer → `/admin/tags?memberId=` link 追加

会員詳細 drawer 内で、当該会員のタグ管理画面（`/admin/tags?memberId={memberId}`）に直接遷移できるリンクを配置する。
backend 側では既に `/admin/tags` page の `focusMemberId` searchParam として実装済み。

## 3. 変更対象ファイル一覧

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/src/components/layout/AdminSidebar.tsx` | 編集 | logo → `/` next/link 追加（sidebar 上部） |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集 | drawer 内にタグ管理リンク追加 |
| `apps/web/app/(admin)/layout.tsx` | 参照 | admin grid layout の確認用（変更なし） |

## 4. 設計

### 4.1 G1-1: admin logo→`/` 動線

**変更箇所：** `AdminSidebar.tsx` の `<nav>` 直下（items ul の上部）

**実装方針：**
- `<Link href="/" aria-label="ホームに戻る">` を sidebar 上部に配置
- 通常の text link ではなく、Logo コンポーネント or SVG icon を含む
- Tailwind CSS で適切な padding/margin を設定し、视覚的に sidebar item と区別
- focus-visible で keyboard accessibility を確保

**JSX 構造（イメージ）：**
```jsx
<nav aria-label="管理メニュー" className="admin-sidebar">
  {/* logo → / link */}
  <Link href="/" aria-label="ホームに戻る" className="logo-link">
    {/* logo content */}
  </Link>
  
  {/* existing items list */}
  <ul>...</ul>
</nav>
```

**Props 決定：**
- `href="/"`
- `aria-label="ホームに戻る"`
- CSS class: `logo-link` または `admin-sidebar__home` で styling

### 4.2 G1-2: `/admin/members` drawer → `/admin/tags?memberId=` link

**変更箇所：** `MemberDrawer.tsx` の drawer content 内（各 section の下部または footer area）

**実装方針：**
- drawer の最後（audit log section 下部）に「タグ管理」button or link を配置
- `next/link href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}` を使用
- drawer close 後のナビゲーション動作を確認
- button 形式の link（`<Link role="button">` or `<button>` as Link child）を検討

**既存 contract 確認結果：**
- `/admin/tags/page.tsx` 内で `const focusMemberId = sp["memberId"];` として既に実装済み（line 36）
- `TagQueuePanel` component に `focusMemberId` prop 通知済み
- **追加改修不要** — drawer から link するだけで動作

**JSX 構造（イメージ）：**
```jsx
export function MemberDrawer({ memberId, onClose }: MemberDrawerProps) {
  // ... existing code ...
  
  return (
    <Drawer open onClose={onClose} title="会員詳細">
      {/* ... existing sections ... */}
      
      {/* New section: tag management link */}
      <div className="border-t border-[var(--ubm-color-border-default)] pt-4 mt-4">
        <Link
          href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}
          className="text-sm font-medium text-[var(--ubm-color-link)]"
        >
          タグ管理へ →
        </Link>
      </div>
    </Drawer>
  );
}
```

## 5. 関数・型シグネチャ

### AdminSidebar.tsx

**追加/変更なし** — 既存 export 関数シグネチャ不変

```typescript
export function AdminSidebar() {
  // return statement に logo link を追加
}
```

### MemberDrawer.tsx

**Props 不変、return JSX に link 要素追加**

```typescript
export interface MemberDrawerProps {
  readonly memberId: string;
  readonly onClose: () => void;
}

export function MemberDrawer({ memberId, onClose }: MemberDrawerProps) {
  // ... existing code ...
  // return (Drawer component) に新規 section 追加のみ
}
```

## 6. 入出力・副作用

### G1-1 sidebar logo link

**入力：** ユーザーの click (keyboard: Enter/Space on focused link)  
**出力：** `/` への navigation  
**副作用：**
- browser history に `/` entry を push
- admin layout → root layout への unload/load transition
- focus 移動なし（Next.js default）

**a11y 要件：**
- `aria-label="ホームに戻る"` で intent 明確化
- `focus-visible` outline を設定（`outline-2 outline-offset-2 outline-[var(--ubm-color-focus)]`）

### G1-2 drawer member→tags link

**入力：** ユーザーの click (keyboard: Enter/Space)  
**出力：** `/admin/tags?memberId={id}` へ navigation、drawer auto-close  
**副作用：**
- drawer onClose callback 実行確認（link 購読 vs onClose 手動呼び出し）
  - **方針：** link クリック後 page transition が発火するため、drawer unmount は自動的に発生する
  - onClose callback は不要（or 明示的に呼び出さない）

**a11y 要件：**
- link text 「タグ管理へ →」は分かりやすい action label
- link color で visual hierarchy を確立

## 7. テスト方針

### 7.1 Component test ファイル追加

**AdminSidebar:**  
`apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx`

- logo link の href="/?" を assertion
- link の aria-label を確認
- keyboard 操作（Tab → Enter）で `/` への navigation を trigger
- snapshot test で layout の integrity を維持

**MemberDrawer:**  
`apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.spec.tsx`

- drawer render 時に memberId を受け取る
- drawer 内に `/admin/tags?memberId=...` link が存在することを assertion
- link text を確認（「タグ管理へ →」）
- URL parameter encode を確認（特殊文字を含む memberId は safe）

### 7.2 E2E smoke test

**既存 admin smoke test 対象ファイル：** `apps/web/src/__tests__/admin-smoke.spec.ts`（未確認、参照要）

- admin 9 routes (dashboard, attendance, members, tags, schema, meetings, requests, identity-conflicts, audit) 全て open 可能か
- members page から drawer open → tags link click → page transition success
- tags page で ?memberId= querystring が consume される

### 7.3 実行コマンド

```bash
# TypeScript/ESLint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# Component tests
mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer

# E2E
mise exec -- pnpm --filter @ubm-hyogo/web e2e -- admin-smoke
```

## 8. ローカル実行・検証コマンド

```bash
# 開発サーバー起動
mise exec -- pnpm --filter @ubm-hyogo/web dev

# 指定画面への手動検証
# - http://localhost:3000/admin → sidebar logo クリック
# - http://localhost:3000/admin/members → 会員行クリック → drawer open → link visible
# - http://localhost:3000/admin/tags?memberId=<id> → focusMemberId 反映確認
```

## 9. DoD (Definition of Done)

- [ ] AdminSidebar.tsx に `<Link href="/">` を追加、logo/icon を配置
- [ ] MemberDrawer.tsx に `<Link href="/admin/tags?memberId=...">` を追加、drawer content に visible
- [ ] `/admin/tags` page の searchParam `memberId` handling は既存実装のまま（改修不要）
- [ ] ComponentTest (AdminSidebar.spec.tsx, MemberDrawer.spec.tsx) が green
- [ ] E2E smoke test が全 9 admin routes で pass
- [ ] TypeCheck / ESLint / prettier が clean
- [ ] Code review 完了、approve 取得

## 10. リスク・制約

| リスク | 対策 |
|--------|------|
| logo link による UX disruption | デザイン確認で sidebar 上部配置、sizing を prototype と align |
| memberId parameter encode 漏れ | `encodeURIComponent()` 使用を徹底、test で special char (例: `@`, `/`) を verify |
| drawer close timing issue | next/link の page transition 自動 unmount に依存、manual onClose 呼び出し不要 |
| existing admin smoke test 破壊 | test を更新して new routes カバー、CI green を待つ |

---

**最終確認日:** 2026-05-15  
**作成者:** Claude (task-20260515-090133-wt-1)  
**状態:** 仕様書作成完了、実装待ち
