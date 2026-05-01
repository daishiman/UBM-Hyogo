# Phase 11: 手動 smoke (production)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09c-serial-production-deploy-and-post-release-verification |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke (production) |
| Wave | 9 |
| Mode | serial（最終） |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | template_complete_pending_runtime_user_approval |
| 承認 | **user 承認必須（production deploy 直前の 2 段目 approval gate）** |

## 目的

Phase 10 で GO 判定された production 環境（`ubm-hyogo-web` / `ubm-hyogo-api` / `ubm_hyogo_production`）に対して、phase-05 の 13 ステップ deploy runbook を実行するための evidence template を固定する。実 production 10 ページ smoke + 認可境界 + 手動 sync + release tag 付与 + incident response runbook 共有 + 24h post-release verify は、Phase 13 後に `task-09c-production-deploy-execution-001.md` で明示承認を受けてから実行する。**production への取り消し不可な操作（migration / deploy / tag push）が含まれるため、本 Phase は未承認の間 `pending_user_approval` とする**。

## 実行タスク

1. `outputs/phase-11/production-smoke-runbook.md` を作成（phase-05 の 13 ステップ実行記録）
2. screenshot evidence を `outputs/phase-11/playwright-production/` に保存（10 ページ × 2 profile）
3. sync_jobs SELECT 結果を `outputs/phase-11/sync-jobs-production.json` に保存
4. bash scripts/cf.sh tail 出力を `outputs/phase-11/wrangler-tail-production.log` に保存（30 分）
5. `outputs/phase-11/release-tag-evidence.md` を作成（tag commit hash + remote URL）
6. `outputs/phase-11/share-evidence.md` を作成（incident runbook 共有記録）
7. 24h 後の `outputs/phase-11/post-release-24h-evidence.md` 作成（Cloudflare Analytics screenshot + SQL 結果）
8. manual evidence checklist で全項目チェック

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-05.md | runbook 13 ステップ |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-06.md | failure case + rollback |
| 必須 | docs/00-getting-started-manual/specs/09-ui-ux.md | UI 検証マトリクス |
| 必須 | docs/30-workflows/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11/ | staging smoke evidence（参考） |
| 必須 | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/incident-response-runbook.md | incident runbook 本体 |

## 実行手順

### ステップ 0: user 承認 gate（2 段目）
- production deploy / migration / tag push を実施する前に user に明示的に承認を求める
- **未承認の間は production deploy を実行しない**

### ステップ 1: production-smoke-runbook 作成
- phase-05 の 13 ステップを実行記録形式で書き留める
- 各ステップの開始 / 終了時刻、出力 placeholder、判定（PASS / FAIL）

### ステップ 2: screenshot 保存
- desktop（1280x800）/ mobile（375x812）profile で 10 ページ × 2 = 20 枚
- AuthGateState 5 状態（input / sent / unregistered / rules_declined / deleted）も追加

### ステップ 3: sync_jobs dump
- `bash scripts/cf.sh d1 execute ubm_hyogo_production --command "SELECT ..."` の JSON 出力

### ステップ 4: bash scripts/cf.sh tail
- `bash scripts/cf.sh tail --env production --config apps/api/wrangler.toml` を 30 分回し log を保存
- 取扱注意: log に session token 等が出力されないことを事前確認

### ステップ 5: release tag evidence
- `git rev-parse HEAD` の commit hash
- `git ls-remote --tags origin | grep <tag>` の remote 反映確認
- GitHub Releases ページ URL（手動作成する場合）

### ステップ 6: share evidence
- incident-response-runbook.md（09b 成果物）の URL を Slack / Email で共有
- 共有日時 / 共有先（実値: Slack channel name / Email recipient）/ 受領確認（reaction / reply）を記録

### ステップ 7: 24h post-release verify
- 24h 後に Cloudflare Analytics dashboard の screenshot を取得
- 不変条件 #5 / #15 の SQL を再実行

### ステップ 8: manual evidence checklist
- 全項目チェックして完了

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | manual evidence を post-release-summary / documentation-changelog で参照 |
| Phase 13 | PR body に evidence link を記載 |
| 上流 09a | staging smoke 手順を再現（同一 runbook 構造） |
| 上流 09b | incident-response-runbook の共有経路を実行 |

## 多角的チェック観点（不変条件）

- 不変条件 #4: smoke 中に `/profile` の編集 form 不在を screenshot で証跡化
- 不変条件 #5: 24h 後に Network tab + bundle inspect で D1 直叩きが出ていないか
- 不変条件 #6: cron 確認画面（Cloudflare Dashboard）に GAS apps script trigger が存在しないことを screenshot
- 不変条件 #10: 24h 後に Cloudflare Analytics で req 5k 以下、D1 reads / writes 無料枠 10% 以下
- 不変条件 #11: admin 詳細画面に編集 form がないことを目視 + screenshot 注釈
- 不変条件 #15: 24h 後に attendance 重複 0 件 SQL の結果を保存

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 0 | user 承認 gate（2 段目） | 11 | pending | **必須 / blocked until approval** |
| 1 | production-smoke-runbook 作成 | 11 | pending | 13 ステップ実行記録 |
| 2 | screenshot 保存 | 11 | pending | desktop / mobile / 10 ページ |
| 3 | sync_jobs dump | 11 | pending | JSON |
| 4 | bash scripts/cf.sh tail log | 11 | pending | 30 分 |
| 5 | release-tag-evidence | 11 | pending | commit hash + remote |
| 6 | share-evidence | 11 | pending | Slack / Email 共有記録 |
| 7 | 24h post-release evidence | 11 | pending | Analytics + SQL |
| 8 | manual evidence checklist | 11 | pending | 全項目 ✓ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke サマリ + 結果 |
| ランブック | outputs/phase-11/production-smoke-runbook.md | 13 ステップ実行記録 |
| 証跡 | outputs/phase-11/playwright-production/ | screenshot / video / trace |
| 証跡 | outputs/phase-11/sync-jobs-production.json | sync_jobs SELECT 結果 |
| 証跡 | outputs/phase-11/wrangler-tail-production.log | 30 分間の log |
| 証跡 | outputs/phase-11/release-tag-evidence.md | tag commit hash + remote URL |
| 証跡 | outputs/phase-11/share-evidence.md | incident runbook 共有記録 |
| 証跡 | outputs/phase-11/post-release-24h-evidence.md | 24h Analytics + 不変条件 SQL |
| メタ | artifacts.json | Phase 11 を completed に更新 |

## 完了条件

- [ ] production-smoke-runbook.md が 13 ステップ完走
- [ ] screenshot 10 ページ × 2 profile = 20 枚以上保存
- [ ] sync_jobs.json に直近 5 件
- [ ] wrangler-tail.log に 30 分以上の log
- [ ] release-tag-evidence.md に commit hash + remote 反映確認あり
- [ ] share-evidence.md に Slack post URL or Email log あり
- [ ] post-release-24h-evidence.md に 24h Analytics screenshot + SQL 結果あり
- [ ] 全 manual evidence checklist 項目 ✓

## タスク100%実行確認【必須】

- 全実行タスクが completed
- evidence 7 種すべて `outputs/phase-11/` に配置
- artifacts.json の phase 11 を completed に更新

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: production-smoke-runbook.md と evidence 7 種
- ブロック条件: evidence のいずれかが欠けている場合は次 Phase に進まない

## user 承認 gate（2 段目 / Phase 11 着手前）

```text
[ APPROVAL REQUIRED - PRODUCTION DEPLOY GATE 2/3 ]
Wave: 9
Task: 09c-serial-production-deploy-and-post-release-verification
Phase: 11 (手動 smoke / production)
Phase 10 status: GO（6 軸 PASS, 上流 AC completed）

Phase 11 で実施する操作（取り消し不可を含む）:
  1. main merge（gh pr merge --squash）
  2. production D1 backup
  3. production D1 migration apply（可逆だが migration 単位で永続）
  4. production secret list 確認（読み取りのみ）
  5. api worker production deploy（取り消し不可、rollback 必要）
  6. web pages production deploy（取り消し不可、rollback 必要）
  7. production 10 ページ smoke
  8. production manual sync trigger（D1 への書き込み発生）
  9. release tag push（immutable）
  10. incident response runbook 共有

承認しますか？ [y/N]
```

## production-smoke-runbook（手動、13 ステップ実行記録）

### Section 1: pre-deploy（Step 1〜3）

| Step | 操作 | 判定 |
| --- | --- | --- |
| 1 | `git checkout main` + `git pull origin main` で最新確認 | PASS / FAIL |
| 2 | 09a / 09b の artifacts.json で全 phase completed | PASS / FAIL |
| 3 | `bash scripts/cf.sh d1 export ubm_hyogo_production --remote --output=backup-production-<ts>.sql` 成功 | PASS / FAIL |

### Section 2: deploy 中（Step 4〜8）

| Step | 操作 | 判定 |
| --- | --- | --- |
| 4 | `bash scripts/cf.sh d1 migrations list ubm_hyogo_production --remote --env production` で全 Applied | PASS / FAIL |
| 5 | `bash scripts/cf.sh d1 migrations apply ubm_hyogo_production --remote --env production` exit 0 | PASS / FAIL |
| 6 | `bash scripts/cf.sh secret list --env production` + `bash scripts/cf.sh pages secret list --project-name ubm-hyogo-web` で 7 種確認 | PASS / FAIL |
| 7 | `pnpm --filter @ubm/api deploy:production` exit 0 | PASS / FAIL |
| 8 | `pnpm --filter @ubm/web deploy:production` exit 0 | PASS / FAIL |

### Section 3: smoke（Step 9〜10）公開導線（4 ページ）

| URL | チェック | 期待 |
| --- | --- | --- |
| `${PRODUCTION_WEB}/` | landing 表示 | landing copy + nav 表示 |
| `${PRODUCTION_WEB}/members` | 一覧 + filter | publicConsent=consented のみ表示、isDeleted ゼロ |
| `${PRODUCTION_WEB}/members/sample-id` | 公開詳細 | FieldVisibility=public のみ |
| `${PRODUCTION_WEB}/login` | AuthGateState 5 状態 | 各状態を screenshot |

### Section 3: smoke（続き）認証 / 会員（2 操作）

| URL / 操作 | チェック | 期待 |
| --- | --- | --- |
| `${PRODUCTION_WEB}/profile` (logged-in) | 自分の profile + editResponseUrl | **編集 form なし**、ボタンクリックで Forms へ |
| `${PRODUCTION_WEB}/profile` (未ログイン) | リダイレクト | `/login` |

### Section 3: smoke（続き）管理（5 ページ + 認可）

| URL / 操作 | チェック | 期待 |
| --- | --- | --- |
| `${PRODUCTION_WEB}/admin` (admin user) | dashboard | KPI / sync status |
| `${PRODUCTION_WEB}/admin` (一般 user) | 認可 | 403 / login redirect |
| `${PRODUCTION_WEB}/admin/members` (admin) | drawer + status | **編集 form 不在を目視 + screenshot 注釈** |
| `${PRODUCTION_WEB}/admin/tags` | queue | candidate → confirm 操作 |
| `${PRODUCTION_WEB}/admin/schema` | diff + alias | alias 割当画面 |
| `${PRODUCTION_WEB}/admin/meetings` | session | 重複登録不可 |

### Section 3: smoke（続き）sync 確認（Step 10）

| 操作 | チェック | 期待 |
| --- | --- | --- |
| `POST ${PRODUCTION_API}/admin/sync/schema` | 200 + sync_jobs.success | schema_versions 更新 |
| `POST ${PRODUCTION_API}/admin/sync/responses` | 200 + sync_jobs.success | member_responses 更新 |
| `bash scripts/cf.sh tail --env production` (30 min) | log | error / warn が ハンドリング済み |

### Section 4: post-release（Step 11〜13）

| Step | 操作 | 判定 |
| --- | --- | --- |
| 11 | release tag (`vYYYYMMDD-HHMM`) を local 付与 + `git push origin <tag>` | PASS / FAIL |
| 12 | incident-response-runbook.md を Slack / Email で共有 + 受領確認 | PASS / FAIL |
| 13 | 24h 後に Cloudflare Analytics dashboard 確認 + 不変条件 #5 / #15 SQL 再実行 | PASS / FAIL |

## release-tag-evidence（テンプレ）

```text
# release tag 付与記録

## tag 名
RELEASE_TAG=v20260426-1530  # placeholder（実 tag 名で置換）

## main 最新 commit
$ git rev-parse HEAD
<commit_hash>  # placeholder

$ git log --oneline -1
<commit_hash> docs(09c): production deploy + post-release verification 仕様書 完了

## tag 付与
$ git tag -a "$RELEASE_TAG" -m "Production release $RELEASE_TAG"
$ git push origin "$RELEASE_TAG"
To github.com:<owner>/UBM-Hyogo.git
 * [new tag]         v20260426-1530 -> v20260426-1530

## remote 反映確認
$ git ls-remote --tags origin | grep "$RELEASE_TAG"
<commit_hash>	refs/tags/v20260426-1530

## GitHub Releases URL（手動作成する場合）
https://github.com/<owner>/UBM-Hyogo/releases/tag/v20260426-1530  # placeholder
```

## share-evidence（テンプレ）

```text
# incident response runbook 共有記録

## 共有先
- Slack: #ubm-hyogo-prod-incident（placeholder、実 channel 名に置換）
- Email: admin@ubm-hyogo.example（placeholder、実 recipient に置換）

## 共有日時
2026-04-26 15:35 JST  # placeholder

## 共有内容
- runbook URL: docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/incident-response-runbook.md
- production URL: ${PRODUCTION_WEB} / ${PRODUCTION_API}
- release tag: v20260426-1530
- dashboard URL: ${ANALYTICS_URL_API_PRODUCTION} / ${ANALYTICS_URL_D1_PRODUCTION}

## 受領確認
- Slack reaction: <絵文字>（placeholder、screenshot を slack-reaction.png に保存）
- Email reply: from <recipient> at 2026-04-26 15:42  # placeholder
```

## post-release-24h-evidence（テンプレ）

```text
# 24h post-release verify 記録

## 取得日時
2026-04-27 15:30 JST  # placeholder（deploy 24h 後）

## Cloudflare Workers Analytics（${ANALYTICS_URL_API_PRODUCTION}）
- 24h req 数: <数値>（< 5k req PASS / FAIL）
- screenshot: outputs/phase-11/dashboard-workers-24h.png

## Cloudflare D1 Metrics（${ANALYTICS_URL_D1_PRODUCTION}）
- 24h reads: <数値>（無料枠 500k の 10% 以下 PASS / FAIL）
- 24h writes: <数値>（無料枠 100k の 10% 以下 PASS / FAIL）
- screenshot: outputs/phase-11/dashboard-d1-24h.png

## 不変条件 #5 再確認（web bundle）
$ rg "D1Database" apps/web/.vercel/output/
<出力>  # 0 hit ならば PASS

## 不変条件 #15 再確認（attendance 整合性）
$ bash scripts/cf.sh d1 execute ubm_hyogo_production \
    --command "SELECT session_id, member_id, COUNT(*) c FROM attendances WHERE deleted_at IS NULL GROUP BY session_id, member_id HAVING c > 1;" \
    --remote --env production --config apps/api/wrangler.toml
<出力>  # 0 行ならば PASS
```

## manual evidence checklist

- [ ] **user 承認 gate（2 段目）取得予定（09c 本体では未実行、follow-up で取得）**
- [ ] 13 ステップ実行記録が production-smoke-runbook.md に保存
- [ ] 10 ページ × 2 profile screenshot 配置済み
- [ ] AuthGateState 5 状態の screenshot
- [ ] sync_jobs.json に直近 5 件保存
- [ ] wrangler-tail.log に 30 分以上
- [ ] admin UI に編集 form がないことを目視 + screenshot 注釈
- [ ] Cloudflare Analytics 24h screenshot で req 5k 以下
- [ ] Cloudflare D1 metrics 24h screenshot で 10% 以下
- [ ] 不変条件 #5 SQL（`rg D1Database`）が 0 hit
- [ ] 不変条件 #15 SQL（attendance 重複）が 0 行
- [ ] release-tag-evidence.md に tag commit hash + remote 反映確認
- [ ] share-evidence.md に Slack post URL / Email log + 受領確認
- [ ] 認可 leak が起きないことを 3 ケース（未ログイン / 一般 / admin）で確認
