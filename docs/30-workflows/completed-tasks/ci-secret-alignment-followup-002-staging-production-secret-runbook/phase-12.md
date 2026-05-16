# Phase 12: コンプライアンスチェック・skill feedback

## 目的

task-specification-creator と aiworkflow-requirements への準拠を最終確認する。

## Phase 12 Required Sections（task-specification-creator skill v2026.05.11 SSOT）

| # | セクション | 本タスク該当ファイル | 状態 |
|---|----------|---------------------|------|
| 1 | main | `outputs/phase-12/main.md` | completed |
| 2 | implementation-guide | `outputs/phase-12/implementation-guide.md` | completed |
| 3 | phase12-task-spec-compliance-check | `outputs/phase-12/phase12-task-spec-compliance-check.md` | completed |
| 4 | system-spec-update-summary | `outputs/phase-12/system-spec-update-summary.md` | completed |
| 5 | skill-feedback-report | `outputs/phase-12/skill-feedback-report.md` | completed |
| 6 | unassigned-task-detection | `outputs/phase-12/unassigned-task-detection.md` | completed |
| 7 | documentation-changelog | `outputs/phase-12/documentation-changelog.md` | completed |
| 8 | artifacts.json | `artifacts.json` / `outputs/artifacts.json` | completed |
| 9 | aiworkflow register | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` / `references/task-workflow-active.md` / `indexes/quick-reference.md` / `indexes/resource-map.md` | completed |

> Phase 12 完了時点で 1〜8 をすべて作成し、CI gate `verify-phase12-compliance` 相当の 9 見出しチェックを満たす。

## taskType / visualEvidence / implementation category

| 項目 | 値 |
|------|---|
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| implementationCategory | `docs_plus_script_fix` |
| workflow_state（spec_created 時） | `spec_created` |
| workflow_state（実装完了時） | `completed` |
| workflow_state（evidence 不足時） | `runtime_pending` |

## dirty-code gate（最優先）

CONST_009 に従い、初期 docs-only 判定より実態を優先する。`apps/` / `packages/` / `.github/workflows/` の dirty diff は生まない。`scripts/smoke/provision-staging-secrets.sh` は stale CLI contract correction としてこの cycle 内に含める。

```bash
git status --porcelain apps/ packages/ .github/workflows/
# 期待: 出力 0 行
bash -n scripts/smoke/provision-staging-secrets.sh
# 期待: exit 0
```

## §99 必須項目 content check

```bash
# 1. 章立て一致を実コマンドで実行した evidence があるか
grep -nE 'g1-heading-diff' outputs/phase-12/main.md

# 2. 実値混入 0 件 grep gate を実行した evidence があるか
grep -nE 'g2-secret-literal-grep' outputs/phase-12/main.md

# 3. dirty-code gate (G5) を実行した evidence があるか
grep -nE 'g5-dirty-code' outputs/phase-12/main.md
```

3 件すべてヒットすること。

## placeholder token grep 0 件 gate

```bash
# runbook 本体禁止語: TODO / TBD / FIXME / XXX
grep -nE '\b(TODO|TBD|FIXME|XXX)\b' \
  docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md \
  docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/production-secret-provisioning.md \
  && echo "FAIL: placeholder remains" \
  || echo "OK"
```

spec 側は禁止語を本文 gate ではなく Phase 12 strict outputs の内容検査で扱う。runbook 本体（`staging-secret-provisioning.md` / `production-secret-provisioning.md`）には残してはいけない。

## governance mutation user gate（Phase 13）

本タスクの Phase 13 で発生する mutation は以下:
- `git commit`（spec ファイル群 + runbook 2 本 + 親 index 編集）
- `git push`
- `gh pr create --base dev`

これらはすべて **ユーザー明示承認後** に実行する。AI エージェントによる先行実行禁止。`gh secret set` などの実 secret 投入は本タスクでは行わない（runbook 文書化のみ）。

## skill feedback（task-specification-creator skill への反映候補）

| 内容 | 反映先 | 必須度 |
|------|--------|-------|
| 「close 済 Issue の対象成果物が未作成のままだった場合の formalize パターン」 | `references/closed-issue-formalization.md`（新規）または `references/task-type-decision.md` | 検討 |
| 「runbook ファミリ並立構成（template + N 派生）の章立て一致 gate」 | `references/phase-template-phase11.md` の NON_VISUAL evidence guide | no-op（既存 Phase 11 grep evidence pattern で代替可能。今回の知見は本 spec の Phase 6/11 に閉じる） |

> 上記は必須反映ではなく、本タスク完了後の skill feedback で判断する。

## skill 同期対象

- task-specification-creator skill: 更新不要（既存 docs-only → code 再判定パターンで十分）
- aiworkflow-requirements skill: 同一 wave で `deployment-secrets-management.md` / `task-workflow-active.md` / `quick-reference.md` / `resource-map.md` / `topic-map.md` / `keywords.json` / changelog / `SKILL-changelog.md` を同期済み

## 完了条件

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 12 |
| 状態 | completed |

## 実行タスク

- Phase 12 strict 7 と 9 見出し compliance を確認する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`

## 成果物/実行手順

- `outputs/phase-12/*`

## 統合テスト連携

- NON_VISUAL のため runtime deploy smoke は実行せず、Phase 11 static evidence と `bash -n` を根拠にする。

- Required Sections 9 項目の予定 path が定義されている
- dirty-code gate / script syntax gate / placeholder gate / §99 content check が定義されている
- governance mutation user gate が Phase 13 に紐付いている
- skill feedback 候補が記録されている
