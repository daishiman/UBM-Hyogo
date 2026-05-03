[実装区分: 実装仕様書]

# Phase 5: 実装ランブック — ut-05a-auth-ui-logout-button-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-auth-ui-logout-button-001 |
| phase | 5 / 13 |
| wave | Wave 5 follow-up |
| mode | parallel |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| execution_allowed | false until explicit_user_instruction |

## 目的

実装着手時の手順を再現可能なランブックとして固定する。今回の改善サイクルでは
user が実ファイル改善を明示したため、commit / push / PR を除く実コード変更を実施する。

## 実行タスク

1. `SignOutButton` と unit test を追加する。
2. `MemberHeader` を追加し、`(member)` layout と `/profile` に配置する。
3. `AdminSidebar` footer に `SignOutButton` を配置する。
4. typecheck / focused test / validator を実行する。

## 参照資料

- apps/web/src/components/ui/Button.tsx
- apps/web/app/profile/page.tsx
- apps/web/app/(member)/layout.tsx
- apps/web/src/components/layout/AdminSidebar.tsx

## 変更対象ファイル一覧（再掲）

| パス | 変更種別 |
| --- | --- |
| `apps/web/src/components/auth/SignOutButton.tsx` | 新規 |
| `apps/web/src/components/layout/MemberHeader.tsx` | 新規 |
| `apps/web/app/(member)/layout.tsx` | 編集 |
| `apps/web/app/profile/page.tsx` | 編集 |
| `apps/web/src/components/layout/AdminSidebar.tsx` | 編集 |
| `apps/web/src/components/auth/__tests__/SignOutButton.test.tsx` | 新規 |
| `docs/30-workflows/ut-05a-auth-ui-logout-button-001/outputs/phase-11/manual-smoke-log.md` | 新規 |

## 主要シグネチャ

### SignOutButton

```ts
// apps/web/src/components/auth/SignOutButton.tsx
"use client";
import { signOut } from "next-auth/react";
import { useState } from "react";

export type SignOutButtonProps = {
  readonly className?: string;
  readonly label?: string;
  readonly redirectTo?: string;
};

export function SignOutButton(props: SignOutButtonProps): JSX.Element;
```

- 入力: `props.label`（既定 `"ログアウト"`）/ `props.redirectTo`（既定 `"/login"`）
- 出力: `<button>` 要素（`data-testid="sign-out-button"`, `aria-label="ログアウト"`）
- 副作用: click 時 `await signOut({ redirectTo })` を呼び、進行中は `disabled` 状態にする

### MemberHeader

```ts
// apps/web/src/components/layout/MemberHeader.tsx
import { SignOutButton } from "../auth/SignOutButton";

export function MemberHeader(): JSX.Element;
```

- 出力: `<header>` 要素。右端に `<SignOutButton />`

## 実装ランブック手順（user 明示指示後）

### 0. 事前確認

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter web typecheck
mise exec -- pnpm --filter web lint
```

すでに baseline が green であることを確認する。

### 1. SignOutButton 新規作成

- ファイル新規作成
- `next-auth/react` の `signOut` を import
- `useState<boolean>` で `isPending` 管理
- click handler: `setIsPending(true); await signOut({ redirectTo });`

### 2. MemberHeader 新規作成

- `<header>` を返す server component
- 右端に `<SignOutButton />` を配置

### 3. (member) layout 編集

- `MemberLayout` を更新し、`<MemberHeader />` + `<main>{children}</main>` で wrap

### 4. AdminSidebar 編集

- 既存 nav items を保ったまま、`</ul>` の後にフッタ要素を追加し、`<SignOutButton />` を配置

### 5. テスト追加

- Vitest unit test: `SignOutButton.test.tsx`
- Manual smoke log: `outputs/phase-11/manual-smoke-log.md`

### 6. ローカル検証

```bash
mise exec -- pnpm --filter web typecheck
mise exec -- pnpm --filter web lint
mise exec -- pnpm --filter web test -- src/components/auth/__tests__/SignOutButton.test.tsx
# optional after authenticated storage state is available:
# mise exec -- pnpm --filter web exec playwright test playwright/tests/auth-signout.spec.ts
```

### 7. 手動 smoke

- ローカルで Google OAuth login → `/profile` / `/admin` で sign-out → `/login` redirect / `/api/auth/session` 確認
- screenshot は redaction 済で保存

## 入出力 / 副作用サマリ

- 入力: ユーザのクリック
- 出力: `/login` への遷移、Auth.js による session cookie 削除
- 副作用: `next-auth/react` 経由で `/api/auth/signout` POST → cookie clear

## DoD

- 上記 6 ファイルが作成 / 編集済み
- `typecheck` / `lint` / Vitest / Playwright がローカルで PASS
- 手動 smoke で AC-1〜AC-5 が確認できる
- M-08 evidence（before/after screenshot, session JSON, cookie 削除確認）が `outputs/phase-11/` に保存されている
- secret / 個人情報を含む log / image をリポジトリに残していない

## 統合テスト連携

- Auth.js 設定 / middleware は本タスクで触らない（上流契約に依存）
- Playwright 認証済 state が無い場合は手動 smoke fallback

## 多角的チェック観点

- `signOut` の `redirectTo` を `/login` 以外で呼んでいない
- `(public)` 配下に `<SignOutButton />` が混入していない
- `Button` primitive の variant を後付け拡張していない（必要なら別タスク）

## サブタスク管理

- [ ] 0〜7 の各ステップを実行可能な粒度で定義
- [ ] テストの mock 戦略を確定
- [ ] 手動 smoke 手順を確定
- [ ] outputs/phase-05/main.md を作成する

## 成果物

- outputs/phase-05/main.md

## 完了条件

- ランブック 0〜7 が実行可能粒度で確定
- 主要シグネチャ / DoD が明文化されている
- ローカル検証コマンドが実在 path で記述されている

## タスク100%実行確認

- [ ] secret / 個人情報を含めていない
- [ ] 仮置きパスが残っていない
- [ ] `signOut` の引数が `redirectTo: "/login"` で統一されている

## 次 Phase への引き渡し

Phase 6 へ、ランブックの異常系・失敗時手順を渡す。
