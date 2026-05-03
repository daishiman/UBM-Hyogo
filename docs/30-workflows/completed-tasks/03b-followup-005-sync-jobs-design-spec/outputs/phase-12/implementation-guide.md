# Implementation Guide

## Part 1: 中学生レベルの概念説明

学校の文化祭で、クラスごとに売上や作業状況をノートに書くとする。同じルールを2冊のノートに別々に書くと、片方だけ直してもう片方が古いままになり、どちらを信じればよいか分からなくなる。

`sync_jobs` は Google Forms と D1 の間で「いつ、どの仕事を、どこまで進めたか」を残すやったことメモ帳である。本タスクは、そのメモ帳の書き方を `_design/sync-jobs-spec.md` という1つの正本に集める。個人情報はこのメモ帳に書かず、同じ仕事が重なった時は10分を目安に古い作業中メモを見直す。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| `sync_jobs` | やったことメモ帳 |
| `job_type` | 仕事の種類 |
| `metrics_json` | 仕事の進み具合メモ |
| 正本 | みんなが信じる1冊のルール帳 |
| lock TTL | 作業中メモを有効と見る時間 |

## Part 2: 技術者レベル

- 論理正本: `docs/30-workflows/_design/sync-jobs-spec.md`
- TS ランタイム正本: `apps/api/src/jobs/_shared/sync-jobs-schema.ts`
- 必須 enum: `response_sync`, `schema_sync`
- schema 方針: 共通メタデータと job_type 別拡張を分け、PII 不混入を `syncJobs.succeed()` 書き込み前検証と読み取り時 schema parse で守る
- lock TTL: 03b 実装値の10分を正本化し、変更時は `_design/` を先に更新する
- 参照先: 03a / 03b task spec と `.claude/skills/aiworkflow-requirements/references/database-schema.md`

## aiworkflow-requirements Step 1-A/B/C

| Step | 対象 | 操作 | 検証 |
| --- | --- | --- | --- |
| 1-A | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | `sync_jobs` 節を `_design/sync-jobs-spec.md` 参照へ変更 | `rg "_design/sync-jobs-spec" .claude/skills/aiworkflow-requirements/references/database-schema.md` |
| 1-B | `.claude/skills/aiworkflow-requirements/indexes/` | `mise exec -- pnpm indexes:rebuild` 実行 | index 差分が説明可能 |
| 1-C | workflow / task inventory | `verified / implementation / NON_VISUAL / implementation_complete_pending_pr` として登録 | `rg "03b-followup-005-sync-jobs-design-spec" .claude/skills/aiworkflow-requirements` |
