# Phase 11: production 既適用検証 + runtime evidence 取得 — ut-07b-fu-04-production-migration-apply-execution

[実装区分: 実装仕様書（operations verification + evidence writing）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 11 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL（runtime CLI evidence — VISUAL_ON_EXECUTION 相当） |
| issue | #424 (CLOSED) |
| execution_allowed | false until explicit_user_instruction（read-only Cloudflare runtime verification のみ） |

## 目的

正本 `database-schema.md` が示す production D1 ledger fact（`0008_schema_alias_hardening.sql` applied at `2026-05-01 08:21:04 UTC`）を優先し、duplicate migration apply を実行しないことを evidence として固定する。

ユーザー明示承認がある場合だけ、`bash scripts/cf.sh` 経由で read-only の `migrations list` と hardening migration の post-check（`schema_diff_queue.backfill_cursor` / `backfill_status`）を実行する。未承認時は placeholder evidence として `blocked_until_user_approval` を記録し、runtime PASS とは扱わない。

## 実行タスク（runtime verification は user 明示指示後）

1. Phase 10 ゲート G10-1〜G10-6 が read-only verification 用に整っていることを再確認
2. `bash scripts/cf.sh whoami` で auth 確認（値は記録しない）
3. preflight: `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` を実行し、`0008_schema_alias_hardening` が既適用 fact と整合することを確認
4. `outputs/phase-11/apply.log` には `FORBIDDEN - duplicate production migration apply is not executed` を記録する。`d1 migrations apply` は実行しない
5. post-check: `PRAGMA table_info(schema_diff_queue);` で `backfill_cursor` / `backfill_status` を確認する
6. raw log を redaction し `*.log` として保存、`outputs/phase-11/redaction-checklist.md` を完了
7. `outputs/phase-11/main.md` に PASS/FAIL/BLOCKED 一覧、次工程引き渡しを記述
8. `*.log.raw` は削除または `.gitignore` 化

## 必須 evidence path（NON_VISUAL / runtime CLI evidence）

| path | 内容 | 関連 AC | shape |
| --- | --- | --- | --- |
| outputs/phase-11/main.md | 実行サマリ・PASS/FAIL/BLOCKED 一覧・次工程引き渡し | 全体 | markdown |
| outputs/phase-11/preflight-list.log | preflight `migrations list` の redacted log、または未承認 placeholder | AC-2 | `# command / # exit / # stdout (redacted) / # stderr (redacted) / # timestamp (UTC)` |
| outputs/phase-11/apply.log | duplicate apply prohibition の no-op evidence | AC-4 | 同上 |
| outputs/phase-11/post-check.log | `schema_diff_queue` hardening columns の read-only post-check、または未承認 placeholder | AC-5 | 同上 |
| outputs/phase-11/user-approval-record.md | ユーザー明示承認の記録。未承認時は `blocked_until_user_approval` | AC-3 | markdown |
| outputs/phase-11/redaction-checklist.md | 各 log の redaction 完了チェック表 | AC-6 | チェックリスト |
| outputs/phase-11/manual-smoke-log.md | runtime verification 未実行境界と安全経路の説明 | 補助 | markdown |
| outputs/phase-11/link-checklist.md | 参照 path の存在確認 | 補助 | markdown |

`preflight-list.log` / `post-check.log` が placeholder の場合、AC-2 / AC-5 は runtime PASS ではなく `blocked_until_user_approval` とする。`apply.log` は no-op prohibition evidence であり、apply 成功ログではない。

## evidence shape（共通テンプレ）

```text
# command
FORBIDDEN - duplicate production migration apply is not executed.

# exit
not_run_duplicate_apply_prohibited

# stdout (redacted)
0008_schema_alias_hardening.sql is already recorded as production-applied in database-schema.md.

# stderr (redacted)
No runtime mutation command executed.

# timestamp (UTC)
2026-05-04T00:00:00Z
```

## redaction policy（再掲）

- account_id → `<account_id>`
- D1 database UUID → `<d1-uuid>`
- API token / OAuth / cookie → `<redacted-secret>`
- 個人情報（email / name 等） → `<redacted-pii>`
- 残してよい: wrangler バナー、duration、行数、migration 名、DB 名、env 名、SQL 文

## PASS / FAIL / BLOCKED 判定

| AC | PASS | FAIL | BLOCKED |
| --- | --- | --- | --- |
| AC-2 preflight | runtime log で既適用 fact と DB/env が整合 | 未適用表示 / DB mismatch | user approval 未取得 / auth NG |
| AC-3 user approval | read-only verification 承認テキスト記録 | mutation 承認しかない / 承認内容不一致 | 承認なし |
| AC-4 duplicate apply prohibition | apply not executed and reason recorded | apply command executed | preflight mismatch |
| AC-5 post-check | `schema_diff_queue.backfill_cursor` / `backfill_status` の read-only 確認 PASS | 1 件以上 missing | user approval 未取得 |
| AC-6 redaction | checklist 全 PASS | 漏れあり → 再 redact | runtime log 未取得 |

## 多角的チェック観点

- raw log を `outputs/phase-11/` に永続化しない
- `d1 migrations apply` を実行しない。未適用表示や schema mismatch は正本 fact drift としてエスカレーションする
- ユーザー承認なしに Cloudflare runtime verification へ進まない
- production DB 名と env は `ubm-hyogo-db-prod` / `production` で統一
- `wrangler` 直接呼び出しが混入していないか log 内容で確認
- post-check FAIL 時は D1 rollback コマンドを使わず、forward-fix / fact correction の判断をユーザーにエスカレーションする

## サブタスク管理

- [ ] Phase 10 ゲート再確認
- [ ] preflight read-only verification + log 保存（承認時のみ）
- [ ] ユーザー承認取得 + 記録
- [ ] duplicate apply prohibition log 保存
- [ ] post-check hardening columns + log 保存（承認時のみ）
- [ ] redaction 完了 + checklist 記録
- [ ] outputs/phase-11/main.md を作成
- [ ] FAIL 時は forward-fix / fact correction の扱いをエスカレーション

## 成果物

- 上記「必須 evidence path」一式（8 ファイル）

## 完了条件

- AC-2〜AC-6 が PASS / FAIL / BLOCKED いずれかで判定済み
- `outputs/phase-11/` に必須 evidence path が揃っている
- runtime verification 未承認の場合は `blocked_until_user_approval` と明記され、runtime PASS と誤表記されていない
- `d1 migrations apply` が実行されていない
- `*.log.raw` が `outputs/phase-11/` に残っていない

## タスク100%実行確認

- [ ] PII / secret / account_id 漏洩がゼロ
- [ ] AC ごとに evidence path が実在
- [ ] apply は実行されていない
- [ ] placeholder evidence と runtime evidence が分離されている

## 次 Phase への引き渡し

Phase 12 へ、既存 ledger fact + placeholder evidence + duplicate apply prohibition を渡す。fresh runtime evidence は user-approved read-only verification 後にのみ同期対象へ昇格する。

## 参照資料

- `.claude/skills/aiworkflow-requirements/references/database-schema.md` の production D1 ledger fact
- `scripts/cf.sh`
- `scripts/d1/{preflight,postcheck,evidence,apply-prod}.sh`
- `docs/30-workflows/ut-07b-fu-04-production-migration-apply-execution/outputs/phase-11/`

## 統合テスト連携

runtime verification は未承認のため未実行。placeholder evidence は `PENDING_RUNTIME_EVIDENCE` / `blocked_until_user_approval` とし、PASS として扱わない。
