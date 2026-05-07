# Lessons Learned — Issue #515 Cloudflare Audit Logs ML-ready Classifier (2026-05)

Issue #408 の threshold 監視を ML 切替せず、`Classifier` 抽象化と redacted feature export、offline replay、forward-safe rollback を導入した実装で得られた知見。
根拠は `scripts/cf-audit-log/classifier/**` / `scripts/cf-audit-log/features/**` / `scripts/cf-audit-log/evaluation/**` / `apps/api/migrations/0016_cf_audit_log_classification.sql` / `docs/30-workflows/issue-515-cf-audit-logs-ml-anomaly/outputs/phase-12/implementation-guide.md`。

---

## L-ISSUE515-001: ML-ready 化は「切替」ではなく「比較できる箱」を入れることに留める

### 現象
"ML 異常検知" を要件として受け取ると、ML 学習・production 切替まで一気通貫で実装したくなるが、90 日 baseline / redacted dataset / model artifact / approval が揃っていない段階で ML を本番化すると false positive 暴発と rollback 工数を抱える。

### 原因分析
threshold→ML の切替判断には ① false positive rate ≤ 5% の 90 日観測、② redacted feature dataset、③ offline replay 比較、④ rollback 承認の 4 件が必要。1 タスクで 4 件すべての外部時間条件を満たすことはできない。

### 採用解決策
本サイクルでは `Classifier` interface・threshold 既定・ML skeleton の threshold fallback・D1 metadata 列・GitHub Actions env のみを追加し、production 切替を Gate 後の別 PR に分離した。state model は `implemented_local_runtime_pending` を採用。`docs/30-workflows/unassigned-task/issue-515-{90day-baseline-observation,ml-model-selection,production-ml-switch,redacted-feature-export}.md` の 4 件で外部依存を formalize。

### 再利用ガイド
外部時間依存（観測期間・人間承認・dataset 蓄積）を含む実装タスクは、本サイクル成果と Gate 後成果を最初から分け、未タスクを Phase 12 で必ず起票する。`spec_created → implemented_local_runtime_pending → pass_boundary_synced_runtime_pending` の 3 段階を Phase 11 template に明示する（skill-feedback-report と同期）。

---

## L-ISSUE515-002: classifier は default 名前付き interface で固定し、env 既定値は安全側に倒す

### 現象
`CF_AUDIT_CLASSIFIER` 未指定時に ml にフォールバックすると、ML model artifact 未配布の環境で意図せず ML パスが通り、偽陽性や例外を本番で起こす。

### 原因分析
default は最小害（既存挙動の維持）に倒すべき。env が未設定の状態は staging 検証や CI を含むため、default ml を許すと「設定漏れ＝未学習 ML 起動」になる。

### 採用解決策
`scripts/cf-audit-log/classifier/index.ts` の resolver で `CF_AUDIT_CLASSIFIER` が `threshold` 以外でも model artifact が解決できない場合は threshold fallback を返し、`reason` に `ml-fallback-to-threshold` を残す。default を threshold に固定し、`ml` を選んでも skeleton は threshold を呼ぶ。

### 再利用ガイド
behaviour switch を env で扱うとき、default は既存挙動の維持に固定し、新挙動は明示指定 + 解決成功時のみ採用する。fallback の reason をログ・D1 metadata 双方に残す。

---

## L-ISSUE515-003: redaction boundary はストレージ層で分け、export は raw を持たない型から作る

### 現象
ML / evaluation / export を後付けで実装すると、便利さから raw IP・raw UA・actor email を feature dataset に流用しがちで、leakage 監査と rollback が困難になる。

### 原因分析
privileged source store (D1 `cf_audit_log`) と分析・export 層の責務が混在すると、redaction grep を後段に置くしかなくなり、leakage 検出が事後対応になる。

### 採用解決策
`scripts/cf-audit-log/features/schema.ts` で `RedactedFeatures` 型を raw 値を含まない形で定義し、`features/extract.ts` は D1 row → `RedactedFeatures` への単方向変換のみを担う。`evaluation/secret-leakage-grep.ts` を CI で走らせ、redacted dataset に raw token / email / full IP / UA が混入しないことを decisive に確認する。Issue / logs / evidence は redacted only。

### 再利用ガイド
セキュリティ系 dataset は「privileged store」「redacted projection」「evidence」の 3 層に分け、export 系は redacted projection 型からしか作れないようにする。leakage grep を fixture (clean / positive) 双方で持ち、CI 失敗で気付ける状態にする。

---

## L-ISSUE515-004: D1 マイグレーションは forward-safe を default、破壊的 DOWN は user-gated に分離

### 現象
classifier metadata 列 (`classifier_used` / `classifier_version` / `confidence`) を後で削除する DOWN SQL を migration に同梱すると、rollback 時に過去観測の証跡が消え、threshold→ml 比較根拠が失われる。

### 原因分析
監視データは時系列の継続性が価値の核。schema 互換を保ったまま「列追加・default 値 NULL・既存 read 互換」で進めれば、`CF_AUDIT_CLASSIFIER=threshold` への env 戻しだけで rollback でき、データを失わない。

### 採用解決策
`apps/api/migrations/0016_cf_audit_log_classification.sql` は ALTER TABLE ADD COLUMN のみを行い、列削除 SQL は作らない。`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` の「Issue #515 audit-log classifier rollback」節で「① env を threshold に戻す ② 次回 hourly run を確認 ③ D1 metadata を確認 ④ 列は残す」を明文化。破壊的 DOWN は user approval 付きの別操作にする。

### 再利用ガイド
監視・evidence 系の D1 migration は forward-safe を default にし、env / config の戻しだけで rollback できる設計を取る。破壊的 DOWN を migration に書かず、runbook で user-gated 手順として分離する。

---

## L-ISSUE515-005: 同 wave SSOT 更新は分散させず、references / specs / skill LOGS を同一 PR 内で同期する

### 現象
classifier / features / evaluation を実装したあと、observability / secrets / infrastructure runbook / task-workflow / skill LOGS の更新を後追い PR にすると、Phase 12 strict 7 files と SSOT の整合性が drift し、PASS 判定が遅延する。

### 原因分析
classification-first / 同 wave 同期の原則を守らないと、resource-map の current canonical set と実 references の差分監査が PR ごとに必要になる。

### 採用解決策
本サイクルで `references/observability-monitoring.md` (10. ML-ready Classifier Contract)、`references/deployment-secrets-management.md` (`CF_AUDIT_CLASSIFIER` / `ML_MODEL_PATH` / `CF_AUDIT_REDACT_SECRET`)、`references/task-workflow-active.md` (Issue #515 workflow)、`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` (rollback 節)、`aiworkflow-requirements/LOGS/_legacy.md` / `task-specification-creator/LOGS/_legacy.md` を同一 wave で更新。後段で `indexes/quick-reference.md` と `indexes/resource-map.md` に Issue #515 行を追記。

### 再利用ガイド
Phase 12 SSOT 更新は「references → specs → skill LOGS → indexes」の順で 1 wave に纏める。Phase 12 strict 7 files の `system-spec-update-summary.md` には **更新したファイルパス + 追記節タイトル + 追加行範囲の概要** を必ず列挙し、後段の audit が diff 探索なしで確認できる状態にする。

---

## 参照元

- `scripts/cf-audit-log/classifier/{types,threshold,ml,index}.ts`
- `scripts/cf-audit-log/features/{schema,extract}.ts`
- `scripts/cf-audit-log/evaluation/{offline-replay,secret-leakage-grep}.ts`
- `apps/api/migrations/0016_cf_audit_log_classification.sql`
- `.github/workflows/cf-audit-log-monitor.yml` (`CF_AUDIT_CLASSIFIER` / `ML_MODEL_PATH` env)
- `docs/30-workflows/issue-515-cf-audit-logs-ml-anomaly/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/unassigned-task/issue-515-{90day-baseline-observation,ml-model-selection,production-ml-switch,redacted-feature-export}.md`
