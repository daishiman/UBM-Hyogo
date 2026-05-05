# Phase 6: テスト拡充（異常系検証 / edge case + リスクシナリオ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 canonical sync job implementation receiver（U-UT01-07-FU01） |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト拡充（異常系検証） |
| 作成日 | 2026-05-01 |
| 前 Phase | 5（実装ランブック） |
| 次 Phase | 7（AC matrix） |
| 状態 | spec_created |
| タスク分類 | implementation-receiver-canonical-handoff |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| 関連 Issue | #333（CLOSED） |

## 目的

UT-09 受け皿確定における失敗は実行時例外ではなく、**受け皿が未到達 / 誤接続 / drift により UT-09 実装が canonical 名で確定しないシナリオ**である。本 Phase では Phase 4 V-1〜V-4 を前提に 4 件の異常系シナリオ (a)〜(d) を列挙し、それぞれの検出方法・回復手順・関連 V-i / AC を固定する。

## 実行タスク

1. 異常系 4 件 (a)〜(d) を「分類 / 原因 / 検出 / 回復手順 / 関連 V-i / 関連 AC」の 6 列で列挙する（完了条件: 全件 6 セル埋まる）。
2. 各シナリオの検出コマンドを grep / find ベースで再現可能にする（完了条件: コピペ実行可能）。
3. 回復手順は本タスクスコープ内で完結するもの / UT-09 へ handoff するものを区別する（完了条件: handoff 境界が明示）。
4. 異常系 × V × AC の 3 軸 trace を Phase 7 入力として下書き（完了条件: 全異常系が最低 1 V + 1 AC で被覆）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-04.md | V-1〜V-4 |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-05.md | 6 ステップ runbook |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/ | Phase 2 正本4ファイル |
| 必須 | docs/30-workflows/unassigned-task/ | UT-09 候補一覧 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 物理側現状 |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 参照名 audit 対象 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | drift 対象 |

## 異常系マトリクス (a)〜(d)

| # | 分類 | 異常シナリオ | 原因 | 検出 | 回復手順 | 関連 V-i / AC |
| - | --- | --- | --- | --- | --- | --- |
| (a) | UT-09 root 不在 | UT-09 実装タスク root が未配置のまま canonical 名引き渡しが失敗 | Phase 5 step 1 で root 候補が見つからず、新規作成方針も未決のまま放置 | `find docs/30-workflows -type d -iname "*ut-09*"` が 0 件 + `ls docs/30-workflows/unassigned-task/ \| grep -iE "ut-?09"` で同期ジョブ実装の主体が不明 | (1) Phase 5 step 1 を再実行し新規 unassigned-task `task-ut09-canonical-sync-job-implementation.md` 雛形作成方針を確定 (2) 本タスク `outputs/phase-05/main.md` の root path に新規作成パスを記載 | V-1 / AC-1 |
| (b) | UT-09 既存ファイル複数 | UT-09 関連ファイルが複数（unassigned-task 配下に 8 件等）あり、root 選定誤りで canonical 引き継ぎが空振り | 「同期ジョブ実装本体」と「周辺タスク（withdrawal / kill-switch / restore 等）」が混在し、本タスクが周辺ファイルに canonical を書き込んでしまう | `ls docs/30-workflows/unassigned-task/ \| grep -iE "ut-?09"` で複数件 hit / 各ファイル先頭 grep で「主体: 同期ジョブ実装」記述が 1 件のみ存在することを確認 | (1) 各候補ファイルの role を grep で抽出 (2) 「同期ジョブ実装本体」の 1 件を選定 (3) 周辺タスクには canonical 採用の handoff 注釈のみ追記 (4) 主体ファイルにのみ必須参照リスト + AC 追記 | V-1 / V-2 / AC-1 / AC-2 |
| (c) | 直交性侵害 | U-UT01-08 enum 値 / U-UT01-09 retry/offset 値 / UT-04 物理 DDL を本タスク or UT-09 root が決定してしまう | レビュー時に「canonical 名を確定するなら enum/retry/offset/DDL も同時決定すべき」と越境議論が混入 | `grep -rnE "pending\|in_progress\|completed\|failed" docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/` で hit / `grep -rnE "retry_count\|next_offset" .../` で hit / 本タスク内に `CREATE TABLE` / `ALTER TABLE` 文が出現 | (1) 越境記述を本タスクから除去 (2) U-UT01-08 / U-UT01-09 / UT-04 への handoff 注釈に置換 (3) 直交性チェックリストを Phase 2 handoff-to-ut04-ut09.md と整合 | V-4 / AC-4 |
| (d) | aiworkflow-requirements drift | `database-schema.md` の sync 系記述が canonical 名と不一致のまま放置され、後続タスクが古い `sync_log` 単独表記を参照 | U-UT01-07 親タスク Phase 12 Step 1-A の drift 解消が未実施、または本 FU01 確定後に database-schema.md が再 drift | `grep -n "sync_log\|sync_job_logs\|sync_locks" .claude/skills/aiworkflow-requirements/references/database-schema.md` で `sync_log` 単独表記が hit | (1) drift list を `outputs/phase-06/main.md` に記録 (2) U-UT01-07 親タスク Phase 12 Step 1-A backlog へ申し送り (3) 本タスクは database-schema.md を直接編集しない (4) `mise exec -- pnpm indexes:rebuild` 実行は親タスク側責務 | V-3（補助）/ AC-3 / AC-4 |

合計 4 件。

## 検出コマンド集

```bash
# (a) UT-09 root 不在
find docs/30-workflows -type d -iname "*ut-09*"
ls docs/30-workflows/unassigned-task/ | grep -iE "ut-?09"

# (b) UT-09 既存ファイル複数の主体特定
for f in $(ls docs/30-workflows/unassigned-task/ | grep -iE "ut-?09"); do
  echo "=== $f ==="
  head -30 "docs/30-workflows/unassigned-task/$f" | grep -iE "同期ジョブ|sync.?job|主体|role"
done

# (c) 直交性侵害検出
grep -rnE "pending\|in_progress\|completed\|failed" \
  docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/ | grep -v "concept\|参考\|U-UT01-08"
grep -rnE "retry_count|next_offset" \
  docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/ | grep -v "U-UT01-09"
grep -rnE "CREATE TABLE|ALTER TABLE" \
  docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/ | grep -v "禁止\|forbidden"

# (d) aiworkflow-requirements drift
grep -n "sync_log\|sync_job_logs\|sync_locks" \
  .claude/skills/aiworkflow-requirements/references/database-schema.md
```

## 回復手順の handoff 境界

| シナリオ | 本タスクで完結 | UT-09 / 親タスクへ handoff |
| --- | --- | --- |
| (a) | 新規 unassigned-task 雛形作成方針の記述 | 実 .md ファイル作成は UT-09 起票時 |
| (b) | 主体特定 + 周辺タスクへの handoff 注釈 | 周辺タスク内部の整合は各タスク担当 |
| (c) | 越境記述除去 + handoff 注釈追加 | enum / retry / offset / DDL の実値決定は U-UT01-08 / U-UT01-09 / UT-04 |
| (d) | drift list 記録 + 親タスク backlog 申し送り | database-schema.md 実編集 + indexes:rebuild は U-UT01-07 親 Phase 12 Step 1-A |

## 異常系 × V × AC trace 下書き（Phase 7 入力）

| 異常系 | 関連 V | 関連 AC |
| --- | --- | --- |
| (a) | V-1 | AC-1 |
| (b) | V-1 / V-2 | AC-1 / AC-2 |
| (c) | V-4 | AC-4 |
| (d) | V-3（補助） | AC-3 / AC-4 |

> 全異常系が最低 1 V + 1 AC を被覆。Phase 7 で 3 軸 matrix として最終確定。

## 実行手順

1. 異常系 4 件マトリクスを `outputs/phase-06/main.md` に転記。
2. 検出コマンドをコピペ実行可能な状態にする。
3. 回復手順の本タスク完結 / handoff 境界を表で固定。
4. 異常系 × V × AC trace を下書きし Phase 7 へ送る。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | V-1〜V-4 と異常系の対応を確定 |
| Phase 7 | 3 軸 matrix へ流し込み |
| Phase 12 | (d) の drift 解消を U-UT01-07 親 Step 1-A 完了条件として申し送り |
| UT-09 | (a)(b) の root 確定状態を着手前提条件に明記 |

## 多角的チェック観点（AI が判断）

- 価値性: 4 異常系が UT-09 受け皿の実害（未到達 / 誤接続 / 越境 / drift）を網羅するか。
- 実現性: 検出コマンドが grep / find / ls のみで完結するか。
- 整合性: 異常系 × V trace に未対応セルが無いか。
- 運用性: 回復手順の handoff 境界が UT-09 / 親タスク担当に曖昧さなく伝わるか。
- 認可境界: 回復手順に `apps/api/**` 編集 / database-schema.md 直接編集が含まれないか。
- セキュリティ: 検出コマンドに secret 露出が無いか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 異常系 4 件マトリクス | spec_created |
| 2 | 検出コマンド集 | spec_created |
| 3 | 回復 handoff 境界表 | spec_created |
| 4 | 異常系 × V × AC trace 下書き | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | 異常系 4 件 + 検出コマンド + handoff 境界 + 3 軸 trace 下書き |
| メタ | artifacts.json | Phase 6 状態更新 |

## 完了条件

- [ ] 異常系 4 件 (a)〜(d) が 6 列で全埋め
- [ ] 各検出コマンドがコピペ実行可能
- [ ] 回復手順の本タスク完結 / handoff 境界が明示
- [ ] 異常系 × V × AC trace 下書きで未対応セル 0
- [ ] 物理 DDL / `apps/api/**` 編集を伴う回復手順が 0 件

## タスク 100% 実行確認【必須】

- 実行タスク 4 件すべて `spec_created`
- 成果物が `outputs/phase-06/main.md` に配置済み
- 異常系 4 件すべてに 6 セル記入
- 異常系 × V trace で V-1〜V-4 すべてが 1 つ以上の異常系で参照される
- wrangler 直叩きが本ドキュメント内に 0 件

## 次 Phase への引き渡し

- 次 Phase: 7（AC matrix）
- 引き継ぎ事項:
  - 異常系 (a)〜(d) を AC matrix の「関連異常系」列で参照
  - 3 軸 trace 下書きを Phase 7 で最終確定
  - (d) drift 解消を U-UT01-07 親 Phase 12 Step 1-A 完了条件として申し送り
- ブロック条件:
  - 異常系 4 件未満で Phase 7 へ進む
  - 検出コマンドが抽象的（grep 対象パス未指定）
  - handoff 境界が曖昧
