# Phase 5: 実装手順

> issue-1063 — shell collapse cookie に production 限定で `Secure` 属性を付与

Phase 2 設計（`phase-2-design.md`）を正本とし、後続の実装プロンプトがこのファイルだけで確実にコードへ反映できる粒度で記述する。逸脱禁止。

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 5（実装手順 / TDD Green） |
| task_id | issue-1063-shell-collapse-cookie-secure-attribute |
| 変更ファイル数 | 2（編集 2 / 新規 0） |

## 目的

Phase 2 設計どおりに `serializeShellCollapsedCookie` へ `Secure` 環境分岐を追加し、focused test（Phase 4 Red）を Green へ遷移させる。実装区分 = 実装仕様書。本ファイルは後続実装者が逐語で従える粒度を持つ。

## 実行タスク

### 5.1 変更対象ファイル一覧

| # | 区分 | フルパス |
|---|------|---------|
| 1 | 編集 | `apps/web/src/components/shell/shell-collapse-cookie.ts` |
| 2 | 編集 | `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts`（Phase 6 で全文確定） |

> 新規ファイルは作成しない。3 layout / `useSidebarState.ts` / `SidebarShell*.tsx` は**無改修**（`writeShellCollapsedCookie` は既定の `secure` 引数経由で runtime 判定を拾うため呼出側変更不要）。

### 5.2 実装順序

1. **`shell-collapse-cookie.ts` に `isSecureRuntimeContext` private ヘルパを追加**（serializer が依存する判定を先に置く）。
2. **`serializeShellCollapsedCookie` のシグネチャに `secure` 第2引数を追加**し、既定値を `isSecureRuntimeContext()` とする。戻り値末尾に条件付き `; Secure` を append。
3. **`shell-collapse-cookie.spec.ts` に TC-1〜TC-6 を追記**（Phase 4 / Phase 6）。

### 5.3 入力 / 出力 / 副作用定義

| 項目 | 内容 |
|------|------|
| 入力（serializer） | `collapsed: boolean` / `secure?: boolean`（省略時 = `isSecureRuntimeContext()`） |
| 入力（判定ヘルパ） | `browserDocument()?.location.protocol`（client runtime） |
| 出力 | cookie 文字列（`secure` が true のとき末尾に `; Secure`） |
| 副作用 | **無し**（serializer / ヘルパともに純粋。既存 `writeShellCollapsedCookie` の `document.cookie` 書込が唯一の副作用で、本タスクで新規副作用は増えない） |
| エラーハンドリング | `browserDocument()` が `undefined`（SSR/Workers）→ `isSecureRuntimeContext()` は `false`（throw しない・dev 安全側）。`location.protocol !== "https:"` → `false` |

### 5.4 編集 #1: `shell-collapse-cookie.ts`（Before → After 逐語）

#### Before（現行 HEAD `ca3fb9336`・抜粋）

```ts
import { browserDocument } from "@/lib/is-browser";

export const SHELL_COLLAPSE_COOKIE_NAME = "ubm_shell_collapsed";
export const SHELL_COLLAPSE_COOKIE = SHELL_COLLAPSE_COOKIE_NAME;
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
```

#### After（逐語）

```ts
import { browserDocument } from "@/lib/is-browser";

export const SHELL_COLLAPSE_COOKIE_NAME = "ubm_shell_collapsed";
export const SHELL_COLLAPSE_COOKIE = SHELL_COLLAPSE_COOKIE_NAME;
const SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * 現在の client runtime が HTTPS で配信されているかを判定する（private）。
 * - https:  → true（`Secure` cookie を送信可能な文脈）
 * - それ以外（http: / file: / SSR・Workers で document 不在） → false
 * `process.env.*` を参照せず client runtime のみで完結する（CLAUDE.md env 不変条件）。
 */
function isSecureRuntimeContext(): boolean {
  return browserDocument()?.location.protocol === "https:";
}

export function parseShellCollapsedCookie(value: string | undefined | null): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

/**
 * collapse 状態の cookie 文字列を生成する。
 * @param collapsed sidebar が collapsed か
 * @param secure `Secure` 属性を付与するか。省略時は client runtime（HTTPS かどうか）で判定する。
 *               テストは両分岐を決定論的に検証するため明示注入できる。
 */
export function serializeShellCollapsedCookie(
  collapsed: boolean,
  secure: boolean = isSecureRuntimeContext(),
): string {
  const value = collapsed ? "true" : "false";
  const base = `${SHELL_COLLAPSE_COOKIE_NAME}=${value}; Path=/; Max-Age=${SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  return secure ? `${base}; Secure` : base;
}

export function writeShellCollapsedCookie(collapsed: boolean): void {
  const doc = browserDocument();
  if (!doc) return;
  doc.cookie = serializeShellCollapsedCookie(collapsed);
}
```

> `readCollapsedFromDocument` / alias（`readCollapsedFromCookieString` / `writeCollapsedCookie`）は**無改修**。差分は (a) `isSecureRuntimeContext` 追加、(b) `serializeShellCollapsedCookie` の第2引数 + `; Secure` append のみ。

#### 差分要点

| 対象 | Before | After |
|------|--------|-------|
| `isSecureRuntimeContext` | 無し | **追加**（private・`browserDocument()?.location.protocol === "https:"`） |
| `serializeShellCollapsedCookie` signature | `(collapsed: boolean): string` | `(collapsed: boolean, secure?: boolean = isSecureRuntimeContext()): string` |
| 戻り値 | `...; SameSite=Lax` | `secure ? "...; SameSite=Lax; Secure" : "...; SameSite=Lax"` |
| `writeShellCollapsedCookie` | `serializeShellCollapsedCookie(collapsed)` | **不変**（既定 secure 引数で runtime 判定を自動取得） |
| parser / reader / alias | — | **不変**（I-5） |

### 5.5 編集 #2: `shell-collapse-cookie.spec.ts`（追記）

Phase 4 §4.5 / Phase 6 のケース（TC-1〜TC-6）を既存 `describe("shell-collapse-cookie", ...)` 内へ追記する。HTTPS runtime 既定経路の検証では `vi.stubGlobal("document", { location: { protocol: "https:" } })` を使い、`afterEach` で global stub を戻す。全文は Phase 6 を参照。

### 5.6 `process.env` 非導入の grep 確認コマンド

実装後、`apps/web/src/components/shell/` 配下に `process.env` 直接参照が増えていないこと（AC-3）を確認する:

```bash
if grep -rn "process.env" apps/web/src/components/shell/; then exit 1; fi
if grep -rn "localStorage\|sessionStorage" apps/web/src/components/shell/; then exit 1; fi
```

期待: 2 grep いずれも 0 件で exit 0。hit した場合は exit 1 で gate fail する。`document` / `location` は lint-boundaries 非禁止トークンであり、`browserDocument()` 経由のためアクセスも正当。

### 5.7 完了判定（本 Phase）

- `shell-collapse-cookie.ts` が §5.4 After のとおりに反映されている。
- `pnpm typecheck` green（`secure` 第2引数の型整合・`location.protocol` 参照）。
- `pnpm lint` green（lint-boundaries 含む。`process.env` / web storage トークン 0 件）。
- focused Vitest（TC-1〜TC-6 + 既存ケース）が全 Green。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| Phase 2 設計 | `phase-2-design.md` | serializer シグネチャ・判定経路 |
| Phase 4 テスト | `phase-4-test-plan.md` | TC-1〜TC-6 |
| 現行 serializer | `apps/web/src/components/shell/shell-collapse-cookie.ts` | Before 正本 |
| browser accessor | `apps/web/src/lib/is-browser.ts` | `browserDocument()` |

## 統合テスト連携

実装後、既存 shell 系 focused suite（`useSidebarState.spec.tsx` / `SidebarShell.server.spec.tsx`）が回帰しないことを Phase 9 で確認する。serializer 変更は後方互換（既定 secure=false 相当の dev 文字列を維持）のため、これら統合経路に影響しない。

## 成果物

- 本ファイル（`phase-5-implementation.md`）に変更ファイル・逐語 After・差分要点・grep 確認・DoD を確定する。

## 完了条件

- 編集 #1 の After コードが逐語で確定している。
- `process.env` 非導入 grep が定義されている。
- 本 Phase の DoD（typecheck/lint/focused Vitest green）が明記されている。
