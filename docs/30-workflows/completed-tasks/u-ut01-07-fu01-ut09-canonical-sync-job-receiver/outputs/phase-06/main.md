# Phase 6 成果物: main.md（異常系検証 / edge case + リスクシナリオ）

`phase-06.md` の異常系 4 件 (a)〜(d) を 6 列マトリクスで列挙し、検出コマンド・回復手順 handoff 境界・3 軸 trace 下書きを Phase 7 入力として確定する。

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| Phase 名称 | テスト拡充（異常系検証） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 関連 Issue | #333（CLOSED） |

---

## 1. 異常系の性質

UT-09 受け皿確定における失敗は実行時例外ではなく、**受け皿が未到達 / 誤接続 / drift により UT-09 実装が canonical 名で確定しないシナリオ**である。Phase 4 V-1〜V-4 を前提に、(a)〜(d) の 4 件を確定する。

---

## 2. 異常系マトリクス (a)〜(d)（6 列）

| # | 分類 | 異常シナリオ | 原因 | 検出 | 回復手順 | 関連 V-i / AC |
| - | --- | --- | --- | --- | --- | --- |
| (a) | UT-09 root 不在 | UT-09 実装タスク root が未配置のまま canonical 名引き渡しが失敗 | Phase 5 step 1 で root 候補が見つからず、新規作成方針も未決のまま放置 | `find docs/30-workflows -type d -iname "*ut-09*"` が 0 件 + `ls docs/30-workflows/unassigned-task/ \| grep -iE "ut-?09"` で同期ジョブ実装の主体が不明 | (1) Phase 5 step 1 を再実行し新規 unassigned-task `task-ut09-canonical-sync-job-implementation.md` 雛形作成方針を確定 (2) 本タスク `outputs/phase-05/main.md` の root path に新規作成パスを記載 | V-1 / AC-1 |
| (b) | UT-09 既存ファイル複数 | UT-09 関連ファイルが複数（unassigned-task 配下に 8 件等）あり、root 選定誤りで canonical 引き継ぎが空振り | 「同期ジョブ実装本体」と「周辺タスク（withdrawal / kill-switch / restore 等）」が混在し、本タスクが周辺ファイルに canonical を書き込んでしまう | `ls docs/30-workflows/unassigned-task/ \| grep -iE "ut-?09"` で複数件 hit / 各ファイル先頭 grep で「主体: 同期ジョブ実装」記述が 1 件のみ存在することを確認 | (1) 各候補ファイルの role を grep で抽出 (2) 「同期ジョブ実装本体」の 1 件（UT-21）を選定 (3) 周辺タスクには canonical 採用の handoff 注釈のみ追記 (4) 主体ファイル（UT-21）にのみ必須参照リスト + AC 追記 | V-1 / V-2 / AC-1 / AC-2 |
| (c) | 直交性侵害 | U-UT01-08 enum 値 / U-UT01-09 retry/offset 値 / UT-04 物理 DDL を本タスク or UT-09 root が決定してしまう | レビュー時に「canonical 名を確定するなら enum/retry/offset/DDL も同時決定すべき」と越境議論が混入 | `grep -rnE "pending\|in_progress\|completed\|failed" docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/` で hit / `grep -rnE "retry_count\|next_offset" .../` で hit / 本タスク内に `CREATE TABLE` / `ALTER TABLE` 文が出現 | (1) 越境記述を本タスクから除去 (2) U-UT01-08 / U-UT01-09 / UT-04 への handoff 注釈に置換 (3) 直交性チェックリストを Phase 2 handoff-to-ut04-ut09.md と整合 | V-4 / AC-4 |
| (d) | aiworkflow-requirements drift | `database-schema.md` の sync 系記述が canonical 名と不一致のまま放置され、後続タスクが古い `sync_log` 単独表記を参照 | U-UT01-07 親タスク Phase 12 Step 1-A の drift 解消が未実施、または本 FU01 確定後に `database-schema.md` が再 drift | `grep -n "sync_log\|sync_job_logs\|sync_locks" .claude/skills/aiworkflow-requirements/references/database-schema.md` で `sync_log` 単独表記が hit | (1) drift list を本ファイルに記録 (2) U-UT01-07 親タスク Phase 12 Step 1-A backlog へ申し送り (3) 本タスクは `database-schema.md` を直接編集しない (4) `mise exec -- pnpm indexes:rebuild` 実行は親タスク側責務 | V-3（補助）/ AC-3 / AC-4 |

合計 4 件。各シナリオで 6 セル全埋め。

---

## 3. 検出コマンド集（コピペ実行可能）

```bash
# (a) UT-09 root 不在
find docs/30-workflows -type d -iname "*ut-09*"
ls docs/30-workflows/unassigned-task/ | grep -iE "ut-?09"

# (b) UT-09 既存ファイル複数の主体特定
for f in $(ls docs/30-workflows/unassigned-task/ | grep -iE "ut-?09|UT-21"); do
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

---

## 4. 回復手順の handoff 境界

| シナリオ | 本タスクで完結 | UT-09 / 親タスクへ handoff |
| --- | --- | --- |
| (a) | 新規 unassigned-task 雛形作成方針の記述（本 Phase で発火せず・UT-21 採択済） | 実 .md ファイル作成は UT-09 起票時（本 Phase では不要） |
| (b) | 主体特定（UT-21）+ 周辺タスクへの handoff 注釈 | 周辺タスク内部の整合は各タスク担当 |
| (c) | 越境記述除去 + handoff 注釈追加 | enum / retry / offset / DDL の実値決定は U-UT01-08 / U-UT01-09 / UT-04 |
| (d) | drift list 記録 + 親タスク backlog 申し送り | `database-schema.md` 実編集 + `pnpm indexes:rebuild` は U-UT01-07 親 Phase 12 Step 1-A |

> 本 Phase で完結する操作は **すべて grep / Read / docs 編集に閉じる**。`apps/api/**` / `database-schema.md` / `scripts/**` の実編集は handoff 先で実施する。

---

## 5. 異常系 × V × AC 3 軸 trace 下書き（Phase 7 確定入力）

| 異常系 | 関連 V | 関連 AC |
| --- | --- | --- |
| (a) | V-1 | AC-1 |
| (b) | V-1 / V-2 | AC-1 / AC-2 |
| (c) | V-4 | AC-4 |
| (d) | V-3（補助） | AC-3 / AC-4 |

確認:
- 全異常系が最低 1 V + 1 AC を被覆 ✅
- V-1〜V-4 の 4 件すべてが 1 つ以上の異常系で参照 ✅（V-1: (a)(b) / V-2: (b) / V-3: (d) / V-4: (c)）
- AC-1〜AC-4 の 4 件すべてが 1 つ以上の異常系で参照 ✅（AC-1: (a)(b) / AC-2: (b) / AC-3: (d) / AC-4: (c)(d)）

---

## 6. drift list（(d) の現況スナップショット）

本 Phase 時点での `database-schema.md` 状態:

| 観点 | 状態 |
| --- | --- |
| canonical 名 `sync_job_logs` / `sync_locks` 記述 | あり（drift なし） |
| `sync_log` 単独表記 | 0 件 |
| handoff to U-UT01-07 親 Phase 12 Step 1-A | drift 検知時のみ発火（本 Phase では発火不要） |

> 将来的に drift が再発した場合は本セクションへ追記し、親タスク backlog へ送る。

---

## 7. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | V-1〜V-4 と異常系 (a)〜(d) の対応を本ファイル 5 節で確定 |
| Phase 7 | 3 軸 matrix へ流し込み（5 節下書きを最終確定） |
| Phase 12 | (d) の drift 解消を U-UT01-07 親 Step 1-A 完了条件として申し送り |
| UT-09 | (a)(b) の root 確定状態（UT-21 採択）を着手前提条件に明記 |

---

## 8. 完了条件チェック

- [x] 異常系 4 件 (a)〜(d) が 6 列で全埋め
- [x] 各検出コマンドがコピペ実行可能
- [x] 回復手順の本タスク完結 / handoff 境界が明示
- [x] 異常系 × V × AC trace 下書きで未対応セル 0
- [x] 物理 DDL / `apps/api/**` 編集を伴う回復手順が 0 件

---

## 9. 次 Phase への引き渡し

- 異常系 (a)〜(d) を Phase 7 AC matrix の「関連異常系」列で参照
- 3 軸 trace 下書き（5 節）を Phase 7 で最終確定
- (d) drift 解消を U-UT01-07 親 Phase 12 Step 1-A 完了条件として申し送り
