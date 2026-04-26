# Phase 7 / coverage-matrix.md — AC × Phase × 成果物 カバレッジ

カバレッジ対象は本タスク（doc/03-serial-data-source-and-storage-contract/、apps/api/src/sync/、apps/api/migrations/、apps/api/wrangler.toml）の変更/作成ファイルに限定。

## 1. AC × Phase × 証跡 trace matrix

| AC | 内容 | 定義 Phase | 検証 Phase | 証跡パス | 検証方法 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | Sheets input / D1 canonical の source-of-truth 非競合 | 1 | 2, 3, 6 | outputs/phase-02/data-contract.md, outputs/phase-02/sync-flow.md, outputs/phase-06/failure-cases.md | レビュー + SQL（書込経路一意） |
| AC-2 | sync の manual / scheduled / backfill 分離 | 1 | 2, 5, 6 | outputs/phase-02/sync-flow.md, outputs/phase-05/sync-deployment-runbook.md, outputs/phase-06/failure-cases.md (A6) | wrangler triggers + curl |
| AC-3 | D1 backup / restore / staging の runbook 化 | 1 | 5, 6, 11 | outputs/phase-05/d1-bootstrap-runbook.md §6/§7, outputs/phase-06/failure-cases.md (A4), outputs/phase-11/manual-test-result.md | runbook 実行リハーサル |
| AC-4 | 障害時復旧基準（Sheets 真 / D1 再構築） | 1 | 2, 6 | outputs/phase-02/sync-flow.md (recovery 章), outputs/phase-06/failure-cases.md (A4-A6) | レビュー + 再 backfill SQL |
| AC-5 | 純 Sheets 案を非採用とする無料運用整合 | 1 | 3 | outputs/phase-01/main.md, outputs/phase-03/main.md | レビュー（無料枠 reads 試算） |

## 2. 3 軸カバレッジ表

| 軸 | Phase 2 | Phase 4 | Phase 5 | Phase 6 | Phase 11 |
| --- | --- | --- | --- | --- | --- |
| mapping rule | data-contract.md | test-plan.md fixture | apps/api/src/sync/mapping.ts 配置 | A5 mapping 不整合 | smoke 抜粋 |
| sync direction | sync-flow.md (Sheets→D1 一方向) | verification-commands.md | wrangler.toml triggers | A6 backfill | smoke |
| backup runbook | sync-flow recovery 章 | (対象外) | d1-bootstrap-runbook §6/§7 | A4 復旧 | prod 適用前 smoke |

各軸とも 2 Phase 以上で検証されている（完了条件 2）。

## 3. カバレッジ対象範囲（変更箇所限定）

- 対象: `doc/03-serial-data-source-and-storage-contract/` 配下の outputs/、`apps/api/src/sync/`、`apps/api/migrations/`、`apps/api/wrangler.toml`
- 対象外（参照のみ）: `doc/00-getting-started-manual/specs/`, 他タスク outputs/, `.claude/skills/`

## 4. 異常系カバレッジ（Phase 6 取り込み）

| 異常系 | 関連 AC | 取り込み |
| --- | --- | --- |
| A1/A2 SHEETS rate / 5xx | AC-2 | scheduled 再試行 |
| A3 SHEETS 認証失効 | AC-3 | secret rotate runbook |
| A4 D1 tx 失敗 | AC-3, AC-4 | rollback + Sheets 再 backfill |
| A5 mapping 不整合 | AC-1 | Sheets 真原則で行修正 |
| A6 backfill 重複 | AC-2, AC-4 | responseId 冪等 |
| A7 schema drift | AC-1, AC-4 | raw_payload 吸収 + Phase 12 spec sync |

## 5. 未カバー追跡登録

| 項目 | 追跡先 | 理由 |
| --- | --- | --- |
| prod writes/day 実測 | Phase 11 / 05a | 実観測前提のため本タスクでは数式のみ |
| 長期 schema drift 観測 | Phase 12 (A7) | spec sync は継続作業 |
| Sheets API quota 実測 | 05a observability | 別タスクスコープ |
| アラート閾値 | 05a observability | 別タスクスコープ |
| CI 経由の secret 注入実装 | 04-cicd-secrets | 別タスクスコープ |

## 6. 完了条件チェック

- [x] AC-1〜AC-5 すべてに証跡パス付与
- [x] 3 軸（mapping / direction / backup）すべて 2 つ以上の Phase で検証
- [x] 未カバー項目に追跡先（11/12/unassigned/05a/04）を割当
- [x] coverage 対象が本タスクの変更/作成ファイルに限定

## 7. 不変条件 1〜7 と AC の独立性

不変条件は CLAUDE.md 側の永続契約。AC trace と二重定義しないよう、本マトリクスでは AC のみ追跡し、不変条件は Phase 9 qa-report.md で別途スキャン。
