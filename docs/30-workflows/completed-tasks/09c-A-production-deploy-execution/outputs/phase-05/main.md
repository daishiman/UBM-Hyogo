[実装区分: 実装仕様書（runbook execution + evidence collection）]

# Phase 5 Output: 実装ランブック — 09c-A-production-deploy-execution

> 本ファイルは production deploy 実 execution 用の **完全 runbook** である。
> 仕様書作成段階では実コマンド実行・production mutation・commit・push・PR 作成を **行わない**。
> 別 operation で本 runbook を上から順に実行し、各 Step の evidence を `outputs/phase-11/` に保存する。

---

## 0. 自走禁止操作 / approval gate 一覧

以下のコマンドは **`outputs/phase-11/user-approval-log.md` の対応セクションに承認 entry が記録されているとき以外、絶対に実行しない**。承認なしの実行は false green / 不可逆操作の原因となる。

| # | gate | 対象コマンド | 担当 Phase |
| --- | --- | --- | --- |
| G-1 | release/main promotion | `gh pr merge <pr> --squash` | release/main promotion approval |
| G-2 | D1 migration apply | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml` | Phase 11 user approval |
| G-3 | API deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` | Phase 11 user approval |
| G-4 | Web deploy | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` | Phase 11 user approval |
| G-5 | release tag push | `git push origin <release-tag>` | Phase 11 user approval |
| G-R | rollback 任意 | `bash scripts/cf.sh rollback ...` / D1 fix migration / `git push origin --delete <tag>` | 個別 user approval |

read-only 操作（`whoami` / `d1 migrations list` / `d1 export` / `git log` / `curl` smoke 等）は approval 不要。ただし evidence に書き込む前に redaction を必ず通す。

### approval / redaction helper

以降の command block では次の helper を使う。`grep -q "APPROVED"` のような全ファイル検索は禁止する。

```bash
require_approval() {
  local gate="$1"
  awk -v gate="$gate" '
    $0 ~ "^## " { in_gate = index($0, gate) > 0 }
    in_gate && /- 状態: approved/ { found = 1 }
    END { exit found ? 0 : 1 }
  ' outputs/phase-11/user-approval-log.md
}

redact_evidence() {
  sed -E \
    -e 's/(account id|account_id|Account ID):[[:space:]]*[A-Za-z0-9_-]+/\1: <REDACTED:ACCOUNT_ID>/Ig' \
    -e 's/(Current Version ID: )[0-9a-f-]+/\1<REDACTED:VERSION_ID>/Ig' \
    -e 's/(__Secure-[A-Za-z0-9_.-]+=)[^;[:space:]]+/\1<REDACTED:COOKIE>/g' \
    -e 's/(Bearer )[A-Za-z0-9._-]+/\1<REDACTED:TOKEN>/g'
}
```

### 正規 CLI 経路

- Cloudflare 系 CLI は **すべて `bash scripts/cf.sh` 経由**。`wrangler` / `pnpm wrangler` / `npx wrangler` は禁止（CLAUDE.md / `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` §10 に従う）。
- `apps/api/package.json` / `apps/web/package.json` には `deploy:production` script が存在しないため、deploy は `bash scripts/cf.sh deploy --config <path> --env production` を直接呼ぶ。
- web deploy は OpenNext build (`pnpm --filter @ubm-hyogo/web build:cloudflare`) を **必須前提** とする（`.open-next/worker.js` と `.open-next/assets/` が無いと deploy が失敗する）。

---

## 1. Step 1: 前提条件チェック [READ_ONLY]

### 前提

- 09a-A staging smoke green、09b-A observability runtime 疎通、09b-B post-deploy healthcheck mechanism green
- Phase 10 user approval が `outputs/phase-11/user-approval-log.md` に記録済み
- 1Password environment が `.env` から参照可能（`scripts/cf.sh` が op run で動的注入する）

### コマンド

```bash
# 1.1 main 同期確認
git fetch origin main
ORIGIN_MAIN=$(git rev-parse origin/main)
echo "origin/main HEAD: ${ORIGIN_MAIN}" | tee outputs/phase-11/main-merge-commit.txt

# 1.2 Cloudflare account identity（mask 済み出力）
bash scripts/cf.sh whoami | redact_evidence | tee outputs/phase-11/cf-whoami.txt

# 1.3 09a-A staging smoke green の citation
rg -n "EXECUTED_PASS|Runtime evidence: PASS|状態: green" docs/30-workflows/09a-*/outputs/phase-11/ \
  | tee -a outputs/phase-11/upstream-green-evidence.md

# 1.4 09b-A observability green の citation
rg -n "EXECUTED_PASS|Runtime evidence: PASS|状態: green" docs/30-workflows/09b-A-*/outputs/phase-11/ \
  | tee -a outputs/phase-11/upstream-green-evidence.md

# 1.5 09b-B post-deploy healthcheck green の citation
rg -n "EXECUTED_PASS|Runtime evidence: PASS|状態: green" docs/30-workflows/09b-B-*/outputs/phase-11/ \
  | tee -a outputs/phase-11/upstream-green-evidence.md

# 1.6 user approval log（Phase 10）の存在確認
test -s outputs/phase-11/user-approval-log.md \
  && grep -q "Phase 10" outputs/phase-11/user-approval-log.md \
  && echo "Phase 10 approval: PRESENT" \
  || { echo "Phase 10 approval: MISSING -> STOP"; exit 1; }
```

### sanity check

- `git rev-parse origin/main` が 7 桁以上の commit hash
- `bash scripts/cf.sh whoami` で production を操作する account / email が想定どおり（ID は末尾 4 桁のみ表示される redaction 済み）
- 上流 09a-A / 09b-A / 09b-B の Phase 11 に PASS/green 判定行と必須 evidence が存在する
- user-approval-log.md に Phase 10 セクションが存在する

### evidence

- `outputs/phase-11/main-merge-commit.txt`
- `outputs/phase-11/cf-whoami.txt`
- `outputs/phase-11/upstream-green-evidence.md`
- `outputs/phase-11/user-approval-log.md`（Phase 10 セクション）

### 差し戻し先

| 失敗 | 差し戻し |
| --- | --- |
| 上流が未 green | 09a-A / 09b-A / 09b-B のいずれかへ。本 runbook は STOP |
| `cf.sh whoami` が想定外 account | `.env` の op 参照を見直し、再 `whoami` |
| Phase 10 approval なし | Phase 10 を完了させる |

---

## 2. Step 2: release/main promotion と evidence 取得 [USER_APPROVAL_REQUIRED: G-1]

### 前提

- dev → main の PR が CI green
- release/main promotion approval (G-1) が `user-approval-log.md` に記録済み

### コマンド

```bash
# 2.1 dev → main PR を merge（G-1 approval 済みのみ実行）
# 例: PR 番号は実 runtime で確定
PR_NUMBER="<runtime-fill>"
require_approval "G-1 release/main promotion" \
  || { echo "G-1 not approved -> STOP"; exit 1; }
gh pr merge "${PR_NUMBER}" --squash --delete-branch=false

# 2.2 main 同期と merge commit hash の取得
git checkout main
git pull --ff-only origin main
MERGE_COMMIT=$(git rev-parse HEAD)
test -z "$(git status --porcelain)" \
  || { echo "worktree dirty after main pull -> STOP"; exit 1; }
test "${MERGE_COMMIT}" = "$(git rev-parse origin/main)" \
  || { echo "HEAD != origin/main -> STOP"; exit 1; }
echo "main merge commit: ${MERGE_COMMIT}"
echo "PR URL: https://github.com/daishiman/UBM-Hyogo/pull/${PR_NUMBER}"

# 2.3 evidence
{
  echo "# main merge commit"
  echo "- commit: ${MERGE_COMMIT}"
  echo "- deploy_commit: ${MERGE_COMMIT}"
  echo "- pr: https://github.com/daishiman/UBM-Hyogo/pull/${PR_NUMBER}"
  echo "- merged_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
} | tee outputs/phase-11/main-merge-commit.txt

# 2.4 直近 commit の確認
git log --oneline -5 | tee outputs/phase-11/main-merge-log.txt
```

### sanity check

- `git log` で最新 commit が dev squash の merge commit
- `outputs/phase-11/main-merge-commit.txt` に commit hash と PR URL が記載

### evidence

- `outputs/phase-11/main-merge-commit.txt`
- `outputs/phase-11/main-merge-log.txt`

### 差し戻し先

| 失敗 | 差し戻し |
| --- | --- |
| PR が未承認 | Phase 13 approval を取得 |
| merge conflict | dev で rebase → 再 PR |

---

## 3. Step 3: production D1 migration [USER_APPROVAL_REQUIRED: G-2]

### Step 3.1: D1 backup（read-only） [READ_ONLY]

```bash
TS=$(date -u +%Y%m%d-%H%M)
mkdir -p outputs/phase-11

bash scripts/cf.sh d1 export ubm-hyogo-db-prod \
  --remote \
  --output="outputs/phase-11/d1-backup-${TS}.sql" \
  --env production \
  --config apps/api/wrangler.toml \
  2>&1 | tee outputs/phase-11/d1-backup-${TS}.log

ls -la outputs/phase-11/d1-backup-${TS}.sql
```

- sanity: backup ファイル size > 0
- evidence: `outputs/phase-11/d1-backup-<ts>.sql`, `d1-backup-<ts>.log`

### Step 3.2: D1 migration list（apply 前） [READ_ONLY]

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod \
  --remote \
  --env production \
  --config apps/api/wrangler.toml \
  2>&1 | redact_evidence | tee outputs/phase-11/d1-migrations-list-before.txt
```

- sanity: 出力に Pending と Applied のセクションが含まれる
- evidence: `outputs/phase-11/d1-migrations-list-before.txt`

### Step 3.3: user approval gate [USER_APPROVAL_REQUIRED: G-2]

`outputs/phase-11/user-approval-log.md` に次の entry を記録するまで Step 3.4 を実行しない:

```md
## Phase 11 / D1 apply approval
- date: <ISO 8601>
- approver: <user>
- pending migrations: <list-before の Pending 件数>
- backup file: outputs/phase-11/d1-backup-<ts>.sql (size: <bytes>)
- 状態: approved / rejected
```

REJECTED の場合は本 runbook を STOP する。

### Step 3.4: D1 migration apply [USER_APPROVAL_REQUIRED: G-2]

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod \
  --remote \
  --env production \
  --config apps/api/wrangler.toml \
  2>&1 | redact_evidence | tee outputs/phase-11/d1-apply.log

# apply 出力をコピー
cp outputs/phase-11/d1-apply.log outputs/phase-11/d1-migrations-apply.txt
```

- sanity: exit 0、`Already at latest migration` または applied 件数 ≥ 1
- evidence: `outputs/phase-11/d1-apply.log`, `d1-migrations-apply.txt`

### Step 3.5: D1 migration list（apply 後） [READ_ONLY]

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod \
  --remote \
  --env production \
  --config apps/api/wrangler.toml \
  2>&1 | redact_evidence | tee outputs/phase-11/d1-migrations-list-after.txt

# 比較
diff outputs/phase-11/d1-migrations-list-before.txt \
     outputs/phase-11/d1-migrations-list-after.txt \
  | tee outputs/phase-11/d1-migrations-diff.txt || true
```

- sanity: Applied 件数が before 以上（Pending が 0 になっている）
- evidence: `outputs/phase-11/d1-migrations-list-after.txt`, `d1-migrations-diff.txt`

### 差し戻し先

| 失敗 | 差し戻し |
| --- | --- |
| backup size 0 | リトライ。継続失敗で incident 起票、本 runbook STOP |
| apply で error | `d1 migrations list` で current state 確認、forward fix migration を作成（破壊的 SQL 禁止） |
| backup から復旧が必要 | rollback C 節（後述）を別 user approval で実行 |

---

## 4. Step 4: API production deploy [USER_APPROVAL_REQUIRED: G-3]

### 前提

- Step 3 完了、D1 schema が新版コードと整合
- `apps/api` の typecheck が green

### コマンド

```bash
# 4.1 typecheck（pre-deploy）
mise exec -- pnpm --filter @ubm-hyogo/api typecheck \
  2>&1 | tee outputs/phase-11/api-typecheck.log

# 4.2 user approval gate を確認
require_approval "G-3 API deploy" \
  || { echo "G-3 not approved -> STOP"; exit 1; }

# 4.3 deploy
bash scripts/cf.sh deploy \
  --config apps/api/wrangler.toml \
  --env production \
  2>&1 | redact_evidence | tee outputs/phase-11/api-deploy.log

# 4.4 version_id を抽出
API_VERSION_ID=$(grep -oE "Current Version ID: [0-9a-f-]+" outputs/phase-11/api-deploy.log | awk '{print $4}')
{
  echo "# API production deploy"
  echo "- worker: ubm-hyogo-api"
  echo "- version_id: ${API_VERSION_ID}"
  echo "- deployed_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- evidence: outputs/phase-11/api-deploy.log"
} | tee outputs/phase-11/api-version.md
```

### sanity check

- `pnpm typecheck` exit 0
- `bash scripts/cf.sh deploy` exit 0
- 出力に `Deployed ubm-hyogo-api triggers ...` および `Current Version ID: ...` が含まれる
- `api-version.md` に version_id が埋まる（空なら deploy 失敗扱い）

### evidence

- `outputs/phase-11/api-typecheck.log`
- `outputs/phase-11/api-deploy.log`
- `outputs/phase-11/api-version.md`

### 差し戻し先

| 失敗 | 差し戻し |
| --- | --- |
| typecheck error | 該当 source code（02 / 03 / 04 / 06 / 07 wave）へ |
| build error（esbuild など） | `scripts/cf.sh` の `ESBUILD_BINARY_PATH` 解決を確認 |
| deploy error | rollback A 節（worker rollback、user approval 必須） |

---

## 5. Step 5: Web production deploy [USER_APPROVAL_REQUIRED: G-4]

### 前提

- Step 4 完了（API が新版で稼働）
- OpenNext build が exit 0

### コマンド

```bash
# 5.1 OpenNext build（必須前提：.open-next/worker.js と .open-next/assets/ を生成）
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare \
  2>&1 | tee outputs/phase-11/web-build.log

# 5.2 bundle size 確認（Free プラン 3 MiB 上限）
ls -la apps/web/.open-next/worker.js | tee -a outputs/phase-11/web-build.log
WORKER_SIZE=$(stat -f%z apps/web/.open-next/worker.js 2>/dev/null || stat -c%s apps/web/.open-next/worker.js)
echo "worker.js size: ${WORKER_SIZE} bytes" | tee -a outputs/phase-11/web-build.log

# 5.3 不変条件 #6 の build artifact 検証（apps/web bundle に D1 import が無いこと）
rg "D1Database" apps/web/.open-next/ \
  && { echo "INVARIANT-6 VIOLATION: D1 import in apps/web bundle -> STOP"; exit 1; } \
  || echo "invariant #6 PASS: no D1 import" | tee -a outputs/phase-11/invariants.md

# 5.4 user approval gate を確認
require_approval "G-4 Web deploy" \
  || { echo "G-4 not approved -> STOP"; exit 1; }

# 5.5 deploy
bash scripts/cf.sh deploy \
  --config apps/web/wrangler.toml \
  --env production \
  2>&1 | redact_evidence | tee outputs/phase-11/web-deploy.log

# 5.6 version_id を抽出
WEB_VERSION_ID=$(grep -oE "Current Version ID: [0-9a-f-]+" outputs/phase-11/web-deploy.log | awk '{print $4}')
{
  echo "# Web production deploy"
  echo "- worker: ubm-hyogo-web-production"
  echo "- version_id: ${WEB_VERSION_ID}"
  echo "- worker.js size: ${WORKER_SIZE} bytes"
  echo "- deployed_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- evidence: outputs/phase-11/web-deploy.log"
} | tee outputs/phase-11/web-version.md
```

### sanity check

- `build:cloudflare` exit 0、`.open-next/worker.js` と `.open-next/assets/` が生成
- worker.js size < 3 MiB（free プラン上限）
- `rg "D1Database" apps/web/.open-next/` で 0 hit（不変条件 #6）
- `bash scripts/cf.sh deploy` exit 0
- 出力に `Current Version ID: ...` が含まれる

### evidence

- `outputs/phase-11/web-build.log`
- `outputs/phase-11/web-deploy.log`
- `outputs/phase-11/web-version.md`
- `outputs/phase-11/invariants.md`（#6 PASS 行を追加）

### 差し戻し先

| 失敗 | 差し戻し |
| --- | --- |
| build error（OpenNext） | `apps/web` の `@opennextjs/cloudflare` 設定を見直し（02c wave） |
| bundle size 超過 | minify 有効化、依存削減（UT-06-FU-A AC-11） |
| `D1Database` 検出 | apps/web 側に D1 binding 漏出あり。02c で修正後やり直し |
| deploy error | rollback B 節（user approval） |

---

## 6. Step 6: release tag

### Step 6.1: tag 名生成と作成（local） [READ_ONLY]

```bash
TAG="v$(date -u +%Y%m%d-%H%M)"
echo "Tag candidate: ${TAG}"

# 形式チェック（vYYYYMMDD-HHMM）
[[ "$TAG" =~ ^v[0-9]{8}-[0-9]{4}$ ]] || { echo "format error"; exit 1; }

# main 最新 commit を再確認
git fetch origin main
git checkout main
git pull --ff-only origin main
COMMIT=$(git rev-parse HEAD)

# annotated tag を local に作成
git tag -a "$TAG" -m "Production release ${TAG} (commit ${COMMIT})"
git tag --list "$TAG"
```

- sanity: `git tag --list` に `vYYYYMMDD-HHMM` が表示される

### Step 6.2: user approval gate [USER_APPROVAL_REQUIRED: G-5]

`user-approval-log.md` に次を記録するまで Step 6.3 を実行しない:

```md
## Phase 11 / release tag push approval
- date: <ISO 8601>
- approver: <user>
- tag: vYYYYMMDD-HHMM
- commit: <commit-hash>
- 状態: approved / rejected
```

### Step 6.3: tag push [USER_APPROVAL_REQUIRED: G-5]

```bash
git push origin "$TAG"

# remote 反映確認
git ls-remote --tags origin | grep "$TAG" \
  && echo "remote tag PRESENT" \
  || { echo "remote tag MISSING -> retry"; exit 1; }

# evidence
{
  echo "# release tag"
  echo "- tag: ${TAG}"
  echo "- commit: ${COMMIT}"
  echo "- pushed_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- remote: $(git ls-remote --tags origin | grep ${TAG})"
} | tee outputs/phase-11/release-tag.txt
```

### sanity check

- `git ls-remote --tags origin` に該当 tag がある
- `release-tag.txt` に tag / commit / pushed_at が記録される

### evidence

- `outputs/phase-11/release-tag.txt`

### 差し戻し先

| 失敗 | 差し戻し |
| --- | --- |
| tag 形式 error | 引数 / 時刻を再確認 |
| push reject（同名 tag 存在） | timestamp を 1 分進めて再生成（`git tag -d` で local 整理） |

> tag は immutable に扱う。同名上書き禁止。再発行が必要な場合は別 HHMM で打ち直す（rollback E 節）。

---

## 7. Step 7: production smoke + post-deploy healthcheck

### Step 7.1: URL の確定 [READ_ONLY]

```bash
# wrangler.toml の env.production.routes / name から実 URL を確定
PRODUCTION_API="https://ubm-hyogo-api.<account>.workers.dev"     # <runtime-fill>
PRODUCTION_WEB="https://ubm-hyogo-web-production.<account>.workers.dev"  # <runtime-fill>
{
  echo "# production endpoints"
  echo "- api: ${PRODUCTION_API}"
  echo "- web: ${PRODUCTION_WEB}"
} | tee outputs/phase-11/production-endpoints.md
```

### Step 7.2: public smoke（curl） [READ_ONLY]

```bash
{
  echo "# smoke-public"
  echo "- checked_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  for path in "/" "/members" "/members/sample-id" "/login"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PRODUCTION_WEB}${path}")
    echo "- ${path} -> ${STATUS}"
  done
} | tee outputs/phase-11/smoke-public.md
```

- sanity: `/`, `/members`, `/members/sample-id`, `/login` が 200

### Step 7.3: member smoke（手動ブラウザ + screenshot）

```text
1. ブラウザを起動
2. ${PRODUCTION_WEB}/login → Google OAuth で member role でログイン
3. ${PRODUCTION_WEB}/profile を表示
   - 編集 form が **存在しない** こと（不変条件 #4）
   - 表示内容を screenshot（macOS Cmd+Shift+4）
4. screenshot を outputs/phase-11/smoke-screenshots/member-profile-<ts>.png に保存
5. checked_at / role / 結果を outputs/phase-11/smoke-member.md に記録
```

`smoke-member.md` のテンプレ:

```md
# smoke-member
- checked_at: <ISO 8601>
- role: member
- /profile: 200, 編集 form 不在 PASS（不変条件 #4）
- screenshot: outputs/phase-11/smoke-screenshots/member-profile-<ts>.png
- 認証 cookie: redacted
```

### Step 7.4: admin smoke（手動 + curl） [READ_ONLY for curl]

```bash
{
  echo "# smoke-admin (curl unauthenticated)"
  echo "- checked_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  for path in "/admin" "/admin/members" "/admin/tags" "/admin/schema" "/admin/meetings"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PRODUCTION_WEB}${path}")
    echo "- ${path} (unauth) -> ${STATUS}"
  done
} | tee outputs/phase-11/smoke-admin.md
```

未認証では 302（Auth.js redirect）を期待。続いて手動ブラウザで:

```text
6. admin role で再ログイン
7. /admin, /admin/members, /admin/tags, /admin/schema, /admin/meetings を順に確認
   - 5 ルートすべて 200
   - admin/members で「他人本文の編集 form」が **存在しない** こと（不変条件 #11）
   - 各画面 screenshot を outputs/phase-11/smoke-screenshots/admin-*-<ts>.png に保存
8. member role で /admin にアクセス → 403 / リダイレクト（不変条件 #5）
9. 結果を smoke-admin.md に追記
```

### Step 7.5: manual sync trigger（admin role）

```bash
# admin の session cookie を手動取得（ブラウザ DevTools → Application → Cookies）
COOKIE='__Secure-authjs.session-token=<runtime-fill>'

curl -s -X POST "${PRODUCTION_API}/admin/sync/schema" \
  -H "Cookie: ${COOKIE}" \
  -H "Content-Type: application/json" \
  -w "\nHTTP %{http_code}\n" \
  | tee -a outputs/phase-11/smoke-admin.md

curl -s -X POST "${PRODUCTION_API}/admin/sync/responses" \
  -H "Cookie: ${COOKIE}" \
  -H "Content-Type: application/json" \
  -w "\nHTTP %{http_code}\n" \
  | tee -a outputs/phase-11/smoke-admin.md

# sync_jobs を SQL 確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod \
  --remote --env production --config apps/api/wrangler.toml \
  --command "SELECT id, type, status, started_at, finished_at FROM sync_jobs ORDER BY started_at DESC LIMIT 4;" \
  2>&1 | redact_evidence | tee -a outputs/phase-11/smoke-admin.md
```

- sanity: 直近 2 行が `status='success'`
- skip 条件: cookie 取得不能なら 401 を確認し、`smoke-admin.md` に skip 理由を明記。silent skip 禁止

### Step 7.6: 不変条件 invariants.md の集約

```bash
{
  echo "# invariants"
  echo "- #5 public/member/admin boundary: smoke-*.md の authz 表で確認"
  echo "- #6 apps/web → D1 直接 access 禁止: rg D1Database 0 hit（Step 5.3 で記録済み）"
  echo "- #11 admin が本人本文を編集不可: smoke-screenshots/admin-members-<ts>.png で確認"
  echo "- #14 Cloudflare free-tier: Step 8 で 24h 後に確認"
} | tee -a outputs/phase-11/invariants.md
```

### Step 7.7: post-deploy healthcheck（09b-B 連携）

09b-B が実装した silent failure 検知 mechanism を production binding で発火させ、Sentry / Slack に通知が到達することを確認する。

```bash
# 09b-B のテスト用 endpoint（healthcheck 用）が production binding に存在することが前提
# 09b-B outputs/phase-12/runbook.md を参照して具体 fire 手順を確定
{
  echo "# post-deploy-healthcheck"
  echo "- checked_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- mechanism: 09b-B silent failure detection"
  echo "- Sentry notification: <verified / not_verified>"
  echo "- Slack notification: <verified / not_verified>"
  echo "- evidence: <Sentry issue URL / Slack message URL>"
} | tee outputs/phase-11/post-deploy-healthcheck.md
```

### evidence（Step 7 全体）

- `outputs/phase-11/production-endpoints.md`
- `outputs/phase-11/smoke-public.md`
- `outputs/phase-11/smoke-member.md`
- `outputs/phase-11/smoke-admin.md`
- `outputs/phase-11/smoke-screenshots/*.png`
- `outputs/phase-11/invariants.md`
- `outputs/phase-11/post-deploy-healthcheck.md`

### 差し戻し先

| 失敗 | 差し戻し |
| --- | --- |
| public 5xx | rollback A / B（user approval） |
| 不変条件 #4 / #11 違反 | 該当 UI wave（07a / 07b） |
| #6 違反（D1Database 検出） | 02c bundle 設定（実 deploy 前 build 時点で検知済みのはず） |
| Sentry / Slack 沈黙 | 09b-A の binding を確認、09b incident runbook へ |

---

## 8. Step 8: 24h verification

### 取得タイミング

Step 7 から 24h 経過後に実行。途中で異常通知が来た場合は incident runbook（09b incident）に従って即対応。

### コマンド / 操作

```bash
# 8.1 sync_jobs の 24h 集計
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod \
  --remote --env production --config apps/api/wrangler.toml \
  --command "SELECT status, COUNT(*) c FROM sync_jobs WHERE started_at >= datetime('now','-1 day') GROUP BY status;" \
  2>&1 | redact_evidence | tee outputs/phase-11/sync-jobs-24h.txt

# 8.2 dashboard 目視 + screenshot（手動）
# - Workers: https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api/production/analytics
#   → outputs/phase-11/24h-metrics-screenshots/workers-requests-<ts>.png
# - D1: https://dash.cloudflare.com/<account>/workers/d1/databases/ubm-hyogo-db-prod/metrics
#   → outputs/phase-11/24h-metrics-screenshots/d1-rows-<ts>.png
# - sync_jobs SQL の terminal screenshot
#   → outputs/phase-11/24h-metrics-screenshots/sync-jobs-<ts>.png

# 8.3 不変条件 #6 を build artifact で再確認
rg "D1Database" apps/web/.open-next/ \
  && echo "violation" \
  || echo "invariant #6 24h re-check PASS" | tee -a outputs/phase-11/invariants.md

# 8.4 不変条件 #14（free-tier 10% threshold）
{
  echo "# 24h verification summary"
  echo "- checked_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- Workers requests / 24h: <runtime-fill> (target < 5k/day, free-tier 10%)"
  echo "- D1 reads / 24h: <runtime-fill> (free-tier reads/day 10%)"
  echo "- D1 writes / 24h: <runtime-fill> (free-tier writes/day 10%)"
  echo "- sync_jobs success: <count>"
  echo "- sync_jobs failed: <count>"
  echo "- Sentry alerts (24h): <count / list>"
  echo "- Slack notifications (24h): <count / list>"
  echo "- screenshots: outputs/phase-11/24h-metrics-screenshots/*.png"
  echo "- invariant #14 PASS / WARN / FAIL: <judgment>"
  echo "- invariant #6 PASS / FAIL: <judgment>"
} | tee outputs/phase-11/24h-verification-summary.md
```

### sanity check

- Workers req < 5k/day（free-tier の 10%）
- D1 reads / writes が無料枠 10% 以下
- `sync_jobs` の `failed` が連続なし
- 24h 内に Sentry 緊急 issue / Slack incident なし

### evidence

- `outputs/phase-11/sync-jobs-24h.txt`
- `outputs/phase-11/24h-metrics-screenshots/workers-requests-<ts>.png`
- `outputs/phase-11/24h-metrics-screenshots/d1-rows-<ts>.png`
- `outputs/phase-11/24h-metrics-screenshots/sync-jobs-<ts>.png`
- `outputs/phase-11/24h-verification-summary.md`

### 差し戻し先

| 失敗 | 差し戻し |
| --- | --- |
| metrics threshold 超過 | cron 頻度低下 / SQL 最適化（03b / 09b） |
| 沈黙 / Sentry-Slack 通知未到達 | 09b-A binding を確認、incident runbook |
| 不変条件 #14 / #6 違反 | rollback 検討（A/B）と並行で incident |

---

## 9. Rollback 手順（user approval 必須）

> **重要**: `apps/web` から D1 を直接操作する rollback は不変条件 #6 違反のため **禁止**。D1 操作は常に `bash scripts/cf.sh d1` 経由で `apps/api` の wrangler.toml を使う。

### A. API Worker rollback

```bash
# 直前 deploy id を取得
bash scripts/cf.sh deployments list \
  --config apps/api/wrangler.toml --env production \
  | head -20 | tee outputs/phase-11/api-deployments-list.txt

# user approval を確認後
bash scripts/cf.sh rollback <prev-version-id> \
  --config apps/api/wrangler.toml --env production \
  2>&1 | tee outputs/phase-11/rollback-api.md

# smoke 再実行（Step 7.2）
curl -sI "${PRODUCTION_API}/healthz" | head -1 | tee -a outputs/phase-11/rollback-api.md
```

- sanity: 1〜2 分以内に旧版が応答
- evidence: `outputs/phase-11/rollback-api.md`
- 注意: rollback で `[triggers]` も旧版に戻る。cron schedule を変更していた場合は手動 fix

### B. Web Worker rollback

```bash
# 直前 deploy id を取得（apps/web は ubm-hyogo-web-production）
bash scripts/cf.sh deployments list \
  --config apps/web/wrangler.toml --env production \
  | head -20 | tee outputs/phase-11/web-deployments-list.txt

bash scripts/cf.sh rollback <prev-version-id> \
  --config apps/web/wrangler.toml --env production \
  2>&1 | tee outputs/phase-11/rollback-web.md

# smoke 再実行
curl -sI "${PRODUCTION_WEB}/" | head -1 | tee -a outputs/phase-11/rollback-web.md
```

- sanity: production URL で前バージョンの content
- evidence: `outputs/phase-11/rollback-web.md`
- 注意: secret は rollback 対象外（手動管理）

### C. D1 migration rollback（forward fix）

破壊的直接 SQL は禁止。常に forward 互換 fix migration を作成する。

```bash
# fix migration を作成
bash scripts/cf.sh d1 migrations create ubm-hyogo-db-prod fix_<issue> \
  --config apps/api/wrangler.toml --env production

# fix migration を編集して D1 を整える（spec/15 ガイドライン準拠）

# apply（user approval 必須、G-2 と同等）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod \
  --remote --env production --config apps/api/wrangler.toml \
  2>&1 | tee outputs/phase-11/rollback-d1.md

# 確認
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod \
  --remote --env production --config apps/api/wrangler.toml \
  | tee -a outputs/phase-11/rollback-d1.md
```

- 緊急時は `d1 export` で現状を `outputs/phase-11/d1-backup-incident-<ts>.sql` に取り、Step 3.1 backup と差分比較
- evidence: `outputs/phase-11/rollback-d1.md`

### D. release tag 取消（緊急のみ）

```bash
TAG=v<YYYYMMDD-HHMM>
git tag -d "$TAG"
git push origin --delete "$TAG"

# 別 HHMM で再発行
NEW_TAG="v$(date -u +%Y%m%d-%H%M)"
git tag -a "$NEW_TAG" -m "Production release ${NEW_TAG} (replaces ${TAG})"
git push origin "$NEW_TAG"
```

- 通常運用では tag は immutable。incident 時のみ別 tag を打ち直し（`outputs/phase-11/release-tag.txt` を更新）

---

## 10. evidence ファイル一覧（`outputs/phase-11/`）

```
outputs/phase-11/
├── main.md
├── user-approval-log.md
├── upstream-green-evidence.md
├── main-merge-commit.txt
├── main-merge-log.txt
├── cf-whoami.txt
├── d1-backup-<ts>.sql
├── d1-backup-<ts>.log
├── d1-migrations-list-before.txt
├── d1-apply.log
├── d1-migrations-apply.txt
├── d1-migrations-list-after.txt
├── d1-migrations-diff.txt
├── api-typecheck.log
├── api-deploy.log
├── api-version.md
├── web-build.log
├── web-deploy.log
├── web-version.md
├── invariants.md
├── release-tag.txt
├── production-endpoints.md
├── smoke-public.md
├── smoke-member.md
├── smoke-admin.md
├── smoke-screenshots/
│   ├── public-home-<ts>.png
│   ├── public-members-list-<ts>.png
│   ├── public-member-detail-<ts>.png
│   ├── auth-login-<ts>.png
│   ├── member-profile-<ts>.png
│   ├── admin-dashboard-<ts>.png
│   ├── admin-members-<ts>.png
│   ├── admin-tags-<ts>.png
│   ├── admin-schema-<ts>.png
│   └── admin-meetings-<ts>.png
├── post-deploy-healthcheck.md
├── sync-jobs-24h.txt
├── 24h-verification-summary.md
├── 24h-metrics-screenshots/
│   ├── workers-requests-<ts>.png
│   ├── d1-rows-<ts>.png
│   └── sync-jobs-<ts>.png
└── rollback-{api,web,d1}.md   # 発生時のみ
```

`<ts>` は ISO 互換 `YYYYMMDD-HHMM`。

---

## 11. step → AC mapping（Phase 7 で再利用）

| Step | 該当 AC | 主 evidence |
| --- | --- | --- |
| Step 1 (preflight) | AC-1（前提） | upstream-green-evidence.md, user-approval-log.md |
| Step 2 (main 昇格) | AC-1 | main-merge-commit.txt |
| Step 3 (D1 migration) | AC-2 | d1-migrations-* + d1-backup-<ts>.sql |
| Step 4 (API deploy) | AC-3 | api-deploy.log + api-version.md |
| Step 5 (Web deploy) | AC-3, AC-4（不変 #6 build 検証） | web-deploy.log + web-version.md + invariants.md |
| Step 6 (release tag) | AC-5 | release-tag.txt |
| Step 7 (smoke) | AC-4 | smoke-*.md + smoke-screenshots/ + invariants.md + post-deploy-healthcheck.md |
| Step 8 (24h) | AC-5（不変 #14） | 24h-verification-summary.md + 24h-metrics-screenshots/ |

---

## 12. 完了条件（runbook 全体）

- [ ] Step 1〜8 のすべての evidence が `outputs/phase-11/` に揃う
- [ ] `user-approval-log.md` に G-1〜G-5 の scoped `状態: approved` entry が揃う（rollback を含む場合は G-R も）
- [ ] AC-1〜AC-5 の evidence が citation 可能な状態
- [ ] `wrangler` 直接実行が log に登場しない
- [ ] secret 値が evidence に含まれない（grep で確認）
