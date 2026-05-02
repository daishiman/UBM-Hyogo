# Phase 5 成果物: audit-log.md（`apps/api/src/jobs/sync-sheets-to-d1.ts` 参照名 audit）

`phase-05.md` ステップ5 の read-only audit 結果を記録する。本 Phase は `sync-sheets-to-d1.ts` を **編集しない**。grep による参照名 audit のみを実施し、結果（PASS / FAIL）と handoff backlog の有無を確定する。

| 項目 | 値 |
| --- | --- |
| audit 対象 | `apps/api/src/jobs/sync-sheets-to-d1.ts` |
| audit 種別 | read-only grep audit |
| 期待 canonical 名 | `sync_job_logs` / `sync_locks` |
| 禁止表記 | `sync_log` 単独表記（SQL 文字列内） |
| 実施日 | 2026-05-01 |
| 実施者 | 本タスク Phase 5 |

---

## 1. audit コマンド

```bash
grep -nE "sync_job_logs|sync_locks|sync_log\b" apps/api/src/jobs/sync-sheets-to-d1.ts
```

---

## 2. audit 結果サマリ

| 観点 | 結果 |
| --- | --- |
| 総合判定 | **PASS** |
| `sync_job_logs` 出現 | line 313 / 337 / 369 で SQL 文字列内に出現（canonical 名一致） |
| `sync_locks` 出現 | あり（canonical 名一致） |
| `sync_log` 単独表記（SQL 文字列内） | **0 件** |
| 本 Phase での編集 | **0 件**（read-only） |
| UT-09 への handoff backlog | **なし**（FAIL でないため不要） |

---

## 3. 詳細記録

| line | 用途 | 出現名 | canonical 整合 |
| --- | --- | --- | --- |
| 313 | ledger 書込（INSERT INTO sync_job_logs ...） | `sync_job_logs` | ✅ 一致 |
| 337 | ledger 更新 | `sync_job_logs` | ✅ 一致 |
| 369 | ledger 参照 | `sync_job_logs` | ✅ 一致 |
| その他 | lock 取得 | `sync_locks` | ✅ 一致 |

`sync_log`（末尾 `s` なし、`_logs` でない）の単独表記は SQL 文字列内に **存在しない**。コメント / 識別子としても出現しないことを `\b` 境界 grep で確認済み。

---

## 4. 判断分岐の適用

`phase-05.md` ステップ5 の判断分岐表に従い、本 audit は次の分岐を採用した。

| 期待 | アクション |
| --- | --- |
| ✅ `sync_job_logs` / `sync_locks` のみが SQL 文字列に出現 | **PASS**。本 audit ログに記録（本ファイル）。`outputs/phase-05/main.md` ステップ5 集約表へ反映 |
| `sync_log` 単独表記が SQL 文字列として出現 | 該当なし（FAIL 分岐は不発火） |

---

## 5. handoff backlog（FAIL 時のみ作成）

該当なし（PASS のため）。

> 仮に FAIL であった場合は、UT-09 root（`docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`）の AC または backlog セクションへ「`sync-sheets-to-d1.ts` の `sync_log` 単独表記を `sync_job_logs` / `sync_locks` へ修正する」項目を追記する設計だが、本 audit では発火しない。

---

## 6. 本 Phase 編集禁止の遵守

| 操作 | 実施 |
| --- | --- |
| `sync-sheets-to-d1.ts` の編集 | ❌ 不実施 |
| `sync-sheets-to-d1.ts` の Read（grep） | ✅ 実施（read-only） |
| 周辺 source（`apps/api/src/**`）の編集 | ❌ 不実施 |
| migration `.sql` の編集 | ❌ 不実施 |
| wrangler / scripts/cf.sh 経由の D1 操作 | ❌ 不実施 |

---

## 7. Phase 4 V-3 への寄与

V-3（`sync_log` 物理テーブル化禁止）はソース文字列レベルでも担保される。本 audit は V-3 の補強として機能し、UT-09 実装フェーズにおける canonical 名 drift 検出の起点となる。

---

## 8. 完了条件チェック

- [x] audit 結果（PASS / FAIL）が記録された
- [x] `sync-sheets-to-d1.ts` への編集 0 件
- [x] canonical 名 `sync_job_logs` / `sync_locks` の使用箇所が line 番号付きで明示
- [x] `sync_log` 単独表記の有無が明示（0 件）
- [x] handoff backlog の有無が明示（なし）

---

## 9. 次 Phase への引き渡し

- audit PASS のため Phase 6 異常系 (b)（UT-09 既存ファイル参照名不整合）の起点としては不発
- Phase 6 (d)（aiworkflow-requirements drift）では本 audit 結果を「ソース側は canonical 一致」のエビデンスとして参照
- UT-09 実装側では本 audit の line 313 / 337 / 369 を canonical 名 assertion テストの対象として取り込む
