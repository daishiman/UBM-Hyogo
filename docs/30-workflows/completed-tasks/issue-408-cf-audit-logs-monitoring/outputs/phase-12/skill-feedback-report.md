# Skill Feedback Report — Issue #408 Cloudflare Audit Logs 監視

task-specification-creator skill / aiworkflow-requirements skill / 関連テンプレートに対する改善提案を 3 観点で記録する。各セクションは**最低 1 件**、改善点なしの場合でも "確認済み・改善点なし" を明記する。

## テンプレ改善

### 提案 1: phase-template-phase11.md の NON_VISUAL evidence list に `monitoring_token_scope_confirmation` を追加

- **背景**: 本タスクは監視専用 Token（scope `Audit Logs:Read` のみ）を発行する設計だが、Phase 11 NON_VISUAL evidence のデフォルトリストには Token scope 確認 artifact が含まれていない。
- **提案**: `phase-template-phase11.md` の NON_VISUAL evidence サンプルに `monitoring_token_scope_confirmation.json`（`gh secret list` + `bash scripts/cf.sh whoami` の合成出力）を追加候補として記載。
- **ROI**: 監視系タスク全般（U-FIX-CF-ACCT-01 派生 wave）で再利用可能。
- **Routing**: Promote → `task-specification-creator/references/phase12-skill-feedback-promotion.md` Applied Examples に Issue #408 の placeholder evidence / token scope gate を追加。

### 提案 2: artifacts.json schema に `monitoring_workflow` taskType を追加

- **背景**: 本タスクは GitHub Actions schedule workflow が主成果物で、既存 `implementation` taskType では coverage AC が誤適用されやすい。
- **提案**: `monitoring_workflow` taskType を新設し、coverage AC を script 単位 focused test に限定する規約を skill 仕様に明記。
- **Routing**: No-op for this cycle → 既存 `implementation / NON_VISUAL` + `coverage AC は script focused test に限定` で表現可能。taxonomy 追加は既存 `task-type-decision.md` への影響が広いため、今回の実行サイクルでは新 taskType を増やさない。

## ワークフロー改善

### 提案 1: watchdog workflow の自動生成テンプレートを `_templates/` に追加

- **背景**: `cf-audit-log-monitor-watchdog.yml` のような "schedule の schedule を見張る" workflow は本タスク以外にも汎用的に必要となる（cron job 全般）。
- **提案**: `_templates/github-workflow-watchdog.yml.tpl` を skill リポジトリに追加し、`{{ MONITORED_WORKFLOW }}` / `{{ STALE_THRESHOLD_MINUTES }}` をプレースホルダ化。
- **Routing**: No-op for this cycle → watchdog は Issue #408 固有の local 実装で追加済み。テンプレート化は実コードの重複が 2 例以上になった時点で再評価。

### 提案 2: Phase 5 の D1 migration 命名 collision チェックを skill ガイドに追加

- **背景**: `apps/api/migrations/NNNN_*.sql` の連番は他並列タスクと衝突しがち。Phase 5 着手前の番号予約手順がガイドにない。
- **提案**: Phase 5 の前提チェックに「`ls apps/api/migrations/ | tail -3` で最新番号を確認し、PR description で予約番号を宣言」する手順を追加。
- **Routing**: Promote → `task-specification-creator/references/phase12-skill-feedback-promotion.md` Applied Examples に migration numbering collision check として反映。

## ドキュメント改善

### 提案 1: deployment-secrets-management.md に "監視 Token 専用 secret 命名規則 (`CF_*_AUDIT_*`)" を明文化

- **背景**: 現 SSOT は deploy Token の命名規則のみ規定しており、監視・運用系 Token の命名規則が暗黙的。
- **提案**: GitHub Actions の監視用 secret は `CF_AUDIT_TOKEN_PROD` とし、1Password 正本から GitHub environment secret へ派生コピーする。deploy 用 `CLOUDFLARE_API_TOKEN` と名前・scope・rotation を分離する。
- **Routing**: Promote → `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` へ同 wave 反映済み。

### 提案 2: observability / infrastructure runbook に "監視 Token 自身の漏洩" シナリオ追加

- **背景**: 現 runbook は deploy Token / DB credential の漏洩シナリオが中心で、監視 Token 自身の失効・再発行手順が欠落。
- **提案**: HIGH 検知 → 監視 Token 失効 → D1 `cf_audit_log` 影響調査 → 新 Token 発行 → baseline 除外のフローを 4 ステップで明記。
- **Routing**: Promote → `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` と `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` へ同 wave 反映済み。

## 要約

| セクション | 件数 | 状態 |
| --- | --- | --- |
| テンプレ改善 | 2 | 提案あり |
| ワークフロー改善 | 2 | 提案あり |
| ドキュメント改善 | 2 | 提案あり |

確認済み・改善点なしのセクションは無し。全 6 件は Promote / No-op に routing 済みで、今回サイクルで必要な SSOT 同期は実ファイルへ反映した。
