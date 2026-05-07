# Phase 1: 要件定義 / GO 判定 / cursor 採用判断フレームワーク確定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 作成日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |
| 上流依存 | UT-07B-FU-01 local implementation GO / runtime evidence pending（remaining-scan の base case 提供） |

## 目的

remaining-scan vs cursor の比較に必要な evidence 種別と採用判断しきい値を Phase 1 の SSOT として確定する。public API `backfill.status` の語彙拡張禁止・cursor 化は internal 限定の不可侵条件を明文化し、Phase 2（cursor 列 schema 設計）着手の GO/NO-GO を決定する。

## Step 0: P50 チェック（必須）

```bash
mkdir -p outputs/phase-1

# 1) gh CLI が認証済（Phase 13 で PR 作成主体）
gh auth status \
  | tee outputs/phase-1/gh-auth-status.log

# 2) 親タスク current state の確認（runtime PASS 済みとは仮定しない）
test -f docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/implementation-guide.md \
  && echo "OK: parent task implementation-guide present" \
  | tee outputs/phase-1/parent-task-presence.log

# 3) 既存 0014 migration 参照可能
test -f apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql \
  && echo "OK: 0014 migration present" \
  | tee outputs/phase-1/migration-0014-presence.log

# 4) staging D1 到達確認
bash scripts/cf.sh d1 list 2>&1 \
  | tee outputs/phase-1/staging-d1-list.log

# 5) Node 24 / pnpm 10 解決
mise exec -- node -v \
  | tee outputs/phase-1/node-version.log
```

期待:

- `gh auth status` が `Logged in to github.com` を含む
- 親タスク `implementation-guide.md` が存在
- `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` が存在
- staging DB（`ubm-hyogo-db-staging`）が `d1 list` に現れる
- `node -v` が `v24.15.0`

## Evidence 種別 SSOT（4 種・必須）

| ID | 種別 | 取得方法 | しきい値判定への寄与 |
| --- | --- | --- | --- |
| E1 | 1 batch あたり CPU 時間（ms） | Worker `wrangler tail` の `cpuTime` ヒストグラム / batch 5 周回平均 | cursor 採用条件のコア指標 |
| E2 | 残行数推移（rows pending） | 各 batch 完了直後の `SELECT count(*) WHERE status='pending'` | スキャンコストの線形成長を検出 |
| E3 | retry_count 増分 | `schema_diff_queue.retry_count` の delta（batch 5 周回合計） | DLQ 投入リスクの先行指標 |
| E4 | `EXPLAIN QUERY PLAN` 種別 | next-batch 取得 SQL に対する SQLite plan（SCAN / SEARCH の別） | cursor 化で plan が SEARCH に変わるかを検証 |

## 採用判断しきい値表（SSOT）

10,000 行 fixture / batch size 100 / 5 周回測定の前提で以下を判定する。

| 条件 | 採用 | 不採用 | 判定保留（再測定） |
| --- | --- | --- | --- |
| E1: cursor 経路の平均 CPU 時間 | remaining-scan 比 30% 以上削減 | remaining-scan 比 ±10% 以内 | 削減が 10〜30% の範囲 |
| E2: 残行数 1,000 行を切る時点 | cursor 経路が remaining-scan より 20% 早い batch 数で到達 | 同等 or 遅い | 5〜20% の範囲 |
| E3: retry_count 合計 | cursor 経路が remaining-scan の 50% 以下 | 同等以上 | 50〜90% の範囲 |
| E4: query plan | cursor 経路が `SEARCH ... USING INDEX` | 両方とも `SCAN` | plan が文書化不能 |

判定ルール:

- E1 と E4 が「採用」を満たした場合に **cursor 採用** とする（E2 / E3 は補足指標）
- E1 が「不採用」または E4 が「不採用」の場合は **不採用**
- それ以外は「判定保留」とし、Phase 11 で fixture を増やすか measurement window を変えて再測定する（同 phase 内で完結させ、本タスクを次サイクルに持ち越さない）

## 含む / 含まない（不可侵条件）

### 含む（Phase 1 で確定）

- shadow flag `BACKFILL_CURSOR_MODE` の値域定義: `remaining-scan` / `cursor`、default `remaining-scan`、不正値は default fallback + warn log
- evidence 4 種の取得手順とフォーマット
- 採用判断しきい値表（上記）

### 含まない（Phase 1 で禁止スコープとして固定）

- public API `backfill.status` の値域変更（cursor 概念の API 露出は不可）
- `backfill.status` レスポンスへのフィールド追加（contract drift 禁止）
- DLQ ダッシュボード / 50,000 行 fixture（別タスク）
- production deploy（staging evidence までを本タスクの runtime gate とする）

## 上流依存テーブル

| 依存 | 状態 | 確認方法 |
| --- | --- | --- |
| UT-07B-FU-01 local implementation GO / runtime evidence pending | 必須前提 | aiworkflow indexes / 親 task outputs で current state を確認。runtime PASS 済みとは記録しない |
| 既存 0014 migration | apply 済み（staging） | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` |
| Worker `wrangler tail` | 利用可能 | `bash scripts/cf.sh wrangler tail --env staging` |

## Acceptance Criteria

| ID | 内容 | 計測方法 |
| --- | --- | --- |
| AC-1 | evidence 4 種が SSOT として確定 | spec grep |
| AC-2 | 採用判断しきい値表が確定 | spec grep |
| AC-3 | 禁止スコープ（API contract 不変）が明文化 | spec grep |
| AC-4 | 上流依存（親 current state）の確認手順が固定 | spec grep |
| AC-5 | Phase 2 着手 GO/NO-GO 判定基準が記載 | spec grep |

## GO/NO-GO 判定（Phase 2 着手）

- GO 条件: 上記 AC-1〜AC-5 が全て満たされ、Step 0 P50 チェック 5 項目が全て期待値を返した
- NO-GO 条件: 親タスク current state が確認できない / staging D1 が到達不能 / Node 24 解決不能 のいずれか
- NO-GO 時アクション: Phase 1 を再実行する。本タスクを spec_blocked 状態にして user に通知

## 成果物

- `outputs/phase-1/phase-1.md`（本ファイル / SSOT 確定書）
- `outputs/phase-1/gh-auth-status.log`
- `outputs/phase-1/parent-task-presence.log`
- `outputs/phase-1/migration-0014-presence.log`
- `outputs/phase-1/staging-d1-list.log`
- `outputs/phase-1/node-version.log`

## 完了条件

- [ ] evidence 4 種 / しきい値表 / 禁止スコープ / 上流依存 / AC が本ドキュメントに固定
- [ ] Step 0 P50 チェック 5 項目が PASS
- [ ] Phase 2 着手 GO 判定が記録
