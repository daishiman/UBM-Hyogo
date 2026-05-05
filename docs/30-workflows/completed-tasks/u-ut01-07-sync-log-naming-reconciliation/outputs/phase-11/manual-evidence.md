# Phase 11 outputs: manual evidence（実行コマンド + 期待結果 + 実測欄）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| タスク | U-UT01-07: sync_log 論理名と既存 sync_job_logs / sync_locks の整合 |
| 作成日 | 2026-04-30 |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 主ソース宣言

- 証跡の主ソース: 文書 grep ログ（rg）+ ファイル存在確認（ls）+ self-review
- screenshot を作らない理由: **NON_VISUAL**（UI なし / docs-only / `spec_created`）
- 実行日時: 2026-04-30
- 実行者: Codex

## §1. 用語整合 grep（旧揺れ 0 件確認）

```bash
# 概念名（必ず注釈付き）の出現箇所
rg -n "sync_log\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/

# 物理 ledger（注釈不要）
rg -n "sync_job_logs\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/

# 物理 lock（注釈不要）
rg -n "sync_locks\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/

# 旧揺れ表記（採択結果・canonical 宣言での実質違反が 0 件であるべき。Before 記述 / 検証コマンド / 期待値説明は除外）
rg -n "sync_logs\b|sync_lock\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/
```

| 検査 | 期待 | 実測 | 判定 |
| --- | --- | --- | --- |
| 概念 `sync_log` 出現 | 注釈付きで一貫使用 | 用語説明 / 比較案 / 検証コマンド内の出現のみ | PASS |
| 物理 `sync_job_logs` 出現 | 1 件以上 | 1 件以上 | PASS |
| 物理 `sync_locks` 出現 | 1 件以上 | 1 件以上 | PASS |
| 旧揺れ `sync_logs` / `sync_lock` | 採択結果・canonical 宣言での実質違反 0 件 | Before 記述 / 検証コマンド / 期待値説明内の出現のみ | PASS |

## §2. 既存 migration 不変性確認

```bash
rg -n "sync_job_logs|sync_locks" apps/api/migrations/0002_sync_logs_locks.sql
```

| 検査 | 期待 | 実測 | 判定 |
| --- | --- | --- | --- |
| `sync_job_logs` テーブル定義 | 1 件以上 | CREATE TABLE / index あり | PASS |
| `sync_locks` テーブル定義 | 1 件以上 | CREATE TABLE あり | PASS |
| 本タスクによる差分 | 0（改変なし） | `git status --short -- apps/api apps/web packages/shared` output empty | PASS |

## §3. aiworkflow-requirements drift 検出 grep

```bash
rg -n "sync_log\b|sync_logs\b|sync_job_logs\b|sync_locks\b" \
  .claude/skills/aiworkflow-requirements/references/database-schema.md
```

| 検査 | 期待 | drift 判定基準 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 物理 canonical（`sync_job_logs` / `sync_locks`）言及 | 0 件でも可 | 0 件 → 既存記述 drift なし。canonical 追補は UT-04 判定 | 0 hits | PASS |
| 概念 `sync_log` 単独言及 | 注釈付き or 0 件 | 注釈なし → drift あり | 0 hits | PASS |
| 旧揺れ `sync_logs` / `sync_lock` | 0 件 | 1 件以上 → drift あり | 0 hits | PASS |

> drift 検出時は Phase 12 で `database-schema.md` への doc-only 更新案を成果物に含め、`.agents` mirror sync を発火する。

## §4. outputs ファイル存在確認

```bash
ls -la docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/
```

| AC | 期待ファイル | 実測 | 判定 |
| --- | --- | --- | --- |
| AC-1 | `naming-canonical.md` | exists | PASS |
| AC-2 | `column-mapping-matrix.md` | exists | PASS |
| AC-3 | `backward-compatibility-strategy.md` | exists | PASS |
| AC-4 | `handoff-to-ut04-ut09.md` | exists | PASS |
| AC-5 | `handoff-to-ut04-ut09.md` | exists | PASS |
| AC-6 | （Phase 12 で formalize） | N/A | N/A |
| 補助 | `handoff-to-ut04-ut09.md` | exists | PASS |

## §5. cross-link 通過記録

| 参照元 | 参照先 | 状態（OK / Broken） |
| --- | --- | --- |
| `phase-08.md` | `outputs/phase-08/main.md` | OK |
| `phase-09.md` | `outputs/phase-09/main.md` | OK |
| `phase-10.md` | `outputs/phase-10/go-no-go.md` | OK |
| `phase-11.md` | `outputs/phase-11/main.md` | OK |
| `phase-11.md` | `outputs/phase-11/manual-smoke-log.md` | OK |
| 各 phase | `../unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md` | OK |
| 各 phase | `../ut-04-d1-schema-design/index.md` | OK |
| 各 phase | `../unassigned-task/U-UT01-07-FU01-ut09-canonical-sync-job-receiver.md` | OK |
| 各 phase | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | OK |
| 各 phase | `apps/api/migrations/0002_sync_logs_locks.sql` | OK |

## §6. UT-04 / UT-09 引き継ぎ self-review

| 確認項目 | 対象 | 期待 | 実測 |
| --- | --- | --- | --- |
| UT-04 担当者が本仕様書のみで migration 計画を着手できるか | `outputs/phase-02/handoff-to-ut04-ut09.md` | YES | YES |
| UT-09 担当者が本仕様書のみで mapper 実装を着手できるか | `outputs/phase-02/handoff-to-ut04-ut09.md` | YES | 受け皿タスク未確定のため `U-UT01-07-FU01` に formalize |
| 再質問が必要となる箇所 | 両 handoff | 0 件 | UT-09 実装タスク path のみ follow-up 化 |

## 採取記録テンプレ

各 § で実測時には以下を記録すること:

- コマンド（コピペ可能）
- 実行日時（ISO 8601 UTC）
- stdout 抜粋（必要に応じて行数で省略）
- 期待値との一致 / 不一致
- PASS / FAIL 判定
- 補足（drift あり時の修正計画など）

## 完了基準

- [x] §1〜§6 すべての実測欄が記入されている（または N/A 理由付き）
- [x] 旧揺れ用語の実質違反が 0 件であることが §1 で実測確認
- [x] 既存 migration 差分が 0 であることが §2 で実測確認
- [x] aiworkflow-requirements drift の有無が §3 で結論確定
- [x] AC-1〜AC-5 対応 outputs ファイルが §4 で存在確認
- [x] cross-link 切れが §5 で 0 件確認
- [x] UT-04 / UT-09 引き継ぎ self-review が §6 で OK 判定
