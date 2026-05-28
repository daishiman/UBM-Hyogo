# Phase 1: 要件定義

| 項目 | 値 |
| --- | --- |
| Phase | 1 要件定義 |
| 機能名 | profile-server-components-render-error |
| 作成日 | 2026-05-27 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| scope | apps/web profile Server Component runtime env resolution + safeServerFetch wrapping |

## 1.1 タスク分類

| 項目          | 値                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| taskType      | implementation（`apps/web/src/lib/fetch/authed.ts` と `apps/web/app/(member)/profile/page.tsx` へのコード修正） |
| visualEvidence | NON_VISUAL（runtime env 参照経路と Server Component error handling 整流化、UI 表示物の意匠変更なし） |
| 修正対象      | apps/web の Server Component から呼ばれる authed API fetch helper の env 解決経路、および `/profile` page の初回 `/me` 呼び出しの error handling |
| 影響 route    | `/profile`（member route group）。同 helper は他 member routes でも利用される可能性があるため副次的に member 全体へ波及 |
| Phase 11      | NON_VISUAL（screenshot 不要 / focused Vitest + staging runtime smoke で代替） |
| workflow_state | `implemented_local_evidence_captured`（local code 実装と focused Vitest 証跡取得済み。staging runtime は user-gated pending） |

## 1.2 既存コード命名規則の確認（FB-01）

- 関連ファイル現行命名: `fetchAuthed`（camelCase）/ `authed.ts`（kebab-case）/ `ProfilePage`（PascalCase）→ Phase 2 で踏襲
- 既存 env helper: `getEnv()` / `getApiBaseEnv()` / `getPublicEnv()` / `getAuthEnv()` / `getPublicFetchEnv()`（`apps/web/src/lib/env.ts`）
- 既存テスト suffix: `*.spec.ts` / `*.spec.tsx`（`authed.spec.ts`, `page.spec.tsx` 既存）
- `safeServerFetch` は `apps/web/src/lib/server-fetch/safe-fetch.ts` の既存 helper（`/me/profile` 経路で利用済み）

## 1.3 carry-over 確認

直近 wave で `fix-admin-server-components-render-error-stg` workflow が同型違反を `apps/web/src/lib/admin/server-fetch.ts` 配下で解消済み。本タスクは同設計を `apps/web/src/lib/fetch/authed.ts` へ展開する続編。

## 1.4 inventory（変更候補ファイル）

| 区分     | パス                                                            | 想定変更種別             |
| -------- | --------------------------------------------------------------- | ------------------------ |
| 主因候補 | `apps/web/src/lib/fetch/authed.ts`                              | 編集（env 参照経路是正・fallback 撤去） |
| 主因候補 | `apps/web/app/(member)/profile/page.tsx`                        | 編集（初回 `/me` を `safeServerFetch` 化） |
| 参照     | `apps/web/src/lib/env.ts`                                       | 参照のみ（既存 `getApiBaseEnv()` の `INTERNAL_API_BASE_URL` / `PUBLIC_API_BASE_URL` を活用） |
| 参照     | `apps/web/src/lib/server-fetch/safe-fetch.ts`                   | 参照のみ（既存 helper を再利用） |
| 参照     | `apps/web/src/lib/fetch/errors.ts`                              | 参照のみ（`AuthRequiredError` / `FetchAuthedError`） |
| 編集     | `apps/web/src/lib/fetch/authed.spec.ts`                         | 編集（`getApiBaseEnv()` 経路 regression + `process.env` 直参照不在の固定） |
| 編集     | `apps/web/app/(member)/profile/page.spec.tsx`         | 既存 spec への追記（`/me` 5xx 時 error UI 返却の固定） |
| 参照     | `apps/web/wrangler.toml`                                        | 参照のみ（既存 binding） |
| 参照     | `apps/web/app/(member)/profile/error.tsx`                       | 参照のみ（boundary 動作維持の前提） |

## 1.4.1 aiworkflow-requirements 正本参照

| 正本 | 参照理由 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow ledger へ本タスクを同期 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | staging profile runtime bugfix の即時導線 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow root / implementation / evidence inventory の逆引き |
| `docs/30-workflows/fix-admin-server-components-render-error-stg/` | 同型違反の admin 側前例 |

## 1.5 受入条件 (Acceptance Criteria)

| AC ID   | 内容                                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------- |
| AC-01   | staging `/profile` が 200 を返し、`/profile/error.tsx` boundary（「マイページの読み込みに失敗しました」）に到達しない |
| AC-02   | `apps/web/src/lib/fetch/authed.ts` から `process.env["INTERNAL_API_BASE_URL"]` / `process.env["PUBLIC_API_BASE_URL"]` の直接参照が削除 |
| AC-03   | `apps/web/src/lib/fetch/authed.ts` から `http://127.0.0.1:8787` リテラルおよび `FALLBACK_INTERNAL_API` 定数が削除 |
| AC-04   | `resolveApiBase()` が `getApiBaseEnv()` 経由で URL を解決し、解決失敗時は明示的に throw（fail-fast） |
| AC-05   | `apps/web/app/(member)/profile/page.tsx` の初回 `/me` 呼び出しが `safeServerFetch` でラップされ、`AuthRequiredError` 以外は SectionError 経由でユーザーに見える形へ降格される |
| AC-06   | `apps/web/src/lib/fetch/authed.spec.ts` が `getApiBaseEnv()` 経路を確認し、`process.env` 直接参照が無いことを固定する |
| AC-07   | `apps/web/app/(member)/profile/page.spec.tsx`（または既存 `page.spec.tsx` への追記）が `/me` 5xx 時に throw せず error UI を返すことを固定 |
| AC-08   | grep gate: `apps/web/src/lib/fetch/authed.ts` 内で `process.env[` が 0 件、`127.0.0.1` が 0 件 |
| AC-09   | `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` が pass |

## 1.6 スコープ

### 含む

- `fetchAuthed` の env 参照経路の `getApiBaseEnv()` 経由化
- `127.0.0.1:8787` fallback 削除（env 解決失敗時は throw → `/profile/error.tsx` で表示）
- `profile/page.tsx` の初回 `/me` 呼び出しの `safeServerFetch` 化（既存 `/me/profile` 経路と一貫化）
- 新規・既存 regression spec の整備
- staging stack trace 取得手順の文書化

### 含まない（既存境界 / 今回の直接原因外）

- `apps/web/src/lib/fetch/public.ts` の env 参照経路是正（task-862 等の別 workflow で同型処理済 or 別境界）
- 他 member routes での同型 `fetchAuthed` 利用箇所の error handling 一括整備（直接原因は `/profile` のみ）
- Sentry / Cloudflare Logs alert ルール設計
- 認証フロー全体の再設計

> CONST_005 順守: 今回検出した直接原因（`authed.ts` runtime env 解決と `/me` SCR ハードクラッシュ）は同サイクルで修正する。上記は新規未タスクとして起票せず、既存境界として扱う。

## 1.7 前提・制約

- staging 環境 binding `INTERNAL_API_BASE_URL` / `PUBLIC_API_BASE_URL` は wrangler.toml で確認済み
- `getApiBaseEnv()` は env.ts の `readRawEnv()` 経由で Cloudflare runtime の `getCloudflareContext().env` を優先し、Node runtime（test/dev）は `process.env` を fallback として読む
- `safeServerFetch` は既存 helper として `apps/web/src/lib/server-fetch/safe-fetch.ts` に存在し、`rethrowOn: [AuthRequiredError]` で AuthRequiredError のみ rethrow する設計

## 1.8 risk register

| Risk                                                     | 影響度 | 緩和                                                       |
| -------------------------------------------------------- | ------ | ---------------------------------------------------------- |
| `getApiBaseEnv()` 経路で `PUBLIC_API_BASE_URL` 優先順位が変わり既存 callers に影響 | 中     | Phase 2 で resolver 優先順位（INTERNAL 優先 → PUBLIC fallback）を既存ロジックと同型に保つ |
| `fetchAuthed` を呼ぶ他 server components が env 解決失敗で副次的に throw | 中     | 直接原因は `/profile` のみだが Phase 6 で他 caller の影響を grep で確認 |
| `safeServerFetch` の `rethrowOn: [AuthRequiredError]` で redirect が動かなくなる | 低     | Phase 2 で `AuthRequiredError` 判定後に `redirect()` を呼ぶ既存パターンを踏襲 |
| Workers production build (`next build --webpack`) で fail | 低     | Phase 9 で `pnpm --filter @ubm-hyogo/web build` を実行     |
