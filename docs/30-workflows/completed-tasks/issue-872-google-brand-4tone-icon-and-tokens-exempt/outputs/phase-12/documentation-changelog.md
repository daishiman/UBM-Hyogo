**[実装区分: 実装仕様書 / 状態: spec_created]**

# Documentation changelog

issue #872 [FU-LOGIN-001] サイクルで追加・更新するドキュメント全量。Step 1-A / 1-B / 1-C / Step 2 / workflow-local / global skill sync をブロック分離で記録する。

## Block: Step 1-A (完了タスク記録)

| path | 変更 | 内容 |
|------|------|------|
| `docs/30-workflows/LOGS.md` | 追記 1 行 | `issue-872-google-brand-4tone-icon-and-tokens-exempt — FU-LOGIN-001 consumed / 4-tone GoogleBrandIcon + verify-design-tokens brandIconExemptPaths` |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | 追記 1 行 | 上記同等 |

## Block: Step 1-B (実装状況テーブル)

| path | 変更 | 内容 |
|------|------|------|
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | entry 追加 | workflow_id / 状態 (`spec_created` → 実装後 `implemented_local_visual_evidence_captured`) |
| 本 workflow の `artifacts.json#workflow_state` | 状態 transition | `spec_created` → `implemented_local_visual_evidence_captured` (Phase 11 完了後) |

## Block: Step 1-C (関連タスク FU-LOGIN-001 consumed)

| path | 変更 | 内容 |
|------|------|------|
| `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` | 1 行更新 | FU-LOGIN-001 行に `consumed (issue-872)` 表記追加 |
| `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-001-google-brand-4tone-icon.md` | frontmatter + 本文更新 | `status: consumed` / `canonical_workflow: docs/30-workflows/issue-872-google-brand-4tone-icon-and-tokens-exempt/` |

## Block: Step 2 (正本 spec 反映)

| path | 変更 | 内容 |
|------|------|------|
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | 新章追加 | `## Brand-asset exempt` (path-glob exempt の対象範囲 / 2 層 exempt 設計 / `brandIconExemptPaths` 定義場所 / `brandTokenPrefixes` reserved) |

## Block: 本サイクル内 workflow-local 追加 (本仕様書群)

| path | 内容 |
|------|------|
| `outputs/phase-1/phase-1.md` | スコープ・実装モード・既存実装インベントリ |
| `outputs/phase-2/phase-2.md` | 設計詳細 (GoogleBrandIcon API / SVG path / exempt allowlist 設計) |
| `outputs/phase-3/phase-3.md` | AC / 依存関係 / 変更マップ |
| `outputs/phase-4/phase-4.md` | 実装ガイド本体 |
| `outputs/phase-5/phase-5.md` | 実装順序・依存グラフ |
| `outputs/phase-6/phase-6.md` | ローカル動作確認手順 |
| `outputs/phase-7/phase-7.md` | エラーハンドリング / エッジケース |
| `outputs/phase-8/phase-8.md` | ユニット / コンポーネントテスト仕様 (`verify-design-tokens.spec.ts` 拡張含む) |
| `outputs/phase-9/phase-9.md` | E2E + visual regression 仕様 |
| `outputs/phase-10/phase-10.md` | 最終レビュー (AC judge 計画) |
| `outputs/phase-11/phase-11.md` + `screenshot-plan.json` | Evidence 取得仕様 (VISUAL 3 層) |
| `outputs/phase-12/main.md` | Phase 12 集約 entry |
| `outputs/phase-12/implementation-guide.md` | PR / レビュー entry (Part 1 中学生 + Part 2 技術者) |
| `outputs/phase-12/system-spec-update-summary.md` | 正本 spec への影響まとめ |
| `outputs/phase-12/documentation-changelog.md` | 本ファイル |
| `outputs/phase-12/unassigned-task-detection.md` | follow-up 候補の妥当性確認 |
| `outputs/phase-12/skill-feedback-report.md` | skill feedback 候補 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 headings compliance |
| `outputs/phase-13/phase-13.md` | PR 作成手順 |
| `artifacts.json` / `index.md` | workflow メタ |

## Block: Global skill sync (same-wave)

| path | 変更 |
|------|------|
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 本 workflow 1 行追記 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 本 workflow root 追記 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `pnpm indexes:rebuild` で再生成 (drift 解消) |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 同上 (rebuild) |

## Block: 実コード (本 documentation-changelog からは列挙のみ。git 履歴が正本)

| path 群 | 種別 |
|---------|------|
| `apps/web/src/components/ui/brand-icons/google.svg` | 新規 |
| `apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx` | 新規 |
| `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` | 編集 |
| `apps/web/src/components/ui/icons.ts` | 編集 |
| `apps/web/src/components/ui/Icon.tsx` | 編集 |
| `scripts/verify-design-tokens.ts` | 編集 |
| `scripts/verify-design-tokens.spec.ts` | 編集 |
| `apps/web/playwright/tests/visual/login.spec.ts-snapshots/login-visual-chromium-linux.png` | baseline 更新 |

実コードの changelog は git 履歴で管理し、本ファイルでは block 分離記録のみ (skill `references/phase12-skill-feedback-promotion.md` 準拠)。

## 次 Phase への引き継ぎ

Phase 13 で全 block を同 PR 内で commit。`indexes:rebuild` drift は push 前に解消。
