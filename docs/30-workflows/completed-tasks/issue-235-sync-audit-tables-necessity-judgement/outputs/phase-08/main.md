# Phase 8 Output: 正本突合（DRY 化の再解釈）

> 本ファイルは判定タスクの「DRY 化」を「正本突合（重複記述・矛盾の排除）」へ再解釈し、本判定が既存正本（親 close-out §(d) / task-workflow.md current facts）と重複・矛盾しないことを確認する。判定結論の本文は再記述せず、正本 `outputs/phase-02/gap-analysis-and-verdict.md` をパス参照する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-sync-audit-tables-necessity-judgement-001 |
| Phase | 8 / 13 |
| 判定正本（一意） | outputs/phase-02/gap-analysis-and-verdict.md |
| 突合対象 1 | 親 close-out Phase 2 §(d) `migration-matrix-design.md` |
| 突合対象 2 | `.claude/skills/aiworkflow-requirements/references/task-workflow.md` |

## 1. 親 close-out §(d) 保留方針 と 本判定の関係

親 `ut21-forms-sync-conflict-closeout` Phase 2 §(d)（`outputs/phase-02/migration-matrix-design.md`）は「`sync_audit_logs` / `sync_audit_outbox` 新設保留方針（3 項目）」を設計し、判定主体を本タスク（UT21-U02）へ明示委譲していた。両者の関係を以下に突合する。

| 親 §(d) の要素 | 親 §(d) の記述 | 本判定（UT21-U02）での扱い | 関係 |
| --- | --- | --- | --- |
| 保留対象 | `sync_audit_logs`（best-effort 監査ログ）/ `sync_audit_outbox`（at-least-once 配送 outbox） | 同一対象を判定。判定結果 = **新設不要** | 承継（対象を変更しない） |
| 保留条件 | `sync_jobs` ledger の不足分析が未実施。不足を裏付けるインシデント / 監査要件のエスカレーション未観測 | 最新コード実測で不足分析を実施し、不足 0 件を論証（Phase 2 §2/§3） | 確定（未実施だった分析を完了） |
| 解除条件 | U02 にて `sync_jobs` がカバーできない領域を 1 件以上特定し、列拡張で吸収困難であることが論証された場合のみ新設 | 解除条件を **満たさない（特定 0 件）** ことを論証。将来トリガ T-1〜T-3 として移譲（Phase 2 §6） | 承継（解除条件を将来トリガへ再構成） |
| 受け皿タスク | UT21-U02 | 本タスクが受け皿として判定を確定 | 充足（委譲先として完結） |
| 本タスク内での扱い | 新設しない。U02 へ委譲する旨を記録 | 委譲を受領し「新設不要で確定」へ閉じる | 完結（保留 → 確定） |

> **関係の結論**: 本判定は親 §(d) を **上書き（override）しない**。親 §(d) が設計した「保留方針・解除条件・受け皿委譲」を **承継し、不足分析を実施して「新設不要」へ確定** する関係である。親 §(d) の解除条件は失効せず、将来トリガ T-1〜T-3（Phase 2 §6）として継続する。

## 2. task-workflow.md current facts との矛盾チェック

`.claude/skills/aiworkflow-requirements/references/task-workflow.md` は `sync_jobs` 系の current facts スナップショットを保持する。本判定との整合を突合する。

| task-workflow.md の記述（current facts） | 本判定との関係 | 矛盾 |
| --- | --- | --- |
| 現行正本は Forms sync（`POST /admin/sync/schema` / `POST /admin/sync/responses`、`sync_jobs` ledger） | 本判定の棚卸し対象（`sync_jobs` ledger）と一致 | なし |
| 単一 `POST /admin/sync`、`GET /admin/sync/audit`、`sync_audit_logs`、`sync_audit_outbox` は **新設しない** | 本判定の確定結論「新設不要」と一致 | なし |
| audit table 要否は **UT21-U02** に分離する | 本タスク = UT21-U02 が audit table 要否を判定した受け皿 | なし（分離先と一致） |

> **矛盾チェック結論**: task-workflow.md current facts は「新設しない」を維持しつつ、2026-05-31 の same-wave sync で「UT21-U02 / Issue #235 により新設不要を確定」へ更新済み。本判定「新設不要」は current facts の確定証跡であり、矛盾は 0 件。

## 3. 重複記述の排除方針（DRY）

判定結論の本文は **正本 `outputs/phase-02/gap-analysis-and-verdict.md` に一意化** し、他成果物は判定本文を再記述せずパス参照で承継する。

| 成果物 | 判定に関する役割 | 重複排除方針 |
| --- | --- | --- |
| outputs/phase-02/gap-analysis-and-verdict.md | **判定正本**（ギャップ表 / 判定基準適用 / 確定判定 / 解除条件） | 判定本文を保持する唯一の正本 |
| outputs/phase-05/verdict-runbook.md | 判定の承継・docs-only 確定・解除条件の運用記録 | Phase 2 §4 をパス参照で承継。判定本文を再導出しない |
| outputs/phase-07/ac-matrix.md | AC × 成果物トレース | 各 AC を Phase 2 へリンク。判定本文を再記述しない |
| outputs/phase-08/main.md（本書） | 正本突合 | 関係・矛盾チェックのみ。判定本文は再記述しない |
| outputs/phase-09/main.md | 正本整合監査 | 非存在再確認 / 不変条件監査。判定本文を再記述しない |
| outputs/phase-10/go-no-go.md | 4条件 GO/NO-GO | 判定への合否のみ。判定本文を再記述しない |

## 4. 二重正本回避（三者の役割分離）

| 文書 | 役割 | 判定結論の正本性 |
| --- | --- | --- |
| 本 workflow `outputs/phase-02/gap-analysis-and-verdict.md` | 確定判定の正本 | **唯一の判定正本** |
| 親 §(d) `migration-matrix-design.md` | 保留・委譲の記録（判定は未記録） | 判定正本ではない（委譲元） |
| `task-workflow.md` | current facts スナップショット | 判定正本ではない（事実参照） |

> **二重正本回避の固定**: 判定結論を持つ正本は本 workflow（Phase 2）のみ。親 §(d) は委譲記録、task-workflow.md は current facts であり、いずれも判定結論の独立正本を持たない。これにより三者間で判定結論の二重管理・drift は発生しない。

## 5. 突合サマリ

- 親 §(d) との関係: **承継・確定**（上書きでない）。解除条件は将来トリガ T-1〜T-3 へ継続。
- task-workflow.md との矛盾: **0 件**。current facts は本判定を裏付ける。記述変更不要。
- 判定正本: `outputs/phase-02/gap-analysis-and-verdict.md` に一意化（DRY）。他成果物はパス参照。
- 二重正本: なし（三者役割分離で回避）。
