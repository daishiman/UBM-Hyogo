# タスク仕様書: Issue #548 — Cloudflare Audit Logs 異常検知 ML モデル選定 (FU-03-C)

[実装区分: 実装仕様書]

判定根拠: 本タスクは複数 ML 分類器候補（Isolation Forest / XGBoost / Cloudflare Workers AI）の実装と offline replay harness の拡張、評価メトリクス JSON 生成、model selection report の生成を伴うため、コード変更が不可欠。CONST_004 デフォルトに従い実装仕様書として作成する。Issue #548 は CLOSED 状態だがユーザー指示により close 操作は行わず `Refs #548` で連携する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-548-ml-model-selection |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/548 |
| 親タスク (#515) | `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/` |
| 親 spec | `docs/30-workflows/completed-tasks/issue-515-ml-model-selection.md` |
| 親実装ガイド | `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/outputs/phase-12/implementation-guide.md` |
| 配置先 | `docs/30-workflows/issue-548-ml-model-selection/` |
| 作成日 | 2026-05-08 |
| 状態 | implemented_synthetic |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 優先度 | LOW（issue label `priority:low` 想定） |
| Wave | follow-up C（FU-03-A の Gate-A/B/C 判定完了 + FU-03-B dataset 完成後） |
| 想定 PR 数 | 1+（本サイクル: comparison harness + selection criteria + classifier 契約調整 + focused tests + SSOT 同期。production switch over は FU-03-D で残す） |
| coverage AC | 適用外（scripts/cf-audit-log 配下スクリプト群。focused unit test を 5 ファイル追加） |

## 着手判断（前提 Gate）

本タスクは外部依存待ち（CONST_007 例外条件 1）に該当する。本仕様書は今サイクルで完結させるが、**実装の実行（comparison harness の本番 dataset 実行）は以下の前提が満たされて初めて意味を持つ**:

- 前提 1: FU-03-A (#546) の Gate-A/B/C 判定完了（90 日 baseline 評価済み）
- 前提 2: FU-03-B の redacted 90 日 dataset 完成（`tests/fixtures/cf-audit/labeled-90day.jsonl` の本番 export 版）
- 前提 3: 親 #515 で導入済みの `Classifier` interface / `ThresholdClassifier` / `extractFeatures` / `secret-leakage-grep.ts` がそのまま再利用可能であること

本サイクル内で完了させるスコープは、Issue #548 の classifier 実装、synthetic comparison harness evidence、SSOT 同期である。Synthetic 90 日相当 fixture は harness smoke evidence として使うが、production winner の根拠にはしない。本番 dataset 接続および production switch over は `outputs/phase-12/unassigned-task-detection.md` で FU-03-D として残す。

## 先送り理由（CONST_007 整合）

- **production env での classifier 切替**は FU-03-D 別タスクとして既存 `docs/30-workflows/unassigned-task/` で管理されている前提のため、本サイクルで扱わない。理由は (1) 本サイクル単位のスコープを「モデル選定の意思決定材料を揃える」に閉じることで PR を小さく保つ、(2) production 切替は post-switch 7 日観測 / rollback 訓練を含むため runtime gate が独立して必要、(3) 親 #515 の Gate decision table が「production ML 切替は別 PR」と既に規定済み。
- **本番 90 日 dataset の実取得**は FU-03-B のスコープであり、本タスクは synthetic fixture（同 schema）で comparison harness を完成させる。FU-03-B の output が揃った段階で同 harness を本番 dataset に流し直すだけで model selection が完了する設計。

## 目的

親 #515 で導入された `Classifier` interface に準拠した 3 つの新 classifier 実装（`IsolationForestClassifier` / `XGBoostClassifier` / `WorkersAIClassifier`）と、4 classifier (threshold + 3 ML) を同一 dataset に流して precision / recall / FP / FN / FP rate / FN rate / fallback rate / latency p50/p95 を比較する `model-comparison.ts`、選定基準に基づき winner を自動決定する `selection-criteria.ts` を提供する。fallback rate と latency 制約を含む選定ロジックを CI 可能な JSON + Markdown 形式で出力し、Gate 通過後の production switch を「設定変更のみ」で完了できる状態にする。

## scope in / scope out

### scope in（今サイクルで実装・検証）

- `scripts/cf-audit-log/classifier/isolation-forest.ts` 新規: Isolation Forest 実装（pure TS / 軽量実装、tree ensemble の anomaly score を `[0,1]` に正規化）。`Classifier` interface 準拠
- `scripts/cf-audit-log/classifier/xgboost.ts` 新規: XGBoost classifier wrapper。Pre-trained model artifact (JSON) を読み込み inference 実行（onnx / json-tree-export を decision path 形式で読み取る軽量推論）
- `scripts/cf-audit-log/classifier/workers-ai.ts` 新規: Cloudflare Workers AI 経由の anomaly scoring wrapper（fetch ベース、`CF_AUDIT_WORKERS_AI_URL` / `CF_AUDIT_WORKERS_AI_TOKEN` env、quota エラー時 fallback）
- `scripts/cf-audit-log/classifier/index.ts` 編集: factory に `isolation-forest` / `xgboost` / `workers-ai` を追加（`CF_AUDIT_CLASSIFIER` 拡張、未知値は threshold へ fallback）
- `scripts/cf-audit-log/cli-args.ts` 編集: `--compare-models=<dataset.jsonl>` / `--training-output=<model.json>` フラグ追加
- `scripts/cf-audit-log/evaluation/model-comparison.ts` 新規: 4 classifier (threshold + 3 ML) を同一 redacted dataset に流し、precision / recall / FP / FN / FP rate / FN rate / fallback rate / latency p50/p95 を比較し JSON + Markdown report を出力
- `scripts/cf-audit-log/evaluation/selection-criteria.ts` 新規: 選定基準（precision ≥ baseline + 5pt / recall ≥ baseline / fallback rate ≤ 1% / latency p95 ≤ 500ms）の判定ロジック。同点時は precision 優先、次点で latency 昇順
- `scripts/cf-audit-log/evaluation/training/train-isolation-forest.ts` 新規: Isolation Forest 学習スクリプト（redacted dataset → model artifact JSON）
- `scripts/cf-audit-log/evaluation/training/train-xgboost.ts` 新規: XGBoost 学習スクリプト（offline 実行・成果物 JSON）。本サイクルでは fixture 学習までを serialize。本番学習は別タスク
- 単体テスト一式:
  - `scripts/cf-audit-log/__tests__/classifier-isolation-forest.test.ts`
  - `scripts/cf-audit-log/__tests__/classifier-xgboost.test.ts`
  - `scripts/cf-audit-log/__tests__/classifier-workers-ai.test.ts`
  - `scripts/cf-audit-log/__tests__/model-comparison.test.ts`
  - `scripts/cf-audit-log/__tests__/selection-criteria.test.ts`
- fixture:
  - `tests/fixtures/cf-audit/labeled-90day.jsonl`（synthetic 90 日相当 labeled dataset、FU-03-B output と同 schema）
  - `tests/fixtures/cf-audit/model-isolation-forest.json`（学習済み artifact 例）
  - `tests/fixtures/cf-audit/model-xgboost.json`（学習済み artifact 例）
  - `tests/fixtures/cf-audit/comparison-baseline-result.json`（baseline 比較結果 snapshot）
- 評価レポート出力:
  - `outputs/phase-11/model-comparison-report.md`
  - `outputs/phase-11/comparison-metrics.json`
- 今サイクルの SSOT 同期:
  - `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`（model selection 結果と選定基準の正本化）
  - `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`（選定モデルの runbook 追記）

### scope out（本サイクルでは扱わない）

- production env での classifier 切替（FU-03-D 別タスクで管理）
- 本番 90 日 dataset の実抽出（FU-03-B 別タスク）
- D1 schema 変更（親 #515 で完了済み）
- Slack / メール alerting 拡張
- 学習済みモデル artifact の永続配布経路（R2 / Workers AI binding 等の本番運用）

## 不変条件・正本仕様との整合

- 不変条件 #1（実フォーム schema をコードに固定しすぎない）と独立（cf_audit_log のみ対象）
- 不変条件 #5（admin-managed data の audit 完備）: classifier_used / classifier_version / confidence は親 #515 で追加済みカラムを再利用
- セキュリティ: raw IP / full UA / Token id / actor_email 生値を学習・推論・評価ログのどこにも残さない。親 #515 の `secret-leakage-grep.ts` を **training output / comparison report 双方** に対して exit 0 ゲートとして再利用
- 親 #515 の `Classifier` interface（`classify(input: ClassifierInput): SeverityResult | null`）と完全互換

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `scripts/cf-audit-log/classifier/types.ts`（親 #515） | Classifier interface の正本 |
| 上流 | `scripts/cf-audit-log/classifier/threshold.ts`（親 #515） | fallback 先 / baseline 比較対象 |
| 上流 | `scripts/cf-audit-log/features/extract.ts`（親 #515） | 入力 feature の正本 |
| 上流 | `scripts/cf-audit-log/evaluation/offline-replay.ts`（親 #515） | comparison harness の拡張元 |
| 上流 | `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts`（親 #515） | leakage grep の再利用 |
| 上流 | FU-03-A (#546) Gate-A/B/C 判定 | 着手前提（本サイクル仕様策定とは独立） |
| 上流 | FU-03-B redacted 90 日 dataset | 本番 comparison 実行の前提（synthetic fixture で本サイクル代替） |
| 関連 | aiworkflow-requirements observability-monitoring / 15-infrastructure-runbook | SSOT 同期先 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/index.md | 親タスク仕様 |
| 必須 | docs/30-workflows/completed-tasks/issue-515-ml-model-selection.md | 親 spec |
| 必須 | docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/outputs/phase-12/implementation-guide.md | 親実装ガイド |
| 必須 | scripts/cf-audit-log/classifier/types.ts | interface 正本 |
| 必須 | scripts/cf-audit-log/classifier/threshold.ts | baseline / fallback |
| 必須 | scripts/cf-audit-log/features/extract.ts | feature 抽出正本 |
| 必須 | scripts/cf-audit-log/evaluation/offline-replay.ts | replay 拡張元 |
| 必須 | scripts/cf-audit-log/evaluation/secret-leakage-grep.ts | leakage grep |
| 参考 | .claude/skills/aiworkflow-requirements/references/observability-monitoring.md | SSOT 同期先 |
| 参考 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | runbook 同期先 |

## AC（Acceptance Criteria）

- AC-1: 3 つの新 Classifier (`IsolationForestClassifier` / `XGBoostClassifier` / `WorkersAIClassifier`) が `Classifier` interface に準拠して export されている
- AC-2: 各 classifier は model artifact ロード失敗時 `ThresholdClassifier` へ fallback し、unit test で検証される
- AC-3: `model-comparison.ts` が 4 classifier (threshold + 3 ML) を同一 dataset に流し、precision / recall / FP / FN / FP rate / FN rate / fallback rate / latency p50/p95 を JSON + Markdown で出力する
- AC-4: `selection-criteria.ts` が選定基準（precision ≥ baseline + 5pt / recall ≥ baseline / fallback rate ≤ 1% / latency p95 ≤ 500ms）に基づき winner を決定。同点時は precision 優先、次点で latency 昇順
- AC-5: training スクリプト 2 本（`train-isolation-forest.ts` / `train-xgboost.ts`）が redacted JSONL dataset から model artifact JSON を生成。生成された artifact に raw IP / Token / UA / email が含まれないことを `secret-leakage-grep.ts` で検証
- AC-6: factory に新 candidate 追加。`CF_AUDIT_CLASSIFIER=isolation-forest|xgboost|workers-ai` で切替可能だが、本サイクルでは production 既定値は `threshold` のまま
- AC-7: focused Vitest 5 ファイル + fixture すべて pass
- AC-8: comparison report が `outputs/phase-11/model-comparison-report.md` および `outputs/phase-11/comparison-metrics.json` に実体として出力されている。synthetic winner は production winner として扱わない
- AC-9: SSOT 2 ファイル（observability-monitoring / 15-infrastructure-runbook）に候補、選定基準、promotion 手順、synthetic vs production dataset 境界が反映されている。production winner は未記録
- AC-10: Phase 12 の 7 必須ファイル全て存在。FU-03-D production switch 未タスクが起票されている
- AC-11: `pnpm typecheck` / `pnpm lint` exit 0
- AC-12: secret leakage grep が training 出力 / comparison report に対し exit 0

## 実装ファイル一覧（抜粋・Phase 5/6 で詳細確定）

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `scripts/cf-audit-log/classifier/isolation-forest.ts` | 新規 | Isolation Forest classifier |
| `scripts/cf-audit-log/classifier/xgboost.ts` | 新規 | XGBoost classifier wrapper |
| `scripts/cf-audit-log/classifier/workers-ai.ts` | 新規 | Workers AI classifier wrapper |
| `scripts/cf-audit-log/classifier/index.ts` | 編集 | factory 拡張 |
| `scripts/cf-audit-log/cli-args.ts` | 編集 | `--compare-models` / `--training-output` flag |
| `scripts/cf-audit-log/evaluation/model-comparison.ts` | 新規 | 4 classifier 比較 harness |
| `scripts/cf-audit-log/evaluation/selection-criteria.ts` | 新規 | winner 自動判定 |
| `scripts/cf-audit-log/evaluation/training/train-isolation-forest.ts` | 新規 | IF 学習スクリプト |
| `scripts/cf-audit-log/evaluation/training/train-xgboost.ts` | 新規 | XGBoost 学習スクリプト |
| `scripts/cf-audit-log/__tests__/classifier-isolation-forest.test.ts` | 新規 | unit |
| `scripts/cf-audit-log/__tests__/classifier-xgboost.test.ts` | 新規 | unit |
| `scripts/cf-audit-log/__tests__/classifier-workers-ai.test.ts` | 新規 | unit |
| `scripts/cf-audit-log/__tests__/model-comparison.test.ts` | 新規 | fixture |
| `scripts/cf-audit-log/__tests__/selection-criteria.test.ts` | 新規 | unit |
| `tests/fixtures/cf-audit/labeled-90day.jsonl` | 新規 | synthetic 90 日 dataset |
| `tests/fixtures/cf-audit/model-isolation-forest.json` | 新規 | 学習済み artifact 例 |
| `tests/fixtures/cf-audit/model-xgboost.json` | 新規 | 学習済み artifact 例 |
| `tests/fixtures/cf-audit/comparison-baseline-result.json` | 新規 | baseline snapshot |
| `outputs/phase-11/model-comparison-report.md` | 新規 | 比較 Markdown |
| `outputs/phase-11/comparison-metrics.json` | 新規 | 比較 JSON |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 編集 | 選定モデル SSOT 追記 |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 編集 | runbook 追記 |

## Phase 一覧

| Phase | 名称 | 出力 |
| --- | --- | --- |
| 1 | 要件定義 / Gate 整理 / 真の論点（着手 Gate / 選定基準 / モデル候補数） | phase-01.md |
| 2 | 既存実装調査（親 #515 classifier interface / evaluation harness / features schema） | phase-02.md |
| 3 | 設計（3 モデル候補の実装方針 / comparison harness / selection criteria 構造） | phase-03.md |
| 4 | I/O 契約（Classifier interface 準拠 / training script I/O / report schema） | phase-04.md |
| 5 | データモデル（model artifact JSON schema / comparison metrics schema / selection criteria schema） | phase-05.md |
| 6 | 関数シグネチャと擬似コード（各 classifier / training / comparison / selection） | phase-06.md |
| 7 | 整合性検証（親 #515 SSOT / FU-03-A 着手 gate / FU-03-B dataset 契約） | phase-07.md |
| 8 | エラーハンドリング（モデルロード失敗 → threshold fallback / Workers AI quota / training data 不足） | phase-08.md |
| 9 | テスト計画（unit × 5 / fixture / leakage / latency benchmark） | phase-09.md |
| 10 | デプロイ / モデル artifact 配置 / workflow env 追加 / rollback | phase-10.md |
| 11 | 実行 evidence（typecheck / lint / focused test / 比較レポート JSON / Markdown） | outputs/phase-11/main.md |
| 12 | 実装ガイド・未タスク（FU-03-D production switch を残）・SSOT 同期・skill feedback | outputs/phase-12/* |
| 13 | PR 作成（`Refs #548`、close 操作なし） | outputs/phase-13/main.md |

各 Phase 詳細は `phase-NN.md` を参照:

- [Phase 1](phase-01.md) ・ [Phase 2](phase-02.md) ・ [Phase 3](phase-03.md) ・ [Phase 4](phase-04.md) ・ [Phase 5](phase-05.md) ・ [Phase 6](phase-06.md) ・ [Phase 7](phase-07.md)
- [Phase 8](phase-08.md) ・ [Phase 9](phase-09.md) ・ [Phase 10](phase-10.md) ・ [Phase 11](phase-11.md) ・ [Phase 12](phase-12.md) ・ [Phase 13](phase-13.md)

## DoD（Definition of Done・全 Phase 共通）

- [x] AC-1〜AC-12 のうち production dataset / production switch を除く evidence が `outputs/phase-11/` 配下に保存されている。`outputs/phase-11/main.md` は `IMPLEMENTATION_PASS_SYNTHETIC`
- [x] focused Vitest 5 ファイル（classifier-isolation-forest / classifier-xgboost / classifier-workers-ai / model-comparison / selection-criteria）すべて pass
- [x] 3 ML classifier いずれも model artifact/config 欠如時 `ThresholdClassifier` fallback が test または comparison fallbackRate で確認されている
- [x] secret leakage grep が training output / comparison report 双方で exit 0
- [x] `outputs/phase-11/model-comparison-report.md` と `outputs/phase-11/comparison-metrics.json` が実体存在
- [x] SSOT 2 ファイル（observability-monitoring / 15-infrastructure-runbook）が候補・基準・promotion 境界として更新されている
- [x] Phase 12 の 7 必須ファイルが `outputs/phase-12/` に実体として存在する
- [x] FU-03-D production switch 未タスクが `docs/30-workflows/unassigned-task/` 配下に起票されている
- [ ] PR 本文に `Refs #548` を含み、issue は閉じない（`Closes` を使わない）
- [ ] PR 本文に `Refs #548` を含み、issue は閉じない（`Closes` を使わない）
