# Phase 4: テスト作成（implementation: 文書検証 + コード grep ガード戦略）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 canonical sync job implementation receiver（U-UT01-07-FU01） |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト作成（文書検証 + コード grep ガード戦略） |
| 作成日 | 2026-05-01 |
| 前 Phase | 3（設計レビュー） |
| 次 Phase | 5（実装ランブック） |
| 状態 | spec_created |
| タスク分類 | implementation-receiver-canonical-handoff |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| 親タスク | U-UT01-07（sync_log naming reconciliation） |
| 関連 Issue | #333（CLOSED） |
| 直交タスク | U-UT01-08 / U-UT01-09 / UT-04 |
| 下流タスク | UT-04 / UT-09 |

## 目的

本タスクは UT-09（同期ジョブ実装）が canonical 名 `sync_job_logs` / `sync_locks` を採用する **受け皿** の確定である。コード変更を伴う implementation タスクだが、本 Phase 自体は仕様書としての検証戦略を定義する。

検証は (1) UT-09 実装タスク root の実在 (2) U-UT01-07 Phase 2 正本4ファイルの参照導線 (3) `sync_log` の物理テーブル化禁止 grep ガード (4) U-UT01-08 / U-UT01-09 / UT-04 直交性 の **4 検証 + コード grep ガード**で構成する。Phase 5 実装ランブック後の UT-09 単体・統合テストへの canonical 名 assertion 追加方針も本 Phase で固定する。

## 実行タスク

1. 検証 4 項目（V-1〜V-4）を確定する（完了条件: 各項目に検証手段・合格条件・AC trace が揃う）。
2. 各 V-i に grep / Read ベースの再現コマンドを付す（完了条件: コピペ実行可能）。
3. `sync_log` 物理テーブル化禁止 grep ガード 3 種（CREATE / RENAME / DROP 各 0 件）を確定する（完了条件: コマンドと出力期待値が一致）。
4. UT-09 単体/統合テストへの canonical 名 assertion 追加方針を記述する（完了条件: assertion 対象・期待文字列・配置先が明示）。
5. AC-1〜AC-4 × V-1〜V-4 の trace を草案する（完了条件: 全 AC が最低 1 検証項目で被覆）。
6. 直交性チェック（U-UT01-08 enum / U-UT01-09 retry/offset / UT-04 DDL）を不変条件として明示する（完了条件: 越境検出条件が明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md | canonical 名の正本 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md | 1:N マッピング |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md | rename 却下根拠 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md | UT-04/UT-09 直交性 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 物理側現状（Read のみ） |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 同期ジョブ実装本体（Read のみ・本 Phase は audit のみ） |
| 必須 | docs/30-workflows/unassigned-task/ | UT-09 実装タスク root 候補一覧 |
| 参考 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/phase-04.md | 書式準拠元 |

## 検証 4 項目（V-1〜V-4）

| # | 検証項目 | 検証手段 | 合格条件 | AC trace |
| - | --- | --- | --- | --- |
| V-1 | UT-09 実装タスク root の実在 | `find docs/30-workflows -type d -iname "*ut-09*"` および `ls docs/30-workflows/unassigned-task/ \| grep -i ut-?09` で UT-09 同期ジョブ実装の root path を特定。複数候補がある場合は Phase 5 ステップ1で root を一意化 | UT-09 実装タスク root path が 1 件特定（または新規作成方針が記述） | AC-1 |
| V-2 | Phase 2 正本4ファイル参照導線 | UT-09 root の必須参照リスト (or 着手前提条件) に Phase 2 4 ファイルの絶対パスが記載されていることを grep 確認 | 4 ファイル全件が UT-09 root から参照可能（dead link 0） | AC-2 |
| V-3 | `sync_log` 物理テーブル化禁止 | `grep -rn "CREATE TABLE sync_log\b" apps/api/migrations/ docs/30-workflows/ \| grep -v completed-tasks` / `grep -rn "ALTER TABLE sync_job_logs RENAME" apps/api/migrations/` / `grep -rn "DROP TABLE sync_job_logs" apps/api/migrations/` の 3 コマンドが各 0 件 | 3 grep 全件 0 ヒット。`sync_log` は概念名注釈付き記述のみ許容 | AC-3 |
| V-4 | 直交性維持（U-UT01-08 / U-UT01-09 / UT-04） | UT-09 root と本タスクで以下の越境が無いことを grep で確認: U-UT01-08 enum 値（`pending\|in_progress\|completed\|failed`）の決定記述 / U-UT01-09 retry / offset 値の決定記述 / UT-04 物理 DDL の追加・改変 | 越境記述 0 件。各下流タスクへの handoff のみ存在 | AC-4 |

合計 4 項目。

## 検証手段の再現コマンド集

```bash
# V-1: UT-09 実装タスク root の実在確認
find docs/30-workflows -type d -iname "*ut-09*"
ls docs/30-workflows/unassigned-task/ | grep -iE "ut-?09"

# V-2: Phase 2 正本4ファイル参照導線
for f in naming-canonical.md column-mapping-matrix.md backward-compatibility-strategy.md handoff-to-ut04-ut09.md; do
  grep -rln "$f" docs/30-workflows/ | grep -iE "ut-?09" || echo "MISSING: $f"
done

# V-3: sync_log 物理テーブル化禁止 grep ガード（3 件すべて 0 ヒット必須）
grep -rn "CREATE TABLE sync_log\b" apps/api/migrations/ docs/30-workflows/ | grep -v completed-tasks
grep -rn "ALTER TABLE sync_job_logs RENAME" apps/api/migrations/ docs/30-workflows/
grep -rn "DROP TABLE sync_job_logs" apps/api/migrations/ docs/30-workflows/

# V-4: 直交性維持
grep -rnE "pending\|in_progress\|completed\|failed" \
  docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/ | grep -v "concept\|参考\|U-UT01-08"
grep -rnE "retry_count|next_offset" \
  docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/ | grep -v "U-UT01-09"
```

## UT-09 実装テストへの canonical 名 assertion 方針

UT-09 同期ジョブ実装の単体/統合テストには、**canonical 名が変更されていないことを検出する assertion** を追加する方針を本 Phase で固定する（実装は UT-09 側で行う）。

| assertion 種別 | 対象ファイル | 検証内容 |
| --- | --- | --- |
| 単体テスト | UT-09 ledger writer のテストファイル | INSERT 文の table 名が `sync_job_logs` であること |
| 単体テスト | UT-09 lock manager のテストファイル | INSERT/UPDATE 対象が `sync_locks` であること |
| 統合テスト | UT-09 同期ジョブ E2E テスト | 実 D1 に対して `sync_job_logs` / `sync_locks` のみ書込が発生し、`sync_log` table は存在しないこと |
| grep ガード | CI（`scripts/check-canonical-sync-names.sh` 想定） | V-3 の 3 grep を CI で実行し 0 ヒットを担保 |

> 上記 assertion の **実装** は UT-09 タスク本体で行い、本タスクは方針提示のみ。

## coverage 代替指標

| 指標 | 目標値 | 計測方法 |
| --- | --- | --- |
| 文書不変条件の充足率 | 100%（V-1〜V-4 全件 PASS） | 再現コマンド実行 |
| `sync_log` 物理化 grep ヒット | 0 件 | V-3 の 3 コマンド合計 |
| Phase 2 正本4ファイル参照率 | 100% | V-2 の MISSING 出力なし |

## AC × V trace 草案

| AC# | 内容（要約） | 主担 V | 補助 V |
| --- | --- | --- | --- |
| AC-1 | UT-09 実装タスク root の実パス確定 | V-1 | V-2 |
| AC-2 | canonical 名が UT-09 必須参照・AC に反映 | V-2 | V-1 |
| AC-3 | `sync_log` 物理テーブル化禁止が明記 | V-3 | - |
| AC-4 | U-UT01-08 / U-UT01-09 / UT-04 直交性維持 | V-4 | - |

## 実行手順

1. V-1〜V-4 を `outputs/phase-04/test-strategy.md` に転記。
2. 再現コマンドを付し実行可能にする。
3. canonical 名 assertion 方針を UT-09 引き継ぎ contract として明記。
4. AC trace 草案を Phase 7 入力として固定。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 実装ランブックが V-1〜V-4 を pass する状態を到達条件にする |
| Phase 6 | edge case（root 不在 / 複数候補 / 直交性侵害 / drift）を V-i に対応付け |
| Phase 7 | AC × V × edge case の 3 軸 matrix |
| UT-09 phase-04 | canonical 名 assertion を実装テストへ取り込み |
| UT-04 phase-04 | canonical name を migration 計画の前提として参照 |

## 多角的チェック観点（AI が判断）

- 価値性: AC-1〜AC-4 が V-1〜V-4 で漏れなく被覆されているか。
- 実現性: grep / Read のみで全項目が静的検証可能か。
- 整合性: V-3 grep ガードが `apps/api/migrations/0002_sync_logs_locks.sql` の DDL と矛盾しないか。
- 運用性: コマンドが scripts/cf.sh / wrangler を要求しないか。
- 認可境界: UT-09 実装本体の編集権限が本 Phase の検証手段に含まれていないか（方針提示のみ）。
- セキュリティ: 検証手段に API token / OAuth が露出していないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 検証 4 項目確定 | spec_created |
| 2 | 再現コマンド集 | spec_created |
| 3 | `sync_log` 物理化禁止 grep ガード 3 種 | spec_created |
| 4 | UT-09 テスト assertion 方針 | spec_created |
| 5 | AC × V trace 草案 | spec_created |
| 6 | 直交性越境検出条件明示 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-strategy.md | 検証 4 項目 + 再現コマンド + assertion 方針 + AC trace 草案 |
| メタ | artifacts.json | Phase 4 状態更新 |

## 完了条件

- [ ] 検証 4 項目（V-1〜V-4）が手段・合格条件・AC trace 付きで列挙
- [ ] 各 V-i に grep / Read コマンドが付され再現可能
- [ ] `sync_log` 物理化禁止 grep が 3 種（CREATE / RENAME / DROP）すべて記述
- [ ] UT-09 テストへの canonical 名 assertion 方針が assertion 種別 × 対象 × 検証内容で記述
- [ ] AC-1〜AC-4 すべてが最低 1 つの V-i で被覆
- [ ] U-UT01-08 / U-UT01-09 / UT-04 越境検出条件が明示
- [ ] 本 Phase で物理 DDL / コード変更を伴う検証手段が 0 件

## タスク 100% 実行確認【必須】

- 実行タスク 6 件すべて `spec_created`
- 成果物が `outputs/phase-04/test-strategy.md` に配置済み
- AC-1〜AC-4 すべてに 1 つ以上の V-i が対応
- wrangler 直叩きが本ドキュメント内に 0 件

## 次 Phase への引き渡し

- 次 Phase: 5（実装ランブック）
- 引き継ぎ事項:
  - V-1〜V-4 合格状態が Phase 5 完了の前提
  - V-3 grep ガードを Phase 5 step 6 の CI script 雛形に流用
  - UT-09 assertion 方針を Phase 5 step 5 の audit ステップで参照
  - AC trace 草案 → Phase 7 ac-matrix.md の確定入力
- ブロック条件:
  - V-1 で UT-09 root が特定できないまま Phase 5 へ進む
  - V-3 grep がいずれかで 1 件以上ヒット残存
  - 直交性越境検出条件が抽象的
