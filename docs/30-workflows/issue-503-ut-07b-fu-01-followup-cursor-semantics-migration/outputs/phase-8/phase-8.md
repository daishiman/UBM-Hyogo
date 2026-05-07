# Phase 8: aiworkflow-requirements 反映 / runbook 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 作成日 | 2026-05-07 |
| 状態 | spec-confirmed |
| 対象 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` / `.claude/skills/aiworkflow-requirements/references/database-operations.md` / `.claude/skills/aiworkflow-requirements/indexes/keywords.json` |

## 目的

cursor mode の運用切替手順、rollback 手順、採用判断レコードを SSOT (`.claude/skills/aiworkflow-requirements`) に書き込む仕様を確定する。`indexes/keywords.json` への追加キーを列挙し、`mise exec -- pnpm indexes:rebuild` 後に CI gate `verify-indexes-up-to-date` で drift 無し確認することを義務化する（起票元 §6 skill index drift 確認）。

## Step 0: 既存ファイル実在確認（Phase 12 実書き込み時の必須手順）

```bash
test -f .claude/skills/aiworkflow-requirements/references/database-schema.md
test -f .claude/skills/aiworkflow-requirements/references/database-operations.md
test -f .claude/skills/aiworkflow-requirements/indexes/topic-map.md
test -f .claude/skills/aiworkflow-requirements/indexes/keywords.json
```

期待:

| 結果 | 対応 |
| --- | --- |
| 4 ファイル存在 | 既存編集（schema / operations / indexes を更新） |
| いずれか不在 | Phase 12 を fail。代替ファイルを resource-map で再特定してから続行 |

> 2026-05-07 時点の正本は `database-schema.md` / `database-operations.md` / `indexes/topic-map.md` / `indexes/keywords.json`。実在しない `topic-map.json` や `db-schema.md` を参照したまま PASS しない。

## 変更対象ファイル

| パス | 変更種別 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 既存編集（cursor 採用時の `last_processed_id` / 不採用時の remaining-scan 固定） |
| `.claude/skills/aiworkflow-requirements/references/database-operations.md` | 既存編集（staging A/B 比較、rollback、採用判断レコード） |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 既存編集（追記） |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 再生成 / 差分確認（`pnpm indexes:rebuild`） |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 再生成 / 差分確認 |

## runbook 章構成（仕様）

| 章 | 内容 |
| --- | --- |
| 1. 概要 | remaining-scan が base case、cursor は staging evidence で採用判断 |
| 2. cursor mode 切替手順（staging） | `BACKFILL_CURSOR_MODE=cursor` を Cloudflare Workers env に設定する手順 |
| 3. rollback 手順 | env を `remaining-scan` に戻す / 0015 migration を down する |
| 4. 採用判断レコード | staging A/B 比較数値（CPU 時間 / retry_count）と GO/NOT-GO の理由 |
| 5. 監視ポイント | `UBM-7301` / `UBM-7302` / `UBM-7303` ログの出現頻度 |
| 6. トラブルシュート | cursor 不一致 / dedupe 衝突 / failed_items_json 残存 |

## cursor mode 切替コマンド（staging）

```bash
# 1) staging Workers env に BACKFILL_CURSOR_MODE=cursor を設定
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging \
  --var BACKFILL_CURSOR_MODE:cursor

# 2) 切替確認
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run \
  | grep -i BACKFILL_CURSOR_MODE \
  | tee outputs/phase-8/staging-env-confirm.log

# 3) cron / queue 経由で 1 batch 実行し log を確認
# （実行は Phase 11 evidence 取得時）
```

> `wrangler.toml` の `[env.staging.vars]` に追記する経路でも可。`scripts/cf.sh` は `wrangler` の thin wrapper のため、`--var` フラグの取り扱いは Phase 13 実装時に最終確認する。

## rollback 手順

```bash
# 1) env を remaining-scan に戻す
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging \
  --var BACKFILL_CURSOR_MODE:remaining-scan

# 2) 不採用確定なら 0015 を apply しない。apply 済み staging fixture は再作成する。
# Cloudflare 内部管理テーブル（_cf_KV 等）は直接編集しない。
```

> 不採用時は migration ファイル削除ではなく、適用済み migration を down するのみ。migration 履歴の整合は別タスクで管理する。

## 採用判断レコード（runbook §4 仕様）

| 項目 | 記録形式 |
| --- | --- |
| 比較対象 fixture 行数 | 10,000 / 50,000（後者は別タスク） |
| remaining-scan 平均 CPU 時間 | ms 単位 |
| cursor mode 平均 CPU 時間 | ms 単位 |
| 改善率 | `(remaining-scan - cursor) / remaining-scan * 100` % |
| retry_count 平均 | 整数 |
| GO 判定基準 | Phase 1 SSOT: E1 と E4 が採用条件を満たす。E2 / E3 は補足指標 |
| 採用結果 | GO / NOT-GO + 日付 + 担当 |

## `indexes/keywords.json` への追記キー

```json
{
  "cursor-mode": ["database-operations"],
  "BACKFILL_CURSOR_MODE": ["database-operations"],
  "last_processed_id": ["database-schema"],
  "remaining-scan": ["database-operations"],
  "schema-alias-backfill": ["database-schema", "database-operations"]
}
```

> 既存キー構造 (`indexes/keywords.json`) との merge は `pnpm indexes:rebuild` が自動で行う。手書きで追記したキーが rebuild 後に保持されることを確認する。

## drift 確認手順

```bash
mise exec -- pnpm indexes:rebuild

git status .claude/skills/aiworkflow-requirements/indexes/ \
  | tee outputs/phase-8/indexes-drift.log

# 期待: drift 無し（git status が clean）
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/
```

CI gate `verify-indexes-up-to-date`（`.github/workflows/verify-indexes.yml`）で同等の確認が PR 時に走る。

## 入出力

| 入力 | 値 |
| --- | --- |
| Phase 4-7 の成果物 | runbook 章構成への入力 |
| 出力 | database schema / operations 追記 / keywords.json 追記 / topic-map.md 再生成結果 |

## DoD（完了定義）

- [ ] runbook 6 章の構成が確定
- [ ] cursor mode 切替コマンドが確定
- [ ] rollback コマンドが確定
- [ ] 採用判断レコード 7 項目が確定
- [ ] `keywords.json` 追記キー 5 件が確定
- [ ] `pnpm indexes:rebuild` の drift 無し確認手順が確定
- [ ] CI gate `verify-indexes-up-to-date` との整合が明記

## 次 Phase の前提条件

Phase 9 以降（Agent A 担当）で評価ゲート / 統合検証 / Phase 12 implementation-guide / Phase 13 PR 作成を行う。本 Phase の runbook が staging evidence 取得の正本となる。
