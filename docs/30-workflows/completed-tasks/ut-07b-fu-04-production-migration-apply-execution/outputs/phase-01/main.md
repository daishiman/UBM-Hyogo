# Phase 1: 要件定義 — ut-07b-fu-04-production-migration-apply-execution

[実装区分: 実装仕様書（operations verification + evidence writing）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-07b-fu-04-production-migration-apply-execution |
| task_id | UT-07B-FU-04-PRODUCTION-MIGRATION-APPLY-EXECUTION |
| phase | 1 / 13 |
| wave | Wave 7 |
| mode | serial |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL（runtime CLI evidence — VISUAL_ON_EXECUTION 相当） |
| issue | #424 (CLOSED) |
| scope | `apps/api/migrations/0008_schema_alias_hardening.sql` の production D1 ledger 既適用検証 + duplicate apply prohibition evidence 保存 + aiworkflow-requirements の既適用 fact 同期に限定。runbook 再設計・コード変更・ユーザー明示指示なしの commit / push / PR / production already-applied verification は対象外。 |

## なぜこのタスクが必要か（Why）

UT-07B-FU-03 は production migration apply runbook を作る DOC_PASS タスクであり、production D1 の runtime evidence 取得は scope 外として明示的に分離されている。FU-03 の完了条件に runtime evidence を混ぜると DOC_PASS と runtime PASS が同居し、誰がいつどの承認で本番 DB を確認したかが追跡不能になる。

本タスク FU-04 は、正本の既適用 fact を優先し、ユーザー明示承認後は read-only runtime verification のみを許可して fresh evidence を保存する operations verification タスクとして責務分離されている。

## 何を達成するか（What）

- production D1 ledger で `0008_schema_alias_hardening` の既適用 fact を確認し、duplicate apply を禁止
- hardening migration の責務である `schema_diff_queue.backfill_cursor` / `backfill_status` を post-check で確認
- preflight / duplicate apply prohibition / post-check の redacted evidence または placeholder evidence を `outputs/phase-11/` に保存
- aiworkflow-requirements の already-applied verification boundary を既存 ledger fact + placeholder evidence に基づき同期し、fresh runtime evidence はユーザー承認後だけ昇格

## Schema / 共有コード Ownership 宣言

| 対象 | 本タスクでの編集権 | owner / 参照元 | 理由 |
| --- | --- | --- | --- |
| `apps/api/migrations/0008_schema_alias_hardening.sql` | no（既存ファイル、再 apply 禁止） | UT-07B 系本体 | 本タスクは duplicate apply prohibition のみ |
| `apps/api/wrangler.toml` | no（参照のみ） | UT-07B / 03b | `[env.production]` D1 binding 確認のみ |
| `scripts/cf.sh` | no（wrapper 利用のみ） | infra owner | wrapper 改修は別タスク |
| `outputs/phase-11/*.log` | yes（新規作成） | 本タスク | runtime evidence 保存 |
| `.claude/skills/aiworkflow-requirements/references/*` | yes（Phase 12 のみ） | 本タスク | applied fact 同期 |
| production D1 schema | no（read-only verification のみ） | 本タスク | 正本 ledger 既適用のため mutation は禁止 |

## 変更対象ファイル一覧（CONST_005）

- 新規: `outputs/phase-01/main.md` 〜 `outputs/phase-13/main.md`
- 新規: `outputs/phase-11/preflight-list.log`、`apply.log`、`post-check.log`、`user-approval-record.md`、`redaction-checklist.md`
- 新規: `outputs/phase-12/` 配下 7 ファイル
- 編集（Phase 12）: `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-04-production-migration-apply-execution-artifact-inventory.md`
- 編集（Phase 12）: `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（本タスク entry の追加）
- コード変更あり: `scripts/d1/preflight.sh` / `scripts/d1/postcheck.sh` と Bats tests を already-applied verification contract に合わせて更新

## 主要関数・型・データ構造

- post-check 用 SQL 例:
  - `PRAGMA table_info(schema_diff_queue);`（`backfill_cursor` / `backfill_status` の存在確認）
- evidence ファイル shape: 各 `*.log` は `# command / # exit / # stdout (redacted) / # stderr (redacted)` の固定 4 セクション

## 入出力・副作用

- 副作用: production D1 mutation なし。ユーザー承認後も read-only verification のみ
- 入力: ユーザーの production read-only verification 明示承認、既存 ledger fact
- 出力: redacted runtime evidence、system spec 同期差分

## テスト方針

- preflight: `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` で `0008_schema_alias_hardening` が既適用として扱われることを確認し、未適用なら apply せずエスカレーション
- post-check: 上記 3 SQL を `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "..."` 経由で実行し、結果を redacted 形式で保存
- 自動テスト: `scripts/d1` の preflight / postcheck Bats tests を実行する

## ローカル実行・検証コマンド

```bash
# 認証確認（実値は出さない）
bash scripts/cf.sh whoami

# preflight（既適用確認、ユーザー承認後のみ）
bash scripts/d1/preflight.sh ubm-hyogo-db-prod --env production --migration 0008_schema_alias_hardening --expect applied --json

# duplicate apply prohibition
printf 'FORBIDDEN - duplicate production migration apply is not executed.\n'

# post-check
bash scripts/d1/postcheck.sh ubm-hyogo-db-prod --env production
```

## 実行ゲート（approval gate）

1. UT-07B-FU-03 PR が `main` に merge 済み
2. ユーザーが production already-applied verification を明示承認（テキスト記録を Phase 11 に残す）
3. `bash scripts/cf.sh whoami` で Cloudflare 認証 OK
4. preflight で「既適用」確認 PASS。未適用表示なら apply せずエスカレーション

## 参照資料

- docs/30-workflows/unassigned-task/task-ut-07b-fu-04-production-migration-apply-execution.md
- .claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md
- apps/api/migrations/0008_schema_alias_hardening.sql
- apps/api/wrangler.toml
- scripts/cf.sh
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」

## 多角的チェック観点

- production DB mutation は禁止。ユーザー明示承認なしに read-only verification もしない
- token 値・Account ID 値・raw PII を evidence / 仕様書に記録しない
- Issue #424 を再オープンしない
- D1 は physical rollback 不可。既適用 fact と runtime state がずれた場合は forward-fix / fact correction の判断をユーザーにエスカレーション
- `wrangler` 直接呼び出し禁止。必ず `bash scripts/cf.sh` 経由

## サブタスク管理

- [ ] Why / What / Scope を outputs/phase-01/main.md に転記
- [ ] approval gate を明記
- [ ] AC-1〜AC-7 と evidence path の対応表を作成
- [ ] read-only verification / duplicate apply 禁止 / forward-fix 方針を明記
- [ ] outputs/phase-01/main.md を作成

## 成果物

- outputs/phase-01/main.md

## 完了条件

- Why / What / Scope が確定している
- approval gate が明示されている
- AC-1〜AC-7 と evidence path の対応表が作成されている
- production DB mutation を伴わないこと、ユーザー明示承認必須、`scripts/cf.sh` 経由のみが明記されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] read-only 境界とユーザー承認ゲートが明記されている
- [ ] secret 値・Account ID 値を含めていない

## 次 Phase への引き渡し

Phase 2 へ、approval gate / AC 一覧 / 対象 DB / 対象 migration / forward-fix 方針 / wrapper 利用方針を渡す。
## 目的

production D1 ledger 上で既に applied と記録されている `0008_schema_alias_hardening.sql` を再適用せず、既適用検証と正本同期に責務を絞る。

## 実行タスク

1. `references/database-schema.md` の既適用 fact を前提として確認する。
2. duplicate apply 禁止を Phase 10 / Phase 11 の gate に反映する。
3. Phase 11 runtime verification はユーザー明示承認まで placeholder evidence とする。
4. Phase 12 strict 7 files と aiworkflow-requirements 同期を実体化する。

## 統合テスト連携

実 production D1 へは接続しない。既適用検証は redacted CLI evidence placeholder と aiworkflow-requirements 正本の static consistency で扱い、runtime verification はユーザー承認後にのみ実施する。
