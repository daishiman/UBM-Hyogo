# Phase 12: ドキュメント整備

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| Source | `outputs/phase-12/phase-12.md` |
| 状態 | completed |

## 目的

task-specification-creator skill 規定の **6 必須タスク + `main.md` = Phase 12 strict 7 ファイル**を実施し、SSOT 反映を完了する。

## 実行タスク（6 必須 + compliance + main）

| ID | 成果物 | 概要 |
| --- | --- | --- |
| 12-0 | `outputs/phase-12/main.md` | Phase 12 summary / 7 file index / status vocabulary |
| 12-1 | `outputs/phase-12/implementation-guide.md` | 実装 summary / 中学生レベル概念説明（「Next.js standalone build とは / instrumentation とは / なぜ patch が必要か / silent failure とは」を 3〜5 行ずつで） |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements skill `references/` / `topic-map` / `keywords` への反映差分（patch script 責務 / RUN BOOK location / CI gate name） |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | 更新 / 追加 file の canonical absolute path 一覧。最低限: `scripts/patch-next-standalone-instrumentation.mjs`, `scripts/__tests__/...`, `apps/web/open-next.config.ts`, `.github/workflows/pr-build-test.yml`, `docs/runbooks/next-standalone-instrumentation-patch.md`, `.claude/skills/aiworkflow-requirements/references/...`, `.claude/skills/aiworkflow-requirements/SKILL.md` 履歴行, `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` 履歴行 |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md` | 残課題（例: upstream Next.js / OpenNext で本問題が解決した際の workaround 撤去タスク）を unassigned-task として起票 or 「なし」記録 |
| 12-5 | `outputs/phase-12/skill-feedback-report.md` | 実行中に skill 仕様 / template に追加すべき事項 |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 12-1〜12-5 が全て実体配置済 / canonical path / secret 非含有 を check |

### 起票元 marker 反映

`docs/30-workflows/completed-tasks/task-03-followup-002-next-standalone-instrumentation-patch-001.md` を source follow-up として参照し、本仕様書に formalize 済みであることを 12-4 に記録する。

## 参照資料

- `outputs/phase-9/phase-9.md`
- `outputs/phase-11/phase-11.md`

## 成果物

- 上記 7 ファイル

## 完了条件

- 7 ファイルが実体配置済
- workflow_state は `implemented-local`（local regression PASS 済み。CI gate / full standalone artifact verification は push 後の GitHub Actions で確認）
- aiworkflow-requirements skill の `SKILL.md` / `LOGS.md` 履歴行が canonical absolute path で更新済
