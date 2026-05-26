# Phase 2: 設計

## 目的

topology / SubAgent lane / validation path を設計する。既存コンポーネント再利用可否（FB-SDK-07-1）を最優先で判定する。

## 既存コンポーネント再利用可否（FB-SDK-07-1）

| 再利用候補                          | 可否 | 適用                                                              |
| ----------------------------------- | ---- | ---------------------------------------------------------------- |
| `admin-runtime-smoke` job (staging) | ✅ 高 | mint step / verify secrets / mask / redaction grep gate / artifact upload / Slack 通知をそのまま踏襲 |
| `runtime-admin-web.sh` の関数群     | ✅ 高 | `assert_target` / `start_tail` / `probe_admin` / `collect_tail` は env-aware 引数化のみで再利用可 |
| `mint-staging-session-cookie.mts` の `mintStagingSessionCookie` 純粋関数 | ✅ 高 | `signSessionJwt` mint 手法そのまま流用。`main()` の env 取得部のみ prefix 切替 |
| `redact.sh` / `ci-summary-post.sh`  | ✅ 高 | そのまま再利用                                                   |

→ 新規 primitive を**追加しない**。`extend` モードで env-aware 一般化のみ。

## topology（状態所有権）

```
web-cd.yml (Facade / CI orchestration)
  ├─ deploy-staging (既存 job)
  ├─ admin-runtime-smoke (既存 job, needs: deploy-staging, if: github.ref_name == 'dev')
  ├─ deploy-production (既存 job)
  └─ admin-runtime-smoke-production (NEW job, needs: deploy-production, if: github.ref_name == 'main')
        ├─ setup-project
        ├─ check gate prerequisites (PRODUCTION_AUTH_SECRET 未設定なら skip)
        ├─ mint admin session cookie  ── scripts/smoke/mint-staging-session-cookie.mts production
        ├─ run web smoke              ── scripts/smoke/runtime-admin-web.sh production
        │      └─ cf.sh tail          ── scripts/cf.sh (既存)
        ├─ redaction grep gate
        ├─ upload evidence artifact
        └─ post failure summary to Slack
```

| 部品 | 状態所有権 | 責務 |
| ---- | ---------- | ---- |
| `web-cd.yml admin-runtime-smoke-production` | CI 実行状態 | `main` push 時のみ発火・production secret 注入・evidence 集約 |
| `runtime-admin-web.sh` | probe 結果 | env 引数で host / worker / target allowlist を切替 |
| `mint-staging-session-cookie.mts` | session cookie 値 | env 引数で `STAGING_*` / `PRODUCTION_*` env 群を切替 |
| GitHub Environment `production-runtime-smoke` | production secret | `PRODUCTION_AUTH_SECRET` / `PRODUCTION_ADMIN_MEMBER_ID` / `PRODUCTION_ADMIN_EMAIL` / `PRODUCTION_WEB_BASE` を保持 |

## env-aware 一般化の設計

### `scripts/smoke/runtime-admin-web.sh`

| 観点 | 現状（staging hard-code） | 一般化後 |
| ---- | ------------------------ | -------- |
| env 引数 | `staging` 固定（他は exit 2） | `staging` または `production` を受理 |
| host env var | `STAGING_WEB_BASE` 直参照 | env=staging → `STAGING_WEB_BASE`、env=production → `PRODUCTION_WEB_BASE` |
| target allowlist regex | `staging\|127.0.0.1\|localhost` | env=staging → `staging\|127.0.0.1\|localhost`、env=production → `^https://[a-z0-9.-]+\.workers\.dev$` または production domain allowlist |
| worker name 既定 | `ubm-hyogo-web-staging` | env=staging → `ubm-hyogo-web-staging`、env=production → `ubm-hyogo-web-production` |
| cookie env var | `STAGING_ADMIN_SESSION_COOKIE` | env=staging → 同上、env=production → `PRODUCTION_ADMIN_SESSION_COOKIE`（または共通 `ADMIN_SESSION_COOKIE`）|
| cf.sh tail `--env` 引数 | `--env staging` | env 引数を pass-through |

設計方針: shell 関数 `resolve_env_vars()` を冒頭に追加し、env 引数から host / worker / cookie env 名 / target allowlist を解決する。それ以降の `assert_target` / `start_tail` / `probe_admin` / `collect_tail` の構造は staging gate と完全同一。

### `scripts/smoke/mint-staging-session-cookie.mts`

| 観点 | 現状（staging hard-code） | 一般化後 |
| ---- | ------------------------ | -------- |
| env prefix | `STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` 直参照 | CLI 引数 `staging\|production` で prefix 切替（引数なしは staging） |
| 純粋関数 | `mintStagingSessionCookie(input)` | 変更なし（env 取得は `main()` 側に限定） |
| GITHUB_OUTPUT 出力 key | `admin_session_cookie` | 変更なし |
| 必須 env 欠落時の exit code | `process.exit(2)` | 変更なし |

設計方針: `main()` 冒頭で CLI 引数（未指定時 `"staging"`）を読み、 prefix を決定する純粋関数 `resolveEnvPrefix(env)` を追加。それ以降の `signSessionJwt` 呼び出しと `appendFileSync(GITHUB_OUTPUT, ...)` は staging gate と完全同一。

## production GitHub Environment 設計

| 項目 | 値 |
| ---- | -- |
| Environment 名 | `production-runtime-smoke` |
| 保持する secret | `PRODUCTION_AUTH_SECRET`, `PRODUCTION_ADMIN_MEMBER_ID`, `PRODUCTION_ADMIN_EMAIL`, `PRODUCTION_WEB_BASE`, `CLOUDFLARE_API_TOKEN`, `SLACK_WEBHOOK_INCIDENT` |
| protection rules | required reviewers なし（solo 運用）。wait timer なし |
| branch policy | `main` のみ deploy 許可 |

> Environment 作成 / secret 投入は user-gated（Phase 13 後）。本 wave では設計のみ記録。

## main required status check 追加準備

| Check name | 追加先 | タイミング |
| ---------- | ------ | ---------- |
| `admin runtime smoke production / smoke` | `main` branch protection の `required_status_checks.contexts` | user 明示承認後 |

> read-only before JSON は `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` で事前 evidence 取得可能。
> 実 PUT は user 明示承認後。

## validation path

| レイヤ | 検証 |
| ------ | ---- |
| 静的 | `pnpm typecheck`（mint helper TS）/ `pnpm lint` / `shellcheck`（runner） |
| 単体 | `runtime-admin-web.test.sh`（production env 分岐）/ `mint-staging-session-cookie.spec.ts`（PRODUCTION_* env prefix）|
| 統合（user-gated） | production deploy 後の web-cd `admin-runtime-smoke-production` job 実走 = Gate-B |
| regression（user-gated, 1 回限り）| 意図的 throw を一時 deploy し、本 gate fail evidence を取得 = AC-5 |

## 因果ループ

- 強化ループ: production gate 追加 → main deploy ごとに render regression 即検出 → 早期 hotfix → 本番 admin 可用性維持 → 信頼性向上。
- バランスループ: production secret leak surface ↑ → GitHub Environment 隔離 + step-scoped env + redaction で抑制。

## 完了判定

- [x] 再利用可否を確定（新規 primitive ゼロ）
- [x] env-aware 一般化の責務境界を runner / mint / job で分離
- [x] production Environment + main required status check の準備手順を仕様化
