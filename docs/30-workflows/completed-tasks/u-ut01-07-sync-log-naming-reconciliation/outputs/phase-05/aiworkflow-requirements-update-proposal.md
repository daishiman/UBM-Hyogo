# Phase 5 成果物: aiworkflow-requirements `database-schema.md` drift 更新提案

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | U-UT01-07 / Issue #261 |
| Phase | 5（実装 → docs-only 読み替え: drift 検出 / 提案） |
| 作成日 | 2026-04-30 |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 対応 AC | AC-6 |

---

## 1. drift 検出コマンド（read-only 実行ログ）

```
grep -n "sync_log\|sync_job_logs\|sync_locks" \
  .claude/skills/aiworkflow-requirements/references/database-schema.md
```

実行結果（2026-04-30）:

```
（出力なし / grep exit code = 1）
```

> `database-schema.md` に `sync_log` / `sync_job_logs` / `sync_locks` のいずれの語彙も**存在しない**ことを確認。

---

## 2. 判定: drift 0 件 → 更新不要

| 観点 | 値 |
| --- | --- |
| `sync_log` 言及行数 | 0 |
| `sync_job_logs` 言及行数 | 0 |
| `sync_locks` 言及行数 | 0 |
| 合計 drift 件数 | **0** |
| 提案アクション | **更新不要**（doc-only edit を発行しない） |

---

## 3. before / after 差分テーブル

| 行番号 | 現状記述（before） | 提案記述（after） | 理由 |
| --- | --- | --- | --- |
| - | （該当行なし） | （該当行なし） | drift 0 件のため差分行なし |

---

## 4. AC-6（システム仕様 drift 解消）への適合

- AC-6 要件: `database-schema.md` の sync 系記述の整合確認 / doc-only 更新案が成果物に含まれていること
- 達成状況: **整合確認済**（grep 結果 0 件）。drift 0 件のため doc-only 更新案は「更新不要」を明示的に記録した本ファイルが成果物として該当
- AC-6 ステータス: **PASS**

---

## 5. Phase 12 Step 1-A への引き渡し contract

| 項目 | 値 |
| --- | --- |
| 編集対象ファイル | `.claude/skills/aiworkflow-requirements/references/database-schema.md` |
| 編集内容 | **編集不要**（drift 0 件） |
| Phase 12 Step 1-A 担当が行うべき作業 | drift 再 grep を実行し、引き続き 0 件であることのみ確認する |
| 後処理コマンド | `mise exec -- pnpm indexes:rebuild`（ただし本ファイル変更が `database-schema.md` 直接編集を伴わない場合は indexes 影響なし。同時実行のみ要確認） |
| `verify-indexes-up-to-date` gate | 影響なし（references/database-schema.md は未変更のため） |

---

## 6. 将来 drift 発生時の対応プロトコル（参照用）

UT-04 / UT-09 着手以降に `database-schema.md` で sync 系語彙を追加する場合、本タスクの canonical 決定（`outputs/phase-02/naming-canonical.md`）に従い以下を厳守すること:

1. **使用すべき canonical 名**: `sync_job_logs`（ledger 系）/ `sync_locks`（lock 系）
2. **使用してはならない名**: 物理単独テーブルとしての `sync_log`（論理概念用語としてのみ使用可、参照時は `= sync_job_logs + sync_locks` の注釈を必須化）
3. **drift 発生時の責務**: drift を発生させた下流タスクで再実行 grep + 更新提案 + Edit までを完結させる

---

## 7. 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | AC-6 を satisfy する evidence ファイルが明示的に存在 |
| 実現性 | PASS | grep 1 回で完結、コード / DDL 変更ゼロ |
| 整合性 | PASS | drift 0 件 = `database-schema.md` ↔ Phase 2 canonical 決定の不整合なし |
| 運用性 | PASS | rollback 不要（編集ゼロ） |

---

## 関連

- `phase-05.md`（親仕様）
- `outputs/phase-05/main.md`（本ファイルの呼び出し元）
- `outputs/phase-02/naming-canonical.md`（canonical 名の決定根拠）
- `outputs/phase-07/ac-matrix.md`（AC-6 ↔ V-7 / 失敗系 (e) のトレース）
- `outputs/phase-12/system-spec-update-summary.md`（Phase 12 Step 1-A での再確認）
