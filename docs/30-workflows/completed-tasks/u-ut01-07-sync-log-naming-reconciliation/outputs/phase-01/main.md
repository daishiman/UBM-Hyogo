# Phase 1 主成果物: 要件定義

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-04-30 |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |

## 1. 真の論点

「論理 `sync_log` を採るか物理 `sync_job_logs` / `sync_locks` を採るか」の二者択一ではなく、以下 3 軸を同時に満たす **文書契約の提供** が本タスクの本質。

1. **契約提供**: UT-04 / UT-09 が確定 canonical 名で着手できる
2. **本番物理の保護**: 既に稼働中の `apps/api/migrations/0002_sync_logs_locks.sql` を破壊しない
3. **直交性担保**: enum 値（U-8）・retry / offset 値（U-9）の決定に踏み込まない

## 2. 物理側現状（read-only 入力）

`apps/api/migrations/0002_sync_logs_locks.sql` より:

| 物理テーブル | カラム | 型 | 備考 |
| --- | --- | --- | --- |
| `sync_locks` | id / acquired_at / expires_at / holder / trigger_type | TEXT | id = PK、TTL 付き lock |
| `sync_job_logs` | id / run_id / trigger_type / status / started_at / finished_at / fetched_count / upserted_count / failed_count / retry_count / duration_ms / error_reason | INTEGER PK + TEXT 群 | run_id UNIQUE、index 2 個 |

## 3. 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | UT-01 | 論理 13 カラム設計 + U-7 検出 | canonical 名 + マッピング表 |
| 上流 | 既存物理 migration / job code | read-only | カラム / フロー写経 |
| 下流 | UT-04 | canonical 名 + migration 戦略 | migration 計画引き継ぎ |
| 下流 | UT-09 | canonical 名 | 実装参照 |
| 直交 | U-8 / U-9 | スコープ非侵食 | 直交性チェックリスト |

## 4. ownership 宣言

| パス | 権限 |
| --- | --- |
| `docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/**` | write（本タスク） |
| `apps/api/migrations/0002_sync_logs_locks.sql` | **read-only**（改変禁止） |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | **read-only** |
| `apps/api/migrations/*.sql`（新規） | 本タスクは **追加禁止**（UT-04 へ委譲） |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | doc-only 更新可（drift 解消時のみ） |

## 5. 受入条件（AC）

- [ ] **AC-1**: canonical 命名決定（採択理由 + 破壊的変更コスト評価）→ `phase-02/naming-canonical.md`
- [ ] **AC-2**: 論理 13 カラム → 物理 1:N マッピング表 → `phase-02/column-mapping-matrix.md`
- [ ] **AC-3**: 後方互換戦略 4 案比較表（データ消失なし採択明示）→ `phase-02/backward-compatibility-strategy.md`
- [ ] **AC-4**: UT-04 migration 計画引き継ぎ → `phase-02/handoff-to-ut04-ut09.md`
- [ ] **AC-5**: U-8 / U-9 直交性チェックリスト → `phase-02/handoff-to-ut04-ut09.md`
- [ ] **AC-6**: `database-schema.md` drift 解消（不要なら不要明記）

## 6. 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 二重 ledger 化を未然防止、UT-04 / UT-09 並列着手可能 |
| 実現性 | PASS | docs-only、既存実装は read-only |
| 整合性 | PASS | 不変条件 #5 維持、U-8 / U-9 と直交 |
| 運用性 | PASS | rollback コストゼロ（Markdown revert のみ） |

## 7. 苦戦箇所と対応

| # | 苦戦箇所 | 対応 AC / 観点 |
| --- | --- | --- |
| 1 | 論理正本 vs 稼働物理の優先軸不明 | AC-1 + 「破壊的変更コスト < 概念純度」評価軸 |
| 2 | 論理 1 ↔ 物理 2 の翻訳漏れ | AC-2 + 「物理側責務テーブル」明示 |
| 3 | no-op を明示しないと rename 誘発 | AC-3 + AC-4（no-op 第一候補） |
| 4 | U-8 / U-9 スコープ侵食 | AC-5（直交性チェックリスト） |

## 8. 多角的チェック観点

- 概念純度 vs 破壊性のトレードオフ
- 論理 1 行 → 物理 N 行 / 0 行の翻訳ルール
- no-op の正当性立証
- 直交タスク侵食防止
- aiworkflow-requirements drift 解消可能性

## 9. 完了条件チェックリスト

- [x] artifacts.json.metadata.visualEvidence = NON_VISUAL 確定
- [x] artifacts.json.metadata.workflow_state = spec_created 確定
- [x] 真の論点が 3 軸で再定義
- [x] 4 条件評価が全 PASS
- [x] 依存境界表に上流 3 / 下流 2 / 直交 2
- [x] AC-1〜AC-6 が index.md（後続生成）と一致予定
- [x] 苦戦箇所 4 件が AC / 多角的チェックに対応
- [x] ownership 宣言で既存物理 migration を read-only 明示
- [x] 不変条件 #5 への適合

## 10. 次 Phase への引き渡し

- canonical 候補 3 案（A: 物理 canonical 化 / B: 論理 canonical 化 + 物理 rename / C: 論理を概念名降格 + 物理 canonical 化）→ Phase 2 で比較
- 後方互換戦略 4 案（no-op / view / rename / 新テーブル+移行）→ Phase 2 で比較
- U-8 / U-9 直交性チェックリスト → Phase 2 生成
- `database-schema.md` grep 確認（現時点で `sync_log` / `sync_job_logs` / `sync_locks` の言及なしを Phase 1 時点で確認済 → AC-6 は「drift 不要」で着地予定）
