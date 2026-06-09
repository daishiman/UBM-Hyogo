# Phase 1: 要件定義 — cf-token-env-contract-and-rotation-retirement

## 目的

CI `bulk-tag-runtime-smoke` ジョブの再現性ある失敗（`missing secrets ... CLOUDFLARE_API_TOKEN`）の真因を確定し、恒久対策の scope・受入条件・不変条件・対象 inventory を固定する。あわせて CF トークンのローテーション撤廃（非失効・狭スコープ・環境分離・漏洩時即時失効）の方針を受入条件へ落とす。

## 背景

- 失敗ジョブ: `.github/workflows/runtime-smoke-staging.yml` の `bulk-tag-runtime-smoke`（environment: `staging-runtime-smoke`）。
- 同 workflow の第1ジョブ `smoke`（attendance provider）は CF トークン不要のため成功する。CF トークンを要求するのは `bulk-tag-runtime-smoke` のみ。
- `bulk-tag-runtime-smoke` は `scripts/smoke/runtime-tag-bulk.sh` を実行し、`run_d1()` → `bash scripts/cf.sh d1 execute ... --remote` で **staging D1 を直接** seed / cleanup / audit_log 件数検証する。したがって CF API トークンは smoke の**本質的依存**であり、依存除去（API 経由化）は smoke の検証意図（audit_log 行の実在確認）を壊すため不可。
- 環境シークレット投入の正本は `scripts/smoke/provision-staging-secrets.sh`。その `SECRETS` 配列は `STAGING_*` + `SLACK_WEBHOOK_INCIDENT` のみで、`CLOUDFLARE_API_TOKEN` を含まない。
- `CLOUDFLARE_ACCOUNT_ID` は repository variable（`vars.CLOUDFLARE_ACCOUNT_ID`）で既に値があり、env dump でも値が出ている。欠落しているのは `CLOUDFLARE_API_TOKEN`（secret）のみ。

## 命名規則の分析（FB-01 / FB-SDK-07-4）

既存コードベースの命名規則を分析し、新規追加を整合させる。

| 既存パターン | 例 | 新規追加の整合 |
| ------------ | --- | -------------- |
| degrade フラグ env | `RUNTIME_SMOKE_MINT_DEGRADED`（既存・mint 失敗時 skip） | `verify-bulk-inputs.outputs.cf_degraded`（CF トークン欠落時 skip）を同パターンで追加 |
| 1Password 参照 | `op://Employee/ubm-hyogo-env/STAGING_API_BASE` | `op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE`（環境分離を名前で表現） |
| drift gate verifier | `scripts/smoke/verify-mint-env-contract.mts`（mint 専用） | `scripts/smoke/verify-runtime-smoke-secret-contract.mts`（secret 全体・別責務） |
| test 接尾辞 | `*.spec.ts`（不変条件 #8。`*.test.ts` 禁止） | `verify-runtime-smoke-secret-contract.spec.ts` |
| CI gate workflow | `verify-mint-env-contract.yml` | `verify-runtime-smoke-secret-contract.yml` |

> **不変条件 #8 注意**: 既存に `scripts/smoke/__tests__/runtime-tag-bulk.test.sh`（shell test）があるが、これは bash test であり TypeScript test 接尾辞ルール（`*.spec.ts`）の対象外。新規 TS test は必ず `*.spec.ts`。

## 真の論点（1文）

毎回赤くなる真因は「`CLOUDFLARE_API_TOKEN` が provisioning 正本に欠落し `staging-runtime-smoke` 環境に未登録」という構造ギャップであり、provisioning 正本への追加 + 全消費 secret を突合する drift gate + graceful degrade + 非失効狭スコープトークンへの再発行（rotation 撤廃）で恒久解決する。

## 実 contract（正本）

### C-1: 失敗ジョブが消費する env（`runtime-smoke-staging.yml` `bulk-tag-runtime-smoke`）

| env 名 | ソース | 現状 | degrade 対象 |
| ------ | ------ | ---- | ------------ |
| `STAGING_API_BASE` | `secrets.STAGING_API_BASE` | 環境登録済（値あり） | 否（前提・欠落は hard-fail） |
| `STAGING_ADMIN_BEARER` | `secrets.STAGING_ADMIN_BEARER` | mint or static | 否（前提・欠落は hard-fail） |
| `STAGING_AUTH_SECRET` | `secrets.STAGING_AUTH_SECRET` | mint 用 | 既存 mint-degrade で処理 |
| `CLOUDFLARE_API_TOKEN` | `secrets.CLOUDFLARE_API_TOKEN` | **未登録（空）** | **是（欠落時 degrade-skip）** |
| `CLOUDFLARE_ACCOUNT_ID` | `vars.CLOUDFLARE_ACCOUNT_ID` | 登録済（値あり） | 否（repo var・別経路） |

### C-2: provisioning 正本（`provision-staging-secrets.sh`）

`SECRETS` 配列に列挙された name のみが `staging-runtime-smoke` 環境へ `gh secret set --env` で投入され、inventory 検証で網羅性が担保される。`CLOUDFLARE_API_TOKEN` をこの配列に追加することが AC-1 の本体。

### C-3: graceful degrade パターン（既存 `RUNTIME_SMOKE_MINT_DEGRADED` 踏襲）

mint 失敗時に `RUNTIME_SMOKE_MINT_DEGRADED=1` を `GITHUB_ENV` に書き後続 step を `if: env.RUNTIME_SMOKE_MINT_DEGRADED != '1'` で skip するパターンが既存。CF トークン欠落も同型で `verify-bulk-inputs.outputs.cf_degraded=1` を導入する。

## 受入条件（AC）

- **AC-1**: `scripts/smoke/provision-staging-secrets.sh` の `SECRETS` 配列に `CLOUDFLARE_API_TOKEN:op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE` が含まれる。script 実行後 `gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets` の inventory に `CLOUDFLARE_API_TOKEN` が現れる。
- **AC-2**: `bulk-tag-runtime-smoke` の `verify required staging secrets` step は `CLOUDFLARE_API_TOKEN` が空のとき `exit 1` せず、`cf_degraded=1` を `GITHUB_OUTPUT` へ書き `::notice::` で skip 宣言する。`run bulk tag runtime smoke` 以降の step は `steps.verify-bulk-inputs.outputs.cf_degraded != '1'` で skip される。トークン存在時は従来通り smoke を実走する。
- **AC-3**: `STAGING_API_BASE` または `STAGING_ADMIN_BEARER` が空のときは従来通り `exit 1`（hard-fail）する。これらは smoke の前提であり degrade 対象に含めない。
- **AC-4**: `scripts/smoke/verify-runtime-smoke-secret-contract.mts` が `runtime-smoke-staging.yml` の全ジョブの `secrets.<NAME>` 参照を抽出し、各 name が provisioning 正本の `SECRETS`（または明示 exempt list）に含まれることを検査する。`CLOUDFLARE_API_TOKEN` を `SECRETS` に追加する**前**は `missing_provision` で exit 1、追加**後**は PASS。
- **AC-5**: `.github/workflows/cf-token-rotation-reminder.yml` を削除する。`docs/30-workflows/operations/cf-token-rotation-runbook.md` を retired tombstone 化し、新 runbook `cf-token-provisioning-and-revocation-runbook.md` が「非失効・狭スコープ・環境分離・漏洩時即時失効」を正本として記述する。
- **AC-6**: 新 runbook に次のトークン発行手順を記載する。(a) staging smoke 用 = `ubm-hyogo-db-staging` の D1:Edit のみ・no-expiry。(b) production deploy 用 = production Workers Scripts:Edit + production D1:Edit のみ・no-expiry。(a)(b) は**別トークン**で、staging 漏洩が production に波及しないこと、漏洩時は CF dashboard で即 revoke + reissue することを明記する。
- **AC-7**: `verify-mint-env-contract.mts` および `verify-mint-env-contract.yml` は変更しない（責務分離）。mint env 契約は引き続き既存 gate が担保する。
- **AC-8**: 変更後も redaction / masking 不変条件を維持する。`runtime-tag-bulk.sh` の `redact.sh` 経由 log 出力・`::add-mask::` 適用・redaction grep gate は不変。新 verifier / test はトークン値を読まず name のみを扱う。

## スコープ

### 含む

- A1〜A5（provisioning 修正 / degrade / 新 drift gate + test + CI yml）。
- B1〜B4（rotation reminder 削除 / runbook 置換・tombstone・log 追記）。
- 本実行サイクルが実行する operational 手順の runbook 化（トークン発行・投入・失効）。

### 含まない

- `production-runtime-smoke.yml`（attendance provider）の挙動変更（CF トークン非依存）。
- D1 schema 変更・API endpoint 追加・Google Form 仕様変更（不変条件 #1/#4/#5）。
- 既存 mint bearer env 契約の責務変更（AC-7）。
- GitHub OIDC トークンレス federation の導入（個人開発規模に対しオーバーエンジニアリング。runbook に不採用判断を記録）。

## 不変条件

1. D1 直接アクセスは `apps/api` に閉じる（不変条件 #5）。本タスクは CI smoke runner の既存 `cf.sh d1` 利用を変えない。
2. test ファイルは `*.spec.{ts,tsx}` のみ（不変条件 #8）。新規 TS test は `*.spec.ts`。
3. `lefthook.yml` / `.git/hooks/*` を編集しない。
4. シークレット実値を log / artifact / ドキュメントに出さない（CLAUDE.md シークレット管理）。verifier は name のみ扱う。
5. `scripts/cf.sh` ラッパー経由のみ（`wrangler` 直叩き禁止）。runbook のトークン投入手順も `gh secret set` / `provision-staging-secrets.sh` 経由。

## 依存

- 前提タスク（完了済み・再実装不要）: issue-1081（`bulk-tag-runtime-smoke` ジョブ・`runtime-tag-bulk.sh` 導入）/ staging-mint-bearer-env-contract-guard（`verify-mint-env-contract` gate 導入・degrade パターン確立）。
- 本タスクはこれらの surface を前提に additive に変更する。

## P50 前提確認チェック

| 確認項目 | 結果 |
| -------- | ---- |
| current branch に実装が存在するか | No（implemented_local_evidence_captured。実装は本サイクル） |
| upstream（main/dev）にマージ済みか | N/A（新規） |
| 前提タスク（issue-1081 / mint-env-contract）が完了済みか | Yes（completed-tasks 配下・再実装不要） |

→ `implementation_mode: new`。Phase 4 は通常の RED テスト設計、Phase 5 は新規実装。

## 完了条件

- [x] 真因を「provisioning 正本のギャップ」と確定し記録した。
- [x] AC-1〜AC-8 を明示列挙した。
- [x] scope（含む / 含まない）と不変条件を固定した。
- [x] 命名規則を既存パターンと整合させた。
- [x] P50 チェックで `implementation_mode: new` を確定した。
