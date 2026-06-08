# TASK-STAGING-MINT-BEARER-ENV-CONTRACT-GUARD-001 — staging runtime smoke の mint env 契約 drift 再発防止

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。
> mint script の TypeScript 改修・新規 verify script・GitHub Actions workflow 改修・provision shell 改修・テスト追加を含むため、ドキュメントのみでは目的（CI 失敗の再発防止）を達成できない。CONST_005 の必須項目（変更対象ファイル・関数シグネチャ・入出力・テスト方針・実行コマンド・DoD）を全 phase に記載する。

---

## 1. 背景と真の論点

### 現象（CI 失敗ログ）

```
runtime smoke staging / bulk-tag-runtime-smoke   failed
mint-staging-bearers: missing env: STAGING_ME_MEMBER_ID, STAGING_ME_EMAIL
Error: Process completed with exit code 2.
```

`backend-ci` → `deploy-staging` → `runtime-smoke-staging.yml`（`workflow_call`）→ `bulk-tag-runtime-smoke` job の "mint staging admin bearer" step で発生。

### 真の論点（1 文）

**mint-staging-bearers.mts の必須 env 契約が「role 単位」になっておらず、admin だけ必要な job でも自己（me）credential を強制するため、admin-only job が原理的に env 欠落で落ちる。** さらにこの drift が PR 時点で機械検出されず、本番 CI job で初めて顕在化する。

### 根本原因（2 系統）

| # | 原因 | 証拠 |
|---|------|------|
| RC-1 | `mint-staging-bearers.mts` の `main()` が role に関わらず常に 5 env（`STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` / `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL`）を必須化 | `scripts/smoke/mint-staging-bearers.mts` の `required` オブジェクトと `missing.length > 0 → exit(2)` |
| RC-2 | `bulk-tag-runtime-smoke` job は admin bearer のみ必要で、mint step に `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL` を渡していない（渡す `env:` に存在しない） | `.github/workflows/runtime-smoke-staging.yml` `bulk-tag-runtime-smoke.steps[mint staging admin bearer].env` |
| RC-3（副因） | `provision-staging-secrets.sh` は旧 static-bearer 集合（`STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` / `STAGING_MEMBER_ID`）を provision し、JWT-mint 系 secret（`STAGING_AUTH_SECRET` / 各 `*_MEMBER_ID` / `*_EMAIL`）を provision しない。secret inventory と mint script 要求が drift | `scripts/smoke/provision-staging-secrets.sh` `SECRETS` 配列 |

---

## 2. スコープ（4 対策 / ユーザー承認済み A+B+C+D）

| 対策 | 内容 | 種別 | 対応 RC |
|------|------|------|---------|
| **A** | mint script の **role-scoping**: `--roles admin` / `--roles me` / `--roles admin,me`（既定 `admin,me` で後方互換）。要求された role の env だけ必須化し、GITHUB_OUTPUT へは存在する role の bearer のみ書く | コード（TS 改修） | RC-1, RC-2 |
| **B** | **env 契約 drift 検出 CI gate**: 新規 `scripts/smoke/verify-mint-env-contract.mts` + workflow `verify-mint-env-contract.yml`。各 mint step が渡す env / `--roles` 指定 / script 要求 env / provision カバー集合の整合を静的検証し、drift を PR 時点で fail-fast | コード（新規 TS + 新規 workflow） | 再発防止（全 RC） |
| **C** | **provision script 整合更新**: `provision-staging-secrets.sh` を JWT-mint secret 集合（`STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` / `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL`）へ整合。旧 static-bearer は fallback 用に明示分離 | コード（shell 改修） | RC-3 |
| **D** | **degrade（staging セキュリティ緩和許容）**: 必須 env 不足時に hard-fail でなく warn + degrade（mint step skip / static fallback）。staging 限定で production には適用しない | コード（TS + workflow 改修） | 再発時の自動回復 |

> **CONST_007 遵守**: A+B+C+D はすべて今回 1 サイクルで完了するスコープ。先送り・別 PR・バックログ分離はしない。並列実行は phase 内 lane（Lane-1〜Lane-4）で行うが完了タイミングは同一サイクル内。

### スコープ外（明示）

- `runtime-attendance-provider.sh` / `tag-queue-race.mjs` 等の smoke runner 本体ロジック変更（env 契約整合のみ対象）。
- production runtime smoke への degrade 適用（staging 限定）。
- 実 Cloudflare staging deploy・実 D1 mutation の実走（user-gated、Phase 13 以降）。

---

## 3. 受入条件（AC）

| ID | 受入条件 | 検証手段 |
|----|----------|----------|
| AC-1 | `mint-staging-bearers.mts` が `--roles admin` 指定時に ME 系 env を要求せず admin bearer のみ mint し GITHUB_OUTPUT へ `admin_bearer` / `member_id` のみ書く | `mint-staging-bearers.spec.ts` 新規ケース |
| AC-2 | `--roles me` 指定時は ME bearer のみ、`--roles admin,me`（既定）は両方 mint（後方互換） | 同上 |
| AC-3 | `--roles admin` 実行時に ME 系 env 未設定でも exit 0（RC-1/RC-2 回帰防止） | 同上 + CLI 実行テスト |
| AC-4 | 要求 role の env が欠落した場合のみ `missing env:` を出し、env 名のみ（値・JWT 非露出） | 既存不変条件維持テスト |
| AC-5 | `bulk-tag-runtime-smoke` job の mint step が `--roles admin` を渡し、ME 系 secret 参照を含まない | actionlint + `verify-mint-env-contract.mts` |
| AC-6 | `verify-mint-env-contract.mts` が「workflow step の渡す env が、その step の `--roles` で要求される env を満たすか」を検証し、不足を drift として exit 1 | `verify-mint-env-contract.spec.ts` |
| AC-7 | `verify-mint-env-contract.mts` が provision script のカバー secret 集合と mint script 要求 env 集合の整合を検証する | 同上 |
| AC-8 | `verify-mint-env-contract.yml` が PR / push で `verify-mint-env-contract.mts` を実行し drift で fail する | actionlint + workflow 構造 |
| AC-9 | `provision-staging-secrets.sh` が JWT-mint secret 集合を 1Password 参照で provision し、inventory 検証が必須集合の存在を確認する | shell dry-run / `bash -n` + verify gate |
| AC-10 | degrade: `RUNTIME_SMOKE_MINT_DEGRADE=1`（staging 既定）時に必須 env 不足を warn として扱い、該当 job を static fallback / skip へ degrade して CI 全体を fail させない | mint script テスト + workflow 条件 |
| AC-11 | production runtime smoke には degrade を適用しない（`RUNTIME_SMOKE_MINT_DEGRADE` 未設定 = hard-fail 維持） | workflow 差分確認 |
| AC-12 | 既存テスト（`mint-staging-bearers.spec.ts` 既存ケース・`mint-staging-bearers-self-verify.spec.ts`）が全 PASS（後方互換） | vitest |

---

## 4. 不変条件（既存維持）

1. JWT 文字列・secret 値を console / stdout / ログ / エラーメッセージに絶対出さない（env 名のみ）。
2. `GITHUB_OUTPUT` への key=value 追記のみ（mask は呼び出し元 workflow が適用）。
3. mint script は `process.env` を直接読むのは `main()` のみ。pure 関数（`mintStagingBearers` 等）は引数で env を受け取る（test 可能化）。
4. `.claude` 正本 / `.agents` mirror parity を Phase 12 で確保。
5. CLAUDE.md 不変条件 #5（D1 直接アクセスは apps/api に閉じる）等、本タスクは CI/script のみで apps/* のランタイムコードは変更しない。

---

## 5. Phase 構成と SubAgent lane

| Phase | 名称 | 主成果物 | lane |
|-------|------|----------|------|
| 1 | 要件定義 | `phase-1.md`（scope / AC / inventory / 命名規則） | 直列（設計） |
| 2 | 設計 | `phase-2.md`（role-scoping API / drift gate アルゴリズム / degrade / topology） | 直列（設計） |
| 3 | 設計レビュー | `phase-3.md`（4 条件評価 / Phase 4 進行判定） | 直列（設計） |
| 4 | テスト作成 | `phase-4.md`（test suite / expected） | Lane-1（A/D test） |
| 5 | 実装 | `phase-5.md`（変更ファイル一覧 / 差分方針 / シグネチャ） | Lane-1 |
| 6 | テスト拡充 | `phase-6.md`（fail path / 回帰 guard） | Lane-2（B gate） |
| 7 | カバレッジ確認 | `phase-7.md`（対象範囲 line/branch） | Lane-2 |
| 8 | リファクタリング | `phase-8.md`（重複削減） | Lane-3（C provision） |
| 9 | 品質保証 | `phase-9.md`（actionlint / typecheck / lint / parity） | Lane-3 |
| 10 | 最終レビュー | `phase-10.md`（AC 判定 / blocker） | Lane-4（close-out） |
| 11 | 手動テスト | `phase-11.md` + `manual-test-result.md`（NON_VISUAL 証跡） | Lane-4 |
| 12 | ドキュメント更新 | `phase-12.md` + strict 7 outputs | Lane-4 |
| 13 | PR作成 | `phase-13.md`（user-gated） | Lane-4 |

---

## 6. 正本順位（衝突時）

1. 本 `index.md` の AC（§3）
2. `outputs/phase-{1,2,3}/phase-N.md`（設計書）
3. 既存実装（`scripts/smoke/mint-staging-bearers.mts` / `runtime-smoke-staging.yml`）の現行 contract
4. task-specification-creator skill フォーマット

---

## 7. 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保すること。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | session JWT (HS256) 契約・`signSessionJwt`/`verifySessionJwt` |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | admin / me ロール境界 |
| 既存 runtime smoke 仕様 | `docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/` | bulk-tag runtime smoke の親 workflow |
| secret 管理 | CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」 | 1Password 参照・平文禁止 |

### コードアンカー（current）

| 役割 | パス |
|------|------|
| mint script 本体 | `scripts/smoke/mint-staging-bearers.mts` |
| mint script test | `scripts/smoke/__tests__/mint-staging-bearers.spec.ts`, `mint-staging-bearers-self-verify.spec.ts` |
| workflow（呼び出し元） | `.github/workflows/runtime-smoke-staging.yml` |
| backend-ci 呼び出し | `.github/workflows/backend-ci.yml`（`runtime-smoke-staging` job, `needs: [deploy-staging]`） |
| provision script | `scripts/smoke/provision-staging-secrets.sh` |
| JWT 署名 API | `packages/shared/src/auth.ts`（`signSessionJwt:93` / `verifySessionJwt:127`） |
| freshness gate（参考実装パターン） | `scripts/smoke/bearer-freshness-gate.mts` |

---

## 8. ステータス

- workflow_state: `implemented_local_evidence_captured`（Phase 1-12 仕様作成 + 実コード実装 + local evidence 完了 / Phase 13 = PR は user-gated）
- 本タスク root は **close-out 済み**（`docs/30-workflows/completed-tasks/staging-mint-bearer-env-contract-guard/` へ移動済み）。Phase 1-12 完了に伴い close-out 移動を実施。
- commit・push・PR はすべて user-gated。コード実装は本サイクルで完了済み。
