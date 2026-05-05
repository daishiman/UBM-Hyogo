# Phase 7 成果物: AC matrix（docs-only 縮約）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | U-UT01-07 / Issue #261 |
| Phase | 7（テストカバレッジ確認 → docs-only 読み替え: AC matrix） |
| 作成日 | 2026-04-30 |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |

## 目的

AC-1〜AC-6（issue #261 / index.md registry）を縦串とし、Phase 4 V-1〜V-7 + Phase 6 失敗系 (a)〜(e) を横串として **3 軸 matrix** を完成する。未被覆セル 0 件を担保し、Phase 9 の実測 / Phase 10 go-no-go / Phase 11 最終確認の入力とする。

## 3 軸 matrix（AC × 検証項目 × 失敗系）

| AC# | AC 内容（要約） | 主担 V | 補助 V | 関連失敗系 | 主たる根拠ファイル |
| --- | --- | --- | --- | --- | --- |
| AC-1 | canonical 命名決定（`sync_log` 概念名と物理 `sync_job_logs` / `sync_locks` のどちらを canonical とするか）+ 採択理由（破壊的変更コスト評価） | V-1 | V-4 | (a) | `outputs/phase-02/naming-canonical.md` |
| AC-2 | 論理 13 カラム × 物理 1:N マッピング表 | V-2 | V-3 | (c) | `outputs/phase-02/column-mapping-matrix.md` |
| AC-3 | 後方互換 4 案比較（no-op / view / rename / 新テーブル+移行）+ 採択（データ消失非伴）+ 却下理由 | V-4 | - | (b) | `outputs/phase-02/backward-compatibility-strategy.md` |
| AC-4 | UT-04 が参照する migration 戦略（in-place ALTER / no-op / 新規 migration）+ UT-04 引き継ぎ箇条書き | V-6 | V-3 | (a) | `outputs/phase-02/naming-canonical.md`（引き継ぎセクション） |
| AC-5 | 本タスクが U-8（enum）/ U-9（retry / offset）の決定を含まないことのチェックリスト確認 | V-5 | - | (d) | `outputs/phase-02/handoff-to-ut04-ut09.md` |
| AC-6 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` の sync 系記述が canonical 名と整合（drift list / 不要明記） | V-7 | - | (e) | `outputs/phase-05/aiworkflow-requirements-update-proposal.md` |

### 被覆検証

| 観点 | 結果 |
| --- | --- |
| 未被覆 AC | 0 件（AC-1〜AC-6 すべてが 1 V-i 以上 + 1 失敗系以上で被覆） |
| 未参照 V-i | 0 件（V-1〜V-7 すべてが 1 AC 以上で参照） |
| 未参照 失敗系 | 0 件（(a)〜(e) すべてが 1 AC 以上で参照） |

## V-i 別の AC 参照（逆引き）

| V# | 検証項目 | 参照 AC |
| --- | --- | --- |
| V-1 | canonical 命名一意性 | AC-1 |
| V-2 | マッピング表完全性 | AC-2 |
| V-3 | 既存実装との整合 | AC-2 / AC-4 |
| V-4 | 4 案比較表完全性 | AC-1 / AC-3 |
| V-5 | 直交性チェックリスト存在 | AC-5 |
| V-6 | UT-04 / UT-09 引き継ぎ網羅 | AC-1 / AC-4 |
| V-7 | aiworkflow-requirements drift 検出 | AC-6 |

## 失敗系別の AC 参照（逆引き）

| 失敗系 | シナリオ | 参照 AC |
| --- | --- | --- |
| (a) | 二重 ledger 化（誤新規 CREATE） | AC-1 / AC-4 |
| (b) | rename 後追いでデータ消失 | AC-3 |
| (c) | idempotency_key を ledger 側に誤追加 | AC-2 |
| (d) | U-8 enum 決定の混入 | AC-5 |
| (e) | aiworkflow-requirements drift 残置 | AC-6 |

## coverage 代替指標

| 指標 | 目標値 | 計測方法 | 出力先 |
| --- | --- | --- | --- |
| 文書不変条件の充足率 | 100%（V-1〜V-7 全 PASS） | Phase 4 grep / Read コマンド全実行 | `outputs/phase-09/manual-smoke-log.md` |
| canonical 命名 drift ヒット | 0 件 | V-1 grep 結果に物理混同なし | 同上 |
| 13 カラム被覆率 | 100% | V-2 行数 diff = 13 | 同上 |

> line/branch coverage は不適用（コード変更ゼロ）。

## 計測対象 allowlist

```
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/index.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-04.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-05.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-06.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-07.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/*.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-04/test-strategy.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-05/main.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-05/aiworkflow-requirements-update-proposal.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-06/main.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-07/ac-matrix.md
```

### 禁止パターン

```
apps/api/**     # 本タスクは apps/api を改変しない
apps/web/**     # 本タスクは apps/web を改変しない
.claude/**      # database-schema.md の直接編集は Phase 12 Step 1-A
**              # 全域指定禁止
```

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS（高） | AC-1〜AC-6 が V-1〜V-7 + 失敗系 (a)〜(e) で漏れなくトレース。UT-04 / UT-09 着手前提が確立 |
| 実現性 | PASS | 全検証が grep / Read のみで完結。実 D1 / wrangler / コード実行不要 |
| 整合性 | PASS（要 Phase 11 確認） | 本仕様書 ↔ Phase 2 成果物 ↔ `0002_sync_logs_locks.sql` ↔ `database-schema.md` の 4 文書 diff を Phase 11 で最終確認 |
| 運用性 | PASS | Phase 4 検証コマンドがコピペ実行可能、Phase 6 文書ガードが具体的位置 + 強度付き、Phase 5 で `database-schema.md` 編集の Phase 12 引き渡しが明示 |

## Phase 9 引き継ぎ項目

- V-1〜V-7 grep / Read コマンドの実測ログ取得 → `outputs/phase-09/manual-smoke-log.md`
- 13 カラム被覆率の数値計測（diff = 13 確認）
- canonical 命名 drift ヒット 0 件の確認
- aiworkflow-requirements drift list 確定（Phase 5 提案ファイルの行数）
- 4 条件評価の維持（degrade があれば Phase 10 NO-GO）

## 関連

- `phase-07.md`（本成果物の親仕様）
- `outputs/phase-04/test-strategy.md`（V-1〜V-7）
- `outputs/phase-05/main.md`（cross-link 整合）
- `outputs/phase-06/main.md`（失敗系 (a)〜(e)）
