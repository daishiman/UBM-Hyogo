# Phase 12 main

## Summary

このサイクルでは `register-page-prototype-alignment` を `spec_created /
implementation / VISUAL_ON_EXECUTION` として正式登録する。`docs/00-getting-started-manual/
claude-design-prototype/pages-member.jsx` の `MemberFormPage` 構成と現 `/register` ページの
乖離を Phase 1-13 仕様書として記述し、Phase 12 strict 7 outputs を canonical 命名で配置する。

実装コード変更・Playwright evidence 取得は後続 Phase 5-11 の責務であり、本 close-out 時点
では `spec_created` 状態に留める。

## Files synchronized

| File | Purpose |
| --- | --- |
| `index.md` | workflow エントリ（frontmatter + 実装区分 + 現状確認 + スコープ + 不変条件） |
| `artifacts.json` | gate / phase / implementation targets の正本 |
| `outputs/phase-12/main.md` | 本ファイル。close-out 概要 |
| `outputs/phase-12/implementation-guide.md` | canonical 9 headings 実装ガイド |
| `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements / system spec sync 判定 |
| `outputs/phase-12/documentation-changelog.md` | ドキュメント変更履歴 |
| `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（0 件） |
| `outputs/phase-12/skill-feedback-report.md` | スキル feedback routing |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9-section compliance check |
| `outputs/phase-11/README.md` | Phase 11 evidence placeholder |

## Boundary

- 実装コード変更 / Playwright evidence 取得 / axe 結果 / screenshot 取得は Phase 5-11 で実施。
- commit / push / PR / GitHub issue 発行は user-gated。

## Next actions

1. Phase 5 実装手順に従い `apps/web/src/components/public/` に新規 primitive を追加し、
   `apps/web/app/(public)/register/page.tsx` を組替える。
2. Phase 11 で Playwright + axe 実行し evidence を `outputs/phase-11/` に配置する。
3. Phase 12 compliance check を `implemented_local_evidence_captured` に更新する。
4. user 承認後に Phase 13 で commit / push / PR を作成する。
