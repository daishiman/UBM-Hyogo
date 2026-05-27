---
実装区分: 実装成果物
状態: implementation_reviewed
Phase: 12
作成日: 2026-05-26
task_id: public-dashboard-prototype-alignment
親: [../../phase-12-documentation.md](../../phase-12-documentation.md)
---

# Phase 12: ドキュメント同期 (本体サマリ)

本ファイルは Phase 12 strict 7 成果物の入口。各 strict 7 成果物の所在と完了条件を以下に集約する。

## strict 7 成果物 一覧

| Task | Path | 完了条件 |
| --- | --- | --- |
| 12-0 | `main.md` (本書) | strict 7 入口 / 各成果物リンク |
| 12-1 | `implementation-guide.md` | Part 1 (中学生レベル) + Part 2 (技術詳細) |
| 12-2 | `system-spec-update-summary.md` | Step 1-A / 1-B / 1-C 判定 + Step 2 反映先 |
| 12-3 | `documentation-changelog.md` | 変更したドキュメント一覧 + 差分要約 |
| 12-4 | `unassigned-task-detection.md` | 0 件であっても明示 |
| 12-5 | `skill-feedback-report.md` | skill 利用上のフィードバック |
| 12-6 | `phase12-task-spec-compliance-check.md` | canonical 9 headings / Phase 11 evidence 表 / workflow root scan |

## 本サイクル要約

- 公開トップ `/` を prototype (`docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` L4-152) に整合させる実装仕様を作成
- 実装 wave の対象は 1 component 新規 (`AboutUbm`) / 4 component 改修 (Hero/Stats/Timeline/MemberGrid) / 1 CSS 追加 (`legacy-public.css`)
- API endpoint 追加なし / D1 schema 変更なし / OKLch token 整合のみ、という境界を仕様で固定
- 本レビューサイクルで `apps/web` 実装、component unit、Playwright evidence spec、mock API seed 制御を反映済み
- 静的検証は `pnpm --filter @ubm-hyogo/web test` / `verify-design-tokens` / `typecheck` / `verify:phase12-compliance` が PASS
- Phase 11 screenshot は `outputs/phase-11/screenshot-plan.json` と `public-dashboard-prototype-alignment.spec.ts` で実行可能化済み。ローカル Next dev の初回 compile が応答待ちになったため PNG 生成は runtime 再実行待ち

## 関連 Phase

- Phase 5-8: 実装 / リファクタ手順
- Phase 9: 静的検証計画 (typecheck / lint / build / verify-design-tokens / verify-pr-ready)
- Phase 10: GAP 解消マトリクスのレビュー計画
- Phase 11: 6 screenshot + 3 層評価の取得計画
- Phase 13: PR 作成 (user 明示承認後)

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 12
- workflow_state: `spec_created`
