# Phase 8 Output: DRY 化 — 09c-A-production-deploy-execution

[実装区分: 実装仕様書（runbook execution + evidence collection）]

Status: spec_created
Runtime evidence: pending_user_approval（Phase 11 で実値に置換）

## 1. evidence 命名規則の正規化表

Issue #353 mirror の実行証跡はすべて `docs/30-workflows/issue-353-09c-production-deploy-execution/outputs/phase-11/` 配下に配置する。Canonical root `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/` は参照元として維持し、mirror 実行時に証跡を書き込まない。

| step（Phase 2 §2 の依存 matrix と対応） | evidence path | 形式 | 備考 |
| --- | --- | --- | --- |
| 0. upstream_check | `upstream-green-evidence.md` | md（citation のみ） | 09a-A / 09b-A / 09b-B の outputs/phase-11/ への file path 引用 |
| 1. approval_phase10 | `user-approval-log.md` § Phase 10 | md（追記式） | 1 ファイルに 3 段 approval を集約 |
| 2. main_merge | `main-merge-commit.txt` | txt | merge commit hash + PR URL（mask 不要） |
| 3. identity_check | `cf-whoami.txt` | txt | account email / id（mask 確認） |
| 4. d1_backup | `d1-backup-{YYYYMMDD-HHMM}.sql` | sql | size > 0 確認、別途 `d1-backup-{YYYYMMDD-HHMM}.meta.txt` に size を記録可 |
| 5. d1_list_before | `d1-migrations-list-before.txt` | txt | mutation 前 |
| 6. approval_phase11_apply | `user-approval-log.md` § Phase 11 / apply | md | 同 1 ファイル内 section |
| 7. d1_apply | `d1-migrations-apply.txt` | txt | apply stdout/stderr 全文 |
| 8. d1_list_after | `d1-migrations-list-after.txt` | txt | apply 後 |
| 9. approval_phase11_deploy_api | `user-approval-log.md` § Phase 11 / api-deploy | md | — |
| 10. api_deploy | `api-deploy.log` | log | exit code 含む |
| 11. approval_phase11_deploy_web | `user-approval-log.md` § Phase 11 / web-deploy | md | — |
| 12. web_deploy | `web-deploy.log` | log | exit code 含む |
| 13. approval_phase11_tag | `user-approval-log.md` § Phase 11 / release-tag | md | — |
| 14. release_tag | `release-tag.txt` | txt | tag 名 / commit hash / push 確認（`git ls-remote --tags origin`） |
| 15. runtime_smoke | `smoke-public.md` / `smoke-member.md` / `smoke-admin.md` | md | 10 ルートを 3 ファイルに分割 |
| 15. runtime_smoke (visual) | `smoke-screenshots/{route}-{YYYYMMDD-HHMM}.png` | png | サブディレクトリ |
| 16. invariant_check | `invariants.md` | md | #5 / #6 / #14 の検証結果 |
| 17. verify_24h | `24h-verification-summary.md` | md | 24h 経過後 |
| 17. verify_24h (visual) | `24h-metrics-screenshots/{metric}-{YYYYMMDD-HHMM}.png` | png | サブディレクトリ |
| pre-flight | `preflight-typecheck.md` / `preflight-lint.md` / `preflight-build.md` | md | Phase 9 で取得 |
| pre-flight | `redaction-check.md` | md | Phase 9 で取得 |

### 命名ルール（強制）

- ファイル名は kebab-case 固定
- timestamp は `YYYYMMDD-HHMM`（分単位、JST 起点）。秒単位は不要
- screenshot は `smoke-screenshots/` または `24h-metrics-screenshots/` の **2 サブディレクトリのみ**
- 同名 file の重複が必要な場合は timestamp で識別する（上書き禁止）
- secret 値は file 名・本文ともに転記禁止

## 2. Cloudflare CLI ラッパー一元化（DRY 1 系統）

### 採用ルール

すべての Cloudflare 操作は **`bash scripts/cf.sh` 経由のみ**。`wrangler` / `npx wrangler` の直接実行は禁止（CLAUDE.md の Cloudflare 系 CLI 実行ルールと整合）。

| 操作カテゴリ | 正規コマンド | 禁止コマンド |
| --- | --- | --- |
| identity | `bash scripts/cf.sh whoami` | `wrangler whoami` |
| D1 export | `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --remote --output=<path> --env production --config apps/api/wrangler.toml` | `wrangler d1 export ...` |
| D1 migration list | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml` | `wrangler d1 migrations list ...` |
| D1 migration apply | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml` | `wrangler d1 migrations apply ...` |
| D1 read-only SQL | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --remote --env production --command "<SELECT-only>"` | `wrangler d1 execute ...` |
| Worker rollback | `bash scripts/cf.sh rollback <version-id> --config apps/api/wrangler.toml --env production` | `wrangler rollback ...` |

### 一元化の根拠

`scripts/cf.sh` は次を保証する（CLAUDE.md より）:

1. `op run --env-file=.env` で `CLOUDFLARE_API_TOKEN` 等を 1Password から動的注入（実値はファイル/ログに残らない）
2. グローバル `esbuild` バージョン不整合を `ESBUILD_BINARY_PATH` で自動解決
3. `mise exec --` 経由で Node 24 / pnpm 10 を保証

このため `wrangler` 直接実行は secret leak / esbuild 不整合 / Node drift の 3 重リスクを抱える。runbook / phase outputs から完全排除する。

## 3. deploy 経路の正規ルート

### 確定ルート（DRY 1 系統）

| 対象 | 正規コマンド | 用途 |
| --- | --- | --- |
| API Worker（`ubm-hyogo-api`） | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` | 通常 deploy（Phase 11 step 10） |
| Web Worker pre-build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | OpenNext build を必須前提（Phase 11 step 11） |
| Web Worker（`ubm-hyogo-web`） | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` | 通常 deploy（Phase 11 step 12） |
| API rollback | `bash scripts/cf.sh rollback <version-id> --config apps/api/wrangler.toml --env production` | rollback / 緊急時のみ（user approval 必須） |
| Web rollback | Cloudflare Dashboard 操作 + `bash scripts/cf.sh rollback ...`（Worker 系の場合） | rollback 時のみ |

### 正規ルートを 1 本にする理由

- `apps/api` / `apps/web` の `package.json` には `deploy:production` script は **存在しない**（Phase 4 で確認済み）。そのため deploy 経路は `bash scripts/cf.sh deploy` 直接呼び出しに統一し、旧 `pnpm --filter ... deploy:production` 経由の二重表記を排除する。
- Web は OpenNext build (`pnpm --filter @ubm-hyogo/web build:cloudflare`) で `.open-next/worker.js` と `.open-next/assets/` を生成しないと deploy が失敗するため、build → deploy の 2 ステップを必ず分離して runbook 化する。
- `wrangler deploy` / `wrangler d1 ...` の直接実行は禁止（cf.sh 経由のみ）。

## 4. redaction 規則の共通化

### mask 対象キー（8 種）

| キー | 由来 | mask 対象 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | `.env` op 参照 | log / evidence / commit メッセージ |
| `AUTH_SECRET` | Auth.js | 同上 |
| `GOOGLE_CLIENT_SECRET` | OAuth | 同上 |
| `GOOGLE_PRIVATE_KEY` | service account | 同上 |
| `MAIL_PROVIDER_KEY` | magic link 送信 | 同上 |
| `RESEND_API_KEY` | mail provider | 同上 |
| `SLACK_WEBHOOK_URL` | 09b-A | 同上 |
| `SENTRY_DSN` | 09b-A | 同上（DSN は半秘匿、URL ごと mask） |

### redaction 検証コマンド（Phase 9 / Phase 11 共通）

```bash
# 値の混入が無いことを確認（mask 表記のみ許可）
rg -nE "(AUTH_SECRET|GOOGLE_(PRIVATE_KEY|CLIENT_SECRET)|MAIL_PROVIDER_KEY|RESEND_API_KEY|SLACK_WEBHOOK_URL|SENTRY_DSN|CLOUDFLARE_API_TOKEN)\s*[:=]\s*[A-Za-z0-9_\-]{6,}" \
  docs/30-workflows/issue-353-09c-production-deploy-execution/outputs/phase-11/
# 期待: 0 hit（値が出るのは fail）

# wrangler 直書きが残っていないことを確認
rg -niw "wrangler\s+(d1|deploy|rollback|secret|whoami)" \
  docs/30-workflows/issue-353-09c-production-deploy-execution/
# 期待: 0 hit
```

### log 取得時の運用

- deploy log / migration log の取得は stdout/stderr リダイレクトで十分（cf.sh 自体が token を環境変数で扱うため値は流出しない）
- 万一 evidence に値が混入した場合は当該行を削除し、`outputs/phase-11/redaction-check.md` に記録する

## 5. 上流タスク evidence の citation 化

| 上流タスク | 期待 evidence | 本タスクの扱い |
| --- | --- | --- |
| 09a-A staging smoke green | `docs/30-workflows/09a-A-*/outputs/phase-11/smoke-*.md` | `upstream-green-evidence.md` から file path で citation のみ |
| 09b-A observability runtime | `docs/30-workflows/09b-A-*/outputs/phase-11/sentry-test.md` / `slack-test.md` / `logpush-test.md`（想定） | 同上 |
| 09b-B post-deploy smoke healthcheck | `docs/30-workflows/09b-B-*/outputs/phase-11/post-deploy-smoke-detection.md`（想定） | 同上 |

### citation 形式（テンプレ）

```md
## 09a-A staging smoke green

- evidence: docs/30-workflows/09a-A-*/outputs/phase-11/smoke-public.md
- 確認日時: <YYYY-MM-DDThh:mmZ>
- 状態: green / yellow / red
```

本タスクで evidence を再取得しない（DRY）。

## 6. 用語 audit 結果テンプレ

実行時に Phase 11 へ繰り越す。Phase 8 spec 段階では実行コマンドのみ確定する。

```bash
# 用語ゆれ
rg -niw "プロダクション|本番系|prod系|release番号|リリース番号" \
   docs/30-workflows/issue-353-09c-production-deploy-execution/
# 期待: 0 hit

# wrangler 直書き
rg -niw "wrangler\s+(d1|deploy|rollback|secret|whoami)" \
   docs/30-workflows/issue-353-09c-production-deploy-execution/
# 期待: 0 hit

# GAS 由来用語の混入
rg -niw "onFormSubmit|Apps Script trigger" \
   docs/30-workflows/issue-353-09c-production-deploy-execution/
# 期待: 0 hit（不変条件 #6: GAS prototype を本番に流さない）
```

実行結果: TBD at execution（Phase 9 で実行し PASS を判定する）。

## 7. 09c-A 固有の差分（共通化しないもの）

完了済み 09c serial と本タスク（09c-A）の差分は **execution gate のみ** であり、設計テンプレ（13 ステップ / 4 段階 D1 migration / 5 種 rollback）はそのまま継承する。本タスク固有の追加要素は次:

| 項目 | 09c-A 固有な理由 |
| --- | --- |
| Phase 10 / 11 / 13 の **3 段 user approval** | 09c serial は spec_created まで。実 mutation を伴う本タスクは 3 段 approval gate が必須 |
| `outputs/phase-11/user-approval-log.md` の集約形式 | 3 段の承認を 1 ファイルに section 単位で記録 |
| `upstream-green-evidence.md` | 09a-A / 09b-A / 09b-B の green を blocker check として citation |
| `redaction-check.md` の Phase 9 取得 | 09c serial は spec template 段階で値が出ない。本タスクは実 deploy 直前なので redaction を実行 |

## 8. Phase 9 への引き渡し

- evidence 命名規則表（17 step + pre-flight 4 種）
- Cloudflare CLI 経路（cf.sh 経由 5 操作カテゴリ）
- deploy 正規ルート（API / Web ともに `bash scripts/cf.sh deploy --config <wrangler.toml> --env production`、rollback も cf.sh 直）
- redaction 対象キー 8 種 + 検証コマンド 2 本
- 上流 citation テンプレ
- 用語 audit コマンド 3 本（Phase 9 で実行）
