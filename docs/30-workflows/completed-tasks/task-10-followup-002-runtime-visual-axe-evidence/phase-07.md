# Phase 7: カバレッジ確認

[実装区分: 実装仕様書]

## 目的

本タスクは test tooling 追加が主体であり primitive 実装 coverage には影響しない。harness page と spec の test 経由実行率を確認し、レグレッション無きことを示す。

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- --coverage
```

## 観点

| 項目 | 期待 |
| --- | --- |
| `apps/web/src/components/ui/**` の coverage | 親 spec task-10 で固定済みの閾値（Statements ≥ 80 / Branches ≥ 80 / Functions ≥ 80 / Lines ≥ 80）から低下しないこと |
| 新規 harness page | unit test 不要（visual evidence で代替）。coverage 算入対象外として `vitest.config` の exclude に `apps/web/app/(dev)/**` を追加（既存 exclude pattern と整合） |

## 変更対象（必要なら）

- `apps/web/vitest.config.ts`: coverage exclude に `src/app/(dev)/**` を追加

exclude 追加が必要なら適用済み- [ ] coverage 閾値を下回らない
- [ ] exclude 追加が必要なら適用済み

## Validator Compliance Sections

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 07 |
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
