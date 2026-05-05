# Phase 5: 実装ランブック — 09a-A-staging-deploy-smoke-execution

[実装区分: 実装仕様書]

判定根拠: Phase 4 で定義した 20 テスト項目を実 staging 環境で順次実行するための、コピペ可能なステップバイステップ手順を定義する。実行は Cloudflare Workers / D1 / Forms quota への副作用を伴うため、docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09a-A-staging-deploy-smoke-execution |
| phase | 5 / 13 |
| wave | 9a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 11 実測オペレーターが本ファイルだけを上から順に実行すれば 13 evidence が漏れなく取得できる runbook を提供する。各ステップに (a) コマンド、(b) 期待出力、(c) 失敗時の戻し方、(d) Phase 6 異常系への分岐条件、(e) approval gate を併記する。

## 前提

- 作業端末で `mise install` 完了済み（Node 24.15.0 / pnpm 10.33.2）
- 1Password CLI (`op`) サインイン済み
- 本タスクの worktree 内で実行（`pwd` が `.worktrees/...09a-A...`）
- `EVID=docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence` を環境変数として設定して以降使用

```bash
export EVID=docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence
export API_STAGING_URL='<staging api URL を Phase 11 開始時に確定>'
export WEB_STAGING_URL='<staging web URL を Phase 11 開始時に確定>'
```

## ステップバイステップ実行手順

### Step 0: 前提確認

```bash
# 上流タスク完了確認
gh pr list --state merged --search "08a in:title" --limit 5
gh pr list --state merged --search "08a-B in:title" --limit 5
gh pr list --state merged --search "08b in:title" --limit 5

# Cloudflare 認証
bash scripts/cf.sh whoami
```

期待: `whoami` 出力に account_id とトークン scope に Workers/D1/Pages 編集権限が含まれる。
失敗時: 1Password の `CLOUDFLARE_API_TOKEN` 項目を確認、`.env` の op:// 参照を検証。値は記録しない。
分岐: scope 不足なら Phase 6 シナリオ S08（secret/scope 不備）へ。

### Step 1: evidence ディレクトリ準備

```bash
mkdir -p "$EVID"/{deploy,curl,screenshots,playwright,forms,d1,wrangler-tail}
ls -la "$EVID"
```

期待: 7 サブディレクトリが空で存在。
失敗時: 権限を確認、worktree 内で実行しているか確認。

### Step 2: 旧 version ID の控え（rollback 準備）

```bash
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging \
  | tee "$EVID/deploy/api-deployments-before.log"
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env staging \
  | tee "$EVID/deploy/web-deployments-before.log"
```

期待: 直近 deployments の version_id が一覧表示される。先頭 ID が rollback 候補。
失敗時: deployments コマンド未対応なら `wrangler versions list` 系で代替し log に明記。

### Step 3: G1 user approval → api/web deploy

> **G1 ゲート**: 以下の 2 コマンド実行直前に user 承認を取得する。Claude Code は実行前に「次に staging への deploy を行う。version ID は Step 2 で記録済み。承認ください」と提示して停止。

```bash
# api
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging \
  | tee "$EVID/deploy/deploy-api-staging.log"
# web
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging \
  | tee "$EVID/deploy/deploy-web-staging.log"

# version_id 抽出
grep -E 'Current Version ID|Deployed' "$EVID/deploy/deploy-api-staging.log" \
  | tee "$EVID/deploy/api-version-id.txt"
grep -E 'Current Version ID|Deployed' "$EVID/deploy/deploy-web-staging.log" \
  | tee "$EVID/deploy/web-version-id.txt"
```

期待: 両方とも exit 0、`Deployed` 行と version_id を含む。
失敗時の戻し方:
```bash
bash scripts/cf.sh rollback <Step2 で控えた旧 version_id> \
  --config apps/api/wrangler.toml --env staging
# web も同様
```
分岐: build error / binding 不整合 → Phase 6 シナリオ S01（deploy 失敗）。

### Step 4: G2 user approval → D1 migration list / apply

```bash
# pending 確認
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging \
  | tee "$EVID/d1/d1-migrations-list.txt"
```

> **G2 ゲート**: pending 行（`[ ]`）が 1 件以上ある場合のみ user 承認を取得して以下を実行。pending=0 なら apply スキップで Step 5 へ。

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging \
  | tee -a "$EVID/d1/d1-migrations-list.txt"
# apply 後の再 list
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging \
  | tee "$EVID/d1/d1-migrations-list-after.txt"
```

期待: apply 後 pending=0。
失敗時の戻し方: D1 には migration rollback CLI がないため、Step 0 直前に `bash scripts/cf.sh d1 export ubm-hyogo-db-staging --env staging --output backup-pre-apply.sql` で backup を取り、復旧は `unassigned-task/` 起票で扱う。
分岐: apply 失敗 → Phase 6 シナリオ S04（D1 pending migration）。

### Step 5: D1 schema parity（read-only、staging vs production）

```bash
TABLES=(member_responses member_identities member_status deleted_members \
        sync_jobs audit_log magic_tokens tag_assignment_queue \
        meeting_sessions member_attendance admin_member_notes)
mkdir -p /tmp/parity
for t in "${TABLES[@]}"; do
  bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json \
    --command "PRAGMA table_info($t)" > /tmp/parity/staging-$t.json
  bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --json \
    --command "PRAGMA table_info($t)" > /tmp/parity/prod-$t.json
done

# 集約スクリプト（inline node で diff JSON 生成）
node -e '
const fs=require("fs"),path=require("path");
const tables=process.argv[1].split(",");
const out={generatedAt:new Date().toISOString(),
  stagingDatabase:"ubm-hyogo-db-staging",
  productionDatabase:"ubm-hyogo-db-prod",tables:[]};
let diffCount=0;
for(const t of tables){
  const s=JSON.parse(fs.readFileSync(`/tmp/parity/staging-${t}.json`,"utf8"));
  const p=JSON.parse(fs.readFileSync(`/tmp/parity/prod-${t}.json`,"utf8"));
  const sc=(s[0]?.results)||[],pc=(p[0]?.results)||[];
  const sNames=new Set(sc.map(c=>c.name)),pNames=new Set(pc.map(c=>c.name));
  const missingInStaging=[...pNames].filter(n=>!sNames.has(n));
  const missingInProduction=[...sNames].filter(n=>!pNames.has(n));
  const typeMismatch=sc.filter(c=>{const pp=pc.find(x=>x.name===c.name);return pp&&pp.type!==c.type;}).map(c=>c.name);
  if(missingInStaging.length||missingInProduction.length||typeMismatch.length) diffCount++;
  out.tables.push({name:t,stagingColumns:sc,productionColumns:pc,
    diff:{missingInStaging,missingInProduction,typeMismatch}});
}
out.summary={diffCount,productionMigrationTodo:diffCount>0?
  "docs/30-workflows/unassigned-task/task-09a-d1-schema-parity-followup-001.md":null};
console.log(JSON.stringify(out,null,2));
' "$(IFS=,; echo "${TABLES[*]}")" | tee "$EVID/d1/d1-schema-parity.json"
```

期待: `summary.diffCount = 0`。
失敗時: production 側 read 権限不足なら `cf.sh whoami` の scope を再確認。
分岐: `diffCount > 0` → Phase 6 シナリオ S05（D1 schema drift） + unassigned-task 起票。

### Step 6: curl smoke 9 種

```bash
# health
curl -sSi --max-time 10 "$API_STAGING_URL/health" \
  | tee "$EVID/curl/curl-public-health.log"

# /public/members base
curl -sSi --max-time 10 "$API_STAGING_URL/public/members" \
  | tee "$EVID/curl/curl-public-members-base.log"

# クエリ別（08a-B contract に従い 6 種）
for kv in 'q=tanaka' 'zone=hyogo' 'status=active' 'tag=board' 'sort=name_asc' 'density=compact'; do
  k=$(echo "$kv" | cut -d= -f1)
  curl -sSi --max-time 10 "$API_STAGING_URL/public/members?$kv" \
    | tee "$EVID/curl/curl-public-members-$k.log"
done

# 認可境界
curl -sSi --max-time 10 "$API_STAGING_URL/api/me" \
  | tee "$EVID/curl/curl-authz-me-unauth.log"
curl -sSi --max-time 10 "$API_STAGING_URL/api/admin/members" \
  | tee "$EVID/curl/curl-authz-admin-unauth.log"

# member role セッション cookie 注入（fixture アカウント sign-in 後の cookie）
SESSION_COOKIE='<member fixture session cookie>'
curl -sSi --max-time 10 -H "Cookie: $SESSION_COOKIE" \
  "$API_STAGING_URL/api/admin/members" \
  | tee "$EVID/curl/curl-authz-admin-member-role.log"
```

期待ステータス:
- `/health`: 200
- `/public/members*`: 200
- `/api/me` unauth: 401
- `/api/admin/members` unauth: 401 or 403
- `/api/admin/members` member role: 403

リダイレクト: 必要に応じ `-L` を追加。リダイレクト連鎖を観測する場合は `-i` のみで保存し location を別 log に記録。
失敗時の戻し方: 4xx/5xx 期待外なら Step 11 で wrangler tail を併読。Phase 6 シナリオ S02（health 5xx）/ S03（contract 不一致）へ。

### Step 7: UI screenshot 4 種（Playwright）

```bash
# playwright.staging.config.ts の存在確認
test -f apps/web/playwright.staging.config.ts && echo OK || echo MISSING
```

存在する場合:
```bash
pnpm --filter web exec playwright test \
  --config=playwright.staging.config.ts \
  --reporter=html,list \
  --output="$EVID/playwright" \
  smoke/public-members.spec.ts smoke/login.spec.ts smoke/me.spec.ts smoke/admin.spec.ts
# screenshot を evidence dir へコピー
cp apps/web/test-results/**/public-members*.png "$EVID/screenshots/public-members-staging.png"
cp apps/web/test-results/**/login*.png "$EVID/screenshots/login-staging.png"
cp apps/web/test-results/**/me*.png "$EVID/screenshots/me-staging.png"
cp apps/web/test-results/**/admin*.png "$EVID/screenshots/admin-staging.png"
```

`playwright.staging.config.ts` 不在の場合（Phase 3 設計盲点）: 手動 chromium 手順にフォールバック。
```bash
# 手動 fallback: chromium ヘッドレスで撮影
pnpm dlx playwright install chromium
pnpm dlx playwright screenshot --full-page \
  "$WEB_STAGING_URL/members" "$EVID/screenshots/public-members-staging.png"
pnpm dlx playwright screenshot --full-page \
  "$WEB_STAGING_URL/login" "$EVID/screenshots/login-staging.png"
# /me と /admin は要 sign-in。手動で chromium dev tools から保存し evidence dir に配置
```

期待: 4 png ファイル サイズ > 0、Playwright reporter で failed=0。
失敗時の戻し方: flaky なら最大 2 回 retry。それでも fail なら trace 保存し Phase 6 シナリオ S10（playwright 環境差分）へ。`--update-snapshots=false`（既定）で実行し、snapshot 自動更新を防ぐ。

### Step 8: G3 user approval → Forms schema/responses sync

> **G3 ゲート**: Forms quota を消費するため user 承認を取得して実行。

```bash
# Phase 11 で確定する admin sync endpoint URL / トークンを使用
ADMIN_TOKEN='<admin fixture session bearer or cookie>'

curl -sSi --max-time 60 -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_STAGING_URL/api/admin/sync/forms/schema" \
  | tee "$EVID/forms/forms-schema-sync.log"

curl -sSi --max-time 120 -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_STAGING_URL/api/admin/sync/forms/responses" \
  | tee "$EVID/forms/forms-responses-sync.log"
```

期待: 両方 200、レスポンス body に `jobId` または `syncJobId` を含む。
失敗時の戻し方: 429 Forms quota 枯渇なら翌日 retry を `outputs/phase-11/main.md` に TODO 記載（先送りでなく retry 計画として明記）。Phase 6 シナリオ S06（Forms quota 枯渇）へ。
分岐: 409 多重実行 → lock 解放を待ち再実行。

### Step 9: sync_jobs / audit_log row evidence

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json \
  --command "SELECT * FROM sync_jobs ORDER BY id DESC LIMIT 20" \
  | tee "$EVID/forms/sync-jobs-staging.json"

bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json \
  --command "SELECT id, event, actor, created_at FROM audit_log WHERE event LIKE 'sync.%' ORDER BY id DESC LIMIT 20" \
  | tee "$EVID/forms/audit-log-staging.json"
```

期待: 直近の `kind="schema"` / `kind="responses"` 行が `status="succeeded"` で記録されている。`audit_log` は append-only（id 単調増加）。
PII カラムは SELECT 句で除外（メール / 氏名 / 個人情報を含まないこと）。

### Step 10: wrangler tail 1 分間 capture + redact

```bash
timeout 60 bash scripts/cf.sh tail ubm-hyogo-api-staging --env staging --format pretty \
  | bash scripts/lib/redaction.sh \
  | tee "$EVID/wrangler-tail/wrangler-tail.log"
```

`scripts/lib/redaction.sh` 不在/不適合の場合の inline fallback:
```bash
timeout 60 bash scripts/cf.sh tail ubm-hyogo-api-staging --env staging --format pretty \
  | sed -E \
      -e 's/(Bearer )[A-Za-z0-9._-]+/\1***/g' \
      -e 's/(token=)[A-Za-z0-9._-]+/\1***/g' \
      -e 's/(sk-)[A-Za-z0-9]+/\1***/g' \
      -e 's/(API_KEY=)[A-Za-z0-9._-]+/\1***/g' \
      -e 's/(Cookie: )[^ ]+/\1***/g' \
      -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/***@***/g' \
      -e 's/\b([0-9]{1,3}\.){3}[0-9]{1,3}\b/***.***.***.***/g' \
  | tee "$EVID/wrangler-tail/wrangler-tail.log"
```

redact 検証:
```bash
grep -E 'Bearer [A-Za-z0-9]|token=[A-Za-z0-9]|sk-[A-Za-z0-9]|API_KEY=' \
  "$EVID/wrangler-tail/wrangler-tail.log" && echo "LEAK!" || echo "redact OK"
```

期待: ファイルサイズ > 0、`LEAK!` が出力されない。
失敗時の戻し方: token scope 不足で tail 取得不能なら、不能理由を `wrangler-tail.log` 冒頭に明記して保存（AC で許容）。Phase 6 シナリオ S07 へ。

### Step 11: G4 user approval → 09c blocker 更新 + 親タスク artifacts.json 更新

> **G4 ゲート**: commit 直前に user 承認。本タスクの commit/push/PR 作成は Phase 13 で扱うため、本 Phase では更新内容のドラフトまでとする。

更新対象（実際の編集は Phase 11/12 で実施）:
- `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md` の blocker 状態に「09a-A 実測完了 / 残課題: ...」を追記
- 親タスク: `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11/*` の `NOT_EXECUTED` 行を本タスク evidence への相対リンクで置換
- 親タスク: `artifacts.json` の phase state を「実測完了」に更新

## Rollback 早見表

| 事象 | コマンド |
| --- | --- |
| api deploy 後に異常 | `bash scripts/cf.sh rollback <PREV_API_VERSION_ID> --config apps/api/wrangler.toml --env staging` |
| web deploy 後に異常 | `bash scripts/cf.sh rollback <PREV_WEB_VERSION_ID> --config apps/web/wrangler.toml --env staging` |
| D1 migration apply で破壊的変更 | Step 4 直前 backup を `bash scripts/cf.sh d1 execute ... --file backup.sql` で復元（手動）。schema 復旧手順は `unassigned-task/` で別途扱う |
| Forms sync で誤 row 挿入 | `sync_jobs.status="failed"` 行を確認、`unassigned-task/` で cleanup TODO 起票（手動 DELETE は本 Phase で実行しない） |

## redact 用 sed パターン参照

| 対象 | パターン |
| --- | --- |
| Bearer トークン | `s/(Bearer )[A-Za-z0-9._-]+/\1***/g` |
| クエリ token= | `s/(token=)[A-Za-z0-9._-]+/\1***/g` |
| OpenAI 様式 | `s/(sk-)[A-Za-z0-9]+/\1***/g` |
| 環境変数式 | `s/(API_KEY=)[A-Za-z0-9._-]+/\1***/g` |
| Cookie ヘッダ | `s/(Cookie: )[^ ]+/\1***/g` |
| メール | `s/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/***@***/g` |
| IPv4 | `s/\b([0-9]{1,3}\.){3}[0-9]{1,3}\b/***.***.***.***/g` |

## 異常系への分岐条件サマリ

| Step | 失敗時 | Phase 6 シナリオ |
| --- | --- | --- |
| Step 3 | exit !=0 / `Deployed` 不在 | S01 deploy 失敗 |
| Step 6 health | 5xx | S02 health 5xx |
| Step 6 `/public/members` | contract 不一致 | S03 |
| Step 4 | pending あり | S04 |
| Step 5 | diffCount>0 | S05 |
| Step 8 | 429 | S06 |
| Step 10 | tail 取得不能 | S07 |
| 任意 | redact 後 leak grep ヒット | S08 |
| Step 11 | 親タスク同時更新 race | S09 |
| Step 7 | playwright 環境差分 | S10 |

## 参照資料

- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-04.md`（テスト項目 T01〜T20）
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `scripts/cf.sh` / `scripts/lib/redaction.sh`
- `apps/api/wrangler.toml` / `apps/web/wrangler.toml`

## 統合テスト連携

- 上流: 08a / 08a-B / 08b
- 下流: 09c production deploy execution

## 多角的チェック観点

- 不変条件 #5/#6/#14 を Step 6/9/10 で実測
- approval gate G1〜G4 が runbook 内で明示停止
- production への副作用は Step 5 の `PRAGMA` read-only のみ（write/`migrations apply --env production` は禁止）
- redact pipeline で secret leak が evidence に残らない

## サブタスク管理

- [ ] Step 0〜11 と 4 approval gate の対応を確定
- [ ] redact pipeline の primary (`scripts/lib/redaction.sh`) と fallback (inline sed) を明記
- [ ] rollback 早見表を整備
- [ ] `outputs/phase-05/main.md` を作成

## 成果物

- `outputs/phase-05/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 11 ステップが番号順に実行可能なコマンドとして定義されている
- 4 approval gate が runbook の停止位置として明示されている
- 各 Step に「失敗時の戻し方」と「Phase 6 への分岐条件」が併記されている
- redact 用 sed パターンが提示されている
- rollback コマンドが deploy / D1 で定義されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で deploy / commit / push / PR / `outputs/phase-XX/main.md` 編集を実行していない
- [ ] CONST_007 に従い、未確定事項を Phase 6 / Phase 11 への明示分岐として記録している

## 次 Phase への引き渡し

Phase 6 へ:
- Step 3〜10 の各 Step で発生し得る異常事象 10 種（S01〜S10）
- redact leak grep 検証手順
- production 副作用ゼロ保証手順（read-only `PRAGMA`/`SELECT` のみ）
- unassigned-task 起票テンプレ（D1 schema drift / Forms quota / cleanup）

## 実行タスク

- [ ] phase-05 の既存セクションに記載した手順・検証・成果物作成を実行する。
