# Phase 5 — 実装

## 1. 前提確認（実装着手前）

- [ ] Task A が完了している（`apps/web/src/lib/auth-view.ts` に `getAuthView()` export 存在、`apps/web/src/components/public/PublicHeader.tsx` が `authView` prop を受ける async 互換版になっている）
- [ ] `mise exec -- pnpm install` が green
- [ ] 作業ブランチが `feature/*` で `origin/dev` 最新と同期済

未充足の場合は本 Task を block し、Task A 完了待ち。

## 2. 編集手順

### Step 1: `apps/web/app/privacy/page.tsx`

1. 既存 import 群に以下を追加:
   ```ts
   import { PublicHeader } from "../../src/components/public/PublicHeader";
   import { PublicFooter } from "../../src/components/public/PublicFooter";
   import { getAuthView } from "../../src/lib/auth-view";
   ```
2. `export default function PrivacyPage()` を `export default async function PrivacyPage()` に変更
3. 関数冒頭で `const authView = await getAuthView();`
4. 既存の `<main data-page="privacy" ...>` を Phase 2 設計の `<div data-testid="public-shell" ...>` でラップし、`<header data-shell="topbar"><PublicHeader authView={authView} /></header>` を `<main>` の前に、`<footer data-shell="footer"><PublicFooter /></footer>` を `<main>` の後に挿入
5. `<main>` 配下の `<LegalProse>...</LegalProse>` および本文は**一切変更しない**
6. `export const metadata` は変更しない

### Step 2: `apps/web/app/terms/page.tsx`

`/privacy` と同じ手順で、`data-page="terms"` を維持して shell ラップ。

### Step 3: spec 2 本を Phase 4 仕様に従って新規作成

- `apps/web/app/privacy/__tests__/page.spec.tsx`
- `apps/web/app/terms/__tests__/page.spec.tsx`

## 3. 差分方針

- 既存 import / metadata / LegalProse 本文の行は触らない（grep で本文文字列の diff が 0 になることを目視確認）
- `(public)` route group 配下への移動は行わない
- `PublicHeader` / `PublicFooter` の signature 変更は本 Task で行わない（Task A 範疇）

## 4. 入出力 / 副作用

- 入力: なし（Server Component。session は `getAuthView()` 経由でのみ取得）
- 副作用: なし
- 出力: SSR HTML（shell + header + main + footer）

## 5. ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  app/privacy/__tests__/page.spec.tsx \
  app/terms/__tests__/page.spec.tsx
```

## 6. 想定差分量

| ファイル | 追加 | 削除 |
|---------|------|------|
| `apps/web/app/privacy/page.tsx` | +20 行程度 | -1 行（`function` → `async function` 含む） |
| `apps/web/app/terms/page.tsx` | +20 行程度 | -1 行 |
| `apps/web/app/privacy/__tests__/page.spec.tsx` | +80 行程度 | 0 |
| `apps/web/app/terms/__tests__/page.spec.tsx` | +80 行程度 | 0 |

## 7. DoD 連動チェック

- [ ] typecheck green
- [ ] lint green
- [ ] privacy spec 全ケース pass
- [ ] terms spec 全ケース pass
- [ ] `grep -n "プライバシーポリシー" apps/web/app/privacy/page.tsx` の出現箇所が現状と一致
- [ ] `grep -n "利用規約" apps/web/app/terms/page.tsx` の出現箇所が現状と一致
- [ ] `grep -n "#" apps/web/app/{privacy,terms}/page.tsx` で HEX 直書きが 0 件
