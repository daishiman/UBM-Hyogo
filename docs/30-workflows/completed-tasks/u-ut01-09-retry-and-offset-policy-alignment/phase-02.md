# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | U-UT01-09 retry 回数と offset resume 方針の統一 |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計（canonical 採択候補比較） |
| 作成日 | 2026-04-30 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビューゲート) |
| 状態 | spec_created |
| タスク分類 | docs-only（設計判断記録のみ。コード変更・migration 作成・PR は一切行わない） |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |

## 目的

Phase 1 で確定した真の論点（3 つの canonical 値の一意化）を、3 軸（retry 最大回数 / Exponential Backoff curve / `processed_offset` 採否）の比較評価マトリクスに展開し、各軸で採択候補と採択理由を Markdown 設計判断記録として固定する。Phase 3 設計レビューゲートが AC1-AC6 を満たすか単独でチェックリスト評価可能な粒度の成果物を作成する。

本 Phase はコード変更・migration 作成・PR 作成を一切伴わない。成果物は `outputs/phase-02/canonical-retry-offset-decision.md` と `outputs/phase-02/migration-impact-evaluation.md` の 2 ファイル。

## 真の論点 (true issue)

- 3 軸（retry / backoff / offset）は独立変数ではなく、`retry_count × backoff 上限 × batch_size × cron 頻度` の積が Sheets API quota（500 req/100s/project）と Workers CPU 制限の双方を踏み抜かない解空間でのみ整合的に成立する → 比較表は軸ごとの単独評価ではなく **組合せでの quota / CPU 整合** を検証する。
- offset 採否は schema 影響（D1 migration 追加列）を伴うため、論理判断（採否）と物理判断（migration 手順）を Phase 2 で同時に評価し、UT-09 / U-UT01-07 へ申し送る粒度に揃える。

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | 比較表・評価マトリクス・migration 手順記述のみ |
| 成果物の物理形態 | テキスト（Markdown 2 ファイル） | `outputs/phase-02/canonical-retry-offset-decision.md` / `outputs/phase-02/migration-impact-evaluation.md` |
| 検証方法 | Phase 3 設計レビューゲート（チェックリスト方式） | 実機検証は UT-09 実装フェーズに委譲 |

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | Phase 1 (要件定義) | 真の論点・苦戦箇所 4 件・AC1-AC6・依存境界・quota 算定前提 | 比較表入力として使用 |
| 上流 | UT-01 Phase 02 outputs | 論理 base case（retry 3 / backoff 1s〜32s / offset 採用） | 候補 1 として比較表に投入 |
| 上流 | apps/api/src/jobs/sync-sheets-to-d1.ts | 実装値（retry 5 / backoff 50ms 起点 / offset 不採用） | 候補 2 として比較表に投入 |
| 下流 | Phase 3 (設計レビューゲート) | canonical 決定 3 件 + migration 影響評価 | チェックリスト入力 |

## 実行タスク

1. retry 最大回数 3 候補（3 / 5 / 環境変数で可変）を 5 評価軸で比較する（完了条件: 比較表に空セルゼロ、採択値と採択理由が確定）。
2. Exponential Backoff curve 2 候補（仕様 1s〜32s / 実装 50ms〜800ms）+ jitter 採否を比較する（完了条件: 採択 curve と jitter 方針が確定）。
3. `processed_offset` 採否 3 候補（追加 / 不採用 / hybrid chunk index + 安定 ID）を比較し、採択ケースの offset 単位を定義する（完了条件: 単位定義と Sheets 行削除耐性の根拠が記載）。
4. 3 軸の組合せが quota（500 req/100s/project）と Workers CPU 制限を踏み抜かないことを worst case シナリオで机上算定する（完了条件: 算定根拠を含む quota 試算表が記載）。
5. `processed_offset` 採用時の D1 migration 影響を評価する（完了条件: 追加列の DDL 案 / DEFAULT 値 / backfill 手順 / rollback 手順が記載）。
6. `SYNC_MAX_RETRIES` 環境変数の存続可否と既定値方針を確定する（完了条件: `wrangler.toml` / `.dev.vars` の参照ポイント appendix 付き）。
7. 成果物 2 ファイルを `outputs/phase-02/` 配下に配置する（完了条件: 2 ファイル生成）。

## canonical 採択候補比較表（成果物 1: canonical-retry-offset-decision.md の構造）

### 軸 1: retry 最大回数

| 候補 | retry 回数 | 評価軸: 失敗解釈一意性 | 評価軸: quota 消費（worst case） | 評価軸: SLA 整合 | 評価軸: 過渡期影響 | 評価軸: 環境差吸収 |
| --- | --- | --- | --- | --- | --- | --- |
| 候補 1（仕様準拠） | 3 | PASS（3 回で failed 確定） | PASS（worst case で 4 req / batch） | PASS（仕様 SLA に整合） | MINOR（5→3 で過渡期 failed 増） | MINOR（環境ごとに変えられない） |
| 候補 2（実装維持） | 5 | MAJOR（仕様と乖離継続） | MINOR（worst case で 6 req / batch） | MAJOR（仕様 SLA 不整合） | PASS（変更不要） | MINOR（同上） |
| 候補 3（env 可変） | `SYNC_MAX_RETRIES` 既定 3 | PASS（既定 3 で仕様準拠） | PASS（dev で実験可） | PASS | MINOR（同候補 1） | PASS（dev / staging で curve 検証可） |

採択判断は Phase 2 実行時に成果物 `canonical-retry-offset-decision.md` で確定する。本 spec は比較軸と候補の固定のみ規定する。

### 軸 2: Exponential Backoff curve

| 候補 | base | 段階 | 上限 | jitter | 1 batch worst 滞在時間 | 評価 |
| --- | --- | --- | --- | --- | --- | --- |
| 候補 A（仕様準拠） | 1s | 1/2/4/8/16/32s | 32s | 採用（±20%） | retry 3 で約 7s + retry 待機 7s = 14s | PASS（quota 余裕） |
| 候補 B（実装維持） | 50ms | 50/100/200/400/800ms | 800ms | 不明 | retry 5 で約 1.5s | MINOR（burst で quota 踏み抜く） |
| 候補 C（中間案） | 500ms | 0.5/1/2/4/8s | 8s | 採用（±20%） | retry 3 で約 3.5s | PASS（quota 余裕、tick 内収束） |

採択は `canonical-retry-offset-decision.md` で確定。jitter 採否は採択 curve と独立に判断（`±20%` を base 案）。

### 軸 3: `processed_offset` 採否

| 候補 | 採否 | offset 単位 | Sheets 行削除耐性 | migration 影響 | quota 消費（部分失敗時） | 評価 |
| --- | --- | --- | --- | --- | --- | --- |
| 候補 X（採用） | 追加 | Sheets rowIndex | MAJOR（行削除で意味壊れる） | 列追加 + DEFAULT 0 | PASS（再開で減る） | MINOR |
| 候補 Y（不採用） | 不採用 | - | PASS（再取得で常に整合） | PASS（変更なし） | MAJOR（毎回フル再取得） | MAJOR（CPU 制限踏み抜き） |
| 候補 Z（hybrid） | 採用 | chunk index + 安定 ID 集合 | PASS（安定 ID で整合性復元） | 列 2 個追加 + DEFAULT | PASS | PASS |

採択は `canonical-retry-offset-decision.md` で確定。安定 ID の定義は Sheets 列 / mapper 規約への依存があり Phase 2 で明示する。

### 3 軸組合せの quota / CPU 整合（worst case 試算）

worst case 前提:
- batch_size = 100
- 同期対象 = 1000 行
- cron = 6h 間隔 + 手動同期 1 回が同時刻に発生
- Sheets API quota = 500 req/100s/project
- Workers CPU 制限 = 30s（無料枠の scheduled handler 実効値を base に評価）

| 採用候補組合せ | 100s window worst req 数 | 1 tick worst 滞在時間 | quota 整合 | CPU 整合 |
| --- | --- | --- | --- | --- |
| (1, A, X) | 算定式: `ceil(1000/100) × (1 + 3 retry) = 40 req`（cron + 手動で 80 req） | retry 待機 14s × 10 batch worst = 算定 | 評価対象 | 評価対象 |
| (1, A, Z) | 同上 + offset で再開時 40% 削減 | 同上 | 評価対象 | 評価対象 |
| (3, C, Z) | 同上、curve 短縮で worst window 圧縮 | 短縮 | 評価対象 | 評価対象 |

具体数値は `canonical-retry-offset-decision.md` の本文で確定する。

## migration 影響評価（成果物 2: migration-impact-evaluation.md の構造）

### `processed_offset` 採用時の DDL 候補

```sql
-- 候補 1: 単一列追加
ALTER TABLE sync_job_logs ADD COLUMN processed_offset INTEGER NOT NULL DEFAULT 0;

-- 候補 2: hybrid（chunk index + 安定 ID 集合）
ALTER TABLE sync_job_logs ADD COLUMN processed_chunk_index INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_job_logs ADD COLUMN processed_stable_ids  TEXT;  -- JSON array
```

### 既存行 backfill 手順

- 既存 failed / success 行は `DEFAULT 0` で backfill 可能。
- in_progress 行が migration 適用時刻に存在する場合は手動 0 設定が安全（migration 適用前に lock 解放を確認）。

### rollback 手順

- D1 は forward-only migration のため、rollback は逆 migration（列 DROP）を新規追加で対応。
- production rollback は `bash scripts/cf.sh d1 export` で事前バックアップ取得後に逆 migration を適用。

### UT-09 / U-UT01-07 への申し送り

| 申し送り先 | 内容 |
| --- | --- |
| UT-09 | canonical retry / backoff / offset 値を実装定数 / 環境変数に反映。`SYNC_MAX_RETRIES` 既定値の更新箇所を `wrangler.toml` / `.dev.vars` で確認 |
| U-UT01-07 | `processed_offset` 列追加 migration を ledger 物理整合タスク内で実施。本タスクは canonical 判断のみ申し送り |

## リスクと対策

| # | リスク | 影響 | 対策 |
| --- | --- | --- | --- |
| R1 | quota 試算が概算で worst case を取りこぼす | canonical 採択後に quota 超過発生 | Phase 3 設計レビューゲートで「quota 試算未収束」を MAJOR 判定基準に含める |
| R2 | `SYNC_MAX_RETRIES` 既定値変更を `wrangler.toml` で忘れる | 環境差で挙動不一致 | appendix で参照ポイントを列挙し UT-09 受入条件に含める |
| R3 | hybrid offset の安定 ID 定義が mapper 規約に未整合 | offset の意味が壊れる | Phase 2 で安定 ID 候補（`sheets_row_id` / Sheets 行内 hash 等）を明示し、UT-09 / U-UT01-07 mapper 規約と突合 |
| R4 | migration 手順が production 適用時に失敗 | データ整合崩壊 | rollback 手順を `bash scripts/cf.sh d1 export` 経由で固定化 |

## 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-09 実装が単独判断不能になる状況を 3 軸 canonical で解消 |
| 実現性 | PASS | docs-only / Markdown 2 ファイル / 机上算定で完結 |
| 整合性 | PASS | 不変条件 #1 / #5 維持。U-UT01-07 / U-UT01-08 と直交 |
| 運用性 | PASS | UT-09 / U-UT01-07 への申し送り経路が一意化 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/phase-01.md | Phase 1 真の論点・AC1-AC6・依存境界 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md | canonical 入力（本タスクの正本） |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md | retry / backoff の論理 base case |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md | `processed_offset` 論理定義 |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | `DEFAULT_MAX_RETRIES = 5` / `withRetry({ baseMs: 50 })` の実装値 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | `processed_offset` 列不在の事実 |

### aiworkflow-requirements 連携

| 種別 | パス | 用途 |
| --- | --- | --- |
| 参考 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | sync / retry / offset / quota 索引 |
| 参考 | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_job_logs` 物理 schema |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Wrangler D1 migrations 手順 |

## 完了条件チェックリスト

- [ ] 軸 1（retry 最大回数）の比較表が 3 候補 × 5 評価軸で空セルゼロ
- [ ] 軸 2（backoff curve）の比較表が 3 候補で記述され jitter 方針が確定
- [ ] 軸 3（`processed_offset` 採否）の比較表が 3 候補で記述され、採択ケースの offset 単位が定義
- [ ] 3 軸組合せの worst case quota / CPU 試算が具体数値で記載
- [ ] migration 影響評価（DDL / backfill / rollback）が `migration-impact-evaluation.md` に記載
- [ ] `SYNC_MAX_RETRIES` の存続可否と既定値が確定し、`wrangler.toml` / `.dev.vars` 参照ポイントが appendix 化
- [ ] UT-09 / U-UT01-07 への申し送り内容が記載
- [ ] 成果物 2 ファイル（`canonical-retry-offset-decision.md` / `migration-impact-evaluation.md`）が `outputs/phase-02/` 配下に配置
- [ ] コード変更 / migration 作成 / PR が発生していない

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | canonical 候補比較と migration 影響評価を設計レビューゲートの PASS / MINOR / MAJOR 判定入力にする |
| Phase 4 | retry boundary / offset シナリオ / quota / migration の V1〜V4 検証軸へ展開する |
| Phase 5 | 採択値と `SYNC_MAX_RETRIES` 方針を UT-09 handover runbook の Step A〜F に渡す |
| Phase 7 | AC1〜AC6 と Phase 2 採択値の traceability matrix を作る |
| Phase 9 | quota worst case 算定で Phase 2 の retry / backoff / batch_size 前提を再利用する |
| Phase 12 | canonical 値と migration 影響を implementation-guide Part 2 と system-spec-update-summary に反映する |

## 完了条件（コマンド）

```bash
node .claude/skills/task-specification-creator/scripts/complete-phase.js \
  --workflow docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment \
  --phase 2 \
  --artifacts docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/canonical-retry-offset-decision.md,docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/migration-impact-evaluation.md
```

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計判断記録 | outputs/phase-02/canonical-retry-offset-decision.md | retry / backoff / offset の 3 軸比較表 + 採択値 + 採択理由 + quota 試算 + 環境変数方針 |
| 設計判断記録 | outputs/phase-02/migration-impact-evaluation.md | `processed_offset` 採用時の DDL 候補 / backfill / rollback / UT-09・U-UT01-07 申し送り |
| メタ | artifacts.json | Phase 2 状態の更新 |

## 次 Phase への引き渡し

- 次 Phase: 3 (設計レビューゲート)
- 引き継ぎ事項:
  - 3 軸 canonical 採択値（retry / backoff / offset）と採択理由
  - quota 試算結果（worst case 100s window req 数 / 1 tick 滞在時間）
  - migration 影響評価（DDL / backfill / rollback）
  - UT-09 / U-UT01-07 への申し送り内容
  - `SYNC_MAX_RETRIES` 既定値と参照ポイント appendix
- ブロック条件:
  - 3 軸のいずれかで採択値が未確定
  - quota 試算が worst case 不在で抽象記述に留まる
  - migration 手順が DEFAULT / backfill / rollback のいずれかで未確定
  - 成果物が 1 ファイルに統合され分離されていない
