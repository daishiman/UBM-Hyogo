# manual-operations — 残りの手動作業 手順書

ci-staging-deploy-failure-fix workflow のうち、Claude / CI 側で自動化できず **ユーザー本人の手動操作が必須** な作業を、上から順に実行すれば次タスクに進める粒度で記述する。

- 対象 task: `task-02-cf-api-token-d1-permission-restore`（外部リソース操作）+ task-01 / task-02 共通の Phase 13（commit / push / PR / CI 確認）
- 想定所要時間: 30〜45 分
- 正本: [`./index.md`](./index.md) / [`./outputs/task-02-cf-api-token-d1-permission-restore/spec.md`](./outputs/task-02-cf-api-token-d1-permission-restore/spec.md) / [`./outputs/task-02-cf-api-token-d1-permission-restore/runbook.md`](./outputs/task-02-cf-api-token-d1-permission-restore/runbook.md)

---

## 全体フロー

```
STEP 0  .env の op 参照 path が _STAGING を指しているか確認  （ターミナル・前提条件）
STEP 1  Cloudflare Dashboard で staging token 発行         （ブラウザ・ユーザー）
STEP 2  STEP 1 の値を 1Password に保管                     （ブラウザ・ユーザー）
STEP 3  Cloudflare Dashboard で production token 発行      （ブラウザ・ユーザー）
STEP 4  STEP 3 の値を 1Password に保管                     （ブラウザ・ユーザー）
STEP 5  GitHub Secret (staging) を新 token で更新           （ターミナル・ユーザー入力）
STEP 6  GitHub Secret (production) を新 token で更新        （ターミナル・ユーザー入力）
STEP 7  ローカル CLI 検証 3 種                              （ターミナル）
STEP 8  task-01 / task-02 の commit                        （Claude に依頼可）
STEP 9  push & PR 作成 (dev base)                          （Claude に依頼可）
STEP 10 CI green 確認 & 旧 token 削除                       （ブラウザ + ターミナル）
STEP 11 DoD チェックリスト確認 & workflow を closed 化       （Claude に依頼可）
```

---

## STEP 0 — `.env` の op 参照 path 確認（前提条件・必須）

> 2026-05-20 のインシデント: `.env` の `CLOUDFLARE_API_TOKEN` 行が古い field（サフィックス無しの `CLOUDFLARE_API_TOKEN`）を参照していたため、1Password で `CLOUDFLARE_API_TOKEN_STAGING` を更新しても wrangler は古い `cfk_` 形式 token を引き続けて 9109 / 10000 を返し続けた。STEP 1 以降を実行する前にここで一度確定させる。

```bash
grep -n CLOUDFLARE_API_TOKEN .env
```

期待行:

```
CLOUDFLARE_API_TOKEN="op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING"
```

異なる path（例: サフィックス無し `CLOUDFLARE_API_TOKEN` / 古い `CF_TOKEN_D1_STAGING` / `op://Private/Cloudflare（senpai）/password` 等）になっていたらエディタで上記に書き換えて保存。

検証:

```bash
bash scripts/with-env.sh bash -c 'echo "head=${CLOUDFLARE_API_TOKEN:0:6} len=${#CLOUDFLARE_API_TOKEN}"'
```

期待: `head=cfut_` で始まる（新形式 User API Token）/ `len=53` 前後。`cfk_` で始まる場合は古い field を引いているので `.env` 修正が完了していない。

> 完了条件: `grep -n CLOUDFLARE_API_TOKEN .env` が `_STAGING` サフィックス付きの op 参照を返し、`with-env.sh` 経由の値が `cfut_` で始まること

---

## STEP 1 — Cloudflare Dashboard で staging 用 API Token 発行

1. ブラウザで <https://dash.cloudflare.com/profile/api-tokens> を開く
2. 右上 `Create Token` → 一番下の `Custom token` 横の `Get started` をクリック
3. **Token name**: `ubm-hyogo-ci-staging-2026-05-20`
4. **Permissions**（3 行を `+ Add more` で追加）:

   | Type | Resource | Access |
   |------|----------|--------|
   | Account | D1 | Edit |
   | Account | Workers Scripts | Edit |
   | Account | Account Settings | Read |

   ※ `User → User Details`、`Workers KV`、`Workers Routes` は **追加しない**（spec §5.1 最小権限方針）

5. **Account Resources**: `Include` → `Specific account` → `ubm-hyogo`（Account ID 末尾 `...c455475` のもの）のみ選択
6. **Zone Resources**: 設定欄が出る場合は `All zones from an account` を選んだうえで Account を上記のみに制限（Zone 操作はしないが UI が必須化する場合がある。出ない場合は不要）
7. **Client IP Address Filtering**: 空のまま（GitHub Actions runner IP は固定不可）
8. **TTL**: `Start Date` 今日 / `End Date` **2026-08-18（90 日後）**
9. `Continue to summary` → 内容確認 → `Create Token`
10. 表示された **Token 値**（`xxxx...` の 40 文字程度）をコピー。**この画面を閉じたら再表示不可** — 次の STEP 2 を必ず先に完了する

> 完了条件: Token 値がクリップボードにある状態

---

## STEP 2 — staging token を 1Password に保管

1Password の正本構造（2026-05-20 時点 / スクショで実機確認済み）:

| Vault | Item | Field | 用途 |
|-------|------|-------|------|
| `Employee` | `ubm-hyogo-env` | `CLOUDFLARE_API_TOKEN_STAGING` | staging 用 token |
| `Employee` | `ubm-hyogo-env` | `CLOUDFLARE_API_TOKEN_PRODUCTION` | production 用 token |

op 参照 path:

```
op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING
op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_PRODUCTION
```

すでに environment 単位で field 分離済みなので、**既存 field を新値で上書き** するだけ（新 field 追加不要）。

### 手順

1. 1Password を開き、`Employee` Vault → `ubm-hyogo-env` Item を選ぶ
2. `編集` をクリック
3. **`CLOUDFLARE_API_TOKEN_STAGING`** field を STEP 1 でコピーした staging token 新値で上書き
4. メモ欄に以下 1 行を追記:
   ```
   2026-05-20: staging token rotated → ubm-hyogo-ci-staging-2026-05-20 (TTL 2026-08-18)
   ```
5. `保存`
6. ターミナルで疎通確認:
   ```bash
   bash scripts/cf.sh whoami
   ```
   期待: `Account ID` 行に `b3dde7be1cd856788fc47595ac455475` が表示される。`code 9109` などが出たら STEP 1 の値コピーに失敗しているので再発行から。

> 完了条件: `scripts/cf.sh whoami` が成功

---

## STEP 3 — Cloudflare Dashboard で production 用 API Token 発行

STEP 1 と同じ手順で、以下だけ変更:

- **Token name**: `ubm-hyogo-ci-production-2026-05-20`
- Permissions / Account Resources / TTL は STEP 1 と完全同一

発行後の token 値をコピーして STEP 4 へ。

---

## STEP 4 — production token を 1Password に保管

1. `Employee` Vault → `ubm-hyogo-env` Item を `編集`
2. **`CLOUDFLARE_API_TOKEN_PRODUCTION`** field を STEP 3 でコピーした production token 新値で上書き
3. メモ欄に追記:
   ```
   2026-05-20: production token rotated → ubm-hyogo-ci-production-2026-05-20 (TTL 2026-08-18)
   ```
4. `保存`

> `scripts/cf.sh` は default で `CLOUDFLARE_API_TOKEN_STAGING` を引く設計のため、ローカル運用は staging token のままで OK。production を直接叩く場合のみ `op read 'op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_PRODUCTION'` で別 field を取得する。

> 完了条件: `ubm-hyogo-env` の `CLOUDFLARE_API_TOKEN_STAGING` / `CLOUDFLARE_API_TOKEN_PRODUCTION` 両 field が新値に更新されている

---

## STEP 5 — GitHub Secret (staging) を更新

ターミナルで以下を実行（このワークツリーから OK）:

```bash
gh secret set CLOUDFLARE_API_TOKEN --env staging --repo daishiman/UBM-Hyogo
```

`? Paste your secret:` プロンプトが出たら **STEP 1 の staging token 値**（1Password の `CLOUDFLARE_API_TOKEN_STAGING` field から再コピーしてもよい）を貼り付けて Enter。

確認:

```bash
gh secret list --env staging --repo daishiman/UBM-Hyogo
```

期待: `CLOUDFLARE_API_TOKEN` 行の `Updated` が「数秒前」になっている。

---

## STEP 6 — GitHub Secret (production) を更新

```bash
gh secret set CLOUDFLARE_API_TOKEN --env production --repo daishiman/UBM-Hyogo
```

プロンプトに **STEP 3 の production token 値** を貼り付け（1Password の `CLOUDFLARE_API_TOKEN_PRODUCTION` field から取得）。

確認:

```bash
gh secret list --env production --repo daishiman/UBM-Hyogo
```

> 完了条件: 両 environment の `Updated` 列が直近になっている

---

## STEP 7 — ローカル CLI 検証 3 種

ワークツリー root で順に実行:

```bash
# 7-1 auth + account ID 突合
bash scripts/cf.sh whoami
# 期待: Account ID = b3dde7be1cd856788fc47595ac455475

# 7-2 D1:Edit scope 確認（--config と --remote は必須）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging \
  --config apps/api/wrangler.toml --env staging --remote
# 期待: migration 一覧 or "No migrations to apply." / 401・403 が出ないこと
# 注: --config を省略するとワークツリー root cwd で "No configuration file found"、
#     --remote を省略すると local D1 を見て scope 検証として機能しない

# 7-3 Workers Scripts:Edit scope 確認 (dry-run)
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run --outdir=/tmp/cf-dryrun
# 期待: bundle 生成成功・API 認証エラーなし（実 deploy はしない）
```

いずれかが失敗したら STEP 1 の Permissions 設定を見直す。3 つ全部成功するまで STEP 8 に進まない。

> 完了条件: 3 コマンド全て exit 0 で成功

---

## STEP 8 — task-01 / task-02 のコミット

Claude に「STEP 8 進めて」と依頼。差分内容に応じて 2 コミットに分割する:

- commit 1: `feat(ci): inject build-time env for OpenNext bundle (task-01)`
  - 含むファイル: `.github/workflows/web-cd.yml` / `apps/web/src/lib/seo/site-metadata.ts` / `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` / `apps/web/src/lib/__tests__/build-time-env.spec.ts` / `apps/web/wrangler.toml`
- commit 2: `docs(workflow): ci-staging-deploy-failure-fix spec/runbook + skill sync (task-02)`
  - 含むファイル: `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/` 全部 / `.claude/skills/aiworkflow-requirements/**` の今回差分 / `docs/30-workflows/unassigned-task/ci-staging-deploy-failure-fix-followup-003-secrets-management-split.md`

実行前に Claude 側で以下 pre-flight を走らせて通過を確認する:

```bash
pnpm install --force
pnpm typecheck
pnpm lint
bash scripts/verify-pr-ready.sh
```

> 完了条件: `git status --porcelain` が空・`git log` に上記 2 件が積まれている

---

## STEP 9 — push & PR 作成 (base: dev)

Claude に「STEP 9 進めて」と依頼:

```bash
git fetch origin dev
git merge origin/dev          # conflict があれば pnpm sync:resolve 経由で解消
git push -u origin feat/ci-staging-deploy-failure-fix-spec
gh pr create --base dev \
  --title "fix(ci): staging deploy failure — web build env + cf token rotation" \
  --body @<(implementation-guide から生成)
```

PR body は `outputs/task-01-*/phase-12/implementation-guide.md` と `outputs/task-02-*/phase-12/implementation-guide.md` を統合して生成。

> 完了条件: PR URL が返ってくる

---

## STEP 10 — CI 確認 & 旧 token 削除

### 10-1 CI 監視（ターミナル）

```bash
gh pr checks --watch
# または
gh run watch
```

確認対象 job:

| workflow | job | 期待 |
|----------|-----|------|
| `web-cd` | `deploy-staging` | `Build web app (OpenNext Workers bundle)` step success |
| `backend-ci` | `deploy-staging` | `Apply D1 migrations` step success（`code 10000` が出ない）|
| `runtime-smoke-staging` | `smoke` | 連鎖 success |

### 10-2 staging Worker への HTTP 確認

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://staging.ubm-hyogo.workers.dev/
# 期待: 200
```

URL が異なる場合は `apps/web/wrangler.toml [env.staging]` の `routes` / `workers_dev` で確認。

### 10-3 旧 token を Cloudflare Dashboard で Delete

1. <https://dash.cloudflare.com/profile/api-tokens> を再度開く
2. 一覧に残っている **旧 token**（命名規約 `ubm-hyogo-ci-staging-2026-05-20` / `ubm-hyogo-ci-production-2026-05-20` 以外）の `…` → `Delete`
3. 削除前に `Last used` の時刻を確認（直近 5 分以内に使われていないこと = STEP 5/6 で新値に置き換わっていることの傍証）
4. 確認ダイアログで `Delete` を確定

> 完了条件: Dashboard に残る token が `ubm-hyogo-ci-staging-2026-05-20` と `ubm-hyogo-ci-production-2026-05-20` の 2 つだけになる

---

## STEP 11 — DoD 確認 & workflow を closed 化

Claude に「STEP 11 進めて」と依頼すると以下を実施:

1. `outputs/task-02-cf-api-token-d1-permission-restore/spec.md` §10 の DoD チェックリストを全 ✅ に更新
2. `index.md` のメタを以下に更新:
   - `[workflow_state: PASS_BOUNDARY_SYNCED_RUNTIME_PENDING]` → `[workflow_state: CLOSED]`
   - `[implementation_status: task-01_implemented_local_task-02_external_ops_pending]` → `[implementation_status: closed]`
   - `[Phase 13: pending_user_approval...]` → `[Phase 13: completed_<実行日>]`
3. PR をマージ、または追加 commit を push して green を再確認
4. `docs/30-workflows/unassigned-task/ci-staging-deploy-failure-fix-followup-003-secrets-management-split.md` の取り扱い（次サイクルへ）を確認

> 完了条件: PR がマージされ、`index.md` が CLOSED 状態

---

## 典型トラブルと対処

| 症状 | 原因候補 | 対処 |
|------|---------|------|
| STEP 1 で Permissions の選択肢が見つからない | dashboard UI 改変 / アカウント権限不足 | スクショ共有 → 代替パス案内 |
| STEP 2 / 7-1 で `Authentication error [code: 9109]` | (a) 1Password に貼り付けた token 値の copy ミス / 改行混入 (b) `.env` の op 参照が `_STAGING` ではなく古い field を指している | (a) STEP 1 から再発行（旧 token は STEP 10-3 まで残す） (b) **まず STEP 0 を再確認**。`bash scripts/with-env.sh bash -c 'echo ${CLOUDFLARE_API_TOKEN:0:6}'` の出力が `cfut_` で始まらなければ `.env` 修正 |
| `/user/tokens/verify` は success だが wrangler whoami は 9109 | `.env` の op 参照と 1Password の更新先 field がズレている（典型的な誤検知パターン）| `op read` で得る値と `with-env.sh` 経由で得る値の頭 6 文字を比較。一致しなければ `.env` を `_STAGING` 参照に修正 |
| STEP 7-2 で `code 10001` / 403 | token の Account Resources が `Include → Specific account` になっていない | STEP 1 の §5 を再確認し token を Edit |
| STEP 7-3 で `Authentication error` | Workers Scripts:Edit scope 未付与 | STEP 1 の Permissions を再確認 |
| STEP 8 で `pnpm verify-pr-ready` 失敗 | gate-metadata / verify:phase12-compliance / indexes drift | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 を参照 |
| STEP 10-1 で `backend-ci / deploy-staging` が再 fail | 新 token の D1:Edit scope 不足 | runbook §2.3 (b) で切り分け |

---

## 関連リンク

- workflow root: [`./index.md`](./index.md)
- task-01 spec: [`./outputs/task-01-web-build-env-injection/spec.md`](./outputs/task-01-web-build-env-injection/spec.md)
- task-02 spec: [`./outputs/task-02-cf-api-token-d1-permission-restore/spec.md`](./outputs/task-02-cf-api-token-d1-permission-restore/spec.md)
- task-02 runbook: [`./outputs/task-02-cf-api-token-d1-permission-restore/runbook.md`](./outputs/task-02-cf-api-token-d1-permission-restore/runbook.md)
- CLAUDE.md §Cloudflare 系 CLI 実行ルール / §シークレット管理
- Cloudflare docs: <https://developers.cloudflare.com/fundamentals/api/get-started/create-token/>
