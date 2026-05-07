# Phase 5: 実装ランブック — issue-494-09a-A-exec-staging-smoke-runtime

[実装区分: 実装仕様書]

判定根拠: Phase 4 で定義した 27 テスト項目を実 staging 環境で順次実行するためのコピペ可能ステップを定義する。Cloudflare Workers / D1 / Forms quota への副作用と repo コミットを伴うため、CONST_004 に従い実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-494-09a-A-exec-staging-smoke-runtime |
| issue | #494 (`UT-09A-A-EXEC-STAGING-SMOKE-001`) |
| phase | 5 / 13 |
| wave | 9a-fu |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec / runtime-evidence-acquisition |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 11 実測オペレーターが本ファイルだけを上から順に実行すれば 13 完了条件チェックリストを漏れなく満たせる runbook を提供する。各 Step に (a) コマンド (b) 期待出力 (c) 失敗時の戻し方 (d) Phase 6 異常系への分岐 (e) approval gate を併記する。

## 前提

- 作業端末で `mise install` 完了済み（Node 24.15.0 / pnpm 10.33.2）
- 1Password CLI (`op`) サインイン済み
- 本タスク worktree 内で実行（`pwd` が `.worktrees/...issue-494...`）
- `apps/{api,web}/wrangler.toml` の `[env.staging]` が最新
- staging D1: `database_name=ubm-hyogo-db-staging` / `database_id=990e5d6c-51eb-4826-9c13-c0ae007d5f46`
- 09a-A spec (PR #493 確定済) の `outputs/phase-11/` を参照
- `wrangler` 直接実行禁止。**`bash scripts/cf.sh` ラッパー経由のみ**

## 環境変数初期化

```bash
export TASK=docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime
export EVID=$TASK/outputs/phase-11/evidence
export SPEC_PARENT=docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime
export API_STAGING_URL='<staging api URL を Phase 11 開始時に確定>'
export WEB_STAGING_URL='<staging web URL を Phase 11 開始時に確定>'
```

> URL 値は op:// 参照または `wrangler.toml` の `routes` から確定し、仕様書本文には実値を書かない。

## ステップバイステップ実行手順

### Step 0: 前提確認 / preflight

```bash
# 上流タスク完了確認
gh pr list --state merged --search "08a in:title" --limit 5
gh pr list --state merged --search "08a-B in:title" --limit 5
gh pr list --state merged --search "08b in:title" --limit 5
gh pr view 493 --json state,mergedAt   # spec 確定 PR

# Cloudflare 認証
mkdir -p "$EVID"/{preflight,deploy,curl,screenshots,playwright,forms,d1,wrangler-tail}
bash scripts/cf.sh whoami | tee "$EVID/preflight/cf-whoami.log"

# op:// 参照確認（実値は出力しない）
op run --env-file=.env -- bash -c 'test -n "$CLOUDFLARE_API_TOKEN" && echo "CLOUDFLARE_API_TOKEN injected"' \
  | tee "$EVID/preflight/op-injection-check.log"
```

期待: `whoami` 出力に Account ID、scope に Workers/D1/Pages Edit。`op-injection-check.log` に `injected` 文字列。
失敗時: 1Password の `CLOUDFLARE_API_TOKEN` 項目を確認、`.env` の op:// 参照を検証。値は記録しない。
分岐: scope 不足なら **Phase 6 シナリオ S08**（secret/scope 不備）へ。auth 再失敗時は本 Phase「Cloudflare auth 再失敗時の op:// 参照確認手順」へ。

### Step 1: 旧 version_id 控え（rollback 準備）

```bash
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging \
  | tee "$EVID/deploy/api-deployments-before.log"
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env staging \
  | tee "$EVID/deploy/web-deployments-before.log"

# rollback 候補 ID を抽出
grep -E 'Version ID|^[0-9a-f-]{36}' "$EVID/deploy/api-deployments-before.log" | head -1 \
  > "$EVID/deploy/api-prev-version-id.txt"
grep -E 'Version ID|^[0-9a-f-]{36}' "$EVID/deploy/web-deployments-before.log" | head -1 \
  > "$EVID/deploy/web-prev-version-id.txt"
```

期待: 直近 deployments の version_id が記録される。
失敗時: `deployments list` 未対応なら `wrangler versions list` 系を試行し log に明記。

---

### Step 2: G1 user approval → api → web deploy

> **G1 ゲート発火**: 以下を user に提示して **独立承認** を待つ。
>
> 提示テンプレ:
> ```
> [G1 承認依頼]
> 操作: staging api Worker → web Worker の deploy
> 副作用: ubm-hyogo-api-staging / ubm-hyogo-web-staging の version 切替
> rollback: bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/{api,web}/wrangler.toml --env staging
> 影響範囲: staging のみ（production 触らず）
> 承認しますか？（"G1 OK" のみで承認、"進めて" 等の包括承認は無効）
> ```

```bash
# G1 承認後のみ実行 — api を先、web を後
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging \
  | tee "$EVID/deploy/deploy-api-staging.log"
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging \
  | tee "$EVID/deploy/deploy-web-staging.log"

# version_id 抽出
grep -E 'Current Version ID|Deployed' "$EVID/deploy/deploy-api-staging.log" \
  | tee "$EVID/deploy/api-version-id.txt"
grep -E 'Current Version ID|Deployed' "$EVID/deploy/deploy-web-staging.log" \
  | tee "$EVID/deploy/web-version-id.txt"
```

期待: 両 deploy で exit 0、`Deployed` 行と新 `Current Version ID`。
失敗時 rollback:
```bash
# api 失敗時
bash scripts/cf.sh rollback "$(cat $EVID/deploy/api-prev-version-id.txt)" \
  --config apps/api/wrangler.toml --env staging
# web も同様
```
分岐: build error / binding 不整合 → **Phase 6 S01**（deploy 失敗）。abort 時は web deploy をスキップし api のみ rollback。

承認証跡: G1 OK 受領時刻を `outputs/phase-13/main.md` に user 発言 timestamp 付きで記録。

---

### Step 3: G1 内 — endpoint 死活 + UI smoke + wrangler tail

#### Step 3.1: curl smoke（自動・read-only）

```bash
curl -sSi --max-time 10 "$API_STAGING_URL/health" \
  | tee "$EVID/curl/curl-public-health.log"

curl -sSi --max-time 10 "$API_STAGING_URL/public/members" \
  | tee "$EVID/curl/curl-public-members-base.log"

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

# member role セッション cookie 注入（fixture アカウント sign-in 後の cookie。op:// 参照のみ）
MEMBER_SESSION="$(op read 'op://UBM-Hyogo/staging-member-session/cookie')"
curl -sSi --max-time 10 -H "Cookie: $MEMBER_SESSION" \
  "$API_STAGING_URL/api/admin/members" \
  | bash scripts/lib/redaction.sh \
  | tee "$EVID/curl/curl-authz-admin-member-role.log"
```

期待ステータス:
- `/health`: 200
- `/public/members*`: 全 7 件 200
- `/api/me` unauth: 401
- `/api/admin/members` unauth: 401 or 403
- `/api/admin/members` member role: 403

08a-B contract 合流確認:
```bash
for f in "$EVID"/curl/curl-public-members-*.log; do
  awk '/^\r?$/{p=1;next} p' "$f" | jq -S 'keys' > /tmp/$(basename "$f").keys.json
done
# 08a-B 側 evidence と diff
diff /tmp/curl-public-members-base.log.keys.json \
  docs/30-workflows/08a-B-public-search-filter-coverage-spec/outputs/phase-11/evidence/curl/keys-base.json \
  || echo "CONTRACT DIFF"
```

失敗時: 4xx/5xx 期待外 → Step 3.3 wrangler tail を併読。**Phase 6 S02 / S03** へ。

#### Step 3.2: Playwright UI smoke（4 spec）

```bash
# config 存在確認
test -f apps/web/playwright.staging.config.ts && echo OK || echo MISSING_CONFIG
```

存在時:
```bash
pnpm --filter web exec playwright test \
  --config=playwright.staging.config.ts \
  --reporter=html,list \
  --output="$EVID/playwright" \
  smoke/public-members.spec.ts smoke/login.spec.ts smoke/me.spec.ts smoke/admin.spec.ts

cp apps/web/test-results/**/public-members*.png "$EVID/screenshots/public-members-staging.png"
cp apps/web/test-results/**/login*.png         "$EVID/screenshots/login-staging.png"
cp apps/web/test-results/**/me*.png            "$EVID/screenshots/me-staging.png"
cp apps/web/test-results/**/admin*.png         "$EVID/screenshots/admin-staging.png"
```

config 不在時 fallback:
```bash
pnpm dlx playwright install chromium
pnpm dlx playwright screenshot --full-page \
  "$WEB_STAGING_URL/members" "$EVID/screenshots/public-members-staging.png"
pnpm dlx playwright screenshot --full-page \
  "$WEB_STAGING_URL/login" "$EVID/screenshots/login-staging.png"
# /me と /admin は要 sign-in。手動 chromium で撮影し evidence dir に配置
```

期待: 4 png ファイル size > 0、reporter failed=0。
失敗時: 最大 2 回 retry。trace 保存後も fail なら **Phase 6 S10**。

#### Step 3.3: wrangler tail 30 分 redacted

> **G1 範囲内**（log capture）。事前に user に「wrangler tail を 30 分回す」旨を共有。

```bash
timeout 1800 bash scripts/cf.sh tail ubm-hyogo-api-staging --env staging --format pretty \
  | bash scripts/lib/redaction.sh \
  | tee "$EVID/wrangler-tail/api-30min.log"

# redact 検証
grep -E 'Bearer [A-Za-z0-9]|token=[A-Za-z0-9]|sk-[A-Za-z0-9]|API_KEY=' \
  "$EVID/wrangler-tail/api-30min.log" \
  && echo "LEAK!" || echo "redact OK"
```

`scripts/lib/redaction.sh` 不在時 inline fallback:
```bash
timeout 1800 bash scripts/cf.sh tail ubm-hyogo-api-staging --env staging --format pretty \
  | sed -E \
      -e 's/(Bearer )[A-Za-z0-9._-]+/\1***/g' \
      -e 's/(token=)[A-Za-z0-9._-]+/\1***/g' \
      -e 's/(sk-)[A-Za-z0-9]+/\1***/g' \
      -e 's/(API_KEY=)[A-Za-z0-9._-]+/\1***/g' \
      -e 's/(Cookie: )[^ ]+/\1***/g' \
      -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/***@***/g' \
      -e 's/\b([0-9]{1,3}\.){3}[0-9]{1,3}\b/***.***.***.***/g' \
  | tee "$EVID/wrangler-tail/api-30min.log"
```

期待: size > 0、`LEAK!` 不出力。
失敗時: token scope 不足で取得不能なら、不能理由を log 冒頭に明記して保存（AC #5 で許容）。**Phase 6 S07**。

---

### Step 4: G2 user approval → D1 migration list / apply

```bash
# pending 確認（read-only）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging \
  | tee "$EVID/d1/d1-migrations-staging.log"
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production \
  | tee "$EVID/d1/d1-migrations-prod.log"
```

> **G2 ゲート発火条件**: `d1-migrations-staging.log` に pending 行（`[ ]`）が **1 件以上ある場合のみ**。pending=0 なら apply スキップで Step 5 へ進み、skip 理由を log 末尾に追記。
>
> 提示テンプレ（pending あり時）:
> ```
> [G2 承認依頼]
> 操作: ubm-hyogo-db-staging へ pending migration apply
> pending 件数: <N>
> 副作用: D1 schema 永続変更（rollback CLI なし、backup から復元のみ）
> backup: bash scripts/cf.sh d1 export ubm-hyogo-db-staging --env staging --output backup-pre-apply.sql
> 承認しますか？（"G2 OK" のみで承認）
> ```

apply 前に backup 取得:
```bash
bash scripts/cf.sh d1 export ubm-hyogo-db-staging --env staging \
  --output "$EVID/d1/backup-pre-apply.sql"
```

G2 承認後:
```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging \
  | tee -a "$EVID/d1/d1-migrations-staging.log"

# apply 後再 list
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging \
  | tee "$EVID/d1/d1-migrations-staging-after.log"
```

期待: apply 後 pending=0。
失敗時 abort 手順:
- apply 中断時は `backup-pre-apply.sql` を保持し、復旧計画を `unassigned-task/task-09a-d1-pending-migration-followup-001` で起票（**Phase 6 S04**）。
- 自動 rollback CLI は無いため、G2 直前に必ず backup を取得すること。

承認証跡: G2 OK 受領時刻を `outputs/phase-13/main.md` に記録（または skip 判定理由）。

---

### Step 5: D1 schema parity（read-only）

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

node -e '
const fs=require("fs");
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
失敗時: production read 権限不足なら `cf.sh whoami` の scope 再確認。
分岐: `diffCount > 0` → **Phase 6 S05** + `task-09a-d1-schema-parity-followup-001` 起票。

---

### Step 6: G3 user approval → Forms schema/responses sync

> **G3 ゲート発火**: Forms API quota を消費するため必ず user 承認を取得。
>
> 提示テンプレ:
> ```
> [G3 承認依頼]
> 操作: Forms schema sync 1 サイクル + Forms responses sync 1 サイクル
> 副作用: Google Forms API 読み取り quota 消費（1 日 / per project の上限あり）/ sync_jobs / audit_log への row 追加
> rollback: なし（sync_jobs.status="failed" 行の cleanup は別タスク起票）
> 承認しますか？（"G3 OK" のみで承認）
> ```

```bash
ADMIN_TOKEN="$(op read 'op://UBM-Hyogo/staging-admin-fixture/bearer')"

curl -sSi --max-time 60 -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_STAGING_URL/api/admin/sync/forms/schema" \
  | bash scripts/lib/redaction.sh \
  | tee "$EVID/forms/forms-schema-sync.log"

curl -sSi --max-time 120 -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_STAGING_URL/api/admin/sync/forms/responses" \
  | bash scripts/lib/redaction.sh \
  | tee "$EVID/forms/forms-responses-sync.log"
```

期待: 両 200、body に `jobId`。
失敗時:
- 429 Forms quota 枯渇 → 翌日 retry を `outputs/phase-11/main.md` に時刻指定計画として記録（**Phase 6 S06**）。先送り表記禁止、retry 計画として明記。
- 409 多重実行 → lock 解放を待ち再実行。
- Abort: G3 取消し時は schema sync のみ取得して responses sync は skip、skip 理由を log に記録。

承認証跡: G3 OK 受領時刻を `outputs/phase-13/main.md` に記録。

---

### Step 7: sync_jobs / audit_log row dump

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json \
  --command "SELECT * FROM sync_jobs ORDER BY id DESC LIMIT 20" \
  | tee "$EVID/forms/sync-jobs-staging.json"

# PII 除外 SELECT
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json \
  --command "SELECT id, event, actor, created_at FROM audit_log WHERE event LIKE 'sync.%' ORDER BY id DESC LIMIT 20" \
  | tee "$EVID/forms/audit-log-staging.json"
```

期待: 直近の `kind="schema"` / `kind="responses"` 行が `status="succeeded"`。`audit_log` は append-only。

---

### Step 8: G4 user approval → evidence commit / 09c blocker 更新（draft）

> **G4 ゲート発火**: repo コミット直前に user 承認。
> 本タスクの push / PR 作成は **別タスク扱い**（Phase 13）。本ランブックは **draft commit までを定義**。
>
> 提示テンプレ:
> ```
> [G4 承認依頼]
> 操作: evidence ファイル群 + 09c blocker 更新 + task-workflow-active.md 更新を draft commit
> 影響範囲: docs/30-workflows/issue-494-.../outputs/phase-11/evidence/* / unassigned-task/task-09c-... / .claude/skills/aiworkflow-requirements/references/task-workflow-active.md
> push/PR: 本ランブックでは行わない（別タスク Phase 13）
> 承認しますか？（"G4 OK" のみで承認）
> ```

更新対象:

1. `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の `NOT_EXECUTED` を実測 evidence 参照リンクで全置換。
2. `docs/30-workflows/completed-tasks/task-09c-production-deploy-execution-001.md` の blocker 状態に「09a-A 実測完了 / 残課題: ...」を追記。
3. `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` の 09a-A 行を `runtime_evidence_captured` 相当に昇格。
4. `artifacts.json` ↔ `outputs/artifacts.json` の parity 維持（diff 0）。
5. `outputs/phase-12/implementation-guide.md` runtime status / `phase12-task-spec-compliance-check.md` / `documentation-changelog.md` を実測結果で更新。

```bash
# parity 確認
diff <(jq -S . "$TASK/artifacts.json") <(jq -S . "$TASK/outputs/artifacts.json") \
  | tee "$TASK/outputs/phase-13/main.md.parity"

# placeholder 残存チェック
grep -RE 'NOT_EXECUTED|TODO_EVIDENCE|PLACEHOLDER' "$TASK/outputs/phase-11/" \
  && echo "PLACEHOLDER REMAINS" || echo "placeholder gate OK"

# G4 承認後に draft commit
git add "$TASK/outputs/phase-11/" "$TASK/outputs/phase-12/" "$TASK/outputs/phase-13/" \
        "$TASK/artifacts.json" \
        docs/30-workflows/completed-tasks/task-09c-production-deploy-execution-001.md \
        .claude/skills/aiworkflow-requirements/references/task-workflow-active.md
git commit -m "evidence(09a-A): capture staging runtime evidence under G1-G4

- G1: api/web Workers staging deploy + curl/Playwright/wrangler-tail evidence
- G2: D1 migration apply + schema parity (staging vs production)
- G3: Forms schema/responses sync replay + sync_jobs/audit_log dump
- G4: 09c blocker updated, task-workflow-active 09a-A row promoted to runtime_evidence_captured

Refs: #494"
```

> push / PR 作成は本ランブック範囲外。`.claude/commands/ai/diff-to-pr.md` 経由で別途実行。

承認証跡: G4 OK 受領時刻を `outputs/phase-13/main.md` に記録（4 ゲート分の独立 timestamp が揃う）。

---

## 各ゲート前後の rollback / abort 手順サマリ

| ゲート | 前段準備 | abort 時 | rollback コマンド |
| --- | --- | --- | --- |
| G1 | Step 1 で旧 version_id 控え | api 失敗 → web スキップ / web 失敗 → api だけ rollback 検討 | `bash scripts/cf.sh rollback "$(cat $EVID/deploy/{api,web}-prev-version-id.txt)" --config apps/{api,web}/wrangler.toml --env staging` |
| G2 | Step 4 で `d1 export` backup | apply 中断時は backup 保持 + 復旧計画起票（rollback CLI なし） | 手動: `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --file backup-pre-apply.sql`（schema 復旧手順は unassigned-task で別途扱う） |
| G3 | quota 残量推定（前日の `sync_jobs` 履歴で確認） | quota 枯渇 → 翌日 retry 時刻記録 / 多重実行 → lock 解放待ち | sync_jobs cleanup は本 Phase で実行せず、`unassigned-task/` 起票 |
| G4 | parity / placeholder gate を pre-check | commit 失敗時は `git reset HEAD` で staged 解除し再評価 | `git reset --soft HEAD~1` で commit 取消（push 前なので安全） |

## 異常系への分岐条件サマリ

| Step | 失敗時 | Phase 6 シナリオ |
| --- | --- | --- |
| Step 0 | cf.sh whoami fail / op:// 注入失敗 | S08 |
| Step 2 | exit !=0 / `Deployed` 不在 | S01 deploy 失敗 |
| Step 3.1 health | 5xx | S02 health 5xx |
| Step 3.1 `/public/members` | contract 不一致 | S03 |
| Step 3.2 | playwright 環境差分 | S10 |
| Step 3.3 | tail 取得不能 | S07 wrangler tail 取得不能 |
| Step 4 | apply 失敗 / 中断 | S04 |
| Step 5 | diffCount > 0 | S05 |
| Step 6 | 429 / 409 | S06 |
| Step 7 | row 増分なし | S06 派生 |
| Step 8 | parity diff / placeholder 残存 / 09c blocker 更新 race | S09 / S12 |
| 任意 | redact 後 leak grep ヒット | S08 |

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

## Cloudflare auth 再失敗時の op:// 参照確認手順

```bash
# 1. .env が op:// 参照のみで実値を含まないことを確認
grep -E '^[A-Z_]+=op://' .env | wc -l   # 期待: 1Password 参照行数
grep -EvE '^(#|[A-Z_]+=op://|$)' .env || echo "no plaintext values in .env"

# 2. op session 再認証
op signin

# 3. 注入確認（実値は出力しない）
op run --env-file=.env -- bash -c '
  for k in CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID; do
    if [ -n "${!k}" ]; then echo "$k: injected"; else echo "$k: MISSING"; fi
  done
'

# 4. それでも whoami 失敗時: 1Password 側の token rotation が必要
echo "API Token rotation を 1Password で実施 → cf.sh whoami 再試行"
```

注意: 実 token 値の `cat` / `grep` / 仕様書転記は禁止（CLAUDE.md「禁止事項」参照）。

## 参照資料

- Issue #494
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-04.md`〜`phase-07.md`（spec 確定版）
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `scripts/cf.sh` / `scripts/lib/redaction.sh`
- `apps/api/wrangler.toml` / `apps/web/wrangler.toml`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 統合テスト連携

- 上流: PR #493 spec 確定 / 08a / 08a-B / 08b
- 下流: 09c production deploy execution

## 多角的チェック観点

- 不変条件 #5/#6/#14 を Step 3/Step 7/Step 6 で実測
- approval gate G1〜G4 が runbook 内で明示停止位置を持つ
- production への副作用は Step 5 の `PRAGMA` read-only と Step 4 の `migrations list --env production` のみ（write は禁止）
- redact pipeline で secret leak が evidence に残らない
- `wrangler` 直接実行が runbook に出現していない（`scripts/cf.sh` 経由のみ）
- 仕様書本文に secret / PII の実値を含まない（op:// 参照のみ）

## サブタスク管理

- [ ] Step 0〜8 と G1〜G4 ゲートの対応を確定
- [ ] redact pipeline の primary / fallback を明記
- [ ] rollback / abort 早見表を整備
- [ ] op:// 参照確認手順を明記
- [ ] `outputs/phase-05/main.md` を Phase 11 で作成

## 成果物

- `outputs/phase-05/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 9 ステップ（Step 0〜8）が番号順に実行可能なコマンドとして定義されている
- G1〜G4 approval gate が runbook の停止位置として明示されている
- 各 Step に「失敗時の戻し方」「Phase 6 への分岐条件」「rollback / abort 手順」が併記されている
- redact 用 sed パターンが提示されている
- Cloudflare auth 再失敗時の op:// 参照確認手順が明記されている
- `wrangler` 直接実行が runbook に存在しない（`scripts/cf.sh` 経由のみ）

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で deploy / commit / push / PR / `outputs/phase-XX/main.md` 編集を実行していない
- [ ] CONST_007 に従い、未確定事項を Phase 6 / Phase 11 への明示分岐として記録している
- [ ] secret / PII の実値を仕様書本文に書いていない（op:// 参照のみ）

## 次 Phase への引き渡し

Phase 6 へ:
- Step 0〜8 の各 Step で発生し得る異常事象 12 種（S01〜S12）
- redact leak grep 検証手順
- production 副作用ゼロ保証手順（read-only `PRAGMA`/`SELECT`/`migrations list` のみ）
- unassigned-task 起票テンプレ（D1 schema drift / Forms quota / wrangler tail scope / production mutation）
- G2 backup → 復旧計画 unassigned-task 起票フロー

## 実行タスク

- [ ] phase-05 の既存セクションに記載した手順・検証・成果物作成を Phase 11 で実行する。
