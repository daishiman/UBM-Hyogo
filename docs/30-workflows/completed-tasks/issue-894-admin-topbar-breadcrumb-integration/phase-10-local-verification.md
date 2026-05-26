# Phase 10: Local Verification

## 1. Overview

実装完了後にローカルで実行するコマンド群を列挙する。すべて `mise exec --` 経由で Node 24 / pnpm 10 を保証する。

## 2. 必須コマンド

### 2.1 layout integration spec

```bash
mise exec -- pnpm exec vitest run "apps/web/app/(admin)/layout.spec.tsx"
```

期待: 全 case pass / axe critical 0 / 新規 assertion（slot 内 breadcrumb primitive 検出）pass

### 2.2 Breadcrumb primitive spec（影響なし確認）

```bash
mise exec -- pnpm exec vitest run "apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx"
```

期待: 既存 case が無修正で pass

### 2.3 型チェック

```bash
mise exec -- pnpm typecheck
```

期待: 0 error

### 2.4 リント

```bash
mise exec -- pnpm lint
```

期待: 0 warning

## 3. 仕様準拠 grep

### 3.1 「管理」ラベル重複検出

```bash
grep -rn 'label: "管理"' "apps/web/app/(admin)/admin/" || echo "0 hit"
```

期待: 0 hit

### 3.2 layout が server component のままであること

```bash
head -1 "apps/web/app/(admin)/layout.tsx"
```

期待: `"use client"` でない（既存 import 文 or 空行 or コメント）

### 3.3 HEX 直書き / arbitrary class が増えていないこと

```bash
git diff dev...HEAD -- "apps/web/app/(admin)/" \
  | grep -E '^\+' | grep -E '(#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#)' || echo "0 hit"
```

期待: 0 hit

## 4. 手動 dev 動作確認

```bash
mise exec -- pnpm --dir apps/web dev
```

ブラウザで確認:

1. `http://localhost:3000/admin` を開く
2. topbar の左に「管理」が current breadcrumb label として表示される（href=/admin link ではない）
3. ページ見出し直下に「ダッシュボード」のみが breadcrumb として表示される（「管理 / ダッシュボード」ではないこと）
4. `/admin/members` に遷移
5. topbar の「管理」current label は維持されたまま
6. ページ見出し直下が「会員管理」のみであること

## 5. 全体検証コマンド（Phase 13 commit 直前）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

期待: すべて pass
