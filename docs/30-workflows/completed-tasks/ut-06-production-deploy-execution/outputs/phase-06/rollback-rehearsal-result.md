# Phase 6: ロールバックリハーサル結果

> **ステータス: NOT EXECUTED (docs-only モード)**
> 本タスクは docs-only。実行時は staging で本書テンプレに沿ってリハーサル結果を記録。

## 1. リハーサル方針

- 対象環境: staging (`ubm-hyogo-api-staging` / `ubm-hyogo-web-staging` / `ubm-hyogo-db-staging`)
- 必須項目: D-1 (D1 リストア) と W-1 (Workers rollback) を最低 1 回ずつ
- 推奨項目: A-3 (migration 部分失敗復旧シミュレーション)

## 2. リハーサル実施記録テンプレ

### R-1: Workers rollback (W-1)

| 項目 | 値 |
| --- | --- |
| 実施日時 | TBD |
| 実施者 | TBD |
| 対象 Worker | `ubm-hyogo-api-staging` |
| 直前 deployment_id | TBD |
| rollback コマンド | `bash scripts/cf.sh rollback <ID> --config apps/api/wrangler.toml --env staging` |
| 結果 | TBD (PASS / FAIL) |
| 検証 (`/health`) | TBD |
| 所要時間 | TBD |

### R-2: D1 リストア (D-1)

| 項目 | 値 |
| --- | --- |
| 実施日時 | TBD |
| 実施者 | TBD |
| 対象 DB | `ubm-hyogo-db-staging` |
| バックアップ取得 | `wrangler d1 export ubm-hyogo-db-staging --env staging --output backup-rehearsal-<TS>.sql` |
| リストアコマンド | `wrangler d1 execute ubm-hyogo-db-staging --env staging --file backup-rehearsal-<TS>.sql` |
| 結果 | TBD |
| テーブル一致確認 | TBD |
| 所要時間 | TBD |

### R-3: マイグレーション部分失敗復旧 (A-3) [推奨]

| 項目 | 値 |
| --- | --- |
| 実施日時 | TBD |
| 想定シナリオ | 故意に SQL エラーを含むマイグレーションを staging に流して停止させ、D-1 で復旧 |
| 結果 | TBD |

## 3. リハーサル合否判定

- 合否: TBD
- R-1 / R-2 のいずれかが FAIL → 本番 GO 判定不可
- R-3 は推奨だが必須ではない (時間制約により省略可)

## 4. 本番反映項目

- リハーサル中に発見された問題点を `outputs/phase-02/rollback-runbook.md` に追記
- `outputs/phase-06/abnormal-case-matrix.md` の合格基準を必要に応じ修正
