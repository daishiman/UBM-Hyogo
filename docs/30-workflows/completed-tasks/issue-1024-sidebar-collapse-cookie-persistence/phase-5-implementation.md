# Phase 5: 実装手順

> issue-1024 — sidebar collapse 状態の cookie 永続化

Phase 2 設計（`phase-2-design.md`）を正本とし、後続の実装プロンプトがこのファイルだけで確実にコードへ反映できる粒度で記述する。逸脱禁止。

## 5.1 変更対象ファイル一覧

| # | 区分 | フルパス |
|---|------|---------|
| 1 | 新規 | `apps/web/src/components/shell/shell-collapse-cookie.ts` |
| 2 | 新規 | `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts` |
| 3 | 編集 | `apps/web/src/components/shell/useSidebarState.ts` |
| 4 | 編集 | `apps/web/src/components/shell/SidebarShell.tsx` |
| 5 | 編集 | `apps/web/src/components/shell/SidebarShell.server.tsx` |
| 6 | 編集 | `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx` |
| 7 | 編集 | `apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx` |

> 3 layout（`apps/web/app/(public|member|admin)/layout.tsx`）は **無改修**（cookie 読取りは `SidebarShell.server.tsx` 内部に閉じる）。spec の具体は Phase 4 / Phase 6 を参照。本 Phase は本体 4 ソース（#1/#3/#4/#5）を逐語掲載する。

## 5.2 実装順序

1. **新規 cookie module 作成**（`shell-collapse-cookie.ts`）— 他ファイルが import する基盤を先に置く。
2. **`useSidebarState.ts` の localStorage 撤廃 + seed 引数化** — cookie module の writer を消費。
3. **`SidebarShell.tsx` に `initialCollapsed` prop 追加** — hook へ seed を橋渡し。
4. **`SidebarShell.server.tsx` で `cookies()` 読取り → seed 算出 → prop 渡し** — server seed 経路を閉じる。
5. **spec 更新**（`useSidebarState.spec.tsx` / `SidebarShell.server.spec.tsx`）+ 新規 `shell-collapse-cookie.spec.ts`。

## 5.3 入力 / 出力 / 副作用定義

| 項目 | 内容 |
|------|------|
| 入力（server） | request の `Cookie` ヘッダ（`cookies().get(SHELL_COLLAPSE_COOKIE_NAME)?.value`） |
| 入力（client） | `toggleCollapsed()` 呼び出し（ユーザー操作） |
| 出力（server） | `initialCollapsed: boolean \| null`（null = cookie 不在） → SSR HTML の `data-shell-collapsed` |
| 出力（client） | `mode`（"expanded" / "collapsed"）の state 反映 |
| **唯一の副作用** | `writeShellCollapsedCookie` による `document.cookie` 書込（toggle 時のみ）。これ以外に外部 I/O なし（API call / D1 / localStorage いずれも無し） |
| エラーハンドリング | SSR / Workers / private mode 等で `browserDocument()` が `undefined` → reader は `null`、writer は **noop**（throw しない）。server の `cookies()` は App Router 標準 API で例外時は呼出側 dynamic render に委ねる（既存 `getSession()` の fail-open と同様、本タスクは握り潰しを追加しない） |

## 5.4 新規ファイル #1: `shell-collapse-cookie.ts`（全文・逐語）

```ts
// apps/web/src/components/shell/shell-collapse-cookie.ts
// sidebar collapse 状態の cookie 永続化の単一 source。
// - server: parseShellCollapsedCookie（pure。next/headers cookies().get().value を渡す）
// - client: writeShellCollapsedCookie / readCollapsedFromDocument（browserDocument 経由）
import { browserDocument } from "@/lib/is-browser";

/** cookie 名。RFC 6265 token として安全な `_` 区切り（localStorage key の `:` は cookie 名に不適）。 */
export const SHELL_COLLAPSE_COOKIE_NAME = "ubm_shell_collapsed";

/** cookie 有効期間（秒）。1 年。UI 設定のため長期保持で良い。 */
const SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * cookie value 文字列を collapsed 真偽へ変換する純粋関数（server / test 共用）。
 * - "true"  → true
 * - "false" → false
 * - 未定義 / 不正値 → null（seed 不在扱い）
 */
export function parseShellCollapsedCookie(value: string | undefined | null): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

/**
 * document.cookie 全体から SHELL_COLLAPSE_COOKIE_NAME の collapsed 真偽を読む（client）。
 * cookie 不在は null（= seed 未確定。呼び元が viewport heuristic へ委譲できる）。
 */
export function readCollapsedFromDocument(): boolean | null {
  const doc = browserDocument();
  if (!doc) return null;
  const match = doc.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${SHELL_COLLAPSE_COOKIE_NAME}=`));
  if (match === undefined) return null;
  return parseShellCollapsedCookie(match.slice(SHELL_COLLAPSE_COOKIE_NAME.length + 1));
}

/** collapsed 状態を cookie へ書く（client）。SSR / 非対応環境では noop。 */
export function writeShellCollapsedCookie(collapsed: boolean): void {
  const doc = browserDocument();
  if (!doc) return;
  doc.cookie = `${SHELL_COLLAPSE_COOKIE_NAME}=${collapsed ? "true" : "false"}; path=/; max-age=${SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}
```

設計判断（変更不可の根拠）:

- cookie 名 `ubm_shell_collapsed`: localStorage key `ubm:shell:collapsed` の `:` を `_` 化（RFC6265 token safe）。localStorage は撤廃するため衝突しない。
- `httpOnly` を付けない: client が toggle 時に書くため。`SameSite=Lax` / `path=/` / `max-age` 1 年。秘匿情報なし（I-6）。
- pure parser 分離: server（`cookies().get()` value）と test が DOM 非依存で検証可能。
- `document` アクセスは `@/lib/is-browser` の `browserDocument()` 経由のみ（I-5）。`localStorage` / `sessionStorage` トークンを一切含まないため lint-boundaries は正当に clean。

## 5.5 編集 #3: `useSidebarState.ts`（Before → After）

### 削除する要素（全削除）

- `const STORAGE_KEY = "ubm:shell:collapsed";`
- `const STORAGE_NAME = "local" + "Storage";`（lint 回避ハック・撤廃）
- `function getShellStorage(): Storage | undefined { ... }`
- `function readPersistedCollapsed(): boolean | null { ... }`

### import 差分

| Before | After |
|--------|-------|
| `import { browserWindow } from "@/lib/is-browser";` | `import { browserWindow } from "@/lib/is-browser";`（維持）＋ `import { writeShellCollapsedCookie } from "./shell-collapse-cookie";` を追加 |

> `readCollapsedFromDocument` は hook では使わない（SSR seed が唯一の真実。client 再読取りは hydration race を生むため）。本 hook は `writeShellCollapsedCookie` のみ import する。

### After の hook 骨子（逐語）

```ts
"use client";

// Task A / E — sidebar の collapse / drawer state を管理する client hook。
// 副作用は cookie 書込（writeShellCollapsedCookie）のみ。API call なし。
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { browserWindow } from "@/lib/is-browser";
import { writeShellCollapsedCookie } from "./shell-collapse-cookie";

export type SidebarStateMode = "expanded" | "collapsed";

export interface SidebarState {
  readonly mode: SidebarStateMode;
  readonly drawerOpen: boolean;
  readonly toggleCollapsed: () => void;
  readonly setDrawerOpen: (open: boolean) => void;
}

/**
 * SSR seed（server が cookie から算出した initialCollapsed）を初期 state へ反映する。
 * - seed が boolean のとき: useState 初期値で確定し、mount effect は no-op（hydration mismatch 回避）。
 * - seed が null（cookie 不在）のとき: mount 後に 1 回だけ viewport heuristic（md 帯のみ collapsed）を適用。
 */
export function useSidebarState(initialCollapsed: boolean | null = null): SidebarState {
  const pathname = usePathname();
  const [mode, setMode] = useState<SidebarStateMode>(
    initialCollapsed === true ? "collapsed" : "expanded",
  );
  const [drawerOpen, setDrawerOpenState] = useState(false);

  useEffect(() => {
    // cookie が seed を確定させている場合は何もしない（SSR 値を維持し mismatch を避ける）。
    if (initialCollapsed !== null) return;
    // 初回訪問（cookie 不在）のみ viewport で md collapsed を判定（Task E 仕様）。
    const win = browserWindow();
    if (typeof win?.matchMedia === "function") {
      const isLgUp = win.matchMedia("(min-width: 1024px)").matches;
      const isMdUp = win.matchMedia("(min-width: 768px)").matches;
      if (isMdUp && !isLgUp) setMode("collapsed");
    }
  }, [initialCollapsed]);

  // route 変化で drawer を自動 close（遷移後に overlay が残らないように）。
  useEffect(() => {
    setDrawerOpenState(false);
  }, [pathname]);

  const toggleCollapsed = useCallback(() => {
    setMode((prev) => {
      const next: SidebarStateMode = prev === "collapsed" ? "expanded" : "collapsed";
      writeShellCollapsedCookie(next === "collapsed");
      return next;
    });
  }, []);

  const setDrawerOpen = useCallback((open: boolean) => {
    setDrawerOpenState(open);
  }, []);

  return { mode, drawerOpen, toggleCollapsed, setDrawerOpen };
}
```

差分要点:

| 対象 | Before | After |
|------|--------|-------|
| 定数 `STORAGE_KEY` / `STORAGE_NAME` | 有り | **削除** |
| `getShellStorage` / `readPersistedCollapsed` | 有り | **削除** |
| signature | `useSidebarState(): SidebarState` | `useSidebarState(initialCollapsed: boolean \| null = null): SidebarState` |
| 初期 state | `useState("expanded")` | `useState(initialCollapsed === true ? "collapsed" : "expanded")` |
| mount effect | localStorage 復元 → 無ければ md heuristic | seed≠null で早期 return、null のときのみ md heuristic（effect 依存配列に `initialCollapsed` 追加） |
| `toggleCollapsed` 副作用 | `storage?.setItem(...)` | `writeShellCollapsedCookie(next === "collapsed")` |
| **戻り値 shape** | `{ mode, drawerOpen, toggleCollapsed, setDrawerOpen }` | **不変**（I-1） |

## 5.6 編集 #4: `SidebarShell.tsx`（prop 追加）

`SidebarShellProps` に optional `initialCollapsed` を追加し、`useSidebarState` へ伝播する。JSX / token / data 属性は不変。

```ts
export interface SidebarShellProps {
  readonly role: ShellRole;
  readonly user: { readonly displayName: string; readonly email: string; readonly initials: string } | null;
  readonly navGroups: ReadonlyArray<ShellNavGroup>;
  readonly activePath: string;
  /** Task E が埋める mobile trigger。drawer/collapse setter は context 経由。 */
  readonly mobileTriggerSlot: ReactNode;
  /** main の data-route 値。呼出側 route group（"member" / "public" 等）を渡す。既定は "shell"。 */
  readonly routeKey?: string;
  /** main の data-section-rhythm 値。未指定なら属性を出力しない。 */
  readonly sectionRhythm?: string;
  /** SSR seed。server が cookie から算出して渡す。null = cookie 不在（既定）。 */
  readonly initialCollapsed?: boolean | null;
  readonly children: ReactNode;
}

export function SidebarShell({
  role,
  user,
  navGroups,
  activePath,
  mobileTriggerSlot,
  routeKey = "shell",
  sectionRhythm,
  initialCollapsed = null,
  children,
}: SidebarShellProps) {
  const { mode, drawerOpen, toggleCollapsed, setDrawerOpen } = useSidebarState(initialCollapsed);
  const collapsed = mode === "collapsed";
  // ...以降の JSX は不変...
}
```

## 5.7 編集 #5: `SidebarShell.server.tsx`（cookie 読取り → seed）

import 2 行追加 + `getSession()` 周辺で cookie 読取り → `initialCollapsed` 算出 → `<SidebarShell>` へ prop 追加。3 layout は無改修。

### import 追加

```ts
import { cookies } from "next/headers";
// 既存 import 群の末尾（相対 import 区画）に追加:
import { SHELL_COLLAPSE_COOKIE_NAME, parseShellCollapsedCookie } from "./shell-collapse-cookie";
```

### body 差分（`navGroups` 算出後・`user` 算出後、return 直前に cookie 読取りを置く）

```ts
  const role = resolveRole(session);
  const schemaDiffCount = role === "admin" ? await loadSchemaDiffCount() : 0;
  const navGroups = buildNavForRole(role, { schemaDiffCount });

  const user = session
    ? {
        displayName: session.name ?? session.email,
        email: session.email,
        initials: resolveInitials(session.name ?? "", session.email),
      }
    : null;

  // sidebar collapse 状態の SSR seed（cookie → initialCollapsed）。cookie 不在は null。
  const cookieStore = await cookies();
  const collapseRaw = cookieStore.get(SHELL_COLLAPSE_COOKIE_NAME)?.value;
  const initialCollapsed =
    collapseRaw === undefined ? null : parseShellCollapsedCookie(collapseRaw);

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

> `cookies()` は Next.js 15+ で async（`Promise<ReadonlyRequestCookies>`）。repo 既存の `cookies()` / `headers()` await パターン（`apps/web/src/lib/admin/server-fetch.ts` 等）に整合する。`SidebarShellServer` は既に `async` かつ `getSession()` で dynamic のため、`cookies()` 追加で新たな静的→動的化は生じない。

## 5.8 localStorage 撤廃の grep 確認コマンド

実装後、`apps/web/src` 配下に Web Storage 禁止トークンが残っていないことを確認する（AC-4）:

```bash
# shell ディレクトリ内に localStorage / sessionStorage / 文字列分割ハックが残っていないこと（0 件期待）
grep -rn "localStorage\|sessionStorage" apps/web/src/components/shell/ || echo "OK: no web storage token in shell"
grep -rn '"local" *+ *"Storage"' apps/web/src/components/shell/ || echo "OK: no split hack"
grep -rn "ubm:shell:collapsed" apps/web/src/ || echo "OK: old localStorage key removed"

# lint-boundaries gate（禁止トークン検査）
pnpm lint
```

期待: 3 grep がいずれも 0 件（`|| echo OK` で OK 表示）、`pnpm lint` green。`document.cookie` は lint-boundaries の禁止トークン対象外（`localStorage`/`sessionStorage` のみが対象）で、`browserDocument()` 経由のためアクセスも正当。

## 5.9 完了判定（本 Phase）

- 本体 4 ソース（#1/#3/#4/#5）が上記逐語どおりに反映されている。
- `pnpm typecheck` green（signature / prop の型整合）。
- `pnpm lint` green（lint-boundaries 含む）。
- spec 更新は Phase 6 の追加観点と合わせて全 Green（Phase 4 の Red → Green 遷移）。
