# Phase 5 Output: 判定確定ランブック（verdict-runbook）

> 本ファイルは確定判定の**正式記録**。Phase 2 `gap-analysis-and-verdict.md`（本 workflow 正本成果物）の判定を承継・確定する。Phase 2 を上書きせず、その結論を運用ランブックとして固定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-sync-audit-tables-necessity-judgement-001 |
| Phase | 5 / 13 |
| 承継元 | outputs/phase-02/gap-analysis-and-verdict.md §4 |
| 実測基準コミット | origin/dev `f6faeb005`（2026-05-31 時点） |
| GitHub Issue | #235（CLOSED — reopen しない） |

## 1. 確定判定（一意）

> ## 判定: **新設不要（NO NEW TABLE REQUIRED）**
>
> `sync_audit_logs` / `sync_audit_outbox` は**新設しない**。現行の **`sync_jobs` ledger + `sync_job_logs` 補助台帳 + zod 構造化 `metrics_json`** で、UT-21 が要求した audit 観点 O-1〜O-4 を充足する。
>
> `sync_jobs` のカラム拡張も**不要**。`metrics_json` が passthrough zod で任意キー拡張に対応済みのため、将来の追加 metric は DDL 変更なしで吸収できる。

- 判定区分（原典 U02 §5 Phase 3 の 3 分類）: 「**新設不要（既存で十分）**」。
- 本判定は Phase 2 §4 の結論を一語一句変えずに承継する。Phase 5 で新たな判定は生成しない。

## 2. 3 条件非該当の要約（判定基準 4.3）

| # | 条件 | 該当? | 要約根拠（詳細は Phase 2 §3） |
| --- | --- | --- | --- |
| 1 | 行単位の差分追跡が運用上の必須要件である | **非該当** | MVP / specs に行単位 audit の必須要件なし。冪等 upsert + 集計 `metrics` で運用充足 |
| 2 | `sync_jobs` 自体への書込失敗を別経路で記録する必要がある | **非該当** | D1 retry / `SQLITE_BUSY` backoff で吸収。冪等 sync（`forms.responses.list` + cursor 再開）のため job 行欠落は次 run の cursor 再開で回復 |
| 3 | 外部監査・コンプラで実行履歴を別テーブルに分離する要請がある | **非該当** | 親 close-out 時点で該当インシデント / エスカレーション 0 件。支部会員サイト MVP に分離要請なし |

→ 3 条件すべて非該当。よって新設しない。

## 3. docs-only 確定（CONST_004 例外）

- 判定が「新設不要」であるため、本タスクの成果物は**判定証跡（ドキュメント）のみ**。`apps/api/migrations` / `apps/api/src` / `packages/` への変更は一切発生しない。
- CONST_004 の例外条件「対象タスクが純粋に判定・合意形成で完結し、目的達成にコード変更が不要」に該当する docs-only 仕様書として確定する。
- 実証: `git status --short apps packages` が **0 件**であることを Phase 11（`outputs/phase-11/manual-test-result.md`）で再現確認する。
- ステータス据え置き: 判定仕様書としての存続意義があるため、`spec_created` を `completed` へ自動昇格しない（監査タスクテンプレ §完了ステータス判断）。

## 4. 解除条件（将来の再検討トリガ）

以下のいずれかが将来観測された場合に限り、**別タスクの実装仕様書**（マイグレーション + `apps/api` audit writer）として新設を再検討する。本サイクルでは該当**ゼロ**のため起票しない。これは CONST_005 が禁じる「今回完了すべき改善の先送り」ではなく、現時点では実需が存在しない**将来条件**であり、本サイクルで「新設不要」の判定自体は完了している。

| 解除トリガ | 受け皿 | 起票時の実装区分 |
| --- | --- | --- |
| T-1: 行単位差分追跡が監査要件として確定（外部監査 / コンプラ） | 新規実装タスク | 実装仕様書（新規テーブル DDL + writer） |
| T-2: `sync_jobs` 書込失敗を別経路で恒久記録する運用インシデントが発生 | 新規実装タスク | 実装仕様書（`sync_audit_outbox` 相当 + flush job） |
| T-3: `metrics_json` の集計では追跡不能な障害が 1 件以上特定され、かつ列拡張で吸収困難 | 新規実装タスク | 実装仕様書 |

> CONST_005 非該当の論拠: 解除条件は「いま実装すべきだが後回しにする」課題ではなく、「将来 実需が観測されたら起票する」未来トリガである。現時点の該当件数は 0。

## 5. 新設要に転じた場合の実装仕様書 起票手順（参考・本タスクでは起票しない）

T-1〜T-3 のいずれかが観測された将来、後続実行者が迷わないための概略手順。**本タスクの責務外であり、ここでは一切起票・実装しない。**

1. **新規タスク仕様書の作成**: `docs/30-workflows/<新 issue 番号>-sync-audit-tables/` を作成し、実装仕様書（CONST_004 デフォルト）として Phase 1-13 を構成する。本 verdict-runbook §4 のトリガを「検出元」に記録する。
2. **マイグレーション追加箇所**: `apps/api/migrations/` に次番（既存最大 `0014` の次以降）の SQL を新設する。`0014_notification_outbox.sql` を**実需ベース新設の前例テンプレート**として参照する。
   - `sync_audit_logs`: run 単位ではなく行単位 audit を要する場合のみ row テーブルとして定義（PK / `job_id` FK 相当 / `entity_id` / `before_json` / `after_json` / `recorded_at` / index）。
   - `sync_audit_outbox`: at-least-once 退避が必要な場合のみ定義（`payload_json` / `status` / `attempts` / `next_retry_at` / flush 用 index）。`notification_outbox` の列構成を踏襲する。
3. **writer 配置**: `apps/api/src/repository/` に audit writer を追加し、`syncJobs.ts` の lifecycle（`succeed` / `fail`）から best-effort 呼び出しを行う。`assertNoPii` / `PII_FORBIDDEN_KEYS`（`sync-jobs-schema.ts`）を流用し PII 遮断を維持する。outbox を新設する場合は flush job を `apps/api/src/jobs/` に追加する。
4. **test 方針の概略**: 新規 `*.spec.ts`（不変条件 #8: `*.test.ts` 禁止）で次を検証する。
   - DDL 適用後のテーブル存在 / index。
   - audit writer の書き込み（`succeed` / `fail` 双方）と PII 遮断。
   - outbox を新設する場合: 書込失敗 → outbox 退避 → flush で清書、の at-least-once 経路。
5. **不変条件遵守**: #4（admin-managed 分離）/ #5（D1 直接アクセス apps/api 限定）/ #8（spec suffix）を維持する。新 endpoint 追加・Google Form 仕様変更は行わない。

> 再掲: 上記は将来トリガ発火時の参考であり、現時点では起票・実装を**しない**。

## 6. 親 close-out §(d) との整合

- 親 `ut21-forms-sync-conflict-closeout` Phase 2 §(d) は「保留対象 = `sync_audit_logs` / `sync_audit_outbox`」「解除条件 = U02 で不足を 1 件以上特定し列拡張で吸収困難と論証された場合のみ新設」「受け皿 = U02（本タスク）」と設計していた。
- 本判定は U02（本タスク）として、その解除条件を**満たさない（不足 0 件）**ことを論証し、「保留」を「**新設不要で確定**（解除条件は将来トリガ T-1〜T-3 へ移譲）」へ閉じる。
- 親 §(d) の保留方針・解除条件は**上書きせず承継**する。本 verdict-runbook が確定判定の正本となるが、親文書を改変しない（二重正本回避）。

## 7. 不変条件 touched

| # | 不変条件 | 本判定での扱い |
| --- | --- | --- |
| #4 | Form schema 外データは admin-managed 分離 | `sync_jobs` / `sync_job_logs` は admin-managed ledger。判定は分離境界を変更しない |
| #5 | D1 直接アクセスは `apps/api` に閉じる | 棚卸し・将来起票手順の対象はすべて `apps/api` 配下。`apps/web` からの D1 参照を持ち込まない |
