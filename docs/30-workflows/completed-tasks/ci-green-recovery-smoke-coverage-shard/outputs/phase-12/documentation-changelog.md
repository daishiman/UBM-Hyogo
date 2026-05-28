# Phase 12 — Documentation Changelog

> task: `ci-green-recovery-smoke-coverage-shard` / status: `implemented_local_evidence_captured`（implementation / NON_VISUAL / runtime_ci_pending）
> date: 2026-05-23

## 本ワークフロー内で作成したドキュメント

| パス | 種別 | 内容 |
|---|---|---|
| `index.md` | spec | 3 lane 概要・根本原因・採用方針・変更対象一覧 |
| `phase-1-requirements.md` | spec | 受入条件 AC-1〜9 / inventory / 命名規則 |
| `phase-2-design.md` | spec | 3 lane 設計（mint helper / workflow diff / coverage-guard） |
| `phase-3-design-review.md` | spec | 設計レビューゲート（PASS） |
| `phase-11-manual-test.md` | spec | NON_VISUAL 手動テスト（代替証跡定義） |
| `phase-12-documentation.md` | spec | ドキュメント同期入口 |
| `phase-13-pr.md` | spec | PR 手順（ユーザー gated） |
| `outputs/phase-11/manual-test-result.md` | template | NON_VISUAL 代替証跡記録テンプレ |
| `outputs/phase-12/main.md` | output | Phase 12 インデックス |
| `outputs/phase-12/implementation-guide.md` | output | 2 パート実装ガイド + 視覚証跡 |
| `outputs/phase-12/system-spec-update-summary.md` | output | spec 反映要否判定 |
| `outputs/phase-12/documentation-changelog.md` | output | 本ファイル |
| `outputs/phase-12/unassigned-task-detection.md` | output | 未タスク候補検出 |
| `outputs/phase-12/skill-feedback-report.md` | output | skill フィードバック |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | output | compliance チェック |
| `outputs/phase-13/pr-creation-result.md` | placeholder | PR 結果（blocked_pending_user_approval） |
| `outputs/artifacts.json` | mirror | root `artifacts.json` と同一内容の output mirror |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | system spec | active workflow ledger へ implemented-local entry を追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-ci-green-recovery-smoke-coverage-shard-artifact-inventory.md` | system spec | artifact inventory を新規追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | index | 本 workflow の quick reference entry を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | index | 本 workflow の resource lookup entry を追加 |
| `.claude/skills/aiworkflow-requirements/changelog/20260523-ci-green-recovery-smoke-coverage-shard.md` | history | dated changelog を追加 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` / `SKILL-changelog.md` / `LOGS/_legacy.md` | skill history | same-wave sync 履歴を追加 |

## 実装サイクルで更新したドキュメント / user-gated 境界

| パス | 変更内容 | gated |
|---|---|---|
| `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | mint secret 5 種の op 参照 + `gh secret set --env staging-runtime-smoke` 投入手順 + 即時再発行手順 + `provision-staging-secrets.sh` の `SECRETS=()` 差分例 | 追記済み。secret 実投入はユーザー gated |
| `docs/00-getting-started-manual/specs/02-auth.md` / `13-mvp-auth.md` | （任意）mint 運用事実の back-link 1 行。必須ではない（system-spec-update-summary 参照） | — |
| `.claude/skills/aiworkflow-requirements/` references / indexes | active entry / artifact inventory の same-wave sync | 完了 |

## 注意（不変条件）

- secret 実値・JWT 文字列・署名鍵を docs に転記していない（`::add-mask::` 前提）。
- 本 changelog 時点でコード・CI config・runbook は実装済み。remote CI 観測、secret 実投入、commit/push/PR は user-gated。
