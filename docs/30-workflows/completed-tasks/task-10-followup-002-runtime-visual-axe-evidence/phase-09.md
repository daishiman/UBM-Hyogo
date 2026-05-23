# Phase 9: 品質ゲート

[実装区分: 実装仕様書]

## 目的

evidence 取得前に最終品質ゲートを通す。`build:cloudflare` PASS は task-10-followup-001 解消の検証も兼ねるが、失敗時は既知 blocker として記録し、runtime visual + axe evidence の取得は継続できる。

## 実行コマンド（順序保持）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck   2>&1 | tee outputs/phase-09/typecheck.txt
mise exec -- pnpm --filter @ubm-hyogo/web lint        2>&1 | tee outputs/phase-09/lint.txt
mise exec -- pnpm --filter @ubm-hyogo/web test        2>&1 | tee outputs/phase-09/test.txt
mise exec -- pnpm --filter @ubm-hyogo/web build       2>&1 | tee outputs/phase-09/next-build.txt
bash scripts/cf.sh --dry-run-build apps/web           2>&1 | tee outputs/phase-09/build-cloudflare.txt \
  || mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 | tee outputs/phase-09/build-cloudflare.txt
```

最終行: `build:cloudflare` が OpenNext esbuild host/binary mismatch で失敗した場合は、Phase 9 を `blocked_build_cloudflare_esbuild_mismatch` として記録し、Phase 11 の runtime visual + axe evidence 取得は継続する。

## token gate

```bash
rg -n "#[0-9a-fA-F]{3,8}" apps/web/app/\(dev\)/ apps/web/playwright/tests/ui-primitives-visual.spec.ts \
  | tee outputs/phase-09/token-gate.txt
```

期待: 0 hits（HEX 直書き禁止 / CONST: design tokens 正本化）。

ログが `outputs/phase-09/` 配下に保存済み- [ ] typecheck / lint / test / build は PASS
- [ ] build:cloudflare は PASS、または task-10-followup-001 の既知 esbuild mismatch blocker として記録済み
- [ ] token gate hits 0
- [ ] ログが `outputs/phase-09/` 配下に保存済み

## Validator Compliance Sections

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 09 |
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
