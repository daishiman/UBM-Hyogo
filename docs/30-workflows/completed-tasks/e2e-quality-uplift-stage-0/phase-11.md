# Phase 11: 手動テスト / 視覚 evidence（Stage 0）

date (absolute): 2026-05-09 / branch: `feat/e2e-quality-uplift` / PR base: `dev` / coverageTier: `standard`

---

## 1. NON_VISUAL タスク宣言

| 項目 | 値 |
| --- | --- |
| task classification | implementation / NON_VISUAL |
| UI / UX 変更 | **なし** |
| スクリーンショット必要性 | **不要** |
| `outputs/phase-11/` 画像配置 | **なし**（PR 本文にスクリーンショット項目を作らない） |

**結論**: UI/UX 変更なし、Phase 11 スクリーンショット不要。

---

## 2. 代替証跡（L1 docs-grep / L2 lint-boundary / L3 type）

NON_VISUAL タスクの evidence は以下 3 層で構成する。本サイクルでは実ファイル差分に対する list smoke / grep / typecheck / lint を evidence として保存する。full browser E2E 実行 PASS は主張しない。

### L1 docs-grep（本 PR 範囲で実施可能）

| ID | コマンド | 期待 |
| --- | --- | --- |
| L1-a | `grep -nE "^# Phase " docs/30-workflows/e2e-quality-uplift-stage-0/phase-*.md \| wc -l` | 13 hit（phase-1〜13） |
| L1-b | `grep -n "evidence-capture" docs/30-workflows/e2e-quality-uplift-stage-0/phase-*.md \| wc -l` | 5 hit 以上（phase-1/2/4/5/8 で参照） |
| L1-c | `grep -n "R1" docs/30-workflows/e2e-quality-uplift-stage-0/phase-4.md` | 「案 A」「evidence-only spec rename/extract」が同節内に出現 |

### L2 lint-boundary（本 PR では evaluate のみ、CI 化は本サイクル）

| ID | コマンド | 期待 |
| --- | --- | --- |
| L2-a | `find docs/30-workflows/e2e-quality-uplift-stage-0 -name 'phase-*.md' -exec wc -l {} \;` | 全行数 <= 350 |
| L2-b | `git status --short -- apps/web/playwright apps/web/package.json apps/web/playwright.config.ts` | apps/web Playwright 実差分あり（本サイクル対象） |
| L2-c | `git status --short -- .claude/skills/task-specification-creator .claude/skills/aiworkflow-requirements` | task-specification-creator と aiworkflow-requirements の同期差分あり（本サイクル対象） |

### L3 Preload API / 型定義テスト結果

本タスクは `apps/web` の Playwright 設定・spec・README を touch する。Preload API（IPC Bridge）も対象外。型定義テストは:

| 観点 | 結果 |
| --- | --- |
| `apps/web/src/lib/env.ts` `getEnv()` / `getPublicEnv()` | 影響なし |
| `apps/api` Hono routes | 影響なし |
| `@repo/shared` 型 | 影響なし |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | Phase 11 evidence として実行対象 |

---

## 3. phase-10 final-review-result の引用

Phase 10 §4 の verdict が本 phase の主たる evidence:

| 項目 | 結果 |
| --- | --- |
| AC 達成 | 5/5 |
| blocker | 0 |
| Stage 0b GO/NO-GO | GO |
| Stage 0c GO/NO-GO | GO |

→ NON_VISUAL 代替証跡として Phase 13 PR 本文に Phase 10 verdict を要約引用する。

---

## 4. Phase 11 完了条件

- UI/UX 変更なし宣言 ✓
- L1 / L2 / L3 代替証跡定義と `outputs/phase-11/evidence/` 保存 ✓
- phase-10 final-review-result 引用方針 ✓
- スクリーンショット不要の justification ✓
- full runtime E2E は未主張、list smoke のみ PASS と明記 ✓

→ Phase 12 へ。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-0
- phase: 11
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: verified

## 目的

Stage 0 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
