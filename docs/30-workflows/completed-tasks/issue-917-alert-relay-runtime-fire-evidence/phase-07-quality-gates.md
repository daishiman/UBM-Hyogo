---
phase: 7
title: Quality Gates
workflow_id: issue-917-alert-relay-runtime-fire-evidence
status: completed
---

# Phase 7: Quality Gates — alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

判定根拠: runtime observability hardening サイクルにつき、docs gate 3 種に加えて focused contract test で relay POST responseStatus logging を保証する。

## 1. CI gate と通過条件（本サイクル）

| gate | コマンド | 通過条件 | 本サイクル状態 |
| --- | --- | --- | --- |
| `gate-metadata:validate` | `mise exec -- pnpm gate-metadata:validate` | `artifacts.json` zod schema 通過（ERROR 0） | required（本 workflow 追加で OK 件数増・ERROR 0 を期待） |
| `verify:phase12-compliance` | `mise exec -- pnpm verify:phase12-compliance` | canonical 9 headings / Phase 11 evidence parity / strict 7 outputs | required |
| `indexes:rebuild` | `mise exec -- pnpm indexes:rebuild` | 冪等性（再実行で diff なし） | required |
| focused vitest | `pnpm exec vitest run apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts --root=. --config=vitest.config.ts` | 8 tests PASS | PASS |
| `typecheck` | `mise exec -- pnpm typecheck` | optional broader gate | not run |
| `lint` | `mise exec -- pnpm lint` | optional broader gate | not run |

## 2. coverage 対象範囲

本サイクルの coverage 対象は `apps/api/src/scheduled/sheets-auth-healthcheck.ts` の responseStatus logging 分岐。focused contract test で 200 / 401 を固定する。

## 3. docs structure gate（本サイクル必須）

| 確認項目 | 確認方法 |
| --- | --- |
| canonical 9 headings 揃い | `phase-12-compliance-check.md` §1 表を満たす |
| strict 7 outputs/phase-12 揃い | `outputs/phase-12/{main, implementation-guide, system-spec-update-summary, documentation-changelog, unassigned-task-detection, skill-feedback-report, phase12-task-spec-compliance-check}.md` の存在 |
| Phase 11 NON_VISUAL 宣言 | `phase-11-evidence-inventory.md` で `NON_VISUAL` 明示 + screenshots/ 不在 |
| artifacts.json root/output parity | `artifacts.json` と `outputs/artifacts.json` の `metadata.gates` / `phases` が同一値 |

## 4. gate 失敗時の方針

- `gate-metadata:validate` ERROR → `artifacts.json` / `outputs/artifacts.json` の `metadata.gates[].evidence_path` が repo 内に実在するか、`metadata.taskType` / `visualEvidence` の enum 値が許容範囲（`implementation` / `NON_VISUAL`）に収まるか確認。
- `verify:phase12-compliance` FAIL → `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` の §1〜§5 を参照し、canonical 9 headings → Phase 11 evidence 表 → workflow root scan の順で原因切り分け。
- `indexes:rebuild` drift → 1 回目で keywords.json / topic-map.md が更新される。2 回目で diff なしを確認（冪等性）。
- runtime evidence が pending のままで本 docs サイクルを commit する場合、Gate-D は `pending` のままで構わない（仕様書側で明示済み）。

## 5. PR pre-flight gate（Phase 13 直前）

PR を出すサイクル（本 docs サイクル）では追加で:

```bash
bash scripts/verify-pr-ready.sh
```

を user-gated で実行し、`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift の 3 種を一括検証する（CLAUDE.md PR 自律フロー §3 step-5）。
