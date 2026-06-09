# issue-1145 public API base URL env unification artifact inventory

## Summary

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1145-public-api-base-url-env-unification/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #1145 CLOSED（reopen / mutation は user-gated） |
| purpose | 旧 `PUBLIC_API_BASE_URL` を apps/web から削除し、apps/og も `NEXT_PUBLIC_API_BASE_URL` へ rename して public API base URL の env key を単一化する |

## Implementation Targets

| Layer | Files |
| --- | --- |
| apps/web source/config | `apps/web/src/lib/env.ts`, `apps/web/src/lib/fetch/public.ts`, `apps/web/wrangler.toml`, `apps/web/.dev.vars.example`, `apps/web/playwright.config.ts`, `apps/web/playwright.admin-schema-diff.config.ts` |
| apps/og source/config | `apps/og/src/member-source.ts`, `apps/og/wrangler.toml` |
| tests | `apps/web/src/lib/__tests__/env.spec.ts`, `apps/web/src/lib/fetch/public.spec.ts`, `apps/web/src/lib/api/__tests__/public.spec.ts`, `apps/web/src/lib/__tests__/build-time-env.spec.ts`, `apps/web/src/lib/fetch/authed.spec.ts`, `apps/web/src/__tests__/instrumentation.runtime.spec.ts`, `apps/web/src/lib/admin/__tests__/server-fetch.{env,binding,http-fallback}.spec.ts`, `apps/og/src/__tests__/{member-source,router}.spec.ts` |
| CI env injection | `.github/workflows/{ci,lighthouse,playwright-visual-baseline-update,playwright-visual-full,pr-build-test,validate-build,web-cd}.yml` |
| aiworkflow sync | `references/environment-variables.md`, `references/auth-google-oauth-cf-integration.md`, `references/testing-playwright-e2e.md`, `references/architecture-monorepo.md`, `references/lessons-fetch-service-binding-testing.md`, `indexes/{quick-reference,resource-map}.md`, `references/task-workflow-active.md` |

## Contract

- Current public API base URL env key is `NEXT_PUBLIC_API_BASE_URL`.
- `apps/web/src/lib/env.ts` no longer exposes `PUBLIC_API_BASE_URL`, `ApiBaseEnv`, or `getApiBaseEnv()`.
- `apps/web/src/lib/fetch/public.ts` resolves HTTP fallback from `NEXT_PUBLIC_API_BASE_URL` only. Production/staging still prefer `API_SERVICE` service binding.
- `apps/og` uses `API_SERVICE` first and `NEXT_PUBLIC_API_BASE_URL` as local/test HTTP fallback.
- `.github/workflows/*` no longer injects `PUBLIC_API_BASE_URL`.

## Evidence

| Gate | Command |
| --- | --- |
| old key grep | `rg --pcre2 -n "(?<!NEXT_)PUBLIC_API_BASE_URL|getApiBaseEnv|ApiBaseEnv" apps .github` |
| focused tests | `pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/__tests__/env.spec.ts apps/web/src/lib/fetch/public.spec.ts apps/web/src/lib/api/__tests__/public.spec.ts apps/web/src/lib/__tests__/build-time-env.spec.ts apps/web/src/lib/fetch/authed.spec.ts apps/web/src/__tests__/instrumentation.runtime.spec.ts apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts` and `pnpm --filter @ubm-hyogo/og test -- apps/og/src/__tests__/member-source.spec.ts apps/og/src/__tests__/router.spec.ts` |
| type/lint | `pnpm --filter @ubm-hyogo/web typecheck`, `pnpm --filter @ubm-hyogo/web lint`, `pnpm --filter @ubm-hyogo/og typecheck` |

Commit, push, PR, deploy, and Issue mutation remain user-gated.

## Lessons Learned

専用 lessons file は新設せず本 inventory inline に集約（NON_VISUAL pure refactor・先例 issue-1111 / issue-976）。詳細知見は phase-12 `skill-feedback-report.md`（学び 1..3）/ `implementation-guide.md` §2 と対応。

- **L-I1145-001**: 同一の「env key 単一化」目的でも層によって **削除 / rename を使い分ける**。apps/web は `NEXT_PUBLIC_API_BASE_URL` 対応キーを既に持つため旧キーを**削除**できるが、apps/og は単一キー運用で削除すると base URL 解決経路そのものが消えるため**削除でなく rename**（D-2）。「単一化＝常に削除」と短絡しない。
- **L-I1145-002**: 削除順序で**型結合を機械検出**する。`env.ts`（schema / 型 / accessor から旧キー除去）を先に直すと `getPublicFetchEnv()` 戻り値型 `PublicFetchEnv` から旧キーフィールドが消え、consumer 側 `public.ts` の `?? env.PUBLIC_API_BASE_URL` 取りこぼしが **typecheck で露見**する。env.ts と public.ts は同一 PR・同一サイクルで直す（片方だけだと型エラー or fallback 消失）。
- **L-I1145-003**: scope は issue body / 元 spec でなく **grep 実測で確定**（evidence-based scoping）。元 unassigned spec / #1145 body は `apps/web` 限定だったが、grep で `apps/og`（#1084 で後付けの OG 画像生成 Worker）が旧キーをライブ消費していることを検出し scope を `apps/` 全体へ拡大（D-1）。さらに `.github/workflows/*` の env injection も旧キー削除対象に含め、grep gate を repo 全体スコープへ引き上げた。
- **L-I1145-004**: `NEXT_PUBLIC_` 接頭辞は apps/og（非 Next.js の Hono Worker）では **単なる env 変数名で runtime 挙動に影響しない**（D-4）。よって `OgEnv` フィールド名を `wrangler.toml` の `[vars]` キー名と揃える目的で rename して問題ない。接頭辞の意味は consumer フレームワークに依存することを忘れない。
- **L-I1145-005**: 旧キー専用の **dead accessor は型ごと削除**する。`getApiBaseEnv()` / `ApiBaseEnv` は production consumer 0 件（test のみ）を grep 確認のうえ削除し、`env.spec.ts` の対応 2 テストも同時削除（D-3）。旧キー削除で中身が空になる accessor を残すと混乱の元になる。
- **L-I1145-006**: **CLOSED issue の現行コード最適化フロー**。#1145 は CLOSED だが「現行コードで解決済みか」を grep 調査して未解決を確認し、issue body の scope が現行コードに対して古いことを確認のうえ現行コードへ最適化して仕様書化。CLOSED のまま `implemented_local_evidence_captured` で進め、再 OPEN / mutation は user-gated に残す。
- **L-I1145-007**: NON_VISUAL の Phase 11 evidence は status `n/a`（screenshot 行を作らない）で、AC-7 / AC-2 grep gate 0 件・focused vitest・typecheck / lint を代替証跡化する。close-out で completed-tasks へ move した際は compliance §8 prose を「move 実施済み」へ同期し、旧 active-root パス参照を 0 件に保つ（dangling 防止）。
