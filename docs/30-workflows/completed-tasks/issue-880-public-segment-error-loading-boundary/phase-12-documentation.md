---
phase: 12
title: ドキュメント同期 / Compliance Check
workflow_id: issue-880-public-segment-error-loading-boundary
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 12 — ドキュメント同期 / Compliance Check

[実装区分: 実装仕様書]

## 1. 必須成果物（Phase 12 strict 7 + canonical 9 headings）

`outputs/phase-12/` に strict 7 を作成する:

1. `main.md`
2. `implementation-guide.md`
3. `system-spec-update-summary.md`
4. `documentation-changelog.md`
5. `unassigned-task-detection.md`
6. `skill-feedback-report.md`
7. `phase12-task-spec-compliance-check.md`

`phase12-task-spec-compliance-check.md` は task-specification-creator の
canonical heading SSOT に合わせ、以下 9 見出しを逐語で使う:

1. `## Summary verdict`
2. `## Changed-files classification`
3. `## \`workflow_state\` and phase status consistency`
4. `## Phase 11 evidence file inventory`
5. `## Phase 12 strict 7 file inventory`
6. `## Skill/reference/system spec same-wave sync`
7. `## Runtime or user-gated boundary`
8. `## Archive/delete stale-reference gate`
9. `## Four-condition verdict`

独自見出し（例: `## 概要` / `## Phase 11 evidence 表`）は CI parser に拾われないため使わない。

## 2. 中学生レベル概念説明（必須セクション）

`implementation-guide.md` に「中学生でも分かる概要」を含める:

```markdown
## なぜこの変更が必要か（中学生レベル説明）

ウェブサイトには「エラーが起きた時に表示する画面」と「データを読み込んでいる間に表示する画面」が必要です。

このサイトには 3 つのエリア（一般向け / 会員向け / 管理者向け）があるのですが、
今は **一般向けエリア専用** のエラー画面と読み込み画面がありません。
代わりに「サイト全体共通」の画面が表示されるので、
たとえばエラー時に「一覧ページに戻る」ボタンが出せず、ユーザーが迷子になる可能性があります。

今回の作業で、一般向けエリア専用の画面を 2 つ新しく作って、
「会員一覧へ戻る」「トップへ戻る」というボタンを出せるようにします。
```

## 3. serial-06 への backfill

`docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-12-compliance-check.md` の末尾に、Phase 5 §0 precondition drift 解消の note を追記（Phase 5 Step 5 で実施）。

## 4. unassigned-task ファイルの扱い

| ファイル | アクション |
|---------|-----------|
| `docs/30-workflows/unassigned-task/serial-06-followup-001-public-segment-error-loading-boundary.md` | `issue_number: TBD` → `880` に更新。Phase 13 commit 完了後、`docs/30-workflows/completed-tasks/issue-880-public-segment-error-loading-boundary/` への移動を user-gated step とする |

Phase 12 段階では物理移動しない。実装完了は source trace に consumed として記録し、`completed-tasks/` への物理移動は PR merge 後の closeout で行う。

## 5. Indexes 同期

```bash
mise exec -- pnpm indexes:rebuild
git diff --quiet .claude/skills/aiworkflow-requirements/indexes || echo "drift detected"
```

drift が出た場合は同 PR に含める（CI `verify-indexes-up-to-date` 対策）。

## 6. Stale 参照 grep

```bash
grep -rn 'serial-06-followup-001' docs/30-workflows/ .claude/ \
  | grep -v 'completed-tasks' \
  | grep -v 'issue-880-public-segment-error-loading-boundary'
```

残った参照を Phase 12 で補修する。

## 7. system spec 更新の有無

| 対象 | 更新有無 | 理由 |
|------|---------|------|
| `docs/00-getting-started-manual/specs/*.md` | なし | API / DB / Form schema に変更なし |
| CLAUDE.md | なし | 不変条件・運用ポリシーに変更なし |
| `.claude/skills/aiworkflow-requirements/` | indexes のみ rebuild | 仕様変更なし |

`documentation-changelog.md` と `system-spec-update-summary.md` は「no system spec change」で同結論。

## 8. Gate metadata 更新タイミング

| Gate | 更新条件 |
|------|---------|
| Gate-A | Phase 12 完了時 `passed` |
| Gate-B | Phase 11 evidence 取得完了時 `passed`（実装完了） |
| Gate-C | PR merge 後（user-gated） |
