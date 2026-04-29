# Workflow Artifact Inventory: UT-GOV-004 branch protection required_status_checks contexts 同期

> 完了日: 2026-04-29
> Workflow root: `docs/30-workflows/completed-tasks/ut-gov-004-required-status-checks-context-sync/`
> 種別: governance / docs-only / NON_VISUAL / spec_created
> 入力契約 出力先: UT-GOV-001（apply）

## 1. Phase 別 outputs（13 phases）

| Phase | 主成果物 | 役割 |
| --- | --- | --- |
| 1 | `outputs/phase-01/main.md` | 要件定義 / 4条件評価 / AC ロック（AC-1〜AC-10）|
| 2 | `outputs/phase-02/{context-name-mapping,staged-rollout-plan,lefthook-ci-correspondence}.md` | 草案 8 contexts ↔ 実在 context の名寄せ・段階適用案・lefthook ↔ CI 対応表 |
| 3 | `outputs/phase-03/main.md` | 設計レビュー（代替案 4 案 / base case 確定） |
| 4 | `outputs/phase-04/test-strategy.md` | 8 × 3 マトリクス・`gh api` テンプレ・dry-run 期待出力 |
| 5 | `outputs/phase-05/{implementation-runbook,workflow-job-inventory,required-contexts-final,lefthook-ci-mapping,staged-rollout-plan,strict-mode-decision}.md` | 実装ランブック + 5 補助成果物 |
| 6 | `outputs/phase-06/failure-cases.md` | 異常系（存在しない context・名前変更事故・matrix 展開ミス 等） |
| 7 | `outputs/phase-07/ac-matrix.md` | AC-1〜AC-10 の検証マッピング |
| 8 | `outputs/phase-08/{main,confirmed-contexts.yml,lefthook-ci-mapping}` | **DRY 化 / `confirmed-contexts.yml` 機械可読正本** |
| 9 | `outputs/phase-09/{main,strict-decision}.md` | governance QA / strict 採否最終確定 |
| 10 | `outputs/phase-10/go-no-go.md` | GO/NO-GO 判定（PASS, MAJOR ゼロ）|
| 11 | `outputs/phase-11/{main,manual-smoke-log,link-checklist}.md` | NON_VISUAL evidence（screenshot N/A）|
| 12 | `outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check,elegant-final-verification}.md` | close-out 必須 6 + 補助 1 |
| 13 | `outputs/phase-13/main.md` | 承認ゲート / local-check / change-summary / PR テンプレ |

## 2. UT-GOV-001 への入力契約（唯一の機械可読正本）

`outputs/phase-08/confirmed-contexts.yml`

- `required_status_checks.contexts` = `["ci", "Validate Build", "verify-indexes-up-to-date"]`
- `strict.dev` = `false` / `strict.main` = `true`
- `evidence[]` 各 context の `workflow_file` / `workflow_name` / `job_name` / `last_success_at`
- `phase_2_candidates[]` 4 件（`unit-test` / `integration-test` / `security-scan` / `docs-link-check`） → UT-GOV-005 へリレー

## 3. branch protection 運用ルール 4 項目（system-spec-update-summary.md §4）

| AC | ルール |
| --- | --- |
| AC-3 | 投入文字列は `gh api check-runs` で過去 30 日以内 success 実績必須 |
| AC-8 | `<workflow>/<job>` フルパス記載 |
| AC-9 | context 名変更は同一 PR で branch protection も更新 |
| AC-5 | lefthook と CI は同一 pnpm script を呼ぶ |

## 4. skill 反映先（aiworkflow-requirements）

| 区分 | パス | 反映内容 |
| --- | --- | --- |
| index | `indexes/resource-map.md` | クイックルックアップに「Branch protection required_status_checks contexts 同期（UT-GOV-004 / 2026-04-29）」行追加 |
| index | `indexes/quick-reference.md` | 「Branch Protection Required Status Checks Contexts 同期」セクション追加 |
| LOGS | `LOGS/_legacy.md` | 2026-04-29 ヘッドラインで close-out 記録（既存）|
| references | `references/lessons-learned-ut-gov-004-branch-protection-context-sync.md` | 苦戦箇所 6 件 + 運用ルール 4 項目 |
| references | `references/workflow-ut-gov-004-artifact-inventory.md` | 本ファイル |

## 5. 上書き済み既存タスク

| 既存タスク | 上書き対象 | 上書き内容 |
| --- | --- | --- |
| `task-github-governance-branch-protection` | `outputs/phase-2/design.md §2.b` | 草案 8 contexts → 確定 3 contexts |
| 同上 | `outputs/phase-12/implementation-guide.md §1, §5(H-1)` | target contexts と H-1 hazard 対策 |

過去成果物として保持し、現在の正本は `confirmed-contexts.yml` のみ。

## 6. リレー先未タスク

| relay 先 | 切り出し対象 |
| --- | --- |
| UT-GOV-001 | 確定 contexts による branch protection apply |
| UT-GOV-005 | Phase 2 候補 4 件（unit-test / integration-test / security-scan / docs-link-check）の workflow 新設 |
| UT-GOV-007 | workflow `name:` drift 自動検出 + GitHub Actions ピン留めポリシー |
| `task-git-hooks-lefthook-and-post-merge` | lefthook ↔ CI 同一 pnpm script 規約の実装整合 |

## 7. 不変条件

CLAUDE.md §「重要な不変条件」#1〜#7 への影響なし（governance 層に閉じる）。
