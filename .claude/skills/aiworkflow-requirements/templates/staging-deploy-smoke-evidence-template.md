# Staging Deploy Smoke Evidence Template

> 本テンプレートは統合システム設計仕様書の一部です。
> 管理: .claude/skills/aiworkflow-requirements/
>
> **親ドキュメント**: [task-workflow-active.md](../references/task-workflow-active.md)
> **適用対象**: VISUAL_ON_EXECUTION 系の staging deploy smoke / runtime evidence task（例: 09a-A）

---

## 概要

staging Pages/Workers deploy smoke、Forms schema/responses sync 検証、staging D1 への migration apply、`/public/members` curl smoke、admin UI gate、wrangler tail redacted log、D1 schema parity 検証（staging vs production）の Phase 11 evidence を取得する手順テンプレ。

| 項目 | 値 |
|-----|-----|
| evidence root | `outputs/phase-11/evidence/` |
| visualEvidence 区分 | `VISUAL_ON_EXECUTION` |
| Phase 11 status | `pending_user_approval`（G1-G3 gate 通過後に `runtime_evidence_captured` へ昇格） |
| approval gate | G1 staging runtime deploy / G2 Forms sync / G3 D1 apply / G4 commit-push-PR |
| pending boundary | runtime mutation は user 承認後にのみ実施。spec contract complete を runtime PASS と同一視しない |

> **pending_user_approval gate 通過条件（共通）**: 各 section 末尾に gate 通過条件を明記する。1 つでも未充足なら Phase 11 status は `pending_user_approval` のまま据置。

---

## Section 1: Staging Pages / Workers Deploy Smoke Evidence

### コマンド

| 操作 | コマンド |
|-----|-----|
| Workers (api) staging deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` |
| Pages (web) staging deploy | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` |
| 認証確認 | `bash scripts/cf.sh whoami` |

### 取得 artifact

| 項目 | ファイル名規約 | 内容 |
|-----|-----|-----|
| api deploy log | `staging-deploy-api-<YYYYMMDD-HHMMSS>.log` | wrangler deploy stdout / VERSION_ID / route 一覧 |
| web deploy log | `staging-deploy-web-<YYYYMMDD-HHMMSS>.log` | OpenNext build + wrangler deploy stdout / route |
| whoami snapshot | `staging-whoami-<YYYYMMDD-HHMMSS>.log` | account id / email は redacted |

> ファイル名規約: `staging-deploy-<service>-<timestamp>.log`。`<service>` は `api` / `web` / `whoami` のいずれか。

### pending_user_approval gate 通過条件（G1）

- user による G1 approval が記録されている
- api / web 両方の deploy log が同一 wave で取得されている
- log 内に `Uploaded` / `Deployed` / VERSION_ID が含まれる
- secret 値（`CLOUDFLARE_API_TOKEN` / OAuth token）が log に出力されていない

---

## Section 2: 公開 / ログイン / profile / admin Visual Smoke Evidence

### 取得対象

| 画面 | 認証 | screenshot 命名 |
|-----|-----|-----|
| `/`（公開トップ） | unauthenticated | `staging-public-home-<YYYYMMDD-HHMMSS>.png` |
| `/members`（公開検索） | unauthenticated | `staging-public-members-<YYYYMMDD-HHMMSS>.png` |
| `/login`（magic link） | unauthenticated | `staging-public-login-<YYYYMMDD-HHMMSS>.png` |
| `/profile`（マイページ） | authenticated member | `staging-profile-<YYYYMMDD-HHMMSS>.png` |
| `/admin/dashboard`（admin） | authenticated admin | `staging-admin-dashboard-<YYYYMMDD-HHMMSS>.png` |
| `/admin/members`（admin） | authenticated admin | `staging-admin-members-<YYYYMMDD-HHMMSS>.png` |
| `/admin/tags`（admin） | authenticated admin | `staging-admin-tags-<YYYYMMDD-HHMMSS>.png` |
| `/admin/schema`（admin） | authenticated admin | `staging-admin-schema-<YYYYMMDD-HHMMSS>.png` |

### 命名規約

- screenshot: `staging-<surface>-<YYYYMMDD-HHMMSS>.png`
- `<surface>` は `public-home` / `public-members` / `public-login` / `profile` / `admin-dashboard` / `admin-members` / `admin-tags` / `admin-schema` のいずれか
- redaction: 個人情報（実 email / 実電話番号 / 実氏名）は最小限のみ表示し、不要な箇所はマスクする

### pending_user_approval gate 通過条件（G1 同伴）

- 8 surface の screenshot が同一 wave で揃っている
- ログイン / admin の認証は `manju.manju.03.28@gmail.com` (member) / `manjumoto.daishi@senpai-lab.com` (admin) で取得（test account）
- admin 直接 API 叩きが 403 になることを別途 curl で確認している
- screenshot 内に secret 値 / token が露出していない

---

## Section 3: Forms Schema / Responses Sync Validation Evidence

### コマンド

| 操作 | エンドポイント / コマンド |
|-----|-----|
| Forms schema sync | `POST /admin/sync/schema`（admin gated） |
| Forms responses sync | `POST /admin/sync/responses`（admin gated） |
| 取得対象 formId | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` |
| 取得対象 sectionCount | `6` |
| 取得対象 questionCount | `31` |

### 取得 artifact

| 項目 | ファイル名規約 |
|-----|-----|
| schema sync log | `staging-forms-schema-sync-<YYYYMMDD-HHMMSS>.log` |
| responses sync log | `staging-forms-responses-sync-<YYYYMMDD-HHMMSS>.log` |
| sync_jobs row snapshot | `staging-sync-jobs-<YYYYMMDD-HHMMSS>.json` |

### 検証項目

| 項目 | 期待値 |
|-----|-----|
| sync_jobs.status | `succeeded` |
| sync_jobs.error_count | `0` |
| schema diff items | 既知差分のみ。未知 stableKey は 0 件 |
| responses applied | 取得件数 ≤ Forms 実回答件数 |

### pending_user_approval gate 通過条件（G2）

- user による G2 approval が記録されている
- Google Form の `responseEmail` が system field として処理されている（フォーム項目化されていない）
- `publicConsent` / `rulesConsent` のキー名統一が維持されている
- admin-managed data と Forms schema 由来 data が混線していない

---

## Section 4: wrangler tail Redacted Log 取得手順

### コマンド

| 操作 | コマンド |
|-----|-----|
| api tail | `bash scripts/cf.sh wrangler tail --config apps/api/wrangler.toml --env staging --format json --once` |
| web tail | `bash scripts/cf.sh wrangler tail --config apps/web/wrangler.toml --env staging --format json --once` |

### 取得 artifact

| 項目 | ファイル名規約 |
|-----|-----|
| api tail log | `staging-tail-api-<YYYYMMDD-HHMMSS>.json` |
| web tail log | `staging-tail-web-<YYYYMMDD-HHMMSS>.json` |
| redaction script | `scripts/redact-tail.ts` 経由（個人情報 / token を `[REDACTED]` 化） |

### redaction 対象

| 項目 | 処置 |
|-----|-----|
| Authorization header | `[REDACTED]` |
| Cookie 値 | `[REDACTED]` |
| email like パターン | local-part を `[REDACTED]` 化、domain は保持 |
| Forms responseEmail | `[REDACTED]` |
| `CLOUDFLARE_API_TOKEN` / OAuth token | `[REDACTED]` |

### pending_user_approval gate 通過条件（G1 同伴）

- api / web 両方の tail log が取得されている
- redaction script を通した後の json のみが artifact 化される
- 5xx error が 0 件、4xx error が想定範囲内（admin 403 / not found のみ）

---

## Section 5: D1 Schema Parity 検証手順（staging vs production）

### コマンド（共通: `<env>` は `staging` / `production`）

| 操作 | コマンド |
|-----|-----|
| migration list | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-<env> --env <env>` |
| table 一覧 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-<env> --env <env> --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"` |
| index 一覧 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-<env> --env <env> --command "SELECT name, tbl_name FROM sqlite_master WHERE type='index' ORDER BY name;"` |
| table_info（テーブル毎） | `bash scripts/cf.sh d1 execute ubm-hyogo-db-<env> --env <env> --command "PRAGMA table_info('<table>');"` |
| d1_migrations | `bash scripts/cf.sh d1 execute ubm-hyogo-db-<env> --env <env> --command "SELECT id, name, applied_at FROM d1_migrations ORDER BY id;"` |

### 取得 artifact

| 項目 | ファイル名規約 |
|-----|-----|
| staging migration list | `staging-d1-migrations-list-<YYYYMMDD-HHMMSS>.json` |
| production migration list | `production-d1-migrations-list-<YYYYMMDD-HHMMSS>.json` |
| staging tables | `staging-d1-tables-<YYYYMMDD-HHMMSS>.json` |
| production tables | `production-d1-tables-<YYYYMMDD-HHMMSS>.json` |
| staging indexes | `staging-d1-indexes-<YYYYMMDD-HHMMSS>.json` |
| production indexes | `production-d1-indexes-<YYYYMMDD-HHMMSS>.json` |
| `PRAGMA table_info` snapshot | `staging-d1-pragma-<table>-<YYYYMMDD-HHMMSS>.json` / `production-d1-pragma-<table>-<YYYYMMDD-HHMMSS>.json` |
| parity diff report | `d1-parity-diff-<YYYYMMDD-HHMMSS>.md`（diff 0 を期待） |

### 主要 PRAGMA 対象テーブル

| テーブル | 取得理由 |
|-----|-----|
| `members` | 公開境界 / publish_state / public_consent column の存在 |
| `member_identities` | `response_email` UNIQUE 正本 |
| `member_responses` | 履歴行 / `response_email` UNIQUE 不在 |
| `audit_log` | spelling 単数形 / column constraint |
| `schema_aliases` | issue-359 整合 / aliasing column |
| `sync_jobs` | sync 実行状態 |
| `member_tags` | tag assignment 正本 |
| `tag_queue` | queue / dlq column |
| `d1_migrations` | applied / pending 数値の正本 |

### 検証項目

| 項目 | 期待値 |
|-----|-----|
| applied 件数（staging） | `production` ≥ `staging` または等しい（staging は production の先 / 後行を許容、ただし parity 差は 0 を目標） |
| pending 件数 | `0`（apply 完了後） |
| table 名差分 | `0` |
| index 名差分 | `0` |
| PRAGMA `name / type / notnull / dflt_value / pk` 差分 | 主要 9 テーブル全て `0` |

### pending_user_approval gate 通過条件（G3）

- user による G3 approval が記録されている
- staging への apply が `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` 経由で実行されている
- staging vs production の parity diff が `0`、または差分が known issue（issue-359 / issue-196 等）として明示された範囲のみ
- production D1 への apply は実施しない（09c production deploy execution の責務）

---

## Section 6: Phase 13 Commit / Push / PR Evidence（G4）

### コマンド

| 操作 | コマンド |
|-----|-----|
| status 確認 | `git status --porcelain` |
| diff 確認 | `git diff main...HEAD --name-only` |
| commit | `git commit -m "..."`（user 承認後） |
| push | `git push -u origin <branch>` |
| PR 作成 | `gh pr create --title "..." --body "$(cat <<'EOF' ... EOF)"` |

### 取得 artifact

| 項目 | ファイル名規約 |
|-----|-----|
| commit hash | Phase 12 implementation guide に記録 |
| PR URL | Phase 13 outputs/phase-13/main.md に記録 |

### pending_user_approval gate 通過条件（G4）

- user による G4 approval が記録されている
- G1-G3 全 gate が通過済み
- Phase 11 evidence が `outputs/phase-11/evidence/` に揃っている
- Phase 12 strict 7 files が parity 維持されている

---

## Cross-Section Boundary

| 項目 | 値 |
|-----|-----|
| spec contract complete と runtime PASS の関係 | **分離**。spec close-out 判定は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| 09c production deploy への影響 | 09a-A Phase 11 PASS まで 09c は **着手不可**（blocker propagation） |
| canonical-directory-restoration | 旧 `02-application-implementation/` path drift は `legacy-ordinal-family-register.md` Task Root Path Drift Register に登録 |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|-----|
| [task-workflow-active.md](../references/task-workflow-active.md) | wave registry |
| [legacy-ordinal-family-register.md](../references/legacy-ordinal-family-register.md) | path drift register |
| [workflow-task-09a-A-staging-deploy-smoke-execution-artifact-inventory.md](../references/workflow-task-09a-A-staging-deploy-smoke-execution-artifact-inventory.md) | artifact inventory |
| [lessons-learned/2026-05-05-09a-A-staging-deploy-smoke-execution-spec.md](../lessons-learned/2026-05-05-09a-A-staging-deploy-smoke-execution-spec.md) | 教訓 L-09AA-001..005 |

---

## 変更履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-05-05 | 初版作成（09a-A staging deploy smoke execution Phase 11 evidence template） |
