# parallel-i06-root-error-focus: root error.tsx に h1 自動 focus を追加

**[実装区分: 実装仕様書]** — コード変更を伴う

## 目的

`parallel-07` spec section 4.3 で要求された root `error.tsx` の focus 管理が未実装。

実コード (`apps/web/app/error.tsx`) で確認:
- `role="alert"` + `aria-live="assertive"` ✓ 既実装
- digest 表示 ✓ 既実装
- **h1 への自動 focus 未実装** ← 本タスクで追加

## スコープ

### 含む
- `useRef<HTMLHeadingElement>` を h1 に bind
- `useEffect` で error 受領時に h1 へ focus 移譲
- 既存スタイル / digest 表示 / dev stack 表示は変更しない

### 含まない
- error.tsx の文言変更
- logger 呼び出しの変更
- 別 boundary (`/login/error.tsx` 等) の変更（i05 で別途実施）

## 変更対象ファイル

| Path | 種別 | 理由 |
|------|------|------|
| `apps/web/app/error.tsx` | modify | h1 ref + focus useEffect |
| `apps/web/app/error.spec.tsx` | create or modify | focus 移譲検証 |

## 設計

### Before (`apps/web/app/error.tsx`)
```tsx
export default function RouteError({ error, reset }: Props) {
  useEffect(() => {
    logger.error({ event: "error.boundary.caught", digest: error.digest, err: error });
  }, [error]);
  // ...
  return (
    <div role="alert" aria-live="assertive" ...>
      <h1 className="text-2xl font-semibold text-danger">...</h1>
      ...
    </div>
  );
}
```

### After
```tsx
import { useEffect, useRef } from "react";

export default function RouteError({ error, reset }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    logger.error({ event: "error.boundary.caught", digest: error.digest, err: error });
    headingRef.current?.focus({ preventScroll: true });
  }, [error]);

  // ...
  return (
    <div role="alert" aria-live="assertive" ...>
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-danger">
        ...
      </h1>
      ...
    </div>
  );
}
```

差分は 4 行のみ:
1. `useRef` import 追加
2. ref 生成
3. `headingRef.current?.focus({ preventScroll: true })` 追加
4. h1 に `ref` + `tabIndex={-1}` 付与

## 関数シグネチャ

不変（`RouteError(props: Props)`）。

## 入出力・副作用

| 時点 | 動作 |
|------|------|
| error boundary catch | logger.error 呼び出し + h1 focus |
| reset click | reset() 呼び出し |

副作用追加: focus 移譲（screen reader 読み上げ促進）。`preventScroll: true` により視覚スクロールは抑制。

## テスト方針

`apps/web/app/error.spec.tsx` を新規作成（既存があれば追記）:

```ts
import { render, screen } from "@testing-library/react";
import RouteError from "./error";

it("マウント直後に h1 に focus が当たる", () => {
  render(<RouteError error={new Error("boom")} reset={() => {}} />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
});

it("digest を表示", () => {
  const err = Object.assign(new Error("boom"), { digest: "abc123" });
  render(<RouteError error={err} reset={() => {}} />);
  expect(screen.getByText(/abc123/)).toBeInTheDocument();
});
```

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run error
```

## DoD

- [ ] `apps/web/app/error.tsx` で h1 に `ref` + `tabIndex={-1}`
- [ ] useEffect で `focus({ preventScroll: true })` 呼び出し
- [ ] `error.spec.tsx` で focus 検証 PASS
- [ ] `pnpm typecheck` / `pnpm lint` PASS
- [ ] p-07 spec 4.3 (Root error.tsx focus 管理) 達成

## リスク

| リスク | 対策 |
|--------|------|
| `tabIndex={-1}` が visual outline を出す | 既存 focus-visible utility で抑制（CSS 側は変更不要） |
| logger.error と focus が同 useEffect で副作用順序が紛糾 | 同一 useEffect 内で順序を `logger → focus` 固定 |

## 並列性

- 独立: i01..i05, i07 と編集対象ファイル重複なし
- 依存: なし

## スコープ確定ノート

このタスクは canonical workflow root へ昇格するか、in-place fix で完結するかをここで明示する。

- **status**: pending
- **canonical_workflow**: null（in-place fix で完結予定）
- **判断**: 差分は 4 行 + test 1 ファイルのみで p-07 spec 4.3 の DoD 補完が目的。Phase 1-13 のフル昇格は不要と判断し、本 spec.md を発注書として in-place fix で完結させる。
