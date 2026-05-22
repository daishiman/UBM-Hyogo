# Phase 2: Design — issue-801 admin error focus transfer

## 1. 設計概要

root `apps/web/app/error.tsx`（issue-769 で完成）を **テンプレート移植** し、admin 文脈に必要な箇所のみ調整する。新規 primitive やカスタム hook は導入しない。

## 2. アーキテクチャ判断

### 2.1 segment-level 1 枚 vs route-level 分散

**案 A (採用): segment-level 1 枚 = `(admin)/admin/error.tsx`**

- 配置: `apps/web/app/(admin)/admin/error.tsx` 1 ファイル
- catch 範囲: `/admin` page と nested child routes (members/, tags/, meetings/, schema/, requests/, identity-conflicts/, audit/) の render error。`apps/web/app/(admin)/layout.tsx` で throw された layout error はこの boundary の外側なので対象外。
- 長所: 実装 1 箇所で a11y hardening が完結。文言・ログ event 名・トークン使用を 1 箇所統一。root error.tsx と同じ「segment 単位 1 枚」原則
- 短所: route 固有 UX 出し分けは不可（本タスクでは不要）

**案 B (却下): route-level 分散**

- 短所: 同じ a11y hardening を 8 箇所複製 → DRY 違反 / 漏れリスク。共通 hook 抽出を本タスク内で強制される（順序逆転）

**判断**: 案 A。`parallel-07` spec section 4.3 が要求する a11y 水準は `/admin` route 配下一律のため route 固有差別化の根拠なし。Next.js のデフォルト error boundary 解決順序（最も近い child segment-level error.tsx）と整合。layout failure まで admin 専用 UI で扱う場合は `apps/web/app/(admin)/error.tsx` が別スコープになる。

### 2.2 共通 hook 抽出のタイミング

issue-769-followup-001 で `useAutoFocusOnMount(ref)` 共通 hook 抽出が検討中。本タスクでは **inline 実装** を採用し、hook 抽出は root / admin / login / profile が揃って merge された後に 4 箇所一括で実施する。

理由:
1. 並列実行下で同じ hook を編集すると衝突リスク
2. inline 差分は 4 行程度で、hook 移行時の置換は機械的
3. issue-769 の判断 "Requires i05 and i06 to settle first" に整合

### 2.3 admin auth gate との競合回避

`specs/13-mvp-auth.md` で admin route は session 検証 → 未認証なら `/login` redirect。Next.js は `redirect` を `NEXT_REDIRECT` 内部例外として処理し error boundary に伝播 **しない** → 競合なし。

本タスクでは「digest / message を見て auth error を識別する分岐」は **入れない**（スコープ外）。代わりに「トップへ戻る」リンク先を `/admin` ではなく `/`（公開 top）にして、auth 切れ時の無限ループを回避する。

## 3. ファイル設計

### 3.1 `apps/web/app/(admin)/admin/error.tsx`（rewrite）

```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { logger } from "../../../src/lib/logger";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    logger.error({
      event: "error.boundary.caught",
      scope: "admin",
      digest: error.digest,
      err: error,
    });
    headingRef.current?.focus({ preventScroll: true });
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mx-auto max-w-2xl px-6 py-16"
    >
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-semibold text-danger"
      >
        管理画面を表示できませんでした
      </h1>
      <p className="mt-2 text-sm text-text-3">
        時間をおいて再試行してください。問題が続く場合は管理者にご連絡ください。
      </p>
      {error.digest && (
        <p className="mt-4 text-xs text-text-3">
          エラーID: <code>{error.digest}</code>
        </p>
      )}
      {isDev && (
        <pre className="mt-6 max-h-64 overflow-auto rounded-md bg-surface-2 p-3 text-xs">
          {error.stack ?? error.message}
        </pre>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-accent px-4 py-2 text-sm text-panel"
        >
          再試行する
        </button>
        <Link
          href="/"
          className="rounded-md border border-border px-4 py-2 text-sm"
        >
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}
```

### 3.2 root との差分一覧

| 観点 | root | admin |
|---|---|---|
| component name | `RouteError` | `AdminError` |
| logger payload | `{ event, digest, err }` | `{ event, scope: "admin", digest, err }` |
| h1 文言 | 「画面を表示できませんでした」 | 「管理画面を表示できませんでした」 |
| p 文言 | 「時間をおいて再試行してください...」 | 「時間をおいて再試行してください。問題が続く場合は管理者にご連絡ください。」 |
| Link href | `/` | `/`（auth 切れ loop 回避のため admin/ にしない） |
| logger import path | `../src/lib/logger` | `../../../src/lib/logger` |

## 4. データフロー

```
Next.js runtime error in (admin)/admin/** route
  → AdminError({error, reset}) mount
    → useEffect:
        1. logger.error({ event: "error.boundary.caught", scope: "admin", digest, err })
        2. headingRef.current?.focus({ preventScroll: true })
    → screen reader announces aria-live="assertive" region
    → user can press reset button → reset() rebuilds segment
    → user can click "トップへ戻る" → navigate to "/"
```

## 5. エラー・副作用

| 状況 | 挙動 |
|---|---|
| `error.digest` 不在 | digest ブロック非表示 |
| `error.stack` 不在 | dev 時は `error.message` を pre に表示 |
| production env | pre ブロック全体非表示（情報漏洩抑制） |
| `headingRef.current` が null | optional chaining で no-op |
| 同一 error の rerender | `useEffect` 依存配列 `[error]` で再実行抑制（参照同値） |

## 6. 不変条件 trace

- 既存 API 接続変更なし（本ファイルは UI のみ）
- OKLch トークンのみ使用（HEX 直書きなし）
- `apps/web` から D1 直接アクセスなし
- `apps/web/src/lib/env.ts` 経由の env 参照（`process.env.NODE_ENV` のみで、機密値参照なし）
