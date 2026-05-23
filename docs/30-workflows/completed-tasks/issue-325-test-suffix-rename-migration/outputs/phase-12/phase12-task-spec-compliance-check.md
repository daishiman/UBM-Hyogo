# Phase 12 コンプライアンスチェック — Issue #325

## strict 7 file names

| ファイル | 判定 |
| --- | --- |
| `outputs/phase-12/main.md` | PASS |
| `outputs/phase-12/implementation-guide.md` | PASS |
| `outputs/phase-12/system-spec-update-summary.md` | PASS |
| `outputs/phase-12/documentation-changelog.md` | PASS |
| `outputs/phase-12/unassigned-task-detection.md` | PASS |
| `outputs/phase-12/skill-feedback-report.md` | PASS |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | PASS |
| `outputs/phase-12/test-file-suffix-adr.md` | PASS（補助 ADR） |

## 内容充足チェック

| ファイル | 必須要素 | 判定 |
| --- | --- | --- |
| implementation-guide.md | Part 1 中学生レベル / Part 2 技術者レベル両方 | PASS |
| test-file-suffix-adr.md | 4 分類定義 / 例 5 件 / scope out / implementation_completed 境界 | PASS |
| unassigned-task-detection.md | 未タスク 0 件 / scope-out 棚卸し / CONST_005 境界 | PASS |
| system-spec-update-summary.md | aiworkflow 同期点 / 更新しないもの / Issue #548 削除差分境界 | PASS |
| skill-feedback-report.md | テンプレート改善 / ワークフロー改善 / ドキュメント改善 | PASS |

## テスト常時実行可能性 DoD

| 項目 | 判定 | 根拠 |
| --- | --- | --- |
| 対象 spec 列挙 | PASS | `phase-02.md` fixed list 132 件 |
| 1 行実行コマンド | PASS | `mise exec -- pnpm --filter @ubm-hyogo/api test` |
| 実行前提 | PASS | repo root / `mise exec` / root `vitest.config.ts` |
| un-skip 不変条件 | PASS | rename-only で `test.describe.skip` 追加禁止 |
| CI gate 化 | PASS | 新規 workflow 追加なし。既存 `ci.yml` / `backend-ci.yml` / `pr-build-test.yml` の接続確認を Phase 11 で記録 |
| coverage 判定 | PASS | coverage AC は対象外。rename 前後 delta 0 を Phase 11 で記録 |

## 4 条件

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 実 tree / Phase 11 / Phase 12 / aiworkflow を `implementation_completed` に統一 |
| 漏れなし | PASS | Phase 12 strict 7 files + ADR + Phase 11 raw evidence が存在し、aiworkflow 同期点も列挙済み |
| 整合性あり | PASS | taskType=`implementation` / visualEvidence=`NON_VISUAL` / state=`implementation_completed` を root artifacts と本文で統一 |
| 依存関係整合 | PASS | UT-08A-06 → Issue #325 successor traceを親 inventory と aiworkflow に反映 |

## 未完了境界

PR 作成のみ未実行である。実 rename、typecheck、lint、api test は Phase 11 evidence に保存済み。

## artifacts parity

本 workflow は root `artifacts.json` を正本とし、Phase 1-12 を `completed`、Phase 13 を `pending` として記録する。`outputs/artifacts.json` はこの workflow では生成対象に含めない。

---

## Canonical 9-heading SSOT compliance

以下は `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` の Required Sections SSOT に対応する canonical heading セクション。既存の日本語セクションは archival として保持し、verify-phase12-compliance CI gate 互換のため canonical 形式を追加する。

## Summary verdict

`implementation_completed (Issue #623 二段階対応終了で完了)`. rename / vitest.config 収斂 / lefthook gate / verify-test-suffix.yml すべて完了。

## Changed-files classification

| Area | Classification | Result |
| --- | --- | --- |
| rename | implementation_completed | 132+ files renamed `*.test.{ts,tsx}` → `*.spec.{ts,tsx}` |
| vitest.config | implementation_completed | `test.include` を `*.spec.{ts,tsx}` 単一に収斂 |
| hook / CI | implementation_completed | `block-test-suffix.sh` + `verify-test-suffix.yml` 追加 |

## `workflow_state` and phase status consistency

`metadata.workflow_state=implementation_completed`、Phase 1-12 `completed`、Phase 13 `pending`（PR creation のみ user-gated）。

## Phase 11 evidence file inventory

Phase 11 raw evidence は `outputs/phase-11/` に存在。rename before/after diff、numTotalTests parity、coverage delta 0 を記録。

## Phase 12 strict 7 file inventory

`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` の 7 件はすべて存在。

## Skill/reference/system spec same-wave sync

`.claude/skills/aiworkflow-requirements/{SKILL-changelog.md,indexes/*}`、`.claude/skills/task-specification-creator/SKILL-changelog.md`、`CLAUDE.md §重要な不変条件 8`、`outputs/phase-12/test-file-suffix-adr.md` を同一 wave で反映済み。

## Runtime or user-gated boundary

Phase 13 PR 作成のみ user-gated。実 rename / typecheck / lint / api test の local evidence は Phase 11 に保存済み。

## Archive/delete stale-reference gate

archive 移動済み（`completed-tasks/issue-325-test-suffix-rename-migration/`）。stale reference は successor task Issue #623 inventory に migrate 済み。

## Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | 実 tree / Phase 11 / Phase 12 / aiworkflow を `implementation_completed` に統一 |
| 漏れなし | PASS | strict 7 + ADR + Phase 11 raw evidence + aiworkflow 同期点を列挙 |
| 整合性あり | PASS | taskType=`implementation` / visualEvidence=`NON_VISUAL` / state=`implementation_completed` を統一 |
| 依存関係整合 | PASS | UT-08A-06 → Issue #325 → Issue #623 successor trace を inventory + aiworkflow に反映 |
