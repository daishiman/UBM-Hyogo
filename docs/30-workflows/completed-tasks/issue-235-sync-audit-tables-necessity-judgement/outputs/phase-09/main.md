# Phase 9 Output: 正本整合監査

> 本ファイルは判定タスクの「品質保証」を「正本整合監査」へ再解釈し、判定の前提が崩れていないことを再検証する。判定本文は再記述せず、正本 `outputs/phase-02/gap-analysis-and-verdict.md` をパス参照する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-sync-audit-tables-necessity-judgement-001 |
| Phase | 9 / 13 |
| 監査基準コミット | origin/dev `f6faeb005`（Phase 2 実測基準と一致） |
| 監査結論 | 整合（partial 無 / 違反 0 / verdict 一意） |

## 1. `sync_audit_*` 非存在の再確認

判定の中核前提「`sync_audit_logs` / `sync_audit_outbox` がコードベースに実テーブルとして存在しない」を再検証する。

### 1.1 再検索方針

```bash
rg -n "sync_audit_logs|sync_audit_outbox" apps/api/migrations apps/api/src
rg -n "CREATE TABLE[^;]*sync_audit" apps/api/migrations
```

### 1.2 再確認結果

| 対象テーブル | `CREATE TABLE` の有無 | 結論 |
| --- | --- | --- |
| `sync_audit_logs` | なし（DDL 0 件） | 実テーブル非存在 |
| `sync_audit_outbox` | なし（DDL 0 件） | 実テーブル非存在 |

→ 判定対象 2 テーブルは `apps/api/migrations` / `apps/api/src` に **実テーブルとして存在しない**。Phase 2 §4 の確定判定「新設不要」の前提は維持されている（raw 出力の一次証跡は Phase 4 / Phase 11）。

### 1.3 別文脈 `sync_audit` 言及との区別（誤検知防止）

`sync_audit` という文字列は以下 2 箇所に出現するが、いずれも判定対象 2 テーブル（`sync_audit_logs` / `sync_audit_outbox`）とは **別物** であり、本判定を変動させない。

| 出現箇所 | 文字列 | 種別 | 判定対象との関係 |
| --- | --- | --- | --- |
| `apps/api/migrations/0002_sync_logs_locks.sql:4`（コメント） | 「既存の sync_audit テーブルとは別に…」 | SQL コメント（DDL ではない） | 別テーブル名の言及。`sync_audit_logs` / `sync_audit_outbox` の DDL ではない |
| `.claude/skills/aiworkflow-requirements/references/task-workflow.md`（current facts） | D1 schema 4テーブルの 1 つ `sync_audit` / 「`sync_audit_logs`、`sync_audit_outbox` は新設しない」 | facts スナップショット | `sync_audit`（単数・別 schema 文脈）は判定対象 2 テーブルと別名。`sync_audit_logs`/`outbox` 言及は「新設しない」方針記述で本判定と整合 |

> **区別の結論**: `sync_audit`（単数・コメント / current facts 上の別 schema 名）と、判定対象 `sync_audit_logs` / `sync_audit_outbox`（二段監査テーブル）は別物。前者の存在は後者の非存在判定に影響しない。誤って前者を「判定対象が存在する」と解釈しないよう本節で固定する。

## 2. 不変条件 #4 / #5 違反スキャン

| # | 不変条件 | スキャン観点 | 違反件数 | 根拠 |
| --- | --- | --- | --- | --- |
| #4 | Form schema 外データは admin-managed として分離 | 判定文書が `sync_jobs` / `sync_job_logs` の admin-managed 性質を崩す記述を持つか | 0 | 棚卸し対象は admin-managed ledger として扱い、Form schema 内データとして再分類する記述なし |
| #5 | D1 直接アクセスは `apps/api` に閉じる | 判定文書が `apps/web` から D1 を直接参照する設計・記述を持ち込むか | 0 | 棚卸し対象 DDL / repository はすべて `apps/api` 配下。`apps/web` → D1 参照を示唆する記述なし（§3 でも再確認） |

→ 不変条件 #4 / #5 違反 **0 件**（AC-10 充足）。

## 3. apps/web → D1 参照示唆の確認

判定文書群が `apps/web` から D1 binding を直接参照することを示唆していないことを確認する。

- 棚卸し対象（I-1〜I-5）はすべて `apps/api/migrations` / `apps/api/src` 配下。
- `sync_jobs` の admin UI 参照は `findLatest` / `listRecent` 経由の **`apps/api` 内部参照**（Phase 2 §1.1）であり、`apps/web` からの D1 直接アクセスではない。
- 判定文書に `apps/web` → D1 の binding 追加・直接 SQL 実行を示唆する記述は 0 件。

→ apps/web → D1 参照示唆 **なし**。

## 4. verdict 一意性の再確認

| 確認項目 | 結果 |
| --- | --- |
| 判定正本 | `outputs/phase-02/gap-analysis-and-verdict.md` §4 |
| 判定結論 | 新設不要（NO NEW TABLE REQUIRED） |
| 他成果物の結論 | Phase 5 / 7 / 8 / 10 はすべて Phase 2 をパス参照で承継（独立結論なし） |
| 異なる結論の有無 | なし |

→ verdict は **一意**（AC-5 整合）。`sync_jobs` 拡張も不要（`metrics_json` passthrough zod）である点も Phase 2 §4 と一致。

## 5. docs-only（コード変更 0）確認

- 判定が「新設不要」のため本タスクは `apps/api/migrations` / `apps/api/src` / `packages` への変更を一切伴わない。
- 確認方針: `git status --short apps packages` が **0 件** であること（実コマンド実行と raw 出力は Phase 11 一次証跡で記録）。
- 書き込みは本 workflow ディレクトリ（`docs/30-workflows/completed-tasks/issue-235-sync-audit-tables-necessity-judgement/`）配下に限定。

→ docs-only（コード変更 0）の前提は維持（AC-6 整合）。

## 6. partial（穴）判定

| 区分 | 件数 | 内容 |
| --- | --- | --- |
| partial（穴） | 0 | 判定は現行コードに完全に閉じており、未充足・部分充足の論点なし |
| NR-N 記録 | 0 | 穴が存在しないため not-resolved 記録は不要 |

> **partial 無を宣言。** 監査観点 §1〜§5 すべてで違反 / 矛盾 / 非存在前提の崩れは検出されず。将来トリガ T-1〜T-3（Phase 2 §6）は穴ではなく「実需発生時に新規起票する将来条件」であり、partial には計上しない。

## 7. 監査サマリ

| 監査観点 | 結果 |
| --- | --- |
| `sync_audit_*` 非存在 | 再確認済み（別文脈 `sync_audit` と区別） |
| 不変条件 #4 / #5 違反 | 0 件 |
| PII 漏洩 | 0 件（`PII_FORBIDDEN_KEYS` 言及は仕様参照・実値なし） |
| verdict 一意性 | 一意（新設不要） |
| docs-only（コード変更 0） | 維持（Phase 11 で実証） |
| partial（穴） | 0 件（NR-N なし） |

> **正本整合監査 結論: 整合。** 判定の前提は全観点で維持されており、Phase 10（GO/NO-GO）へ進行可。
