# Phase 13: PR 作成（ユーザー明示承認後のみ実行）

> **本 Phase はユーザーの明示承認後にのみ実行する。** 本仕様書は手順を記述するだけで、commit / push / PR / secret 再発行のいずれも自動実行しない。
> base ブランチは **`dev`**（CLAUDE.md 既定。`main` への PR は production リリース時の `dev → main` のみ）。
> 作業ブランチ: `fix/runtime-smoke-staging-admin-401-spec`

---

## 0. 実行可否ゲート

| 操作 | 状態 | 解放条件 |
|---|---|---|
| spec ファイル作成 | 実行可（本タスクで完了） | — |
| 実装（mint helper / workflow / coverage-guard / runbook） | **完了** | 本ワークツリーに実装済み |
| commit / push | **blocked** | ユーザー明示承認 |
| `gh pr create --base dev` | **blocked** | ユーザー明示承認 |
| staging secret 5 種の実投入（`STAGING_AUTH_SECRET` ほか） | **blocked / user-gated** | ユーザーが 1Password → `gh secret set --env staging-runtime-smoke` を承認・実行 |

---

## 1. PR 作成手順（承認後）

1. 作業状況を確認し、`git status --porcelain` が想定差分のみであることを確認する。
2. `git fetch origin dev` でローカル `dev` を `origin/dev` に fast-forward 同期する。
3. 作業ブランチに `dev` をマージし、コンフリクトは CLAUDE.md「コンフリクト解消の既定方針」に従って解消する。
4. 品質検証（PR 作成フローの 4 コマンド）を実行する。
   - `pnpm install --force`
   - `pnpm typecheck`
   - `pnpm lint`
   - `bash scripts/verify-pr-ready.sh`
5. 3 lane 固有の追加検証を実行する。
   - mint parity test: `pnpm vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts`
   - `actionlint .github/workflows/ci.yml .github/workflows/runtime-smoke-staging.yml`
   - `shellcheck scripts/coverage-guard.sh scripts/smoke/runtime-attendance-provider.sh`
6. `git diff dev...HEAD --name-only` で PR に入るファイル一覧を取得し、漏れなし確認に使う。
7. `.claude/commands/ai/diff-to-pr.md` と `outputs/phase-12/implementation-guide.md` を参照して PR 本文を作成し、`gh pr create --base dev` で作成する。

---

## 2. PR 本文に含める要点

- **目的**: 3 件の CI 失敗（runtime-smoke admin 401 / coverage-gate MISSING / coverage-gate-shard checkout 失敗）を 1 サイクルで恒久解消。
- **Lane A**: 静的 24h JWT bearer を廃し、CI 実行時 mint 方式（`STAGING_AUTH_SECRET` から短命 JWT を `signSessionJwt` で発行、TTL 既定 600s）。失効が原理的に起きない。後方互換 fallback 維持。
- **Lane B**: `coverage-gate` の step 順序入れ替え（shard 失敗検知を `--no-run` の前へ）+ MISSING 診断メッセージ強化。誤検知解消。
- **Lane C**: `ci.yml` に top-level `permissions: contents: read` + shard checkout の明示 token 付与（hardening）。
- **secret 再発行はユーザー gated**: PR では secret 実投入を行わない。投入手順は runbook 記載のみ。PR 本文に secret 実値・JWT・署名鍵を**転記しない**（`::add-mask::` 前提）。
- **NON_VISUAL**: UI/UX 変更なし。スクリーンショット不要。代替証跡は CI ログ / mint parity test / summary.json reason（phase-11/manual-test 参照）。
- **不変条件遵守**: required status check の context 名不変 / D1 直接アクセスなし / `wrangler` 直接実行なし。
- `outputs/phase-11/` にスクリーンショット画像は存在しないため、PR 本文にスクリーンショット専用セクションを作らない。

---

## 3. 成果物

- `outputs/phase-13/pr-creation-result.md`（`blocked_pending_user_approval` プレースホルダ。承認後に PR URL を記録）

## 4. 完了条件（DoD）

- [x] base=dev が明記されている
- [x] commit / push / PR / secret 再発行がユーザー gated と明記されている
- [x] PR 本文要点（3 lane / NON_VISUAL / secret gated / 不変条件）が列挙されている
- [x] secret 実値・JWT・署名鍵を PR に転記しないことが明記されている
