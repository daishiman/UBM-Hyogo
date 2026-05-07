# Phase 11 Output: 手動 smoke / 実測 evidence — 09c-A-production-deploy-execution

[実装区分: 実装仕様書（runbook execution + evidence collection）]

> **判定行**: `PENDING_IMPLEMENTATION_FOLLOW_UP`（spec_created 段階 / 実測 evidence 未取得 / `visualEvidence: VISUAL_ON_EXECUTION`）
>
> 本仕様書作成タスクの段階では、本ファイルは **実測 evidence の保存先・形式・取得タイミング・redaction ルールを宣言する manifest** として閉じる。実 production deploy / smoke / 24h verification は user approval 取得後の execution operation で行い、実値は同一パスへ上書きする。placeholder と実測の境界は本ファイル § 0 / § 8 で明示する。

## 0. placeholder vs 実測 evidence の境界（VISUAL_ON_EXECUTION 運用）

| 状態 | 本ファイル冒頭判定行 | placeholder 配置 | 実値の取得タイミング |
| --- | --- | --- | --- |
| spec_created（本タスク完了時点） | `PENDING_IMPLEMENTATION_FOLLOW_UP` | `outputs/phase-11/` 配下に skeleton を実体配置（本 PR で配置） | 実 production execution operation（本タスク外） |
| user_approval_pending | `blocked_until_user_approval` | placeholder 維持 | 当該 mutation の user approval 取得後 |
| executed_pass / executed_fail | `EXECUTED_PASS` または `EXECUTED_FAIL` | 同一パスを実値で上書き（git diff で追跡） | execution 時刻 |

placeholder ファイルを「実証跡」として扱うことを禁止する（false green 防止）。Phase 12 compliance check では本境界を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` で表現する。

## 1. Evidence Manifest（完全列挙）

`outputs/phase-11/` 配下のフラット構造に screenshots サブディレクトリを 2 つ加える。

### 1.1 NON_VISUAL evidence（13 ファイル）

| # | ファイル | 必須 / 任意 | 取得タイミング | 形式 | 内容 |
| --- | --- | --- | --- | --- | --- |
| N1 | `main.md` | 必須 | spec_created | Markdown | 本ファイル（manifest + 境界宣言） |
| N2 | `user-approval-log.md` | 必須 | Phase 10 / 11 / 13 各承認時 | Markdown | 4 mutation 単位（apply / api deploy / web deploy / tag push）+ Phase 10 / 13 承認 |
| N3 | `upstream-green-evidence.md` | 必須 | execution 着手時 | Markdown | 09a-A / 09b-A / 09b-B の outputs/phase-11 への citation（path + commit hash） |
| N4 | `main-merge-commit.txt` | 必須 | step 2 完了時 | プレーンテキスト | `git rev-parse origin/main` 結果 + dev→main PR URL |
| N5 | `cf-whoami.txt` | 必須 | step 3 完了時 | プレーンテキスト | `bash scripts/cf.sh whoami` 出力（account ID は mask） |
| N6 | `d1-backup-<YYYYMMDD-HHMM>.sql` または `d1-backup-<YYYYMMDD-HHMM>.meta.json` | 必須 | step 4 完了時 | SQL or JSON meta | `d1 export` 本体（容量大時は size / sha256 のみ meta 化） |
| N7 | `d1-migrations-list-before.txt` | 必須 | step 5 完了時 | プレーンテキスト | apply 前 `d1 migrations list` |
| N8 | `d1-migrations-apply.txt` | 必須 | step 7 完了時 | プレーンテキスト | `d1 migrations apply` の stdout/stderr |
| N9 | `d1-migrations-list-after.txt` | 必須 | step 8 完了時 | プレーンテキスト | apply 後 `d1 migrations list`（N7 との差分で Applied 件数増減を確認） |
| N10 | `api-deploy.log` | 必須 | step 10 完了時 | プレーンテキスト | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` 全文 + version id |
| N11 | `web-deploy.log` | 必須 | step 12 完了時 | プレーンテキスト | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` 後の `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` 全文 + version id |
| N12 | `release-tag.txt` | 必須 | State S14 完了時 | プレーンテキスト | tag 名 / commit / `git ls-remote --tags origin` 結果 |
| N13 | `invariants.md` | 必須 | step 16 完了時 | Markdown | 不変条件 #5 / #6 / #14 検証結果（web bundle inspection / `/profile` 編集不可確認 / metrics threshold） |

### 1.2 smoke 詳細ログ（3 ファイル）

| ファイル | 内容 |
| --- | --- |
| `smoke-public.md` | public 4 画面 + 1 redirect の HTTP status / authz / VISUAL ref |
| `smoke-member.md` | member 3 画面の HTTP status / authz / VISUAL ref |
| `smoke-admin.md` | admin 4 画面 + 認可 leak 3 ケース（未ログイン / 一般 / admin）の HTTP status / VISUAL ref |

### 1.3 VISUAL evidence: smoke screenshot 群（`smoke-screenshots/` サブディレクトリ）

命名規約: `<area>-<screen>-<profile>-<YYYYMMDD-HHMM>.png`。`<profile>` は `desktop`（1280x800）/ `mobile`（375x812）。

#### 1.3.1 public 画面（4 画面 × 2 profile = 8 枚）

| screenshot ファイル名 | 取得対象画面 | URL（template） | 確認ポイント |
| --- | --- | --- | --- |
| `public-home-desktop-<ts>.png` / `public-home-mobile-<ts>.png` | landing | `${PRODUCTION_WEB}/` | landing copy / nav / consent badge |
| `public-member-list-desktop-<ts>.png` / `public-member-list-mobile-<ts>.png` | 公開ディレクトリ | `${PRODUCTION_WEB}/members` | publicConsent=consented のみ表示、isDeleted ゼロ |
| `public-terms-desktop-<ts>.png` / `public-terms-mobile-<ts>.png` | 利用規約 | `${PRODUCTION_WEB}/terms` | rulesConsent 文面 / consent 経路明示 |
| `public-privacy-desktop-<ts>.png` / `public-privacy-mobile-<ts>.png` | プライバシーポリシー | `${PRODUCTION_WEB}/privacy` | publicConsent 文面 / 連絡先 |

#### 1.3.2 member 画面（3 画面 × 2 profile = 6 枚）

| screenshot ファイル名 | 取得対象画面 | URL（template） | 確認ポイント |
| --- | --- | --- | --- |
| `member-mypage-desktop-<ts>.png` / `member-mypage-mobile-<ts>.png` | mypage | `${PRODUCTION_WEB}/mypage` | logged-in 状態 / consent badge / 自分の status |
| `member-profile-desktop-<ts>.png` / `member-profile-mobile-<ts>.png` | profile | `${PRODUCTION_WEB}/profile` | **編集 form 不在**（不変条件 #4 / #5）/ `editResponseUrl` への外部リンクボタン |
| `member-attendance-desktop-<ts>.png` / `member-attendance-mobile-<ts>.png` | 出席履歴 | `${PRODUCTION_WEB}/mypage/attendances` | 自身の attendance 一覧（重複 0 / soft-delete 除外） |

#### 1.3.3 admin 画面（4 画面 × 2 profile + 認可 leak 1 = 9 枚）

| screenshot ファイル名 | 取得対象画面 | URL（template） | 確認ポイント |
| --- | --- | --- | --- |
| `admin-dashboard-desktop-<ts>.png` / `admin-dashboard-mobile-<ts>.png` | dashboard | `${PRODUCTION_WEB}/admin` | KPI / sync status / cron 直近 |
| `admin-members-desktop-<ts>.png` / `admin-members-mobile-<ts>.png` | members | `${PRODUCTION_WEB}/admin/members` | drawer / status badge / **編集 form 不在**（不変条件 #11） |
| `admin-queue-desktop-<ts>.png` / `admin-queue-mobile-<ts>.png` | tag queue | `${PRODUCTION_WEB}/admin/tags` | candidate → confirm 操作（不変条件 #13） |
| `admin-tags-desktop-<ts>.png` / `admin-tags-mobile-<ts>.png` | tag list | `${PRODUCTION_WEB}/admin/tags/list` | tag 一覧 / 削除済み除外 |
| `admin-403-desktop-<ts>.png` | 一般 user で `/admin` を叩いた認可 leak テスト | `${PRODUCTION_WEB}/admin` | 403 または `/login` redirect（不変条件 #5） |

#### 1.3.4 ステータスバッジ・認証状態の表示確認

各 screenshot 撮影時に次を **同時に枠内に収める**:

- **public**: header の「ログイン」リンクが表示されている / consent badge は表示されない
- **member**: header に user 名 / consent badge（`publicConsent` / `rulesConsent` の現状態）
- **admin**: header に admin role badge

screenshot 合計: 8（public）+ 6（member）+ 9（admin）= **23 枚**

### 1.4 VISUAL evidence: 24h metrics screenshot 群（`24h-metrics-screenshots/` サブディレクトリ）

| screenshot ファイル名 | 取得対象 | 取得タイミング |
| --- | --- | --- |
| `workers-requests-T0-<ts>.png` | Cloudflare Workers Analytics（req / errors） | T+0（deploy 直後） |
| `workers-requests-T1h-<ts>.png` | 同上 | T+1h |
| `workers-requests-T6h-<ts>.png` | 同上 | T+6h |
| `workers-requests-T24h-<ts>.png` | 同上 | T+24h |
| `d1-rows-T0-<ts>.png` | Cloudflare D1 metrics（reads / writes / rows） | T+0 |
| `d1-rows-T24h-<ts>.png` | 同上 | T+24h |
| `sync-jobs-T0-<ts>.png` | `sync_jobs` SELECT 結果（terminal capture） | T+0 |
| `sync-jobs-T24h-<ts>.png` | 同上 | T+24h |

screenshot 合計: **8 枚**

### 1.5 24h verification まとめ（1 ファイル）

| ファイル | 内容 |
| --- | --- |
| `24h-verification-summary.md` | 全 metrics の 24h 値、不変条件 #14（free-tier 閾値）の判定、attendance 重複 SQL 結果、不変条件 #5 / #6 再確認結果 |

### 1.6 サマリ

- NON_VISUAL evidence: 13 + 3（smoke 詳細）+ 1（24h summary）= **17 ファイル**
- VISUAL screenshot: 23 + 8 = **31 枚**
- サブディレクトリ: `smoke-screenshots/` / `24h-metrics-screenshots/`

## 2. Evidence 取得コマンド例（`bash scripts/cf.sh` 経由のみ）

すべてのコマンドは `mise exec --` 経由で Node 24 / pnpm 10 を保証する。`wrangler` 直接実行は禁止。

### 2.1 read-only（approval 不要）

```bash
# identity 確認
bash scripts/cf.sh whoami | redact_evidence | tee outputs/phase-11/cf-whoami.txt

# D1 backup（apply 前必須）
TS="$(date -u +%Y%m%d-%H%M)"
bash scripts/cf.sh d1 export ubm-hyogo-db-prod \
  --remote --env production \
  --config apps/api/wrangler.toml \
  --output "outputs/phase-11/d1-backup-${TS}.sql"

# D1 migration list（apply 前）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod \
  --remote --env production \
  --config apps/api/wrangler.toml \
  | redact_evidence | tee outputs/phase-11/d1-migrations-list-before.txt

# 24h verification: sync_jobs SELECT
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod \
  --remote --env production \
  --config apps/api/wrangler.toml \
  --command "SELECT status, COUNT(*) AS c FROM sync_jobs GROUP BY status"

# 24h verification: attendance 重複検出（不変条件 #15）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod \
  --remote --env production \
  --config apps/api/wrangler.toml \
  --command "SELECT session_id, member_id, COUNT(*) c FROM attendances WHERE deleted_at IS NULL GROUP BY session_id, member_id HAVING c > 1"
```

### 2.2 mutation（**Phase 11 user approval 必須**）

```bash
# D1 migration apply（user approval ログを user-approval-log.md に記録してから実行）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod \
  --remote --env production \
  --config apps/api/wrangler.toml \
  2>&1 | redact_evidence | tee outputs/phase-11/d1-migrations-apply.txt

# api deploy（user approval 必須）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production \
  2>&1 | redact_evidence | tee outputs/phase-11/api-deploy.log

# web OpenNext build（deploy の必須前提。.open-next/worker.js / .open-next/assets/ を生成）
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare \
  2>&1 | tee outputs/phase-11/web-build.log

# web deploy（user approval 必須）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production \
  2>&1 | redact_evidence | tee outputs/phase-11/web-deploy.log

# release tag（user approval 必須）
RELEASE_TAG="v$(date -u +%Y%m%d-%H%M)"
git tag -a "$RELEASE_TAG" -m "Production release $RELEASE_TAG"
git push origin "$RELEASE_TAG"
{
  echo "RELEASE_TAG=$RELEASE_TAG"
  git rev-parse HEAD
  git ls-remote --tags origin | grep "$RELEASE_TAG"
} | tee outputs/phase-11/release-tag.txt
```

### 2.3 rollback（**Phase 11 user approval 必須 / 緊急時のみ**）

```bash
# api rollback
bash scripts/cf.sh rollback <PREV_VERSION_ID> \
  --config apps/api/wrangler.toml --env production

# web rollback（apps/web から D1 直接操作する rollback は不変条件 #6 違反のため禁止）
bash scripts/cf.sh rollback <PREV_VERSION_ID> \
  --config apps/web/wrangler.toml --env production
```

## 3. Redaction ルール（secret / PII の mask 規約）

| 対象 | mask 後の表記 | 例 |
| --- | --- | --- |
| Cloudflare API token / OAuth token | `<REDACTED:CF_TOKEN>` | log 中の `Authorization: Bearer ...` を一律置換 |
| account id / database id / version id（後半） | 先頭 8 文字 + `…<REDACTED>` | `a1b2c3d4…<REDACTED>` |
| user email | `<local>@<domain>` の local 部を 2 文字で打ち切り | `ma****@gmail.com` |
| session cookie / auth.js token | 名前のみ残し値は `<REDACTED:SESSION>` | `__Secure-authjs.session-token=<REDACTED:SESSION>` |
| Slack webhook URL / Sentry DSN | `<REDACTED:WEBHOOK_URL>` / `<REDACTED:SENTRY_DSN>` | log および evidence template に直書きしない |

実装ルール:

- evidence ファイルへ書き込む前に redaction を必ず適用する（`tee` の前に sed パイプで mask する手順を `outputs/phase-11/redaction-script.md` に記録する。本タスクでは手順テンプレのみで十分、実 mask 適用は execution 時）
- placeholder ファイルには **mask 後の例文のみ**を記載し、実値テンプレを残さない
- `.env` の中身を `cat` / `Read` / `grep` で表示しない（CLAUDE.md ルール）

## 4. 24h verification 取得タイミングテーブル

| タイミング | 取得項目 | evidence path |
| --- | --- | --- |
| T+0（deploy 直後） | Workers req / errors screenshot / D1 reads / writes screenshot / sync_jobs SELECT 結果 | `24h-metrics-screenshots/workers-requests-T0-*.png` / `d1-rows-T0-*.png` / `sync-jobs-T0-*.png` |
| T+1h | Workers req / errors screenshot（短期 spike 確認） | `24h-metrics-screenshots/workers-requests-T1h-*.png` |
| T+6h | Workers req / errors screenshot（中期トレンド確認） | `24h-metrics-screenshots/workers-requests-T6h-*.png` |
| T+24h | Workers / D1 metrics 最終 / sync_jobs 再取得 / attendance 重複 SQL（#15）/ web bundle inspection 再実行（#6）/ 24h-verification-summary.md 完成 | `24h-metrics-screenshots/*-T24h-*.png` / `24h-verification-summary.md` |

不変条件 #14（free-tier 上限）の閾値:

| metric | 1 日上限 | T+24h で許容する値 |
| --- | --- | --- |
| Workers requests | 100k | 5k 以下を妥当 / 50k 以上は警戒 |
| D1 reads | 5M | 500k 以下（10%）を妥当 |
| D1 writes | 100k | 10k 以下（10%）を妥当 |

閾値超過時は § 6 incident handoff へ遷移。

## 5. User approval ログ（`user-approval-log.md` placeholder セクション構成）

```markdown
# user-approval-log

## Phase 10 approval（最終レビュー GO 判定）
- 承認日時:
- 承認者:
- 状態: blocked_until_user_approval / approved / rejected

## Phase 11-A: D1 migration apply 承認（step 6）
- 対象: ubm-hyogo-db-prod
- 影響: migration 単位で永続（rollback は forward migration）
- 承認日時:
- 状態: blocked_until_user_approval / approved / rejected

## Phase 11-B: api production deploy 承認（step 8）
- 対象: ubm-hyogo-api
- 影響: 取り消し不可（rollback は version id 指定）
- 承認日時:
- 状態: blocked_until_user_approval / approved / rejected

## Phase 11-C: web production deploy 承認（step 9）
- 対象: ubm-hyogo-web
- 影響: 取り消し不可（rollback は version id 指定）
- 承認日時:
- 状態: blocked_until_user_approval / approved / rejected

## Phase 11-D: release tag push 承認（step 10）
- 対象: vYYYYMMDD-HHMM
- 影響: immutable
- 承認日時:
- 状態: blocked_until_user_approval / approved / rejected

## Phase 13 approval（dev → main 昇格 PR）
- 承認日時:
- 状態: blocked_until_user_approval / approved / rejected
```

## 6. 異常時の incident runbook（09b）への ハンドオフ手順

| 異常パターン | 一次対応 | escalation 先 | runbook |
| --- | --- | --- | --- |
| smoke で 5xx | 直近 step の rollback（user approval 必須） | 09b incident-response-runbook.md | `docs/30-workflows/completed-tasks/09b-*/outputs/phase-12/incident-response-runbook.md` |
| smoke で authz violation（不変条件 #5） | 即時 web rollback | 09b（同上） | 同上 |
| web bundle に `D1Database` 直参照（不変条件 #6） | release tag 取り消し検討 + 修正 PR | 09b（同上） | 同上 |
| free-tier 閾値超過（不変条件 #14） | cron 頻度低下 / spike 原因調査 | 09b-A observability runbook | `.claude/skills/aiworkflow-requirements/references/observability-*.md` |
| migration apply 部分失敗 | forward migration で修復、破壊的 SQL 禁止 | 09b（同上） | 同上 |
| Cloudflare 全停止 | rollback 不能。Cloudflare status 確認 | 09b（同上） | 同上 |

通知経路:

- Sentry / Slack（09b-A 経由 / runtime observability 疎通済み前提）
- 共有先 placeholder: `share-evidence.md`（実値は別管理 / CLAUDE.md ポリシー）

## 7. AC × evidence path 対応（Phase 1 § 3 と整合）

| AC | evidence file（本ファイル § 1 参照） |
| --- | --- |
| AC-1 user approval | N2 `user-approval-log.md` |
| AC-2 D1 migration Applied | N6 + N7 + N8 + N9 |
| AC-3 api/web deploy exit 0 | N10 + N11 |
| AC-4 production smoke green | `smoke-public.md` / `smoke-member.md` / `smoke-admin.md` + smoke-screenshots/ 配下 23 枚 |
| AC-5 release tag + 24h verification | N12 + `24h-verification-summary.md` + 24h-metrics-screenshots/ 配下 8 枚 |

## 8. spec_created 時点の placeholder 取扱い

本仕様書作成タスクの完了条件は、**実値ではなく構造の確定**にある。後続 follow-up が touch する evidence path を欠落なく宣言した。実 production execution operation で同一パスへ実値を書き込み、本ファイルの判定行を `EXECUTED_PASS` または `EXECUTED_FAIL` に書き換える。

placeholder 配置ルール:

- 各 placeholder ファイルの冒頭に `PENDING_RUNTIME_EVIDENCE` / `blocked_until_user_approval` / `TEMPLATE_ONLY` のいずれかの判定行を必ず置く
- screenshot は spec_created 段階では実体配置しない（false green 防止 / placeholder PNG 禁止）
- placeholder ファイルが必要な evidence: N2〜N13、smoke 3 ファイル、`24h-verification-summary.md`、`redaction-script.md`、screenshot ディレクトリ README は skeleton として実体配置する
- SQL dump 本体と PNG screenshot は execution 時に生成される性質のため spec_created では配置しない
- 本仕様書 PR がマージされた時点では placeholder evidence は runtime pending として存在し、実 production execution operation で同一パスへ実値を書き込む
