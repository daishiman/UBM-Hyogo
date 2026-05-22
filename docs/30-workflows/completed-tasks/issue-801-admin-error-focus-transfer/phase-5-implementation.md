# Phase 5: Implementation — issue-801 admin error focus transfer

## 実装手順

### Step 1: 既存ファイル確認

```bash
cat apps/web/app/\(admin\)/admin/error.tsx
cat apps/web/app/error.tsx  # reference
```

確認ポイント:
- root error.tsx の `logger` import path → admin から見たパスは `../../../src/lib/logger`
- tsconfig path alias `@/lib/logger` が apps/web で有効なら優先

```bash
grep -n '"@/' apps/web/tsconfig.json
```

### Step 2: `apps/web/app/(admin)/admin/error.tsx` を全面書き換え

Phase 2 §3.1 のコードに置き換える。要点:

1. `"use client"` を最上行
2. `import Link from "next/link"`
3. `import { useEffect, useRef } from "react"`
4. `import { logger } from "../../../src/lib/logger"`（path alias 利用可能なら `@/lib/logger`）
5. component 名は `AdminError`
6. `useRef<HTMLHeadingElement>(null)` で `headingRef` 生成
7. `useEffect` 内で `logger.error → focus({ preventScroll: true })` の順序
8. logger payload に `scope: "admin"` を追加（root との区別）
9. wrapper に `role="alert"` + `aria-live="assertive"`
10. h1 に `ref={headingRef}` + `tabIndex={-1}` + `className="text-2xl font-semibold text-danger"`
11. p 文言「時間をおいて再試行してください。問題が続く場合は管理者にご連絡ください。」
12. `error.digest` 分岐の `<code>` 表示
13. `isDev` 分岐の `<pre>` stack 表示
14. ボタン className `rounded-md bg-accent px-4 py-2 text-sm text-panel`
15. Link href `/`（**`/admin` ではない**）、className `rounded-md border border-border px-4 py-2 text-sm`

### Step 3: 型・lint・テスト確認

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

エラーがあれば最小差分で修正。logger import 先が解決できなければ Step 1 のパス再確認。

### Step 4: テスト追加（Phase 6 で詳述）

`apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx` を新規作成。

### Step 5: ローカル smoke

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run admin/__tests__/error.component
```

## 完了条件 (DoD)

- `apps/web/app/(admin)/admin/error.tsx` が Phase 2 §3.1 のコードに置き換わっている
- `mise exec -- pnpm typecheck` 0 error
- `mise exec -- pnpm lint` 0 error / 0 warning
- AC-1〜AC-8 達成（コード側）
- Phase 6（テスト追加）に進める状態

## 注意事項

- **本プロンプトではコード実装は実行しない**。本ファイルは後続実行者（03.実装.md プロンプト or 人間）が確実に作業できる手順を記したもの
- `wrangler` 直接実行禁止（本タスクでは不要）
- commit / push / PR はユーザー明示承認まで実行禁止
- root error.tsx は **変更しない**（issue-769 で完了済み・スコープ外）
