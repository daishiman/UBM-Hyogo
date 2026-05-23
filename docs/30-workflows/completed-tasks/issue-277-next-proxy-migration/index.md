# issue-277-next-proxy-migration

> Source issue: [#277](https://github.com/daishiman/UBM-Hyogo/issues/277)（OPEN のまま仕様書化）
> Parent spec: `docs/30-workflows/completed-tasks/UT-06B-NEXT-PROXY-MIGRATION.md`
> 実装区分: **実装仕様書**
> 状態: implemented_local / implementation / NON_VISUAL / runtime_evidence_pending

## 調査サマリ

- 2026-05-20 の実装 wave で `apps/web/middleware.ts` は削除され、`apps/web/proxy.ts`（function 名 `proxy` / default export / `export const config = { matcher: ... }`）へ移行済み。
- `apps/web/package.json` の `next` は `16.2.4`。Next.js 16 で `middleware` file convention は deprecated、`proxy` にリネームされた（`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` §Migration to Proxy）。
- 他 PR / 並列タスクで proxy 化された痕跡は無かったため、本 issue の実装として migration を実行した。
- `apps/web/app/(admin)/layout.tsx:3` の "middleware.ts は配置しない" 旨のコメントは、proxy 化に合わせて更新済み。
- 本 issue は OPEN 状態だが、ユーザー指示に従い「クローズ前提」で仕様書化する（実装後の close は別タスク）。
- 2026-05-20 の仕様書改善 wave で `artifacts.json`、`outputs/artifacts.json`、Phase 12 strict 7、aiworkflow-requirements 索引を追加し、task-specification-creator / aiworkflow-requirements skill 準拠を補完済み。

## 概要

`apps/web/middleware.ts` を `apps/web/proxy.ts` にリネームし、export function 名を `middleware` → `proxy` に変更する。`/admin/:path*` と `/profile/:path*` の gate 振る舞い（admin: 403 / `gate=admin_required` redirect、profile: `redirect=<元path>` redirect）は完全に維持する。`NextResponse.redirect(url)` の既定 status は 307 のため、redirect smoke も 307 を正本期待値にする。`@next/codemod` の `middleware-to-proxy` を起点に手動微調整するハイブリッド方針。

## Workflow Metadata

| 項目 | 値 |
|---|---|
| workflow_id | `issue-277-next-proxy-migration` |
| canonical root | `docs/30-workflows/issue-277-next-proxy-migration/` |
| source issue | #277 OPEN |
| parent workflow | `docs/30-workflows/completed-tasks/UT-06B-NEXT-PROXY-MIGRATION.md` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `implemented_local` |
| implementation_status | `runtime_evidence_pending` |
| user-gated operations | commit / push / PR / issue close |

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義 |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画 |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順 |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト追加 |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ |
| 9 | [phase-9-qa.md](phase-9-qa.md) | QA |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント（概念説明含む） |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成 |

## 変更対象ファイル

| パス | 種別 |
|---|---|
| `apps/web/middleware.ts` | 削除（rename 元） |
| `apps/web/proxy.ts` | 新規（rename 先、function 名 `proxy` に変更） |
| `apps/web/app/(admin)/layout.tsx` | 編集（comment 文言を `middleware.ts` → `proxy.ts` に更新） |
| `apps/web/__tests__/proxy.spec.ts` | 新規（旧 middleware に対する unit test が無いため最低限の振る舞い test を追加） |
| `apps/web/package.json` | 編集（coverage command に `apps/web/proxy.ts` を含める） |
| `vitest.config.ts` | 編集（`apps/**/__tests__` spec と `apps/web/proxy.ts` coverage 対象を含める） |

## DoD（Definition of Done）

- `apps/web/proxy.ts` が存在し、`apps/web/middleware.ts` が削除されている
- `export function proxy(req: NextRequest)` と `export const config = { matcher: ["/admin/:path*", "/profile/:path*"] }` を持つ
- `pnpm typecheck` / `pnpm lint` がパス
- `pnpm --filter @ubm-hyogo/web build` が deprecation warning（`"middleware" file convention is deprecated`）を出さずに成功
- `apps/web/__tests__/proxy.spec.ts` が追加され `pnpm --filter @ubm-hyogo/web test` がパス
- `apps/web/proxy.ts` が Vitest coverage 対象に含まれる
- 未ログイン `/profile` → 307 `/login?redirect=%2Fprofile` redirect が手動 smoke で確認できる
- 未ログイン `/admin` → 307 `/login?gate=admin_required` redirect が手動 smoke で確認できる
- 認証済 non-admin `/admin` → 403 plain text が維持される
- Phase 12 strict 7 outputs と root/output `artifacts.json` が揃っている
- aiworkflow-requirements の `resource-map` / `quick-reference` / artifact inventory が同一 wave で同期されている

## スコープ外（CONST_007 例外なし）

本仕様は単一ファイル rename + 文言更新のため、全て 1 PR / 1 サイクルで完結する。先送り項目なし。
