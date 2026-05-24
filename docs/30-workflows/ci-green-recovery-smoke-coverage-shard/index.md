# ci-green-recovery-smoke-coverage-shard

> 実装区分: **実装仕様書**（CONST_004 デフォルト。3 lane すべて code / CI config / 新規 script を伴う）
> 状態: `implemented_local_evidence_captured / implementation / NON_VISUAL / runtime_ci_pending`
> 作成日: 2026-05-23
> 作業ブランチ: `fix/runtime-smoke-staging-admin-401-spec`
> base ブランチ: `dev`

## 目的

3 件の CI 失敗を **1 実装サイクル**（CONST_007）で恒久解消する。現在のワークツリーでは Lane A/B/C のコード・CI config・runbook 更新まで実装済みで、ローカル検証は green。staging secret 投入、remote CI 観測、commit/push/PR は user-gated として残す。

| 失敗 | workflow / job | 症状 | 本仕様の lane |
|---|---|---|---|
| (A) | `backend-ci` → `runtime-smoke-staging / smoke` | `FAIL: admin-list http=401 contract=.members \| type == "array"` | Lane A |
| (B) | `ci / coverage-gate` | `MISSING: packages/{contracts,integrations,shared,integrations/google}/coverage/coverage-summary.json` → exit 1 | Lane B |
| (C) | `ci / coverage-gate-shard (packages)` | `actions/checkout@v4`: `fatal: could not read Username for 'https://github.com': terminal prompts disabled` → exit 128 | Lane C |

## 根本原因サマリ（調査確定事実）

| Lane | 根本原因 | 確定根拠（パス:行） |
|---|---|---|
| A | `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` は **24h TTL の HS256 session JWT** を GitHub 環境 secret に静的保存している。`SESSION_JWT_TTL_SECONDS = 86400` のため 24h で必ず失効し、`verifySessionJwt` が `null` を返して require-admin が 401 を返す。`reason=auth-secret-binding-missing`（500 "auth misconfigured"）がログに無いため **AUTH_SECRET binding は存在し、トークン値の失効が原因**と確定。 | `packages/shared/src/auth.ts:42,93,99,127,150` / `apps/api/src/middleware/require-admin.ts:122-132` / `scripts/smoke/runtime-attendance-provider.sh:165-178,206` |
| B | 集約 job `coverage-gate` は `coverage-guard.sh --no-run` で全 package を discover し coverage-summary.json を要求するが、shard job が成果物 `coverage-packages` を upload できなかったため download-artifact が空 → summary 欠落 → exit 1。**packages は test:coverage 実行時に json-summary を生成できる**（root vitest reporter に `json-summary` あり）ため、これは Lane C の純粋な下流。 | `.github/workflows/ci.yml:196-263` / `scripts/coverage-guard.sh:241-265,304-338` / `vitest.config.ts:78` |
| C | shard の `actions/checkout@v4`（`ci.yml:147`）が credential を読めず fetch 失敗。同一 run の前段 `ci` job は同じ default checkout で成功しているため **transient の可能性が残る**。加えて `ci.yml` には **top-level `permissions:` ブロックが無い**（`runtime-smoke-staging.yml` にはある）ため、default workflow token の権限縮退時に checkout が失敗しうる構造的弱点がある。 | `.github/workflows/ci.yml`（top-level `permissions` 欠如, `on:`→`jobs:`） / `.github/workflows/runtime-smoke-staging.yml:15-16` / `.github/actions/setup-project/action.yml`（checkout を行わない composite と確認済み） |

## 採用方針（ユーザー確定）

- **Lane A**: CI 実行時 mint 方式。`STAGING_AUTH_SECRET`（HS256 署名鍵, staging 同値）+ member identity を secret 化し、smoke 実行毎に `signSessionJwt` で短命 JWT を発行する。失効が原理的に起きない。署名鍵を CI に置くが権限は staging 限定。`scripts/smoke/` に mint helper を新規追加。後方互換 fallback（`STAGING_AUTH_SECRET` 未設定時は既存静的 bearer 使用）を維持し、即時運用復旧経路を壊さない。
- **Lane C**: 再現確認 → hardening → 診断改善。まず re-run で transient か確認。再現時は ci.yml に top-level `permissions: contents: read` + shard checkout への明示 `token` 付与。さらに `coverage-gate` が shard 失敗を**先に**検知して明確なエラーを出し、誤解を招く MISSING 出力を抑制する（Lane B と共通）。

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義・受入条件・inventory・命名規則 |
| 2 | [phase-2-design.md](phase-2-design.md) | 3 lane の設計（mint helper / workflow diff / coverage-guard 改修） |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビューゲート |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画（mint parity / shell unit / coverage-guard） |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順（変更/新規ファイル一覧・差分方針） |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト拡充（fail path / 回帰 guard） |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ確認 |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタリング |
| 9 | [phase-9-qa.md](phase-9-qa.md) | QA（typecheck/lint/actionlint/shellcheck） |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト（NON_VISUAL・代替証跡） |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント（概念説明 + 技術詳細） |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成（ユーザー明示承認後のみ） |

## 変更対象ファイル（全 lane 集約）

| パス | 種別 | lane |
|---|---|---|
| `scripts/smoke/mint-staging-bearers.mts` | **新規** | A |
| `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` | **新規** | A |
| `scripts/smoke/runtime-attendance-provider.sh` | 修正（401 失効 reason 出力追加） | A |
| `.github/workflows/runtime-smoke-staging.yml` | 修正（setup-project + mint step + fallback） | A |
| `scripts/smoke/__tests__/runtime-attendance-provider.bats`（または既存 shell unit） | 修正/追加（reason 分岐 unit） | A |
| `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | 修正（mint 方式 + 即時再発行手順を追記） | A |
| `.github/workflows/ci.yml` | 修正（top-level permissions / shard checkout token / coverage-gate 順序） | B, C |
| `scripts/coverage-guard.sh` | 修正（--no-run の MISSING 診断メッセージ強化） | B |

## スコープ外（本仕様内では新規バックログ化しない）

- D1 schema 変更 / Google Form 仕様変更 / 新規 API endpoint 追加（CLAUDE.md 不変条件）
- `/me` 系 endpoint 自体のロジック変更（Lane A は bearer 供給方法のみ変更し endpoint は変えない）
- coverage threshold 値（80%）の変更（issue-617 / coverage-80-enforcement の正本を維持）
- 即時運用の secret 再発行の**実行**（ユーザー gated。手順は Lane A runbook に記載するが本仕様書では実行しない）

## 不変条件

1. D1 への直接アクセスは `apps/api` に閉じる（`apps/web` から禁止）。本タスクは D1 に触れない。
2. `required status check` の context 名（`coverage-gate` / `runtime smoke staging / smoke`）を変更しない（branch protection 維持）。
3. secret 実値・JWT 文字列・署名鍵を log / docs / コードに転記しない（`::add-mask::` 必須、CLAUDE.md シークレット管理）。
4. `wrangler` 直接実行禁止（Cloudflare CLI は `scripts/cf.sh` 経由）。本タスクは Cloudflare deploy を伴わない。
5. 新規 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止、CLAUDE.md 不変条件 #8）。
6. mint helper の JWT は必ず `verifySessionJwt`（`@ubm-hyogo/shared`）で検証通過することを parity test で保証し、フォーマット drift を 0 にする。
