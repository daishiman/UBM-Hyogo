# Phase 5: 実装（receiver runbook + コード grep ガード方針）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 canonical sync job implementation receiver（U-UT01-07-FU01） |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装（receiver runbook + コード grep ガード方針） |
| 作成日 | 2026-05-01 |
| 前 Phase | 4（検証戦略） |
| 次 Phase | 6（異常系検証） |
| 状態 | spec_created |
| タスク分類 | implementation-receiver-canonical-handoff |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| 関連 Issue | #333（CLOSED） |

## 目的

UT-09（同期ジョブ実装）の root path を一意化し、その必須参照リストおよび AC に canonical 名 `sync_job_logs` / `sync_locks` の採用と `sync_log` 物理テーブル化禁止を反映させる。さらに `apps/api/src/jobs/sync-sheets-to-d1.ts` の参照名を read-only audit し、CI grep ガード `scripts/check-canonical-sync-names.sh` の追加方針を確定する。

implementation タスクではあるが、本 Phase で行う **書込操作は UT-09 root の必須参照リスト・AC 追記**、および **CI grep ガード script の方針記述まで**。実 script ファイル新設や `apps/api/src/jobs/sync-sheets-to-d1.ts` の改変は本 Phase ではスコープ外（read-only audit のみ）。

## 実行タスク

1. UT-09 実装タスク root path を確定（既存探索 → 新規作成判断）（完了条件: root path が 1 件特定 or 新規作成パスが決定）。
2. UT-09 root 配下に Phase 2 正本4ファイルへの必須参照リストを追加（完了条件: 4 ファイル絶対パス記載）。
3. UT-09 root 配下 AC へ canonical 採用と `sync_log` 物理テーブル化禁止を追記（完了条件: AC 文言確定）。
4. U-UT01-07 unassigned-task detection に UT-09 root path を反映（完了条件: cross-link 成立）。
5. `apps/api/src/jobs/sync-sheets-to-d1.ts` 参照名 audit（read-only verify）（完了条件: ledger / lock 書込の table 名が canonical と一致）。
6. CI grep ガード script `scripts/check-canonical-sync-names.sh` 追加方針を記述（完了条件: コマンド・配置先・CI 取り込み点が明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md | canonical 名 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md | mapping |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md | rename 却下 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md | UT-09 直交性 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 物理側現状（Read のみ） |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | audit 対象（Read のみ） |
| 必須 | docs/30-workflows/unassigned-task/ | UT-09 候補一覧 |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-04.md | V-1〜V-4 入力 |

## ステップ詳細

### ステップ1: UT-09 実装タスク root path 確定

```bash
ls docs/30-workflows/unassigned-task/ | grep -iE "ut-?09"
find docs/30-workflows -type d -iname "*ut-09*"
```

| 判断分岐 | アクション |
| --- | --- |
| 既存 root が同期ジョブ実装の主体として 1 件特定 | その path を採用 |
| 候補が複数 | 「同期ジョブ本体実装」を主体とする 1 件を選定し、他は周辺タスクとして分離明記 |
| 主体が未存在 | 新規 unassigned-task として `task-ut09-canonical-sync-job-implementation.md` 等を作成方針として記述 |

完了条件: root path が `outputs/phase-05/main.md` の冒頭表に 1 行で記載。
rollback: root 選定誤りの場合は Phase 6 シナリオ（root 選定誤り）で検出 → 再選定。

### ステップ2: UT-09 root 配下に必須参照リスト追加

UT-09 root の冒頭または「着手前提条件」セクションに、Phase 2 正本4ファイルの絶対パスを列挙する。

```
- docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md
- docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md
- docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md
- docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md
```

完了条件: 4 ファイル全件が UT-09 root から絶対パスで grep 可能。
rollback: 参照漏れがあれば該当ファイルを追記。

### ステップ3: UT-09 root 配下 AC へ追記

UT-09 root の AC セクションに以下 2 項目を追加（既存 AC を破壊せず append）:

- AC-X: ledger 書込先テーブルは `sync_job_logs`、lock 取得先は `sync_locks` を採用する（canonical 名）。
- AC-Y: `sync_log` という物理テーブルの CREATE / RENAME / DROP は行わない。`sync_log` は概念名としてのみ用い、実テーブルは作成しない。

完了条件: AC 2 項目が UT-09 root に記載され grep 可能。
rollback: 表現が曖昧な場合は本 Phase 成果物の文言を再採用。

### ステップ4: U-UT01-07 unassigned-task detection への反映

U-UT01-07 親タスクの index.md / unassigned-task detection セクション（存在すれば）に、本 FU01 タスクと UT-09 root path の対応を記載する。

完了条件: cross-link が成立し、U-UT01-07 → 本タスク → UT-09 root の導線が grep 可能。
rollback: dead link があれば修正。

### ステップ5: `apps/api/src/jobs/sync-sheets-to-d1.ts` audit（read-only）

```bash
grep -nE "sync_job_logs|sync_locks|sync_log\b" apps/api/src/jobs/sync-sheets-to-d1.ts
```

| 期待 | アクション |
| --- | --- |
| `sync_job_logs` / `sync_locks` のみが SQL 文字列に出現 | PASS。`outputs/phase-05/main.md` audit ログに記録 |
| `sync_log` 単独表記が SQL 文字列として出現 | FAIL → 本タスクスコープ外（UT-09 実装側で修正必須）として handoff backlog に追加 |

完了条件: audit 結果（PASS / FAIL）が記録される。**本 Phase で `sync-sheets-to-d1.ts` を編集しない**。
rollback: FAIL 時は UT-09 root に修正タスクを明記。

### ステップ6: CI grep ガード script 追加方針

`scripts/check-canonical-sync-names.sh` の追加方針を本 Phase で記述する（実 script の作成は UT-09 実装側で行う）。

```bash
#!/usr/bin/env bash
# scripts/check-canonical-sync-names.sh （方針のみ・本 Phase では作成しない）
set -euo pipefail
fail=0

if grep -rn "CREATE TABLE sync_log\b" apps/api/migrations/ >/dev/null; then
  echo "FAIL: CREATE TABLE sync_log が apps/api/migrations 配下に存在"; fail=1
fi
if grep -rn "ALTER TABLE sync_job_logs RENAME" apps/api/migrations/ >/dev/null; then
  echo "FAIL: sync_job_logs の RENAME が apps/api/migrations 配下に存在"; fail=1
fi
if grep -rn "DROP TABLE sync_job_logs" apps/api/migrations/ >/dev/null; then
  echo "FAIL: sync_job_logs の DROP が apps/api/migrations 配下に存在"; fail=1
fi

exit $fail
```

| 項目 | 内容 |
| --- | --- |
| 配置先 | `scripts/check-canonical-sync-names.sh` |
| 実行権限 | `chmod +x` 想定 |
| CI 取り込み点 | `.github/workflows/` の typecheck/lint job に追加（UT-09 実装側で対応） |
| ローカル実行 | `bash scripts/check-canonical-sync-names.sh` |

完了条件: 方針が `outputs/phase-05/main.md` に記述され、UT-09 実装担当が参照可能。
rollback: script 名衝突があれば別名提案を併記。

## 本 Phase で禁止する操作

- `apps/api/migrations/*.sql` の追加・改変・削除
- `apps/api/src/jobs/sync-sheets-to-d1.ts` の編集
- `apps/api/src/**` の他コード編集
- `scripts/check-canonical-sync-names.sh` の実ファイル新設（方針記述のみ）
- D1 への wrangler / scripts/cf.sh 経由のあらゆる書込

## canUseTool 適用範囲

| 操作 | 自動許可 / 禁止 |
| --- | --- |
| `outputs/phase-05/*.md` の Write / Edit | 自動許可 |
| UT-09 root（unassigned-task 配下 .md）の Edit（必須参照 / AC 追記） | 自動許可 |
| `apps/api/migrations/*.sql` の Read | 自動許可 |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` の Read | 自動許可 |
| `apps/api/**` の Edit / Write | **禁止**（UT-09 実装側） |
| `scripts/*.sh` の新規作成 | **禁止**（UT-09 実装側） |
| wrangler / scripts/cf.sh 経由の D1 操作 | **禁止** |

## 実行手順

1. ステップ1〜6 を順に実施。
2. 各ステップ完了条件を `outputs/phase-05/main.md` のチェックリストで確認。
3. ステップ5 audit 結果を `outputs/phase-05/audit-log.md` に記録。
4. ステップ6 CI script 方針を `outputs/phase-05/main.md` に記述。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | V-1〜V-4 が PASS する状態を本 Phase で達成 |
| Phase 6 | 異常系（root 不在 / 複数候補 / 直交性侵害 / drift）に対する記述位置を本 Phase 配置に依存 |
| Phase 7 | AC matrix の確定入力 |
| UT-09 | 必須参照リスト / AC / canonical assertion 方針 / CI script を引き継ぎ実装 |
| UT-04 | canonical name を migration 計画前提として参照 |

## 多角的チェック観点（AI が判断）

- 価値性: UT-09 着手者が迷わず canonical 名へ収束できる文書配置か。
- 実現性: ステップが本タスクの編集権限内で完結するか。
- 整合性: ステップ5 audit が `0002_sync_logs_locks.sql` DDL と矛盾しないか。
- 運用性: ステップ6 script 方針が UT-09 実装担当にとって曖昧さなく書かれているか。
- 認可境界: 禁止操作が網羅され、`apps/api` を誤改変しない構造か。
- セキュリティ: API token / OAuth / D1 binding 値が本ドキュメントに残らないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | UT-09 root 確定 | spec_created |
| 2 | 必須参照リスト追加 | spec_created |
| 3 | AC 追記 | spec_created |
| 4 | unassigned-task detection 反映 | spec_created |
| 5 | sync-sheets-to-d1.ts audit | spec_created |
| 6 | CI grep ガード script 方針 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | 6 ステップ実行結果 + UT-09 root path + CI script 方針 + 禁止操作 |
| ドキュメント | outputs/phase-05/audit-log.md | sync-sheets-to-d1.ts audit 結果（PASS / FAIL） |
| メタ | artifacts.json | Phase 5 状態更新 |

## 完了条件

- [ ] UT-09 実装タスク root path が 1 件特定（または新規作成方針が記述）
- [ ] Phase 2 正本4ファイル絶対パスが UT-09 root に必須参照として記載
- [ ] UT-09 root AC に canonical 採用 + `sync_log` 物理化禁止が追記
- [ ] U-UT01-07 → 本タスク → UT-09 root の cross-link 成立
- [ ] `sync-sheets-to-d1.ts` audit 結果が PASS / FAIL で記録
- [ ] CI grep ガード script 方針が配置先・コマンド・取り込み点付きで記述
- [ ] `apps/api/**` 配下の実改変が 0 件

## タスク 100% 実行確認【必須】

- 実行タスク 6 件すべて `spec_created`
- 成果物 2 件が `outputs/phase-05/` に配置済み
- 物理 DDL / `apps/api/src` 編集が 0 件
- wrangler 直叩きが本ドキュメント内に 0 件

## 次 Phase への引き渡し

- 次 Phase: 6（異常系検証）
- 引き継ぎ事項:
  - UT-09 root path を Phase 6 シナリオの起点として使用
  - audit FAIL 時の handoff backlog を Phase 6 (UT-09 既存ファイル複数 / 参照名不整合) シナリオで再掲
  - CI script 方針を Phase 6 (drift) シナリオで「未導入時のリスク」として参照
- ブロック条件:
  - UT-09 root path が未確定
  - audit が未実施
  - 必須参照リストに dead link
