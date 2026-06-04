# Phase 1: 要件定義

> **[実装区分: 実装仕様書 / NON_VISUAL / implementation_mode: new]**

## 1. 真の論点（要件レビュー一次結論）

| 観点 | 結論 |
| --- | --- |
| 真の論点 | `shell-collapse-cookie.ts` の cookie I/O API に **命名の単一正本（SSOT）が無い**。実装は primary 名 + 互換 alias の 2 系統を export し、設計 doc は alias 名を正本として記述している。doc を実装名へ寄せるだけでは dead alias が残り SSOT 違反が解消しない。 |
| 依存・責務境界 | 対象は単一モジュール（pure cookie I/O helper）。consumer は `SidebarShell.server.tsx`（SSR seed 読取）と `useSidebarState.ts`（client 書込）のみ。両者 + focused Vitest は既に primary 名を import 済みで、責務境界の変更は不要。 |
| 価値とコストの不均衡 | 価値 = 後続実装者が「どちらが正本か」で迷わなくなる + 設計 doc が現行コードと一致。コスト = export 3 行削除 + doc 3 本の名前置換。極小コストで SSOT を確立できる高 ROI。 |
| 改善優先順位 | (1) dead alias 0 参照の再確認 → (2) alias 削除 → (3) doc 整合 + SSOT 表 + issue 前提訂正注記。 |
| 4 条件評価 | 価値性=後続誤用の予防 / 実現性=単一サイクルで完結 / 整合性=consumer・test 不変で閉じる / 運用性=focused Vitest + typecheck + lint で担保。 |

## 2. P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在するか | No（alias 削除はこれから） | 通常の実装 Phase（Phase 5 で削除実装） |
| upstream にマージ済みか | N/A（新規変更） | — |
| 前提タスク完了済みか | Yes（issue-1024 PR #1067 merged） | 依存解消済み |

→ `implementation_mode: new`。ただし削除のみの極小実装（RED/GREEN は「alias 削除後も既存 focused Vitest が green」で担保）。

## 3. 既存コードの命名規則分析（FB-01 / FB-SDK-07-4）

現行 `shell-collapse-cookie.ts`（36 行）の export 実態:

| export | 行 | 種別 | 役割 |
| --- | --- | --- | --- |
| `SHELL_COLLAPSE_COOKIE_NAME` | 3 | const | cookie 名 `"ubm_shell_collapsed"`（**primary**） |
| `SHELL_COLLAPSE_COOKIE` | 4 | const alias | `= SHELL_COLLAPSE_COOKIE_NAME`（**dead / 削除対象**） |
| `SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS` | 5 | private const | 非 export（`60*60*24*365`） |
| `parseShellCollapsedCookie(value)` | 7-11 | function | cookie **値**を `boolean \| null` に parse（**primary**） |
| `serializeShellCollapsedCookie(collapsed)` | 13-16 | function | cookie 文字列を組み立て（**primary**） |
| `writeShellCollapsedCookie(collapsed)` | 18-22 | function | `document.cookie` へ書込（**primary**） |
| `readCollapsedFromDocument()` | 24-32 | function | `document.cookie` を split し matched value を parse（**primary**・doc 名と一致） |
| `readCollapsedFromCookieString` | 34 | const alias | `= parseShellCollapsedCookie`（**dead / 削除対象**） |
| `writeCollapsedCookie` | 35 | const alias | `= writeShellCollapsedCookie`（**dead / 削除対象**） |

命名規則: 関数は camelCase（`parseShellCollapsedCookie`）、定数は SCREAMING_SNAKE（`SHELL_COLLAPSE_COOKIE_NAME`）、`*Shell*` 接頭で本モジュール固有性を示す。**primary を SSOT として正本化**する（既存命名規則に合致）。

## 4. alias 参照監査（削除安全性の根拠 / AC-3）

`apps/web/src` 全体での参照数（2026-06-03 grep）:

| symbol | 定義/同ファイル除く参照 | 判定 |
| --- | --- | --- |
| `SHELL_COLLAPSE_COOKIE`（alias） | 0 | **削除可** |
| `readCollapsedFromCookieString`（alias） | 0 | **削除可** |
| `writeCollapsedCookie`（alias） | 0 | **削除可** |
| `SHELL_COLLAPSE_COOKIE_NAME`（primary） | 2（SidebarShell.server.tsx, test） | 維持 |
| `parseShellCollapsedCookie`（primary） | 7 | 維持 |
| `writeShellCollapsedCookie`（primary） | 4（useSidebarState.ts, test 他） | 維持 |
| `serializeShellCollapsedCookie`（primary） | 6 | 維持 |
| `readCollapsedFromDocument`（primary） | 2 | 維持 |

consumer import 実測:
- `SidebarShell.server.tsx:12`: `import { parseShellCollapsedCookie, SHELL_COLLAPSE_COOKIE_NAME } from "./shell-collapse-cookie";`
- `useSidebarState.ts:10`: `import { writeShellCollapsedCookie } from "./shell-collapse-cookie";`
- `__tests__/shell-collapse-cookie.spec.ts`: `parseShellCollapsedCookie, readCollapsedFromDocument, serializeShellCollapsedCookie, writeShellCollapsedCookie`

→ **全 consumer・test が primary 名のみ使用**。alias 削除でビルド/テストへ影響なし。

## 5. タスク分類（FB-Feedback 3）

- タスク種別: **NON_VISUAL**（UI/UX の視覚的変更なし。export 削除と doc 整合のみ）。
- targeted Vitest 対象（FB-UI-02-2 / メモリ制約対策）: `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts` 単体指定。

## 6. 受入条件（AC）

| AC | 内容 |
| --- | --- |
| AC-1 | `phase-2-design.md` / `implementation-guide.md` のコードブロック・API 表が `shell-collapse-cookie.ts` の primary export 名と一致する。 |
| AC-2 | implementation-guide に「SSOT 正本 API」表 + `parseShellCollapsedCookie` が **値** parser である旨（issue 前提誤りの訂正）が明記される。 |
| AC-3 | dead alias 3 件を削除。削除前に `apps/web/src` + test で参照 0 を再確認済み。 |
| AC-4 | `pnpm typecheck` / `pnpm lint` / focused Vitest（shell-collapse-cookie.spec.ts）が green。code diff は `shell-collapse-cookie.ts` の 3 行削除のみ（test 変更なし）。 |
| AC-5 | cookie 名 / value / 属性 / Max-Age / 永続化挙動は無変更（issue-1024 I-6 維持）。 |

## 7. carry-over 確認

- 前タスク: issue-1024（PR #1067 / `6cc9a4b62`）でファイル新規作成。本タスクはその後続で、alias 削除 + doc 整合のみが新規作業。
- 元 unassigned-task: `docs/30-workflows/unassigned-task/issue-1024-followup-002-shell-collapse-cookie-doc-naming-drift-reconciliation.md`（本 workflow が consume）。

## 8. 成果物

- 設計 doc 3 本の primary 名整合差分 + SSOT 表。
- `shell-collapse-cookie.ts` の dead alias 3 行削除差分。
- 元 unassigned-task の consumed 記録。
