# Phase 12: ドキュメント更新

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1128-audit-batchid-index-optimization` |
| workflow_state | `implemented_local_evidence_captured` |
| visualEvidence | `NON_VISUAL` |
| related issue | #1128（CLOSED 維持・reopen しない） |
| 対象 | Phase 12 成果物（implementation-guide / system-spec-update / changelog / unassigned-task-detection / skill-feedback / compliance-check） |

> 本ファイルは Phase 12 の実施記録である。strict 7 outputs、system spec sync、skill feedback promotion、
> unassigned-task consumed trace は同一サイクルで反映済み。commit / push / PR / staging・production migration apply は
> user-gated として残す（Phase 13・CONST_002）。

---

## 概要

本タスクは `audit_log` に batchId 相関列（VIRTUAL generated column 第一候補 / plain `correlation_id`
fallback）+ index を `0027` migration で追加し、`apps/api/src/repository/auditLog.ts` の `listFiltered`
batchId 検索を JSON full scan から index 列走査へ切り替える **NON_VISUAL / apps/api 専用** の実装 workflow である。
Phase 12 では、正本同期・証跡境界・残 user gate を実施結果として記録する。

---

## Phase 12 成果物索引（strict 7）

| 成果物 | パス | 内容 |
| --- | --- | --- |
| main | `outputs/phase-12/main.md` | Phase 12 summary / evidence / user-gated 残 |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル）/ Part 2（技術者レベル）の 2 パート構成 |
| system spec 反映サマリ | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A/1-B/1-C + Step 2（新規インターフェース判定） |
| ドキュメント changelog | `outputs/phase-12/documentation-changelog.md` | workflow-local 同期 / global skill sync の 2 ブロック |
| 未タスク検出 | `outputs/phase-12/unassigned-task-detection.md` | current / baseline 分離（0 件でも出力） |
| skill フィードバック | `outputs/phase-12/skill-feedback-report.md` | 改善点なしでも出力 |
| compliance check（root evidence） | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 見出し + Phase 11 evidence 表 |

---

## Task 12-1 実装ガイドの作成方針（`outputs/phase-12/implementation-guide.md`）

2 パート構成で作成する。各 Part は本文 3 行以上（heading-only は CI gate `verify-phase12-compliance`
が FAIL するため禁止）。

### Part 1（中学生レベル・例え話で「なぜ index が要るか」）

専門用語を使わず、日常の例え話で説明する。最低限カバーする観点:

- **図書館の索引の比喩**: audit_log は「すごく分厚い本」。bulk 操作の記録（batchId）を探したいとき、
  index が無いと **1 ページ目から最後まで全部めくって探す**（= full scan）。本の巻末に「索引（さくいん）」が
  あれば、目的の語が何ページにあるか **一発で分かる**（= index 列走査）。本タスクは audit_log に
  その「索引」を付ける作業である。
- **なぜ今まで索引が無かったか**: batchId は本文（JSON の中身 = `after_json` / `before_json`）に
  埋め込まれていて、巻末の索引にできなかった。そこで「索引専用の見出し列」を 1 本足して、そこに索引を貼る。
- **足し算であって書き換えではない**: 過去の記録（既存行）は消したり書き換えたりしない。
  索引を貼るだけ。記録は「足すだけ（append-only）」のルールを守ったまま、探すのが速くなる。

> 用語「index」「json_extract」「full scan」などは Part 1 では使わず、Part 2 で初めて導入する。

### Part 2（技術者レベル）

最低限カバーする key section（タスク種別: schema 変更 + repository SQL 変更）:

- **背景 / 問題**: batchId が `after_json.$.batchId`（assign）/ `before_json.$.batchId`（unassign）に
  **非対称**に埋め込まれ、JSON 列に index が貼れず `json_extract` 検索が `SCAN audit_log`（full scan）になる
  （`auditLog.ts:200-205`）。
- **列方式（A/B）の決定**:
  - 方式A（第一候補）= VIRTUAL generated column `batch_id` =
    `COALESCE(json_extract(after_json,'$.batchId'), json_extract(before_json,'$.batchId'))` + index。
    `ALTER TABLE ADD COLUMN` 可・既存行へ自動波及・write path / backfill 不要。
  - 方式B（fallback）= plain `correlation_id` 列 + backfill UPDATE + index + `append` write path 拡張。
  - 方式C（STORED generated column）は SQLite の `ALTER ADD COLUMN` が拒否（テーブル再構築必要）のため不採用。
  - 採用方式は Phase 2 の Miniflare D1 実測（`EXPLAIN QUERY PLAN`）で確定した結果を明記する。
- **`json_extract` full scan → index 列走査**: `WHERE batch_id = ?`（方式A）/ `WHERE correlation_id = ?`（方式B）へ
  切替え、`EXPLAIN QUERY PLAN` 出力に `USING INDEX idx_audit_log_batch_id`（または `_correlation_id`）が現れ
  `SCAN audit_log` でないことを確認する。
- **COALESCE 畳み込み**: assign / unassign の非対称な埋め込み位置を 1 列に集約する設計意図。
- **rollback**: `DROP INDEX IF EXISTS idx_audit_log_batch_id;` + `ALTER TABLE audit_log DROP COLUMN batch_id;`
  （方式B は `_correlation_id` 版）を migration 末尾コメントに併記。
- **append-only 維持**: backfill は migration 内 SQL のみ。`auditLog.ts` から UPDATE/DELETE を export しない（AC-7）。
- **設定値**: index 名 = `idx_audit_log_batch_id`（方式A）/ `idx_audit_log_correlation_id`（方式B）。
  migration 番号 = `0027_audit_log_batchid_index.sql`。
- **検証コマンド**: Phase 9/11 の D1 vitest（`auditLog.repository.spec.ts` / `audit.contract.spec.ts`）+
  `EXPLAIN QUERY PLAN` assertion。
- **既知制限**: query surface 不変（batchId param は #1079 で確定済み）・production/staging apply は user-gated。

### Task 12-1 視覚証跡セクション

NON_VISUAL タスクのため screenshot は無い。視覚証跡セクションを **作らない**
（VISUAL タスクのような canonical 画像名列挙は不要）。証跡は Phase 11 の自動テスト出力 +
`EXPLAIN QUERY PLAN` 結果（テキスト）を参照する旨のみ記す。

---

## Task 12-2 システム仕様更新（aiworkflow-requirements 正本同期）

以下 Step を実施済み。

### Step 1-A 台帳系の追記

| 更新先 | 内容 |
| --- | --- |
| 完了タスク記録 | `issue-1128-audit-batchid-index-optimization` を完了として記録 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 1 行追記 |
| topic-map / keywords | batchId / audit_log index 関連トピックへ反映（`indexes:rebuild` で再生成） |

> workflow-local の詳細は `outputs/phase-12/documentation-changelog.md`、skill LOGS は `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` に記録済み。

### Step 1-B 実装状況テーブル

`implemented_local_evidence_captured` へ更新済み。
更新先: `artifacts.json`（root / outputs 両方）の `workflow_state` / `phases`、`index.md` の状態表記。

### Step 1-C 関連タスクテーブル更新

元 unassigned-task spec（`docs/30-workflows/unassigned-task/task-issue-1079-followup-001-audit-batchid-index-optimization.md`）
の status を `consumed_by_issue_1128` へ更新し、consumed pointer を維持した。

### Step 2 新規インターフェース追加の有無判定

| 判定対象 | 結果 | 理由 |
| --- | --- | --- |
| `AuditLogListFilters.batchId` | **既存・変更なし → N/A** | #1079 で確定済みの公開 filter interface。本タスクは検索の **実装方式（SQL）** を index 走査へ変えるのみで、interface signature は変えない |
| `GET /admin/audit` query surface | **変更なし → N/A** | query param は不変（index.md スコープ「含まない」） |
| schema 変更（`0027` migration） | **反映済み** | aiworkflow-requirements `database-schema.md` に `audit_log.batch_id` + `idx_audit_log_batch_id` を追記 |

> 公開 TypeScript interface（`AuditLogListFilters`）の signature 変更は無いため interface 追加は **N/A**。
> schema（DB 列）追加は database 系正本仕様へ反映済み。

---

## Task 12-3 documentation-changelog.md（`outputs/phase-12/documentation-changelog.md`）

全 Step の結果を個別明記する（該当なしも「該当なし」と記録）。2 ブロック構成:

| ブロック | 記録内容 |
| --- | --- |
| workflow-local 同期 | `index.md` / `artifacts.json`（root + outputs）/ `phase-*.md` の状態更新を列挙 |
| global skill sync | Step 1-A（LOGS x2 / topic-map）/ Step 1-B（実装状況）/ Step 1-C（関連タスク consumed）/ Step 2（interface = N/A・schema 反映判定結果）を各行で「実施 / 該当なし」明記 |

---

## Task 12-4 unassigned-task-detection.md（`outputs/phase-12/unassigned-task-detection.md`）

0 件でも出力必須。current / baseline を分離する。

### current（本サイクルで新規起票すべき未タスク）

本タスクは migration 1 本 + repository 1 ファイル + test で 1 サイクル完了する（CONST_007）ため、
**分割・先送りによる未タスクは current 0 件** が想定値。実装後に TODO / `.skip` / 未実装分岐が残らないことを
確認のうえ「current 0 件」と明記する。

### baseline（スコープ外候補・記録のみ・起票しない）

本タスクのスコープ外として検討した候補を baseline として記録する。例:

| ID | 候補 | 判定 |
| --- | --- | --- |
| B-1 | 他 JSON payload フィールド（例: 別 bulk 操作の相関キー）の index 化 | スコープ外（本タスクは batchId 単一相関に限定）。需要顕在化時に別タスク |
| B-2 | audit export 側（CSV/JSON export クエリ）の最適化 | スコープ外（export は別 index 系統 `idx_audit_log_export`）。本タスクの batchId index とは別関心 |
| B-3 | batchId の正規化列化（軽量方針 → 正規化への全面移行） | スコープ外（親 #1036 軽量方針と衝突・YAGNI） |

> baseline 候補に着手不要なものしか無ければ、上表のように「記録のみ・起票しない」とし、current は 0 件と明記する。

---

## Task 12-5 skill-feedback-report.md（`outputs/phase-12/skill-feedback-report.md`）

改善点なしでも出力必須。テンプレ / ワークフロー / ドキュメントの改善候補を記録する。
本タスク固有で記録し得る候補（実装後に実態に合わせて確定）:

- D1 の VIRTUAL generated column + index 可否を Miniflare で実測してから方式確定する設計パターンの再利用価値。
- SQLite `ALTER TABLE ADD COLUMN` が STORED generated column を拒否する落とし穴（方式C 不採用根拠）の知見化。
- `_setup.ts` の `;` 分割が単文 DDL を前提とする制約（`BEGIN..END` 不可）の注意喚起。

改善候補が無ければ「改善点なし（テンプレ / ワークフロー / ドキュメントいずれも該当なし）」と明記する。

---

## Task 12-6 phase12-task-spec-compliance-check.md（root evidence）

`outputs/phase-12/phase12-task-spec-compliance-check.md` を canonical 9 見出し**逐語**で作成する
（CI gate `verify-phase12-compliance` が heading SSOT を検査・独自命名は FAIL）。

### canonical 9 見出し（番号・テキスト固定）

1. `## Summary verdict`
2. `## Changed-files classification`
3. `## workflow_state and phase status consistency`
4. `## Phase 11 evidence file inventory`
5. `## Phase 12 strict 7 file inventory`
6. `## Skill/reference/system spec same-wave sync`
7. `## Runtime or user-gated boundary`
8. `## Archive/delete stale-reference gate`
9. `## Four-condition verdict`

### Phase 11 evidence 表（NON_VISUAL）

列名は **`Classification` / `Path` / `Status`**（小文字統一固定）。`Status` は `present` / `pending` / `n/a` の
3 値のみ。NON_VISUAL のため screenshot 行は `n/a`。spec authoring 段階では manual-test-result も `n/a`、
実装完了後（local evidence 取得後）は `present` に更新する。

```markdown
## Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/manual-test-result.md | n/a |
| explain query plan log | outputs/phase-11/explain-query-plan.txt | n/a |
| screenshot | n/a | n/a |
```

> `Status=present` 行は workflow root 配下の物理 file 存在が `verify-phase11-evidence-existence.ts` で検査される。
> 実装完了後に evidence を物理生成してから `present` へ更新すること。NON_VISUAL なので screenshot は恒久 `n/a`。

---

## artifacts.json parity（root と outputs の二重化防止）

`docs/30-workflows/completed-tasks/issue-1128-audit-batchid-index-optimization/artifacts.json` と
`docs/30-workflows/completed-tasks/issue-1128-audit-batchid-index-optimization/outputs/artifacts.json` を **同期**し、
`workflow_state` / `phases` / `gates` の status 二重化（root と outputs で食い違い）を防ぐ。
実装完了で Gate-B を `passed`、phase-13 のみ user-gated で `blocked`/`pending` のままにする。

検証: `node scripts/lib/phase12-compliance/...`（`gate-metadata:validate`）で artifacts.json の zod schema 適合と
parity を確認する。

---

## indexes 再生成

台帳・topic-map を手編集せず、以下を実行して drift 0 にする。

```bash
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js   # aiworkflow 側
# task-spec 側 generate-index も実行（keywords.json / topic-map / *-map.md の再生成）
mise exec -- pnpm indexes:rebuild
```

冪等（再実行で md5 不変）になることを確認する。

---

## 元タスク unassigned spec の consumed pointer 追記方針

`docs/30-workflows/unassigned-task/task-issue-1079-followup-001-audit-batchid-index-optimization.md` に対し:

- メタ情報 `status` を `consumed_by_issue_1128` へ更新済み。
- 冒頭または末尾に consumed trace を追記:
  `> このタスクは issue-1128（canonical workflow: docs/30-workflows/completed-tasks/issue-1128-audit-batchid-index-optimization/）で消費・実装された。`
- backlink を破壊しないこと（Issue #1128 body や親 #1079 の参照が当ファイルを指す場合はパスを維持し、status だけ更新）。
- 消費トレースは `merge=union` 衝突を避けるため 1 行で簡潔に記す。

---

## Phase 12 完了条件チェックリスト

| 条件 | 扱い | 状態 |
| --- | --- | --- |
| implementation-guide.md が 2 パート構成（中学生 / 技術者）で各 Part 本文 3 行以上 | 方針を本ファイルに定義 | done |
| Part 1 が例え話（図書館の索引）で index 必要性を説明 | 比喩を明記 | done |
| Part 2 が列方式 A/B・json_extract→index・COALESCE・EXPLAIN・rollback・append-only・設定値を網羅 | key section を列挙 | done |
| system-spec-update が Step 1-A/1-B/1-C/Step 2 を個別記録 | 各 Step 内容を定義 | done |
| Step 2: interface = N/A（既存）・schema 反映済み | 判定基準を明記 | done |
| documentation-changelog が workflow-local / global skill sync を別ブロックで記録 | 2 ブロック定義 | done |
| unassigned-task-detection を 0 件でも出力（current / baseline 分離） | current 0 件・baseline B-1..3 | done |
| skill-feedback-report を改善点なしでも出力 | 候補を列挙 | 計画済 |
| compliance-check（root evidence）が canonical 9 見出し + Phase 11 表 | 見出し・表を明記 | 計画済 |
| artifacts.json parity（root / outputs 同期） | 同期方針を定義 | 計画済 |
| indexes 再生成（aiworkflow + task-spec） | コマンド明記 | 計画済 |
| 元 unassigned spec の consumed pointer 追記 | 追記方針を定義 | 計画済 |
| commit / push / PR / migration apply は user-gated | Phase 13 へ委譲 | pending（user-gated） |

---

## runtime / user-gated 境界

- 実装サイクル完了後に行うのは、コード適用（`0027` migration + `auditLog.ts`）・focused D1 tests・
  EXPLAIN QUERY PLAN 証跡取得・aiworkflow 正本同期（Step 1-A/1-B/1-C/Step 2）まで。
- commit / push / PR 作成・migration apply（staging / production）は **user-gated**（Phase 13）。
- Issue #1128 は **CLOSED 維持**（reopen しない）。
