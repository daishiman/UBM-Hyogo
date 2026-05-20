# issue-772-cf-audit-monitor-runtime-restoration-and-cleanup - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本タスクは GitHub repository-level secrets 投入（mutation）、必要に応じた `.github/workflows/cf-audit-log-monitor.yml` の最小調整、runbook ADR 追記といった repository-mutation を伴う。原典 Issue #772 はラベル上「整理（cleanup）」だが、現コードベース実態（hourly 10 連続 failure / production env 側に削除対象 secret が**そもそも不在**）に最適化すると、cleanup の前段として **monitor runtime restoration（secret 投入 + 6h success 観測）が必須の実装作業**になる。docs-only では runtime 復旧条件を満たせない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | issue-772-cf-audit-monitor-runtime-restoration-and-cleanup |
| タスク名 | `cf-audit-log-monitor.yml` の repository-level secret 投入による hourly snapshot runtime 復旧、および production env 側 cleanup の no-op 確定 |
| ディレクトリ | docs/30-workflows/issue-772-cf-audit-monitor-runtime-restoration-and-cleanup |
| 親 Issue | #772 (CLOSED, 2026-05-17T12:55:43Z closed) — クローズ済だが root cause 未解決のため最新コードに最適化して再起動 |
| 親 workflow | docs/30-workflows/completed-tasks/issue-720-cf-audit-monitor-env-protection-fix/ |
| 原典 (unassigned-task) | docs/30-workflows/unassigned-task/followup-issue-720-001-prod-env-monitor-secret-cleanup.md |
| GitHub Issue URL | https://github.com/daishiman/UBM-Hyogo/issues/772 |
| 作成日 | 2026-05-17 |
| 担当 | delivery |
| 状態 | spec_created / runtime_pending |
| タスク種別 | implementation / NON_VISUAL |
| 優先度 | High（hourly snapshot 10 連続 failure 中。`cf-audit-log-7day-summary.yml` の 168 hourly snapshots 集約前提が崩壊） |

## 採用方針（現コードベース実態に最適化）

**「Issue #772 を現コードに最適化して再解釈する」**

| 項目 | 原典 Issue #772 想定 | 現コードベース実態 | 本タスクで採る方針 |
| --- | --- | --- | --- |
| 削除対象 secret | production env 側に存在 | production env 側に**不在**（`CLOUDFLARE_API_TOKEN` のみ） | cleanup は「不在 evidence MD」生成と runbook 追記の no-op 宣言に縮退 |
| 親タスク runtime stability | 達成済の想定 | **未達成**（hourly 10 連続 failure / `secrets.CF_AUDIT_D1_TOKEN_PROD` 等が repo にも env にも不在） | 本タスクで repo-level 投入を主スコープとして実施 |
| 削除前 6 連続 success evidence | 達成済の想定 | placeholder `PENDING_USER_GATE` のまま | 本タスクで取得し直す |
| workflow yaml 状態 | 既に `environment: production` 削除済 | 削除済（issue-720 で完了） | 触らない（最小差分原則） |

## 目的

`.github/workflows/cf-audit-log-monitor.yml` が hourly schedule で 10 連続 failure している原因（repo-level に必要 secrets が投入されていない）を解消し、6 連続 success を runtime evidence として記録する。あわせて Issue #772 本来スコープであった production env 側 monitor 専用 secret cleanup については、production env 側に対象 secret がそもそも不在であることを inventory evidence として確定し、cleanup 自体は no-op として close する。

## スコープ

### 含む

- `.github/workflows/cf-audit-log-monitor.yml` が参照する monitor 系 secrets を repository-level に投入する手順記述と placeholder evidence 配置（実投入は user-gated）
  - `CF_AUDIT_D1_TOKEN_PROD`
  - `CF_AUDIT_TOKEN_PROD`
  - `CF_AUDIT_WORKERS_AI_TOKEN`
  - `EMAIL_WEBHOOK_URL`
  - `SLACK_WEBHOOK_INCIDENT` は **既存**のため再投入不要（inventory で確認）
- repository-level variables 8 件の差分確認手順（`vars.CF_AUDIT_CLASSIFIER` / `vars.ML_MODEL_PATH` / `vars.CF_AUDIT_IF_MODEL` / `vars.CF_AUDIT_XGB_MODEL` / `vars.CF_AUDIT_WORKERS_AI_URL` / `vars.CF_AUDIT_CLASSIFIER_VERSION` / `vars.EMAIL_FROM` / `vars.EMAIL_TO`）と必要に応じた user-gated 投入計画
- `workflow_dispatch -f dry_run=true --ref dev` 実行手順と placeholder evidence
- hourly schedule 6 連続 success runtime evidence の取得手順と placeholder
- production env 側 monitor 専用 secret 不在 evidence MD（before snapshot）の生成手順
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` の environment-separation ADR への「cleanup no-op 判定 / runtime restoration pending」ステータス追記
- `docs/30-workflows/unassigned-task/followup-issue-720-001-prod-env-monitor-secret-cleanup.md` への `consumed_via_issue_772_runtime_restoration_spec` ステータス同期方針記述（Phase 12 fold-state sync）

### 含まない

- `.github/workflows/cf-audit-log-monitor.yml` の機能差分（最小差分原則。secret 参照名・step 構成・cron 等は変更しない）
- production environment 自体の branch policy / required reviewers / wait timer 変更
- 新規 environment（`monitor-readonly` 等）作成
- secret **値** のローテーション（同名投入のみ）
- deploy 系 secret（`CLOUDFLARE_API_TOKEN` 等）の操作
- `cf-audit-log-7day-summary.yml` の挙動修正
- recovery D'+0 起算（runbook 正本どおり別経路で user が宣言）

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/followup-issue-720-001-prod-env-monitor-secret-cleanup.md | 原典 unassigned-task |
| 必須 | docs/30-workflows/completed-tasks/issue-720-cf-audit-monitor-env-protection-fix/ | 親 workflow（runtime stability 未達） |
| 必須 | docs/30-workflows/completed-tasks/issue-720-cf-audit-monitor-env-protection-fix/outputs/phase-02/secret-migration-plan.md | 投入対象 secret / variable リストの正本 |
| 必須 | .github/workflows/cf-audit-log-monitor.yml | 対象 workflow（参照のみ。yaml 改変なし） |
| 必須 | CLAUDE.md | Secret 管理ルール（1Password / `scripts/cf.sh` / 自律削除禁止） |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | environment-separation ADR 追記対象 |
| 参考 | https://docs.github.com/en/actions/security-guides/encrypted-secrets | secret 管理仕様 |
| 参考 | https://github.com/daishiman/UBM-Hyogo/actions/runs/25990982012 | 直近 hourly failure run（"Fetch audit logs into D1" step exit 2） |

## 受入条件 (AC)

### Local Acceptance

- **AC-1**: Phase 02 で `outputs/phase-02/secret-investment-plan.md` に投入必須 secrets と各 `gh secret set` 手順（`op read op://...` 経由）が user-gated 表記付きで列挙されている。
- **AC-2**: Phase 02 で `outputs/phase-02/variable-mirror-plan.md` に repo-level variables の差分・必要投入リストが記載されている。
- **AC-3**: Phase 02 で `outputs/phase-02/inventory-before.md` に「production env 側 monitor 専用 secret は不在」という inventory snapshot 手順と placeholder が配置されている（値は記録しない、名前のみ）。
- **AC-4**: Phase 11 に `workflow-dispatch-dryrun.md` / `runtime-evidence/6h-success.md` / `runtime-evidence/heartbeat-after.txt` の `PENDING_USER_GATE` placeholder が物理配置されている。
- **AC-5**: Phase 08 で `15-infrastructure-runbook.md` の environment-separation ADR への「cleanup no-op decision / runtime restoration pending」ステータス追記計画が記載されている。
- **AC-6**: Phase 12 で 7 必須 output（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）が揃い、`unassigned-task-detection.md` に原典 unassigned-task への `consumed_via_issue_772_runtime_restoration_spec` 同期方針が記述されている。
- **AC-7**: Phase 13 で PR base = `dev`（既定）の PR summary がドラフトされている（push / merge は user-gated）。
- **AC-8**: CONST_007 遵守: 本サイクル内で Phase 1〜12 と local implementation を完了し、external mutation（`gh secret set` / push / PR merge / `gh workflow run`）のみ user-gated として残す。

### Runtime Acceptance (Phase 13 / post-merge)

- **RAC-1**: user 承認・repo secret 投入後に `gh workflow run cf-audit-log-monitor.yml -f dry_run=true --ref dev` が success であることが Phase 11 evidence に run URL 付きで記録されている。
- **RAC-2**: hourly schedule が **6 連続 success** であることが `outputs/phase-11/runtime-evidence/6h-success.md` に run URL 付きで記録されている。
- **RAC-3**: 6h success 達成後、`gh secret list --env production` の after-snapshot に monitor 専用 secret が**新規追加されていない**ことが evidence MD に記録され、Issue #772 本来の cleanup スコープが no-op で close される。
- **RAC-4**: D'+0 は runbook 正本どおり、root cause 修正（secret 投入）後の最初の successful hourly run を user が別途宣言する。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | phase-01.md |
| 2 | 設計 | phase-02.md | spec_created | outputs/phase-02/{secret-investment-plan,variable-mirror-plan,inventory-before}.md |
| 3 | 設計レビュー | phase-03.md | spec_created | phase-03.md |
| 4 | タスク分解 | phase-04.md | spec_created | phase-04.md |
| 5 | 実装計画 | phase-05.md | spec_created | phase-05.md |
| 6 | 実装手順 | phase-06.md | spec_created | phase-06.md |
| 7 | テスト計画 | phase-07.md | spec_created | phase-07.md |
| 8 | ドキュメント更新 | phase-08.md | spec_created | phase-08.md |
| 9 | local 受入確認 | phase-09.md | spec_created | phase-09.md |
| 10 | リファクタ | phase-10.md | spec_created | phase-10.md |
| 11 | NON_VISUAL evidence | phase-11.md | runtime_pending | outputs/phase-11/{workflow-dispatch-dryrun,runtime-evidence/6h-success,runtime-evidence/heartbeat-after,runtime-evidence/hourly-runs}.md/json/txt |
| 12 | 正本同期 | phase-12.md | spec_created | outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md |
| 13 | PR・振り返り | phase-13.md | blocked | outputs/phase-13/pr-summary.md / outputs/phase-13/post-cleanup-secret-inventory.md |

## 不変条件

1. **yaml コード差分なし**: `.github/workflows/cf-audit-log-monitor.yml` の secret 参照名・step 構成は変更しない（最小差分原則 / issue-720 で確定済の interface を尊重）。
2. **`gh secret set` / `gh variable set` / environment mutation は user 明示承認後のみ**。Claude 自律禁止。
3. **secret 実値は記録禁止**: evidence MD / artifacts.json / commit / log のいずれにも secret 実値・1Password URI 以外のトークン断片を残さない。`op read op://...` で動的注入する。
4. **移行順序厳守**: (a) inventory before snapshot → (b) repo-level secrets / variables 投入（user-gated）→ (c) `workflow_dispatch dry_run=true` success 確認 → (d) hourly 6 連続 success 確認 → (e) production env after-snapshot で no-op cleanup 確定 → (f) runbook ADR ステータス追記。
5. **CLOSED Issue を reopen しない**: Phase 12 fold-state sync で原典 unassigned-task に `consumed_via_issue_772_runtime_restoration_spec` を記述。
6. **production env 側 deploy 系 secret（`CLOUDFLARE_API_TOKEN`）には触れない**: monitor 系のみ対象。
7. **CONST_007 遵守**: 本サイクル内で Phase 1〜12 と local readiness を完了し、external mutation だけを user-gated として残す。
8. **CLAUDE.md secret 管理ルール準拠**: 実値は 1Password に保管。Claude は `.env` を読まない。`scripts/cf.sh` 系 wrapper を使う場面では wrangler 直接実行禁止。

## リスクと緩和策

| リスク | 影響度 | 発生確率 | 緩和策 |
| --- | --- | --- | --- |
| 投入対象 secret に過不足があり最初の dry_run が再度 401/403 fail | 高 | 中 | Phase 02 で workflow yaml の `secrets.*` 参照を全数列挙し、`gh secret list` 差分検証手順を Phase 06 / 09 に明示 |
| repo-level secret 投入により private repo 全 workflow surface が広がる | 中 | 高（仕様） | issue-720 で確定済 ADR を準用し、対象を monitor 系 read-only token に限定。Phase 08 で再確認 |
| secret 実値がドキュメント / log に転写される | 高 | 低 | 全 phase で `op read op://...` 経由の動的注入を必須化。grep gate を Phase 07 / 11 に組み込む |
| 6h 観測中に hourly が途中で fail し evidence 不成立 | 中 | 中 | failure 発生時は run URL を evidence に記録し、root cause を Phase 11 内で切り分けるフローを記述 |
| CLOSED Issue #772 の状態管理と乖離する | 低 | 中 | Phase 12 fold-state sync で `consumed_via_issue_772_runtime_restoration_spec` を原典 unassigned-task に同期。reopen はしない |
| cleanup no-op 宣言と将来の production env 復元時の rollback パスの両立 | 低 | 低 | ADR に「production env 側に同名 monitor secret を再投入する場合の手順」を Phase 08 で明文化 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | phase-01.md | 要件定義主成果物 |
| ドキュメント | outputs/phase-02/secret-investment-plan.md | repo-level secret 投入計画（AC-1） |
| ドキュメント | outputs/phase-02/variable-mirror-plan.md | repo-level variables 差分計画（AC-2） |
| ドキュメント | outputs/phase-02/inventory-before.md | production env / repo-level inventory snapshot 手順 + placeholder（AC-3） |
| ドキュメント | outputs/phase-11/workflow-dispatch-dryrun.md | dry_run placeholder（RAC-1） |
| ドキュメント | outputs/phase-11/runtime-evidence/6h-success.md | 6 連続 success placeholder（RAC-2） |
| ドキュメント | outputs/phase-11/runtime-evidence/heartbeat-after.txt | heartbeat placeholder |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 strict compliance 検証 |
| ドキュメント | outputs/phase-13/post-cleanup-secret-inventory.md | cleanup no-op 確定 evidence（RAC-3 placeholder） |
| 管理 | artifacts.json | root workflow state / Phase 1-13 status |
| 管理 | outputs/artifacts.json | outputs parity marker |

## Phase マップ

```
phase-01 (要件定義)
  └─ phase-01.md
       │
       ▼
phase-02 (設計)
  ├─ outputs/phase-02/secret-investment-plan.md
  ├─ outputs/phase-02/variable-mirror-plan.md
  └─ outputs/phase-02/inventory-before.md
       │
       ▼
phase-03 (設計レビュー)
       │
       ▼
phase-04〜10 (実装〜リファクタ / local spec のみ)
       │
       ▼
phase-11 (NON_VISUAL runtime evidence)
  ├─ outputs/phase-11/workflow-dispatch-dryrun.md
  ├─ outputs/phase-11/runtime-evidence/6h-success.md
  └─ outputs/phase-11/runtime-evidence/heartbeat-after.txt
       │
       ▼
phase-12 (正本同期 / 7 必須 output)
       │
       ▼
phase-13 (PR・振り返り + post-cleanup inventory / user approval gate)
  ├─ outputs/phase-13/pr-summary.md
  └─ outputs/phase-13/post-cleanup-secret-inventory.md
```

## 注意点

- GitHub Issue #772 は CLOSED 済（2026-05-17T12:55:43Z）。reopen はせず、本仕様書で local implementation + 正本同期まで完了する。external mutation は user-gated として残す。
- 原典 Issue #772 のラベル「cleanup」は現コード実態と乖離している。最新コードに最適化して runtime restoration を主スコープに置く、という判断根拠は本 index.md / phase-01.md / phase-02.md に明記する。
- recovery 2nd cycle の D'+0 起算は runbook 正本に従い、本タスクとは別経路で user が宣言する。
