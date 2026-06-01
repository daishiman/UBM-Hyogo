# Phase 7 Output: AC マトリクス（AC × 検証 × 成果物 トレース）

> 本ファイルは index.md の AC-1〜AC-12 を正本として逐語転記し、各 AC の充足証跡をトレースする。判定タスクのため AC は「監査スコープ定義 + 確定判定（新設不要）+ 整合確認」の充足を意味する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-sync-audit-tables-necessity-judgement-001 |
| Phase | 7 / 13 |
| AC 正本 | index.md §受入条件 (AC) |
| 確定判定 | 新設不要（NO NEW TABLE REQUIRED） |

## 1. AC トレース表

| AC | 受入条件（index.md 逐語） | 検証方法 | 担当 Phase | 成果物パス | 判定 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | `sync_jobs` 現行 schema（`job_id` / `job_type` / `started_at` / `finished_at` / `status` / `error_json` / `metrics_json`）が棚卸し表として記録されている | 棚卸し表確認（DDL 実測 → 表化） | Phase 1（inventory）/ Phase 2（棚卸し表） | outputs/phase-02/gap-analysis-and-verdict.md §1.1 | PASS |
| AC-2 | 補助台帳 `sync_job_logs`（カウント列）と `metrics_json` zod schema（構造化キー）の現行構造が棚卸しされている | 棚卸し表確認（DDL + zod schema 実測） | Phase 2 | outputs/phase-02/gap-analysis-and-verdict.md §1.2 / §1.3 | PASS |
| AC-3 | UT-21 audit 観点 4 種（実行ごと詳細 / outbox 失敗退避 / 後追い清書 / 行単位差分）× 現行 ledger カバー可否のギャップ表が作成されている | ギャップ表確認（O-1〜O-4 × ◯/△/✕） | Phase 2 | outputs/phase-02/gap-analysis-and-verdict.md §2 | PASS |
| AC-4 | 判定基準 4.3 の 3 条件（行単位差分必須 / sync_jobs 書込失敗の別経路記録 / 外部監査・コンプラ分離要請）への該当/非該当判定が記録されている | 判定基準適用確認（3 条件 × 該当/非該当） | Phase 2 | outputs/phase-02/gap-analysis-and-verdict.md §3 | PASS |
| AC-5 | 最終判定（新設不要 / `sync_jobs` 拡張 / 新規テーブル）が一意に記録されている（結論: **新設不要**） | verdict 一意性確認 | Phase 2（確定）/ Phase 5（承継） | outputs/phase-02/gap-analysis-and-verdict.md §4 / outputs/phase-05/verdict-runbook.md | PASS |
| AC-6 | 判定が「新設不要」のため本タスクが docs-only（コード変更ゼロ）であることが CONST_004 例外として明記されている | docs-only 確定確認 | Phase 2 / Phase 5 / Phase 9 | outputs/phase-02/gap-analysis-and-verdict.md §5 / outputs/phase-09/main.md §5 | PASS |
| AC-7 | 解除条件（将来 新設を再検討するトリガと、その時の受け皿＝別実装タスク）が明記されている | 解除条件記述確認（T-1〜T-3 + 受け皿） | Phase 2 / Phase 5 | outputs/phase-02/gap-analysis-and-verdict.md §6 | PASS |
| AC-8 | 親 close-out §(d) の保留方針・解除条件と本判定が整合している（U02 が解除条件の判定主体であった旨） | 整合突合（親 §(d) × 本判定） | Phase 2 / Phase 8 | outputs/phase-02/gap-analysis-and-verdict.md §7 / outputs/phase-08/main.md | PASS |
| AC-9 | `sync_audit_logs` / `sync_audit_outbox` がコードベース（`apps/api/migrations` / `apps/api/src`）に存在しないことの実測根拠（rg/grep 出力）が記録されている | rg/grep 実測（非存在の raw 出力） | Phase 4（一次収集）/ Phase 9（再確認） | outputs/phase-04/raw-evidence.md / outputs/phase-09/main.md §1 | PASS |
| AC-10 | 不変条件 #4（Form schema 外データは admin-managed 分離）/ #5（D1 直接アクセスは `apps/api` に閉じる）に違反する記述が存在しない | 違反スキャン（記述監査） | Phase 9 | outputs/phase-09/main.md §2 | PASS |
| AC-11 | GitHub Issue #235 が CLOSED 状態のまま、本仕様書が成果物として参照可能になっている | Issue 状態 + 紐付け確認 | Phase 1（spec_purpose）/ Phase 12（cross-link） | index.md §メタ情報（Issue #235 CLOSED）/ outputs/phase-12/main.md | PASS |
| AC-12 | 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS である | 4条件評価確認 | Phase 1（一次）/ Phase 10（最終 GO/NO-GO） | outputs/phase-01/main.md §7 / outputs/phase-10/go-no-go.md | PASS |

## 2. 担当 Phase 整合確認（Phase 1 §6 との突合）

Phase 1 inventory §6「AC への監査成果物の埋め込み」が定めた生成 Phase と、本マトリクスの担当 Phase が矛盾しないことを確認する。

| AC | Phase 1 §6 の生成 Phase | 本マトリクスの担当 Phase | 矛盾 |
| --- | --- | --- | --- |
| AC-3 | Phase 2 | Phase 2 | なし |
| AC-4 | Phase 2 | Phase 2 | なし |
| AC-5 | Phase 2 / 5 | Phase 2（確定）/ Phase 5（承継） | なし |
| AC-9 | Phase 4 | Phase 4（一次）/ Phase 9（再確認） | なし（再確認は追加担当であり上書きでない） |

## 3. partial / 未トレース AC

| 区分 | 件数 | 内容 |
| --- | --- | --- |
| 未トレース AC | 0 | AC-1〜AC-12 すべて成果物にトレース済み |
| partial AC | 0 | 判定は現行コードに完全に閉じており、部分充足の AC は存在しない |

## 4. サマリ

> **AC 全 12 件 PASS。** 未トレース AC 0 件 / partial AC 0 件。
>
> 各 AC は本 workflow の正本成果物 `outputs/phase-02/gap-analysis-and-verdict.md` を中核に、Phase 4（rg/grep 実測）・Phase 5（verdict 承継）・Phase 8（正本突合）・Phase 9（正本整合監査）・Phase 10（4条件 GO/NO-GO）でトレースされる。確定判定「新設不要」と矛盾する AC は存在しない。
