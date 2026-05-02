# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09c-serial-production-deploy-and-post-release-verification |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 9 |
| Mode | serial（最終） |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | spec_created |

## 目的

production deploy 13 ステップを `outputs/phase-05/production-deploy-runbook.md` に、release tag 付与手順を `outputs/phase-05/release-tag-script.md` に、コピペ可能な command + 擬似コード + sanity check 付きで固定する。本タスクは spec_created なので実コマンドは placeholder（実 account id / commit hash / tag は本番で埋める）。

## 実行タスク

1. production-deploy-runbook.md 13 ステップ完成
2. release-tag-script.md（`vYYYYMMDD-HHMM` 生成 + push）完成
3. sanity check（各ステップ後）の記述
4. 09a / 09b との用語統一

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler / D1 / secrets / triggers |
| 必須 | docs/30-workflows/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-05.md | staging runbook（用語統一） |
| 必須 | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-05.md | release runbook 擬似 |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-02.md | 13 ステップ設計 |

## 実行手順

### ステップ 1: production-deploy-runbook.md 13 ステップ
- `outputs/phase-05/production-deploy-runbook.md` を作成

### ステップ 2: release-tag-script.md
- `outputs/phase-05/release-tag-script.md` を作成

### ステップ 3: sanity check 記述

### ステップ 4: 用語統一

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | failure case を runbook ステップに紐付け |
| Phase 11 | runbook 走破 evidence を取得 |
| 上流 09a | staging runbook を引用 |
| 上流 09b | release runbook + incident runbook を引用 |

## 多角的チェック観点（不変条件）

- #4: runbook の smoke step に `/profile` の編集 form 不在チェックを含める
- #5: runbook に `apps/web` から D1 直接アクセスの操作を含めない
- #10: runbook の 24h verify step に Cloudflare Analytics URL を含める
- #11: runbook の smoke step に admin UI の本文編集 form 不在チェックを含める
- #15: runbook の post-release step に attendance 重複 SQL を含める

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | production-deploy-runbook.md | 5 | pending | 13 ステップ |
| 2 | release-tag-script.md | 5 | pending | `vYYYYMMDD-HHMM` |
| 3 | sanity check | 5 | pending | 各ステップ |
| 4 | 用語統一 | 5 | pending | 09a / 09b と統一 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | runbook サマリ |
| ランブック | outputs/phase-05/production-deploy-runbook.md | 13 ステップ |
| ランブック | outputs/phase-05/release-tag-script.md | tag 付与手順 |
| メタ | artifacts.json | Phase 5 を completed に更新 |

## 完了条件

- [ ] 13 ステップが完成
- [ ] release tag script が完成
- [ ] 各 sanity check 記載
- [ ] 09a / 09b との用語統一

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 3 ファイル配置済み
- artifacts.json の phase 5 を completed に更新

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: 13 ステップ runbook + tag script
- ブロック条件: いずれかが未完成で次 Phase に進まない

## production-deploy-runbook（13 ステップ）

### Step 1: main promotion precondition

```bash
# 前提: 本仕様書の dev PR が merge 済みで、別運用の dev → main 昇格 PR が CI green の状態
# production deploy 実行タスクで明示承認を受けてから main 昇格を merge する
gh pr merge <dev_to_main_pr_number> --squash --delete-branch=false
git fetch origin main
git checkout main
git pull origin main
git log --oneline -1
# expected: dev からの最新 squash commit
```

- sanity: `git log` で最新 commit が想定通り
- 差し戻し: PR が approve されていない場合 09a / 09b の AC 再確認

### Step 2: pre-deploy check（09a / 09b の AC matrix 再確認）

```bash
cat docs/30-workflows/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/artifacts.json | jq '.phases[] | select(.status != "completed")'
cat docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/artifacts.json | jq '.phases[] | select(.status != "completed")'
# expected: 両方とも空（全 phase completed）
```

- sanity: `[]` 出力
- 差し戻し: pending 残ありなら該当 task に戻る

### Step 3: D1 backup（production）

```bash
TS=$(date +%Y%m%d-%H%M)
bash scripts/cf.sh d1 export ubm_hyogo_production \
  --remote \
  --output="backup-production-${TS}.sql" \
  --env production \
  --config apps/api/wrangler.toml
ls -la backup-production-${TS}.sql
```

- sanity: backup ファイルがサイズ > 0 で生成される
- 差し戻し: D1 export エラーは Cloudflare Status を確認

### Step 4: D1 migration list（production）

```bash
bash scripts/cf.sh d1 migrations list ubm_hyogo_production \
  --remote \
  --env production \
  --config apps/api/wrangler.toml
# expected: 全 migration が Applied
```

- sanity: 出力末尾の "Applied" カウントが migration ファイル総数と一致
- 差し戻し: 差分があれば Step 5 で適用

### Step 5: D1 migration apply（production）

```bash
bash scripts/cf.sh d1 migrations apply ubm_hyogo_production \
  --remote \
  --env production \
  --config apps/api/wrangler.toml
# expected: applied 件数が 0 または 1 件以上、エラーなし
```

- sanity: `bash scripts/cf.sh d1 migrations list` 再実行で全 Applied
- 差し戻し: migration 失敗時は backup から戻す（緊急 SQL は spec/15 で禁止 → 後方互換 fix migration を作成）

### Step 6: secrets check

```bash
bash scripts/cf.sh secret list --env production --config apps/api/wrangler.toml
# expected: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_FORM_ID, MAIL_PROVIDER_KEY

bash scripts/cf.sh pages secret list --project-name ubm-hyogo-web
# expected: AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
```

- sanity: 必須 7 種すべて存在
- 差し戻し: 不足があれば 04 infra へ（secret 登録 task）

### Step 7: api worker deploy

```bash
pnpm --filter @ubm/api deploy:production
# 内部的に: bash scripts/cf.sh deploy --env production --config apps/api/wrangler.toml
```

- sanity: `Deployed ubm-hyogo-api triggers ...` 出力 + exit 0
- 差し戻し: build error は該当 source code を 03 / 04 へ

### Step 8: web pages deploy

```bash
pnpm --filter @ubm/web deploy:production
# 内部的に: pnpm build && bash scripts/cf.sh pages deploy .vercel/output --project-name ubm-hyogo-web --branch main
```

- sanity: `Success! Uploaded ...` + production URL が表示
- 差し戻し: 02c の `@opennextjs/cloudflare` 設定を再確認

### Step 9: 10 ページ smoke

```bash
PRODUCTION_API="https://ubm-hyogo-api.<account>.workers.dev"
PRODUCTION_WEB="https://ubm-hyogo-web.pages.dev"

# 公開 3 ページ
curl -sI "${PRODUCTION_WEB}/" | head -1
curl -sI "${PRODUCTION_WEB}/members" | head -1
curl -sI "${PRODUCTION_WEB}/members/sample-id" | head -1

# 認証入口
curl -sI "${PRODUCTION_WEB}/login" | head -1

# 認証必須（curl では 302 / 認証無し は /login redirect）
curl -sI "${PRODUCTION_WEB}/profile" | head -1
curl -sI "${PRODUCTION_WEB}/admin" | head -1
curl -sI "${PRODUCTION_WEB}/admin/members" | head -1
curl -sI "${PRODUCTION_WEB}/admin/tags" | head -1
curl -sI "${PRODUCTION_WEB}/admin/schema" | head -1
curl -sI "${PRODUCTION_WEB}/admin/meetings" | head -1
```

- sanity: public 3 + login が 200、protected 6 が 302 (Auth.js redirect)
- 認証後の手動確認: ブラウザで Google OAuth → `/profile` 編集 form 不在 / `/admin/*` admin role で 200

### Step 10: manual sync trigger

```bash
# admin role の session cookie が必要（手動取得）
COOKIE='__Secure-authjs.session-token=...'

curl -X POST "${PRODUCTION_API}/admin/sync/schema" \
  -H "Cookie: ${COOKIE}" \
  -H "Content-Type: application/json"
# expected: 200, body { "jobId": ..., "status": "success" }

curl -X POST "${PRODUCTION_API}/admin/sync/responses" \
  -H "Cookie: ${COOKIE}" \
  -H "Content-Type: application/json"
# expected: 200, body { "jobId": ..., "status": "success" }

# sync_jobs 確認
bash scripts/cf.sh d1 execute ubm_hyogo_production \
  --command "SELECT id, type, status, started_at, finished_at FROM sync_jobs ORDER BY started_at DESC LIMIT 2;" \
  --remote --env production --config apps/api/wrangler.toml
# expected: 2 行、status='success'
```

- sanity: sync_jobs に `success` 2 行
- 差し戻し: failed なら 03a / 03b へ

### Step 11: release tag 付与（→ release-tag-script.md 参照）

```bash
bash docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-05/release-tag-script.md
```

- sanity: `git tag` で `vYYYYMMDD-HHMM` が表示、`git ls-remote --tags origin | grep vYYYYMMDD-HHMM` で remote にあり

### Step 12: incident response runbook 共有

```bash
# 共有先（placeholder）
# - Slack: #ubm-hyogo-prod-incident
# - Email: admin@ubm-hyogo.example
# 共有内容: incident-response-runbook.md（09b 成果物）の URL + production URL + release tag

# 共有後、share-evidence.md に
# - 共有日時
# - 共有先（実値: Slack channel name / Email recipient）
# - 共有内容（URL / tag）
# - 受領確認（Slack reaction / Email reply）
# を記載
```

- sanity: `outputs/phase-11/share-evidence.md` に少なくとも Slack post URL もしくは Email 送信ログのスクリーンショット名が記載
- 差し戻し: 受領未確認の場合は再送

### Step 13: 24h post-release verify

```bash
# 24h 後、Cloudflare Analytics dashboard を click 確認
# - Workers req: https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api/production/analytics
#   - expected: req < 5k/day
# - D1 metrics: https://dash.cloudflare.com/<account>/d1/databases/ubm_hyogo_production/metrics
#   - expected: reads / writes が 5GB / 500k reads/day の 10% 以下

# 不変条件 #5 再確認（web bundle に D1 import なし）
rg "D1Database" apps/web/.vercel/output/ || echo "no D1 import in web bundle: PASS"

# 不変条件 #15 再確認（attendance 重複防止 / 削除済み除外）
bash scripts/cf.sh d1 execute ubm_hyogo_production \
  --command "SELECT session_id, member_id, COUNT(*) c FROM attendances WHERE deleted_at IS NULL GROUP BY session_id, member_id HAVING c > 1;" \
  --remote --env production --config apps/api/wrangler.toml
# expected: 0 行
```

- sanity: 全 metric が無料枠 10% 以下、不変条件 #5 / #15 PASS
- 差し戻し: metric 超過なら cron 頻度低下 / query 最適化検討

## release-tag-script（spec / 擬似）

```bash
#!/usr/bin/env bash
set -euo pipefail

# 引数チェック
if [ -n "${1:-}" ]; then
  TAG="$1"
else
  TAG="v$(date +%Y%m%d-%H%M)"
fi

# 形式チェック（vYYYYMMDD-HHMM）
if ! [[ "$TAG" =~ ^v[0-9]{8}-[0-9]{4}$ ]]; then
  echo "ERROR: tag format must be vYYYYMMDD-HHMM (e.g., v20260426-1530)" >&2
  exit 1
fi

# main 最新 commit 確認
git fetch origin main
git checkout main
git pull origin main
COMMIT=$(git rev-parse HEAD)
echo "Tagging commit: ${COMMIT}"

# tag 付与
git tag -a "$TAG" -m "Production release ${TAG}"

# push
git push origin "$TAG"

# 確認
git ls-remote --tags origin | grep "$TAG" || (echo "ERROR: tag not on remote" >&2; exit 1)

echo "SUCCESS: Tag ${TAG} pushed for commit ${COMMIT}"
```

- sanity: 出力に `SUCCESS: Tag vYYYYMMDD-HHMM pushed`
- 差し戻し: tag 形式エラーは引数を再確認、push 失敗は GitHub access 確認
- 注意: tag は immutable に扱う（同名 tag を上書きしない、上書き時は別の HHMM で打ち直し）

## 各ステップ後の sanity check（共通）

- secret を log に出力していないか
- production と staging を取り違えていないか
- artifacts.json に途中状態を反映したか
- 09a / 09b の runbook と用語が揃っているか
- backup ファイルを安全な場所に保管したか（ローカル only、リポジトリ commit 禁止）
