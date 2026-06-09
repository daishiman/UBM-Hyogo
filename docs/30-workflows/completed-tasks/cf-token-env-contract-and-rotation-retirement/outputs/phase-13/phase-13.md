# Phase 13: PR作成 — cf-token-env-contract-and-rotation-retirement

> **重要: 本 phase は user の明示承認後のみ実施する。** commit / push / `gh pr create` は CLAUDE.md「PR作成の完全自律フロー」絶対原則および本タスク規約に従い、ユーザーが「PR作成」等を明示依頼した時にのみ実行する。
>
> **本サイクルでは PR を作らない（`implemented_local_evidence_captured`）。** 本サイクルの成果物は実装仕様書（Phase 1〜13 の markdown）であり、実コード（A1〜A5 / B1〜B4）は本実行サイクルで landed する。PR は実コードが landed した本実行サイクルで、user の明示承認を得て作成する。本 phase はその PR の**事前テンプレート仕様**を定義する。

## 目的

実装サイクル完了後に作成する PR の base ブランチ・タイトル・本文構成を事前定義し、漏れなく真因・対策・AC・operational 手順・検証ログを反映できるチェックリストを用意する。

## PR メタ情報

| 項目 | 値 |
| ---- | --- |
| base ブランチ | `dev`（既定。production リリース時の `dev → main` のみ `--base main`） |
| PR タイトル案 | `fix(ci): staging-runtime-smoke の CLOUDFLARE_API_TOKEN provisioning ギャップ解消 + CF トークン rotation 撤廃` |
| 作成コマンド | `gh pr create --base dev`（user 明示承認後のみ） |

## PR 本文に含める項目（チェックリスト）

### 1. 真因（root cause）

- [ ] CI `runtime-smoke-staging.yml` の `bulk-tag-runtime-smoke` が毎回 `missing secrets ... CLOUDFLARE_API_TOKEN` で失敗していたこと。
- [ ] 真因は `scripts/smoke/provision-staging-secrets.sh` の `SECRETS` 配列に `CLOUDFLARE_API_TOKEN` が欠落し `staging-runtime-smoke` 環境へ未登録だった**構造ギャップ**であること（週次 / 90日失効ではない）。
- [ ] `CLOUDFLARE_ACCOUNT_ID` は repo var で既に値があり、欠落していたのは `CLOUDFLARE_API_TOKEN`（secret）のみであること。
- [ ] CF トークンは smoke の本質的依存（D1 直読で audit_log 行実在を検証）であり、API 経由化での依存除去は検証意図を壊すため不可と判断したこと。

### 2. 対策 A1〜A5（CI / 契約）

- [ ] **A1**: `provision-staging-secrets.sh` の `SECRETS` に `CLOUDFLARE_API_TOKEN:op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE` を追加（`ACCOUNT_ID` は repo var のため非追加・コメント明記）。
- [ ] **A2**: `runtime-smoke-staging.yml` の `bulk-tag-runtime-smoke` を graceful degrade 化（`verify-bulk-inputs.outputs.cf_degraded`。CF 欠落は skip / `STAGING_*` 欠落は hard-fail 維持）。
- [ ] **A3**: `verify-runtime-smoke-secret-contract.mts`（新規）= workflow consumed secrets ⊆ provisioned secrets ∪ documented legacy exemptions を検査する drift gate（pure functions + main・name のみ扱う）。
- [ ] **A4**: `verify-runtime-smoke-secret-contract.spec.ts`（新規 Vitest）= 純関数 unit test。`missing_provision` を追加前 fail / 追加後 PASS の二値で検証。
- [ ] **A5**: `verify-runtime-smoke-secret-contract.yml`（新規 CI gate）= PR / push（dev, main）トリガ。required 化は未実施（user-gated・paths footgun 注記）。

### 3. 対策 B1〜B4（rotation 撤廃 / runbook）

- [ ] **B1**: `cf-token-rotation-reminder.yml` を削除（90日カレンダーローテ撤廃）。
- [ ] **B2**: `cf-token-provisioning-and-revocation-runbook.md`（新規）= 非失効・狭スコープ・環境分離・漏洩時即時失効を正本化。
- [ ] **B3**: 旧 `cf-token-rotation-runbook.md` を retired tombstone 化（本文は監査履歴として保持）。
- [ ] **B4**: `cf-token-rotation-log.md` に「rotation policy retired・event-based revocation へ移行」を追記。

### 4. AC 充足（AC-1〜AC-8）

- [ ] AC-1（provision 追加）/ AC-2（degrade）/ AC-3（`STAGING_*` は hard-fail）/ AC-4（drift gate fail-fast）/ AC-5（reminder 削除 + runbook 置換）/ AC-6（別トークン狭スコープ no-expiry）/ AC-7（mint-env-contract 不変）/ AC-8（redaction / mask 不変）を Phase 10 判定表へのリンクとともに反映。

### 5. user-gated operational 手順（PR マージ後に user が runbook に従って実施）

- [ ] 1Password item `CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE` 作成 + staging 狭スコープトークン（D1:Edit on ubm-hyogo-db-staging のみ・no-expiry）の発行・保管。
- [ ] `bash scripts/smoke/provision-staging-secrets.sh` 実行で `staging-runtime-smoke` 環境へ `CLOUDFLARE_API_TOKEN` 投入。
- [ ] `gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets` で inventory に `CLOUDFLARE_API_TOKEN` が現れることを確認（AC-1）。
- [ ] production deploy 用トークンを別途・別トークンで（Workers Scripts:Edit + D1:Edit on production のみ・no-expiry）発行（AC-6）。
- [ ] （任意 M-1）`verify-runtime-smoke-secret-contract.yml` を dev / main required check 登録する場合は paths footgun 回避を検討。
- [ ] （任意 M-2）dead 化した `CF_TOKEN_ISSUED_AT` repo var の物理削除。

### 6. 検証ログ（Phase 9 結果を貼付）

- [ ] `pnpm typecheck` exit 0。
- [ ] `pnpm lint` exit 0。
- [ ] `pnpm vitest run scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts` 全 PASS。
- [ ] `pnpm exec tsx scripts/smoke/verify-runtime-smoke-secret-contract.mts` exit 0（A1 追加後 PASS）。
- [ ] `actionlint .github/workflows/runtime-smoke-staging.yml .github/workflows/verify-runtime-smoke-secret-contract.yml` 指摘 0。
- [ ] `bash -n scripts/smoke/provision-staging-secrets.sh` exit 0。
- [ ] `grep -rn "cf-token-rotation-reminder"` stale 参照 0（FB-UI-02-1 削除 PASS 基準）。
- [ ] `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` IDENTICAL。

### 7. スクリーンショット

- [ ] **なし**（NON_VISUAL タスク・UI 変更なし）。`outputs/phase-11/` に画像がないためスクリーンショット専用セクションは作らない。

## PR 作成前チェック（実装サイクルで実施）

- [ ] `git status --porcelain` が空（全変更コミット済み）。
- [ ] `git diff dev...HEAD --name-only` で PR 対象ファイル一覧を取得し漏れなし確認。
- [ ] base = `dev` を明示。
- [ ] 本文に真因 / A1-A5 / B1-B4 / AC / operational / 検証ログを反映。
- [ ] secret 実値 / トークン値を本文・ログに一切転記していないこと（CLAUDE.md シークレット管理）。

## 完了条件

- [x] user 明示承認後のみ実施・本サイクルでは PR を作らない（implemented_local_evidence_captured）ことを冒頭に明記した。
- [x] PR base = dev・タイトル案を定義した。
- [x] PR 本文に含める項目（真因 / A1-A5・B1-B4 / AC / user-gated operational / 検証ログ）をチェックリスト化した。
- [x] NON_VISUAL のためスクリーンショット項目を作らないことを明記した。
- [x] secret 実値非転記の不変条件を PR 作成前チェックに含めた。
