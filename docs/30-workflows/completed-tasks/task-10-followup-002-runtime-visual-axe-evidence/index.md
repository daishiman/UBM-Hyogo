# task-10-followup-002-runtime-visual-axe-evidence

[実装区分: 実装仕様書]
判断根拠: 本タスクは 11 primitive の runtime screenshot と axe レポートを実行・取得するためのコード（Playwright spec、visual harness ページ、axe wiring、必要に応じて `playwright.config.ts` の evidence dir 分岐追加）を伴う。`completed-tasks/task-10-followup-002-runtime-visual-axe-evidence.md` 単体ではドキュメントのみで `outputs/phase-11/evidence/` が空のまま issue #610 が closed しており、CONST_004 例外（純粋にドキュメント完結）に該当しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-10-followup-002-runtime-visual-axe-evidence |
| タスク種別 | verification (visual + a11y evidence capture) |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |
| implementation_mode | test-tooling-addition |
| 親 issue | https://github.com/daishiman/UBM-Hyogo/issues/610（closed のまま再オープン不要） |
| 親 workflow | `docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/` |
| 必須前提 | task-10-followup-001-opennext-esbuild-mismatch（`build:cloudflare` が PASS すること。`scripts/cf.sh` の `ESBUILD_BINARY_PATH` ワークアラウンド経由で局所的に通過可能） |
| 作成日 | 2026-05-11 |
| スコープ | 11 primitive (`Button / Card / Badge / Input / Select / Sidebar / Stat / EmptyState / Avatar / Field / Banner`) の runtime screenshot + axe レポート取得と evidence ledger 更新 |

## 目的

task-10-ui-primitives-spec の Phase 11 `VISUAL_ON_EXECUTION` ledger に欠落している runtime screenshot と axe レポートを取得し、`outputs/phase-11/evidence/screenshots/`・`outputs/phase-11/evidence/axe-report.json` を完成させる。同時に親 workflow の `outputs/phase-11/main.md` を `implemented_local_evidence_captured` 相当の状態へ更新する。

## 実行タスク

- Task 0: `build:cloudflare` と Playwright + axe 依存を再確認する。`build:cloudflare` は task-10-followup-001 の esbuild mismatch により継続 blocker として記録する。
- Task 1: visual harness ページ（11 primitive を 1 ページに並べた検証 route）を `apps/web/app/(dev)/primitives-harness/page.tsx` に追加する（dev/preview 限定で production ビルドから除外する gate を付与）。
- Task 2: Playwright spec `apps/web/playwright/tests/ui-primitives-visual.spec.ts` を新規追加し、各 primitive 代表 variant のスクショと axe スキャンを 1 ファイルにまとめる。
- Task 3: `playwright.config.ts` に本タスク用 evidence dir 分岐を追加する（既存タスクと同じ仕組みを踏襲）。
- Task 4: spec を実行して evidence を取得し、`outputs/phase-11/evidence/` 配下に保存する。
- Task 5: 親 workflow `task-10-ui-primitives-spec/outputs/phase-11/main.md` の ledger 行（runtime screenshot / axe）を取得済みに更新し、`workflow_state` を `implemented_local_evidence_captured` に書き換える。
- Task 6: aiworkflow-requirements `references/ui-ux-components.md` の evidence reference 行を追記する。
- Task 7: axe で検出した実装側の意味論不整合を同一サイクルで修正する（`Stat` の definition-list 構造、`Sidebar` の harness 用 non-landmark rendering option）。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| 親 spec | `docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/` | 11 primitive 契約・現行 ledger |
| 親 spec Phase 11 | `docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/outputs/phase-11/main.md` | 更新対象 |
| 元タスク指示書 | `docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence.md` | 高粒度仕様 |
| 前提タスク | `docs/30-workflows/unassigned-task/task-10-followup-001-opennext-esbuild-mismatch.md` | esbuild 解消条件 |
| primitive 実装 | `apps/web/src/components/ui/` | 検証対象実装 |
| Playwright 設定 | `apps/web/playwright.config.ts` | evidence dir 分岐の追加箇所 |
| aiworkflow 正本 | `.claude/skills/aiworkflow-requirements/references/ui-ux-components.md` | evidence reference 追記先 |

## 成果物

| 成果物 | パス |
| --- | --- |
| 検証 harness ページ | `apps/web/app/(dev)/primitives-harness/page.tsx` |
| Playwright spec | `apps/web/playwright/tests/ui-primitives-visual.spec.ts` |
| axe semantic fixes | `apps/web/src/components/ui/Stat.tsx`, `apps/web/src/components/ui/Sidebar.tsx` |
| screenshots | `docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/evidence/screenshots/{primitive-variant}.png`（11 primitive × 主要 variant） |
| axe report | `docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/evidence/axe-report.json` |
| evidence index | `docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/main.md` |
| Phase 12 strict 7 | `outputs/phase-12/{main,implementation-guide,documentation-changelog,system-spec-update-summary,phase12-task-spec-compliance-check,skill-feedback-report,unassigned-task-detection}.md` |
| 親 spec ledger 更新 | `docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/outputs/phase-11/main.md`（cross-workflow 同期） |

## Phase 構成

| Phase | 内容 | 参照 |
| --- | --- | --- |
| Phase 1 | 要件定義（11 primitive × 主要 variant 確定、AC 固定） | `phase-01.md` |
| Phase 2 | 設計（harness page / Playwright spec / evidence dir 分岐） | `phase-02.md` |
| Phase 3 | レビューゲート | `phase-03.md` |
| Phase 4 | RED（Playwright spec を pending で先行作成・失敗確認） | `phase-04.md` |
| Phase 5 | GREEN 実装（harness + spec + config 分岐） | `phase-05.md` |
| Phase 6 | リグレッションテスト | `phase-06.md` |
| Phase 7 | カバレッジ確認（実装は test 配下中心。primitive 本体 coverage には影響しない） | `phase-07.md` |
| Phase 8 | リファクタ | `phase-08.md` |
| Phase 9 | 品質ゲート（typecheck / lint / test / build:cloudflare / token gate） | `phase-09.md` |
| Phase 10 | 最終レビュー | `phase-10.md` |
| Phase 11 | runtime visual + axe evidence 取得 | `phase-11.md` |
| Phase 12 | ドキュメント同期（strict 7 outputs） | `phase-12.md` |
| Phase 13 | ユーザーゲート PR | `phase-13.md` |

## 完了条件

- [x] 11 primitive × 主要 variant の screenshot がすべて取得済み
- [x] axe violations が 0 件、または既知例外のみで内訳が JSON に記録されている
- [x] 親 spec `task-10-ui-primitives-spec/outputs/phase-11/main.md` の ledger が `implemented_local_evidence_captured` に更新済み
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` が PASS
- [x] Phase 12 strict 7 outputs が揃っている
- [ ] PR は user の明示指示まで作成しない（CONST_002）

## DoD（Definition of Done）

1. `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` PASS
2. `mise exec -- pnpm --filter @ubm-hyogo/web lint` PASS
3. `mise exec -- pnpm --filter @ubm-hyogo/web test` PASS
4. `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` PASS
5. `PLAYWRIGHT_EVIDENCE_TASK=task-10-followup-002 mise exec -- pnpm --filter @ubm-hyogo/web e2e --grep "ui-primitives-visual"` PASS
6. evidence 一式が `outputs/phase-11/evidence/` 配下に存在
7. 親 spec ledger 更新の diff が単一 commit にまとまっている
