# Phase 1: 要件定義

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 1 |
| 名称 | 要件定義 |
| タスク種別 | verification |
| visualEvidence | VISUAL_ON_EXECUTION |
| 前 Phase | index.md |
| 次 Phase | Phase 2 |

## 目的

本タスクのスコープを「11 primitive × 代表 variant の visual + axe evidence 取得」に固定し、AC を確定して Phase 2 の設計に渡す。issue #610 が closed のまま追加実装を行うため、scope crawl を抑制する制約を本 phase で固める。

## 実行タスク

- Task 1-1: 11 primitive の現行 export を `apps/web/src/components/ui/index.ts` から確定する。
- Task 1-2: 各 primitive の検証対象 variant を確定する（下記「対象 variant 一覧」）。
- Task 1-3: AC-1〜AC-9 を本文に固定する。
- Task 1-4: 必須前提（task-10-followup-001 esbuild 解消）が現環境で成立するかを `scripts/cf.sh` 経由の `build:cloudflare` 試走で確認する（実行は Phase 9 / 11、本 phase では確認方針のみ）。
- Task 1-5: scope crawl 抑止条件を固定（新規 primitive 追加禁止、token 変更禁止）。ただし axe が同一サイクルで検出した primitive の意味論不整合は、最小の後方互換修正として本タスク内で修正する。

## 対象 variant 一覧

| primitive | 主要 variant |
| --- | --- |
| Button | `primary` / `accent` / `ghost` / `soft` / `danger` / `loading` |
| Card | `default` / `with-header` / `with-footer` |
| Badge | `default` / `success` / `warning` / `danger` / `info` |
| Input | `default` / `with-label` / `error` / `disabled` |
| Select | `default` / `with-placeholder` / `disabled` |
| Sidebar | `default` / `with-footer` |
| Stat | `default` / `with-delta-up` / `with-delta-down` |
| EmptyState | `default` / `with-action` |
| Avatar | `initials-fallback` / `large` |
| Field | `default` / `with-error` / `with-hint` |
| Banner | `info` / `success` / `warning` / `danger` |

## Acceptance Criteria

- AC-1: harness page は dev / preview ビルドでのみ render され、production runtime では `ENABLE_PRIMITIVES_HARNESS=1` なしに到達不能である（route guard or env gate）。
- AC-2: 11 primitive × 代表 variant の screenshot がすべて取得される。
- AC-3: axe-core 実行で violations が 0 件、または既知例外のみが allowlist に記録される。
- AC-4: evidence は `outputs/phase-11/evidence/screenshots/`・`outputs/phase-11/evidence/axe-report.json` に保存される。
- AC-5: `playwright.config.ts` は既存タスクの evidence dir 分岐方式と整合する形でのみ拡張される（既存分岐の破壊禁止）。
- AC-6: 新規 primitive と token 定義は変更しない。axe が同一サイクルで検出した意味論不整合は、`Stat.tsx` と `Sidebar.tsx` の最小後方互換修正に限定して許可する。
- AC-7: 親 spec `task-10-ui-primitives-spec/outputs/phase-11/main.md` の ledger 行が `implemented_local_evidence_captured` 状態へ更新される。
- AC-8: 本タスクで追加・編集するコードは `apps/web/app/(dev)/primitives-harness/`・`apps/web/app/(dev)/layout.tsx`・`apps/web/playwright/tests/ui-primitives-visual.spec.ts`・`apps/web/playwright.config.ts`・`apps/web/src/components/ui/Stat.tsx`・`apps/web/src/components/ui/Sidebar.tsx` に限定する。
- AC-9: PR は user 明示指示まで作成しない（CONST_002）。

## 多角的チェック観点

| 観点 | 判定方法 |
| --- | --- |
| 矛盾なし | 元タスク指示書（unassigned-task 配下）と本 spec の差分が「Phase 1-13 化と evidence dir 分岐方針の明確化」のみであること |
| 漏れなし | 11 primitive × variant が `outputs/phase-11/evidence/screenshots/` 配下に揃うこと |
| 整合性 | harness page が production runtime では `ENABLE_PRIMITIVES_HARNESS=1` なしに到達不能であること |
| 依存整合 | task-10-followup-001 解消条件（`build:cloudflare` PASS）が Phase 9 で検証されること |

## 成果物

| 成果物 | パス |
| --- | --- |
| Phase 1 main | `outputs/phase-01/main.md` |

対象 variant 一覧が確定している- [ ] AC-1〜AC-9 が本ファイルに記録されている
- [ ] 対象 variant 一覧が確定している

## Validator Compliance Sections

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 01 |
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
