# 2026-05-07 UI prototype alignment task-21 Admin Blueprint 09g

## Summary

UI prototype alignment / MVP recovery の task-21（W2: admin 8 routes screen blueprint 正本化）を aiworkflow-requirements / task-specification-creator skill に同期した。`09g-screen-blueprints-admin.md` の repair（1779→906 行）と admin shell / 派生 4 画面の構造 contract 化に伴い、indexes 同期と派生ルール正本転記の判定基準を skill body へ取り込んだ。

## Synced Facts

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-21-w2-screen-blueprints-admin/` |
| status | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| blueprint 正本 | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` |
| 対象 | admin 8 routes + AdminSidebar contract |
| source | `claude-design-prototype/pages-admin.jsx`, `ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` |
| runtime boundary | apps/packages code 変更なし。既存 admin API endpoint surface のみ参照。screenshot 不要 |
| downstream | task-15 / task-16 / task-17 admin implementation |

## Updated Indexes & References

- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` — task-21 row 追加
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` — current canonical set 追加
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` — W2 task-21 状態を active guide に明記
- `.claude/skills/aiworkflow-requirements/references/spec-guidelines.md` — UI prototype alignment docs-only workflow の skill indexes 同期判定基準テーブル追加（skill-feedback-report.md 提案 2 取り込み）
- `.claude/skills/task-specification-creator/references/phase-template-core.md` — 派生ルール正本転記計画を Phase 2 必須セクションとして追加（skill-feedback-report.md 提案 1 取り込み）

## Lessons Learned (苦戦箇所)

- プロトタイプ掲載 4 画面と未掲載 4 画面が混在する場合、「JSX 一字一句転記」のような表現は派生 4 画面で不整合を生む。**構造 contract 転記 / 派生注記固定形 / 新 primitive 禁止** をタスク仕様の Phase 2 で明示しないと AC-1〜9 の repair に発散する。phase-template-core に派生ルール正本転記計画を追加することで再発を抑止。
- docs-only workflow でも、後続実装 task の一次導線になる場合は same-wave で `quick-reference` / `resource-map` / `task-workflow-active` を更新する。判定基準が属人的だったため `spec-guidelines.md` に明文化。
- AdminSidebar のような全画面共通要素は §1 集約（重複記述禁止）で行数を制御する。§2〜§N 各画面 §X.1 から back-link するだけで AC-2 / 行数 AC-1 の両方を満たせる。

## Verification

- `pnpm indexes:rebuild` PASS（topic-map / keywords.json 再生成）
- `validate-structure.js` PASS（既存 warning は task-21 起因ではない）
- root `artifacts.json` parity = `root_only`、`outputs/artifacts.json` 不在
- Phase 12 strict 7 files 全 PASS（`outputs/phase-12/phase12-task-spec-compliance-check.md`）
- 視覚値 0 件（HEX / OKLch 値 / px / 任意値クラス）
