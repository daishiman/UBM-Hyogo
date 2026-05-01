# Phase 4: テスト戦略（机上検証）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | retry 回数と offset resume 方針の統一 (U-UT01-09) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（机上検証） |
| 作成日 | 2026-04-30 |
| 前 Phase | 3 (設計レビューゲート) |
| 次 Phase | 5 (実装委譲ランブック) |
| 状態 | spec_created |
| タスク分類 | specification-design（test-strategy / desk-check） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

本タスクは docs-only であり、コード実装・migration 適用・本番 query を一切伴わない。
したがって本 Phase の「テスト戦略」は、Phase 2 で確定した canonical retry / offset resume 方針が
Phase 9（quota / SLA 算定）で机上証明できるよう、4 つの机上検証（V1〜V4）を Phase 検証手順に
変換することを責務とする。コードを書かずに「数式・表計算・SQL シミュレーション」のみで
canonical 値の妥当性を確定するための検証ガイドを成果物として固定する。

## 実行タスク

1. V1（retry boundary 机上検証）の入力パラメータ表と算定式を確定する（完了条件: batch_size / 行数 / 1-batch 失敗シナリオに対する成功率・quota 消費・1 tick 内最大滞在時間が表計算で算定可能な式が明示）。
2. V2（offset resume シナリオ 3 ケース比較）の比較軸を確定する（完了条件: ケース A=offset 採用 / ケース B=不採用+冪等 upsert / ケース C=hybrid（chunk index + 安定 ID）が同一指標で比較可能）。
3. V3（Sheets API quota 影響試算）の worst case 計算式を確定する（完了条件: retry × backoff curve × batch_size × cron 間隔の組合せから 100s window 内 request 数を導出する式が明示）。
4. V4（D1 migration 影響評価）の机上手順を確定する（完了条件: `processed_offset` 追加可否の 3 択判断ごとに「採用→migration 手順」「不採用→代替シグナル」「hybrid→列定義+整合制約」の決定木が定義）。
5. coverage 代替指標を確定する（完了条件: docs-only のため line/branch coverage は適用せず、「机上検証 4 種の根拠表充足率 100%」「AC1〜AC6 トレース率 100%」を採用）。
6. UT-09 への引き渡し契約を不変条件として明示する（完了条件: V1〜V4 の採択値が UT-09 phase-04 の contract に流れる経路が記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/canonical-retry-offset-decision.md | canonical 採択値（retry / backoff / offset 単位） |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/migration-impact-evaluation.md | migration 影響机上評価 |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md | retry 仕様の上流（3 回 / 1s〜32s / batch 100） |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md | `processed_offset` / `retry_count` 論理定義 |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 既存 `DEFAULT_MAX_RETRIES = 5` / `withRetry({ baseMs: 50 })` |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 既存 schema（`processed_offset` 不在） |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md | canonical 入力 / 苦戦箇所 / リスク |
| 参考 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | sync / retry / offset 関連の正本仕様索引 |
| 参考 | https://developers.google.com/sheets/api/limits | Sheets API quota（500 req/100s/project） |

## 検証スイート設計（机上）

### V1: retry boundary 机上検証

| 候補値 | 入力 | 算定指標 | 採否判定基準 |
| --- | --- | --- | --- |
| retry=3 | batch_size=100 / 1000 行 / 1 batch 障害 | 成功率 / quota 消費 (req) / 1 tick 内最大滞在時間 (s) | quota < 500/100s かつ tick 内完了 |
| retry=5（既存実装） | 同上 | 同上 | 同上。超過する場合は不採用根拠化 |
| retry=可変（環境変数） | 同上 + env 上限 | 同上 + 過渡期切替コスト | 切替期間の重複 retry を許容上限で制御可能か |

算定式:
```
total_requests_per_tick = ceil(rows / batch_size) + retry_count
backoff_total_ms        = sum(baseMs * 2^i for i in 0..retry_count-1)
tick_residency_ms       = batches * (api_latency_ms + backoff_total_ms)
```

### V2: offset resume シナリオ 3 ケース比較

| ケース | offset 採否 | 失敗シナリオ（1000 行中 600 行成功で failed） | 次回 tick の追加 quota | 行削除耐性 |
| --- | --- | --- | --- | --- |
| A | 採用（rowIndex） | 601 行目から再開 | +400 req | 低（行削除で position drift） |
| B | 不採用（毎回全件 upsert） | 0 行目から再取得 | +1000 req × cron 頻度 | 高（冪等 upsert） |
| C | hybrid（chunk index + 安定 ID） | chunk 7 から再開 + 安定 ID で重複排除 | +400 req（A 同等） | 高 |

採択基準: V3 の quota worst case が 500 req/100s を超えないこと、かつ U-UT01-09 苦戦箇所 2/4 を解消できること。

### V3: Sheets API quota 影響試算

worst case 計算:
```
window_requests = max(
  cron_concurrent_jobs * (batches + retries),
  manual_sync_requests + cron_requests
)
```

| 組合せ | retry | batch_size | cron 間隔 | 同時実行 | window_requests | 判定 |
| --- | --- | --- | --- | --- | --- | --- |
| #1 | 3 | 100 | 6h | 1 | 算定値 < 500 | PASS |
| #2 | 5 | 100 | 6h | 1 | 算定値（仕様超過判定） | 算定値次第 |
| #3 | 3 | 100 | 6h | manual+cron 同時 | `sync_locks` で排他 | PASS（排他確認） |

### V4: D1 migration 影響評価（机上）

決定木:
```
processed_offset 採用?
├─ Yes → ALTER TABLE sync_job_logs ADD COLUMN processed_offset INTEGER NOT NULL DEFAULT 0
│        ├─ 既存行 backfill: DEFAULT 0 が既存 failed/in_progress の意味として妥当か
│        └─ rollback: ALTER TABLE ... DROP COLUMN（D1/SQLite 制約により再構築が必要）
├─ No  → 代替シグナル:
│        ├─ retry_count を再開判定の根拠とする
│        └─ started_at 上書きしない仕様で in_progress 区別
└─ Hybrid → chunk_index INTEGER + last_stable_id TEXT を追加
            └─ 重複排除制約: response_id UNIQUE で担保（既存 schema 維持）
```

## coverage 代替指標（docs-only）

| 指標 | 目標値 | 計測方法 |
| --- | --- | --- |
| 机上検証 4 種の根拠表充足率 | 100% | V1〜V4 の表が全セル埋まっている |
| AC1〜AC6 トレース率 | 100% | Phase 7 AC マトリクスで全 AC が V1〜V4 / Phase 2 決定文書を参照 |
| canonical 値の決定理由文書化率 | 100% | Phase 2 outputs に retry / backoff / offset の各採択理由が記述 |

> docs-only のため line/branch coverage は適用しない。本 Phase はコードに触れない。

## 検証コマンド集（机上のみ・実行系コマンドなし）

本タスクではコード変更・migration apply を行わないため、実行系コマンドは含めない。
代わりに「Phase 2 outputs → Phase 9 worst case 算定 → Phase 7 AC マトリクス」の参照経路のみを固定する。

```bash
# 算定根拠ファイルの存在確認（机上検証で参照する）
ls docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/
ls docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-09/

# 既存実装値の参照（読み取りのみ・編集禁止）
grep -n "DEFAULT_MAX_RETRIES\|SYNC_MAX_RETRIES\|baseMs" apps/api/src/jobs/sync-sheets-to-d1.ts
grep -n "processed_offset" apps/api/migrations/0002_sync_logs_locks.sql || echo "absent (expected)"
```

## 実行手順

1. V1〜V4 の机上検証表を `outputs/phase-04/test-strategy.md` に転記する。
2. Phase 2 canonical 採択値を V1〜V4 の入力欄に流し込む。
3. Phase 9 quota worst case の算定式を V3 と一致させる。
4. UT-09 引き渡し契約（V1 採択 retry / V2 採択 offset 単位 / V3 算定値 / V4 採択 migration 手順）を不変条件として記述する。
5. AC1〜AC6 と V1〜V4 の対応を Phase 7 AC マトリクスへの入力として予約する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | V4 採択 migration 手順を UT-09 引き継ぎランブックに転記 |
| Phase 6 | V1〜V3 で導出した境界値超過ケースを failure-cases.md の入力に流用 |
| Phase 7 | V1〜V4 採択根拠を AC1〜AC6 トレース表へ wire-in |
| Phase 9 | V3 worst case 算定式を `quota-worst-case-calculation.md` で実測値化 |
| UT-09 phase-04 | V1 retry / V2 offset 単位 / V4 migration 手順を contract test 入力 |

## 多角的チェック観点

- 価値性: AC1〜AC6 が V1〜V4 でカバーされ、Phase 2 採択値が机上で妥当性証明されるか。
- 実現性: 既存実装値（DEFAULT_MAX_RETRIES=5 / baseMs=50）から canonical へ寄せる切替が現実的に可能か。
- 整合性: Phase 2 採択値と V1〜V4 入力値に diff がゼロであるか。
- 運用性: SRE が V3 worst case 表を見れば quota 超過リスクを判定できる粒度か。
- セキュリティ: 検証手順に API token / SA JSON が露出しないか（机上のみのため低リスクだが明示）。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | V1 retry boundary 机上検証表確定 | spec_created |
| 2 | V2 offset 3 ケース比較表確定 | spec_created |
| 3 | V3 quota worst case 計算式確定 | spec_created |
| 4 | V4 migration 影響決定木確定 | spec_created |
| 5 | coverage 代替指標確定（docs-only） | spec_created |
| 6 | UT-09 引き渡し契約確定 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-strategy.md | V1〜V4 机上検証表・coverage 代替指標・UT-09 引き渡し契約 |
| メタ | artifacts.json | Phase 4 状態更新 |

## 完了条件

- [ ] V1 retry boundary 表（候補値 × 算定指標）が空セル無しで完成
- [ ] V2 offset 3 ケース比較表が同一指標で並列比較可能
- [ ] V3 quota worst case 計算式が明示され #1〜#3 組合せが算定済み
- [ ] V4 migration 影響決定木（採用 / 不採用 / hybrid）が記述
- [ ] coverage 代替指標 3 種が目標値・計測方法付きで定義
- [ ] UT-09 への引き渡し契約が不変条件として明示
- [ ] 実行系コマンド（wrangler / migration apply）が本ドキュメントにゼロ件

## Phase 完了スクリプト呼出例

```bash
# Phase 4 完了マーキング（artifacts.json 更新）
mise exec -- pnpm tsx scripts/phase/mark-complete.ts \
  --task u-ut01-09-retry-and-offset-policy-alignment \
  --phase 4 \
  --output outputs/phase-04/test-strategy.md
```

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物が `outputs/phase-04/test-strategy.md` に配置済み
- AC1〜AC6 すべてに 1 つ以上の机上検証種別が対応
- コード実装・migration apply・本番 query の指示が本ドキュメントにゼロ件

## 次 Phase への引き渡し

- 次 Phase: 5 (実装委譲ランブック)
- 引き継ぎ事項:
  - V4 採択 migration 手順 → UT-09 ランブック Step に転記
  - V1 採択 retry / V2 採択 offset 単位 → UT-09 contract test 入力
  - V3 worst case 算定式 → Phase 9 で実測値化
- ブロック条件:
  - V1〜V4 のいずれかが空セル
  - Phase 2 採択値と V1〜V4 入力値に diff
  - 実行系コマンドが本ドキュメントに混入
