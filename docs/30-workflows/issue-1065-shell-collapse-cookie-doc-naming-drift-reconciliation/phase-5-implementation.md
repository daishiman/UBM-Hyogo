# Phase 5: 実装

> **[実装区分: 実装仕様書 / NON_VISUAL]**

## 1. 変更ファイル一覧（Feedback RT-03 / 新規・修正・削除を必須記載）

| 区分 | パス | 内容 |
| --- | --- | --- |
| 修正（code） | `apps/web/src/components/shell/shell-collapse-cookie.ts` | dead alias 3 行削除（L4 / L34 / L35） |
| 修正（docs） | `docs/30-workflows/completed-tasks/issue-1024-.../phase-2-design.md` | naming drift 整合（`SHELL_COLLAPSE_COOKIE`→`SHELL_COLLAPSE_COOKIE_NAME` 等を primary 名へ・AC-1） |
| 修正（docs） | `docs/30-workflows/completed-tasks/issue-1024-.../phase-3-design-review.md` | 同上の primary 名整合（AC-1） |
| 修正（docs） | `docs/30-workflows/completed-tasks/issue-1024-.../outputs/phase-12/implementation-guide.md` | SSOT 正本 API 表 + `parseShellCollapsedCookie` が value parser である訂正注記を追記（AC-2） |
| 新規 | なし | — |
| 削除（ファイル） | なし | — |

> docs 整合は Lane C / 本体が扱うが、Phase 5 で発生する変更の全量として上表に明記する（RT-03）。code diff は `shell-collapse-cookie.ts` の 3 行削除に限定（AC-4）。
> 実 doc パスは completed-tasks 配下の issue-1024 ワークフロー。Lane C 実行時に実ファイル名を解決する。

## 2. 実装手順（番号付き・user-gated 実行）

1. **削除前 grep 再確認（AC-3）**: alias 3 件が定義箇所以外で 0 参照であることを再確認する。
   ```bash
   rg -n "SHELL_COLLAPSE_COOKIE\b|readCollapsedFromCookieString|writeCollapsedCookie\b" apps/web/src
   ```
   期待: ヒットは `shell-collapse-cookie.ts` の **定義行のみ**（`SHELL_COLLAPSE_COOKIE_NAME` は語境界 `\b` で別語のため別途許容 / consumer の `parseShellCollapsedCookie`・`writeShellCollapsedCookie`・`SHELL_COLLAPSE_COOKIE_NAME` は削除対象外）。削除対象 3 名の **外部参照が 0** であることを確認。
2. **`shell-collapse-cookie.ts` の 3 行削除**: L4 / L34 / L35 を削除（下記 §3 の最終形に一致させる）。
3. **typecheck**:
   ```bash
   mise exec -- pnpm typecheck
   ```
4. **lint**:
   ```bash
   mise exec -- pnpm lint
   ```
5. **focused Vitest**:
   ```bash
   mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
     apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts
   ```
   期待: 4 ケース全 PASS。

## 3. 変更後の最終形（33 行・3 行減）

```ts
import { browserDocument } from "@/lib/is-browser";

export const SHELL_COLLAPSE_COOKIE_NAME = "ubm_shell_collapsed";
const SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function parseShellCollapsedCookie(value: string | undefined | null): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function serializeShellCollapsedCookie(collapsed: boolean): string {
  const value = collapsed ? "true" : "false";
  return `${SHELL_COLLAPSE_COOKIE_NAME}=${value}; Path=/; Max-Age=${SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function writeShellCollapsedCookie(collapsed: boolean): void {
  const doc = browserDocument();
  if (!doc) return;
  doc.cookie = serializeShellCollapsedCookie(collapsed);
}

export function readCollapsedFromDocument(): boolean | null {
  const rawCookie = browserDocument()?.cookie ?? "";
  const match = rawCookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${SHELL_COLLAPSE_COOKIE_NAME}=`));
  if (!match) return null;
  return parseShellCollapsedCookie(match.slice(SHELL_COLLAPSE_COOKIE_NAME.length + 1));
}
```

> 削除したのは末尾 alias 2 行（`readCollapsedFromCookieString` / `writeCollapsedCookie`）と先頭の `SHELL_COLLAPSE_COOKIE` 1 行。残る export 5 件（定数 1 + 関数 4）はすべて bytes 不変。

## 4. consumer / test 無変更の根拠

- consumer `SidebarShell.server.tsx:12` は `parseShellCollapsedCookie, SHELL_COLLAPSE_COOKIE_NAME` を import → primary 名のみ。
- consumer `useSidebarState.ts:10` は `writeShellCollapsedCookie` を import → primary 名のみ。
- focused test は primary 4 名のみ import → **テスト変更不要**（Phase 4 §2 参照）。
- 削除する 3 名はいずれも primary への単純再代入で、実行コード経路を持たない → 挙動・cookie 名 / value / 属性 / Max-Age / 永続化は無変更（AC-5 / issue-1024 I-6 維持）。

## 5. 実行ポリシー

- 本仕様書ではコードを書かない。実装・commit・PR の実行は **user-gated**。
- 上記手順は user 承認後に上から順に実行する。
