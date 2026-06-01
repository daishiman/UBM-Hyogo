# Phase 2: 設計

> issue-1024 — sidebar collapse 状態の cookie 永続化

## 2.1 既存コンポーネント再利用可否（[FB-SDK-07-1]）

新規 UI コンポーネントは作らない。再利用する既存資産:

- `apps/web/src/lib/is-browser.ts` の `browserDocument()` — `document.cookie` への唯一の正規参照点として再利用（新規 window/document accessor を増やさない）。
- `next/headers` の `cookies()` — server component で cookie を読む標準 App Router API。repo 内で `apps/web/app/(member)/layout.tsx`（`headers()`）/ `apps/web/src/lib/admin/server-fetch.ts`（`cookies()`）が利用実績あり＝OpenNext / Workers 互換確認済み。
- `useSidebarState` / `SidebarShell` / `SidebarShellServer` — 既存契約を**後方互換で拡張**（引数・prop の optional 追加のみ）。

## 2.2 データフロー（SSR seed の因果）

```
[初回 request]
  cookies() (server, next/headers)
    → readCollapsedFromCookieString(value)  // pure
      → initialCollapsed: boolean | null     // null = cookie 不在
        → <SidebarShell initialCollapsed={...}>
          → useSidebarState(initialCollapsed)
            → useState(initialCollapsed ? "collapsed" : "expanded")  // null は false 扱い
              → SSR HTML data-shell-collapsed が初回から正しい  ← ちらつき排除

[client toggle]
  toggleCollapsed()
    → setMode(next)
    → writeCollapsedCookie(next === "collapsed")  // document.cookie 書込（browserDocument 経由）
      → 次回 request の cookies() が反映値を返す  ← 永続化ループ
```

強化ループ: toggle → cookie 書込 → 次回 SSR seed が正しい → ちらつき無し。
バランスループ: cookie 不在（初回訪問）→ seed=null → server expanded → client mount で md viewport heuristic（Task E 既存挙動）→ tablet のみ collapsed。**この 1 回の補正は cookie 不在時に限定**され、cookie 確定後は発生しない。

## 2.3 状態所有権（state ownership）

| レイヤ | 責務 | 所有する状態 |
|--------|------|-------------|
| `SidebarShell.server.tsx` (Server) | cookie 読取り → seed 算出。書込はしない | なし（request スコープの読取りのみ） |
| `SidebarShell.tsx` (Client) | seed を hook へ橋渡し | なし（prop 受渡し） |
| `useSidebarState.ts` (Client hook) | collapse/drawer の唯一の state owner。toggle 時に cookie 書込 | `mode` / `drawerOpen` |
| `shell-collapse-cookie.ts` (pure + client I/O) | cookie の read(parse)/write の単一 source | なし（純粋関数 + 副作用関数） |

`Facade`/`Engine`/`Store`/`UI` の混在なし。state owner は `useSidebarState` 1 系のまま（I-2）。

## 2.4 新規ファイル設計: `shell-collapse-cookie.ts`

```ts
// apps/web/src/components/shell/shell-collapse-cookie.ts
// sidebar collapse 状態の cookie 永続化の単一 source。
// - server: readCollapsedFromCookieString（pure。next/headers cookies().get().value を渡す）
// - client: writeCollapsedCookie / readCollapsedFromDocument（browserDocument 経由）
import { browserDocument } from "@/lib/is-browser";

/** cookie 名。RFC 6265 token として安全な `_` 区切り（localStorage key の `:` は cookie 名に不適）。 */
export const SHELL_COLLAPSE_COOKIE = "ubm_shell_collapsed";

/** cookie 有効期間（秒）。1 年。UI 設定のため長期保持で良い。 */
const COLLAPSE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * cookie value 文字列を collapsed 真偽へ変換する純粋関数（server / test 共用）。
 * - "true"  → true
 * - "false" → false
 * - 未定義 / 不正値 → null（seed 不在扱い）
 */
export function readCollapsedFromCookieString(value: string | undefined | null): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

/**
 * document.cookie 全体から SHELL_COLLAPSE_COOKIE の collapsed 真偽を読む（client）。
 * cookie 不在は null（= seed 未確定。呼び元が viewport heuristic へ委譲できる）。
 */
export function readCollapsedFromDocument(): boolean | null {
  const doc = browserDocument();
  if (!doc) return null;
  const match = doc.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${SHELL_COLLAPSE_COOKIE}=`));
  if (match === undefined) return null;
  return readCollapsedFromCookieString(match.slice(SHELL_COLLAPSE_COOKIE.length + 1));
}

/** collapsed 状態を cookie へ書く（client）。SSR / 非対応環境では noop。 */
export function writeCollapsedCookie(collapsed: boolean): void {
  const doc = browserDocument();
  if (!doc) return;
  doc.cookie = `${SHELL_COLLAPSE_COOKIE}=${collapsed ? "true" : "false"}; path=/; max-age=${COLLAPSE_COOKIE_MAX_AGE}; samesite=lax`;
}
```

設計判断:

- **cookie 名は `ubm_shell_collapsed`**（localStorage の `ubm:shell:collapsed` から `:` を除去）。`:` は RFC 6265 の cookie-name token で separator 扱いとなり不正。localStorage key とは別名で良い（localStorage は撤廃するため衝突しない）。
- **`httpOnly` を付けない**（client が toggle 時に書くため）。`SameSite=Lax`・`path=/`・`max-age` 1 年。秘匿情報を含まない UI 設定値のみ（I-6）。
- **pure parser を分離**することで server（`cookies().get()` の value を渡す）と test が DOM 非依存で検証可能。

## 2.5 編集設計: `useSidebarState.ts`

差分方針（Before → After）:

| 対象 | Before | After |
|------|--------|-------|
| import | `browserWindow` のみ | `browserWindow` + `writeCollapsedCookie`（from `./shell-collapse-cookie`） |
| 定数 | `STORAGE_KEY` / `STORAGE_NAME = "local" + "Storage"` | **両方削除** |
| `getShellStorage()` / `readPersistedCollapsed()` | localStorage 読取り | **削除**（cookie helper へ移管） |
| signature | `useSidebarState(): SidebarState` | `useSidebarState(initialCollapsed: boolean \| null = null): SidebarState` |
| initial state | `useState<SidebarStateMode>("expanded")` | `useState<SidebarStateMode>(initialCollapsed === true ? "collapsed" : "expanded")` |
| mount effect | persisted(localStorage) 復元 → 無ければ md heuristic | **seed が null（cookie 不在）のときだけ** md viewport heuristic を適用。seed が boolean のとき effect は no-op（SSR 値で確定済み・hydration mismatch 回避のため client 再読取りもしない） |
| `toggleCollapsed` | `storage.setItem(STORAGE_KEY, ...)` | `writeCollapsedCookie(next === "collapsed")` |

After の hook 骨子:

```ts
export function useSidebarState(initialCollapsed: boolean | null = null): SidebarState {
  const pathname = usePathname();
  const [mode, setMode] = useState<SidebarStateMode>(
    initialCollapsed === true ? "collapsed" : "expanded",
  );
  const [drawerOpen, setDrawerOpenState] = useState(false);

  useEffect(() => {
    // cookie が既に seed を確定させている場合は何もしない（SSR 値を維持し mismatch を避ける）。
    if (initialCollapsed !== null) return;
    // 初回訪問（cookie 不在）のみ viewport で md collapsed を判定（Task E 仕様）。
    const win = browserWindow();
    if (typeof win?.matchMedia === "function") {
      const isLgUp = win.matchMedia("(min-width: 1024px)").matches;
      const isMdUp = win.matchMedia("(min-width: 768px)").matches;
      if (isMdUp && !isLgUp) setMode("collapsed");
    }
  }, [initialCollapsed]);

  useEffect(() => {
    setDrawerOpenState(false);
  }, [pathname]);

  const toggleCollapsed = useCallback(() => {
    setMode((prev) => {
      const next: SidebarStateMode = prev === "collapsed" ? "expanded" : "collapsed";
      writeCollapsedCookie(next === "collapsed");
      return next;
    });
  }, []);

  const setDrawerOpen = useCallback((open: boolean) => setDrawerOpenState(open), []);

  return { mode, drawerOpen, toggleCollapsed, setDrawerOpen };
}
```

> 補足: client mount で `readCollapsedFromDocument()` を**再読取りしない**理由 — SSR seed が同一 cookie 値を既に `useState` 初期値へ反映済みで、再読取りは冗長かつ hydration race を生む。cookie の唯一の真実は request 時の SSR seed とする（I-7）。`readCollapsedFromDocument` は将来 client-only mount 経路（seed が渡らない呼び出し）向けの保険として export しておくが、本タスクの hook では使わない（Phase 8 で over-export か再評価）。

## 2.6 編集設計: `SidebarShell.tsx`

- `SidebarShellProps` に `readonly initialCollapsed?: boolean | null;` を追加（optional、既定 `null`）。
- `useSidebarState()` → `useSidebarState(initialCollapsed)`。
- それ以外の JSX / token / data 属性は不変。

```ts
export interface SidebarShellProps {
  // ...既存...
  /** SSR seed。server が cookie から算出して渡す。null = cookie 不在。 */
  readonly initialCollapsed?: boolean | null;
}

export function SidebarShell({ /* ...既存..., */ initialCollapsed = null }: SidebarShellProps) {
  const { mode, drawerOpen, toggleCollapsed, setDrawerOpen } = useSidebarState(initialCollapsed);
  // ...以降不変...
}
```

## 2.7 編集設計: `SidebarShell.server.tsx`

- `import { cookies } from "next/headers";` を追加。
- `import { SHELL_COLLAPSE_COOKIE, readCollapsedFromCookieString } from "./shell-collapse-cookie";` を追加。
- 既存の `getSession()` 直後に cookie 読取りを追加し、`initialCollapsed` を算出して `<SidebarShell>` へ渡す。

```ts
const cookieStore = await cookies();
const collapseRaw = cookieStore.get(SHELL_COLLAPSE_COOKIE)?.value;
const initialCollapsed = collapseRaw === undefined ? null : readCollapsedFromCookieString(collapseRaw);
// ...
return (
  <SidebarShell
    role={role}
    user={user}
    navGroups={navGroups}
    activePath={activePath}
    mobileTriggerSlot={mobileTriggerSlot}
    initialCollapsed={initialCollapsed}
    {...(routeKey !== undefined ? { routeKey } : {})}
    {...(sectionRhythm !== undefined ? { sectionRhythm } : {})}
  >
    {children}
  </SidebarShell>
);
```

> Next.js 15+ では `cookies()` は async（Promise を返す）。repo の既存 `cookies()` / `headers()` 利用箇所（`server-fetch.ts` 等）の await パターンに合わせる。`SidebarShellServer` は既に `async` かつ `getSession()` で dynamic なので、`cookies()` 追加で新たな静的→動的化の副作用は生じない（3 layout は元々 session 依存で dynamic）。

## 2.8 呼出側 layout への影響

`SidebarShellServer` は `apps/web/app/(public|member|admin)/layout.tsx` の 3 箇所から呼ばれるが、cookie 読取りは server entry 内部に閉じるため **3 layout は無改修**。これが「server で読む」設計の利点（client へ cookie 解析を漏らさない）。

## 2.9 トレードオフ / 代替案比較

| 案 | 内容 | 採否 | 理由 |
|----|------|------|------|
| A: localStorage 継続（lint allowlist 経由） | `browserLocalStorage()` 経由へ正すだけ | ✗ | Issue 指定の cookie でない。SSR seed 不可でちらつき残存。AC-2 未達 |
| B: cookie + SSR seed（本設計） | server 読取り seed + client cookie 書込 | ✓ | AC-1〜AC-5 全達。lint 正当 clean。ちらつき排除 |
| C: cookie + client mount 再読取り | seed を渡さず client で `document.cookie` 読取り | ✗ | SSR が状態を知らずちらつき残存。B の劣化版 |
| D: D1 ユーザー別保存 | server 永続化 | ✗ | `apps/web` から D1 禁止（不変条件 #5）。端末別設定に過剰 |

## 2.10 SubAgent lane（Phase 4-13 並列生成）

設計フェーズ（Phase 1-3）は本ファイル群で直列確定済み。Phase 4-13 のタスク仕様書は以下 3 lane で並列生成し、validation lane は直列で締める（3 並列以下）:

- lane 1: Phase 4（テスト計画）/ Phase 5（実装手順）/ Phase 6（テスト追加）
- lane 2: Phase 7（カバレッジ）/ Phase 8（リファクタ）/ Phase 9（QA）
- lane 3: Phase 10（最終レビュー）/ Phase 11（手動テスト）/ Phase 12（ドキュメント同期）/ Phase 13（PR）+ outputs strict 群
