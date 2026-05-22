# Phase 8: リファクタ

[実装区分: 実装仕様書]

## 目的

GREEN 後のコードを最小限の整理に留め、scope crawl を避ける。

## リファクタ観点

- VARIANTS 配列を `apps/web/playwright/tests/ui-primitives-visual.spec.ts` 内で `const` 固定。spec 外の lib 化はしない（テスト局所スコープ維持）。
- harness page 内の repetitive markup は配列駆動の map 化のみ許可。新規 wrapper component の抽出禁止。
- icon import の重複を除去。
- `KNOWN_ALLOWLIST` を export しない（spec 局所）。

## やらないこと

- primitive 本体の変更
- token / styles の変更
- 新規 util の作成
- 既存 helper の sign 変更

typecheck / lint / test / e2e すべて PASS- [ ] diff が harness page、Playwright spec/config、workflow evidence/docs、aiworkflow 正本同期に収まっている
- [ ] typecheck / lint / test / e2e すべて PASS

## Validator Compliance Sections

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 08 |
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
