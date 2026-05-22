# U-FIX-CF-ACCT-01-DERIV-04-FU-03-D: Production Classifier Switch

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01-DERIV-04-FU-03-D |
| 状態 | unassigned |
| 優先度 | LOW |
| 親 task | Issue #548 ML model selection SSOT（`references/workflow-issue-548-ml-model-selection-artifact-inventory.md` / `references/lessons-learned-issue-548-ml-model-selection-2026-05.md`） |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/548 |
| 関連 | Issue #581 canonical re-observation workflow（#546 Gate-A/B/C 再判定）、FU-03-B redacted 90-day dataset |
| 想定 PR 数 | 1（env switch + post-switch evidence + SSOT update） |
| visualEvidence | NON_VISUAL |
| coverage AC | 適用外（runtime evidence のみ） |

## 目的

Issue #548 で完成した `model-comparison.ts` / `selection-criteria.ts` を、**FU-03-B redacted 90-day production-equivalent dataset** に対して再実行し、winner classifier を production env (`CF_AUDIT_CLASSIFIER`) に投入する。post-switch 7 日観測と rollback 訓練を伴う production 切替を完遂し、SSOT に production winner を記録する。

## スコープ

### 含む

- FU-03-B 完了後 redacted 90-day dataset を入力とした `model-comparison.ts` 再実行
- 選定 winner の `CF_AUDIT_CLASSIFIER` production secret 投入（`bash scripts/cf.sh secret put`）
- model artifact (`CF_AUDIT_IF_MODEL` / `CF_AUDIT_XGB_MODEL`) または Workers AI binding (`CF_AUDIT_WORKERS_AI_URL` / `CF_AUDIT_WORKERS_AI_TOKEN`) の production 配置
- post-switch 7 日 runtime observation evidence（Cloudflare Analytics / cf-audit-log-monitor.yml run logs）
- rollback rehearsal: `CF_AUDIT_CLASSIFIER=threshold` への一段階切戻し検証
- SSOT 更新: `observability-monitoring.md` / `15-infrastructure-runbook.md` に production winner / 切替日 / observation period を追記

### 含まない

- 新たな classifier ファミリーの学習や追加（Issue #548 で完了した3候補のみ対象）
- D1 schema 変更（親 #515 で完了済み）
- raw audit-log retention 方針変更
- Workers AI quota / 予算追加申請（必要時は別 issue で起票）

## 着手判断（前提 Gate）

以下が全て満たされた段階で着手:

1. Issue #581 canonical re-observation workflow で #546 Gate-A/B/C 判定が完了し、threshold baseline が 90 日安定運用された
2. FU-03-B redacted 90-day dataset が `tests/fixtures/cf-audit/labeled-90day.jsonl` の本番 export 版として配置された
3. Issue #548 synthetic comparison が user により review 済みで、production 切替の意思決定が承認された
4. Workers AI を candidate に含める場合: `CF_AUDIT_WORKERS_AI_URL` / `CF_AUDIT_WORKERS_AI_TOKEN` の async gateway latency / quota / fallback rate evidence が揃っている

## 苦戦箇所（将来の課題解決のための知見）

Issue #548 サイクルで判明した、本タスク着手時に再発しやすい落とし穴を記録する。

### 1. Synthetic データでは production winner を確定できない

合成 720 行 fixture では `xgboost` が precision=1.0 を達成したが、これは fixture 生成時の anomaly pattern が tree split に過適合した結果。production dataset では distribution shift により precision が大幅に低下する可能性が高い。

**対策**: 必ず FU-03-B redacted 90-day production-equivalent dataset を使う。synthetic 結果は harness smoke evidence にのみ使い、winner 判定の根拠にしない。

### 2. Workers AI は sync comparison path で必ず fallback する

`Classifier.classify()` は同期インターフェースで、Issue #548 の `WorkersAIClassifier` は config 不在 / sync 呼び出し時に意図的に threshold へ fallback する設計（fallbackRate=1.0 として記録される）。

**対策**: Workers AI を winner 候補に残す場合、`classifyAsync()` 経由の async gateway evidence を別途取得すること。`model-comparison.ts` の sync path 結果だけで Workers AI を rejection しないこと。`CF_AUDIT_WORKERS_AI_URL` / `CF_AUDIT_WORKERS_AI_TOKEN` 設定下で async smoke を実行する。

### 3. Secret leakage grep を training output / comparison report 双方に必ず流す

Issue #548 では `datasetHash` を SHA-256 先頭 16 hex に短縮することで token-like パターンの誤検知を回避した。本タスクで model artifact JSON / comparison metrics JSON / Markdown report を再生成する際、同じ `secret-leakage-grep.ts` を 4 出力すべてに対して exit 0 で確認すること。

**対策**: `secret-leakage-grep.ts` を CI gate として統合済み。production switch PR では evidence として grep 結果も `outputs/phase-11/` に保存する。

### 4. Rollback パスは「設定変更のみ」で完結させる

production 切替時に D1 schema 変更や Worker code 再 deploy を伴う設計にすると、incident 時の rollback が長くなる。Issue #548 の factory 拡張は `CF_AUDIT_CLASSIFIER=threshold` を未知値 fallback としても機能させており、env 一発で復旧できる。

**対策**: 本タスクでも rollback は `bash scripts/cf.sh secret put CF_AUDIT_CLASSIFIER --env production` で `threshold` を再投入するだけで完了させる。code path 側に追加の guard を入れない。

### 5. production switch PR は post-switch evidence なしには merge しない

切替直後に false positive / fallback rate が跳ねるリスクがあるため、最低 7 日の Cloudflare Analytics / monitor workflow run logs を採取してから SSOT を更新する。observation 中に閾値超過があれば即 rollback。

**対策**: Phase 11 evidence に `outputs/phase-11/post-switch-7day-observation.md` を必須項目として追加する。observation 完了前の SSOT 更新を禁止する。

## リスクと対策

| Risk | Mitigation |
| --- | --- |
| Synthetic winner と production winner の乖離 | FU-03-B production-equivalent dataset で再 comparison を必須化 |
| Workers AI 選定時の async latency / quota drift | async gateway 経由で latency p95 / fallback rate / quota error rate を 7 日観測してから決定 |
| Classifier 投入後の false positive 急増 | post-switch 7 日 observation + threshold 即時 rollback 訓練を AC とする |
| Secret / raw data leakage in evidence | `secret-leakage-grep.ts` を 4 出力（model artifact / metrics / report / observation log）に exit 0 ゲート |
| Rollback 経路の複雑化 | production 切替を `CF_AUDIT_CLASSIFIER` env 変更のみで完結する設計を維持 |

## 検証方法

1. `model-comparison.ts` を FU-03-B production-equivalent dataset で実行し、`outputs/phase-11/comparison-metrics.json` / `model-comparison-report.md` を更新
2. `selection-criteria.ts` の出力で winner classifier を確認（precision ≥ baseline+5pt / recall ≥ baseline / fallbackRate ≤ 1% / latencyP95 ≤ 500ms ゲート）
3. Workers AI が candidate winner の場合: `classifyAsync()` 経由で `CF_AUDIT_WORKERS_AI_URL` / `CF_AUDIT_WORKERS_AI_TOKEN` 配下の async evidence（latency p95 / fallback rate / quota error rate）を採取
4. `bash scripts/cf.sh secret put CF_AUDIT_CLASSIFIER --env production` で winner を投入。model artifact 必要時は同手順で `CF_AUDIT_IF_MODEL` / `CF_AUDIT_XGB_MODEL` も投入
5. Rollback rehearsal: `CF_AUDIT_CLASSIFIER=threshold` を再投入し monitor workflow が threshold path に戻ることを確認
6. post-switch 7 日 runtime observation: Cloudflare Analytics と `cf-audit-log-monitor.yml` run logs から false positive rate / fallback rate / latency p95 を採取し `outputs/phase-11/post-switch-7day-observation.md` にまとめる
7. `secret-leakage-grep.ts` を model artifact / metrics / report / observation log の 4 出力に対して exit 0 で確認
8. SSOT 更新: `observability-monitoring.md` / `15-infrastructure-runbook.md` に production winner / 切替日 / observation summary を追記

## 不変条件・正本仕様との整合

- 親 #515 / #548 の `Classifier` interface（`classify(input: ClassifierInput): SeverityResult | null`）と互換性を維持
- raw IP / full UA / Token id / actor_email を model artifact / comparison report / observation log に残さない
- production secret 投入は `bash scripts/cf.sh secret put` 経由のみ。`wrangler` 直接呼び出し禁止（CLAUDE.md「Cloudflare 系 CLI 実行ルール」遵守）
- 平文 `.env` への winner / token 書き込み禁止。1Password 参照のみ

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/workflow-issue-548-ml-model-selection-artifact-inventory.md | Issue #548 model selection artifact inventory / successor trace |
| 必須 | .claude/skills/aiworkflow-requirements/references/lessons-learned-issue-548-ml-model-selection-2026-05.md | 実装サマリ・selection criteria / production dataset 境界 |
| 必須 | docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/outputs/phase-11/gate-decision.md | #546 Gate-A/B/C 再判定の canonical evidence |
| 必須 | scripts/cf-audit-log/evaluation/model-comparison.ts | comparison harness |
| 必須 | scripts/cf-audit-log/evaluation/selection-criteria.ts | winner 判定ロジック |
| 必須 | scripts/cf-audit-log/evaluation/secret-leakage-grep.ts | leakage gate |
| 必須 | scripts/cf.sh | Cloudflare secret put ラッパー |
| 参考 | .claude/skills/aiworkflow-requirements/references/observability-monitoring.md | SSOT 同期先 |
| 参考 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | runbook 同期先 |

## DoD（着手時に満たすべき条件）

- [ ] Issue #581 canonical re-observation workflow で #546 Gate-A/B/C 判定完了
- [ ] FU-03-B redacted 90-day dataset 配置完了
- [ ] FU-03-B dataset での `model-comparison.ts` 再実行 evidence
- [ ] `selection-criteria.ts` 出力で winner 確定（同点時は precision_desc → latencyP95_asc → fallbackRate_asc）
- [ ] Workers AI 候補時の async gateway evidence
- [ ] `CF_AUDIT_CLASSIFIER` production secret 投入完了
- [ ] rollback rehearsal evidence
- [ ] post-switch 7 日 observation evidence
- [ ] secret leakage grep が 4 出力に対し exit 0
- [ ] SSOT 2 ファイル更新（observability-monitoring / 15-infrastructure-runbook）
- [ ] PR 本文に `Refs #548` を含み、issue は閉じない
