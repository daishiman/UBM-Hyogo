---
name: lessons-learned-issue-587-cf-audit-ml-artifact-rotation-2026-05
description: Issue #587 Cloudflare audit log ML model artifact rotation の苦戦箇所と教訓。artifact rotation と training の責務分離、forward-safe rollback 不変条件、Gate-R0〜R3、4 段 rotation（candidate / canary / promotion / rollback）、redaction-check 運用、implemented_local_runtime_pending state boundary を扱う。
type: lessons-learned
---

# Lessons Learned — Issue #587 Cloudflare Audit Log ML Artifact Rotation（2026-05-10）

> task: `issue-587-cf-audit-ml-artifact-rotation`（unassigned `u-fix-cf-acct-01-deriv-04-fu-03-d-followup-02.md` から正式昇格、親 #549 production switch の deferred follow-up）
> 関連 SSOT: `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`、`.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`、`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
> 関連 reference: `references/task-workflow-active.md`（issue-587 行）、`indexes/quick-reference.md`、`indexes/resource-map.md`、`indexes/topic-map.md`、`indexes/keywords.json`
> 関連 source: `scripts/cf-audit-log/rotation/`、`.github/workflows/cf-audit-log-artifact-canary.yml`、`docs/30-workflows/runbooks/ml-model-artifact-rotation.md`

## 教訓一覧

### L-587-001: artifact rotation と次世代 model training は **責務分離**して別タスクに割り、本タスクは「rotation 経路」だけを担う

- **背景**: 親 #549 で production switch を完了した直後の follow-up（FU-03-D-FU-02）として「次世代 ML model 投入」が要件化されたが、これを 1 タスクで扱おうとすると (a) artifact 自体の再学習・データセット選定（model training）と、(b) artifact path を candidate → canary → promotion → rollback で安全に差し替える経路（rotation）が同居し、AC が 20 件以上になり Phase 11 evidence の boundary 解釈が崩れる。最終的に本タスク #587 は **rotation 経路のみ** に責務を絞り、artifact の再学習自体は `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-02-A`（次世代 ML model 学習・選定）として別 unassigned-task に切り出した。`MLClassifier` skeleton の interface（親 #515 由来 `Classifier`）は本タスクで一切変更しないことを Phase 12 implementation-guide.md に明記している。
- **教訓**: 「次世代モデル投入」のような複合タスクは Phase 1 で **training（モデルそのものを作る）** と **rotation（モデルを安全に差し替える）** を分離する。rotation 側は `Classifier` interface 不変・D1 schema 不変・hourly workflow env 不変を不変条件に固定し、training 側は AC を独立 Issue に切り出す。これを混ぜると Phase 5/6 の実装で「artifact 学習の precision tuning」と「promotion gate 設計」が同じ PR に乗り、レビュー困難・rollback 困難になる。
- **将来アクション**: `task-specification-creator` の責務分離テンプレに「ML 系タスクは training / rotation / evaluation の 3 軸で SRP 分割する」を追記候補。本タスクの `unassigned-task-detection.md` 由来の 4 件（FU-02-A 学習 / FU-02-B スケジューラ / FU-02-C 長期保管 / FU-02-D op vault lifecycle）は同じ分離原則を継承する。

### L-587-002: forward-safe rollback の不変条件は **「D1 列を消さない」+「previous artifact パスを保持する」** の 2 点で固定する

- **背景**: rotation の rollback は単純に「PROD artifact path を 1 個前に戻す」だけでは足りない。Issue #587 設計中に「promotion 後の hourly workflow が新 classifier_version を D1 に書き始めると、rollback 直後に旧 artifact では未知の version 列を参照することになる」「op vault に previous の値を残していないと rollback 自体が原理的に失敗する」の 2 つが論点化した。最終的に implementation-guide.md「forward-safe rollback の 1 step」に `op item edit ubm-hyogo-env --vault Employee CF_AUDIT_ML_MODEL_PATH_PROD=<previous の値>` の 1 行を canonical に固定し、(i) `classifier_used` / `classifier_version` / `confidence` の D1 列は削除しない、(ii) hourly workflow env (`CF_AUDIT_CLASSIFIER`) は変更しない、(iii) `..._PREVIOUS` op 参照は promotion 直前に旧値で更新する、を不変条件として `15-infrastructure-runbook.md` 冒頭に同 wave で追記した。
- **教訓**: artifact rotation の rollback runbook は **「破壊しない 2 点」=（a）D1 schema を絶対に消さない、（b）previous artifact パスを op vault に常時保持、を runbook 冒頭に明文化**する。1 step rollback コマンドは「envひとつを書き換えるだけ」で完結する形に縮約し、D1 migration / hourly workflow env 変更を rollback 経路に混ぜない。rollback で D1 列を消す設計を許すと、過去 7 日の hourly evidence が読めなくなり post-release 監査が失敗する。
- **将来アクション**: 同パターンは schema model / RAG index 等の他 artifact 系 rotation でも再利用可能。`task-specification-creator/references/phase-templates.md` の派生テンプレ候補（promote 判定済み）に「forward-safe rollback の 2 不変条件」を default 文として組み込む。

### L-587-003: rotation は **4 段モデル（candidate / canary / promotion / rollback）** を Phase 1 で固定し、各段の verdict 語彙と evidence path を表で確定する

- **背景**: 当初は「canary で OK だったら promote」の 2 段で書いていたが、Phase 5 実装中に「op vault に candidate を登録するタイミング」「leakage / load 失敗で candidate を破棄するタイミング」「rollback の trigger」が抜けていることが判明。最終的に **candidate / canary / promotion / rollback の 4 段** に分け、`RotationEvidence.phase: 'canary' | 'promotion' | 'rollback'` と `decision: 'promotion_pr_pending' | 'promotion_merged' | 'rollback_pr_pending' | 'rollback_merged' | 'candidate_discarded'` の語彙で固定した。canary verdict も `'candidate_pass' | 'candidate_fail_metrics' | 'candidate_fail_leakage' | 'candidate_fail_load'` の 4 値に閉じ、閾値表（`fallbackRate >= 0.05` / `p95 > baseline * 1.5` / `leakageHits > 0` / `precision/recall < baseline`）を implementation-guide.md に同居させた。
- **教訓**: artifact 系 rotation タスクは Phase 1 で **「段（state）× verdict 語彙 × evidence path」の 3 軸表**を必ず固定する。段を 2 段に縮約すると「fail のときに candidate を破棄するのか rollback に進むのか」が曖昧化し、Phase 11 evidence の `verdict` 値が同じ JSON で複数解釈される。閾値は数値で 4 つに閉じる（fallback / latency / leakage / metrics）。
- **将来アクション**: `task-specification-creator/references/phase-templates.md` に「4 段 rotation テンプレ（candidate / canary / promotion / rollback）」を promote 判定済みとして反映予定。canary workflow（`workflow_dispatch` + op 参照 input + evidence upload）も同テンプレに canary CLI / collector の実行例として組み込む。

### L-587-004: production promotion は **Gate-R0〜R3 + user approval 必須**化し、本サイクルは `implemented_local_runtime_pending` で閉じて `PASS` 単独表記を使わない

- **背景**: 本タスクは local fixture replay で canary を回し evidence を取得済みだが、production artifact promotion（実 op vault 値の差し替え + 実 hourly workflow への影響）は別承認サイクルに残す必要がある。Phase 12 strict 検証時に「local canary 19/19 pass + canary-dry-run.json 取得済」を素朴に `PASS` と書いてしまうと、production promotion がまだ未実行であることが overview から消えてしまう。最終的に **Gate-R0（candidate 登録承認）/ R1（canary 結果が閾値内）/ R2（latency と fallback 両方が閾値内）/ R3（runbook 上の rollback owner と previous artifact 両方が approval path に明記）** を user-gated とし、root state を `implemented_local_runtime_pending`、Phase 11 を `completed_local_evidence`、Phase 13 を `blocked_pending_user_approval` の 3 状態語彙に統一した。`PASS` / `verified` 単独表記は phase12-task-spec-compliance-check.md でも禁止し、総合判定は `implemented_local_runtime_pending close-out` と書いている。
- **教訓**: 「local fixture でテスト完了 + production runtime は user 承認後」という二重 boundary を持つタスクは、状態語彙を `implemented_local_runtime_pending` / `completed_local_evidence` / `blocked_pending_user_approval` の 3 値で統一し、`PASS` / `verified` 単独表記を全 phase で禁止する。production promotion の前提として **R0〜R3 の 4 gate と user approval を `RotationGate` 型 + runbook approval path で同時要求**する。これを怠ると、Phase 12 close-out で「もう production も終わった」と読み違えられ、Gate なしに promotion PR が出るリスクが残る。
- **将来アクション**: `aiworkflow-requirements` の Phase 12 compliance 判定ルールに「local + production の二重 boundary 時は `PASS` 単独表記禁止」を default として組み込む。`indexes/keywords.json` に `implemented_local_runtime_pending` / `Gate-R0` / `4 段 rotation` の trigger 語を追加済み。

### L-587-005: redaction-check は **artifact path（op-ref 形式）と op vault path 自体を grep gate に組み込み**、error message も sanitize する

- **背景**: rotation の canary 出力には candidate の op 参照（`op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_CANDIDATE` 等）と replay 結果メトリクスが乗る。Phase 11 evidence の `leakage-grep.log` で初期は IPv4 / email / UA / PAT / salt literal だけを pattern 化していたが、rotation では (i) artifact resolved-value（op で解決した実 path / token）、(ii) op vault 内部の他 field 値が誤って error message に紛れ込むケース、を検知できない。最終的に `runArtifactCanary` の `sanitizeError` に「error message に op reference 値が含まれた場合 `<redacted-op-ref>` に置換」を内蔵し、focused tests A6（resolved-value redaction）/ A7（error path redaction）で grep アサートした。`dataset-grep.log` も rotation tree / evidence dir / canary workflow の 3 範囲で実行している。
- **教訓**: rotation 系タスクの redaction gate は **(a) artifact op-ref literal、(b) op vault に登録された全 field 名、(c) error 経路の sanitize、(d) dataset（学習データ）grep の 4 軸**で構成する。Issue #516 で確立した「環境注入 secret は runtime literal で grep に渡す」原則を継承しつつ、artifact 系では「op で解決した resolved-value」が log に出ないことを focused test で必ずアサートする。`--no-exit-on-leakage` の様な escape hatch は **exit code のみ 0 化し、verdict は `candidate_fail_leakage` のまま JSON に保存**する設計に閉じる（promotion gate を素通りさせる用途には絶対に流用させない）。
- **将来アクション**: `references/observability-monitoring.md` の rotation telemetry セクションに「redaction-check 4 軸」を明記。op vault の field lifecycle（FU-02-D）が defer 起票されたため、rotation 時の redaction pattern 更新責務はその follow-up が継承する。

## promote / defer フォローアップ

| item | 判定 | 反映先 / 起票先 |
| --- | --- | --- |
| 4 段 rotation テンプレ化（candidate / canary / promotion / rollback） | promote | `.claude/skills/task-specification-creator/references/phase-templates.md`（実反映は別タスク） |
| canary workflow テンプレ化（`workflow_dispatch` + op 参照 input + evidence upload） | promote | 同上 |
| `observability-monitoring.md` に「rotation の 4 段」セクション追加 | promote（same-wave 反映済） | system-spec-update-summary.md Step 2 |
| forward-safe rollback 不変条件（D1 列削除禁止 / previous 保持）追記 | promote（same-wave 反映済） | `15-infrastructure-runbook.md` 冒頭 |
| op vault lifecycle 構造化（PROD → PREVIOUS への自動退避） | defer | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-02-d.md`（FU-02-D） |
| rotation evidence canonical path 予約フォーマット | defer | 親 #549 FU-04 と統合 |
| 次世代 ML model 学習・選定 | defer | FU-02-A（unassigned-task） |
| 自動 rotation スケジューラ（cron / scheduled workflow） | defer | FU-02-B（unassigned-task） |
| rotation evidence 長期保管（artifact retention 90 日 → R2 copy） | defer | FU-02-C（unassigned-task） |

## メタ

- workflow root: `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/`
- source unassigned: `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-02.md`（formalized_by_issue_587）
- parent: `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/`
- 上位親: `docs/30-workflows/completed-tasks/issue-515-...`（ML-ready abstraction、`Classifier` interface 由来）
- Phase-12 verdict: `implemented_local_runtime_pending` close-out（strict 7 outputs all 配置、local canary fixture replay 19/19 pass、production promotion は Gate-R0〜R3 + user approval pending）
- 同一 wave 同期完了日: 2026-05-10
- deferred follow-ups: FU-02-A 次世代 ML model 学習 / FU-02-B 自動 rotation スケジューラ / FU-02-C rotation evidence 長期保管 / FU-02-D op vault lifecycle 構造化 / 親 #549 FU-04 canonical path 予約統合
