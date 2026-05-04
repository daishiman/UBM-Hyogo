# Phase 7: 統合検証（post-check） — ut-07b-fu-04-production-migration-apply-execution

[実装区分: 実装仕様書（operations verification + evidence writing）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 7 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #424 (CLOSED) |

## 目的

read-only post-check による `ubm-hyogo-db-prod` schema 状態を確認し、`0008_schema_alias_hardening.sql` が責務を持つ `schema_diff_queue.backfill_cursor` / `backfill_status` の反映済み状態を統合的に検証する。

## 実行タスク

ユーザー承認後の read-only runtime verification で以下を実行する。`schema_aliases` table / UNIQUE index 2 件は別 migration `0008_create_schema_aliases.sql` の責務であり、本 Phase の PASS 条件に含めない。

### schema_diff_queue 追加カラム確認

```bash
bash scripts/d1/postcheck.sh ubm-hyogo-db-prod --env production
```

期待: `schema_diff_queue.backfill_cursor` / `schema_diff_queue.backfill_status` が `true` として返る。

## 統合検証 PASS / FAIL 判定

| Check | PASS | FAIL 時の対処 |
| --- | --- | --- |
| schema_diff_queue.backfill_cursor | 存在する | forward-fix migration または正本 fact correction の判断をユーザーにエスカレーション |
| schema_diff_queue.backfill_status | 存在する | 上同 |

2 件すべて PASS で初めて AC-5 を PASS にする。1 件でも FAIL があれば AC-5 は FAIL とし、Phase 12 で forward-fix / fact correction の扱いを `unassigned-task-detection.md` に列挙する。

## evidence 取り扱い

- post-check 出力は `outputs/phase-11/post-check.log` に保存する
- redaction 後に保存（account_id / UUID / token を redact）
- raw `.log.raw` は git に含めない

## D1 rollback 不可ポリシー

- D1 は physical rollback 不可
- post-check FAIL 時も `bash scripts/cf.sh` 経由の rollback / undo コマンドは使わない
- 必ず forward-fix migration または正本 fact correction の扱いをユーザーにエスカレーションする

## 参照資料

- apps/api/migrations/0008_schema_alias_hardening.sql
- scripts/cf.sh
- .claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md

## 多角的チェック観点

- post-check の期待値が migration ファイル定義と一致しているか
- FAIL 時に rollback を実行しない方針が徹底されているか
- evidence redaction が漏れていないか

## サブタスク管理

- [ ] hardening columns post-check を spec 化
- [ ] PASS/FAIL 判定表を作成
- [ ] forward-fix 方針を明記
- [ ] outputs/phase-07/main.md を作成

## 成果物

- outputs/phase-07/main.md

## 完了条件

- hardening columns post-check と PASS/FAIL 条件が確定
- D1 rollback 不可ポリシーが明示
- evidence path / redaction 要件が確定

## タスク100%実行確認

- [ ] 2 カラムすべてに PASS 条件がある
- [ ] FAIL 時に forward-fix へ流す設計
- [ ] secret 値を含めていない

## 次 Phase への引き渡し

Phase 8 へ、品質ゲート（既適用検証専用）を渡す。
## 統合テスト連携

post-check SQL は production runtime verification 承認後のみ実行する。spec_created 段階では SQL shape と expected objects の static contract を検証対象にする。
