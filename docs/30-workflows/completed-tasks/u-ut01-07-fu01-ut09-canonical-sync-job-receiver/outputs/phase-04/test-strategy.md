# Phase 4 成果物: test-strategy.md

UT-09 canonical sync job implementation receiver（U-UT01-07-FU01）の検証戦略を、文書検証 + コード grep ガード戦略として確定する。本ファイルは Phase 4 仕様書（`phase-04.md`）の「成果物」「完了条件」をすべて満たす単一ドキュメントである。

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| Phase 名称 | テスト作成（文書検証 + コード grep ガード戦略） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 親タスク | U-UT01-07（sync_log naming reconciliation） |
| 関連 Issue | #333（CLOSED） |
| 直交タスク | U-UT01-08 / U-UT01-09 / UT-04 |
| 下流タスク | UT-04 / UT-09 |

---

## 1. 検証戦略の全体像

本タスクは UT-09（同期ジョブ実装）が canonical 名 `sync_job_logs` / `sync_locks` を採用するための **受け皿確定タスク** である。コード変更は UT-09 側で行うため、本 Phase の検証は次の 4 軸で構成する。

1. UT-09 実装タスク root の **実在** 検証（V-1）
2. U-UT01-07 Phase 2 正本4ファイルの **参照導線** 検証（V-2）
3. `sync_log` 物理テーブル化 **禁止 grep ガード** 3 種（V-3）
4. U-UT01-08 / U-UT01-09 / UT-04 **直交性** 不変条件（V-4）

加えて、UT-09 単体/統合テストへの canonical 名 assertion 追加方針を本 Phase で固定し、UT-09 phase-04 が引き継ぎ実装する契約とする。

---

## 2. 検証 4 項目（V-1〜V-4）

| # | 検証項目 | 検証手段 | 合格条件 | AC trace |
| - | --- | --- | --- | --- |
| V-1 | UT-09 実装タスク root の実在 | `find docs/30-workflows -type d -iname "*ut-09*"` および `ls docs/30-workflows/unassigned-task/ \| grep -i ut-?09` で UT-09 同期ジョブ実装の root path を特定。複数候補がある場合は Phase 5 ステップ1で root を一意化 | UT-09 実装タスク root path が 1 件特定（または新規作成方針が記述）。本タスクの採択 path は `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` | AC-1 |
| V-2 | Phase 2 正本4ファイル参照導線 | UT-09 root の必須参照リスト（or 着手前提条件）に Phase 2 4 ファイルの絶対パスが記載されていることを grep 確認 | 4 ファイル全件が UT-09 root から参照可能（dead link 0） | AC-2 |
| V-3 | `sync_log` 物理テーブル化禁止 | `grep -rn "CREATE TABLE sync_log\b" apps/api/migrations/ docs/30-workflows/ \| grep -v completed-tasks` / `grep -rn "ALTER TABLE sync_job_logs RENAME" apps/api/migrations/` / `grep -rn "DROP TABLE sync_job_logs" apps/api/migrations/` の 3 コマンドが各 0 件 | 3 grep 全件 0 ヒット。`sync_log` は概念名注釈付き記述のみ許容 | AC-3 |
| V-4 | 直交性維持（U-UT01-08 / U-UT01-09 / UT-04） | UT-09 root と本タスクで以下の越境が無いことを grep で確認: U-UT01-08 enum 値（`pending\|in_progress\|completed\|failed`）の決定記述 / U-UT01-09 retry / offset 値の決定記述 / UT-04 物理 DDL の追加・改変 | 越境記述 0 件。各下流タスクへの handoff のみ存在 | AC-4 |

合計 4 項目。AC-1〜AC-4 すべてが最低 1 V-i で被覆されることを次節 trace 表で確認する。

---

## 3. 再現コマンド集（コピペ実行可能）

### V-1: UT-09 実装タスク root の実在確認

```bash
find docs/30-workflows -type d -iname "*ut-09*"
ls docs/30-workflows/unassigned-task/ | grep -iE "ut-?09"
# 期待: UT-09 同期ジョブ実装の主体 .md が 1 件特定される
# 採択 path: docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md
```

### V-2: Phase 2 正本4ファイル参照導線

```bash
for f in naming-canonical.md column-mapping-matrix.md backward-compatibility-strategy.md handoff-to-ut04-ut09.md; do
  grep -rln "$f" docs/30-workflows/ | grep -iE "ut-?09|UT-21" || echo "MISSING: $f"
done
# 期待: MISSING 出力 0 件
```

### V-3: `sync_log` 物理テーブル化禁止 grep ガード（3 件すべて 0 ヒット必須）

```bash
grep -rn "CREATE TABLE sync_log\b" apps/api/migrations/ docs/30-workflows/ | grep -v completed-tasks
grep -rn "ALTER TABLE sync_job_logs RENAME" apps/api/migrations/ docs/30-workflows/
grep -rn "DROP TABLE sync_job_logs" apps/api/migrations/ docs/30-workflows/
# 期待: 3 コマンドすべて 0 件
```

### V-4: 直交性維持

```bash
grep -rnE "pending\|in_progress\|completed\|failed" \
  docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/ | grep -v "concept\|参考\|U-UT01-08"
grep -rnE "retry_count|next_offset" \
  docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/ | grep -v "U-UT01-09"
grep -rnE "CREATE TABLE|ALTER TABLE" \
  docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/ | grep -v "禁止\|forbidden"
# 期待: 越境記述 0 件、handoff 注釈のみ
```

---

## 4. UT-09 実装テストへの canonical 名 assertion 方針

UT-09 同期ジョブ実装の単体/統合テストには、**canonical 名が変更されていないことを検出する assertion** を追加する方針を本 Phase で固定する（実装は UT-09 側で行う）。

| assertion 種別 | 対象ファイル（UT-09 側） | 検証内容 | 期待文字列 |
| --- | --- | --- | --- |
| 単体テスト | UT-09 ledger writer のテストファイル | INSERT 文の table 名が `sync_job_logs` であること | `INSERT INTO sync_job_logs` |
| 単体テスト | UT-09 lock manager のテストファイル | INSERT/UPDATE 対象が `sync_locks` であること | `sync_locks` |
| 統合テスト | UT-09 同期ジョブ E2E テスト | 実 D1 に対して `sync_job_logs` / `sync_locks` のみ書込が発生し、`sync_log` table は存在しないこと | `sqlite_master` で `sync_log` 単独テーブル不在 |
| grep ガード | CI（`scripts/check-canonical-sync-names.sh` 想定） | V-3 の 3 grep を CI で実行し 0 ヒットを担保 | exit 0 |

> 上記 assertion の **実装** は UT-09 タスク本体で行い、本タスクは方針提示のみ。本 Phase で `apps/api/**` / `scripts/**` への書込を行わないことが完了条件に含まれる。

---

## 5. coverage 代替指標

implementation 分類タスクではあるが、コード実装は UT-09 側で行うため、line/branch coverage は不適用。代わりに以下 3 種を採用する。

| 指標 | 目標値 | 計測方法 |
| --- | --- | --- |
| 文書不変条件の充足率 | 100%（V-1〜V-4 全件 PASS） | 第 3 節の再現コマンド全実行 |
| `sync_log` 物理化 grep ヒット | 0 件 | V-3 の 3 コマンド合計 |
| Phase 2 正本4ファイル参照率 | 100% | V-2 の MISSING 出力なし |

---

## 6. AC × V trace 草案（Phase 7 確定入力）

| AC# | 内容（要約） | 主担 V | 補助 V |
| --- | --- | --- | --- |
| AC-1 | UT-09 実装タスク root の実パス確定 | V-1 | V-2 |
| AC-2 | canonical 名が UT-09 必須参照・AC に反映 | V-2 | V-1 |
| AC-3 | `sync_log` 物理テーブル化禁止が明記 | V-3 | - |
| AC-4 | U-UT01-08 / U-UT01-09 / UT-04 直交性維持 | V-4 | - |

確認: AC-1〜AC-4 の 4 件すべてが最低 1 V-i で被覆。V-1〜V-4 の 4 件すべてが最低 1 AC で参照される。

---

## 7. 直交性越境検出条件（不変条件）

本タスクおよび UT-09 root が、以下 3 タスクのスコープに越境していないことを Phase 6 異常系 (c) で検出する。

| 直交タスク | 越境検出パターン（grep） | 本タスク内の許容形 |
| --- | --- | --- |
| U-UT01-08（enum） | `pending\|in_progress\|completed\|failed` の **決定記述**（「採用する」「確定する」等） | concept レベルの言及・「U-UT01-08 で決定」の handoff のみ |
| U-UT01-09（retry/offset） | `retry_count` / `next_offset` の **値決定** | 「U-UT01-09 で決定」の handoff のみ |
| UT-04（物理 DDL） | `CREATE TABLE` / `ALTER TABLE` / `DROP TABLE` の追加・改変 | `apps/api/migrations/0002_sync_logs_locks.sql` の参照（Read のみ）。「禁止」「forbidden」コンテキストでの言及 |

---

## 8. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 実装ランブックが V-1〜V-4 を pass する状態を到達条件にする |
| Phase 6 | edge case（root 不在 / 複数候補 / 直交性侵害 / drift）を V-i に対応付け |
| Phase 7 | AC × V × edge case の 3 軸 matrix |
| UT-09 phase-04 | canonical 名 assertion を実装テストへ取り込み |
| UT-04 phase-04 | canonical name を migration 計画の前提として参照 |

---

## 9. 完了条件チェック

- [x] 検証 4 項目（V-1〜V-4）が手段・合格条件・AC trace 付きで列挙
- [x] 各 V-i に grep / Read コマンドが付され再現可能
- [x] `sync_log` 物理化禁止 grep が 3 種（CREATE / RENAME / DROP）すべて記述
- [x] UT-09 テストへの canonical 名 assertion 方針が assertion 種別 × 対象 × 検証内容で記述
- [x] AC-1〜AC-4 すべてが最低 1 つの V-i で被覆
- [x] U-UT01-08 / U-UT01-09 / UT-04 越境検出条件が明示
- [x] 本 Phase で物理 DDL / コード変更を伴う検証手段が 0 件

---

## 10. 次 Phase への引き渡し

- V-1〜V-4 合格状態が Phase 5 完了の前提
- V-3 grep ガードを Phase 5 step 6 の CI script 雛形に流用
- UT-09 assertion 方針を Phase 5 step 5 の audit ステップで参照
- AC trace 草案 → Phase 7 ac-matrix.md の確定入力
