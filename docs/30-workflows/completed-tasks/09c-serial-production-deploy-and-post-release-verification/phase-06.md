# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09c-serial-production-deploy-and-post-release-verification |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 9 |
| Mode | serial（最終） |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | spec_created |

## 目的

production deploy 13 ステップで起こり得る失敗ケース 13 種と、それぞれの検出 / mitigation / production rollback 手順を `outputs/phase-06/production-rollback-procedures.md` に固定する。09b の rollback procedures（worker / pages / D1 / cron）を production 文脈で再構成。

## 実行タスク

1. failure case 13 種列挙（13 ステップに対応）
2. 検出方法（dashboard / bash scripts/cf.sh tail / sync_jobs / SQL）
3. mitigation（rollback / 緊急停止 / hotfix）
4. production-rollback-procedures.md（worker / pages / D1 / cron / tag 取消）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-05.md | runbook |
| 必須 | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-06.md | rollback 4 種（流用） |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | rollback / D1 |
| 必須 | docs/00-getting-started-manual/specs/03-data-fetching.md | sync 失敗時運用 |

## 実行手順

### ステップ 1: failure case 13 種

### ステップ 2: 検出方法

### ステップ 3: mitigation

### ステップ 4: production-rollback-procedures.md

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC matrix の negative |
| Phase 11 | manual evidence で hotfix 手順走破（不要なら skip） |
| 上流 09a | staging で再現したら共通化 |
| 上流 09b | rollback 4 種を流用 |

## 多角的チェック観点（不変条件）

- #4: failure case で本人本文 override が起きないこと
- #5: rollback で web 側 D1 操作なし
- #10: 無料枠超過時の対応手順あり
- #11: rollback 後も admin UI に本人本文編集 form なし
- #15: rollback で attendance 重複防止 / 削除済み除外

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure case 13 種 | 6 | pending | production-failure-cases |
| 2 | 検出方法 | 6 | pending | dashboard / wrangler / sql |
| 3 | mitigation | 6 | pending | rollback / 停止 / hotfix |
| 4 | production-rollback-procedures.md | 6 | pending | worker / pages / D1 / cron / tag |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | 異常系サマリ |
| ドキュメント | outputs/phase-06/production-rollback-procedures.md | worker / pages / D1 / cron / tag rollback |
| メタ | artifacts.json | Phase 6 を completed に更新 |

## 完了条件

- [ ] failure case 13 種完成
- [ ] 各ケースに検出 + mitigation
- [ ] production rollback procedures が 5 種（worker / pages / D1 / cron / tag）

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 2 ファイル配置済み
- artifacts.json の phase 6 を completed に更新

## 次 Phase

- 次: 7 (AC マトリクス)
- 引き継ぎ事項: failure cases / production rollback procedures
- ブロック条件: rollback procedures が 5 種未満で次 Phase に進まない

## Failure cases（13 ケース、deploy 13 ステップに対応）

| # | Step | 失敗内容 | 検出方法 | mitigation |
| --- | --- | --- | --- | --- |
| F-1 | 1 main merge | merge conflict | gh pr merge エラー | dev で rebase → 再 PR |
| F-2 | 2 pre-deploy check | 09a / 09b に pending phase | artifacts.json grep | 該当 task に差し戻し、09c は中断 |
| F-3 | 3 D1 backup | export エラー | wrangler 出力 | Cloudflare Status 確認、リトライ、export なしで Step 4 へは進まない |
| F-4 | 4 migration list | 一覧取得失敗 | wrangler エラー | wrangler version / D1 binding 確認 |
| F-5 | 5 migration apply | apply 中エラー | wrangler エラー + sync_jobs 不整合 | backup から戻す（後方互換 fix migration を新規作成） |
| F-6 | 6 secrets check | 必須 secret 不足 | grep | 04 infra で secret 登録 → 09c 再開 |
| F-7 | 7 api deploy | bash scripts/cf.sh deploy 失敗 | wrangler 出力 | code error は 03/04 へ、wrangler.toml 設定なら 02c で修正 |
| F-8 | 8 web deploy | pages deploy 失敗 | bash scripts/cf.sh pages 出力 | `@opennextjs/cloudflare` build error は 02c へ |
| F-9 | 9 smoke 失敗 | 404 / 403 / 500 | curl + 手動 click | 該当 wave へ差し戻し、条件を満たす場合は api/web rollback（procedure A/B） |
| F-10 | 10 manual sync 失敗 | sync_jobs.failed | SQL | 03a/b へ、cron 一時停止（procedure D） |
| F-11 | 11 release tag 失敗 | tag push 失敗 | git ls-remote | GitHub access 確認、再 push（同名 tag 上書き禁止） |
| F-12 | 12 incident runbook 共有失敗 | Slack / Email 配信エラー | 受領確認なし | 別経路で再送（Slack + Email 両方） |
| F-13 | 13 24h verify 異常 | metrics 無料枠 10% 超過 / 不変条件違反 | dashboard / SQL | cron 頻度低下、query 最適化、条件を満たす場合は api rollback |

## production rollback procedures（5 種）

### A. Worker rollback（production）

```bash
# 直前 deploy id 取得
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production | head -10

# rollback
bash scripts/cf.sh rollback <prev_deploy_id> --config apps/api/wrangler.toml --env production

# 確認
curl -sI "https://ubm-hyogo-api.<account>.workers.dev/public/stats" | head -1
# expected: HTTP/2 200
```

- sanity: rollback 後 1〜2 分以内に旧版が応答
- 注意: rollback で cron schedule も旧版の `[triggers]` に戻る → cron schedule が変更されていた場合は手動 fix
- 不変条件: #5 web 側 D1 操作なし、#15 attendance 整合性は data 側なので影響なし

### B. Pages rollback（production）

```text
Cloudflare Dashboard
→ Pages → ubm-hyogo-web (production)
→ Deployments
→ 直前の "Production" deploy を選択
→ "Rollback to this deployment"
→ 確認 dialog で "Rollback"
```

- sanity: production URL が前バージョンの content を返す（hard reload で確認）
- 注意:
  - Pages secret は rollback されない（secret は手動管理）
  - 不変条件 #5 / #11 は code 側なので rollback で復元される

### C. D1 migration rollback（production / 緊急）

```bash
# 通常: 後方互換 fix migration を新規作成（直接 SQL は spec/15 で禁止）
bash scripts/cf.sh d1 migrations create ubm_hyogo_production fix_<issue> \
  --config apps/api/wrangler.toml --env production

# fix migration を編集後
bash scripts/cf.sh d1 migrations apply ubm_hyogo_production \
  --remote --env production --config apps/api/wrangler.toml

# 確認
bash scripts/cf.sh d1 migrations list ubm_hyogo_production \
  --remote --env production --config apps/api/wrangler.toml
# expected: fix migration が Applied
```

- sanity: 不正データの修復は別 SQL（spec/15-infrastructure-runbook.md の管理 SQL ガイドライン準拠）
- 緊急時の data 復旧:

```bash
# Step 3 の backup から復旧（最終手段）
# 1. 現状 production を別名で export
TS=$(date +%Y%m%d-%H%M)
bash scripts/cf.sh d1 export ubm_hyogo_production --remote \
  --output="backup-incident-${TS}.sql" \
  --env production --config apps/api/wrangler.toml

# 2. backup から手動で必要レコードを復元（spec/15 の SQL ガイドライン参照）
# 直接 DROP TABLE / TRUNCATE は禁止
```

- 注意: 不変条件 #4（本人本文 override しない）/ #15（attendance 整合性）に注意

### D. Cron rollback / 一時停止（production）

```bash
# wrangler.toml の [env.production.triggers] crons = [] に変更し再 deploy
# crons = []  # ← 空配列で一時停止
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production

# 確認
# Cloudflare Dashboard → Workers → ubm-hyogo-api → Triggers で 0 件
```

- sanity: 次の `*/15` でも sync_jobs に新規 running が出ない
- 再開: `crons = ["*/15 * * * *", "0 3 * * *"]` に戻して `bash scripts/cf.sh deploy --env production`
- 不変条件 #6: GAS apps script trigger は使わない（rollback 候補にも含めない）

### E. Release tag 取消（緊急 / 同名再発行禁止のため別 tag を打ち直す）

```bash
# tag を local から削除
TAG=v20260426-1530
git tag -d "$TAG"

# remote から削除（緊急時のみ）
git push origin --delete "$TAG"

# 別 HHMM で打ち直し
NEW_TAG="v$(date +%Y%m%d-%H%M)"
git tag -a "$NEW_TAG" -m "Production release ${NEW_TAG} (replaces ${TAG})"
git push origin "$NEW_TAG"
```

- sanity: `git ls-remote --tags origin` に新 tag があり、古い tag がない
- 注意:
  - tag 削除 + 再 push は GitHub Releases / external tool が参照していると影響あり、慎重に
  - 通常運用では tag は immutable とし、incident 時に hotfix → 新 tag を推奨

### attendance 整合性確認（rollback 後の不変条件 #15）

```bash
bash scripts/cf.sh d1 execute ubm_hyogo_production \
  --command "SELECT session_id, member_id, COUNT(*) c FROM attendances WHERE deleted_at IS NULL GROUP BY session_id, member_id HAVING c > 1;" \
  --remote --env production --config apps/api/wrangler.toml
# expected: 0 rows
```

- 1 行以上検出時は 06b（attendance 実装）へ差し戻し

### 不変条件 #5 再確認（web bundle に D1 import なし）

```bash
# production deploy 後の web bundle を確認
rg "D1Database" apps/web/.vercel/output/ || echo "no D1 import in web bundle: PASS"
# expected: 0 hit（"PASS" 出力）
```

- 1 hit 以上検出時は 02c（web 専用 bundle 設定）へ差し戻し
