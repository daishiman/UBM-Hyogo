# Phase 5: 実装手順

## 0. 事前確認

```bash
mise exec -- node -v   # v24.15.0 を確認
grep -n "bg-surface-2\|--ubm-color-surface-2" apps/web/src/styles/tokens.css apps/web/src/styles/globals.css
```

`bg-surface-2` utility が未定義の場合のみ Step 5 を実行する（既存定義あれば skip）。

## 1. Step 1: `apps/web/app/login/loading.tsx` 新規作成

Phase 2 §5 LoginLoading の snippet をそのまま作成。

```tsx
import type { ReactElement } from "react";
import { Card, CardContent } from "@/components/ui/Card";

export default function LoginLoading(): ReactElement {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Card>
        <CardContent
          role="status"
          aria-busy="true"
          aria-live="polite"
          className="space-y-4 p-6"
          data-page="login-loading"
        >
          <span className="sr-only">ログイン画面を読み込み中</span>
          <div className="h-12 w-12 rounded bg-surface-2 motion-safe:animate-pulse" />
          <div className="h-8 w-2/3 rounded bg-surface-2 motion-safe:animate-pulse" />
          <div className="h-10 rounded bg-surface-2 motion-safe:animate-pulse" />
        </CardContent>
      </Card>
    </main>
  );
}
```

> `@/components/ui/Card` の path alias が `apps/web/tsconfig.json` で解決されているか Phase 2 §1 で確認済み。未解決の場合は relative path `"../../src/components/ui/Card"` に変更。

## 2. Step 2: `apps/web/app/login/error.tsx` 修正

Phase 2 §5 LoginError snippet で全置換。差分の要点:

1. `import { useEffect, useRef } from "react";` に `useRef` 追加
2. `import { Card, CardContent } from "@/components/ui/Card";` 追加
3. `const headingRef = useRef<HTMLHeadingElement>(null);` 追加
4. `useEffect` 内に `headingRef.current?.focus({ preventScroll: true });` 追加
5. `<main>` を `<main className="mx-auto max-w-md px-6 py-12"><Card><CardContent role="alert" aria-live="assertive" ...>` に置換
6. h1 に `ref={headingRef} tabIndex={-1} className="text-xl font-semibold"` 付与
7. digest 条件 render `{error.digest ? <p><code>error id: {error.digest}</code></p> : null}` を h1 と p の間（reset button 上）に挿入

## 3. Step 3: `apps/web/app/login/loading.spec.tsx` 新規作成

Phase 4 §3 loading.spec.tsx の snippet をそのまま作成。

## 4. Step 4: `apps/web/app/login/error.spec.tsx` 新規作成

Phase 4 §3 error.spec.tsx の snippet をそのまま作成。`@testing-library/user-event` が `apps/web/package.json` の devDependencies にない場合は既存テストの import 規約に合わせて `fireEvent.click` に置換。

## 5. Step 5: `bg-surface-2` utility 追加（条件付き）

Step 0 で未定義と判定された場合のみ、`apps/web/src/styles/globals.css` の末尾 `@layer utilities` ブロックに以下を追加。

```css
@layer utilities {
  .bg-surface-2 { background-color: var(--ubm-color-surface-2); }
}
```

`--ubm-color-surface-2` token が `apps/web/src/styles/tokens.css` に存在することを再確認（未存在の場合は task-09 spec に従い token を先に追加。本タスク scope では既存前提）。

## 6. Step 6: 型・lint チェック

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

両方 PASS まで反復修正（最大 3 サイクル / CONST_007 範囲内）。

## 7. Step 7: テスト実行

```bash
mise exec -- pnpm --filter @ubm/web test -- app/login/loading.spec.tsx app/login/error.spec.tsx
```

全 TC PASS を確認。

## 8. ローカル動作確認

```bash
mise exec -- pnpm --filter @ubm/web dev
# 別 terminal で
open http://localhost:3000/login
```

確認項目:
- 通常 navigation: skeleton が一瞬表示される（throttle DevTools 推奨）
- error 強制発生: 一時的に page.tsx に `throw new Error("forced");` を入れて reload → h1 自動 focus / digest 表示 / reset で復帰
- 確認後 `throw` は必ず削除

## 9. 完了報告ファイル更新

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` の i05 行を `implemented_local_runtime_pending` → `implemented` に更新（Phase 11 後）
- parallel-07 DoD line 141, 142 に消し込みコメント追記

## 10. DoD（Definition of Done）

- [ ] `apps/web/app/login/loading.tsx` が存在し、上記 a11y 属性を持つ
- [ ] `apps/web/app/login/error.tsx` が `useRef + tabIndex={-1} + useEffect(.focus())` パターンを実装
- [ ] `section[role="alert"]` に `aria-live="assertive"` 付与
- [ ] digest 条件 render が動作
- [ ] Card layout 適用
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm --filter @ubm/web test -- app/login` 全 PASS（loading.spec / error.spec 含む）
- [ ] localhost 上で navigation skeleton と error focus を目視確認済み
- [ ] 既存 console.error log prefix `[login] route error` が保持されている
