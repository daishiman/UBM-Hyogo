# Phase 5: 実装委譲ランブック（UT-09 への引き継ぎ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | retry 回数と offset resume 方針の統一 (U-UT01-09) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装委譲ランブック（UT-09 引き継ぎ） |
| 作成日 | 2026-04-30 |
| 前 Phase | 4 (テスト戦略・机上検証) |
| 次 Phase | 6 (失敗ケース整理) |
| 状態 | spec_created |
| タスク分類 | specification-design（handover-runbook） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

本タスク (U-UT01-09) は **コード実装を行わない設計判断記録タスク** である。
通常の Phase 5「実装ランブック」を本タスクでは「**UT-09（Sheets→D1 同期ジョブ実装）への
canonical 引き継ぎランブック**」と位置づけ、Phase 2 で確定した canonical 値（retry 最大回数 /
backoff curve / offset resume 方針 / migration 採否）を、UT-09 実装側がどの順序で・どのファイルへ・
どの粒度で反映するかを runbook 化する。実装行為自体は UT-09 追補タスクの責務とし、本タスクは
「申し送り書」の品質確定で完了する。

## 実行タスク

1. UT-09 反映対象ファイル一覧を確定する（完了条件: 実装ファイル / migration / wrangler 設定 / 環境変数定義箇所が漏れなく列挙）。
2. 反映順序（Step A〜F）を確定する（完了条件: backward incompatible 変更が production 影響を出さない順序であること）。
3. 各 Step の判定基準（採用 canonical 値 / 既存値 / 過渡期挙動）を明示する（完了条件: Phase 2 outputs を引用し、UT-09 担当が独自判断不要）。
4. canUseTool 適用範囲（自動編集可 / 人手承認必須）を明記する（完了条件: production migration apply が人手承認）。
5. UT-09 受入条件への申し送り項目を確定する（完了条件: AC1〜AC6 ↔ UT-09 検証項目の対応表）。
6. 過渡期運用ルール（DEFAULT_MAX_RETRIES=5 → canonical へ寄せる切替期間）を明記する（完了条件: failed ログ閾値再校正期間 / 監視運用変更点が記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/canonical-retry-offset-decision.md | canonical 値（retry / backoff / offset 単位） |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/migration-impact-evaluation.md | migration 採否決定と影響評価 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-04/test-strategy.md | V1〜V4 採択値（UT-09 contract 入力） |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | `DEFAULT_MAX_RETRIES = 5` / `SYNC_MAX_RETRIES` / `withRetry({ baseMs: 50 })` の宣言箇所 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 既存 schema（`processed_offset` 不在） |
| 必須 | apps/api/wrangler.toml | env 別 binding / 環境変数定義 |
| 必須 | docs/30-workflows/unassigned-task/UT-09-sheets-d1-sync-job.md | 反映先タスク（受入条件への申し送り先） |
| 必須 | CLAUDE.md | scripts/cf.sh 経由実行ルール / 過渡期運用 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler.toml env 設定規約 |

## UT-09 反映対象ファイル一覧

| パス | 反映内容 | 採択 canonical 出典 |
| --- | --- | --- |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | `DEFAULT_MAX_RETRIES` を canonical 値（Phase 2 採択）に変更 | Phase 2 `canonical-retry-offset-decision.md` §retry |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | `withRetry({ baseMs })` を canonical curve に合わせて変更（例: 50 → 1000） | Phase 2 §backoff |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | offset resume ロジック追加（採択ケースに応じた chunk_index / rowIndex / 安定 ID） | Phase 2 §offset |
| `apps/api/migrations/000N_processed_offset.sql` | （採用時のみ）`sync_job_logs` への列追加 migration | Phase 2 `migration-impact-evaluation.md` §採用 |
| `apps/api/wrangler.toml` | `SYNC_MAX_RETRIES` 環境変数の存続可否と既定値（[env.dev] / [env.production]） | Phase 2 §env 方針 |
| `.dev.vars`（ローカル） | `SYNC_MAX_RETRIES` の参照規約（op:// 参照のみ） | CLAUDE.md ローカル `.env` 運用ルール |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` のテスト | retry / offset の契約テスト追加（Phase 4 V1〜V4 を入力） | Phase 4 outputs |

> **注**: 上記反映は **UT-09 追補タスクの責務**。本タスク (U-UT01-09) は本ファイル列挙のみで完了する。

## 反映順序（Step A〜F）

### Step A: env 既定値の整備（無影響変更）
- `wrangler.toml` の `[env.dev]` `[env.production]` に `SYNC_MAX_RETRIES = "<canonical>"` を明示
- `.dev.vars` は `op://Vault/Item/SYNC_MAX_RETRIES` 参照のみ
- 影響: ランタイム挙動変化なし（既定値が読み取り側で参照されるのみ）

### Step B: 定数の canonical 化（コード変更だが互換）
- `DEFAULT_MAX_RETRIES = 5` → canonical 値（Phase 2 採択）に変更
- `withRetry({ baseMs: 50 })` → canonical curve（Phase 2 §backoff）に変更
- 影響: retry 回数 / backoff 時間が変化。**過渡期 7 日は failed 件数閾値を再校正**（U-UT01-09 R1 対策）

### Step C: offset resume ロジック追加（採用時のみ）
- 採用ケース（A / C）の場合、`processed_offset` 読み取り → batch 開始位置調整 → upsert ループ
- 安定 ID で重複排除（C 採用時）
- 影響: 同期ジョブの再開挙動が変化。staging で 1000 行 × 障害シナリオ smoke 必須

### Step D: D1 migration 追加（採用時のみ）
- `apps/api/migrations/000N_processed_offset.sql` を新規作成（連番規約遵守）
- DDL: `ALTER TABLE sync_job_logs ADD COLUMN processed_offset INTEGER NOT NULL DEFAULT 0;`
- production 適用前に **必ず `bash scripts/cf.sh d1 export` でバックアップ取得**
- 適用順序: dev local → dev remote → production（人手承認必須）

### Step E: 契約テストの追加
- Phase 4 V1〜V4 を入力に retry / offset / migration 影響の unit / integration test を追加
- coverage 標準は UT-09 phase-04 で計測（本タスクではスコープ外）

### Step F: 監視 / SLA 再校正（過渡期 7 日）
- failed ログ件数の staging 実測ベース再校正
- アラート閾値の暫定緩和 → 再校正後に正規閾値へ戻す
- ロールバック条件: failed 件数が staging 想定の +200% を超えた場合は Step B を revert

## canUseTool 適用範囲

- 自動編集を許可: `apps/api/src/jobs/sync-sheets-to-d1.ts` の定数修正、`wrangler.toml` の env 値追加、新規 migration ファイル作成。
- 人手承認必須: **production migration apply（Step D 末尾）**、`SYNC_MAX_RETRIES` の本番環境変数反映、過渡期閾値変更の confirm。
- 該当なし: dev/local apply は自動承認可（破壊的影響なし）。

## UT-09 受入条件への申し送り

| AC# (本タスク) | UT-09 反映先 | 検証方法 |
| --- | --- | --- |
| AC1 (canonical retry) | UT-09 phase-04 retry 契約テスト | DEFAULT_MAX_RETRIES が canonical 値で test pass |
| AC2 (canonical backoff) | UT-09 phase-04 backoff 契約テスト | baseMs が canonical curve で 1 tick 内収まり実測 |
| AC3 (processed_offset 採否) | UT-09 phase-05 implementation runbook | 採用ケースで offset 単位（rowIndex / chunk / 安定 ID）が固定 |
| AC4 (migration 影響) | UT-09 phase-05 / phase-06 | 採用時の migration が dev → production 順で apply 成功 |
| AC5 (quota worst case) | UT-09 phase-09 quota 実測 | 100s window 内 < 500 req が staging で観測 |
| AC6 (`SYNC_MAX_RETRIES` 存続可否) | UT-09 phase-05 env 反映 | wrangler.toml に env 別 既定値が記載 |

## 過渡期運用ルール（R1 対策）

- **適用直後 7 日**: failed ログ件数のしきい値を staging 実測ベースで再校正
- **監視ダッシュボード**: 旧 retry=5 ベースの「失敗判定」ロジックを canonical retry 値ベースに書き換え
- **手動同期との重複**: `sync_locks` で排他されることを再確認（U-UT01-09 苦戦箇所 1 のレース対策）
- **ロールバック判定**: failed 件数が想定の +200% を超えた場合、Step B（定数変更）を revert し再評価

## 実行手順

1. UT-09 反映対象ファイル一覧を `outputs/phase-05/ut09-handover-runbook.md` に転記する。
2. Step A〜F の順序と判定基準を記述し、Phase 2 outputs を引用する。
3. canUseTool 適用範囲を明記する。
4. UT-09 受入条件への申し送り表を完成する。
5. 過渡期運用ルール（R1 対策）を記述する。
6. 本タスクで実装行為が一切発生しないことを冒頭に明記する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | V1〜V4 採択値を Step A〜F の判定基準に流し込み |
| Phase 6 | Step B / D の例外パスを failure-cases.md の入力に流用 |
| Phase 7 | AC1〜AC6 ↔ UT-09 申し送り表を AC マトリクスへ wire-in |
| Phase 9 | Step F 過渡期閾値の根拠データを quota worst case 算定で参照 |
| UT-09 phase-04/05/06/09 | 本ランブックを起点に実装着手 |

## 多角的チェック観点

- 価値性: UT-09 担当が本ランブックだけを見れば canonical 反映を完遂できるか。
- 実現性: 既存実装値（DEFAULT_MAX_RETRIES=5 / baseMs=50）から canonical へ Step 単位で安全に移行できるか。
- 整合性: Phase 2 採択値と本ランブック記述に diff ゼロ。
- 運用性: 過渡期 7 日のしきい値再校正が SRE 運用で実施可能な粒度か。
- 認可境界: production migration apply が canUseTool で人手承認必須化されているか。
- セキュリティ: 環境変数値が op:// 参照のみで実値が文書化されていないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | UT-09 反映対象ファイル一覧確定 | spec_created |
| 2 | Step A〜F 順序確定 | spec_created |
| 3 | 各 Step 判定基準確定 | spec_created |
| 4 | canUseTool 範囲判定 | spec_created |
| 5 | AC ↔ UT-09 申し送り表確定 | spec_created |
| 6 | 過渡期運用ルール確定 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/ut09-handover-runbook.md | UT-09 反映ファイル / Step A〜F / canUseTool / AC 申し送り / 過渡期運用 |
| メタ | artifacts.json | Phase 5 状態更新 |

## 完了条件

- [ ] UT-09 反映対象ファイル一覧が `apps/api/src/jobs/sync-sheets-to-d1.ts` / migration / `wrangler.toml` / `.dev.vars` / テストを網羅
- [ ] Step A〜F が backward incompatible 影響順を考慮した順序で定義
- [ ] 各 Step の判定基準が Phase 2 outputs を引用
- [ ] canUseTool 適用範囲（production apply は人手承認）が明記
- [ ] AC1〜AC6 ↔ UT-09 検証項目の対応表が完成
- [ ] 過渡期運用ルール（7 日再校正・revert 条件）が記述
- [ ] 本タスクで実装行為が発生しない旨が冒頭に明記
- [ ] wrangler 直叩きが本ドキュメントにゼロ件

## Phase 完了スクリプト呼出例

```bash
# Phase 5 完了マーキング
mise exec -- pnpm tsx scripts/phase/mark-complete.ts \
  --task u-ut01-09-retry-and-offset-policy-alignment \
  --phase 5 \
  --output outputs/phase-05/ut09-handover-runbook.md
```

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物が `outputs/phase-05/ut09-handover-runbook.md` に配置済み
- 反映対象ファイル列が Phase 2 採択値と diff ゼロ
- production migration apply に人手承認が必須化されている
- 本タスクでコード変更を一切行わないことが明記されている

## 次 Phase への引き渡し

- 次 Phase: 6 (失敗ケース整理)
- 引き継ぎ事項:
  - Step B / D の例外パス → failure-cases.md の入力
  - 過渡期 R1 対策の残存リスク → failure-cases.md の「canonical 採択後リスク」節
  - AC ↔ UT-09 申し送り表 → Phase 7 AC マトリクスの拡張入力
- ブロック条件:
  - 反映対象ファイル列に欠落
  - Step A〜F の順序が backward incompatible 影響を考慮していない
  - 過渡期運用ルール未記述
