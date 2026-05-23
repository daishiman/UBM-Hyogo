# Lessons Learned: Issue #603 Phase 12 compliance-check CI gate (2026-05-11)

Classification: implementation / NON_VISUAL / Phase 13 pending_user_approval

## 苦戦点と回避策

### 1. canonical heading SSOT の循環同期リスク
- 症状: Required Sections 9項目を template / `load-canonical-headings.ts` / fixtures / test の4箇所に同期する必要があり、片方を更新すると他が drift する循環依存が発生しやすい。
- 回避策: SSOT を `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` 1箇所に限定し、script は markdown を runtime parse する設計に統一。fixtures は意図的に pass/fail を切り分けることで template 側の変更検知を保証。
- 教訓: heading SSOT を 1ファイルに集約し、検証側は読み取り専用 parser に閉じる。テストは構造的差分（heading 9個揃うか）と意図的 drift（fail fixture）の両建てで管理する。

### 2. `git diff --name-status` の D 行で workflow root false-positive
- 症状: 削除（`D`）された `docs/30-workflows/unassigned-task/*.md` を workflow root と誤認し、存在しない root への compliance check を要求してしまうケース。
- 回避策: `collect-changed-roots.ts` で `D` 行は workflow root 計算から除外し、かつ `unassigned-task/` 配下の単独削除は root 候補から外す。move の旧 root も deleted side として skip。
- 教訓: changed root 計算は「現存する root に到達するパス」のみを対象とする。move/rename/delete は old side を必ず除外する。

### 3. spec-only root の runtime evidence 不要判定
- 症状: `workflow_state=spec_created` の docs-only spec に対して runtime evidence（Phase 10/11 artifact）を要求すると、仕様策定段階で常時 fail する。
- 回避策: `verify-compliance-file.ts` は `outputs/phase-12/phase12-task-spec-compliance-check.md` の存在と canonical heading 9項目のみを判定境界とし、runtime artifact の有無は問わない。runtime gate は別 workflow に分離。
- 教訓: docs-only spec の workflow_state を判定境界に含め、runtime gate と heading structural gate は別レイヤに分離する。

### 4. workflow trigger paths の網羅性
- 症状: PR が `scripts/lib/phase12-compliance/` や fixtures、`package.json` の verify script、canonical template だけを変更した場合、gate 自身の変更が gate 検証対象から漏れる。
- 回避策: `.github/workflows/verify-phase12-compliance.yml` の `on.pull_request.paths` に `docs/30-workflows/**`、自 workflow、`package.json`、`scripts/verify-phase12-compliance.ts`、`scripts/lib/phase12-compliance/**`、`scripts/__tests__/verify-phase12-compliance.test.ts`、`scripts/__tests__/fixtures/phase12-compliance/**`、`.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` を網羅。
- 教訓: 自己検証する CI gate は「gate 自身 + SSOT + 検証実装 + fixtures + 起点 script」をすべて trigger paths に含める。

## 参照
- Artifact inventory: `references/workflow-issue-603-phase12-compliance-check-ci-gate-artifact-inventory.md`
- Workflow root: `docs/30-workflows/issue-603-phase12-compliance-check-ci-gate/`
- Changelog: `changelog/20260511-issue603-phase12-compliance-ci-gate.md`
