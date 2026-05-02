# Phase 3: 実装計画（コマンド列 + rollback 分岐）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09c-production-deploy-execution-001 |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 実装計画（コマンド列 + rollback 分岐） |
| Wave | 9 |
| Mode | serial（execution-only） |
| 作成日 | 2026-05-02 |
| 前 Phase | 2 (設計 — 実行フロー + evidence 設計) |
| 次 Phase | 4 (verify suite 設計) |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| user_approval | N/A（G1 承認下で進行 / 本 Phase は実 mutation なし） |

## 目的

Phase 2 で確定した 13 ステップ × evidence 設計表に対し、Phase 5〜11 で実行する **全コマンド列を事前確定** し、各コマンドの dry-run / apply を分離し、rollback コマンド列も同レベルで事前準備する。本 Phase は実行しない（仕様書のみ）。Phase 1 open question Q1〜Q3 の clearance も本 Phase で締める。

## 実行タスク

1. Phase 5（preflight）コマンド列確定（dry-run のみ）
2. Phase 6（D1 migration apply）コマンド列確定（apply / rollback 双方）
3. Phase 7（api / web deploy）コマンド列確定（apply / rollback 双方）
4. Phase 8（release tag）コマンド列確定（付与 / 削除）
5. Phase 9（smoke + 認可境界）コマンド列確定（curl + SQL 含む）
6. Phase 11（24h verify）データ取得手順確定
7. rollback トリガー条件 × 実行コマンドの分岐表
8. Phase 1 open question Q1〜Q3 clearance
9. dry-run / apply の表記規約（ログ末尾に `[DRY-RUN]` か `[APPLIED]` を必須化）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/phase-01.md | open question 出典 |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/phase-02.md | 13 ステップ × evidence 表 |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/index.md | AC 13 件 |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/implementation-guide.md | 親 runbook のコマンド出典 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | production deploy / rollback 正本 |
| 必須 | scripts/cf.sh | wrapper 仕様 |

## 実行手順（ステップ別）

### ステップ 1: Phase 5 (preflight) コマンド列

`outputs/phase-03/main.md` に以下ブロックを記述。dry-run のみ。

```bash
# S1: main 昇格 evidence
git fetch origin main
git rev-parse origin/main
git log -1 origin/main --format='%H %ci %s'

# S2: account identity
bash scripts/cf.sh whoami

# S3: D1 identity / binding confirmation only
# D1 backup is intentionally not taken in Phase 5. Canonical backup is Phase 6
# immediately before migration apply.
rg -n "database_name|binding_name|database_id" apps/api/wrangler.toml

# S4: migrations list (dry-run)
bash scripts/cf.sh d1 migrations list ubm_hyogo_production \
  --remote --env production --config apps/api/wrangler.toml

# S5: secrets list (api / web)
bash scripts/cf.sh secret list --env production --config apps/api/wrangler.toml
bash scripts/cf.sh secret list --env production --config apps/web/wrangler.toml
```

> 注: production D1 正本名は `ubm_hyogo_production`。Phase 5 開始直前に `apps/api/wrangler.toml [env.production]` を再確認し、drift があれば Phase 5 を中止して本 Phase 3 を更新する。rollback 用 backup は Phase 6 適用直前に 1 回だけ取得する。

### ステップ 2: Phase 6 (D1 migration) コマンド列

```bash
# S6 apply
# S6 backup (canonical rollback source; SQL body is never committed)
TS="$(date +%Y%m%d-%H%M%S)"
bash scripts/cf.sh d1 export ubm_hyogo_production \
  --remote --env production --config apps/api/wrangler.toml \
  --output "backup-pre-migrate-${TS}.sql" \
  | tee outputs/phase-06/d1-backup-export.log

# S6 apply
bash scripts/cf.sh d1 migrations apply ubm_hyogo_production \
  --remote --env production --config apps/api/wrangler.toml \
  | tee outputs/phase-06/d1-migration-apply.log

# S6 post-check
bash scripts/cf.sh d1 migrations list ubm_hyogo_production \
  --remote --env production --config apps/api/wrangler.toml \
  | tee outputs/phase-06/d1-migrations-list-post.log
```

**rollback**（S6 失敗時）:

```bash
# backup-pre-migrate-<ts>.sql から restore（execute --file）
bash scripts/cf.sh d1 execute ubm_hyogo_production \
  --remote --env production --config apps/api/wrangler.toml \
  --file "backup-pre-migrate-<ts>.sql" \
  | tee outputs/phase-06/d1-rollback-evidence.log
```

### ステップ 3: Phase 7 (api / web deploy) コマンド列

```bash
# S7 api deploy
pnpm --filter @ubm/api deploy:production \
  | tee outputs/phase-07/api-deploy.log

# S8 web deploy
pnpm --filter @ubm/web deploy:production \
  | tee outputs/phase-07/web-deploy.log
```

**deploy 後に取得する version id**:

```bash
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production | head -5
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production | head -5
```

**rollback**（S7 / S8 失敗時 / S10-S11 NO-GO 時）:

```bash
# Phase 5 開始時に直前 production version id を控えておく（後述 ステップ 7）
bash scripts/cf.sh rollback "<PREV_API_VERSION_ID>" \
  --config apps/api/wrangler.toml --env production \
  | tee outputs/phase-07/api-rollback-evidence.log

bash scripts/cf.sh rollback "<PREV_WEB_VERSION_ID>" \
  --config apps/web/wrangler.toml --env production \
  | tee outputs/phase-07/web-rollback-evidence.log
```

### ステップ 4: Phase 8 (release tag) コマンド列

```bash
# JST 基準（Phase 1 Q3 で確定）
TAG="v$(TZ=Asia/Tokyo date +%Y%m%d-%H%M)"
git tag -a "$TAG" -m "release: $TAG (production deploy of $(git rev-parse --short origin/main))"
git push origin "$TAG"
git ls-remote --tags origin "$TAG" | tee outputs/phase-08/release-tag-evidence.md
```

**tag 削除（誤付与時）**:

```bash
git tag -d "$TAG"
git push origin ":refs/tags/$TAG"
```

### ステップ 5: Phase 9 (smoke + 認可境界) コマンド列

```bash
# 10 ページ smoke（200 / Content-Type 確認）
for path in / /events /forms /members /profile /admin /admin/members /admin/events /api/health /api/version; do
  curl -sS -o /dev/null -w "%{http_code} %{url_effective}\n" "https://<production-web-url>$path"
done | tee outputs/phase-09/smoke-http.log

# 認可境界（未ログインで /admin → 302 / 401、未管理者で /admin → 403）
curl -sS -o /dev/null -w "anon /admin: %{http_code}\n" "https://<production-web-url>/admin" | tee -a outputs/phase-09/smoke-http.log

# 不変条件 #15 attendance 重複 / 削除済み除外
bash scripts/cf.sh d1 execute ubm_hyogo_production \
  --remote --env production --config apps/api/wrangler.toml \
  --command "SELECT event_id, member_id, COUNT(*) c FROM attendance WHERE deleted_at IS NULL GROUP BY 1,2 HAVING c > 1;" \
  | tee outputs/phase-09/invariant-15.log
```

### ステップ 6: Phase 11 (24h verify) データ取得手順

- Cloudflare Workers Analytics dashboard で過去 24h の Workers req / D1 reads / writes をスクリーンショットし `outputs/phase-11/screenshots/` に保存
- 数値を `outputs/phase-11/24h-metrics.md` に記入（無料枠比 = req / 100k * 100, reads / 5M * 100, writes / 100k * 100）
- 不変条件 #10 PASS 条件: それぞれ無料枠 10% 以下

### ステップ 7: rollback トリガー × 実行コマンド分岐表

`outputs/phase-03/main.md` に以下表を記述。

| トリガー条件 | 担当 Phase | 実行コマンド | 出力 evidence |
| --- | --- | --- | --- |
| S6 migration apply 失敗 | 6 | D1 execute --file backup-<ts>.sql | outputs/phase-06/d1-rollback-evidence.log |
| S7 api deploy 失敗 / S10 認可境界違反 | 7 / 9 | `bash scripts/cf.sh rollback <PREV_API_VERSION_ID> ...` | outputs/phase-07/api-rollback-evidence.log |
| S8 web deploy 失敗 | 7 | `bash scripts/cf.sh rollback <PREV_WEB_VERSION_ID> ...` | outputs/phase-07/web-rollback-evidence.log |
| S9 release tag 誤付与 | 8 | `git tag -d` + `git push origin :refs/tags/<TAG>` | outputs/phase-08/tag-rollback-evidence.md |
| S11 GO/NO-GO で NO-GO | 10 | api / web rollback を順次（D1 が前方互換ならそのまま、非互換なら D1 restore） | outputs/phase-10/rollback-evidence.md |
| S13 24h で incident（無料枠超過 / 5xx 急増） | 11 | 親 09b incident runbook P0 / P1 経路 | outputs/phase-11/incident-evidence.md |

**事前準備（Phase 5 開始直前に必ず取得）**:

```bash
# 直前 production version id（rollback 先）を控える
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production | head -3 \
  | tee outputs/phase-05/prev-api-version.md
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production | head -3 \
  | tee outputs/phase-05/prev-web-version.md
```

### ステップ 8: Phase 1 open question clearance

| Q | 結論 |
| --- | --- |
| Q1 (G2 失敗時の戻り先) | Phase 5 内で **最大 1 回まで retry**、2 回目失敗で Phase 2 まで戻し設計欠陥を疑う |
| Q2 (24h 中の hotfix 承認) | 親 09b incident runbook P0 経路で対応、本タスクの追加承認は不要。ただし `outputs/phase-11/incident-evidence.md` に「凍結ルール例外発動」を記録 |
| Q3 (release tag の HHMM 基準) | **JST**（`TZ=Asia/Tokyo date +%Y%m%d-%H%M`）に固定 |

### ステップ 9: dry-run / apply 表記規約

- 全 evidence ログのファイル末尾に `[DRY-RUN] <ISO8601>` または `[APPLIED] <ISO8601>` を 1 行追加
- preflight (Phase 5) は `[DRY-RUN]` のみ（D1 backup は実施しない。secrets list / migrations list / binding confirmation のみ）
- Phase 6〜8 は `[APPLIED]` 必須
- Phase 12 grep で両タグの混在 / 欠落を検出

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | コマンド列を verify suite のテストケース 1:1 に展開 |
| Phase 5-11 | 各 Phase は本 Phase 3 のコマンドブロックをそのまま実行（追加ブロック禁止） |
| Phase 12 | dry-run / apply タグ grep / wrangler 直実行 0 件 grep の根拠 |

## 多角的チェック観点（不変条件）

- 不変条件 #4: コマンド列に本人本文 D1 update を含めない（Phase 9 SQL は SELECT のみ）
- 不変条件 #5: web 側コマンドは `pnpm --filter @ubm/web deploy:production` のみで D1 binding を直接呼ばない
- 不変条件 #10: Phase 11 数値取得手順が無料枠比 (%) で記録される
- 不変条件 #11: Phase 9 smoke に admin 本文編集 form 不在の手動確認手順を含める
- 不変条件 #15: Phase 9 SQL に attendance 重複 / 削除済み除外確認を含める

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Phase 5 コマンド列 | 3 | pending | dry-run only |
| 2 | Phase 6 コマンド列 + rollback | 3 | pending | D1 |
| 3 | Phase 7 コマンド列 + rollback | 3 | pending | api / web |
| 4 | Phase 8 コマンド列 + tag 削除 | 3 | pending | JST 確定 |
| 5 | Phase 9 コマンド列 | 3 | pending | smoke + 不変条件 |
| 6 | Phase 11 24h 取得手順 | 3 | pending | dashboard |
| 7 | rollback トリガー × 実行表 | 3 | pending | 6 行以上 |
| 8 | open question Q1〜Q3 clearance | 3 | pending | Phase 1 持ち越し |
| 9 | dry-run / apply 表記規約 | 3 | pending | grep 検出 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 全コマンド列 + rollback 分岐表 + Q1-3 clearance + 表記規約 |
| メタ | artifacts.json | Phase 3 を completed に更新 |

## 完了条件

- [ ] Phase 5〜11 のコマンド列がすべて `bash scripts/cf.sh` / `pnpm --filter @ubm/...` / `git ...` のいずれかで記述（`wrangler` 直実行 0 件）
- [ ] rollback コマンドが api / web / D1 / tag の 4 種類すべて事前確定
- [ ] rollback トリガー × 実行表が 6 行以上
- [ ] Phase 1 open question Q1〜Q3 が clearance
- [ ] release tag 命名が `TZ=Asia/Tokyo` 固定
- [ ] dry-run / apply 表記規約が文書化
- [ ] 直前 production version id 取得手順が Phase 5 事前準備として明記

## タスク100%実行確認【必須】

- 全実行タスク（ステップ 1〜9）が completed
- main.md 配置
- artifacts.json の Phase 3 を completed に更新
- 4 条件評価の運用性が PASS に昇格できる根拠（rollback コマンド全種事前確定）が main.md に記述

## 次 Phase

- 次: 4 (verify suite 設計)
- 引き継ぎ事項: 全コマンド列 / rollback 分岐表 / 直前 version id 取得手順 / dry-run-apply 表記規約 / Q1-3 clearance
- ブロック条件: rollback コマンド未確定 / `wrangler` 直実行混入 / Q1-3 未 clearance
