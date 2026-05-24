# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
|---|---|
| タスク ID | runtime-smoke-staging-mint-recurrence-fix |
| Phase | 1 / 13 |
| 実装区分 | 実装仕様書（CONST_004 デフォルト） |
| タスク分類 | NON_VISUAL / CI recurrence prevention（UI task ではない） |
| implementation_mode | new（新規 `bearer-freshness-gate.mts` を含む） |
| 依存タスク | `task-staging-auth-secret-binding-recovery-001`（完了済・検証側 `AUTH_SECRET` binding 確立）/ `ci-green-recovery-smoke-coverage-shard`（完了済・mint 基盤導入。本タスクはその有効化欠落を補完する） |

## 目的

`runtime-smoke-staging / smoke` の `admin-list http=401 reason=auth-token-invalid-or-expired` 再発を、失敗の**起こり方そのもの**を変えることで恒久的に止める。具体的には (1) smoke 実行前に bearer 失効を loud に検知する鮮度ゲート、(2) どの auth path が有効かの可視化、(3) 失効と署名鍵 drift を区別する reason 細分化、(4) mint 自己検証、(5) bearer/secret ライフサイクルの SSOT 化、を 1 サイクルで導入する。

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|---|---|---|
| current branch に実装が存在する | No（本改善サイクルで実装済み。鮮度ゲート module は追加済み） | 通常の実装 Phase（Phase 5 = 新規実装）とする |
| upstream（dev）に mint 基盤がマージ済み | Yes（#907 で `mint-staging-bearers.mts` 等は dev に存在） | mint 基盤は再実装せず、有効化欠落と検知ゲート不在を補完する差分のみ実装する |
| 前提タスク（binding recovery）が完了済み | Yes（`task-staging-auth-secret-binding-recovery-001`） | 検証側 `AUTH_SECRET` binding は変更しない |

## 受入条件（AC）

index.md §3 の AC-1〜AC-7 を正本とする。本 Phase で各 AC を検証可能な完了条件へ確定する。

| AC | 検証可能な完了条件 |
|---|---|
| AC-1 | `bearer-freshness-gate.mts` の `classifyBearerFreshness(token, nowSeconds, thresholdSeconds)` が、`exp - nowSeconds < thresholdSeconds` で `{ fresh: false, secondsRemaining, reason: "expiring-or-expired" }` を返す。workflow が smoke 実行前にこれを呼び、`fresh: false` なら exit 非ゼロ。既定 threshold=21600。 |
| AC-2 | workflow ログに `runtime-smoke auth path: minted` または `runtime-smoke auth path: static-fallback` の 1 行が必ず出力される（secret 値を含まない）。 |
| AC-3 | `runtime-attendance-provider.sh` の 401 失敗時、bearer の `exp` を decode し `exp <= now` なら `reason=auth-token-expired`、`exp > now` なら `reason=auth-secret-drift` を出力する。`auth-secret-binding-missing`（500）/ `auth-not-admin`（403）は不変。 |
| AC-4 | `mint-staging-bearers.mts` が署名直後に `verifySessionJwt(authSecret, token)` を実行し、`null` なら exit 非ゼロ（JWT 文字列は出力しない）。 |
| AC-5 | `reference/bearer-lifecycle-ssot.md` が存在し、TTL（静的 86400 / minted 600）・secret 同期不変条件・診断ディシジョンツリーを記載。runbook が SSOT へリンクする。 |
| AC-6 | mint step の `if: env.STAGING_AUTH_SECRET != ''` を維持し、静的 bearer 参照を削除しない。 |
| AC-7 | `git grep` で新規/変更ファイルに JWT 文字列・署名鍵・secret 実値の平文出力が 0 件。required status check context 名が不変。新規 test は `*.spec.ts` のみ。 |

## inventory（現行コードベースの確定事実）

| 対象 | 現行値 / シグネチャ | パス:行 |
|---|---|---|
| 静的 bearer TTL | `SESSION_JWT_TTL_SECONDS = 24 * 60 * 60`（86400 秒） | `packages/shared/src/auth.ts:42` |
| 署名関数 | `signSessionJwt = async (secret, input: SignJwtInput): Promise<string>` | `packages/shared/src/auth.ts:93` |
| 検証関数 | `verifySessionJwt = async (token, secret, nowSeconds?): Promise<SessionJwtClaims \| null>` | `packages/shared/src/auth.ts:127` |
| claims 型 | `SessionJwtClaims { memberId, email, isAdmin, exp, iat, name? }` | `packages/shared/src/auth.ts:23` |
| minted TTL | `DEFAULT_TTL_SECONDS = 600`（mint helper 既定） | `scripts/smoke/mint-staging-bearers.mts:18` |
| mint gate | `if: env.STAGING_AUTH_SECRET != ''` | `.github/workflows/runtime-smoke-staging.yml:39,45` |
| 401 分類（現行） | 500→`auth-secret-binding-missing` / 401→`auth-token-invalid-or-expired` / 403→`auth-not-admin` | `scripts/smoke/runtime-attendance-provider.sh:167-180` |
| smoke 必須 env | `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER` | `scripts/smoke/runtime-attendance-provider.sh:58-61` |
| redact | `scripts/smoke/redact.sh` | smoke runner が body を通す |

## 命名規則（既存コードベース分析）

| 種別 | 規則 | 既存例 |
|---|---|---|
| smoke script（TS） | kebab-case `.mts`、ESM、純粋関数 export + CLI guard（`import.meta.url === pathToFileURL(entry).href`） | `mint-staging-bearers.mts` |
| smoke script（shell） | kebab-case `.sh`、`set -euo pipefail`、`fail_and_exit` パターン | `runtime-attendance-provider.sh` |
| テスト | `*.spec.ts`（`scripts/smoke/__tests__/`） | `mint-staging-bearers.spec.ts` |
| 純粋関数 | env を直接読まず引数で受ける（test 可能化） | `mintStagingBearers(env)` |
| 出力規約 | JWT / secret を stdout / GITHUB_OUTPUT 値以外に出さない。mask は呼び出し元 workflow が適用 | mint helper コメント |

> 新規 `bearer-freshness-gate.mts` は上記規則に従う（kebab-case `.mts` / 純粋関数 `classifyBearerFreshness` + CLI guard / token 非出力）。

## 実行タスク

1. AC-1〜AC-7 の検証可能な完了条件を確定する（本 Phase で完了）。
2. inventory と命名規則を Phase 2 設計の前提として固定する。
3. タスク分類を NON_VISUAL と確定し、Phase 11 を自動テスト + 代替証跡で構成することを宣言する。
4. スコープ外（index.md §6）を再確認し、CONST_007 に基づき本サイクルで完了可能な範囲に閉じていることを確認する。

## 統合テスト連携

| 連携先 | 連携内容 | Phase |
|---|---|---|
| Phase 2（設計） | 確定した AC-1〜AC-7・inventory・命名規則を設計の前提入力とする | phase-2-design.md |
| Phase 4（テスト計画） | inventory の関数シグネチャ（`signSessionJwt` / `verifySessionJwt` / `mintStagingBearers`）を境界値テスト設計の正本とする | phase-4-test-plan.md |
| 既存 smoke 基盤 | `runtime-attendance-provider.sh` の 401 分類（L167-180）と必須 env（L58-61）を回帰の基準点とし、reason 細分化が既存値（`auth-secret-binding-missing` / `auth-not-admin`）を壊さないことを担保する | scripts/smoke/runtime-attendance-provider.sh |

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に以下のシステム仕様を確認し、既存設計との整合性を確保する。

| 参照資料 | パス | 内容 |
|---|---|---|
| 認証/セキュリティ core | `.claude/skills/aiworkflow-requirements/references/architecture-auth-security-core.md` | 認証境界・session 検証の設計原則 |
| セキュリティ運用 | `.claude/skills/aiworkflow-requirements/references/security-operations.md` | secret 取り扱い・漏洩防止の運用基準 |
| エラーハンドリング | `.claude/skills/aiworkflow-requirements/references/error-handling.md` | fail-loud / 診断可能性の方針 |

### プロジェクト仕様

| 参照資料 | パス | 内容 |
|---|---|---|
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | session JWT / Auth.js 設計 |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | MVP 認証スコープ |
| 既存 mint 基盤 | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/index.md` | #907 の mint 導入と fallback 維持・secret 投入 user-gated の記録（再発の起点） |
| secret 投入 runbook | `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | staging-runtime-smoke 環境への secret 投入手順 |
| シークレット管理 | `CLAUDE.md`（シークレット管理 / `apps/web` env アクセス不変条件） | `::add-mask::` / op 参照 / 平文禁止 |

## 成果物

- 本ファイル（`phase-1-requirements.md`）: 受入条件・inventory・命名規則・タスク分類の確定。

## 完了条件

- [x] AC-1〜AC-7 が検証可能な完了条件として記述されている。
- [x] inventory が現行コードの実値（パス:行）で裏付けられている。
- [x] 命名規則が既存 smoke script から抽出されている。
- [x] タスク分類が NON_VISUAL と明示されている。
- [x] スコープが CONST_007（1 サイクル完了）に収まることを確認した。
