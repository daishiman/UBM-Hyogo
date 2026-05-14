# Phase 3: 設計レビューゲート

[実装区分: 実装仕様書]

## 目的

Phase 1-2 の出力をレビューし、Phase 4 以降の実装に進めるかを判定する。

## レビュー観点

| 観点 | 判定基準 |
| --- | --- |
| scope 整合 | 11 primitive × 代表 variant 以外の対象が混入していない |
| AC 充足 | AC-1〜AC-9 が Phase 2 の設計で網羅されている |
| 既存資産再利用 | 既存 `playwright.config.ts` の evidence dir 分岐パターンを踏襲している |
| 副作用最小 | primitive 実装ファイル・token 定義を変更しない |
| production safety | harness page が production runtime で到達不能にする gate が二重化されている |
| 親 spec 同期 | `task-10-ui-primitives-spec/outputs/phase-11/main.md` 更新方針が明文化されている |

## エスカレーション条件

- axe violations が allowlist で吸収できない数になりそうな場合 → user 確認
- harness page を production にも露出する判断になった場合 → user 確認
- evidence dir 命名規約を既存と変える必要が出た場合 → user 確認

未解決のエスカレーション項目なし- [ ] 全レビュー観点が PASS 判定
- [ ] 未解決のエスカレーション項目なし

## Validator Compliance Sections

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 03 |
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
