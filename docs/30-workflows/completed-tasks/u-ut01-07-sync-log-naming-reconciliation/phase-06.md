# Phase 6: テスト拡充（docs-only 読み替え＝文書失敗系拡充）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合（U-UT01-07） |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト拡充（docs-only: 文書失敗系拡充） |
| 作成日 | 2026-04-30 |
| 前 Phase | 5（文書実体化 runbook） |
| 次 Phase | 7（AC matrix） |
| 状態 | spec_created |
| タスク分類 | docs-only-design-reconciliation（failure-case 縮約） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| 関連 Issue | #261 |

## 目的

本タスクの「失敗」は実行時例外ではなく、**下流タスク（UT-04 / UT-09 / aiworkflow-requirements）が本仕様書を読まずに / 誤読して進んだ場合に起きうる reconciliation 崩壊シナリオ** である。設計 reconciliation の実効性は、こうした **後から起きる文書漏れ** に対する **文書側ガード**（記述強度・記載位置・cross-link）の強さで決まる。

本 Phase では Phase 4 V-1〜V-7 の合格状態を前提として、5 件の失敗系シナリオ (a)〜(e) を列挙し、それぞれに対する文書ガード（どの文書のどの位置に何を記述すべきか）を Phase 2 成果物へフィードバックする。

## 実行タスク

1. 失敗系 5 件 (a)〜(e) を分類・原因・検出・文書ガード・関連 V-i の 5 列で列挙する（完了条件: 全件で 5 セル埋まる）。
2. 各失敗系の文書ガードが Phase 2 のどのファイルのどのセクションに挿入されるかを示す（完了条件: ガード位置が具体的に特定）。
3. ガード文の強度（注意書き / 太字警告 / 禁止事項リスト）を指定する（完了条件: 強度が一意）。
4. cross-link 強化点を Phase 5 main.md の index.md cross-link 表と整合させる（完了条件: dead link 0）。
5. UT-04 / UT-09 / aiworkflow-requirements への cross-link 強化案を `outputs/phase-06/main.md` に転記する（完了条件: 各下流タスクから本仕様書へ pull 参照される導線が文書化）。
6. 失敗系 (a)〜(e) と Phase 4 V-1〜V-7 の対応を Phase 7 AC matrix に流し込める形式で固定する（完了条件: 失敗系 × V × AC の 3 軸 trace が下書きされる）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-04.md | V-1〜V-7 入力 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-05.md | 禁止操作 / cross-link |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md | ガード挿入先 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md | ガード挿入先 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md | ガード挿入先 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md | ガード挿入先 |
| 必須 | docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md | 下流引き継ぎ先 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 物理側現状（Read のみ） |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | drift 対象 |

## 失敗系マトリクス (a)〜(e)

| # | 分類 | 失敗シナリオ | 原因 | 検出 | 文書ガード（挿入位置 / 内容 / 強度） | 関連 V-i |
| - | --- | --- | --- | --- | --- | --- |
| (a) | 二重 ledger 化 | UT-04 担当が canonical 文書を読まず新規に `sync_log` テーブルを CREATE | UT-04 着手者が本仕様書を未参照、または canonical name が見つけにくい配置 | 新規 migration ファイルに `CREATE TABLE sync_log` が出現 | **挿入位置**: `outputs/phase-02/naming-canonical.md` 冒頭 / **内容**: 「UT-04 / UT-09 着手前提条件: 本ファイルの canonical name セクションを必ず参照。`sync_log` という新規 table 作成は禁止」/ **強度**: 太字警告 + 禁止事項リスト | V-1 / V-6 |
| (b) | rename 後追い採用でデータ消失 | 後続タスクが「論理に揃えて物理を rename すべき」と判断し `ALTER TABLE sync_job_logs RENAME TO sync_log` を発行 | 4 案比較表が読まれず採択案 / 却下案の理由が伝わらない | production migration に rename 文が出現 | **挿入位置**: `outputs/phase-02/backward-compatibility-strategy.md` 採択結果直後 / **内容**: 「rename 案は却下。理由: 本番データを保持する table の RENAME は D1 で rollback 不能なリスクがある。UT-04 / UT-09 はこの却下案を再採用してはならない」/ **強度**: 禁止事項リスト | V-4 |
| (c) | idempotency_key を ledger 側に誤追加 | UT-09 担当が論理 13 カラムを物理 ledger `sync_job_logs` に全部足そうとする | mapping-matrix の責務分離（ledger vs lock）が読み飛ばされる | 新規 migration に `ALTER TABLE sync_job_logs ADD COLUMN idempotency_key` が出現 | **挿入位置**: `outputs/phase-02/column-mapping-matrix.md` の各カラム行に「物理側責務テーブル」列を必須化 / **内容**: 「`idempotency_key` は ledger 側にも lock 側にも未実装。追加要否判定は UT-04 が単独で行わず、本マッピング表を根拠に責務テーブルを決定」/ **強度**: 注意書き + マッピング表必須列 | V-2 / V-3 |
| (d) | U-8 enum 決定の混入 | レビュー中に「enum 値が canonical でないと命名 canonical も決まらない」と議論が混じり、本タスク内で enum 値を決定 | 直交性チェックリストが薄く、レビュアーが越境を抑止できない | 本仕様書 / Phase 2 成果物に `pending|in_progress|completed|failed` 等の値選択が出現 | **挿入位置**: `outputs/phase-02/handoff-to-ut04-ut09.md` 冒頭 / **内容**: 「本タスクは enum 値 / retry 値 / offset 値 / shared schema 実装 / 物理 migration 発行を決定しない。レビュー中に越境議論が出た場合は U-8 / U-9 / U-10 / UT-04 へ即座に分離」/ **強度**: 太字警告 + チェックボックス 5 件 | V-5 |
| (e) | aiworkflow-requirements drift 残置 | `database-schema.md` の sync 系記述が更新されず、後続タスクが古い canonical 名を参照 | Phase 5 で drift 提案ファイルを作っても Phase 12 Step 1-A で実編集されない | 後続タスクが `database-schema.md` を grep し旧 `sync_log` 単独表記に hit | **挿入位置**: `outputs/phase-05/aiworkflow-requirements-update-proposal.md` 末尾 + Phase 12 Step 1-A 引き渡し contract / **内容**: 「Phase 12 Step 1-A 担当は `database-schema.md` の drift list を消化し、`mise exec -- pnpm indexes:rebuild` を実行。drift 0 件の再 grep を完了条件とする」/ **強度**: 完了条件チェックリスト | V-7 |

合計 5 件（要件 5 件を満たす）。

## ガード文の強度ガイドライン

| 強度 | 用途 | 表記例 |
| --- | --- | --- |
| 注意書き | 文書理解を助ける補足 | `> 注意: ...` |
| 太字警告 | 越境 / 誤読を抑止 | `**重要**: ... してはならない` |
| 禁止事項リスト | 具体的な禁止操作の列挙 | `- 禁止: ALTER TABLE sync_job_logs RENAME ...` |
| 完了条件チェックリスト | 下流タスクの definition of done | `- [ ] drift 0 件を再 grep で確認` |

## cross-link 強化案

### 下流タスクからの pull 参照導線

| 起点 | 参照先 | 種別 |
| --- | --- | --- |
| `docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md` 冒頭 | `outputs/phase-02/naming-canonical.md` | 必須参照（UT-04 着手前） |
| `docs/30-workflows/unassigned-task/UT-09-*.md` 冒頭 | 同上 + `outputs/phase-02/column-mapping-matrix.md` | 必須参照（UT-09 着手前） |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` の sync 系セクション | 本仕様書 index.md | 仕様 drift 解消後の link back |

> 本タスクは UT-04 / UT-09 仕様書本体の編集権限を持たないため、cross-link 強化は本仕様書側に「UT-04 / UT-09 着手者向けの要約」セクションを置く形で対応。実 link back は Phase 12 Step 1-A の `database-schema.md` 編集と同時に検討する（必要なら未タスクへ分離）。

## 失敗系 × V × AC trace 下書き（Phase 7 入力）

| 失敗系 | 関連 V | 関連 AC |
| --- | --- | --- |
| (a) | V-1 / V-6 | AC-1 / AC-4 |
| (b) | V-4 | AC-3 |
| (c) | V-2 / V-3 | AC-2 |
| (d) | V-5 | AC-5 |
| (e) | V-7 | AC-6 |

> 全失敗系が最低 1 つの V と 1 つの AC に紐付く。Phase 7 で 3 軸 matrix として最終確定。

## 実行手順

1. 失敗系 5 件マトリクスを `outputs/phase-06/main.md` に転記。
2. 各ガード挿入位置を Phase 2 成果物のセクション名で具体化。
3. 強度（注意書き / 太字警告 / 禁止事項リスト / 完了条件）を一意に付与。
4. cross-link 強化案を index.md cross-link 表と差分なく揃える。
5. 失敗系 × V × AC の 3 軸 trace を下書きし Phase 7 へ送る。
6. open question（UT-04 / UT-09 仕様書本体への cross-link back の要否）を Phase 12 unassigned へ送る判断を残す。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | V-1〜V-7 と失敗系の対応を確定 |
| Phase 7 | 失敗系 × V × AC の 3 軸 matrix へ流し込み |
| Phase 12 | (e) の drift 残置防止を Step 1-A 完了条件に組み込む |
| UT-04 / UT-09 | (a) (b) (c) を着手前提条件に明記 |

## 多角的チェック観点（AI が判断）

- 価値性: 5 失敗系が下流タスクの実害（二重 ledger / データ消失 / 越境 / drift 残置）を網羅するか。
- 実現性: ガード文挿入位置が Phase 2 既存セクションで実現可能か（追加章を新設しすぎていないか）。
- 整合性: 失敗系 × V trace に未対応セルが無いか。
- 運用性: ガード文の強度が機械的にレビュー可能（grep でヒット可能）か。
- 認可境界: UT-04 / UT-09 の仕様書本体に対する書込権限を超えた cross-link 強化案を含んでいないか。
- セキュリティ: 失敗系シナリオに API token / OAuth / D1 binding 露出経路が含まれていないか（→ 含まれない設計）。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 失敗系 5 件マトリクス | spec_created |
| 2 | 各ガード挿入位置の具体化 | spec_created |
| 3 | ガード強度の一意付与 | spec_created |
| 4 | cross-link 強化案 | spec_created |
| 5 | 失敗系 × V × AC trace 下書き | spec_created |
| 6 | 仕様書本体 cross-link back の要否判定（必要なら未タスク） | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | 失敗系 5 件 + ガード挿入位置 + 強度 + cross-link + 3 軸 trace 下書き |
| メタ | artifacts.json | Phase 6 状態更新 |

## 完了条件

- [ ] 失敗系 5 件 (a)〜(e) が分類・原因・検出・ガード・関連 V-i の 5 列で全埋め
- [ ] 各ガード挿入位置が Phase 2 ファイル名 + セクション名で具体化
- [ ] ガード強度が 4 種から一意選択
- [ ] cross-link 強化案が index.md と整合（dead link 0）
- [ ] 失敗系 × V × AC trace 下書きで未対応セル 0
- [ ] 仕様書本体への cross-link back 要否を判定済み（必要時は未タスク化方針が記述）

## タスク 100% 実行確認【必須】

- 実行タスク 6 件すべて `spec_created`
- 成果物が `outputs/phase-06/main.md` に配置済み
- 失敗系 5 件すべてに 5 セル記入
- 失敗系 × V trace で V-1〜V-7 がいずれか 1 つ以上の失敗系で参照される
- 物理 DDL / コード変更を伴うガード提案が 0 件（文書ガードのみ）

## 次 Phase への引き渡し

- 次 Phase: 7（AC matrix）
- 引き継ぎ事項:
  - 失敗系 (a)〜(e) を AC matrix の「関連失敗系」列で参照
  - 3 軸 trace 下書きを Phase 7 で最終確定
  - (e) の drift 残置防止を Phase 12 Step 1-A 完了条件として申し送り
- ブロック条件:
  - 失敗系 5 件未満で Phase 7 へ進む
  - ガード挿入位置が抽象的（ファイル名 / セクション名が無い）
  - 失敗系 × V trace に未対応セルが残存
