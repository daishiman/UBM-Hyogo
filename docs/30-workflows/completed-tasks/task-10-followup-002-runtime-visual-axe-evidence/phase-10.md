# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

## 目的

Phase 11 evidence 取得直前に、設計と実装の最終突合を行う。

## レビューチェック

- [ ] `apps/web/app/(dev)/` 配下のファイルが harness page と layout の 2 ファイルのみ
- [ ] `playwright.config.ts` 差分が evidence dir 分岐 1 箇所のみ
- [ ] Playwright spec が VARIANTS 配列ベースで全 primitive を網羅
- [ ] axe spec が JSON 出力を伴う
- [ ] coverage exclude が `vitest.config.ts` に追加済み（必要時）
- [ ] aiworkflow-requirements 正本との衝突なし

## エスカレーション

- 上記いずれかが NG の場合は Phase 5-8 へ戻す。
- axe で既存 token 起因の violations が想定外に大量発生する場合は user に判断を仰ぐ（allowlist 化 vs token 修正の別 task 化）。

全チェック ✓- [ ] 全チェック ✓

## Validator Compliance Sections

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
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
