# Phase 8: 品質ゲート / セキュリティ / governance

## 目的

本タスクの workflow YAML 改修 PR を安全に merge し、`pass_runtime_synced` 昇格までの 7 日間を leakage-free に運用するための CI 必須 status check、secret leakage gate、governance（CODEOWNERS / branch protection）、forward-safe rollback 検証スクリプト、`bash scripts/cf.sh` 経由の secret 操作ルールを確定する。

## 前 Phase 依存

- Phase 1: Gate decision table / 4 観測軸の閾値 / 本サイクル scope
- Phase 2: workflow YAML への step 挿入位置 / leakage grep の入力契約
- Phase 3: hourly workflow / 7day summary workflow / SSOT 4 ファイル / forward-safe rollback

## 完了条件

- [ ] CI 必須 status check 一覧を本 Phase に列挙し、`outputs/phase-08/main.md` に転記する
- [ ] secret leakage gate 3 層（Issue body / hourly log artifact / PR diff）を確定する
- [ ] governance（CODEOWNERS path / solo dev 運用ポリシー / branch protection drift 確認手順）を明記する
- [ ] forward-safe rollback 検証スクリプト（D1 列残置確認・workflow YAML revert 経路）の I/O を確定する
- [ ] Cloudflare / 1Password 操作は `bash scripts/cf.sh` 経由のみであることを再確認し、禁止事項を明記する

## 8-1. CI 必須 status check 一覧

| check | workflow | 役割 |
| --- | --- | --- |
| `typecheck` | `.github/workflows/quality.yml`（既存） | TS 型整合 |
| `lint` | 同上 | ESLint |
| `verify-indexes-up-to-date` | `.github/workflows/verify-indexes.yml`（既存） | aiworkflow-requirements indexes drift 検知 |
| `audit-correlation-verify / verify` | `.github/workflows/audit-correlation-verify.yml`（既存・Issue #554） | dev / main の required check |
| focused vitest | observation + evaluation | 親 #549 既存 + 本タスク追加分 |
| YAML 構文 | prettier check on `.github/workflows/*.yml` | 新規 7day summary YAML の構文 |

## 8-2. secret leakage gate 3 層

| 層 | 対象 | gate 経路 |
| --- | --- | --- |
| L1（hourly Issue body） | `cf-audit-log-monitor.yml` の hourly run が起票する Issue | `secret-leakage-grep.ts --exit-on-detect` を post-step に組み込み hourly fail 化 |
| L2（hourly log artifact） | hourly run の `outputs/cf-audit-log/hourly/*.json` | 同 grep gate が directory scan で対象に含む |
| L3（PR diff） | 本タスク PR / 7day evidence PR | 既存 `verify-indexes` / leakage grep を CI で実行する CODEOWNERS 経路は無いため、本タスク Phase 12 review checklist に「PR diff の手動 grep」を必須化 |

L3 の補強として、`outputs/phase-11/evidence/` 配下に commit する evidence は `secret-leakage-grep.ts outputs/phase-11/evidence/ --exit-on-detect` を Phase 6 ステップ 6 で必ず通す。

## 8-3. governance

| 項目 | 値 / 手順 |
| --- | --- |
| CODEOWNERS path | `.github/workflows/**` は CODEOWNERS で `@daishiman` が owner（CLAUDE.md governance 準拠） |
| solo dev 運用 | `required_pull_request_reviews: null`（reviewer 不要）|
| branch protection drift 確認 | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` / `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` を実行し `lock_branch=false` / `enforce_admins=true` の drift がないことを確認 |
| `--no-verify` 禁止 | 本タスクで lefthook hook を skip しない |
| force push 禁止 | base=`dev` への merge は線形履歴・squash or rebase merge |

## 8-4. forward-safe rollback 検証

| 検証項目 | コマンド | 期待 |
| --- | --- | --- |
| D1 列残置 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` | `0016_cf_audit_log_classification.sql` が apply 済みのまま、新規 migration 0 |
| workflow YAML revert 経路 | `git revert <merge-commit>` を dry-run で実行 | コンフリクトなし |
| GitHub Variables 戻し | `gh variable set CF_AUDIT_CLASSIFIER --env production --body "threshold"` | 1 行で完結。D1 列は触らない |
| hourly post-step 無効化（極端ケース） | workflow YAML の post-step に `if: false` を付与する revert PR | 1 PR で完結 |

## 8-5. `bash scripts/cf.sh` 経由ルール（再宣言）

- `wrangler` 直接実行禁止
- `op run --env-file=.env` 経由で `CLOUDFLARE_API_TOKEN` を動的注入（実値はファイル / ログに残さない）
- 本タスクでは `scripts/cf.sh d1 migrations list` で D1 列残置の確認のみ実行。`d1 export` / `deploy` / `secret put` は本サイクル不要

## 8-6. 禁止事項

- D1 schema 変更（`apps/api/migrations/` への diff 0）
- `wrangler login` の OAuth トークン保持
- `CF_AUDIT_CLASSIFIER` の値（`ml` / `threshold`）を本仕様書 / evidence ファイルに直接書く以外の場所（log / secret マネージャ無関係なファイル）に記録すること
- Issue #586 / #549 の reopen / close 操作
- `--no-verify` 系 hook skip

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 08 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 参照資料

- 親 `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-08.md`
- CLAUDE.md `## Governance / CODEOWNERS`
