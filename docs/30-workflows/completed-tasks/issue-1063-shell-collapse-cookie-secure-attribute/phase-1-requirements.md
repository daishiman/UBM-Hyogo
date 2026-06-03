# Phase 1: 要件定義

> issue-1063 — shell collapse cookie に production 限定で `Secure` 属性を付与

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 1（要件定義） |
| task_id | issue-1063-shell-collapse-cookie-secure-attribute |
| 実装区分 | 実装仕様書（NON_VISUAL / security hardening） |
| implementation_mode | new（既存 serializer への後方互換追加） |
| issue | #1063（CLOSED 維持・reopen しない） |
| 対象 | `apps/web/src/components/shell/shell-collapse-cookie.ts` |

## 目的

`ubm_shell_collapsed` cookie を production（HTTPS）でのみ `; Secure` 付きで発行し、localhost dev（http）では従来どおり `Secure` 無しで発行する環境分岐の要件を確定する。Issue #1063 を現行コードへ写像した受入条件（AC）を明示列挙し、後続 Phase が逸脱なく実装できる前提を固定する。

## 実行タスク

### 1.1 真の論点（1 文）

「UI 設定 cookie（`ubm_shell_collapsed`）を、localhost dev を阻害せずに production HTTPS でのみ `Secure` 付きで発行し、cookie 属性ポリシーの一貫性（将来 cookie の標準）を確立する」。現行 serializer は dev/production で同一文字列を生成し、production でも `Secure` が無い。

### 1.2 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在する | **無し**（serializer に `Secure` 分岐なし。全ローカルブランチで grep 0 件） | Phase 5 は「serializer への `Secure` 環境分岐の新規追加」とする |
| upstream（dev）にマージ済み | 親 issue-1024 serializer は dev マージ済み（現行 HEAD `ca3fb9336` で `serializeShellCollapsedCookie` 実在確認） | 再実装不要。本タスクは `Secure` 分岐の追加 |
| 前提タスク（依存タスク）が完了済み | 完了済み（`shell-collapse-cookie.ts` の serializer / writer / parser 実在） | 依存解消タスク不要 |

`implementation_mode: "new"`（`Secure` 分岐は新規実装。既存 serializer の戻り値末尾に条件付き `; Secure` を足す後方互換変更）。

### 1.3 タスク分類

- **NON_VISUAL**。新規 UI surface は無く、変更は cookie 送信制御属性（`Secure`）のみ。`Secure` 有無はレンダリング結果・`document.cookie` の read 値に現れず、screenshot では捕捉できない。Phase 11 は NON_VISUAL 宣言で代替証跡（focused Vitest log + serializer 文字列検証）を残す。
- **docs-only ではない**（CONST_004）。Issue 本文「スコープ」が serializer への `Secure` 環境分岐 + focused Vitest を明示し、目的達成にコード変更が必須。

### 1.4 現行コード inventory（実測 / 現行 HEAD `ca3fb9336`）

| ファイル | 現状の関連実装 | 命名規則 |
|----------|---------------|---------|
| `apps/web/src/components/shell/shell-collapse-cookie.ts` | `SHELL_COLLAPSE_COOKIE_NAME = "ubm_shell_collapsed"` / `SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS = 60*60*24*365` / `serializeShellCollapsedCookie(collapsed): string` が `` `${NAME}=${value}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax` `` を返す。`writeShellCollapsedCookie(collapsed)` が `doc.cookie = serializeShellCollapsedCookie(collapsed)`。`parseShellCollapsedCookie` / `readCollapsedFromDocument` が read 経路。alias `readCollapsedFromCookieString` / `writeCollapsedCookie` 公開済み | camelCase 関数 / SCREAMING_SNAKE 定数 |
| `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts` | serializer の `Path` / `SameSite` / `Max-Age` / value を `toContain` で検証。**`Secure` の assertion は無し** | — |
| `apps/web/src/lib/is-browser.ts` | `browserDocument()`（`isBrowser() ? document : undefined`）が既存・lint 正規 accessor。`location` 専用 helper は **未提供**（`browserDocument()?.location` で `Document.location` にアクセス可能） | camelCase getter |
| `scripts/lint-boundaries.mjs` | 禁止トークン = `localStorage` / `sessionStorage`。`document` / `cookie` / `location` は非禁止。`process.env` は CLAUDE.md 不変条件で `apps/web/src` 直接参照禁止 | — |

### 1.5 受入条件（Issue #1063 → 現行コード写像）

| Issue 原文 AC | 本タスク受入条件 | 検証手段 |
|--------------|-----------------|---------|
| AC-1: production 判定時に `; Secure` 付与 | **AC-1**: `serializeShellCollapsedCookie(collapsed, true)`（secure=true）の戻り値に `; Secure` が含まれる | `shell-collapse-cookie.spec.ts` |
| AC-2: dev（http）では `Secure` 無し・回帰なし | **AC-2**: `serializeShellCollapsedCookie(collapsed, false)` の戻り値に `Secure` が含まれず、`Path=/` / `Max-Age=31536000` / `SameSite=Lax` / value が従来どおり保たれる | `shell-collapse-cookie.spec.ts` |
| AC-3: 環境判定は env アクセサ or client runtime。`process.env.*` 増やさない | **AC-3**: 環境判定は client runtime（`browserDocument()?.location.protocol === "https:"`）で行う内部ヘルパ `isSecureRuntimeContext` を用い、serializer の `secure` 引数の既定値とする。`grep -rn "process.env" apps/web/src/components/shell/` が **0 件** | `shell-collapse-cookie.spec.ts`（default-path）+ grep |
| AC-4: cookie 名/value/属性は issue-1024 と同一・HttpOnly なし | **AC-4**: cookie 名 `ubm_shell_collapsed` / value / `SameSite=Lax` / `Max-Age` / `Path=/` 不変。`HttpOnly` 付与なし | `shell-collapse-cookie.spec.ts` |
| AC-5: parser 無改修・SSR seed / hydration 回帰なし | **AC-5**: `parseShellCollapsedCookie` / `readCollapsedFromDocument` 無改修。`writeShellCollapsedCookie` は既定の `secure` 引数経由で runtime 判定を拾い、呼出側 signature 不変 | 既存 parser/writer test 維持 |
| AC-6: focused Vitest green | **AC-6**: `shell-collapse-cookie.spec.ts` が green（secure=true→付与 / secure=false→無し / default(jsdom http)→無し / parser 後方互換） | focused Vitest |
| AC-7: typecheck / lint green・OKLch 不変・D1 直接アクセスなし | **AC-7**: `pnpm typecheck` / `pnpm lint`（lint-boundaries 含む）green。CSS 変更なし・D1 直接アクセスなし | `pnpm typecheck` / `pnpm lint` |

### 1.6 スコープ外（先送りではなく本質的に別レーン）

- 他 UI 設定 cookie（density 等）の `Secure` 化。本タスクは collapse 1 cookie に限定（issue 明示スコープ外）。
- cookie 名・value・`SameSite`・`Max-Age`・`Path`・`HttpOnly` の変更（issue-1024 不変条件 I-6 維持。`Secure` 有無のみが本タスクの差分）。
- `is-browser.ts` への汎用 `browserLocation()` helper 新設（本タスクは `browserDocument()?.location` で完結。新 accessor を増やすと別関心の API 設計判断が混入する）。
- API endpoint / D1 schema / Google Form 仕様変更（親不変条件 #1 / #5）。

> いずれも CONST_007 の「先送り」ではなく、本タスクの単一責務（collapse cookie の `Secure` 環境分岐）から本質的に外れる別関心事。今サイクルで `Secure` 環境分岐は完結する。

### 1.7 issue 状態の扱い

- GitHub Issue #1063 は **CLOSED**（closedAt 2026-06-02）。ユーザー指示に従い **CLOSED のまま** spec を作成し、**reopen しない**。
- 本仕様書は着手時調査で「未実装・対応必要」と判定したため、CLOSED の issue を現行コードへ再スコープして Phase 1-13 を作成し、本サイクルでローカル実装まで完了する。

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保すること。

| 参照資料 | パス | 内容 |
|----------|------|------|
| セキュリティ | `.claude/skills/aiworkflow-requirements/references/security-*.md` | cookie 属性 / 送信制御の方針確認 |
| UI/UX（shell） | `.claude/skills/aiworkflow-requirements/references/ui-ux-*.md` | sidebar shell の state / 永続化方針 |

### プロジェクト資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| 起点 spec | `docs/30-workflows/completed-tasks/issue-1024-followup-001-cookie-secure-attribute-production-hardening.md` | 本タスクの設計判断・苦戦箇所の正本 |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/` | cookie serializer / 不変条件 I-6 の出所 |
| env 不変条件 | `CLAUDE.md`「`apps/web` env アクセス不変条件（task-02 wrangler-env-injection）」 | `process.env` 直接参照禁止 |

## 統合テスト連携

本タスクは serializer 単体の focused Vitest（`shell-collapse-cookie.spec.ts`）で完結する。統合テスト（Playwright / SSR HTML 検査）は `Secure` 属性が `document.cookie` read 値に現れないため適用外。代わりに Phase 11 で browser DevTools の Application → Cookies での `Secure` フラグ目視確認手順（user-gated）を記載する。既存の shell 系統合テスト（`useSidebarState.spec.tsx` / `SidebarShell.server.spec.tsx`）への回帰がないことを Phase 9 で確認する。

## 成果物

- 本ファイル（`phase-1-requirements.md`）に AC-1〜AC-7 を明示列挙し、現行コード inventory・スコープ・issue 状態を固定する。

## 完了条件

- AC-1〜AC-7 を満たす実装手順が Phase 5 に、テストが Phase 4/6 に、検証コマンドが Phase 9 に、DoD が Phase 10 に揃っている。
- 本仕様書群と（後続実装で生じる）実コード差分が一致できるよう、変更ファイル・シグネチャ・テスト・コマンド・DoD が追跡可能である。
