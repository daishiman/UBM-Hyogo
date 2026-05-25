# issue-879 safeServerFetch / SafeResult helper member/public 横展開

> 実装区分: **実装仕様書**（CONST_004 デフォルト。コード変更を伴う）
> 状態: `implemented_local_evidence_captured`（実装・focused evidence 完了。commit・push・PR はユーザー承認後）
> 作成日: 2026-05-24
> base ブランチ: `dev`
> 関連 issue: [#879](https://github.com/daishiman/UBM-Hyogo/issues/879)（**CLOSED 維持**。spec-from-closed-issue policy）
> 親 workflow（参照のみ）: `docs/30-workflows/admin-ui-prototype-alignment/`
> 既存 unassigned-task: `docs/30-workflows/unassigned-task/admin-ui-prototype-alignment-followup-001-safe-server-fetch-horizontal-expansion.md`（Phase 1-13 化に伴い本ディレクトリへ昇格・Phase 12 で stale 参照を更新）

## 1. 目的

admin 層で確立済みの `safeServerFetch` / `SafeResult<T>` / `AdminSectionError` パターンを member / public 層 server component に横展開し、1 endpoint 失敗時の per-section degrade を全 server fetch 経路で統一する。issue #879 は CLOSED だが、PR 文脈では `Refs #879` のみを使い、Issue state は変更しない。

## 2. 根本原因サマリ（コードベース実測）

| # | 確定事実 | 根拠 |
|---|---|---|
| R-1 | admin のみ SafeResult 適用済み | `apps/web/src/lib/admin/safe-server-fetch.ts` / `apps/web/src/lib/result.ts` |
| R-2 | `/profile` は `Promise.all([fetchAuthed, fetchAuthed])` を try/catch で囲み page-fatal で `throw err` する。section 単位の degrade 経路が存在しない | `apps/web/app/profile/page.tsx:35-48` |
| R-3 | `/(public)/members` は `listMembers` を素のまま await。1 endpoint 失敗で page 全停止 | `apps/web/app/(public)/members/page.tsx:47` |
| R-4 | `/(public)/members/[id]` は `fetchPublicOrNotFound` を try/catch するが、404 以外は再 throw で error.tsx 直行 | `apps/web/app/(public)/members/[id]/page.tsx:25-37` |
| R-5 | issue 記載の `(member)/profile/page.tsx` パスは現在実体と乖離。実体は `apps/web/app/profile/page.tsx`（`(member)` route group は layout のみ） | `apps/web/app/(member)/` / `apps/web/app/profile/page.tsx` |

### 本質的課題（1 文）

> **admin だけ per-section degrade を実装したが、同一 server fetch pattern の member/public は throw 伝播のままで、1 endpoint の transient 障害が page 全停止に拡大する非対称が残っている。**

## 3. 採用方針 — 案 B（共通 lib への昇格）

既存 unassigned-task spec §3.1 の 2 案併記から **案 B** を確定採用。

- `apps/web/src/lib/server-fetch/safe-fetch.ts` を新設し、admin / public / member 共通で参照する
- `apps/web/src/lib/admin/safe-server-fetch.ts` は薄い re-export 層として残す（既存 admin import path を不変に保つ）
- `apps/web/src/lib/result.ts` は据え置き（layer 中立）
- `SectionError` UI は **public / member の props shape を統一・admin は既存 API 維持**（theme 差分を OKLch token で吸収）
- auth/session の page-fatal error は safeServerFetch を通さず素 throw を維持（error.tsx 到達経路を保護）

## 4. 受入条件（AC）

| AC | 検証可能な完了条件 |
|---|---|
| AC-1 | `apps/web/src/lib/server-fetch/safe-fetch.ts` が新設され、`safeServerFetch<T>(thunk: () => Promise<T>): Promise<SafeResult<T>>` を export。throw を `{ ok: false, error }` に正規化、`AuthRequiredError` は re-throw。 |
| AC-2 | `apps/web/src/lib/admin/safe-server-fetch.ts` が共通 lib への re-export 層になり、admin 既存 import path（`@/lib/admin/safe-server-fetch`）が継続動作。 |
| AC-3 | `apps/web/app/profile/page.tsx` の `Promise.all([fetchAuthed, fetchAuthed])` が `safeServerFetch` 経由に置換され、`session` 取得（auth gate）は素 throw 維持・`profile` 取得失敗時のみ `MemberSectionError` で degrade。 |
| AC-4 | `apps/web/app/(public)/members/page.tsx` の `listMembers` 呼び出しが `safeServerFetch` 経由に置換され、失敗時は `PublicSectionError` を描画し他 UI は維持。 |
| AC-5 | `apps/web/app/(public)/members/[id]/page.tsx` で `fetchPublicOrNotFound` を `safeServerFetch` 経由に置換。`FetchPublicNotFoundError` は notFound() に変換、その他失敗は `PublicSectionError` で degrade（page-fatal にしない）。 |
| AC-6 | `apps/web/src/components/public/SectionError.tsx` / `apps/web/src/components/member/SectionError.tsx` を新規追加。public / member の props shape (`title?`/`detail?`/`retryHref?`/`className?`) を統一し、admin の既存 `AdminSectionError` API は互換維持する。 |
| AC-7 | 既存 API endpoint surface・D1 binding 不変（CLAUDE.md 不変条件 #1/#5）。新規 primitive・新規 visual 仕様なし（不変条件 #3）。 |
| AC-8 | HEX 直書き・`bg-[#xxx]`・`text-[#xxx]` 0 件（不変条件 #2）。新規 test は `*.spec.{ts,tsx}` のみ（CLAUDE.md #8）。`pnpm typecheck` / `pnpm lint` green。 |

## 5. スコープ（含む / 含まない）

### 含む
- 共通 helper 抽出 (`apps/web/src/lib/server-fetch/safe-fetch.ts`)
- admin 側の re-export 化（既存 import 維持）
- `SectionError` の public / member バリアント追加（public / member props shape 統一、admin API 互換維持）
- `/profile` / `/(public)/members` / `/(public)/members/[id]` の置換
- 対応 spec ファイル新規/更新（`.spec.tsx`）
- unassigned-task spec の移設・stale 参照更新（Phase 12）

### 含まない
- 新規 API endpoint・D1 schema 変更
- 新規 primitive / 新規 visual 仕様
- error boundary (`apps/web/app/error.tsx`) 自体の責務変更
- admin section の置換（admin は既に SafeResult 化済み）
- e2e / visual smoke の新規追加（既存 axe / playwright で十分カバー）

## 6. 関連 path

- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
- 既存 unassigned-task: `docs/30-workflows/unassigned-task/admin-ui-prototype-alignment-followup-001-safe-server-fetch-horizontal-expansion.md`
- 既存 admin helper: `apps/web/src/lib/admin/safe-server-fetch.ts`
- 既存型: `apps/web/src/lib/result.ts`
- 横展開対象:
  - `apps/web/app/profile/page.tsx`
  - `apps/web/app/(public)/members/page.tsx`
  - `apps/web/app/(public)/members/[id]/page.tsx`
- design token 正本: `apps/web/src/styles/tokens.css`
- CI gate: `verify-design-tokens`（task-18）
- CLAUDE.md「UI prototype alignment / MVP recovery」§不変条件 1/2/3、§5、§8
