# Phase 4: テスト計画（TDD Red）

> 本 Phase は Task C「公開 / 会員 layout を SidebarShell へ統合」の **テスト計画（Red）**。
> 実装着手前に、shell mount 配線・旧 header 除去・route 移動を検証する unit / component test の
> 期待挙動を確定する。実コード（layout 改修・page 移動）は Phase 5 で行う。

## 1. テスト戦略概要

本タスクは「shell の所有権を page から layout（route group 単位）へ移す配線タスク」であり、
shell の内部実装（role 判定・nav・UserMenu）は依存 Task A/B/E が所有する。よってテストは
**Task C 側の配線責務だけ**を狭く検証する。

| 方針 | 内容 |
| --- | --- |
| テスト中心 | layout の **shell mount 配線** を検証する unit / component test（co-location `*.spec.tsx`） |
| 依存スタブ | `SidebarShellServer` / `SidebarUserMenu` / `SidebarMobileTrigger` は `vi.mock` で軽量スタブ化し、**Task C が「正しい props で mount しているか」「children と PublicFooter を渡しているか」だけ**を確認する。shell 内部挙動（role 判定・active state）は本タスクのテスト対象外（A/B/E の責務） |
| headers スタブ | `vi.mock("next/headers")` で `headers()` を stub し、`x-pathname` あり / なし（fallback）の両系統を検証する |
| async layout | `async function PublicLayout(...)` は `render(await PublicLayout({ children }))` 形式で評価する（既存 layout.spec の async 化に追従） |
| 回帰 guard | 旧 `PublicHeader` / `MemberHeader` が DOM に出ない・参照 0 を guard する（AC-C2/AC-C3） |
| 範囲 | API / D1 / session 実体には触れない。session 取得は shell 内部（スタブ）に閉じる |

### 依存スタブの例（Phase 5 実装時にも流用）

```tsx
// SidebarShellServer をスタブ化し、受け取った props と children を観測可能にする
vi.mock("../../src/components/shell/SidebarShell.server", () => ({
  SidebarShellServer: ({ activePath, children, mobileTriggerSlot }: {
    activePath: string;
    children: React.ReactNode;
    mobileTriggerSlot: React.ReactNode;
  }) => (
    <div data-testid="sidebar-shell-stub" data-active-path={activePath}>
      <div data-testid="mobile-trigger-slot">{mobileTriggerSlot}</div>
      {children}
    </div>
  ),
}));

vi.mock("../../src/components/shell/SidebarMobileTrigger", () => ({
  SidebarMobileTrigger: () => <button data-testid="mobile-trigger-stub" />,
}));

// next/headers の stub（x-pathname あり / なし を切替）
const headerStore = { get: vi.fn() };
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => headerStore),
}));
```

> スタブは `SidebarShellServer` が **async** 関数であっても、テスト側は `await PublicLayout(...)` の
> 中で React 要素として解決されれば良い（layout が shell を子として `return` するため、shell スタブ自体は
> 同期コンポーネントで十分。layout の `await headers()` 経路を検証することが本質）。

## 2. テストケース表（ファイル × ケース × 期待値 × 対応 AC）

### 2.1 `apps/web/app/(public)/layout.spec.tsx`（編集）

| # | ケース | 期待値 | 対応 AC |
| --- | --- | --- | --- |
| P-1 | shell が mount される | `render(await PublicLayout({ children }))` で `[data-testid="sidebar-shell-stub"]` が存在 | AC-C1/AC-C5 |
| P-2 | `data-shell-mode="sidebar"` 契約 | wrapper（`[data-testid="public-shell"]`）が `data-shell-mode="sidebar"` を持つ | AC-C1 |
| P-3 | `data-route-group="public"` 維持 | wrapper が `data-route-group="public"` / `data-theme="warm"` を持つ（既存アサーション回帰保護） | AC-C1 |
| P-4 | children が shell 配下に render | `[data-testid="sidebar-shell-stub"]` 内に渡した `[data-testid="child"]` が存在 | AC-C1 |
| P-5 | PublicFooter が children 末尾に存在 | shell スタブ内の最後の子要素として `PublicFooter` の出力（例: footer / `data-testid` 等の識別子）が存在 | AC-C4 |
| P-6 | PublicHeader が DOM に出ない | `container.querySelector` で旧 header マーカー（`[data-shell="topbar"]` または PublicHeader 固有 testid）が **null** | AC-C2 |
| P-7 | `activePath` が shell に渡る（x-pathname あり） | `headerStore.get` が `"/members"` を返す設定で `[data-active-path="/members"]` | AC-C1/AC-C5 |
| P-8 | `activePath` fallback（x-pathname なし） | `headerStore.get` が `null` を返す設定で `[data-active-path="/"]`（`?? "/"`） | AC-C5 |
| P-9 | mobileTriggerSlot が渡る | `[data-testid="mobile-trigger-slot"]` 内に `[data-testid="mobile-trigger-stub"]` が存在 | AC-C1 |
| P-10 | async layout を `await` で render | `await PublicLayout(...)` が JSX を解決し throw しない | AC-C5 |
| P-11 | axe critical 違反 0（回帰保護） | 既存の axe アサーションを維持（shell スタブ下でも critical 0） | AC-C9 |

### 2.2 `apps/web/app/(member)/layout.spec.tsx`（編集）

| # | ケース | 期待値 | 対応 AC |
| --- | --- | --- | --- |
| M-1 | shell が mount される | `[data-testid="sidebar-shell-stub"]` が存在 | AC-C1/AC-C5 |
| M-2 | `data-shell-mode="sidebar"` 契約 | wrapper（`[data-testid="member-shell"]`）が `data-shell-mode="sidebar"` を持つ | AC-C1 |
| M-3 | `data-route-group="member"` 維持 | wrapper が `data-route-group="member"` / `data-theme="warm"`（既存回帰保護） | AC-C1 |
| M-4 | children が shell 配下に render | shell スタブ内に `[data-testid="child"]` が存在 | AC-C1 |
| M-5 | MemberHeader が DOM に出ない | 旧 header マーカー（`[data-shell="topbar"]` / MemberHeader 固有 testid）が **null** | AC-C2 |
| M-6 | `activePath` fallback | x-pathname なしで `[data-active-path="/profile"]`（member の fallback） | AC-C5 |
| M-7 | mobileTriggerSlot が渡る | `[data-testid="mobile-trigger-slot"]` 内にトリガースタブ | AC-C1 |
| M-8 | async layout を `await` で render | throw しない | AC-C5 |
| M-9 | axe critical 違反 0 | 既存 axe アサーション維持 | AC-C9 |

> member layout には footer がないため P-5 相当（PublicFooter）は member 側には存在しない（現行 member layout に footer なし）。

### 2.3 `apps/web/app/(member)/profile/page.spec.tsx`（編集）

profile page の `MemberHeader` 直接 mount（2 箇所: `!meResult.ok` 分岐 / `!profileResult.ok` 分岐）除去の回帰 guard。

| # | ケース | 期待値 | 対応 AC |
| --- | --- | --- | --- |
| PR-1 | 正常系で MemberHeader が render されない | 成功パスの `render(await ProfilePage())` 後、MemberHeader 固有マーカーが DOM に出ない | AC-C6 |
| PR-2 | /me 失敗 degrade 分岐で MemberHeader が render されない | 既存「セッション情報を取得できませんでした」分岐後も MemberHeader マーカーが null（既存アサーション「alert に文言」は維持） | AC-C6 |
| PR-3 | profile 失敗 degrade 分岐で MemberHeader が render されない | 既存「プロフィールを読み込めませんでした」分岐後も MemberHeader マーカーが null | AC-C6 |
| PR-4 | 既存挙動の回帰保護 | `redirect` / `notFound` の既存 4 ケース（auth required redirect / 404 notFound / degrade ×2）が変わらず green | AC-C9 |

> profile page から `import { MemberHeader }` を削除するため、既存 spec が MemberHeader を mock していた場合はその mock も削除する（現行 page.spec は MemberHeader を mock していないため追加 mock 不要）。
> profile page の `<MemberHeader />` 除去後、degrade 分岐の wrapper は `<main>` 直下（layout が shell を提供するため page 側 header は不要）になる。spec はマーカー非存在のみを確認し、段組の見た目は Phase 11 visual に委ねる。

### 2.4 移動 page の存在確認（route 移動の構造 guard）

route group 移動後も `/` 等を担う page が新パスに存在することを確認する。Vitest からの import 解決で代替する（path 存在 = import 成功）。

| # | ケース | 期待値 | 対応 AC |
| --- | --- | --- | --- |
| MV-1 | `(public)/page.tsx` が `/` を担う | `import HomePage from "apps/web/app/(public)/page"` 相当が解決でき、`(public)/page.spec.tsx`（新規 or 移動）が green | AC-C7/AC-C10 |
| MV-2 | `(public)/privacy/page.tsx` が存在 | 移動後 spec（または import smoke）で解決 | AC-C7/AC-C10 |
| MV-3 | `(public)/terms/page.tsx` が存在 | 同上 | AC-C7/AC-C10 |
| MV-4 | `(public)/login/page.tsx` が存在 | 移動後 login spec 群（`__tests__/error.component.spec.tsx` 等）が新パスで green | AC-C7/AC-C10 |

> URL 不変性（route group `()` が URL に出ないこと）の**実 HTTP 200 検証**は Phase 11（manual / smoke）で行う。Phase 4 では「新パスでファイルが import / render 解決できる」ことを構造 guard とする。

### 2.5 grep gate（参照 0 の QA step）

これは unit test ではなく QA / CI step として明示する。Phase 9 でも再実行する。

| # | チェック | コマンド | 期待 | 対応 AC |
| --- | --- | --- | --- | --- |
| G-1 | `PublicHeader` 参照 0（doc / archive 除く） | `grep -rn "PublicHeader" apps/web/ --include="*.ts" --include="*.tsx" \| grep -v node_modules` | ヒット 0 | AC-C2 |
| G-2 | `MemberHeader` 参照 0 | `grep -rn "MemberHeader" apps/web/ --include="*.ts" --include="*.tsx" \| grep -v node_modules` | ヒット 0 | AC-C2 |
| G-3 | 旧 component ファイルが削除済み | `git status --porcelain` に `PublicHeader.tsx` / `MemberHeader.tsx` + 各 spec の `D`（削除）が出る | AC-C3 |

## 3. private / async コンポーネントのテスト方針

- layout / page はいずれも **async server component**。テストは `render(await PublicLayout({ children }))` /
  `render(await ProfilePage())` 形式で評価する（既存 `profile/page.spec.tsx` の `render(await ProfilePage())` に追従）。
- 既存 `(public)/layout.spec.tsx` / `(member)/layout.spec.tsx` は現状 **同期** layout を `render(<PublicLayout>...)`
  で評価している。Phase 5 で layout を async 化するため、**spec も `render(await PublicLayout({ children }))` 形式へ書き換える**（これが Red の主要差分の一つ）。
- shell スタブ / mobileTrigger スタブ / headers スタブはすべて `vi.mock` で注入する。session・API は呼ばれない（shell 内部に閉じる）。

## 4. 命名規則整合チェック（co-location `.spec.tsx`）

| 規約 | 適用 |
| --- | --- |
| test ファイル拡張子 | `*.spec.tsx` のみ（CLAUDE.md 不変条件 #8: `*.test.*` 禁止。lefthook `block-test-suffix` / CI `verify-test-suffix` が reject） |
| 配置 | co-location（対象ファイルと同ディレクトリ）。`__tests__/(public)-layout.spec.tsx` のような新規 wrapper ディレクトリは**作らない**。既存 `layout.spec.tsx` / `page.spec.tsx` を編集する |
| 新規追加 | `(public)/page.spec.tsx` のみ新規作成可（root に `page.spec.tsx` が存在しないため）。移動 spec（login `__tests__/*` 等）は `git mv` で追従 |

## 5. TDD Red 期待結果（実装前の fail 想定）

実装（Phase 5）前にテストを更新すると、以下が **fail（Red）** する想定。これが正しい Red 状態。

| 新規 / 変更アサーション | 実装前の結果 | Red の理由 |
| --- | --- | --- |
| P-1/M-1 shell mount | fail | 現 layout は `SidebarShellServer` を mount していない（`PublicHeader`/`MemberHeader` を mount） |
| P-2/M-2 `data-shell-mode="sidebar"` | fail | 現 wrapper に `data-shell-mode` 属性なし |
| P-6/M-5 旧 header 不在 | fail | 現 layout は `[data-shell="topbar"]` 内に旧 header を持つ |
| P-7/P-8/M-6 activePath | fail | 現 layout は headers を読まず activePath を渡さない |
| P-10/M-8 async render | fail | 現 layout は同期関数。`await PublicLayout(...)` が React 要素を直接返さない形に変わる |
| PR-1..3 profile header 不在 | fail | 現 profile page は degrade 分岐で `<MemberHeader />` を 2 箇所 render |
| MV-1..4 移動 page | fail | 移動前は新パスに page が存在しない（import 解決失敗） |
| G-1/G-2 grep 0 | fail | 移動・削除前は header 参照が残る |

> Phase 5 実装完了後にすべて green に転じることを Phase 6/9 で確認する。

## 6. esbuild / worktree 前提チェック（FB-MSO-002）

worktree ごとに `node_modules` が独立するため、focused test 実行前に以下を確認する。

```bash
# 1. worktree 直後は依存を入れ直す（esbuild バイナリ mismatch 回避）
mise exec -- pnpm install

# 2. esbuild / vitest runtime の 3 verify（arch / worktree isolation / esbuild version）
mise exec -- pnpm verify:vitest-runtime
```

- `esbuild` のグローバル / ローカル version 不整合で Vitest が起動失敗する既知事象（Issue #747）に当たる場合は
  `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md` を参照。
- すべてのコマンドは Node 24 を保証するため `mise exec --` 経由で実行する。

## 7. ローカル実行コマンド

focused run（全件 run は避ける。FB-UI-02-2）:

```bash
# 公開 / 会員 layout・page の focused test（移動後パス基準）
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  "apps/web/app/(public)" \
  "apps/web/app/(member)"
```

個別実行例:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run "apps/web/app/(public)/layout.spec.tsx"
mise exec -- pnpm --filter @ubm-hyogo/web test --run "apps/web/app/(member)/layout.spec.tsx"
mise exec -- pnpm --filter @ubm-hyogo/web test --run "apps/web/app/(member)/profile/page.spec.tsx"
```

> 移動前（Phase 5 着手前）は path が `apps/web/app/login/...` など旧階層。Phase 5 の `git mv` 後に上記新パスへ統一する。

## 完了条件

- テストケース表（2.1〜2.5）が AC-C1..C10 へ trace されている。
- Red 期待結果（§5）が確定し、Phase 5 実装で green へ転じる対象が明示されている。
- 依存スタブ方針（`vi.mock` で shell / mobileTrigger / next/headers をスタブ）が Phase 5 へ引き渡せる。
