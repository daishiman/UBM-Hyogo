# Phase 13 PR 作成

## 状態

実装サイクル 2026-05-07 にて、フェーズ 1〜12 の実コード実装と outputs を完了。**コミット・PR 作成・push はユーザー指示に従う**ため、本フェーズではガイド作成のみとする（CONST_002 / セキュリティポリシー）。

## PR 作成時の正本

- title: `feat(post-release-30day): Issue #517 auto-summary foundation` または同等の `feat`/`chore` prefix
- body: `Refs #517, Refs #497, Refs #351`（`Closes` 不使用）
- base: `main`
- 仕様書: `docs/30-workflows/issue-517-followup-auto-summary-foundation/phase-13.md`

## 含む変更

- `.github/workflows/post-release-30day-auto-summary.yml`（新規）
- `scripts/post-release-dashboard/30day-summary.sh`（新規）
- `scripts/post-release-dashboard/lib/aggregate.sh`（新規）
- `scripts/post-release-dashboard/__tests__/30day-summary.test.sh`（新規）
- `scripts/post-release-dashboard/__tests__/fixtures/30day-summary/*`（新規 4 件）
- `scripts/post-release-dashboard/__tests__/run-all.sh`（編集）
- `scripts/post-release-dashboard/README.md`（編集）
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`（編集）
- `.claude/skills/aiworkflow-requirements/changelog/20260507-issue517-followup-auto-summary.md`（編集）
- `docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/**`（成果物 13 phase）
