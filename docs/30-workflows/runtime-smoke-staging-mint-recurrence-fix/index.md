# runtime-smoke-staging-mint-recurrence-fix

> 実装区分: **実装仕様書**（CONST_004 デフォルト。新規 script / CI config / runbook を伴うコード変更）
> 状態: `implemented_local_evidence_captured`（本改善サイクルでコード実装・focused tests・正本同期まで完了。commit・push・PR はユーザー承認後）
> 作成日: 2026-05-24
> 作業ブランチ: `docs/runtime-smoke-staging-mint-recurrence-spec`
> base ブランチ: `dev`
> 採用方針: **Option C（静的 fallback 維持＋鮮度ゲート）**＋ 共通項目（mint 有効化検証ゲート / auth path 可視化 / 401 reason 細分化 / secret 同期不変条件 SSOT 化）

## 1. 目的

`backend-ci` → `runtime-smoke-staging / smoke` が `dev` マージ時に **`FAIL: admin-list http=401 contract=.members | type == "array" reason=auth-token-invalid-or-expired`** で繰り返し失敗する問題を、**1 実装サイクル**（CONST_007）で恒久的に再発不能化する。本タスクは「失敗が起きないようにする」だけでなく、「同じ失敗が**サイレントに**起きる構造そのもの」を排除する。

## 2. 根本原因サマリ（調査確定事実）

CI 失敗ログでは `STAGING_AUTH_SECRET:` が **空** だった。これが決定的証拠であり、再発の連鎖は次の構造に起因する。

| # | 確定事実 | 根拠（パス:行 / 証跡） |
|---|---|---|
| R-1 | #907（`ci-green-recovery-smoke-coverage-shard`）で導入した CI 実行時 mint（TTL=600s 短命 JWT）が **dead code 化**している。mint step は `if: env.STAGING_AUTH_SECRET != ''` でゲートされるが、`staging-runtime-smoke` 環境に `STAGING_AUTH_SECRET` が**未登録**のため永久に skip される。 | `.github/workflows/runtime-smoke-staging.yml:38-45`（`if: env.STAGING_AUTH_SECRET != ''`）/ CI run 534 env: `STAGING_AUTH_SECRET:`（空）|
| R-2 | mint skip 時は静的 `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` に **サイレント fallback** する。これらは TTL=24h の HS256 session JWT（`SESSION_JWT_TTL_SECONDS = 86400`）であり、登録から 24h で必ず失効する。失効すると `verifySessionJwt` が `exp < now` で `null` を返し、`require-admin` が 401 `unauthorized` を返す。 | `packages/shared/src/auth.ts:42,93,127`（`exp` 検証）/ `apps/api/src/middleware/require-admin.ts`（401 `unauthorized`）/ `scripts/smoke/mint-staging-bearers.mts:1-3`（24h 失効コメント）|
| R-3 | smoke の 401 reason 分類は失効（`exp <= now`）と署名鍵 drift（mint 鍵 ≠ API 検証鍵で signature mismatch）を**同一 `auth-token-invalid-or-expired` に丸めている**。両者は対処が異なる（前者=再発行 / 後者=鍵同期）ため、過去 6 回の recovery で誤診断（500 binding 欠落との混同を含む）を生んだ。 | `scripts/smoke/runtime-attendance-provider.sh:170-174`（401→`auth-token-invalid-or-expired` 単一分類）|
| R-4 | 「mint が有効化されていない」「静的 bearer が失効間近 / 失効済み」を smoke 実行**前**に検知するゲートが存在しない。fallback 退行は CI ログ上も可視化されず、失敗して初めて気づく。 | workflow に freshness / path 可視化 step が無い（`runtime-smoke-staging.yml` 全体）|
| R-5 | 恒久対策（#907）が、有効化 secret 投入を**ユーザー gated の手動ステップに先送り**したまま完了し、その手動ステップが実施されなかった。bearer ライフサイクル（24h TTL）と secret 同期不変条件（`STAGING_AUTH_SECRET` ≡ staging API `AUTH_SECRET`）を記録した SSOT も無い。 | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/index.md:29,68`（fallback 維持＋secret 投入は user-gated・未実行）|

### 本質的課題（1 文）

> **恒久対策（mint）が secret 未投入で無効化されたまま、自己失効する静的 bearer にサイレント退行し、退行・失効・鍵 drift を smoke 実行前に検知して区別する仕組みが無いため、24h 周期で同じ 401 が繰り返し再発する。**

## 3. 採用方針（ユーザー確定 = Option C ＋ 共通項目）

| 受入条件 | 内容 |
|---|---|
| **AC-1（鮮度ゲート）** | smoke 実行**前**に、実際に使う bearer（minted / 静的 fallback いずれも）の `exp` claim を decode し、`exp - now < FRESHNESS_THRESHOLD_SECONDS`（既定 21600=6h）なら **smoke を実行せず即 fail**。失敗メッセージは「どの bearer が・残り何秒で失効するか・再発行 or mint 有効化のどちらを行うか」を redact 済みで提示する。JWT 文字列は出力しない。 |
| **AC-2（path 可視化）** | workflow が「現在どの auth path が有効か」を非機密で明示する（`minted`=`STAGING_AUTH_SECRET` 設定済み & mint 実行 / `static-fallback`=未設定）。サイレント退行を**可視退行**に変える。 |
| **AC-3（401 reason 細分化）** | smoke の 401 分類を `auth-token-invalid-or-expired` 単一から、`auth-token-expired`（decode した `exp <= now`）と `auth-secret-drift`（401 `unauthorized` だが `exp` は未来 → 署名鍵 drift）に分割する。`auth-secret-binding-missing`（500）と `auth-not-admin`（403）は維持する。 |
| **AC-4（mint 自己検証）** | mint 実行時、署名直後の各 JWT を `verifySessionJwt(authSecret, token)` で検証し、検証失敗時は非ゼロ終了する（self-inconsistency / format drift を smoke 前に検出）。 |
| **AC-5（SSOT 化）** | bearer = HS256 session JWT、静的 TTL=24h、minted TTL=600s、secret 同期不変条件（`STAGING_AUTH_SECRET` ≡ staging API `AUTH_SECRET`）、診断ディシジョンツリー（500=binding / 401+expired=再発行 or mint 有効化 / 401+drift=鍵同期 / 403=identity）を **1 つの SSOT** に記録し、smoke runbook からリンクする。 |
| **AC-6（fallback 維持）** | mint は optional のまま（`if: STAGING_AUTH_SECRET != ''`）、静的 bearer 経路を維持する。`STAGING_AUTH_SECRET` 未設定での hard-fail はしない（Option C）。再発防止は「鮮度ゲート＋可視化＋reason 細分化」で担保し、静的経路の物理削除はしない。 |
| **AC-7（不変条件維持）** | secret 実値 / JWT 文字列 / 署名鍵を log / docs / コードに転記しない（`::add-mask::` / redact 必須）。required status check の context 名（`runtime smoke staging / smoke`）を変更しない。D1 / Google Form / API endpoint を変更しない。新規 test は `*.spec.ts` のみ。 |

## 4. Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義・受入条件・inventory・命名規則・タスク分類 |
| 2 | [phase-2-design.md](phase-2-design.md) | 鮮度ゲート module 設計 / workflow 差分 / reason 細分化 / mint 自己検証 / SSOT 構成 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビューゲート（4 条件評価） |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画（freshness 純粋関数 / reason 分岐 / mint 自己検証） |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順（変更/新規ファイル一覧・関数シグネチャ・差分方針） |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト拡充（fail path / 回帰 guard） |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ確認（変更範囲限定） |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタリング |
| 9 | [phase-9-qa.md](phase-9-qa.md) | QA（typecheck / lint / shellcheck / actionlint） |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー・受入条件突合 |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト（NON_VISUAL・代替証跡） |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント（概念説明 + 技術詳細 + SSOT 同期） |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成（ユーザー明示承認後のみ） |

## 5. 変更対象ファイル（集約）

| パス | 種別 | 受入条件 |
|---|---|---|
| `scripts/smoke/bearer-freshness-gate.mts` | **新規** | AC-1, AC-3 |
| `scripts/smoke/__tests__/bearer-freshness-gate.spec.ts` | **新規** | AC-1, AC-3 |
| `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md` | **新規** | AC-5 |
| `.github/workflows/runtime-smoke-staging.yml` | 修正（auth-path notice step + freshness-gate step） | AC-1, AC-2 |
| `scripts/smoke/runtime-attendance-provider.sh` | 修正（401 reason を expired / drift に細分化） | AC-3 |
| `scripts/smoke/mint-staging-bearers.mts` | 修正（署名後 `verifySessionJwt` self-check 追加） | AC-4 |
| `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` / `scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts` | 修正 / 新規（self-verify ケース追加） | AC-4 |
| `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | 修正（SSOT リンク + 鮮度ゲート運用注記） | AC-5 |

## 6. スコープ外（本仕様内で新規バックログ化しない）

- 静的 bearer fallback 経路の**物理削除**（Option B は不採用。AC-6 で維持）
- `STAGING_AUTH_SECRET` 実値の投入**実行**そのもの（1Password / `gh secret set` を要するユーザー操作。手順は runbook に記載するが本仕様書では実行しない。ただし AC-1 鮮度ゲートにより「未投入で静的 bearer が失効間近」を smoke 前に loud fail させ、サイレント再発を構造的に不可能にする）
- staging API `AUTH_SECRET` binding 自体の再構成（`task-staging-auth-secret-binding-recovery-001` で完了済み。本タスクは検証側を変更しない）
- D1 schema / Google Form 仕様 / 新規 API endpoint（CLAUDE.md 不変条件）
- coverage / shard 系（Lane B/C は #907 で対応済み。本タスクは Lane A の再発防止のみ）

## 7. 不変条件

1. secret 実値・JWT 文字列・署名鍵を log / docs / コードに転記しない（`::add-mask::` を `GITHUB_ENV` export より前に適用、`scripts/smoke/redact.sh` を通す）。
2. required status check の context 名（`runtime smoke staging / smoke`）を変更しない（branch protection 維持）。
3. `wrangler` 直接実行禁止（Cloudflare CLI は `scripts/cf.sh` 経由）。本タスクは Cloudflare deploy を伴わない。
4. 新規 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止、CLAUDE.md 不変条件 #8）。
5. freshness gate の JWT decode は **署名検証なしの payload 読み取り**に限定し、`exp` 以外の claim 値・token 文字列を出力しない。
6. mint 自己検証の JWT は `verifySessionJwt`（`@ubm-hyogo/shared`）で検証通過することを保証し、署名/検証の format drift を 0 にする。
