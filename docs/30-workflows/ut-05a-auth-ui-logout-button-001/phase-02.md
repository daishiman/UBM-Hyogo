[実装区分: 実装仕様書]

# Phase 2: 設計 — ut-05a-auth-ui-logout-button-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-auth-ui-logout-button-001 |
| phase | 2 / 13 |
| wave | Wave 5 follow-up |
| mode | parallel |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

`(member)` / `(admin)` 共通の sign-out 導線を最小差分で追加するために、コンポーネント
構造・client/server 境界・配置位置・スタイル方針を確定する。

## 実行タスク

1. `SignOutButton` の client component 契約を確定する。
2. `(member)` route group と `/profile` protected URL の配置差を明文化する。
3. `AdminSidebar` の footer 配置を確定する。
4. AC-1 の検証 URL を `/profile` と `/admin` に固定する。

## 参照資料

- apps/web/app/(member)/layout.tsx
- apps/web/app/profile/page.tsx
- apps/web/app/(admin)/layout.tsx
- apps/web/src/components/layout/AdminSidebar.tsx
- apps/web/src/components/ui/Button.tsx
- apps/web/package.json

## コンポーネント設計

### `apps/web/src/components/auth/SignOutButton.tsx`（新規）

- 種別: client component (`"use client"`)
- 依存: `next-auth/react` の `signOut`、既存 `apps/web/src/components/ui/Button.tsx`
- props:
  ```ts
  type SignOutButtonProps = {
    readonly className?: string;
    readonly label?: string; // default: "ログアウト"
    readonly redirectTo?: string; // default: "/login"
  };
  ```
- 副作用:
  - クリック時に `await signOut({ redirectTo })` を呼ぶ
  - `signOut` 実行中は `disabled` でボタン押下を抑止する（多重クリック防止）
- 出力: `<button type="button" aria-label="ログアウト" data-testid="sign-out-button">…</button>`
- 内部 state: `isPending: boolean`（`useState`）

### `apps/web/src/components/layout/MemberHeader.tsx`（新規）

- 種別: server component
- 役割: `(member)` 共通ヘッダ。サイト名 / プロフィール導線 / 右端に `<SignOutButton />`
- props: なし
- セッション情報の表示が必要になった場合は `getSession()` を呼ぶ拡張余地を残す（本タスクでは表示しない）

### `apps/web/app/(member)/layout.tsx`（編集）

- 既存:
  ```tsx
  export default function MemberLayout({ children }: { readonly children: ReactNode }) {
    return children;
  }
  ```
- 変更後:
  ```tsx
  import { MemberHeader } from "../../src/components/layout/MemberHeader";

  export default function MemberLayout({ children }: { readonly children: ReactNode }) {
    return (
      <div className="member-shell" data-testid="member-shell">
        <MemberHeader />
        <main className="member-main">{children}</main>
      </div>
    );
  }
  ```
- 注意: URL と route group は一致しない場合がある。`/profile` は
  `apps/web/app/profile/page.tsx` にあり `(member)` group 外だが、middleware と
  `fetchAuthed` に守られる protected URL である。本タスクでは AC-1 を満たすため、
  route 移動はせず `ProfilePage` の先頭に `<MemberHeader />` を直接配置する。

### `apps/web/src/components/layout/AdminSidebar.tsx`（編集）

- 既存の `<nav>` 内 `<ul>` の後にフッタ要素を追加し、`<SignOutButton />` を配置
- 既存 nav items 配列は変更しない
- `import { SignOutButton } from "../auth/SignOutButton";` を追加

## 実装対象 x 検証 URL

| 実装対象 | 検証 URL | AC |
| --- | --- | --- |
| `apps/web/app/profile/page.tsx` + `MemberHeader` | `/profile` | AC-1, AC-2, AC-5 |
| `apps/web/src/components/layout/AdminSidebar.tsx` | `/admin` | AC-1, AC-2, AC-5 |
| `SignOutButton` | component test | AC-2 |

## client / server 境界

- `SignOutButton` は `"use client"`（`signOut` が client API のため必須）
- `MemberHeader` / `AdminSidebar` は server component のままで OK
  （client component を子として import しても server / client 境界は維持される）

## ルーティング / redirect

- `signOut({ redirectTo: "/login" })` で `/login` に redirect
- `/login` への戻り先を統一することで AC-2 と AC-5 の連動を保証
- middleware は `/profile` / `/admin` の cookie 検証で `/login` redirect する既存挙動を再利用

## スタイル方針

- 既存 `apps/web/src/components/ui/Button.tsx` の variant を再利用
- AdminSidebar 内では小さめの secondary variant、MemberHeader では右寄せ
- secret / 個人情報を表示しない（"ログアウト" 文言のみ）

## 統合テスト連携

- 上流: Auth.js v5（`apps/web/src/lib/auth.ts`）の `signOut` 実装
- 下流: 05a-followup Phase 11 M-08 の evidence

## 多角的チェック観点

- Auth.js endpoint を直接叩かず `signOut()` API を使う（CSRF / cookie 規約は Auth.js に委譲）
- `redirectTo` を既定で `/login` に固定する
- 共通ヘッダ追加で既存 `(member)` の暗黙的レイアウトに副作用を与えない
- public route には `<SignOutButton />` を出さない

## サブタスク管理

- [ ] `SignOutButton` の props / 副作用シグネチャを確定する
- [ ] `MemberHeader` の DOM 構造を確定する
- [ ] `(member) layout` / `AdminSidebar` への組込位置を確定する
- [ ] `/profile`（`(member)` 外）への適用方針を確定する
- [ ] outputs/phase-02/main.md を作成する

## 成果物

- outputs/phase-02/main.md

## 完了条件

- 全コンポーネントの props / 副作用 / client-server 境界が確定
- 配置位置と DOM 構造が AC-1 を満たすように決まっている
- `/profile` への適用方針が決まっている

## タスク100%実行確認

- [ ] `signOut` の `redirectTo` が `/login` で統一されている
- [ ] `"use client"` の必要箇所が確定している
- [ ] 仮置きパスが残っていない

## 次 Phase への引き渡し

Phase 3 へ、コンポーネント設計・配置位置・client/server 境界を渡す。
