# parallel-i05-login-loading-and-error-focus: /login の loading.tsx 新規作成と error.tsx に focus 管理を追加

**[実装区分: 実装仕様書]** — コード変更を伴う

## 目的

`parallel-07-auth-and-shared` spec section 4.1, 4.2 で宣言された以下が**未実装**:

- `apps/web/app/login/loading.tsx`: ファイル不在
- `apps/web/app/login/error.tsx`: focus 管理 (`useRef` + `useEffect` で h1 へ focus) / Card layout / `aria-live="assertive"` 強化が未適用

p-07 DoD line 141, 142 が未達。本タスクで両者を完了させる。

## スコープ

### 含む
- `/login/loading.tsx` 新規作成（OKLch skeleton pattern, a11y 属性）
- `/login/error.tsx` に focus 管理 (h1 への自動 focus) を追加
- `/login/error.tsx` に `aria-live="assertive"` 強化、digest 表示は spec の範囲のみ
- 関連 component spec 追加

### 含まない
- Root `error.tsx` の focus 管理追加（p-07 spec 4.3、別タスク化が必要なら本 integration-fixes の続編で対応。今回は scope 外）
- `/profile/loading.tsx` の skeleton 化（p-07 spec 4.5、本タスク scope 外）
- Card / CardContent component の新規実装（既存があれば使用、なければ素の section + CSS class で代替）

### 先送り判定（CONST_007）

p-07 spec 4.3 (root error.tsx focus) と 4.5 (profile loading) は**今回サイクル内完了が前提**。
本 spec は `/login` 配下のみに scope を絞ったため、4.3 / 4.5 は別途 i06 / i07 として
**同じ integration-fixes 配下に追加すべき**。本 spec 単独で先送りはしていない（並列増設で対応）。

→ **要ユーザー確認**: 本 integration-fixes に i06 (root error focus), i07 (profile loading skeleton) を追加するか、
本 spec の scope を `/login` + root error + profile loading の 3 ファイル拡張に拡大するかを判断願います。
判断未済の段階では i05 単独で `/login` だけ完了させる前提で記述します。

## 変更対象ファイル

| Path | 種別 | 理由 |
|------|------|------|
| `apps/web/app/login/loading.tsx` | create | OKLch skeleton pattern + a11y |
| `apps/web/app/login/error.tsx` | modify | h1 への自動 focus、`aria-live="assertive"` 強化 |
| `apps/web/app/login/loading.spec.tsx` | create | role/aria 属性検証 |
| `apps/web/app/login/error.spec.tsx` | create or modify | focus 移譲検証 |

## 設計

### loading.tsx (新規)

```tsx
// /login route の loading boundary。
// OKLch skeleton + a11y (role=status, aria-busy=true, aria-live=polite)。
import type { ReactElement } from "react";

export default function LoginLoading(): ReactElement {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-md space-y-4 px-6 py-12"
      data-page="login-loading"
    >
      <span className="sr-only">ログイン画面を読み込み中</span>
      <div className="h-12 w-12 rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-8 w-2/3 rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-10 rounded bg-surface-2 motion-safe:animate-pulse" />
    </div>
  );
}
```

`bg-surface-2` class は parallel-03 の OKLch token (`--ubm-color-surface-2`) を参照する utility。
既存定義の有無を `apps/web/src/styles/globals.css` で確認し、未定義なら本 spec で `@layer components`
に追加（HEX 直書き禁止、token 経由のみ）。

### error.tsx (修正)

**Before** (現状):
```tsx
"use client";
import { useEffect } from "react";

export default function LoginError({ error, reset }: LoginErrorProps) {
  useEffect(() => {
    console.error("[login] route error", error);
  }, [error]);
  return (
    <main>
      <section role="alert">
        <h1>ログイン画面でエラーが発生しました</h1>
        <p>時間をおいて再度お試しください。</p>
        <button type="button" onClick={() => reset()}>再読み込み</button>
      </section>
    </main>
  );
}
```

**After**:
```tsx
"use client";
import { useEffect, useRef } from "react";

export interface LoginErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function LoginError({ error, reset }: LoginErrorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[login] route error", error);
    headingRef.current?.focus({ preventScroll: true });
  }, [error]);

  return (
    <main>
      <section role="alert" aria-live="assertive" data-page="login-error">
        <h1 ref={headingRef} tabIndex={-1}>
          ログイン画面でエラーが発生しました
        </h1>
        <p>時間をおいて再度お試しください。</p>
        {error.digest ? <p><code>error id: {error.digest}</code></p> : null}
        <button type="button" onClick={() => reset()}>再読み込み</button>
      </section>
    </main>
  );
}
```

変更点:
- `useRef<HTMLHeadingElement>` を h1 に bind
- `useEffect` で error 受領時に h1 へ focus
- `aria-live="assertive"` を section に追加（screen reader 即時アナウンス）
- digest 表示（spec 4.3 の意図に沿う最小実装。code block）

Card component を導入するかは optional。既存 `Card` / `CardContent` が `apps/web/src/components/ui/`
に存在する場合のみ採用。なければ素の section のままで focus + aria 強化を優先する（DoD line 141
"Card layout + focus 管理" のうち focus 管理を必須、Card layout は best-effort）。

## 関数シグネチャ

```ts
// loading.tsx
export default function LoginLoading(): ReactElement;

// error.tsx
export default function LoginError(props: LoginErrorProps): ReactElement;
export interface LoginErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}
```

## 入出力・副作用

| ケース | 動作 |
|--------|------|
| `/login` 初回 navigation 中 | `LoginLoading` が role=status + skeleton で render |
| `/login` で SSR / RSC 例外 | `LoginError` が h1 に自動 focus、aria-live=assertive で screen reader アナウンス |
| reset button click | reset() 呼び出し → Next.js が boundary を再 try |

## テスト方針

### `loading.spec.tsx`

```ts
import { render, screen } from "@testing-library/react";
import LoginLoading from "./loading";

it("role=status と aria-busy を持つ", () => {
  render(<LoginLoading />);
  const status = screen.getByRole("status");
  expect(status).toHaveAttribute("aria-busy", "true");
  expect(status).toHaveAttribute("aria-live", "polite");
});

it("sr-only テキストが存在", () => {
  render(<LoginLoading />);
  expect(screen.getByText("ログイン画面を読み込み中")).toBeInTheDocument();
});
```

### `error.spec.tsx`

```ts
import { render, screen } from "@testing-library/react";
import LoginError from "./error";

it("マウント直後に h1 に focus が当たる", () => {
  const reset = vi.fn();
  render(<LoginError error={new Error("boom")} reset={reset} />);
  const h1 = screen.getByRole("heading", { level: 1 });
  expect(h1).toHaveFocus();
});

it("digest があれば code 表示", () => {
  const err = Object.assign(new Error("boom"), { digest: "abc123" });
  render(<LoginError error={err} reset={() => {}} />);
  expect(screen.getByText(/abc123/)).toBeInTheDocument();
});

it("reset を呼ぶ", async () => {
  const reset = vi.fn();
  render(<LoginError error={new Error("boom")} reset={reset} />);
  await userEvent.click(screen.getByRole("button"));
  expect(reset).toHaveBeenCalled();
});
```

### a11y test (任意)

既存 jest-axe setup があれば、`expect(await axe(container)).toHaveNoViolations()` を 1 件追加。

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run login
mise exec -- pnpm -F "@ubm-hyogo/web" dev
# -> /login route で意図的に error を起こし、h1 にフォーカスが当たることを screen reader で確認
```

## DoD

- [ ] `/login/loading.tsx` が新規作成され、role=status / aria-busy=true / aria-live=polite を持つ
- [ ] `/login/error.tsx` が h1 への自動 focus を実装
- [ ] `/login/error.tsx` に `aria-live="assertive"` 追加
- [ ] digest がある場合のみ code 表示（条件 render）
- [ ] `loading.spec.tsx` / `error.spec.tsx` PASS
- [ ] `pnpm typecheck` / `pnpm lint` PASS
- [ ] HEX 直書きなし（OKLch token のみ）
- [ ] p-07 spec DoD line 141, 142 が満たされる

## リスク

| リスク | 対策 |
|--------|------|
| `bg-surface-2` Tailwind utility が未定義 | `apps/web/src/styles/globals.css` の `@layer utilities` で `--ubm-color-surface-2` 参照 utility を追加。既に i01..i04 と編集対象が分離されており衝突なし |
| Card component が未実装 | section + class で代替（focus 管理が必須項目、Card layout は best-effort） |
| `focus({ preventScroll: true })` が一部古いブラウザ未対応 | TypeScript 上は OK。実装は best-effort で fallback `.focus()` を試行する 1 行追加してもよい |

## 並列性

- 独立: i01, i02, i03, i04 と編集対象ファイル重複なし
- 依存: なし（OKLch token utility の追加で globals.css を編集する場合のみ parallel-03 と merge 注意）

## 関連 spec

CONST_007 (今回サイクル内完了) を守るため、p-07 spec 4.3 / 4.5 は以下の独立 spec として
本 integration-fixes 配下に追加済み:

- `parallel-i06-root-error-focus/spec.md` — root `error.tsx` の h1 自動 focus
- `parallel-i07-profile-loading-skeleton/spec.md` — `/profile/loading.tsx` の OKLch skeleton 化

3 件 (i05, i06, i07) を並列実行することで p-07 spec 4.1〜4.5 のうち未達分が全て完了する。

## スコープ確定ノート

このタスクは canonical workflow root へ昇格するか、in-place fix で完結するかをここで明示する。

- **status**: pending
- **canonical_workflow**: null（in-place fix で完結予定）
- **判断**: `/login/loading.tsx` 新規 + `/login/error.tsx` の focus 管理追加と test の 2-3 ファイル編集に収まるため Phase 1-13 のフル昇格は不要。本 spec.md を発注書として in-place fix で完結させる。Card layout の正式採用など prototype 整合範囲を超える設計判断が必要になった場合は canonical workflow root へ昇格させ `artifacts.json` を更新する。
