# 2026-06-03 staging-api-url-and-session-recovery implementation sync

## Summary

`docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/` を `implemented_local_evidence_captured / implementation / NON_VISUAL` として aiworkflow-requirements skill へ同期。staging（`ubm-hyogo-web-staging.daishimanju.workers.dev`）で観測された「localhost のアドレスになっている」「ログイン情報（セッション）を取得できていない」2 症状を、同一 Cloudflare account `*.workers.dev` への web→api plain `fetch()` loopback 404 / `PUBLIC_API_BASE_URL` 非 `NEXT_PUBLIC_` inline による localhost fallback / `AUTH_SECRET` web↔api parity 未保証という共通根まで遡って恒久解消する local 実装の正本記述。3 レーンを 1 実装サイクル / 1 PR（CONST_007）で完結。

## Changed

- 実装 Lane A（server-side fetch service-binding 統一）: 新規 `apps/web/src/lib/fetch/transport.ts`（`ApiTransportEnv` / `ApiTransport` / `resolveApiFetch` / `SERVICE_BINDING_ORIGIN`）+ `apps/web/src/lib/env.ts` `getEnvironment()` / `getTransportRuntimeIsTest()` を追加し、`authed.ts` / `app/api/me/[...path]/route.ts` / `app/api/admin/[...path]/route.ts` / `app/api/auth/{gate-state,magic-link,magic-link/verify}/route.ts` / `src/lib/auth/verify-magic-link.ts` を `API_SERVICE` service-binding 優先 transport に統一。HTTP fallback は local/test 限定（fail-closed）。
- 実装 Lane B（client localhost 焼き込み根絶）: `apps/web/src/lib/fetch/public.ts` を `NEXT_PUBLIC_API_BASE_URL` 統一、非 prefix `PUBLIC_API_BASE_URL` は server-only 後方互換へ降格。`env.ts` `PublicFetchEnv` 拡張、`wrangler.toml` / `web-cd.yml` を整合。
- 実装 Lane C（CF secret parity + grep gate + smoke）: `scripts/diagnose-auth-secret-parity.sh` / `scripts/cf-secret-put-auth-secret.sh` / `scripts/smoke-staging-me.sh`（新規）+ grep gate `scripts/verify-no-localhost-bake.sh`（`:8888` / `:8787` / `localhost` を src/bundle で検出、local fallback 行のみ `// localhost-allow:local-fallback` allowlist、test/spec/__tests__ 除外）+ `.github/workflows/verify-no-localhost-bake.yml`（新規）。
- `references/workflow-staging-api-url-and-session-recovery-artifact-inventory.md`（新規）に implementation artifacts / local evidence / Lessons（L-SASR-001..004）を登録。
- `indexes/resource-map.md` / `indexes/quick-reference.md` / `references/task-workflow-active.md` に staging-api-url-and-session-recovery エントリを追加（quick-reference は先行 sync の挿入位置ずれ＝issue-1056 ブロックの `issue` / `user gate` 行が SASR 表へ取り込まれていた整合性崩れを是正）。
- `SKILL.md` 変更履歴 + `SKILL-changelog.md` + `LOGS/_legacy.md` 最新更新ヘッドラインを同一 wave 反映。
- `indexes/topic-map.md` / `indexes/keywords.json` は `pnpm indexes:rebuild` で後段再生成。

## Lessons（artifact inventory `## Lessons` へ記録）

- L-SASR-001: 同一 account `*.workers.dev` への server-side loopback は Service Binding を一次経路にし、HTTP fallback は local/test 限定にする（先行 task-05a が public.ts だけ binding 化し authed / proxy / auth route を取りこぼした再発防止）。
- L-SASR-002: client bundle の API base は `NEXT_PUBLIC_API_BASE_URL` を使う。非 prefix `PUBLIC_API_BASE_URL` は server-only 後方互換。
- L-SASR-003: localhost API fallback リテラルは明示 `localhost-allow:local-fallback` を要求し、bundle/source grep gate はそれ以外を fail させる。
- L-SASR-004: `AUTH_SECRET` parity は `secret list` の name/presence のみで確認し、usability は値を露出しない authenticated `/api/me` 200 smoke で証明する。

## Invariants

公開 API endpoint surface / D1 schema / Google Form 仕様は不変。`apps/web` は D1 直接アクセスせず API Worker（service-binding / proxy）経由のみ。`transport.ts`（`resolveApiFetch`）と `getEnvironment()` は `apps/web` 内部 helper のため system spec（`docs/00-getting-started-manual/specs/`）反映は N/A。env 参照は `apps/web/src/lib/env.ts` の公開アクセサ経由を維持（`process.env.*` 直参照なし）。

## User-gated boundary

commit、push、PR（base=dev）、`cf.sh secret put`（`AUTH_SECRET` 投入）、staging deploy、authenticated staging runtime smoke（`smoke-staging-me.sh`）は user-gated（CONST_002 / CONST_007 例外）。focused Vitest 10 files / 94 tests PASS・`bash scripts/verify-no-localhost-bake.sh --src-only` PASS・`mise exec -- pnpm typecheck` PASS は本 wave で実行済み。
