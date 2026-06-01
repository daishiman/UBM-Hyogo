# Phase 12 ドキュメント変更ログ

> `implemented_local_evidence_captured` 段階。実コード変更済。本ログは各 Step の結果を「該当なし」も含め個別に記録する。

## ブロック A: workflow-local 同期

| Step    | 対象                                                          | 結果 |
| ------- | ------------------------------------------------------------ | ---- |
| 1-A     | `outputs/phase-1/requirements.md` / `phase-2.md` / `phase-3.md` | 既存・整合済み（追加変更なし）。AC と実コード anchor が一致。 |
| 1-B     | `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` | **更新**（本サイクル）。NON_VISUAL 自動テスト証跡。 |
| 1-B     | `phase-11.md`                                                 | **新規作成**（NON_VISUAL 宣言）。 |
| 1-C     | `outputs/phase-12/implementation-guide.md`                   | **新規作成**（Part 1 概念 + Part 2 技術）。 |
| 1-C     | `outputs/phase-12/system-spec-update-summary.md`            | **新規作成**。 |
| 1-C     | `outputs/phase-12/unassigned-task-detection.md`            | **新規作成**。 |
| 1-C     | `outputs/phase-12/skill-feedback-report.md`               | **新規作成**。 |
| 1-C     | `outputs/phase-12/phase12-task-spec-compliance-check.md`  | **新規作成**（root evidence）。 |
| 1-C     | `index.md` / `artifacts.json` / `outputs/artifacts.json` / `outputs/phase-12/main.md` | **新規作成**。workflow root metadata と strict 7 parity を補完。 |

## ブロック B: global skill sync（aiworkflow-requirements / task-specification-creator）

| Step    | 対象                                                       | 結果 |
| ------- | --------------------------------------------------------- | ---- |
| Step 2  | aiworkflow-requirements `references/`（api / database / workflow inventory） | **反映済み**。`expand=tags` は current contract として記録し、`listTagsByMemberIds` フラット配列返り + use-case groupBy 境界を reusable lesson 化。 |
| Step 2  | task-specification-creator skill                          | **反映済み**。Phase 1 の実コード verbatim signature gate を `phase-template-phase1.md` に追記。 |
| Step 2  | aiworkflow-requirements `references/lessons-learned.md` / `task-workflow-active.md` | **反映済み**。Issue #224 workflow と current contract の行を追加。 |

## 実コード（apps / packages）変更

- `apps/api` と `packages/shared` に実装・テスト差分あり。`git diff --stat apps/ packages/` で自己確認済み。
