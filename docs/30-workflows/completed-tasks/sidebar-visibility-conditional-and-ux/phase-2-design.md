# Phase 2: 設計

## メタ情報

| 項目 | 値 |
|------|-----|
| 対象 task_id | `sidebar-visibility-conditional-and-ux` |
| 入力 | Phase 1 要件定義（FR-1〜5 / AC-1〜9 / T1〜T3） |
| 出力 | topology・状態所有権・関数シグネチャ・表示条件マトリクス設計 |

## 目的

サイドバー表示条件を **route group を単一正本** とする宣言的トポロジへ設計し直し、SSR active 正確化と viewer/active/badge の視覚設計を確定する。新規 primitive を増やさず既存 shell primitives の分岐拡張に閉じる。

## 1. route topology 設計（T1）

### 1.1 変更前後のディレクトリトポロジ

```
変更前                                    変更後
app/                                      app/
├─ layout.tsx (bare root)                 ├─ layout.tsx (bare root, 不変)
├─ (public)/                              ├─ (auth)/              ← 新設・shell無し
│   ├─ layout.tsx (shell)                 │   ├─ layout.tsx       ← 新規 bare layout
│   ├─ login/        ← shell が被る(bug)  │   └─ login/           ← (public)から git mv
│   ├─ page.tsx (/)                       │       ├─ page.tsx
│   ├─ members/ ...                       │       └─ _components/*
│   └─ ...                                ├─ (public)/            ← login 除外, shell 維持
├─ (member)/ (shell)                      │   ├─ layout.tsx (shell, 不変)
└─ (admin)/  (shell)                      │   ├─ page.tsx (/) ...
                                          ├─ (member)/ (shell, 不変)
                                          └─ (admin)/  (shell, activePath のみ修正)
```

### 1.2 設計判断（why this way）

| 判断 | 採用案 | 却下案 | 理由 |
|------|--------|--------|------|
| login の shell 除外方式 | **`(auth)` route group へ移動** | `(public)/layout.tsx` 内の pathname 条件分岐 | route group が Next.js 標準の「layout を被るか」の宣言的所有者。表示条件が実装ロジックでなくディレクトリ構造で表現され、09h §1.6「shell外」の意図に忠実。layout に表示条件ロジックを混在させない（責務境界）。**ユーザー承認済**。 |
| URL 維持 | route group `( )` はパスに出ない | — | `/login` の URL・既存 redirect / query 契約は不変（AC-3）。 |
| import 深度 | 補正不要 | — | `app/(public)/login/page.tsx` → `app/(auth)/login/page.tsx` は同一階層深度（`app/<group>/login/`）。`../../../src/...` は不変。**ただし移動後に grep で機械確認する**（Phase 5 Step）。 |
| root layout | 変更しない | login 用に root を分岐 | root layout は既に bare（html/body/ToastProvider のみ）。`(auth)/layout.tsx` は theme 属性 + `<main>` wrapper のみを担い shell を被せない。 |

### 1.3 `(auth)/layout.tsx` 設計

```tsx
// app/(auth)/layout.tsx — bare（shell なし）。認証導線の二重化を避ける（09h §1.6）。
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div data-theme="warm" data-route-group="auth" data-shell-mode="bare" data-testid="auth-shell">
      {children}
    </div>
  );
}
```

- `SidebarShellServer` / `SidebarMobileTrigger` を **import しない**（AC-2）。
- `data-shell-mode="bare"` で「shell を被らない」ことを DOM 契約として宣言。
- `LoginShell`（`<main className="auth-shell">`）は移動後もそのまま使用（既存 auth-shell スタイルを再利用）。

### 1.4 表示条件マトリクス（正本・09h §1.6 へ反映）

| route group | route | shell | role 要件 | サイドバー |
|-------------|-------|-------|-----------|-----------|
| `(auth)` | `/login` | **bare** | 不問 | **非表示** |
| `(public)` | `/`・`/members`・`/members/[id]`・`/register`・`/privacy`・`/terms` | SidebarShell | 不要（role で nav 変化） | 表示（viewer=PUBLIC のみ） |
| `(member)` | `/profile` | SidebarShell | session 必須（middleware guard） | 表示（PUBLIC+MEMBERS[+ADMIN]） |
| `(admin)` | `/admin`・`/admin/{...}` | SidebarShell | `isAdmin=true`（二段防御） | 表示（PUBLIC+MEMBERS+ADMIN） |

## 2. SSR active 正確化 設計（T2）

### 2.1 因果分析（現状の不具合）

- middleware は `x-nonce` / CSP のみ request header に設定し **`x-pathname` を注入していない**。
- `(public)/layout.tsx` / `(member)/layout.tsx` は `headers().get("x-pathname") ?? fallback` を読むが、未注入のため常に fallback（`/` / `/profile`）。
- `(admin)/layout.tsx` は `activePath="/admin"` をハードコード → `/admin/members` 等で SSR active が `/admin`（ダッシュボード）にハイライトされ、hydration で client `usePathname()` が補正するまで誤表示（FOUC 的）。

### 2.2 修正設計

| 対象 | Before | After |
|------|--------|-------|
| `middleware.ts` | `requestHeaders.set("x-nonce", ...)` のみ | 加えて `requestHeaders.set("x-pathname", req.nextUrl.pathname)` を全 request（guarded/unguarded 双方が乗る `nextWithRequestHeaders` 経路）に付与 |
| `(admin)/layout.tsx` | `activePath="/admin"` | `const pathname = (await headers()).get("x-pathname") ?? "/admin"; ... activePath={pathname}` |
| `(public)`/`(member)` | x-pathname 読込済（fallback のみ機能） | 変更不要（注入で自動的に正確化） |

- middleware の `x-pathname` 注入は guard 判定（admin/profile）より前の共通ヘッダー設定として行い、redirect レスポンスには影響させない（redirect は header 不要）。
- `req.nextUrl.pathname` は query を含まないため active 判定に過不足ない。
- client 側の `usePathname()` による active 判定（`SidebarNavItem`）は維持（SSR と client の二重保険）。

### 2.3 状態所有権（責務境界）

| 状態 | 所有者 | 備考 |
|------|--------|------|
| 現在 pathname（SSR） | middleware → request header `x-pathname` | 単一注入元 |
| activePath prop | 各 route group layout | header から読み layout が SidebarShellServer へ渡す |
| active 判定（client） | `SidebarNavItem`（`usePathname()`） | SSR activePath を初期値、client で確定 |
| role | `SidebarShell.server.tsx`（`getSession()` → `resolveRole`） | 不変（fail-open） |

## 3. shell UX 設計（T3）

### 3.1 viewer identity（FR-4 / AC-6）

現状: viewer でも `SidebarUserMenu` 上部の identity ブロックがメンバー風に見え、未ログインと気づきにくい。

設計（既存 `SidebarUserMenu` / `SidebarUserAvatar` の viewer 分岐を強化。新規 primitive 不要）:

| role | avatar | ラベル | アクション |
|------|--------|--------|-----------|
| viewer | ゲストアイコン（`SidebarUserAvatar` の viewer variant、initials の代わりにゲスト表現） | 「ゲスト」+ サブ「未ログイン」 | **「ログイン」CTA を強調**（既存 `LOGIN` action を primary tone で） |
| member | initials avatar | 表示名 / email | `<details>` popover（プロフィール / 編集申請 / ログアウト） |
| admin | initials avatar + badge dot | 表示名 / email | popover（管理ダッシュボード / プロフィール / 編集申請 / ログアウト） |

- viewer の CTA は `data-shell-block="login-cta"` を付与し、collapsed 時は icon + sr-only ラベル。
- 色は token のみ（accent-soft / accent-ink など）。HEX 禁止。

### 3.2 active / badge 視認性（FR-5 / AC-7）

| 対象 | 設計 |
|------|------|
| active nav item | `SidebarNavItem` の active 時に `aria-current="page"` を付与（既存になければ追加）+ token ベースの背景/左 accent で視認性確保。collapsed 時も active を識別可能に。 |
| admin schema badge | `buildAdminGroup` の `badge.count`（queued schema diff）を `SidebarNavItem` が tone=warn で描画。collapsed 時は dot 表示に縮約。 |

### 3.3 ステップ間 state 引き渡し（該当なし）

本タスクはマルチステップウィザードを含まないため state 引き渡しテーブルは N/A。viewer/member/admin の分岐は props（role）駆動の純表示で、内部 state 所有は `useSidebarState`（collapse/drawer）に限定（既存・不変）。

## 4. ライブラリ選定

- 新規ライブラリ採用なし。Next.js App Router（route group）・既存 Auth.js session 経路・既存 shell primitives のみ使用。
- node-only パッケージの renderer 直 import なし（`(auth)/layout.tsx` はサーバ/クライアント中立な純 JSX）。

## 5. SubAgent lane（Phase 4-13 の作成体制）

| lane | 担当 phase | 並列 |
|------|-----------|------|
| A | phase-4（テスト計画） / phase-6（テスト追加） / phase-7（カバレッジ） | 並列 |
| B | phase-5（実装手順） / phase-8（リファクタ） / phase-9（QA） | 並列 |
| C | phase-10（最終レビュー） / phase-11（手動テスト） / phase-12（ドキュメント同期 + outputs） | 並列 |
| 直列締め | phase-13 + artifacts.json + index.md（オーケストレータ） | seq |

## 6. 既存コンポーネント再利用可否（FB-SDK-07-1）

| 必要機能 | 再利用 | 新規 |
|----------|--------|------|
| shell 描画 | `SidebarShell` / `SidebarShellServer` | — |
| nav 構築 | `shell-config.ts`（`buildNavForRole`） | — |
| user menu | `SidebarUserMenu` / `user-menu-config.ts` | viewer 分岐強化のみ |
| avatar | `SidebarUserAvatar` | viewer variant 追加のみ |
| nav item | `SidebarNavItem` | active/badge 視認性のみ |
| login layout | `LoginShell`（auth-shell） | `(auth)/layout.tsx`（薄い wrapper）のみ新規 |

→ 新規 primitive ゼロ。NFR-3 充足。

## 参照資料

- Phase 1（要件定義）
- 09h-shell-and-fixtures.md §1.2 / §1.6 / §1.7
- 実装現状ファイル（Phase 1 参照資料に同じ）

## 完了条件

- [x] route topology（(auth) group 移動）を設計した
- [x] 表示条件マトリクス（route × role × shell）を正本として確定した
- [x] middleware x-pathname 注入 + 全 layout activePath 正確化を設計した
- [x] viewer/active/badge の UX を既存 primitive 分岐で設計した（新規 primitive ゼロ）
- [x] 状態所有権・責務境界を明記した
- [x] SubAgent lane と再利用方針を確定した
