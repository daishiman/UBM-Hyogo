# Phase 10: ドキュメント整備

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sheets-to-d1-sync-implementation |
| Phase 番号 | 10 / 13 |
| Phase 名称 | ドキュメント整備 |
| 作成日 | 2026-04-30 |
| 前 Phase | 9 (リファクタリング) |
| 次 Phase | 11 (手動 smoke) |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

Phase 5 実装 / Phase 8 品質ゲート / Phase 9 リファクタの結果を、運用者と下流タスク（05b smoke / 09b cron monitoring）が参照できるドキュメントへ落とし込む。具体的には **(a) sync runbook**、**(b) Cron 運用手順**、**(c) failure mode 対応表**、**(d) sync_audit クエリレシピ** を作成し、`apps/api/README.md` および `docs/00-getting-started-manual/specs/` の関連節に追記指示を出す。

## 実行タスク

1. sync runbook（manual / scheduled / backfill 3 経路の起動・停止・確認手順）作成
2. Cron 運用手順（cron 式の変更 / 一時停止 / staging との差分管理）作成
3. failure mode 対応表（rate limit / mutex / consent 異常 / D1 transaction 失敗 / Sheets 認証失効 / scheduled handler timeout）
4. `sync_audit` クエリレシピ（直近成功 / 失敗一覧 / running 解放 / 平均実行時間 / 差分件数推移）
5. `apps/api/README.md` および `docs/00-getting-started-manual/specs/*.md` への追記指示
6. 不変条件 / `scripts/cf.sh` 必須運用 / secret hygiene の docs 反映確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/runbook.md | 実装ランブック（本 Phase で外向き docs に昇格） |
| 必須 | outputs/phase-08/main.md | security review / `scripts/cf.sh` 運用 |
| 必須 | outputs/phase-09/main.md | リファクタ後 API（`withAudit` / `persistResponse` / `fetchWithBackoff`） |
| 必須 | `docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md` | failure recovery の出典 |
| 必須 | `docs/00-getting-started-manual/specs/08-free-database.md` | D1 構成 |
| 必須 | `docs/00-getting-started-manual/specs/01-api-schema.md` | stableKey / consent |
| 必須 | `CLAUDE.md` | `scripts/cf.sh` 運用ルール / 不変条件 |
| 参考 | `apps/api/README.md`（既存） | 追記対象 |

## 実行手順

### ステップ 1: sync runbook 作成（`outputs/phase-10/sync-runbook.md`）

セクション構成:

1. 概要（manual / scheduled / backfill の使い分け）
2. 事前条件（D1 migration 完了 / `GOOGLE_SERVICE_ACCOUNT_JSON` / `SHEETS_SPREADSHEET_ID` / `SYNC_RANGE` / `SYNC_MAX_RETRIES` 配置済）
3. manual sync 手順
   - `SYNC_ADMIN_TOKEN` Bearer の取得（1Password 正本 → Cloudflare Secret / local env、値は記録しない）
   - `curl -X POST https://<api-host>/admin/sync/run` 例
   - 期待レスポンス（`{ "auditId": "...", "status": "running" }`）
   - 完了確認（`GET /admin/sync/audit?limit=1`）
4. scheduled sync 手順
   - `wrangler.toml` の `[triggers] crons = ["0 * * * *"]` を確認
   - デプロイ: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production`
   - 起動確認: Cloudflare Dashboard → Workers → Triggers
5. backfill 手順
   - 事前: `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup-YYYYMMDD.sql`
   - `curl -X POST https://<api-host>/admin/sync/backfill`
   - 完了確認 + admin 列が untouched であることを sync_audit の `diff_summary_json` で確認
6. rollback 手順（直近 deploy 取消）
   - `bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production`
7. 禁止事項
   - `wrangler` 直接実行 禁止（`scripts/cf.sh` のみ）
   - `.env` の中身を表示しない
   - admin 列を sync 経路で書き換えない（不変条件 #4）

### ステップ 2: Cron 運用手順（`outputs/phase-10/cron-operations.md`）

| 操作 | 手順 |
| --- | --- |
| cron 式変更 | `apps/api/wrangler.toml` の `[triggers] crons` を編集 → `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` |
| 一時停止 | `[triggers] crons = []` にして deploy（または Cloudflare Dashboard で disable） |
| staging で先行検証 | `[env.staging.triggers] crons = ["*/30 * * * *"]` を 1 週間運用 → メトリクス確認後 production 反映 |
| 09b 監視 co-owner | triggers 定義は本タスク owner、監視 / runbook は 09b owner。triggers 改変時は 09b に事前通知 |

### ステップ 3: failure mode 対応表（`outputs/phase-10/failure-modes.md`）

| ID | 症状 | 検知手段 | 一次対応 | 恒久対応 | 不変条件参照 |
| --- | --- | --- | --- | --- | --- |
| F-01 | Sheets API rate limit (429) | sync_audit `failed_reason='rate_limit'` 連続 | exponential backoff（自動・最大 3 回） / 超過時は次 cron 待ち | sync 周期延長 or paid quota | #6 |
| F-02 | mutex 取得失敗（前回 sync が `running` のまま） | `GET /admin/sync/audit` で `running` row が長時間残存 | 手動で sync_audit の該当 row を `failed` に UPDATE（D1 SQL: `UPDATE sync_audit SET status='failed', finished_at=..., failed_reason='manual_release' WHERE audit_id=?`） | TECH-M-03 の `withAudit` 強化 / dead lock TTL 機構検討（Phase 12） | #7 |
| F-03 | consent 値が enum 外 | mapping 段で `unknown` フォールバック / sync_audit に warning 件数が記録 | 自動継続（fallback 済） | Sheets 側の選択肢統一 → 07b schema diff alias で解決 | #2 |
| F-04 | D1 transaction 失敗（backfill 中） | sync_audit `failed_reason='d1_batch_error'` | backfill 再実行（同 responseId は upsert で冪等） | D1 batch サイズ分割（Phase 12） | #7 |
| F-05 | Service Account JWT 失効 / 鍵 rotate 必要 | sync_audit `failed_reason='auth_failed'` | 1Password で新 key を発行 → `bash scripts/cf.sh` 経由で `GOOGLE_SERVICE_ACCOUNT_JSON` を secret 更新 → 動作確認 | 鍵 rotation 手順を 04 task に追加 | secret hygiene |
| F-06 | scheduled handler が CPU time 超過で abort | Cloudflare Logs / `sync_job_logs` に row 無し | 1 cron skip → 次回再実行で吸収 | sync 内部の処理を `ctx.waitUntil` に移譲、または paid plan | Q-M-03 (Phase 12) |
| F-07 | unmapped questionId 増加 | sync_audit `unmapped_question_ids_json` の長さ監視 | 自動継続 | `form_field_aliases` への alias 追加（07b 責務） | #1 |
| F-08 | apps/web から D1 を参照しようとしている PR | code review / lint | 即 reject、apps/api endpoint 追加で代替 | lint custom rule 強化 | #5 |

### ステップ 4: sync_audit クエリレシピ（`outputs/phase-10/sync-audit-recipes.md`）

```sql
-- R-01: 直近成功 sync 1 件
SELECT * FROM sync_audit
WHERE status = 'success'
ORDER BY finished_at DESC
LIMIT 1;

-- R-02: 直近 24h の失敗一覧
SELECT audit_id, trigger, started_at, finished_at, failed_reason
FROM sync_audit
WHERE status = 'failed'
  AND started_at >= datetime('now', '-1 day')
ORDER BY started_at DESC;

-- R-03: 残留 running row（mutex 解放候補）
SELECT audit_id, trigger, started_at,
       CAST((julianday('now') - julianday(started_at)) * 24 * 60 AS INTEGER) AS minutes_elapsed
FROM sync_audit
WHERE status = 'running'
ORDER BY started_at;

-- R-04: 平均実行時間（直近 100 件成功）
SELECT trigger,
       AVG(CAST((julianday(finished_at) - julianday(started_at)) * 86400 AS REAL)) AS avg_seconds
FROM (
  SELECT trigger, started_at, finished_at
  FROM sync_audit
  WHERE status = 'success'
  ORDER BY finished_at DESC
  LIMIT 100
)
GROUP BY trigger;

-- R-05: 差分件数推移（直近 7 日）
SELECT date(started_at) AS day,
       trigger,
       COUNT(*) AS sync_count,
       SUM(json_extract(diff_summary_json, '$.upserted_count')) AS upserted_total,
       SUM(json_extract(diff_summary_json, '$.unmapped_count')) AS unmapped_total
FROM sync_audit
WHERE status = 'success'
  AND started_at >= datetime('now', '-7 day')
GROUP BY day, trigger
ORDER BY day DESC, trigger;

-- R-06: mutex 強制解放（運用者のみ実行可、F-02 の一次対応）
UPDATE sync_audit
SET status = 'failed',
    finished_at = datetime('now'),
    failed_reason = 'manual_release'
WHERE audit_id = ?  -- 必ず特定 audit_id を指定
  AND status = 'running';
```

実行は `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "..."`（直接 wrangler 禁止）。

### ステップ 5: 既存 docs への追記指示

| 追記先 | 追記内容 | 担当 |
| --- | --- | --- |
| `apps/api/README.md` の「sync layer」節（新規） | 概要 + 3 endpoint + scheduled handler の存在 + runbook へのリンク（`docs/30-workflows/completed-tasks/u-04-serial-sheets-to-d1-sync-implementation/outputs/phase-10/sync-runbook.md`） | u-04（本タスク） |
| `apps/api/README.md` の「Cloudflare CLI」節 | `scripts/cf.sh` 経由必須 / `wrangler` 直接禁止を再掲 | u-04 |
| `docs/00-getting-started-manual/specs/08-free-database.md` の末尾 | sync_audit 利用方針へのリンク + writes 実測予測 | u-04 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` の関連節 | mapping 実装が `form_field_aliases` 駆動である旨と、unmapped questionId のフォローアップ経路（07b）を 1 段落 | u-04 |
| `docs/00-getting-started-manual/specs/11-admin-management.md`（参考） | `/admin/sync*` が `requireSyncAdmin` / `SYNC_ADMIN_TOKEN` Bearer を維持する旨を 1 行追記 | u-04 |
| 09b 着手時の co-owner ハンドオフ | Cron 監視 / alert 設計の入力として本 Phase の docs を参照させる | 09b owner |

各追記は **本 Phase 完了時点で文面の draft を outputs/phase-10/ に置き、実反映は Phase 12 の system-spec-update-summary 経由で行う**。

### ステップ 6: 不変条件 / secret hygiene の docs 反映確認

| 項目 | 反映先 | 確認方法 |
| --- | --- | --- |
| #1 schema コード固定回避 | sync-runbook.md「mapping は form_field_aliases 駆動」節 | grep |
| #4 admin 列分離 | failure-modes.md F-08 / runbook の禁止事項 | grep |
| #5 apps/web から D1 直接禁止 | runbook の禁止事項 / failure-modes.md F-08 | grep |
| #6 Workers 互換 | runbook の禁止事項（Node SDK 不使用） | grep |
| #7 Sheets を真として backfill | runbook の backfill 手順 / failure-modes.md F-04 | grep |
| `scripts/cf.sh` 必須 | runbook 全コマンド例 / cron-operations.md / sync-audit-recipes.md | grep `wrangler ` で 0 件 |
| secret hygiene | failure-modes.md F-05 / runbook 禁止事項 | grep |

## 統合テスト連携【必須】

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | 手動 smoke で本 Phase の runbook をそのまま実行可能か検証 |
| Phase 12 | docs 追記内容を `system-spec-update-summary.md` に転記 / TECH-M-04 / Q-M-03 / F-02 の dead lock TTL を unassigned-task に登録 |
| 下流 05b | smoke readiness の手順書として sync-runbook.md を参照 |
| 下流 09b | Cron 監視 / alert / runbook の入力として cron-operations.md と sync-audit-recipes.md を参照 |

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| 4 種ドキュメント配置 | 100% | TBD |
| 既存 docs 追記 draft | 5 件 | TBD |
| `wrangler ` 直接呼び出し記載 | 0 件 | TBD |
| 不変条件 #1〜#7 docs 反映 | 全件 | TBD |

## 多角的チェック観点

- 不変条件 #1: mapping 仕様の出典が `form_field_aliases` であることを runbook に明記
- 不変条件 #4: backfill が admin 列に触れない旨を runbook と failure-modes に二重明記
- 不変条件 #5: apps/web から D1 直接アクセス禁止を runbook の禁止事項節に明記
- 不変条件 #6: Workers 非互換依存禁止 / `crypto.subtle` ベース JWT を runbook に明記
- 不変条件 #7: Sheets を真として再 backfill する recovery を failure-modes F-04 に明記
- secret hygiene: 全コマンド例が `bash scripts/cf.sh` 経由（`wrangler` 直接 0 件）/ Service Account JSON の値を docs に貼らない
- 認可境界: manual / backfill / audit endpoint の `requireSyncAdmin` / `SYNC_ADMIN_TOKEN` Bearer 必須を spec docs にも反映
- 運用継続性: F-01〜F-08 すべてに一次対応と恒久対応を併記

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | sync runbook | 10 | pending | 7 セクション |
| 2 | Cron 運用手順 | 10 | pending | 4 操作 |
| 3 | failure mode 対応表 | 10 | pending | F-01〜F-08 |
| 4 | sync_audit クエリレシピ | 10 | pending | R-01〜R-06 |
| 5 | 既存 docs 追記指示 | 10 | pending | 5 追記先 |
| 6 | 不変条件 / secret docs 反映確認 | 10 | pending | 7 項目 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | Phase 10 サマリ + GO/NO-GO 入力 |
| ドキュメント | outputs/phase-10/sync-runbook.md | manual / scheduled / backfill 運用手順 |
| ドキュメント | outputs/phase-10/cron-operations.md | cron 式変更 / 一時停止 / staging 検証 |
| ドキュメント | outputs/phase-10/failure-modes.md | F-01〜F-08 対応表 |
| ドキュメント | outputs/phase-10/sync-audit-recipes.md | R-01〜R-06 SQL レシピ |
| ドキュメント | outputs/phase-10/docs-additions-draft.md | apps/api/README.md / specs への追記 draft |
| メタ | artifacts.json | phase 10 status |

## 完了条件

- [ ] sync-runbook.md に manual / scheduled / backfill 3 経路が記載
- [ ] cron-operations.md に cron 式変更 / 一時停止 / staging 検証手順が記載
- [ ] failure-modes.md に F-01〜F-08 が記載され、各々一次対応と恒久対応を持つ
- [ ] sync-audit-recipes.md に R-01〜R-06 SQL が記載
- [ ] `apps/api/README.md` および specs 4 件への追記 draft が `docs-additions-draft.md` に存在
- [ ] 全コマンド例が `bash scripts/cf.sh` 経由（grep `wrangler ` 結果 0）
- [ ] 不変条件 #1〜#7 の docs 反映が確認されている
- [ ] **本Phase内の全タスクを100%実行完了**

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- outputs/phase-10/ 配下に 6 ファイル配置
- 不変条件 #1, #4, #5, #6, #7 の docs 反映確認 PASS
- `scripts/cf.sh` 必須運用が runbook / cron-operations / recipes すべてで一貫
- 次 Phase へ「smoke 実行は sync-runbook.md の手順に従う」旨を引き継ぎ
- artifacts.json の phase 10 を completed に更新

## 次 Phase

- 次: 11 (手動 smoke)
- 引き継ぎ事項:
  - sync-runbook.md を smoke スクリプトの正本として使用
  - failure-modes.md F-01 / F-02 / F-04 を smoke 中に発生させて recovery 手順を実演（NON_VISUAL evidence として `outputs/phase-11/manual-test-result.md` に記録）
  - sync-audit-recipes.md R-01〜R-05 で smoke 後の D1 状態を確認
  - docs-additions-draft.md を Phase 12 system-spec-update-summary に渡す
- ブロック条件: 4 種ドキュメントいずれかが欠損、`wrangler` 直接記載、不変条件 docs 反映欠落、追記 draft 欠落のいずれかが残るなら進まない

## NO-GO 条件（Phase 11 進入阻止）

| 条件 | 影響 |
| --- | --- |
| sync-runbook.md 欠損 | smoke 実行不能 |
| failure-modes.md F-02（mutex 解放）欠如 | 運用復旧手順なし |
| `wrangler` 直接呼び出し記載 | secret hygiene 違反 / CLAUDE.md 規約違反 |
| 不変条件 #4 / #5 が docs に未反映 | 運用者がアーキ境界を破る恐れ |
| docs-additions-draft.md 欠如 | Phase 12 が反映先を特定できない |
