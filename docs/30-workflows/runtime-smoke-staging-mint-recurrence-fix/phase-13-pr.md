# Phase 13: PR 作成（ユーザー明示承認後のみ実行）

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 13 / 13 |
| 入力 | phase-10-final-review.md / phase-11-manual-test.md / phase-12-documentation.md |
| base ブランチ | **`dev`**（CLAUDE.md 既定。`main` への PR は production リリース時の `dev → main` のみ） |
| 作業ブランチ | `docs/runtime-smoke-staging-mint-recurrence-spec` |
| 状態 | **`blocked_pending_user_approval`** |

> **本 Phase はユーザーの明示承認後にのみ実行する。** 本仕様書は手順を記述するだけで、commit / push / PR / secret 投入のいずれも自動実行しない（絶対原則）。

## 目的

実装完了かつユーザー明示承認後に、本タスクの全変更を 1 つの PR（base=`dev`）にまとめる手順を確定する。
本改善サイクルでは commit / push / PR / secret 投入のすべてが未実行（user-gated）であることを明記する。

## 実行タスク

1. 実行可否ゲート（§0）で各操作の現在状態と解放条件を確定する。
2. PR 作成手順（§1）を承認後の実行順序として記述する。
3. PR 本文の雛形（§2）を確定する。

## 0. 実行可否ゲート

| 操作 | 状態 | 解放条件 |
|---|---|---|
| spec ファイル作成（Phase 1〜13 + SSOT） | 実行可（本タスクで完了） | — |
| 実装（`bearer-freshness-gate.mts` / workflow / runner / mint helper / runbook） | **実装済み** | 実装サイクル |
| commit / push | **blocked** | ユーザー明示承認 |
| `gh pr create --base dev` | **blocked** | ユーザー明示承認 |
| `STAGING_AUTH_SECRET` 実投入（1Password → `gh secret set --env staging-runtime-smoke`） | **blocked / user-gated** | ユーザーが承認・実行（SSOT §6 / secret-provisioning.md 手順） |

> 本改善サイクルでは上記のうち commit / push / PR / secret 投入のすべてが**未実行**である。

## 1. PR 作成手順（承認後）

1. `git status --porcelain` が想定差分のみであることを確認する。
2. `git fetch origin dev` でローカル `dev` を `origin/dev` に fast-forward 同期する。
3. 作業ブランチに `dev` をマージし、コンフリクトは CLAUDE.md「コンフリクト解消の既定方針」に従って解消する。
4. 品質検証（PR 作成フローの 4 コマンド）を実行する。
   - `pnpm install --force`
   - `pnpm typecheck`
   - `pnpm lint`
   - `bash scripts/verify-pr-ready.sh`
5. 本タスク固有の追加検証を実行する。
   - 鮮度ゲート test: `pnpm vitest run scripts/smoke/__tests__/bearer-freshness-gate.spec.ts`
   - mint 自己検証 test: `pnpm vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts`
   - `actionlint .github/workflows/runtime-smoke-staging.yml`
   - `shellcheck scripts/smoke/runtime-attendance-provider.sh`
6. `git diff dev...HEAD --name-only` で PR に入るファイル一覧を取得し、漏れなし確認に使う。
7. `.claude/commands/ai/diff-to-pr.md` と `outputs/phase-12/implementation-guide.md` を参照して PR 本文を作成し、`gh pr create --base dev` で作成する。

## 2. PR 本文雛形

### 目的
`runtime-smoke-staging / smoke` の `admin-list http=401 reason=auth-token-invalid-or-expired` が 24h 周期で再発する構造を、1 サイクルで恒久的に再発不能化する。

### 根本原因
#907 で導入した CI 実行時 mint（TTL=600s）が `STAGING_AUTH_SECRET` 未投入で dead code 化し、TTL=24h（`SESSION_JWT_TTL_SECONDS=86400`）の静的 bearer へサイレント退行。失効・鍵 drift を smoke 実行前に検知・区別するゲートが不在のため、24h 周期で同じ 401 が再発していた。

### 受入条件（AC）
- AC-1 鮮度ゲート（smoke 前に `exp` decode、`exp-now<21600` で exit 1）
- AC-2 auth path 可視化（`runtime-smoke auth path: minted` / `static-fallback`）
- AC-3 401 reason 細分化（`auth-token-expired` / `auth-secret-drift`）
- AC-4 mint 自己検証（`signSessionJwt` 直後に `verifySessionJwt`）
- AC-5 SSOT 化（`reference/bearer-lifecycle-ssot.md`）
- AC-6 静的 fallback 維持（mint step の `if:` 不変）
- AC-7 不変条件維持（secret/JWT/鍵 非転記・context 名不変・新規 test は `*.spec.ts`）

### 変更ファイル一覧
- `scripts/smoke/bearer-freshness-gate.mts`（新規）
- `scripts/smoke/__tests__/bearer-freshness-gate.spec.ts`（新規）
- `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md`（新規）
- `.github/workflows/runtime-smoke-staging.yml`（修正）
- `scripts/smoke/runtime-attendance-provider.sh`（修正）
- `scripts/smoke/mint-staging-bearers.mts`（修正）
- `scripts/smoke/__tests__/mint-staging-bearers.spec.ts`（既存 parity 回帰）
- `scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts`（新規 fail path）
- `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`（修正）

### テスト結果
- `bearer-freshness-gate.spec.ts` / `mint-staging-bearers.spec.ts` / `mint-staging-bearers-self-verify.spec.ts` 全 case green（実装サイクルで取得）
- `pnpm typecheck` / `pnpm lint` / `actionlint` / `shellcheck` 全 PASS（実装サイクルで取得）
- NON_VISUAL: UI/UX 変更なし。スクリーンショット不要。代替証跡は phase-11-manual-test.md 参照

### SSOT リンク
- `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md`

### secret 投入はユーザー gated
PR では `STAGING_AUTH_SECRET` 実投入を行わない。手順は SSOT §6 / secret-provisioning.md 記載のみ。PR 本文に secret 実値・JWT・署名鍵を**転記しない**（`::add-mask::` / redact 前提）。

### 不変条件遵守
required status check context 名（`runtime smoke staging / smoke`）不変 / D1 直接アクセスなし / `wrangler` 直接実行なし（`scripts/cf.sh` 経由）。

> `outputs/phase-11/` にスクリーンショット画像は存在しないため、PR 本文にスクリーンショット専用セクションを作らない。

## 参照資料

| 参照資料 | パス | 内容 |
|---|---|---|
| 最終レビュー | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-10-final-review.md` | AC 突合表 |
| 手動テスト | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-11-manual-test.md` | NON_VISUAL 代替証跡 |
| ドキュメント | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-12-documentation.md` | 技術詳細 / 6 成果物 |
| SSOT | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md` | bearer ライフサイクル正本 |
| PR 本文仕様 | `.claude/commands/ai/diff-to-pr.md` | PR 作成フロー |

## 成果物

- 本ファイル（`phase-13-pr.md`）: 実行可否ゲート / PR 作成手順 / PR 本文雛形。
- `outputs/phase-13/pr-creation-result.md`（`blocked_pending_user_approval` プレースホルダ。承認後に PR URL を記録。本改善サイクルで生成済み）。

## 完了条件

- [x] base=`dev` が明記されている。
- [x] commit / push / PR / secret 投入が user-gated・本改善サイクルで未実行と明記されている。
- [x] PR 本文雛形（目的 / 根本原因 / AC / 変更ファイル一覧 / テスト結果 / SSOT リンク）がある。
- [x] secret 実値・JWT・署名鍵を PR に転記しないことが明記されている。
- [x] 状態が `blocked_pending_user_approval` と明記されている。
