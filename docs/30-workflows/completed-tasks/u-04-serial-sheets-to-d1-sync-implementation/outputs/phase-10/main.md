# Phase 10 サマリ: ドキュメント整備

## 目的

Phase 5 実装 / Phase 8 品質ゲート / Phase 9 リファクタの結果を、運用者と下流タスク (05b smoke / 09b cron monitoring) が参照できるドキュメントへ落とし込む。

## 成果物

- `outputs/phase-10/main.md` (本ファイル)
- `outputs/phase-10/sync-runbook.md` — manual / scheduled / backfill 運用手順
- `outputs/phase-10/cron-operations.md` — cron 式変更 / 一時停止 / staging 検証
- `outputs/phase-10/failure-modes.md` — F-01〜F-20 対応表
- `outputs/phase-10/sync-audit-recipes.md` — 監査クエリレシピ
- `outputs/phase-10/docs-additions-draft.md` — 既存 docs 追記 draft

## 1. sync runbook (`sync-runbook.md`)

manual / scheduled / backfill / rollback の 4 経路と禁止事項 (wrangler 直呼び / .env 値表示 / admin 列書込) を記述。

## 2. cron-operations.md

| 操作 | 手順 |
| --- | --- |
| cron 式変更 | `apps/api/wrangler.toml` 編集 → `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` |
| 一時停止 | `[triggers] crons = []` で deploy または Dashboard で disable |
| staging 先行検証 | `[env.staging.triggers] crons` を 1 週間運用 → メトリクス確認 → production 反映 |
| 09b co-owner 通知 | triggers 改変時は 09b owner へ事前通知 (監視 / runbook 更新) |

## 3. failure-modes.md

Phase 6 の F-01〜F-20 を運用者向けに整理し、各々に「症状 / 検知手段 / 一次対応 / 恒久対応 / 関連不変条件」を併記。

## 4. sync-audit-recipes.md

R-01〜R-06 SQL を `bash scripts/cf.sh d1 execute` 経由で実行する形で提供:

- R-01 直近成功 sync 1 件
- R-02 直近 24h の失敗一覧
- R-03 残留 running row (mutex 解放候補)
- R-04 平均実行時間 (直近 100 件成功)
- R-05 差分件数推移 (直近 7 日)
- R-06 mutex 強制解放 (運用者専用、F-02 一次対応)

## 5. 既存 docs 追記 draft (docs-additions-draft.md)

| 追記先 | 追記内容 |
| --- | --- |
| `apps/api/README.md` | sync layer 節の追加 / scripts/cf.sh 必須運用の再掲 |
| `docs/00-getting-started-manual/specs/08-free-database.md` | sync_audit 利用方針 / writes 実測予測 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | mapping は form_field_aliases 駆動 / unmapped 経路は 07b |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | `/admin/sync*` は requireSyncAdmin Bearer 必須 |

実反映は Phase 12 の system-spec-update-summary 経由。

## 6. 不変条件 / secret hygiene 反映確認

| 項目 | 反映先 | 確認 |
| --- | --- | --- |
| #1 schema コード固定回避 | sync-runbook (mapping は form_field_aliases) | OK |
| #4 admin 列分離 | failure-modes F-08 / runbook 禁止事項 | OK |
| #5 apps/web → D1 禁止 | runbook 禁止事項 / failure-modes F-08 | OK |
| #6 Workers 互換 | runbook (Node SDK 不使用) | OK |
| #7 Sheets を真として backfill | runbook / failure-modes F-04 | OK |
| `scripts/cf.sh` 必須 | 全 runbook コマンド例 | `wrangler ` 直接呼び 0 件 |
| secret hygiene | failure-modes F-05 / runbook 禁止事項 | OK |

## 完了条件確認

- [x] sync-runbook.md (manual / scheduled / backfill 3 経路)
- [x] cron-operations.md (4 操作)
- [x] failure-modes.md (F-01〜F-20)
- [x] sync-audit-recipes.md (R-01〜R-06)
- [x] docs-additions-draft.md (4 追記先)
- [x] 不変条件 / secret hygiene 反映確認
