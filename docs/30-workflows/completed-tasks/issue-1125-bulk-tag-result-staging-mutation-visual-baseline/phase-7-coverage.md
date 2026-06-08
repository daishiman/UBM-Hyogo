# Phase 7: カバレッジ

> **実装区分: 実装仕様書** — カバレッジ対象範囲を「新規追加ファイルが踏むシナリオ網羅 + dependency edge」に限定して定義する。

## 7.0 カバレッジの対象範囲（局所明示）

> [Feedback BEFORE-QUIT-002] 局所明示: 本タスクの **変更ファイルは新規追加のみ**（Playwright spec 1 / seed SQL 1 / cleanup SQL 1 / runner shell 1 / runner shell test 1）。
> したがってカバレッジ評価も **これら新規ファイルが踏むシナリオの網羅性と dependency edge** に限定する。**アプリ本体（`BulkActionBar.tsx` / `POST /admin/members/tags/bulk` / `bulkApplyMemberTagsByAdmin`）は対象外**（本タスク非変更・親 issue-1036 / issue-1081 で担保済み）。

| 区分 | 対象 | カバレッジ評価 |
| --- | --- | --- |
| 新規 spec のシナリオ網羅 | `admin-members-bulk-tag-result-authenticated.spec.ts` | ✅ 本 Phase の対象 |
| 新規 runner / shell test の経路網羅 | `capture-bulk-tag-result.sh` / `capture-bulk-tag-result.test.sh` | ✅ 本 Phase の対象 |
| seed / cleanup SQL の冪等・回収網羅 | `bulk-tag-result-staging-{seed,cleanup}.sql` | ✅ 本 Phase の対象（dependency edge） |
| `BulkActionBar.tsx` の line / branch | component 本体 | ❌ **対象外**（親 component spec で担保済み・mutation 分岐は本タスク非責務） |
| `POST /admin/members/tags/bulk` / `bulkApplyMemberTagsByAdmin` | apps/api | ❌ 対象外（本タスク非変更・issue-1081 real D1 smoke で担保済み） |
| D1 schema（`migrations/*.sql` table 定義） | スキーマ | ❌ 対象外（AC-8 非変更） |

---

## 7.1 担保する concern と dependency edge

E2E + shell runner は line coverage を測る性質ではないため、**シナリオ網羅（行動カバレッジ）+ dependency edge 網羅**を基準とする。

| edge ID | dependency edge | 充足手段 | AC 対応 |
| --- | --- | --- | --- |
| EDGE-MUT | mutation → result 描画 → screenshot | apply click（実 `POST .../tags/bulk`）→ `bulk-tag-result` visible 待ち → `toHaveScreenshot` | AC-2, AC-3 |
| EDGE-LIFE | seed → capture → cleanup | runner が seed→capture→trap cleanup を直列実行し各 exit code を検査（shell test RT-SH-09） | AC-1, AC-5 |
| EDGE-CLEAN | cleanup → 残存 0 検証 | cleanup 後 6 table を `count_by_table` で 0 検証（shell test RT-SH-10 で fail path も） | AC-5 |
| EDGE-GUARD | guard → 副作用阻止 | production / 非 staging CF_D1_DATABASE で seed 前に exit 2（shell test RT-SH-02/03/05/06） | AC-7 |
| EDGE-SEED-IDEM | seed 再実行 → 同一 fixture | seed 冒頭 `DELETE ... LIKE prefix` + `INSERT OR REPLACE` で冪等（再実行で baseline 安定） | AC-1 |

| シナリオ ID | 内容 | 充足手段 | AC 対応 |
| --- | --- | --- | --- |
| SC-AUTH | 認証 admin storageState で `/admin/members` 到達 | storageState use + synthetic 行 visible（FP-01/02） | AC-2 |
| SC-AS-CAP | all-success: active 2 名選択 → tag 適用 → 全成功 result baseline | EDGE-MUT + skipped/notFound count 0 | AC-2 |
| SC-PF-CAP | partial-failure: active+退会済み混在選択 → tag 適用 → skipped を含む result baseline | EDGE-MUT + skipped count ≥1 | AC-3 |
| SC-CANON | canonical 名一致 | snapshot arg 文字列照合（§7.4） | AC-4 |

---

## 7.2 result status 5 値の担保範囲切り分け

`bulkApplyMemberTagsByAdmin` の status は 5 値（`memberTags.ts`）。本タスクは **visual で 2 値**を担保し、残 3 値は **unit / local fixture** が担保する。先送りではなく代替担保済みの切り分け（Phase 1 §1.2）。

| result status | frontend list | 本タスク visual（staging mutation baseline） | unit / local fixture 担保 |
| --- | --- | --- | --- |
| `assigned` | counts「付与」 | ✅ all-success baseline（実 mutation） | `BulkActionBar.spec.tsx` TC-BAB-TAG-02 |
| `skipped_deleted` | `bulk-tag-result-skipped`（退会済みスキップ） | ✅ partial-failure baseline（退会済み member 実 mutation） | `BulkActionBar.spec.tsx` TC-BAB-TAG-03 |
| `noop` | counts「変更なし」 | ❌（再付与で発生・視覚は親 local fixture で描画済み） | `BulkActionBar.spec.tsx` TC-BAB-TAG-03（summarize 分岐） |
| `tag_not_found` | `bulk-tag-result-not-found` | ❌（UI tag picker は登録済み tag のみ描画 → 自然発生不可） | 親 local fixture `bulk-tag-result-partial-failure.png` + `BulkActionBar.spec.tsx` TC-BAB-TAG-03 |
| `unassigned` | counts「解除」 | ❌（本タスクは assign モードのみ・解除は issue-1077 picker baseline + local fixture で担保） | `BulkActionBar.spec.tsx` TC-BAB-TAG-04 + issue-1081 real D1 smoke |

> visual で担保する 2 値（`assigned` / `skipped_deleted`）は「実 D1 mutation 後の result summary が staging で意図通り描画される」という**本タスク固有の唯一残った hole**。残 3 値は jsdom unit（描画分岐）+ local fixture（視覚）+ issue-1081 API contract で既にカバー済みのため、staging 共有 D1 への追加副作用を避けて対象外とする。

---

## 7.3 カバレッジ計測方法

| 対象 | 計測 | 実行タイミング |
| --- | --- | --- |
| 新 spec シナリオ網羅 | SC-AUTH..SC-CANON + EDGE-MUT の手動チェックリスト（行動カバレッジ） | Phase 11 runtime（user-gated） |
| runner / shell test 経路網羅 | RT-SH-01..10（local 検証で実行・実 D1 非接続） | local 検証 |
| seed/cleanup 冪等・回収 | runner cleanup 後の 6 table 残存 0 ログ | Phase 11 runtime（user-gated） |
| BulkActionBar.spec.tsx 回帰 | focused vitest（緑維持＝既存カバレッジ不変） | local 検証 |

E2E に line-coverage instrumentation は導入しない（staging 実機 build への計測は既存 visual project でも非採用）。

---

## 7.4 完了条件（Phase 7）

- カバレッジ対象が「新規追加ファイルのシナリオ網羅 + dependency edge」に限定明示され、アプリ本体が対象外と明記されている（[Feedback BEFORE-QUIT-002]）
- EDGE-MUT / EDGE-LIFE / EDGE-CLEAN / EDGE-GUARD / EDGE-SEED-IDEM の各 edge が AC にマップされている
- result status 5 値の visual 担保（assigned / skipped_deleted）と unit/local fixture 担保（noop / tag_not_found / unassigned）の切り分け表が埋まっている
