# Phase 6: 実装手順

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 実装手順 |
| 前 Phase | 5 (実装計画) |
| 次 Phase | 7 (テスト計画) |
| 状態 | completed |

## 目的

Phase 5 の完成形 diff を実コードに適用するための **オペレーション手順** を確定する。

## 実行ステップ

### Step 1: 現状確認
```bash
git status --porcelain apps/web/app/layout.tsx
git log -1 --format="%H %s" apps/web/app/layout.tsx
```

期待: clean / 直近 commit が i01 未着手状態。

### Step 2: ファイル編集

Edit ツールで以下 2 件の置換を実施:

#### Edit 1: import 追加

old:
```tsx
import "@/styles/globals.css";

export const metadata: Metadata = {
```

new:
```tsx
import "@/styles/globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
```

#### Edit 2: body wrap

old:
```tsx
      <body>{children}</body>
```

new:
```tsx
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
```

### Step 3: 即時検証
```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

両方 PASS であることを確認。

### Step 4: 編集結果の確認
```bash
git diff apps/web/app/layout.tsx
```

期待: +4 / -1 行（Phase 5 と一致）。

## ロールバック手順

問題発生時:
```bash
git checkout HEAD -- apps/web/app/layout.tsx
```

## 注意事項

- `@/components/ui/Toast` の alias 解決は `apps/web/tsconfig.json` の paths 設定に依存。typecheck で resolve 失敗が出た場合は alias 確認。
- `body` 内に他の sibling 要素を増やさない（child は `ToastProvider` 1 つに統一）。

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-06/implementation-steps.md | 上記 Step 1〜4 の手順記録 + 実行ログ |

## 完了条件

- [x] Step 1〜4 すべて実行済
- [x] typecheck / lint PASS
- [x] diff が Phase 5 と一致

## 次 Phase

Phase 7: テスト計画
