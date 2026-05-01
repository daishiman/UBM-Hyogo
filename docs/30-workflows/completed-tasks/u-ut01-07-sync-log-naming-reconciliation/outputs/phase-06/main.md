# Phase 6 成果物: 文書失敗系拡充（docs-only 縮約）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | U-UT01-07 / Issue #261 |
| Phase | 6（テスト拡充 → docs-only 読み替え: 文書失敗系拡充） |
| 作成日 | 2026-04-30 |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |

## 目的

下流タスク（UT-04 / UT-09 / aiworkflow-requirements）が本仕様書を **読まない / 誤読する** ことで起きうる reconciliation 崩壊シナリオを 5 件列挙し、Phase 2 成果物の **どの位置に / どの強度で** 文書ガードを挿入すべきかを固定する。設計タスクの実効性は文書ガードの強度で決まる。

## 失敗系マトリクス (a)〜(e)

| # | 分類 | 失敗シナリオ | 原因 | 検出 | 文書ガード（位置 / 内容 / 強度） | 関連 V-i |
| - | --- | --- | --- | --- | --- | --- |
| (a) | 二重 ledger 化 | UT-04 担当が canonical 文書を読まず新規に `sync_log` テーブルを CREATE | UT-04 着手者が本仕様書を未参照。canonical name の置き場所が見つけにくい | 新規 migration に `CREATE TABLE sync_log` 出現 | **位置**: `outputs/phase-02/naming-canonical.md` 冒頭 / **内容**: 「UT-04 / UT-09 着手前提: 本セクション参照必須。`sync_log` という新規 table 作成は禁止」 / **強度**: 太字警告 + 禁止事項リスト | V-1 / V-6 |
| (b) | rename 後追いでデータ消失 | 後続が「論理に揃え物理を rename」と判断し `ALTER TABLE sync_job_logs RENAME` を発行 | 4 案比較表が読まれず却下理由が伝わらない | production migration に rename 文 | **位置**: `outputs/phase-02/backward-compatibility-strategy.md` 採択結果直後 / **内容**: 「rename 案は却下。本番 D1 で table RENAME は rollback 不能リスク。再採用禁止」 / **強度**: 禁止事項リスト | V-4 |
| (c) | idempotency_key を ledger 側に誤追加 | UT-09 担当が論理 13 カラムを物理 ledger に全部足そうとする | mapping-matrix の責務分離（ledger vs lock）が薄い | 新規 migration に `ALTER TABLE sync_job_logs ADD COLUMN idempotency_key` | **位置**: `outputs/phase-02/column-mapping-matrix.md` の各カラム行に「物理側責務テーブル」列を必須化 / **内容**: 「`idempotency_key` の追加要否は本マッピング表を根拠に責務テーブルを決定。ledger / lock のどちらに置くかを単独判断しない」 / **強度**: 注意書き + 必須列 | V-2 / V-3 |
| (d) | U-8 enum 決定の混入 | レビューで「enum が canonical でないと命名も決まらない」と議論が混じり enum 値を決定 | 直交性チェックリストが薄い | Phase 2 成果物に `pending|in_progress|completed|failed` 等の値選択が出現 | **位置**: `outputs/phase-02/handoff-to-ut04-ut09.md` 冒頭 / **内容**: 「本タスクは enum 値 / retry 値 / offset 値 / shared schema 実装 / 物理 migration 発行を決定しない。越境議論は U-8 / U-9 / U-10 / UT-04 へ即分離」 / **強度**: 太字警告 + チェックボックス 5 件 | V-5 |
| (e) | aiworkflow-requirements drift 残置 | `database-schema.md` が更新されず古い canonical 名が後続から参照される | Phase 5 で drift 提案を作っても Phase 12 Step 1-A で実編集されない | 後続が `database-schema.md` を grep し旧 `sync_log` 単独表記に hit | **位置**: `outputs/phase-05/aiworkflow-requirements-update-proposal.md` 末尾 + Phase 12 Step 1-A 引き渡し contract / **内容**: 「Phase 12 Step 1-A 担当は drift list を消化、`mise exec -- pnpm indexes:rebuild` 実行、drift 0 件を再 grep で確認」 / **強度**: 完了条件チェックリスト | V-7 |

合計 5 件。

## ガード強度ガイドライン

| 強度 | 用途 | 表記例 |
| --- | --- | --- |
| 注意書き | 文書理解を助ける補足 | `> 注意: ...` |
| 太字警告 | 越境 / 誤読の抑止 | `**重要**: ... してはならない` |
| 禁止事項リスト | 具体的禁止操作の列挙 | `- 禁止: ALTER TABLE sync_job_logs RENAME ...` |
| 完了条件チェックリスト | 下流タスクの DoD | `- [ ] drift 0 件を再 grep で確認` |

## cross-link 強化案

### 下流からの pull 参照導線

| 起点 | 参照先 | 種別 | 実装担当 |
| --- | --- | --- | --- |
| UT-04 仕様書冒頭 | `outputs/phase-02/naming-canonical.md` | 必須参照 | 本タスクは編集権限外。UT-04 着手者が pull 参照する設計 |
| UT-09 仕様書冒頭 | 同上 + `outputs/phase-02/column-mapping-matrix.md` | 必須参照 | 同上 |
| `database-schema.md` の sync 系セクション | 本仕様書 index.md | link back | Phase 12 Step 1-A の実編集と同時に検討（必要なら未タスク化） |

> 本タスクは UT-04 / UT-09 仕様書の編集権限を持たない。cross-link 強化は本仕様書側に「UT-04 / UT-09 着手者向け要約」を置く形で代替し、将来的な pull 導線整備は未タスク化する判断を Phase 12 で行う。

## 失敗系 × V × AC trace（Phase 7 入力）

| 失敗系 | 関連 V | 関連 AC |
| --- | --- | --- |
| (a) | V-1 / V-6 | AC-1 / AC-4 |
| (b) | V-4 | AC-3 |
| (c) | V-2 / V-3 | AC-2 |
| (d) | V-5 | AC-5 |
| (e) | V-7 | AC-6 |

すべての V-i が最低 1 失敗系と紐付き、すべての AC が最低 1 失敗系と紐付く。

## 関連

- `phase-06.md`（本成果物の親仕様）
- `outputs/phase-04/test-strategy.md`（V-1〜V-7）
- `outputs/phase-05/main.md`（cross-link 整合）
- `outputs/phase-07/ac-matrix.md`（次 Phase で 3 軸 matrix 確定）
