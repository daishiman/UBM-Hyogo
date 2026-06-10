# Phase 12: ドキュメント同期

- Phase 目的: 実装ガイド / 仕様更新反映 / changelog / 未タスク検出 / skill-feedback / compliance の 6 必須タスクを `outputs/phase-12/` の 7 成果物へ落とし込み、索引する。
- 入力: Phase 1-11、`_shared-context.md`、`artifacts.json` の `phase12_strict_outputs`。
- 出力: `outputs/phase-12/` 配下 7 ファイル。

## 6 必須タスク → 7 成果物 索引

| # | Phase 12 必須タスク | 対応成果物（`outputs/phase-12/`） |
| --- | --- | --- |
| 索引 | サマリ索引 | `main.md` |
| 1 | 実装ガイド（中学生レベル + 技術者レベル） | `implementation-guide.md` |
| 2 | 仕様更新判定（Step1-A/1-B/1-C/Step2） | `system-spec-update-summary.md` |
| 3 | ドキュメント changelog（全 Step 結果） | `documentation-changelog.md` |
| 4 | 未タスク検出（0 件でも出力必須） | `unassigned-task-detection.md` |
| 5 | skill-feedback（改善なしでも出力必須） | `skill-feedback-report.md` |
| 6 | compliance（canonical 見出し / 6 タスク / 成果物突合） | `phase12-task-spec-compliance-check.md` |

## implemented_local_evidence_captured 前提

- 本サイクルで実コード実装と Step2（仕様反映）を実施済み。
- commit / push / PR / staging screenshot は user-gated として Phase 13 に残す。
- AC-1..AC-9 への trace は各成果物に保持する。

## 検証コマンド

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity
pnpm verify:phase12-compliance
pnpm gate-metadata:validate --require-gates-for-changed docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/artifacts.json docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/outputs/artifacts.json
```

## Canonical Compliance Addendum

## メタ情報

- task_id: `public-home-member-card-info-and-tag-clarity`
- taskType: `implementation`
- visualEvidence: `VISUAL`
- workflow_state: `implemented_local_evidence_captured`

## 目的

本 Phase の上部本文を正本とし、AC-1..AC-9 を実コード・テスト・証跡へ接続する。

## 実行タスク

- [x] Phase 本文の該当タスクを完了
- [x] 実装対象・検証対象を AC trace に接続
- [x] Phase 12 / artifacts の状態語彙と整合

## 参照資料

- `index.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`

## 成果物/実行手順

本ファイル本文の手順と `artifacts.json.metadata.verify_commands` を正本とする。実装済み成果物は `apps/web` / `apps/api` / `packages/shared` と Phase 11 / 12 outputs に反映済み。

## 完了条件

- [x] AC trace が維持されている
- [x] focused tests が PASS している
- [x] Phase 11 local visual evidence が存在する
- [x] Phase 12 strict 7 が存在する

## 統合テスト連携

focused Vitest 6 files / 50 tests PASS を主証跡とし、typecheck / lint / verify:tokens / verify:phase12-compliance / gate-metadata を全体 gate とする。

