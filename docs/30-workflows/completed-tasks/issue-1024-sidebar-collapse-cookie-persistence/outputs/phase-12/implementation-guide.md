# 実装ガイド — issue-1024 sidebar collapse 状態の cookie 永続化

> GitHub Issue #1024 は CLOSED のまま現行コードへ再スコープ（reopen しない）。NON_VISUAL。

---

## Part 1: 中学生にもわかる説明

サイトの左側に「メニューの棚（サイドバー）」があります。この棚は、ボタンを押すと
**畳んで細くしたり、開いて広くしたり**できます。

いま困っているのは2つです。

1. **次に開いたとき、畳んだことを忘れている**かもしれない問題。
   そこで、棚を畳んだら「畳んだよ」という**小さなメモ**をブラウザに貼っておきます。
   このメモのことを **cookie（クッキー）** と呼びます。次にサイトを開いたとき、
   このメモを読めば「前は畳んでたんだな」とわかります。

2. **開いた瞬間、一瞬だけ広いまま見えてから畳まれる「ちらつき」**問題。
   今までは、サイトの絵を先に「広い棚」で描いてしまってから、あとで
   「あ、畳むんだった」と気づいて畳み直していました。だから一瞬パッと広く見えて
   気持ち悪かったのです。

   これを直すために、**絵を描き始める前にメモ（cookie）を読む**ようにします。
   絵を作るおおもとの係（サーバー）が、最初からメモを見て「畳んだ状態」で絵を用意します。
   だから開いた瞬間から畳まれていて、ちらつきません。

おまけに、今までのプログラムには「ルール違反を見つからないようにする、ちょっとずるい書き方」が
混ざっていました。今回それもやめて、正々堂々と書き直します。

まとめると「**畳んだ状態をクッキーで覚えて、最初から正しい形で表示する**」のが今回の変更です。
見た目そのものは変わりません。

---

## Part 2: 技術者向け詳細

### 全体データフロー

```
[server] SidebarShellServer
  └─ await cookies()  (next/headers)
       └─ get("ubm_shell_collapsed")?.value
            └─ parseShellCollapsedCookie(value): boolean | null
                 └─ initialCollapsed: boolean | null
                      │
                      ▼  prop
[client] SidebarShell(initialCollapsed)
  └─ useSidebarState(initialCollapsed)
       ├─ useState(initialCollapsed === true ? "collapsed" : "expanded")   ← SSR seed（初回 render が cookie と同値）
       ├─ mount effect: initialCollapsed !== null → 早期 return（viewport 判定スキップ）
       │                initialCollapsed === null → md viewport heuristic（Task E 仕様維持）
       └─ toggleCollapsed() → writeShellCollapsedCookie(next === "collapsed")
                                   └─ browserDocument().cookie = "ubm_shell_collapsed=...;path=/;max-age=...;samesite=lax"
```

### 新規 module: `apps/web/src/components/shell/shell-collapse-cookie.ts`

```ts
import { browserDocument } from "@/lib/is-browser";

/** collapse 状態を保持する cookie 名。単一 source（直書き禁止・本定数経由）。 */
export const SHELL_COLLAPSE_COOKIE_NAME = "ubm_shell_collapsed";

/** cookie 属性。client 読み書きのため httpOnly なし。1 年保持。 */
const SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * pure parser（server / test から呼ぶ）。
 * cookie 値が "true" のとき collapsed=true、"false" のとき collapsed=false。
 * undefined / null / 不正値は null（seed 不在扱い）。
 */
export function parseShellCollapsedCookie(value: string | undefined | null): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

/**
 * client: document.cookie から collapse 状態を読む。
 * SSR / Workers（document 不在）や cookie 未設定では null を返す（seed なし扱い）。
 */
export function readCollapsedFromDocument(): boolean | null {
  const doc = browserDocument();
  if (!doc) return null;
  const match = doc.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${SHELL_COLLAPSE_COOKIE_NAME}=`));
  if (!match) return null;
  const value = match.slice(SHELL_COLLAPSE_COOKIE_NAME.length + 1);
  return parseShellCollapsedCookie(value);
}

/** client: collapse 状態を cookie へ書き込む。SSR では noop。 */
export function writeShellCollapsedCookie(collapsed: boolean): void {
  const doc = browserDocument();
  if (!doc) return;
  doc.cookie =
    `${SHELL_COLLAPSE_COOKIE_NAME}=${collapsed ? "true" : "false"}` +
    `; path=/; max-age=${SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}
```

> 注: `readCollapsedFromDocument` は client の seed 補完用。SSR seed が確定している経路では
> `useSidebarState` は引数 `initialCollapsed` を優先し、本関数は seed=null（cookie 未読み取り経路）の
> fallback として位置づける。実装では SSR seed を正本とし、client での再読込は最小限とする。

### SSOT 正本 API（issue-1065 整合）

`shell-collapse-cookie.ts` の export 名は以下 5 件を唯一の正本（SSOT）とする。
かつて存在した alias（`SHELL_COLLAPSE_COOKIE` / `readCollapsedFromCookieString` / `writeCollapsedCookie`）は
0 参照の dead export だったため issue-1065 で削除済み。設計 doc 内のコードブロック・API 表も本表の primary 名へ整合させた。

| 概念 | 正本（primary export） | 契約 |
|------|----------------------|------|
| cookie 名定数 | `SHELL_COLLAPSE_COOKIE_NAME` | `"ubm_shell_collapsed"`（直書き禁止・本定数経由） |
| 値パーサ | `parseShellCollapsedCookie(value)` | **cookie 値のみ**を受け取り `boolean \| null` を返す pure parser（ヘッダ全体ではない） |
| serialize | `serializeShellCollapsedCookie(collapsed)` | `name=value; Path=/; Max-Age=…; SameSite=Lax` 文字列を生成 |
| client write | `writeShellCollapsedCookie(collapsed)` | `document.cookie` へ書込（`browserDocument()` 経由・SSR では noop） |
| client read | `readCollapsedFromDocument()` | `document.cookie` を split し matched value を `parseShellCollapsedCookie` へ委譲 |

> **訂正注記（issue 前提の誤り）**: 元 issue / unassigned-task は `parseShellCollapsedCookie`（旧名
> `readCollapsedFromCookieString`）が「cookie ヘッダ全体を受け取る」と記述していたが、現行コードでは
> **cookie 値のみを受け取る value parser** である。ヘッダ全体の split は `readCollapsedFromDocument()` が担い、
> matched value だけを `parseShellCollapsedCookie` に渡す。両者の契約差（ヘッダ vs 値）は存在しない。

### 編集: `useSidebarState.ts`（シグネチャ + 振る舞い）

```ts
export function useSidebarState(initialCollapsed: boolean | null = null): SidebarState {
  const pathname = usePathname();
  const [mode, setMode] = useState<SidebarStateMode>(
    initialCollapsed === true ? "collapsed" : "expanded",
  );
  const [drawerOpen, setDrawerOpenState] = useState(false);

  useEffect(() => {
    // server が cookie を seed 済みなら viewport 判定をスキップ（SSR と同値を維持）。
    if (initialCollapsed !== null) return;
    // seed なし初回のみ md viewport で初期 collapsed を判定（Task E 仕様維持）。
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

撤廃するもの（code smell 解消）:

- `const STORAGE_NAME = "local" + "Storage";`
- `function getShellStorage(): Storage | undefined { ... }`
- `function readPersistedCollapsed(): boolean | null { ... }`（cookie へ置換）
- `import { browserWindow }` は viewport heuristic で引き続き使用（残す）。
- toggle 内の `storage?.setItem(...)` → `writeShellCollapsedCookie(...)`。

### 編集: `SidebarShell.tsx`

`SidebarShellProps` に optional を追加し hook へ渡すのみ。

```ts
export interface SidebarShellProps {
  // ...既存 prop...
  /** SSR seed: server が cookie から読んだ collapse 初期値。未指定/null は client 判定。 */
  readonly initialCollapsed?: boolean | null;
}

export function SidebarShell({ /* ...既存..., */ initialCollapsed = null }: SidebarShellProps) {
  const { mode, drawerOpen, toggleCollapsed, setDrawerOpen } = useSidebarState(initialCollapsed);
  // ...以降不変（data-shell-collapsed は mode から導出）...
}
```

### 編集: `SidebarShell.server.tsx`

```ts
import { cookies } from "next/headers";
import { SHELL_COLLAPSE_COOKIE_NAME, parseShellCollapsedCookie } from "./shell-collapse-cookie";

// SidebarShellServer 内:
const cookieStore = await cookies();
const collapsedRaw = cookieStore.get(SHELL_COLLAPSE_COOKIE_NAME)?.value;
const initialCollapsed: boolean | null =
  collapsedRaw === undefined ? null : parseShellCollapsedCookie(collapsedRaw);

return (
  <SidebarShell
    /* ...既存 prop... */
    initialCollapsed={initialCollapsed}
  >
    {children}
  </SidebarShell>
);
```

呼出側 3 layout（public / member / admin）は `SidebarShellServer` のシグネチャを変えないため**無改修**。

### cookie 属性一覧

| 属性 | 値 | 理由 |
|------|----|----|
| name | `ubm_shell_collapsed` | 単一 source（`SHELL_COLLAPSE_COOKIE_NAME`） |
| value | `"true"` / `"false"` | parser は `value === "true"` のみ true |
| path | `/` | 全 route で共有 |
| max-age | `31536000`（1年） | UI 設定として長期保持 |
| SameSite | `Lax` | CSRF 配慮の標準値・同一サイト遷移で送信 |
| httpOnly | **付けない** | client が読み書きするため |
| Secure | 付けない（必要なら本番で付与検討） | localhost dev を阻害しないため本タスクでは付与しない |

### エラーハンドリング / 設定値

- `browserDocument()` が undefined（SSR / Workers）→ reader は `null`、writer は noop。throw しない。
- cookie 未設定・不正値 → parser / reader は `null`（seed 不在扱い）。`"false"` は明示 expanded seed として扱う。
- 設定値: cookie 名 `ubm_shell_collapsed` / max-age `60*60*24*365`。

### 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。
代替 = `phase-10-final-review.md`（AC + DoD）+ `phase-11-manual-test.md`（NON_VISUAL 宣言 + SSR HTML seed inspection 手順）+ `outputs/phase-11/manual-test-result.md`（focused vitest 主証跡）。
