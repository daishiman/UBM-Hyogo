# Phase 4: RED テスト

[実装区分: 実装仕様書]

## 目的

Playwright spec を先行追加し、harness page 未実装の段階で RED であることを確認する。

## 変更対象ファイル

- 新規: `apps/web/playwright/tests/ui-primitives-visual.spec.ts`
- 編集: `apps/web/playwright.config.ts`（`task-10-followup-002` evidence dir 分岐の追加）

## 手順

1. `apps/web/playwright/tests/ui-primitives-visual.spec.ts` を Phase 2 設計どおりに新規作成する。VARIANTS 配列は Phase 1 確定分を全件記述する。
2. `playwright.config.ts` に `isTask10Followup002Run` 判定と evidence dir 分岐を追加する。
3. 下記コマンドで RED 確認する：

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
PLAYWRIGHT_EVIDENCE_TASK=task-10-followup-002 \
  mise exec -- pnpm --filter @ubm-hyogo/web e2e \
  --project=desktop-chromium \
  ui-primitives-visual.spec.ts
```

4. 期待結果: `/primitives-harness` route が 404 になり全 test が fail。RED ログを `outputs/phase-04/red-result.txt` に保存。

RED ログが保存済み- [ ] spec が repo に存在
- [ ] config 分岐が追加済み
- [ ] RED ログが保存済み

## Validator Compliance Sections

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 04 |
| workflow | task-10-followup-002-runtime-visual-axe-evidence |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| state | runtime_pending |

## 実行タスク

- [ ] 本 Phase の本文に記載した task を実行する。
- [ ] 実行結果を該当 outputs path に保存する。
- [ ] runtime 未実行のものは completed と書かず runtime_pending と記録する。

## 参照資料

| 参照 | パス |
| --- | --- |
| workflow root | docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/ |
| parent workflow | docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/ |
| UI canonical | .claude/skills/aiworkflow-requirements/references/ui-ux-components.md |
| state vocabulary | .claude/skills/task-specification-creator/references/workflow-state-vocabulary.md |

## 成果物/実行手順

| 成果物 | 手順 |
| --- | --- |
| Phase output | 本文の command / checklist に従い outputs 配下へ保存する |
| Evidence | Phase 11 runtime 実行までは runtime_pending とする |

## 統合テスト連携

| 項目 | 値 |
| --- | --- |
| focused e2e | PLAYWRIGHT_EVIDENCE_TASK=task-10-followup-002 pnpm --filter @ubm-hyogo/web e2e --project=desktop-chromium ui-primitives-visual.spec.ts |
| local gates | typecheck / lint / token gate / artifacts parity |
| external gates | staging deploy / production smoke / commit / push / PR は user-gated |

## 完了条件チェックリスト

- [ ] 必須成果物 path が存在する。
- [ ] 状態語彙が canonical である。
- [ ] 未実行 runtime evidence を completed と表記していない。
