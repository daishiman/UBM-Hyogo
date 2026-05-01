# task-task-spec-creator-e2e-template-hardening-001

## 概要

08b Playwright E2E scaffold の Phase 12 skill-feedback で挙がった `task-specification-creator` skill への改善 F-1 / F-2 / F-4 を、`references/` 配下のテンプレートに formalize する。F-5（taskType 細分化）は適用済み（`task-type-decision.md` に `scaffolding-only` / `VISUAL_DEFERRED` 反映済）。本タスクは残りの High/Medium 提案をテンプレ化することを目的とする。

## 苦戦箇所【記入必須】

08b 仕様書作成時に、page object 命名規約（`{Domain}{Role}Page.ts`）/ screenshot 命名規約（`{viewport}/{screen}-{state?}.png`）/ fixture 分離パターン（`adminPage / memberPage / unregisteredPage`）/ a11y rule tag matrix（wcag2a/wcag2aa/wcag21a/wcag21aa）/ browser matrix / viewport matrix を都度 Phase 5 / 8 / 9 で個別記述した。skill resource にデフォルトテンプレが無いため、新規 E2E task を立ち上げるたびに同一規約を再発明している。

## スコープ（含む/含まない）

含む:

- `task-specification-creator/references/` への以下追加:
  - `phase-template-e2e-conventions.md`（F-1: page object / screenshot / fixture 命名規約のデフォルトテンプレ）
  - `phase-template-a11y-browser-viewport-matrix.md`（F-2: Phase 9 a11y / browser / viewport matrix のデフォルト値: wcag2.1 AA + critical/serious + chromium+webkit + 1280x800/390x844）
  - `phase-template-evidence-path-checklist.md`（F-4: Phase 11 evidence path → CI workflow yml `path:` 同期チェックリスト）
- `SKILL.md` の Phase 5 / 8 / 9 / 11 セクションから上記 references への導線追加
- `references/task-type-decision.md` との整合性確認

含まない:

- F-3（external nav 観測）/ F-6（screenshot 集計テンプレ）の formalize（Medium / Low のため後続別タスク）
- 既存 task 仕様書への retroactive 適用（既存タスクは現状維持）
- aiworkflow-requirements skill 側の同期（task-specification-creator が source of truth）

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 過度に画一化して E2E 以外の task に適用される | `phase-template-e2e-*` prefix で E2E 専用と明示し、Phase 5 / 8 / 9 セクションで「E2E task の場合のみ参照」と条件分岐 |
| デフォルト値が project 固有値（chromium+webkit / 1280x800）に固定化される | テンプレ内で「default」と明記し、project 側で override 可と注記 |
| 既存 08b 仕様書との不整合 | 08b は `scaffolding-only` で完了済みのため retroactive 反映しない。新規 E2E task からのみ適用 |

## 検証方法

```bash
# テンプレ追加後の skill 構造検証
node .claude/skills/task-specification-creator/scripts/generate-index.js

# 新規 E2E task 仕様書を試作し、テンプレ参照導線が機能することを確認
ls .claude/skills/task-specification-creator/references/phase-template-*.md

# aiworkflow-requirements との重複・矛盾がないことを確認
grep -r "page object" .claude/skills/aiworkflow-requirements/references/ | wc -l
```

## 参照

- `docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-12/skill-feedback-report.md`（F-1〜F-6 改善提案の正本）
- `.claude/skills/task-specification-creator/references/task-type-decision.md`（F-5 適用済の参照モデル）
- `.claude/skills/aiworkflow-requirements/references/testing-playwright-e2e.md`（08b で確立した実装側規約）
- 関連未タスク: `task-task-spec-creator-phase12-compliance-rules-001.md`（Phase-12 必須セクションルール）

## 委譲先 / 実行条件

- 委譲先: skill 改善 wave（aiworkflow-requirements / task-specification-creator のテンプレ整備タスク群）
- 実行条件: 09a / 09b の E2E full-execution task 着手前に formalize 完了していること（後続 E2E task が再発明せず参照できる状態）
- 緊急度: High（F-1 / F-2 が High、F-4 が Medium）
