---
spec_classification: implementation_spec
state: spec_created
phase: 12
phase_name: ドキュメント
---

# Phase 12 — ドキュメント

親 workflow trace: followup-001 of `docs/30-workflows/admin-ui-prototype-alignment/`。

## 目的

strict 7 出力（`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）と aiworkflow-requirements skill 同期を完了させる。

## 前提と入力

- Phase 5〜11 完了
- `phase12-compliance-check-template.md`（canonical 9 headings + evidence inventory + 4-condition verdict）

## 作業手順

1. `outputs/phase-12/` 配下に strict 7 を物理配置
2. `implementation-guide.md` に Part 1〜11 を作成、各 Part に 3 行以上の本文 + 必須 key section 2 種以上
3. `phase12-task-spec-compliance-check.md` を canonical 9 見出しで作成、Phase 11 evidence 表 + workflow root scan を必ず含める
4. aiworkflow-requirements skill 側の同期: `quick-reference` / `resource-map` / `task-workflow-active` / `artifact-inventory` / `changelog` / `LOGS`
5. `mise exec -- pnpm verify:phase12-compliance` で green を確認

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`（canonical 9 見出し + Phase 11 evidence 表 + workflow root scan）
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件 (DoD)

- strict 7 がすべて物理ファイル存在
- `phase12-task-spec-compliance-check.md` の 9 見出しが逐語一致
- Phase 11 evidence inventory が `Classification / Path / Status` 3 列で記載
- workflow root scan セクションがある
- 4-condition verdict が記入されている

## 検証コマンド

```bash
mise exec -- pnpm verify:phase12-compliance
mise exec -- pnpm gate-metadata:validate
```

## 想定リスク

- canonical 9 見出しの逐語ずれ → CI fail → 本仕様 §作業手順 #3 を逐語コピー

## ロールバック

- strict 7 ファイル削除で戻し可

## 関連 spec

- `phase-11-manual-test.md`
- `phase-13-pr.md`
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`
