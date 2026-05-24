# Phase 1: 要件定義

| 項目 | 値 |
| --- | --- |
| Phase | 1 要件定義 |
| 機能名 | fix-admin-server-components-render-error-stg |
| 作成日 | 2026-05-23 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| scope | apps/web admin Server Component runtime env resolution |

## 1.1 タスク分類

| 項目          | 値                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| taskType      | implementation（`apps/web/src/lib/admin/server-fetch.ts` へのコード修正を伴う）                       |
| visualEvidence | NON_VISUAL（バックエンドの env 参照経路バグ、UI 表示物の意匠変更なし）                              |
| 修正対象      | apps/web の Server Component から呼ばれる admin API fetch helper の env 解決経路                       |
| 影響 route    | `/admin`（admin route group 配下すべて：dashboard / members / tags / meetings / schema / requests / identity-conflicts / audit） |
| Phase 11      | NON_VISUAL（screenshot 不要 / focused Vitest + staging runtime smoke で代替） |
| workflow_state | `implemented_local_runtime_pending`（local code + focused tests complete; staging deploy/curl は user-gated） |

## 1.2 既存コード命名規則の確認（FB-01）

- 関連ファイル現行命名: `fetchAdmin`（camelCase）/ `server-fetch.ts`（kebab-case）/ `AdminDashboardPage`（PascalCase）→ Phase 2 で踏襲
- 既存 env helper: `getEnv()` / `getPublicEnv()`（`apps/web/src/lib/env.ts`）
- 既存テスト suffix: `*.spec.ts`（`session.spec.ts` / `auth.spec.ts` 等）

## 1.3 carry-over 確認

`git log --oneline -5`:

```
452d119b7 chore(deps): bump hono from 4.12.16 to 4.12.18 (#611)
8a9c9ca77 feat(issue-819): admin dashboard runtime screenshot via Playwright + mock-api (#849)
65330bf4b feat(issue-777): schema diff resolve history view (#845)
c10e0e39a feat(issue-806): dynamic member OG image route (#848)
5c354e095 chore(deps): bump next from 16.2.4 to 16.2.6 (#690)
```

直近 #849 で admin dashboard runtime screenshot が追加されている。今タスクは「同 smoke が staging で fail している原因の特定と修正」と位置づけられ、smoke 実装自体は再利用する。

## 1.4 inventory（変更候補ファイル）

| 区分     | パス                                                            | 想定変更種別             |
| -------- | --------------------------------------------------------------- | ------------------------ |
| 主因候補 | `apps/web/src/lib/admin/server-fetch.ts`                        | 編集（env 参照経路是正） |
| 参照     | `apps/web/src/lib/auth.ts`                                      | 参照のみ（本タスクの直接原因ではないため未編集） |
| 新規     | `apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts`     | 新規（regression）       |
| 編集     | `apps/web/src/lib/__tests__/env.spec.ts`                        | 編集（`INTERNAL_AUTH_SECRET` schema regression） |
| 参照     | `apps/web/wrangler.toml`                                        | 参照のみ（変更不可）     |
| 主因候補 | `apps/web/src/lib/env.ts`                                       | 編集（`INTERNAL_AUTH_SECRET` optional schema 追加） |
| 参照     | `apps/web/app/(admin)/layout.tsx`                               | 参照のみ                 |
| 参照     | `apps/web/app/(admin)/admin/page.tsx`                           | 参照のみ                 |
| 参照     | `apps/web/app/(admin)/admin/error.tsx`                          | 参照のみ                 |

## 1.4.1 aiworkflow-requirements 正本参照

| 正本 | 参照理由 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow ledger へ本タスクを同期 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | staging admin runtime bugfix の即時導線 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow root / implementation / evidence inventory の逆引き |
| `.claude/skills/aiworkflow-requirements/references/workflow-fix-admin-server-components-render-error-stg-artifact-inventory.md` | 成果物台帳 |

## 1.5 受入条件 (Acceptance Criteria)

| AC ID   | 内容                                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------- |
| AC-01   | staging `/admin` が 200 を返し、global-error boundary に到達しない                                          |
| AC-02   | `apps/web/src/lib/admin/server-fetch.ts` の runtime env 解決から `process.env[...]` 直接参照が削除（fixture 用 `NODE_ENV` / `PLAYWRIGHT_*` は Node/test 専用として許容）|
| AC-03   | `apps/web/src/lib/admin/server-fetch.ts` から `http://127.0.0.1:8787` リテラルが削除                        |
| AC-04   | `getEnv()` 経由で `INTERNAL_API_BASE_URL` と `INTERNAL_AUTH_SECRET` を解決する                              |
| AC-05   | 既存 Playwright admin dashboard runtime smoke (#849) が staging プレビュー or local production build で pass |
| AC-06   | 新規 focused regression test が Cloudflare env binding 経由と localhost fallback 撤去を確認する         |
| AC-07   | `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` が pass                                  |

## 1.6 スコープ

### 含む

- `fetchAdmin` の env 参照経路の `getEnv()` 経由化
- `127.0.0.1:8787` fallback 削除（schema parse 失敗時は throw → error.tsx で表示）
- staging stack trace 取得手順の文書化
- `INTERNAL_AUTH_SECRET` を `EnvSchema` に追加（現状未定義、Phase 2 で意思決定）
- 新規 regression spec 追加

### 含まない（既存境界 / 今回の直接原因外）

- `apps/web/src/lib/auth.ts` の全 `process.env` 参照の整流化（`getCloudflareContext()` + request header injection を含む既存認証境界で、本タスクの直接原因ではない）
- Sentry / Cloudflare Logs alert ルール設計（運用改善であり、admin render error の修正条件ではない）
- Cloudflare D1 binding 変更
- 認証フロー全体の再設計

> CONST_005 順守: 今回検出した直接原因（`server-fetch.ts` runtime env 解決と fallback）は同サイクルで修正する。上記は新規未タスクとして起票せず、既存境界として扱う。

## 1.7 前提・制約

- staging 環境 binding `INTERNAL_API_BASE_URL = https://ubm-hyogo-api-staging.daishimanju.workers.dev` は wrangler.toml で確認済み
- `getEnv()` は Cloudflare runtime で `getCloudflareContext().env` を優先、Node runtime（test/dev）は `process.env` を fallback として読む
- `EnvSchema` には `INTERNAL_AUTH_SECRET` を optional として追加し、未投入時も schema parse 自体は成立させる

## 1.8 risk register

| Risk                                                     | 影響度 | 緩和                                                       |
| -------------------------------------------------------- | ------ | ---------------------------------------------------------- |
| stack trace 取得前に修正してしまい別原因を見落とす       | 中     | Phase 2 着手前に `wrangler tail` 実行を必須化              |
| `EnvSchema` 追加で他経路の env parse が壊れる            | 中     | 追加 field は `.optional()` 含むかを Phase 2 で確定         |
| 同型違反が `auth.ts` にもあり layout.tsx が先に throw する | 中     | Phase 2 で `auth.ts` の `getSession()` 経路も調査必須化     |
| Workers production build (`next build --webpack`) で fail | 低     | Phase 9 で `pnpm --filter @ubm-hyogo/web build` を実行     |
