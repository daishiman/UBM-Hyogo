---
phase: 13
title: PR 作成
workflow_id: register-page-prototype-alignment
status: draft
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 13 — PR 作成

[実装区分: 実装仕様書]

## 1. base ブランチ

- **base = `dev`**（CLAUDE.md 既定）。`main` への PR は production リリース時のみで本 PR では使用しない。
- ブランチ: `feat/register-page-prototype-alignment`

## 2. pre-flight（実行コマンド）

```bash
git fetch origin dev
git merge origin/dev   # conflict があれば CLAUDE.md「sync-merge」方針で解消
mise exec -- pnpm install --force
mise exec -- pnpm --filter web typecheck
mise exec -- pnpm --filter web lint
mise exec -- pnpm --filter web test -- src/components/public
mise exec -- pnpm --filter web build
bash scripts/verify-pr-ready.sh
```

全 green を Phase 10 と二重確認した上で次に進む。

## 3. PR タイトル案

- `feat(register): /register をプロトタイプ整合 (Hero CTA / StepGrid / collapsible / FAQ / Bottom CTA)`

## 4. PR 本文骨子

```markdown
## Summary

/register ページを `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` の `MemberFormPage` (L68-217) に整合させる UI 再構築。既存 API surface・D1 binding には変更を加えず、`apps/web` の 5 セクション構造で再構築する。

- Hero CTA: RegisterHeroCallout を Chip eyebrow + serif heading + 大型 Primary Button に刷新
- StepGrid: 登録 3 ステップを新規 RegisterStepGrid で表示
- FormPreviewSections: `<details>` collapsible + 集計 Chip
- FAQ: 新規 RegisterFaq
- Bottom CTA: 新規 RegisterBottomCTA (inverted variant)

## Invariants

- 不変条件 #2 維持: `publicConsent` / `rulesConsent` 文字列を Hero 内に保持
- 不変条件 #7 維持: 全 CTA `target="_blank"` + `rel="noopener noreferrer"`
- UI-PA #2 維持: HEX 直書き 0 件（grep gate）
- UI-PA #4 維持: `apps/web` から D1 binding 変更なし

## Changed files

- 編集: `apps/web/app/(public)/register/page.tsx`
- 編集: `apps/web/src/components/public/RegisterHeroCallout.tsx`
- 編集: `apps/web/src/components/public/FormPreviewSections.tsx`
- 新規: `apps/web/src/components/public/RegisterStepGrid.tsx`
- 新規: `apps/web/src/components/public/RegisterFaq.tsx`
- 新規: `apps/web/src/components/public/RegisterBottomCTA.tsx`
- 新規/編集: 上記対応 spec 5 ファイル
- 仕様書: `docs/30-workflows/completed-tasks/register-page-prototype-alignment/phase-1..13.md` + `outputs/phase-12/`

## Test plan

- [x] typecheck / lint / unit test all green
- [x] HEX grep gate = 0 件
- [x] `scripts/verify-pr-ready.sh` success
- [ ] 手動 QA（Phase 11）evidence は `outputs/phase-11/` 参照

## Screenshots

`outputs/phase-11/` 配下の以下を本文に貼付:

- `register-desktop.png`
- `register-mobile.png`
- `register-preview-error.png`
- `register-faq-open.png`
- `register-dark.png`

evidence が無い場合はスクリーンショット節を作らない（CLAUDE.md PR-flow 既定）。

## Related

- workflow dir: `docs/30-workflows/completed-tasks/register-page-prototype-alignment/`
- prototype 正本: `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` L68-217
```

## 5. 作成コマンド

```bash
gh pr create --base dev --title "feat(register): /register をプロトタイプ整合 (Hero CTA / StepGrid / collapsible / FAQ / Bottom CTA)" --body "$(cat <<'EOF'
...上記本文...
EOF
)"
```

## 6. user-gated 境界（CONST_002）

- commit / push / `gh pr create` は **ユーザー明示承認後のみ** 実行。
- 本仕様書は spec 作成のみで、実装・コミット・PR は別タスク（user-gated）として扱う。

## 7. 完了報告フォーマット

PR 作成後、以下を 1 回だけ報告:

- PR URL
- 採用ブランチ（feat/register-page-prototype-alignment → dev）
- 実行した自動修復（あれば）
- 解消したコンフリクト（あれば）
- 残課題 / followup（unassigned-task-detection に列挙したもの）
