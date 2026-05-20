# Phase 1: 要件定義

[実装区分: 実装仕様書]

> **実装区分判定根拠**: repository-level secrets 投入（GitHub mutation）と runbook ADR 追記（docs commit）を伴うため、docs-only では完結しない。後続実装で `gh secret set` / `gh workflow run` / `git push` / `gh pr create` を user-gated で実行する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-772 cf-audit-monitor runtime restoration and cleanup |
| Phase 番号 | 1 / 13 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |

## 目的

Issue #772 は原典上「production env 側 monitor 専用 secret cleanup」だが、現コードベース実態を調査した結果、cleanup の前提条件（issue-720 で計画された repo-level secret mirroring）が未実施で `cf-audit-log-monitor.yml` が hourly 10 連続 failure 中であることが判明した。本 Phase では Issue #772 を最新コードに最適化して再解釈し、「runtime restoration を主スコープ、cleanup は no-op 宣言として併発」する方針を確定する。

## 現状実態の確認（root cause 確定）

| 観点 | 期待 | 実態 | 根拠 |
| --- | --- | --- | --- |
| workflow yaml `environment: production` | 削除済 | 削除済 ✅ | `.github/workflows/cf-audit-log-monitor.yml` 内に `environment:` 記述なし |
| repo-level `CF_AUDIT_D1_TOKEN_PROD` | 投入済 | **不在** ❌ | `gh secret list --repo daishiman/UBM-Hyogo` |
| repo-level `CF_AUDIT_TOKEN_PROD` | 投入済 | **不在** ❌ | 同上 |
| repo-level `CF_AUDIT_WORKERS_AI_TOKEN` | 投入済 | **不在** ❌ | 同上 |
| repo-level `EMAIL_WEBHOOK_URL` | 投入済 | **不在** ❌ | 同上 |
| repo-level `SLACK_WEBHOOK_INCIDENT` | 投入済 | 存在 ✅ | 同上 |
| production env 側 monitor secret | 残存（削除対象） | **不在** ✅（cleanup 不要） | `gh secret list --repo daishiman/UBM-Hyogo --env production` → `CLOUDFLARE_API_TOKEN` のみ |
| hourly schedule | success | **10 連続 failure** | `gh run list --workflow=cf-audit-log-monitor.yml --limit 10` |
| 直近 failure step | — | "Fetch audit logs into D1" exit 2 | `gh api /repos/daishiman/UBM-Hyogo/actions/runs/25990982012/jobs` |
| Issue #720 6h-success evidence | PASS | `PENDING_USER_GATE` のまま | `docs/30-workflows/completed-tasks/issue-720-cf-audit-monitor-env-protection-fix/outputs/phase-11/runtime-evidence/6h-success.md` |

→ 根本原因は **「workflow yaml の secrets.* 参照に対応する repo-level secret が未投入」**。Issue #772 が想定した cleanup 対象（production env 側 monitor secret）は不在のため cleanup は no-op で完了する。

## 真の論点

### 論点 1: Issue #772 を現コードに最適化する範囲

**選択肢**:
- (A) Issue #772 の原典スコープ（cleanup のみ）に忠実 → production env 側 inventory 取得と runbook ステータス追記のみ。だが runtime 未復旧のままで `cf-audit-log-7day-summary.yml` 集約は崩壊継続。
- (B) Issue #772 を最新コードに最適化し runtime restoration を主スコープに → repo-level secret 投入で hourly 復旧、cleanup は no-op 確定。**第一推奨**。
- (C) 新規 issue に切り出し #772 は no-op closure 宣言のみ → user 確認済選択肢ではない。

→ **(B) を採用**。user 確認済（前段の AskUserQuestion）。

### 論点 2: workflow yaml 改変の要否

**判定**: workflow yaml は issue-720 で確定済の interface（`secrets.CF_AUDIT_D1_TOKEN_PROD` 同名参照）を尊重し、本タスクでは **コード差分なし**。投入する secret は workflow yaml が期待する**同名**で repo-level に投入する。

### 論点 3: secret 値の保護

**判定**: 実値は 1Password に保管。`gh secret set --body "$(op read op://Vault/Item/Field)"` で動的注入する。Claude / Codex が `.env` の中身を読まないルール（CLAUDE.md）を遵守。evidence MD / artifacts.json には secret name と timestamp のみ記録、value は禁止。

### 論点 4: cleanup スコープの no-op 宣言の形式

**選択肢**:
- (A) 6h success 達成後の `gh secret list --env production` after-snapshot で「monitor 専用 secret が新規追加されていないこと」を evidence MD に記録し、runbook ADR に `cleanup_no_op_confirmed_2026-05-17` を追記。**採用**。
- (B) Issue #772 reopen して別タスクとして処理 → CLOSED issue 再開禁止ルール（issue-720 Phase 12 fold-state sync 知見）に反する。**不採用**。

→ **(A) を採用**。

## 依存境界と責務

| 種別 | 対象 | 境界 |
| --- | --- | --- |
| 上流 | `.github/workflows/cf-audit-log-monitor.yml` | **不変**（コード差分なし） |
| 上流 | repository-level secrets / variables | 監視系 secret の追加のみ。deploy 系 secret は触らない |
| 上流 | production environment | 不変（branch policy / required reviewers / wait timer 全て不変） |
| 連携 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | environment-separation ADR への「cleanup no-op / runtime restoration pending」ステータス追記対象 |
| 連携 | `docs/30-workflows/unassigned-task/followup-issue-720-001-prod-env-monitor-secret-cleanup.md` | Phase 12 fold-state sync 対象（`consumed_via_issue_772_runtime_restoration_spec`） |
| 対象外 | `cf-audit-log-7day-summary.yml` | 別 workflow、本タスクで触れない |
| 対象外 | D1 schema / apps/api / apps/web | 不要 |
| 対象外 | recovery D'+0 起算 | user が別経路で宣言 |

## 価値とコスト評価

- **価値**: hourly snapshot 復旧 → `cf-audit-log-7day-summary.yml` の 168h 集約前提が回復。Issue #772 cleanup スコープも同時 close。
- **設計コスト**: Phase 02 成果物 3 件 + Phase 03-12 各 1 件 = 12 ファイル。
- **実装コスト**: yaml コード差分 0 行 / repo-level secret 投入 4 件（user 操作、5〜10 分）/ variables 投入は差分次第。
- **runtime コスト**: dry_run 1 回（5 分）+ hourly 6 連続 success 観測（6h wallclock）。

## 4 条件評価

| 条件 | 判定 | 解消条件 |
| --- | --- | --- |
| 価値性 | PASS | hourly 復旧で 168h 集約前提が回復 |
| 実現性 | PASS | `gh secret set` 4 件 + dry_run + 6h 観測のみ。external dependency なし |
| 整合性 | PASS | CLAUDE.md / issue-720 ADR / `scripts/cf.sh` 系ルールすべてに整合 |
| 運用性 | CONDITIONAL | repo-level secret 投入により private repo 全 workflow surface が広がる。issue-720 ADR の「monitor read-only token 限定」原則を Phase 08 で再確認し、ステータス追記で運用ルールを再固定する |

## 既存資産インベントリ

| 資産 | 確認結果 | 参照 |
| --- | --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | `environment:` 記述なし。`secrets.CF_AUDIT_D1_TOKEN_PROD` 等を参照中 | L68,69,78,81,112,113 |
| 親 workflow phase-02 | `secret-migration-plan.md` で投入対象 secrets / variables が確定済 | docs/30-workflows/completed-tasks/issue-720-cf-audit-monitor-env-protection-fix/outputs/phase-02/secret-migration-plan.md |
| 親 workflow phase-11 | 6h-success / heartbeat / inventory が `PENDING_USER_GATE` のまま | docs/30-workflows/completed-tasks/issue-720-cf-audit-monitor-env-protection-fix/outputs/phase-11/ |
| `scripts/cf.sh` | secret は 1Password 経由で `op run --env-file=.env` ラップ。本タスクでは `gh secret set --body "$(op read op://...)"` の参考に使う | CLAUDE.md / scripts/cf.sh |
| Issue #772 timeline | comment / PR / commit いずれも無し。label 付与 → close のみ | gh api repos/daishiman/UBM-Hyogo/issues/772/timeline |

## スコープ確定

index.md「含む / 含まない」を Phase 1 で正式承認。

## 受入条件 (AC) 確認

index.md AC-1〜AC-8 / RAC-1〜RAC-4 を Phase 1 で正式承認。

## 用語集

| 用語 | 意味 |
| --- | --- |
| runtime restoration | repo-level に必要な secret を投入し hourly schedule を success に戻す作業 |
| cleanup no-op | Issue #772 原典の cleanup 対象 secret が production env 側に既に不在のため、削除操作なしで cleanup を完了する形態 |
| fold-state sync | CLOSED issue を reopen せず、原典 unassigned-task MD のステータスを `consumed_via_*` で進める運用 |
| same-name mirror | environment-level と repo-level で同名 secret を運用する形式（workflow yaml の参照名を変えずに済む） |

## 実行タスク

- [x] 現状実態を `gh secret list` / `gh run view` / `gh api .../jobs` で確認
- [x] 4 つの真の論点を明文化
- [x] 4 条件評価の CONDITIONAL 解消条件を Phase 2 申し送り
- [x] 既存資産インベントリ記録
- [x] phase-01.md を確定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/followup-issue-720-001-prod-env-monitor-secret-cleanup.md | 原典 |
| 必須 | docs/30-workflows/completed-tasks/issue-720-cf-audit-monitor-env-protection-fix/ | 親 workflow |
| 必須 | .github/workflows/cf-audit-log-monitor.yml | 対象 workflow |
| 必須 | CLAUDE.md | secret 管理ルール |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | phase-01.md | 要件定義主成果物 |

## 完了条件

- [x] 4 つの真の論点を文書化
- [x] 4 条件評価 PASS / CONDITIONAL の解消条件記録
- [x] AC-1〜AC-8 / RAC-1〜RAC-4 を Phase 1 で正式承認
- [x] 既存資産インベントリ記録
- [x] downstream handoff（Phase 2 への申し送り）明記

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項:
  - 論点採用案 (A)-(不変)-(動的注入)-(A) を Phase 2 設計の前提として固定
  - CONDITIONAL 解消条件「monitor read-only token 限定原則の再確認」を Phase 08 で扱う
  - workflow yaml の `secrets.*` 全数列挙結果 (CF_AUDIT_D1_TOKEN_PROD / CF_AUDIT_TOKEN_PROD / CF_AUDIT_WORKERS_AI_TOKEN / EMAIL_WEBHOOK_URL / SLACK_WEBHOOK_INCIDENT) を Phase 02 secret-investment-plan に転記
- ブロック条件: phase-01.md 未作成 / CONDITIONAL 解消条件未記録の場合は Phase 2 に進まない
