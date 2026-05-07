# タスク仕様書: Issue #515 — Cloudflare Audit Logs 異常検知の ML-ready 化

[実装区分: 実装仕様書]

判定根拠: 本タスクの目的は、親タスク Issue #408（Cloudflare Audit Logs 監視, `scripts/cf-audit-log/analyze.ts` の HIGH/MEDIUM/LOW 閾値判定）の運用を踏まえ、誤検知率と運用コストを評価したうえで **異常検知ロジックを ML ベース判定へ置換可能にする** ことである。これは `scripts/cf-audit-log/` 配下のコード変更（feature extractor 追加 / offline evaluation harness 追加 / 新 classifier モジュール / `analyze.ts` の classifier 注入 / rollback flag）と、関連 D1 schema のメタデータ拡張、`.github/workflows/cf-audit-log-monitor.yml` の env 拡張、SSOT 同期を伴うため、CONST_004 のデフォルトに従い実装仕様書として作成する。Issue #515 は本ワークツリー作成時点では `OPEN` だが、ユーザー指示「クローズドのままタスク仕様書を作成する」に従い open/close 操作は行わず `Refs #515` で連携する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-515-cf-audit-logs-ml-anomaly |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/515 |
| 起票元 unassigned-task | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-03-ml-anomaly.md` |
| 親タスク | `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/` |
| 配置先 | `docs/30-workflows/issue-515-cf-audit-logs-ml-anomaly/` |
| 作成日 | 2026-05-07 |
| 状態 | implemented_local_runtime_pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 優先度 | LOW（issue label `priority:low`） |
| Wave | follow-up（Issue #408 の閾値判定 90 日運用後） |
| 想定 PR 数 | 1（本サイクル: 仕様書 + classifier interface + offline evaluation harness + redacted feature extractor + threshold rollback flag。学習済みモデルそのもの・production switch over・90 日 baseline runtime 観測は外部依存 gate として残す） |
| coverage AC | 適用外（scripts/cf-audit-log 配下スクリプト群。focused unit test / fixture-based offline evaluation test を追加） |

## 着手判断（着手 gate / runtime 待ち）

本タスクは外部運用観測待ち（CONST_007 例外条件 1: 外部依存待ち）に該当する。仕様書策定は今サイクルで完結させるが、**実装の本番切替（threshold → ML）は以下の gate を通過するまで実行しない**:

- Gate-A: Issue #408 閾値運用が **連続 90 日以上安定** していること
- Gate-B: 同期間の **誤検知率 ≤ 5%** が維持されていること
- Gate-C: 閾値チューニングコストが **月 4h 以上** に達していること
- Gate-D（Gate-A〜C のいずれか不成立時）: まず baseline 学習期間を 7 日 → 30〜90 日に延長して閾値を再調整し、それでも誤検知率が下がらない場合のみ ML 化に進む

本サイクル内で実装可能なスコープ（後述「scope in」）は gate と独立に実施する。Gate 通過後の追加作業（90 日観測、学習データの実取得、モデル学習、本番切替）は外部依存待ちのため `outputs/phase-12/unassigned-task-detection.md` で別タスクとして起票する。

## Gate decision table

| 判定状態 | 条件 | 今回サイクルの扱い | 次アクション |
| --- | --- | --- | --- |
| threshold 継続 | false positive rate が 5% 以下、かつ tuning cost が月 4h 未満 | ML 本番切替しない | 現行 threshold を継続 |
| threshold 再調整 | false positive rate が 5% 超、かつ 7 日 baseline のまま | ML 本番切替しない | baseline を 30〜90 日へ延長し再評価 |
| ML 比較開始 | 90 日運用 evidence があり、false positive rate が 5% 超、または tuning cost が月 4h 以上 | redacted feature export / offline replay で比較可能にする | Gate 後 follow-up でモデル学習 |
| production ML 切替 | offline replay で threshold より precision / recall が改善し、fallback rate と rollback 手順が承認済み | 今回は実行しない | 別 PR で production apply + env 切替 |
| rollback | ML fallback rate 上昇、または false positive / false negative が悪化 | `CF_AUDIT_CLASSIFIER=threshold` へ戻す | D1 追加列は残す forward-safe rollback |
 
## state model

| state | 意味 | Phase 11 evidence |
| --- | --- | --- |
| `spec_created` | 仕様書と本サイクル実装方針を作成済み | runtime apply は未実施でもよい |
| `implemented_local_runtime_pending` | local code / tests / SSOT 同期が完了 | typecheck / lint / focused test / replay / leakage grep |
| `pass_boundary_synced_runtime_pending` | staging apply まで完了、production apply / ML switch は Gate 後 | staging migration list / PRAGMA |

## 目的

`analyze.ts` の HIGH/MEDIUM/LOW 判定を「`Classifier` interface 経由」に抽象化し、(1) 既存 threshold classifier、(2) 新 ML classifier、を実行時 env で切替可能にする。同時に redacted feature extractor、offline evaluation harness、precision/recall/FP/FN 計測スクリプトを整備し、Gate 通過後は学習済みモデルを差し込むだけで切替できる構造にする。secret leakage（Token / IP / UA 生値）が学習データ・モデル・log のどこにも残らないことを test で保証する。

## scope in / scope out

### scope in（今サイクル実装）

- `scripts/cf-audit-log/classifier/types.ts` 新規: `Classifier` interface（`classify(event): SeverityResult`）
- `scripts/cf-audit-log/classifier/threshold.ts` 新規: 既存 `severity-classifier.ts` ロジックを `Classifier` 実装にラップ（rollback path）
- `scripts/cf-audit-log/classifier/ml.ts` 新規: `MLClassifier` skeleton（モデル未ロード時は `threshold` に fallback。`ML_MODEL_PATH` は Gate 後の model artifact 配布タスクで本格利用）
- `scripts/cf-audit-log/features/extract.ts` 新規: redacted feature 抽出（IP /24 bucket、hour-of-day、action category、status_class、actor_role hash、no raw token / no full IP / no full UA）
- `scripts/cf-audit-log/features/schema.ts` 新規: feature の TypeScript 型 + JSON schema（学習データ契約の正本）
- `scripts/cf-audit-log/evaluation/offline-replay.ts` 新規: 過去 redacted dataset を `Classifier` に流し precision/recall/FP/FN を計測
- `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` 新規: 出力 dataset / log に Token/IP/UA 生値が含まれないことを grep で検証
- `scripts/cf-audit-log/analyze.ts` 編集: classifier 取得を `getClassifier(env)` 経由に差替え。`CF_AUDIT_CLASSIFIER` env (`threshold` | `ml`) で切替、未指定時 `threshold`
- `scripts/cf-audit-log/cli-args.ts` 編集: `--classifier=threshold|ml` / `--evaluate=<dataset.jsonl>` / `--export-features=<out.jsonl>` フラグ追加
- `apps/api/migrations/0016_cf_audit_log_classification.sql` 新規: `cf_audit_log` に `classifier_used TEXT NOT NULL DEFAULT 'threshold'` / `classifier_version TEXT` / `confidence REAL` カラム追加（forward-safe rollback / 3-gate 分離適用）
- `.github/workflows/cf-audit-log-monitor.yml` 編集: `CF_AUDIT_CLASSIFIER` / `ML_MODEL_PATH` env を渡せるように。既定値は `threshold`。`ML_MODEL_PATH` の production 値設定は Gate 後
- 単体テスト: 上記新規ファイルそれぞれに focused Vitest を追加（`scripts/cf-audit-log/__tests__/classifier-*.test.ts` 等）
- fixture-based offline evaluation test: redacted synthetic dataset を `tests/fixtures/cf-audit/` 配下に追加
- SSOT 同期:
  - `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`（classifier interface / rollback / Gate 条件）
  - `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（`CF_AUDIT_CLASSIFIER` / `ML_MODEL_PATH` env の取り扱い）
  - `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`（rollback runbook）

### scope out（本サイクルでは扱わない・gate 通過後）

- 学習データの本番取得（90 日 baseline 運用待ち / Gate-A〜C）
- ML モデルの学習・選定（XGBoost / Isolation Forest / Cloudflare Workers AI 等の比較は別タスク）
- 学習済みモデル artifact の配布経路（R2 / Workers AI binding 等）
- production での classifier 切替（`CF_AUDIT_CLASSIFIER=ml` の本番切替は Gate 通過後の別 PR）
- Slack / メール alerting 拡張（親 Issue #408 と同様 GitHub Issue 起票のみ）
- Audit Logs を外部 SIEM へ出すバルクエクスポート

## 不変条件・正本仕様との整合

- 不変条件 #1（実フォーム schema をコードに固定しすぎない）と独立（cf_audit_log のみ対象）
- 不変条件 #5（admin-managed data の audit 完備）: classifier_used / classifier_version / confidence を追加することで判定根拠を audit 可能に
- セキュリティ: raw IP / full UA / Token id を学習データに含めない（features/extract.ts で redaction 実施 + secret-leakage-grep で検証）
- 親 Issue #408 の `analyze.ts` 既存出力（GitHub Issue 起票）との後方互換: classifier 切替で issue 形式が変わらないこと（threshold rollback で完全互換）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `scripts/cf-audit-log/severity-classifier.ts` | threshold ロジックの正本（ラップ対象） |
| 上流 | `scripts/cf-audit-log/types.ts` | event / severity 型の正本 |
| 上流 | `apps/api/migrations/0014_create_cf_audit_log.sql` | classifier カラム追加対象テーブル |
| 上流 | `.github/workflows/cf-audit-log-monitor.yml` | env 渡しの編集対象 |
| 上流 | 親タスク Issue #408（CLOSED） | 閾値判定 baseline の正本 |
| 関連 | aiworkflow-requirements observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook | SSOT 同期先 |
| external | Gate-A〜C 通過（90 日以上の運用観測） | 本番切替の前提（仕様書策定とは独立） |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-03-ml-anomaly.md | 元 unassigned-task 正本 |
| 必須 | docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/index.md | 親タスク仕様 |
| 必須 | docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/outputs/phase-12/implementation-guide.md | 親タスク実装ガイド |
| 必須 | scripts/cf-audit-log/analyze.ts | 改修対象（classifier 注入） |
| 必須 | scripts/cf-audit-log/severity-classifier.ts | rollback 元 / threshold 正本 |
| 必須 | scripts/cf-audit-log/types.ts | 型の正本 |
| 必須 | scripts/cf-audit-log/baseline.ts | baseline 拡張時の参照 |
| 必須 | apps/api/migrations/0014_create_cf_audit_log.sql | 後続 migration 番号確定の参照 |
| 必須 | .github/workflows/cf-audit-log-monitor.yml | env 拡張対象 |
| 参考 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #5 |
| 参考 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | rollback runbook 同期先 |
| 参考 | .claude/skills/aiworkflow-requirements/references/observability-monitoring.md | SSOT 同期先 |

## AC（Acceptance Criteria）

- AC-1: `Classifier` interface（`classify(input: ClassifierInput): SeverityResult | null`、`null` は `NONE` 相当、`reason` は既存 classifier 互換の `string`）が `scripts/cf-audit-log/classifier/types.ts` で export されている。
- AC-2: `ThresholdClassifier`（`scripts/cf-audit-log/classifier/threshold.ts`）が既存 `severity-classifier.ts` のロジックを 100% 互換でラップし、focused test の入出力が既存テストと一致する。
- AC-3: `MLClassifier`（`scripts/cf-audit-log/classifier/ml.ts`）は skeleton のため、`ML_MODEL_PATH` の有無にかかわらず `ThresholdClassifier` へ fallback し、その挙動が unit test で検証されている。
- AC-4: `extractFeatures(event)` が `redactedFeatures` を返し、戻り値に raw IP / full UA / Token id / actor_email 生値が **存在しない** ことを `secret-leakage-grep.ts` ベースの test で検証している。
- AC-5: `analyze.ts` が `getClassifier(env)` 経由に差替えられ、`CF_AUDIT_CLASSIFIER=threshold`（既定）/ `=ml` で切替できる。`CF_AUDIT_CLASSIFIER` 未指定時は threshold で動作し、本番互換が保たれる。
- AC-6: D1 migration `0016_cf_audit_log_classification.sql` が `cf_audit_log` に `classifier_used` / `classifier_version` / `confidence` カラムを追加し、forward-safe rollback note を記載する。staging apply / destructive DOWN は user-gated runtime task として分離する。
- AC-7: `evaluation/offline-replay.ts` が labeled JSONL dataset を入力に precision / recall / FP / FN / FP rate / FN rate を JSON で出力し、`analyze.ts --export-features` が raw event fixture から redacted feature JSONL を生成できる。
- AC-8: `evaluation/secret-leakage-grep.ts` が、export された feature dataset / classifier log にて生 Token / 完全 IP / 完全 UA / メール生値が **検出された場合 exit 1** することを test で確認している。
- AC-9: `.github/workflows/cf-audit-log-monitor.yml` が `CF_AUDIT_CLASSIFIER` / `ML_MODEL_PATH` env を job step に渡し、未設定時は既定 `threshold` で動作する。
- AC-10: `pnpm typecheck` / `pnpm lint` / `pnpm --filter` 配下の cf-audit-log 関連 focused test がローカルで pass。
- AC-11: SSOT 3 ファイル（observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook）に classifier interface / Gate 条件 / rollback runbook が反映されている。
- AC-12: Phase 12 で本サイクル外（学習データ取得 / モデル学習 / 本番切替）が `outputs/phase-12/unassigned-task-detection.md` に未タスクとして起票される。

## 実装ファイル一覧（抜粋・Phase 5/6 で詳細確定）

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `scripts/cf-audit-log/classifier/types.ts` | 新規 | `Classifier` interface |
| `scripts/cf-audit-log/classifier/threshold.ts` | 新規 | 既存ロジックの wrap |
| `scripts/cf-audit-log/classifier/ml.ts` | 新規 | ML skeleton + fallback |
| `scripts/cf-audit-log/classifier/index.ts` | 新規 | `getClassifier(env)` factory |
| `scripts/cf-audit-log/features/extract.ts` | 新規 | redacted feature 抽出 |
| `scripts/cf-audit-log/features/schema.ts` | 新規 | feature schema (TS 型 + JSON schema) |
| `scripts/cf-audit-log/evaluation/offline-replay.ts` | 新規 | offline 評価ハーネス |
| `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | 新規 | secret 漏洩検出 |
| `scripts/cf-audit-log/analyze.ts` | 編集 | classifier 注入差替 |
| `scripts/cf-audit-log/cli-args.ts` | 編集 | フラグ追加 |
| `scripts/cf-audit-log/__tests__/classifier.test.ts` | 新規 | threshold wrap / factory / ML fallback test |
| `scripts/cf-audit-log/__tests__/features-extract.test.ts` | 新規 | redaction test |
| `scripts/cf-audit-log/__tests__/evaluation.test.ts` | 新規 | replay / secret grep test |
| `scripts/cf-audit-log/__tests__/issue-reporter.test.ts` | 編集 | classifier metadata body test |
| `apps/api/migrations/0016_cf_audit_log_classification.sql` | 新規 | classifier columns 追加 |
| `.github/workflows/cf-audit-log-monitor.yml` | 編集 | env 渡し追加 |
| `tests/fixtures/cf-audit/synthetic-anomaly.jsonl` | 新規 | 異常系 fixture |
| `tests/fixtures/cf-audit/analyze-fixture.json` | 新規 | analyze dry-run / feature export fixture |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 編集 | classifier 抽象化追記 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | env 追記 |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 編集 | rollback runbook 追記 |

## Phase 一覧

| Phase | 名称 | 出力 |
| --- | --- | --- |
| 1 | 要件定義 / Gate 整理 / 真の論点 | outputs/phase-01/main.md |
| 2 | 既存実装調査（analyze.ts / severity-classifier.ts / cf-audit-log scripts 全体） | outputs/phase-02/main.md |
| 3 | 設計（Classifier 抽象 / feature schema / evaluation 設計 / rollback） | outputs/phase-03/main.md |
| 4 | I/O 契約（Classifier interface / CLI フラグ / env / GitHub Issue 互換） | outputs/phase-04/main.md |
| 5 | データモデル / D1 migration / feature schema 確定 | outputs/phase-05/main.md |
| 6 | 関数シグネチャと擬似コード | outputs/phase-06/main.md |
| 7 | 整合性検証（親タスク #408 / SSOT / migration 既存番号） | outputs/phase-07/main.md |
| 8 | エラーハンドリング / fallback / secret leakage 防止 | outputs/phase-08/main.md |
| 9 | テスト計画（unit / fixture / offline replay / leakage grep） | outputs/phase-09/main.md |
| 10 | デプロイ / migration apply / workflow env 追加 / rollback 計画 | outputs/phase-10/main.md |
| 11 | 実行 evidence（NON_VISUAL: typecheck / lint / focused test / replay 出力） | outputs/phase-11/main.md |
| 12 | 実装ガイド・未タスク（学習データ・モデル学習・本番切替）・skill feedback | outputs/phase-12/* |
| 13 | PR 作成（`Refs #515`） | outputs/phase-13/main.md |

各 Phase 詳細は `phase-NN.md` を参照:

- [Phase 1](phase-01.md) ・ [Phase 2](phase-02.md) ・ [Phase 3](phase-03.md) ・ [Phase 4](phase-04.md) ・ [Phase 5](phase-05.md) ・ [Phase 6](phase-06.md) ・ [Phase 7](phase-07.md)
- [Phase 8](phase-08.md) ・ [Phase 9](phase-09.md) ・ [Phase 10](phase-10.md) ・ [Phase 11](phase-11.md) ・ [Phase 12](phase-12.md) ・ [Phase 13](phase-13.md)

## DoD（Definition of Done・全 Phase 共通）

- [ ] AC-1〜AC-12 すべての evidence が `outputs/phase-11/` 配下に保存されている。
- [ ] `pnpm typecheck` exit 0。
- [ ] `pnpm lint` exit 0。
- [ ] focused Vitest（classifier-threshold / classifier-ml-fallback / features-extract-redaction / evaluation-offline-replay / evaluation-secret-leakage）すべて pass。
- [ ] `CF_AUDIT_CLASSIFIER` 未指定時の `analyze.ts` 動作が threshold 互換であることが test で確認されている。
- [ ] secret leakage grep test が exit 1 を正しく返すケースで pass している。
- [ ] D1 migration UP / DOWN が staging 環境で apply 可能（production apply は実行しない）。
- [ ] SSOT 3 ファイル（observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook）が更新されている。
- [ ] Phase 12 の 7 必須ファイルが `outputs/phase-12/` に実体として存在する。
- [ ] PR 本文に `Refs #515` を含み、issue は閉じない（`Closes` を使わない）。
