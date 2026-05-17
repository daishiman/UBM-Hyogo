# parallel-i07-profile-loading-skeleton: /profile/loading.tsx を OKLch skeleton に置換

**[実装区分: 実装仕様書]** — コード変更を伴う

## 目的

`parallel-07` spec section 4.5 で要求された `/profile/loading.tsx` の OKLch skeleton 化が未実装。

実コード:
```tsx
// 06b: /profile streaming 用 placeholder。
export default function ProfileLoading() {
  return (
    <main>
      <h1>マイページ</h1>
      <p aria-live="polite">読み込み中…</p>
    </main>
  );
}
```

簡素なテキストのみで skeleton pattern なし。本タスクで profile card layout (avatar + KV pairs)
の skeleton に統一する。

## スコープ

### 含む
- `apps/web/app/profile/loading.tsx` を skeleton 形状で置換
- a11y 属性: role="status" / aria-busy / aria-live / sr-only テキスト
- OKLch token (`--ubm-color-surface-2` 経由 utility) 使用

### 含まない
- profile page 本体の変更
- avatar / KV pair component の新規実装（skeleton 内で形状 div のみ）

## 変更対象ファイル

| Path | 種別 | 理由 |
|------|------|------|
| `apps/web/app/profile/loading.tsx` | modify | skeleton 化 |
| `apps/web/app/profile/loading.spec.tsx` | create | role/aria 属性検証 |

## 設計

### After (`apps/web/app/profile/loading.tsx`)

```tsx
import type { ReactElement } from "react";

export default function ProfileLoading(): ReactElement {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-3xl space-y-6 px-6 py-12"
      data-page="profile-loading"
    >
      <span className="sr-only">マイページを読み込み中</span>
      {/* avatar + heading row */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-8 w-48 rounded bg-surface-2 motion-safe:animate-pulse" />
      </div>
      {/* KV pairs */}
      <div className="space-y-3">
        <div className="h-6 w-full rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-6 w-5/6 rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-6 w-4/6 rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-6 w-3/6 rounded bg-surface-2 motion-safe:animate-pulse" />
      </div>
    </main>
  );
}
```

class はすべて既存 token 経由 utility (`bg-surface-2` = OKLch `--ubm-color-surface-2`)。
HEX 直書きなし。`motion-safe:animate-pulse` で `prefers-reduced-motion` を尊重。

## 関数シグネチャ

```ts
export default function ProfileLoading(): ReactElement;
```

## 入出力・副作用

| 時点 | 動作 |
|------|------|
| `/profile` streaming 中 | skeleton 表示 + sr-only アナウンス |
| streaming 完了 | Next.js が本体 page と差し替え |

## テスト方針

`apps/web/app/profile/loading.spec.tsx` (新規):

```ts
import { render, screen } from "@testing-library/react";
import ProfileLoading from "./loading";

it("role=status と aria-busy を持つ", () => {
  render(<ProfileLoading />);
  const status = screen.getByRole("status");
  expect(status).toHaveAttribute("aria-busy", "true");
  expect(status).toHaveAttribute("aria-live", "polite");
});

it("sr-only テキストが存在", () => {
  render(<ProfileLoading />);
  expect(screen.getByText("マイページを読み込み中")).toBeInTheDocument();
});
```

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/loading
```

## DoD

- [ ] `/profile/loading.tsx` が skeleton (avatar + 4 KV row) で render
- [ ] role=status / aria-busy=true / aria-live=polite を持つ
- [ ] motion-safe:animate-pulse 使用（reduced-motion 尊重）
- [ ] `loading.spec.tsx` PASS
- [ ] `pnpm typecheck` / `pnpm lint` PASS
- [ ] HEX 直書きなし（OKLch token utility のみ）
- [ ] p-07 spec 4.5 達成

## リスク

| リスク | 対策 |
|--------|------|
| `bg-surface-2` utility 未定義 | i05 / parallel-03 で追加された utility を再利用。なければ globals.css に最小追加 |
| skeleton が実 profile page と layout 差異 | max-w-3xl / spacing を実 page と揃える（実装時に grep 確認） |

## 並列性

- 独立: i01..i06 と編集対象ファイル重複なし
- 依存: なし

## スコープ確定ノート

このタスクは canonical workflow root へ昇格するか、in-place fix で完結するかをここで明示する。

- **status**: implemented_local_runtime_pending
- **canonical_workflow**: `docs/30-workflows/issue-770-profile-loading-skeleton/`
- **判断**: 当初は `/profile/loading.tsx` の skeleton 置換 + test 新規の 2 ファイル編集のみで in-place fix 完結予定だったが、Issue #770 として独立 tracking され、source unassigned task / integration-fixes index / aiworkflow ledgers との same-wave 同期が必要になったため canonical workflow root へ昇格した。実コードと focused unit evidence は local 完了、authenticated browser screenshot / staging runtime visual evidence は user-gated。
