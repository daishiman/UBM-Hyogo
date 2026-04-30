# Phase 03 成果物: 設計レビュー（A/B/C/D 案 比較 + PASS-MINOR-MAJOR 判定）

## サマリ

Phase 02 設計に対し代替案 A / B / C / D を比較レビューし、**C 案（legacy umbrella + 責務分散吸収）を採用**、全体判定 **PASS** で確定する。direct 残責務 0 件、不変条件 #1 / #5 / #6 / #7 違反 0 件。

## 代替案比較

### A 案: 旧 UT-09 を direct implementation として残す

| 観点 | 評価 |
| --- | --- |
| 価値 | 旧仕様の引き継ぎとしては最短だが、Sheets API と Forms API の二重正本が発生 |
| 整合性 | 不整合（現行 03a/03b と機能重複、`/admin/sync` と `/admin/sync/schema` `/admin/sync/responses` の endpoint 衝突） |
| 不変条件 | #1 違反リスク（schema を Sheets 側で固定）、#7 違反（Form 再回答が正本にならない） |
| 運用性 | 二重 cron / 二重 secret / 二重 D1 audit テーブル → 運用負荷大 |
| 判定 | **MAJOR REJECT** |

### B 案: 旧 UT-09 を完全削除する

| 観点 | 評価 |
| --- | --- |
| 価値 | リポジトリのクリーンさが上がる |
| 整合性 | 過去の議論履歴（D1 競合対策の知見、SQLITE_BUSY retry/backoff、batch-size 制限）が失われる |
| トレーサビリティ | GitHub Issue #95 のクローズ理由が追跡しにくくなる |
| 運用性 | 「なぜ Forms 正本にしたか」を未来の実装者が再調査することになる |
| 判定 | **MINOR REJECT** |

### C 案: legacy umbrella として保持し責務を現行タスクに分散吸収（採用）

| 観点 | 評価 |
| --- | --- |
| 価値 | 二重正本を防ぎつつ、旧 UT-09 の品質要件（retry/backoff、batch-size、二重起動防止）を 03a/03b/09b に移植できる |
| 整合性 | 現行 03a / 03b / 04c / 09b / 02c と完全整合（責務移管表で direct 残責務 0 件）。`specs/03-data-fetching.md` の sync_jobs / cursor / current response / consent snapshot 契約を直接踏襲 |
| 不変条件 | #1 / #5 / #6 / #7 すべて満たす |
| トレーサビリティ | Issue #95 のクローズ記録を本タスクが保持、将来の参照導線として機能 |
| 運用性 | docs-only のため運用負荷ゼロ、未タスク監査の reference example として再利用可能 |
| 判定 | **PASS（採用）** |

### D 案: Issue を再オープンし新規 task に分割し直す（参考）

| 観点 | 評価 |
| --- | --- |
| 価値 | 過去 Issue の整理にはなるが、現行タスク 03a/03b/04c/09b が既に存在するため重複 |
| コスト | governance のみのために新規 issue / branch / PR は過剰 |
| 判定 | **MINOR REJECT** |

## PASS-MINOR-MAJOR 判定総括

| 判定軸 | 結果 |
| --- | --- |
| 採用案 | **C（legacy umbrella + 責務分散吸収）** |
| 全体判定 | **PASS** |
| 残課題 | なし（OQ-1 sync_audit 読替は 02c/03a/03b の Phase 12 へ委譲、OQ-2 PRAGMA WAL は不採用で確定、OQ-3 旧 UT-09 ファイルは保持で確定、OQ-4 全置換は本タスクスコープ外） |
| MINOR 修正 | 不要 |
| MAJOR 修正 | 不要 |

## 責務移管網羅レビュー

旧 UT-09 §4 Phase 構成と各責務の割当を再確認。

| 旧 Phase / 責務 | 受け手 | 確認 |
| --- | --- | --- |
| Phase 1 stale 前提棚卸し | 本タスク Phase 02 stale↔正本表 | OK |
| Phase 2 責務移管確認 | 本タスク Phase 02 責務移管表 | OK |
| Phase 3 品質要件移植（retry/backoff / batch / 短 tx） | 03a / 03b 異常系（Phase 6）、09b runbook | OK |
| Phase 4 監査検証（filename / 9 セクション） | 本タスク Phase 09 | OK |
| schema 取得 / upsert | 03a | OK |
| response 取得 / cursor / current resp | 03b | OK |
| 手動 trigger endpoint | 04c | OK |
| cron / pause / resume / evidence | 09b | OK |
| `sync_jobs` 排他 | 02c | OK |
| secret 配備 | インフラ + 03a/03b 利用側 | OK |

**direct 残責務: 0 件確定（AC-2 PASS）**

## 不変条件チェック

| 不変条件 | レビュー結果 |
| --- | --- |
| #1 schema 過剰固定回避 | A 案を MAJOR REJECT した理由として明記、C 案は `forms.get` 動的取得を 03a 委譲 |
| #5 apps/web → D1 直接禁止 | C 案の schema ownership 宣言で D1 owner が apps/api 側に集中、違反なし |
| #6 GAS prototype 不採用 | C 案の cron 委譲先は Workers Cron Triggers（09b）のみ |
| #7 Form 再回答が本人更新 | response sync 正本が 03b に集約 |

## エビデンス / 参照

- `outputs/phase-01/main.md` / `outputs/phase-02/main.md` / `outputs/phase-02/responsibility-mapping.md`
- `CLAUDE.md` 不変条件 #1 / #5 / #6 / #7
- `docs/00-getting-started-manual/specs/03-data-fetching.md`（C 案採用根拠）

## AC トレーサビリティ

| AC | 状態 |
| --- | --- |
| AC-1 / AC-2 | C 案採用 + 責務移管網羅レビューで確定 |
| AC-3 / AC-4 | A 案 REJECT 理由として明示、C 案では Forms API + 分割 endpoint |
| AC-5 / AC-6 / AC-7 | 03a / 03b / 09b / 02c への移植要件として継承 |
| AC-9 | schema ownership で再確認 |
| AC-12 | stale ディレクトリ新設禁止を C 案前提として明示 |

## 次 Phase（04 テスト戦略）への引き渡し

1. 採用案 C の最終確定設計
2. 不変条件チェック結果（全 PASS）
3. AC のうち Phase 02/03 で fix 済み（AC-1 / AC-2 / AC-3 / AC-4 / AC-8 / AC-11）と未確定（AC-5/6/7/9/10/12）の区分
4. docs-only / NON_VISUAL のため lint / 監査スクリプト中心の verify 設計を要請
