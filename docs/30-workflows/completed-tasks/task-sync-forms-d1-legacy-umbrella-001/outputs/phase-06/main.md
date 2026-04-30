# Phase 06 成果物: 異常系検証（ドキュメント整合性失敗ケース 7 種）

## サマリ

本タスクは docs-only / NON_VISUAL のため HTTP 4xx / 5xx の runtime failure は **N/A**。代わりに「ドキュメント整合性失敗ケース」8 種（FD-1〜FD-8）を元仕様 §1.3 / §7 リスク表 / specs/08 D1 制約から派生させ、検出方法（rg / audit script）と是正手順を付与する。

## HTTP 4xx/5xx の N/A 根拠

| 観点 | 判定 | 理由 |
| --- | --- | --- |
| 401 / 403 | N/A | 認可境界変更なし、admin gate は 04c 責務 |
| 404 | N/A | endpoint 新規追加なし |
| 422 | N/A | request schema 変更なし |
| 5xx | N/A | runtime コードなし |

代替: ドキュメント整合性 verify suite（D-/M-/S-/SP-/C-）が 4xx/5xx の代替検出層となる。

## Failure cases（FD-1〜FD-8）

| ID | failure 内容 | 派生元 | 検出方法 | 是正手順 | 関連 verify suite | mitigation 反映先 |
| --- | --- | --- | --- | --- | --- | --- |
| FD-1 | 旧 UT-09 path / id が新規導線として残存 | §1.3 stale path | `rg "UT-09-sheets-d1-sync-job-implementation\|ut-09-sheets-to-d1-cron-sync-job"` | 該当箇所を legacy umbrella 表記に置換、本タスクの index へリンク | S-1 | 本タスク Phase 8 DRY 化 |
| FD-2 | Sheets API 表記が現行 sync 仕様として残存 | §7 リスク（API 二重正本） | `rg "Google Sheets API v4\|spreadsheets\\.values\\.get"` | Forms API（`forms.get` / `forms.responses.list`）に置換 | S-2 | 03a / 03b の phase-02 |
| FD-3 | 単一 `/admin/sync` または `sync_audit` が現行仕様に残存 | §7 リスク（endpoint 衝突 / 監査二重） | `rg --pcre2 "/admin/sync(?!/)\|sync_audit"` | `POST /admin/sync/schema` / `/responses` / `sync_jobs` に置換 | S-3 | 04c / 02c |
| FD-4 | `dev / main 環境` 単独表記が残存 | §1.3 環境表記 | `rg "dev / main 環境\|dev/main 環境"` | `dev branch -> staging env` / `main branch -> production env` に置換 | S-4 | 09a / 09b / 09c |
| FD-5 | WAL 前提 / PRAGMA 必須化の表現が新規追加 | §7 リスク（D1 制約違反） | `rg "WAL\|PRAGMA"` で specs/08 と差分検出 | retry/backoff / 短い tx / batch-size 制限の表現に修正 | SP-3 | 03a / 03b 異常系、09b runbook |
| FD-6 | 必須 9 セクション / lowercase / hyphen 違反 | §6 監査 | `audit-unassigned-tasks.js --target-file ...` / `ls` 命名 | テンプレ準拠、ファイル名修正 | D-1 / D-2 / D-3 | 本タスク Phase 9 |
| FD-7 | conflict marker（`<<<<<<<` / `=======` / `>>>>>>>`）残存 | §6 監査 | `rg "^(<<<<<<<\|=======\|>>>>>>>)"` | merge を再実施し conflict 解消 | C-1 / C-2 / C-3 | 全タスク共通 |
| FD-8 | specs/08 違反の D1 制約読み替え | specs/08-free-database.md | `rg "PRAGMA busy_timeout\|journal_mode="` | 未確認 PRAGMA 前提を削除し、retry/backoff・短 transaction・batch-size 制限に統一 | SP-3 | 03a / 03b 異常系、09b runbook |

## §7 リスク表との対応

| 元仕様 §7 リスク | 対応する FD |
| --- | --- |
| API 二重正本（Sheets と Forms） | FD-2 |
| endpoint 衝突 | FD-3 |
| 監査テーブル二重 | FD-3 |
| D1 競合 / WAL 非対応 | FD-5 |
| 環境表記の混乱 | FD-4 |
| 未タスクテンプレ違反 | FD-6 |
| conflict marker 残存 | FD-7 |
| D1 制約の読み替え | FD-8 |
| stale path 新設 | FD-1 |

すべての §7 リスクと specs/08 由来リスクが FD-1〜FD-8 にマップされる。

## negative AC matrix（Phase 7 で確定）

| AC | failure 紐付け | mitigation |
| --- | --- | --- |
| AC-1 | FD-1 | 本タスク Phase 02 / 05 |
| AC-3 | FD-2 | 03a / 03b の Forms API 一本化 |
| AC-4 | FD-3 | 04c の分割 endpoint |
| AC-5 | FD-5 | 03a / 03b 異常系で retry/backoff |
| AC-6 | FD-3 | 02c の sync_jobs 排他 |
| AC-8 | FD-4 | env matrix |
| AC-10 / AC-11 | FD-6 | 本タスク Phase 9 |
| AC-13 | FD-5 / FD-8 | spec consistency 検査 SP-1〜SP-3 |
| 全 AC 共通 | FD-7 | conflict marker scan C-1〜C-3 |

## 不変条件チェック

| 不変条件 | 関連 FD |
| --- | --- |
| #1 schema 過剰固定回避 | FD-2（Sheets schema 固定が残らないこと） |
| #5 apps/web→D1 直接禁止 | FD-3（02c の data access boundary 文脈） |
| #6 GAS prototype 不採用 | FD-1（GAS trigger を新規導入しない） |
| #10 無料枠運用 | FD-5（cron 頻度試算が 09b で残ること） |

## エビデンス / 参照

- `outputs/phase-04/main.md`（verify suite）
- `outputs/phase-05/main.md`（runbook step）
- `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` §1.3 / §7
- `docs/00-getting-started-manual/specs/08-free-database.md`（FD-5 の根拠）

## 次 Phase（07 AC マトリクス）への引き渡し

1. FD-1〜FD-8 を negative AC matrix の行として展開
2. positive AC matrix（AC × verify suite × runbook step × 不変条件）と統合
3. 空白セル 0 を Phase 7 で確認
