# System Spec Update Summary

## Classification

- 実装区分: **実装仕様書**
- workflow_state: `spec_created`
- taskType: `implementation / operations / runbook + scripts`
- visualEvidence: `NON_VISUAL`

本タスクは production migration apply のための **runbook + 検証スクリプト群（F1〜F9）+ CI gate** を実装仕様書として整備する。production への実 apply は本タスクで実行せず、UT-07B-FU-04 に委譲する。よって `workflow_state` を `completed` に昇格しない。

## Step 1-A: Workflow / Logs / Index Registration

- `docs/30-workflows/active-tasks.md`（または同等の active workflow ledger）に本タスクを `spec_created` で登録
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` same-wave append: 「UT-07B-FU-03 実装仕様書化（runbook + scripts/d1 + CI gate）」
- `.claude/skills/task-specification-creator/SKILL.md` は UT-07B-FU-03 runbook evidence pattern を既に同期済みで、本差分では追加編集なし
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`: `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` で再生成（D1 / migration / runbook トピックを refresh）

## Step 1-B: 実装状況テーブル

| 項目 | 値 |
| --- | --- |
| 実装ステータス | `spec_created / implemented-local`（F1〜F9 のコード実装は本サイクルで完了、PR/CI は Phase 13 承認待ち）|
| production 実 apply 状態 | 未実行（UT-07B-FU-04 で `executed` に昇格）|
| CI gate 状態 | 未デプロイ（PR merge 後に main で active） |

`completed` に昇格させない理由: 実装仕様書 + 文書整備までが本タスクのスコープであり、本物の production D1 への apply は別タスク。

## Step 1-C: 関連タスク

| 関係 | タスク | 状態 |
| --- | --- | --- |
| 上流 | UT-07B-schema-alias-hardening-001 | completed |
| 上流 | U-FIX-CF-ACCT-01 | completed |
| 下流 | UT-07B-FU-04（production migration apply 実行） | candidate |
| 下流 | UT-07B-FU-01（queue / cron split for large back-fill） | candidate（既存 formalized） |
| 下流 | UT-07B-FU-02（admin UI retry label） | candidate |

## Step 2: 正本同期判定（候補のみ）

| 対象 | 追記候補内容 | 判定 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/`（D1 系 reference） | `scripts/d1/*.sh` + `.github/workflows/d1-migration-verify.yml` の所在 1 行 | **追記する**（運用ツールの所在は skill から逆引きできるべき） |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | `bash scripts/cf.sh d1:apply-prod` の使い方 1 行 | **追記する** |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `generate-index.js` で自動再生成 | **再生成のみ** |
| `docs/00-getting-started-manual/specs/08-free-database.md` | D1 production migration の運用境界（6 段階承認ゲート） 1 段落 | **追記する**（仕様書なので運用境界の所在を明示） |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | `schema_aliases` table と `schema_diff_queue` 追加カラム | UT-07B 側で済 / 本タスクでは追加しない |

> 重要境界: 正本仕様への追記は **scripts / runbook の所在のみ**。production 実 apply 結果値（適用行数 / hash / 時刻）による上書きは禁止。

## Boundary 宣言

本タスクで以下は行わない:

- production D1 への実 migration apply
- production 実 apply 結果値の正本仕様への記録
- `apps/api/migrations/0008_schema_alias_hardening.sql` の SQL 内容変更
- `apps/web` から D1 への直接アクセス経路の新設（不変条件 #5 維持）
- 直 `wrangler` 呼び出し（`scripts/cf.sh` 経由のみ）
