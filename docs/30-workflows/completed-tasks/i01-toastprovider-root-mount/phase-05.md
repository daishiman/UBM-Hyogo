# Phase 5: 実装計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装計画 |
| 前 Phase | 4 (タスク分解) |
| 次 Phase | 6 (実装手順) |
| 状態 | completed |

## 目的

ST-01 / ST-02 の具体 diff を **完成形コード** として固定する。

## 変更対象ファイル一覧

| Path | 種別 | 行数 |
| --- | --- | --- |
| apps/web/app/layout.tsx | edit | +2 / -1（body wrap） |

## 完成形 diff

### Before

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "UBM Hyogo",
  description: "Runtime foundation for UBM Hyogo",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
```

### After

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "UBM Hyogo",
  description: "Runtime foundation for UBM Hyogo",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
```

### 差分要約

- `+1` 行: `import { ToastProvider } from "@/components/ui/Toast";`
- `-1` 行: `<body>{children}</body>`
- `+3` 行: `<body><ToastProvider>{children}</ToastProvider></body>` を 3 行に整形

正味 +4 行 / -1 行。

## 主要関数シグネチャ

変更なし。`RootLayout` の Props 型は不変。

## 入出力・副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | `children: ReactNode` |
| 出力 | `<html><body><ToastProvider>` でラップされた React tree |
| 副作用 | toast context が global に提供される。`useToast()` / `useOptionalToast()` が non-null を返す |

## ロールバック手順

Phase 6 で commit する前のため、`git checkout apps/web/app/layout.tsx` で即時 revert 可能。
commit 後は revert commit を 1 つ追加する。

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-05/implementation-plan.md | 完成形 diff + ロールバック手順 |

## 完了条件

- [x] Before / After 完成形コードが記載されている
- [x] 差分要約が +4 / -1 行で一致
- [x] ロールバック手順あり

## 次 Phase

Phase 6: 実装手順
