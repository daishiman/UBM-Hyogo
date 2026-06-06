# Phase 6: テスト拡充（fail path / 回帰 guard）

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1079-bulk-tag-audit-batch-filter` |
| workflow_state | `spec_created` |
| 対象 | Task A（apps/api: contract / repository spec の fail path・回帰 guard） |

> 本ファイルは Phase 4 の happy path に対する fail path / 回帰 guard 計画である。コードは実装しない。

---

## 1. 既存 audit filter の回帰 guard（壊さない）

batchId 追加で既存 filter（action / actorEmail / targetType / targetId / from / to / cursor）の挙動が
壊れないことを保証する。

| guard | 観点 | 期待 |
| --- | --- | --- |
| R-1 既存 contract 11 ケース | seed に batchId 行を足しても、既存 `toHaveLength(1)` / auditId 集合 assertion が壊れない | batchId 付き seed 行の action / targetType を既存ケースの filter 条件（`attendance.add` / `identity.dismiss` / `member.note.created` / `admin_member_note` 等）と **重複させない**ことで担保。 |
| R-2 既存 repository 複合 filter | `listFiltered({ action, actorEmail, targetType, targetId })` の複合 filter（既存 it L109）が batchId 句追加後も同結果 | batchId 未指定時は WHERE に batchId 句が **生えない**（`if (filters.batchId)` ガード）ことで、SQL が従来と byte 同一になる。 |
| R-3 cursor pagination 回帰 | batchId 未指定の cursor pagination（既存 it L120 / L302）が変わらない | batchId 句は cursor 句の **前**に挿入され、cursor が未指定なら全く影響しない。 |

> R-1 の重複回避は Phase 4 §2 の seed 設計（新 action は `admin.member.tag_assigned` / `admin.member.tag_unassigned`）で既に満たす。

---

## 2. batchId 併用時の cursor 回帰

| guard | 観点 | 期待 |
| --- | --- | --- |
| R-4 batchId + cursor | `batchId=BATCH-A&limit=1` の 2 ページ周回（Phase 4 TC d）で、cursor 句と batchId 句が同時に WHERE に乗っても正しく動く | binding 番号: batchId が `?N`、cursor が `?N+1` / `?N+2`、LIMIT が `?N+3`。番号がずれず両ページとも batchId 一致行のみ返す。`BATCH-B` 行が混入しない。 |

---

## 3. invalid / 境界 batchId

| TC | 入力 | 期待 |
| --- | --- | --- |
| F-1 batchId 空文字 | `/audit?batchId=`（contract） | 400 にしない・filter 未適用・`appliedFilters.batchId === null`（Phase 4 TC f と同一・設計判断の回帰固定）。 |
| F-2 batchId 不一致 | `/audit?batchId=NO-SUCH`（contract） | `items: []`・`nextCursor: null`・200（Phase 4 TC e の回帰固定）。 |
| F-3 batchId + invalid limit | `/audit?batchId=BATCH-A&limit=101` | 既存どおり 400（`invalid query`）。batchId が valid でも他 query が invalid なら全体 400。 |
| F-4 batchId + invalid cursor | `/audit?batchId=BATCH-A&cursor=not-base64` | 既存どおり 400（`invalid cursor`）。 |

---

## 4. JSON parse error 時の batchId 抽出耐性（repository / contract）

audit_log には `{broken` のような壊れた JSON 行が存在しうる（既存 seed `audit_003`）。json_extract は
パース不能な JSON 列に対して **エラーにせず NULL を返す**（SQLite/D1 の `json_extract` semantics）。

| TC | seed | 観点 | 期待 |
| --- | --- | --- | --- |
| J-1 broken JSON 行と batchId filter 共存 | `before_json="{broken"` の行 + 正常 batchId 行 | `listFiltered({ batchId: "BATCH-A" })` 実行時、broken 行に対し json_extract が NULL を返し、`= ?N` 比較が false（NULL ≠ value）で除外される | broken 行はクラッシュせず単に不一致として除外。batchId 一致行のみ返る。 |
| J-2 batchId を持たない正常 JSON 行 | `after_json={"tagId":"t1","source":"manual"}`（batchId 無し・単一 endpoint 由来想定） | json_extract が `$.batchId` で NULL を返す | 不一致で除外（noop・クラッシュなし）。 |

> これにより「壊れた JSON / batchId を持たない行が混在しても batchId filter が安全に動く」耐性を固定する。
> 実装上の追加コードは不要（json_extract の NULL semantics に依存）だが、回帰テストで明示固定する。

---

## 5. テストファイル / 命名

- 追記先: `audit.contract.spec.ts`（F-1..F-4 / J-1）/ `auditLog.repository.spec.ts`（R-2 / R-4 / J-1 / J-2）。
- d1 config 必須（contract / repository とも in-memory D1 seed が前提）。
- `*.spec.ts` のみ（`*.test.ts` 禁止）。

## 完了条件 (DoD)

- 既存 filter / cursor の回帰 guard（R-1..R-4）が記述されている。
- invalid / 境界 batchId（F-1..F-4）の fail path が記述されている。
- broken JSON / batchId 不在行に対する json_extract NULL 耐性（J-1 / J-2）が記述されている。
