# Phase 11: runtime visual + axe evidence 取得

[実装区分: 実装仕様書]

## 目的

11 primitive × 代表 variant の screenshot と axe レポートを取得し、`outputs/phase-11/evidence/` に保存。親 spec の Phase 11 ledger を更新する。

## 実行手順

### 1. evidence dir 準備

```bash
mkdir -p docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/evidence/screenshots
```

### 2. dev サーバ起動 + Playwright 実行

```bash
PLAYWRIGHT_EVIDENCE_TASK=task-10-followup-002 \
PLAYWRIGHT_EVIDENCE_DIR=$(pwd)/docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/evidence \
  mise exec -- pnpm --filter @ubm-hyogo/web e2e \
  --project=desktop-chromium \
  ui-primitives-visual.spec.ts \
  2>&1 | tee docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/run.log
```

`playwright.config.ts` の `webServer` 機構で `ENABLE_PRIMITIVES_HARNESS=1 pnpm --filter @ubm-hyogo/web dev` が起動する想定。harness 用 env 名は `ENABLE_PRIMITIVES_HARNESS` に統一する。

### 3. 取得済み evidence の整合確認

```bash
ls docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/evidence/screenshots/ | sort \
  | tee docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/screenshots-index.txt
test -s docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/evidence/axe-report.json
jq '.violations | length' docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/evidence/axe-report.json \
  | tee docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/axe-violations-count.txt
```

期待:
- screenshots 件数 = Phase 1 で確定した primitive × variant 合計（37 件）。
- axe violations 0 件、または allowlist で記録された既知例外のみ。

### 4. 親 spec ledger 更新

`docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/outputs/phase-11/main.md` の以下行を編集する：

| 旧 | 新 |
| --- | --- |
| `\| build:cloudflare \| ... FAIL（esbuild host/binary mismatch） \|` | `\| build:cloudflare \| ... FAIL（esbuild host/binary mismatch; follow-up-001 blocker） \|` |
| `\| runtime screenshot \| 実装完了後に取得 \|` | `\| runtime screenshot \| `docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/evidence/screenshots/` PASS \|` |
| `\| axe \| 実装完了後に取得 \|` | `\| axe \| `docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/evidence/axe-report.json` PASS \|` |

加えて、runtime visual evidence は取得済みとしつつ、親 `index.md` の `workflow_state` は `implemented-local-build-blocked` を維持する。Cloudflare build blocker は task-10-followup-001 の責務であり、本 follow-up では PASS を主張しない。

### 5. 本タスクの Phase 11 main 作成

`outputs/phase-11/main.md` を新規作成し以下を記録：

- 取得日時
- screenshots 一覧と count
- axe violations 詳細
- allowlist（あれば理由付き）
- run.log への参照

`outputs/phase-11/main.md` が完成- [ ] screenshots と axe-report.json が evidence dir に存在
- [ ] 親 spec ledger が更新済みで、親 workflow_state の build blocker 継続境界が明記されている
- [ ] `outputs/phase-11/main.md` が完成

## Validator Compliance Sections

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
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
