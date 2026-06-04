# Phase 2: 設計

> **[実装区分: 実装仕様書 / NON_VISUAL]**

## 1. 既存コンポーネント再利用可否（FB-SDK-07-1）

新規 UI・新規 primitive・新規モジュールはゼロ。既存 `shell-collapse-cookie.ts` の **export 縮約**と、既存設計 doc の **文字列整合**のみ。再利用 100%。

## 2. SSOT（単一正本）設計

### 2.1 確定する正本 API（keep）

```ts
// apps/web/src/components/shell/shell-collapse-cookie.ts （変更後・概念）
import { browserDocument } from "@/lib/is-browser";

export const SHELL_COLLAPSE_COOKIE_NAME = "ubm_shell_collapsed";
const SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

// cookie の「値」を boolean | null に parse する唯一の value parser
export function parseShellCollapsedCookie(value: string | undefined | null): boolean | null { /* ... */ }

// client writable な cookie 文字列を組み立てる
export function serializeShellCollapsedCookie(collapsed: boolean): string { /* ... */ }

// document.cookie へ collapse 状態を書き込む（client）
export function writeShellCollapsedCookie(collapsed: boolean): void { /* ... */ }

// document.cookie 全体を split し、matched value を parseShellCollapsedCookie へ渡す（client）
export function readCollapsedFromDocument(): boolean | null { /* ... */ }
```

### 2.2 削除する dead alias

```ts
// ↓ 3 行を削除（apps/web/src 内 0 参照）
export const SHELL_COLLAPSE_COOKIE = SHELL_COLLAPSE_COOKIE_NAME;      // L4
export const readCollapsedFromCookieString = parseShellCollapsedCookie; // L34
export const writeCollapsedCookie = writeShellCollapsedCookie;        // L35
```

### 2.3 入力・出力・副作用（契約の正確化）

| 関数 | 入力 | 出力 | 副作用 | 呼出側 |
| --- | --- | --- | --- | --- |
| `parseShellCollapsedCookie` | cookie の **値**（`"true"`/`"false"`/その他/undefined/null） | `boolean \| null` | なし（pure） | server: `cookies().get(name)?.value` を渡す / `readCollapsedFromDocument` 内部 |
| `serializeShellCollapsedCookie` | `collapsed: boolean` | cookie 文字列 | なし（pure） | `writeShellCollapsedCookie` 内部・test |
| `writeShellCollapsedCookie` | `collapsed: boolean` | `void` | `document.cookie` 書込（`browserDocument()` 経由・SSR では no-op） | `useSidebarState.toggleCollapsed` |
| `readCollapsedFromDocument` | なし | `boolean \| null` | なし（read） | client-only mount 経路の保険（現 hook では未使用） |

> **重要（issue 前提訂正）**: `parseShellCollapsedCookie` は **cookie ヘッダ全体ではなく値のみ**を受け取る。`readCollapsedFromCookieString` は同関数の alias だった（契約差なし）。SSOT 表ではこの 1 系統 value parser として記述する。

## 3. naming drift 整合マップ（doc → primary）

設計 doc 3 本で次の機械置換を行う（文脈に応じ手修正）:

| doc 記載名 | 置換後（primary） | 備考 |
| --- | --- | --- |
| `SHELL_COLLAPSE_COOKIE`（定数） | `SHELL_COLLAPSE_COOKIE_NAME` | 文字列値 `"ubm_shell_collapsed"` は不変 |
| `readCollapsedFromCookieString` | `parseShellCollapsedCookie` | 引数説明「値を受け取る」は正しいので維持 |
| `writeCollapsedCookie` | `writeShellCollapsedCookie` | — |
| `readCollapsedFromDocument` | （変更なし） | doc 名 = primary 名で一致 |
| `COLLAPSE_COOKIE_MAX_AGE`（doc 内の Max-Age 定数表記） | `SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS` | 値 31536000 は不変 |
| serialize を inline 記述している箇所 | `serializeShellCollapsedCookie` + `writeShellCollapsedCookie` の 2 関数構成へ説明追記 | impl は serialize を抽出済み |

## 4. SubAgent lane / validation path（実行設計）

| lane | 担当 Phase | 関心ごと | 並列性 |
| --- | --- | --- | --- |
| 直列（本体） | Phase 1-3 | 要件・設計・レビューゲート | 直列（完了済み） |
| Lane A | Phase 4-7 | テスト計画・実装手順・テスト拡充・カバレッジ | 並列 |
| Lane B | Phase 8-10 + phase-11 | リファクタ・QA・最終レビュー・手動テスト証跡 | 並列 |
| Lane C | Phase 12-13 + outputs/phase-12 strict7 + compliance | ドキュメント・PR・準拠チェック | 並列 |
| 締め（直列） | validation | grep / typecheck / lint / focused Vitest（実行は user-gated 実装後） | 直列 |

## 5. ロック / state / マージ戦略（該当チェック）

- state ownership: cookie 値の唯一の真実は SSR seed（issue-1024 I-7）。本タスクは I/O helper の export 名のみ縮約し、state owner / 永続化経路は不変。
- IPC / deep-merge / wizard step: 該当なし（Electron でなく Next.js web、単一 pure helper）。

## 6. リスクと対策

| リスク | 対策 |
| --- | --- |
| alias 削除で外部参照が壊れる | 削除前 grep（`apps/web/src` + test）で 0 参照を再確認（AC-3）。現時点 0 確認済み。 |
| doc 整合で value parser 契約を消す | 置換は名前のみ。`parseShellCollapsedCookie` の引数説明「値」は維持し、ヘッダ誤解の訂正注記を追記。 |
| completed dir の doc を直して再 drift | 変更対象を 3 doc + 本 spec の consumed trace に固定し、Phase 12 changelog に記録。 |
