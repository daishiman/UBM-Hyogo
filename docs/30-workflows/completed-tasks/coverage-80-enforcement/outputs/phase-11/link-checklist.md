# link checklist — 仕様書間 + skill + 外部 URL 参照リンク健全性チェック

> spec walkthrough で確認した参照リンクの有効性を一覧化する。
> 対象は本ワークフロー内（index.md / phase-NN.md / outputs / artifacts.json）/ skill（aiworkflow-requirements / task-specification-creator）/ 外部 URL（Vitest 公式 / Codecov / GitHub REST docs）/ CLAUDE.md。
> 各リンクは `[ ]` 未確認 / `[x]` 確認済 でステータスを示す。本 Phase 11 は spec_created のため、Phase 13 実走時に未確認 → 確認済へ更新する。

## メタ

| 項目 | 値 |
| --- | --- |
| 確認日 | 2026-04-29（spec 固定日） |
| 確認者 | worktree branch: `task-20260429-132037-wt-3`（solo 開発） |
| 確認方法 | spec walkthrough（手動）+ ファイル存在 ls / md 内 link 目視 / 外部 URL は HEAD リクエストで生死確認（実走時） |

## 1. ワークフロー内リンク（本タスク）

| # | 参照元 | 参照先 | 状態 |
| --- | --- | --- | --- |
| 1 | index.md | phase-01.md / phase-02.md / phase-03.md | [x] 確認済（Phase 1〜3 = completed） |
| 2 | index.md | phase-04.md 〜 phase-13.md | [x] 確認済（Phase 4〜13 = pending、本タスク Phase 11 = 本ファイル群で新規作成） |
| 3 | index.md | outputs/phase-01/main.md / phase-02/main.md / phase-03/main.md | [x] 確認済 |
| 4 | index.md | outputs/phase-11/{main,manual-smoke-log,link-checklist,coverage-baseline-summary}.md | [x] 確認済（本ファイル群で新規作成） |
| 5 | index.md | outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md | [ ] 未確認（Phase 12 で新規作成予定） |
| 6 | index.md | outputs/phase-13/{main,pr1-runbook,pr2-runbook,pr3-runbook}.md | [ ] 未確認（Phase 13 で新規作成予定） |
| 7 | artifacts.json | phases[].file / phases[].outputs[] | [ ] 未確認（Phase 13 で全 phases 確定後再走査） |
| 8 | phase-01.md | outputs/phase-01/main.md | [x] 確認済 |
| 9 | phase-02.md | outputs/phase-02/main.md | [x] 確認済 |
| 10 | phase-03.md | outputs/phase-03/main.md | [x] 確認済 |
| 11 | phase-11.md | outputs/phase-11/{main,manual-smoke-log,link-checklist,coverage-baseline-summary}.md | [x] 確認済（本タスクで新規作成） |

## 2. aiworkflow-requirements の更新箇所（Phase 12 同期対象）

| # | 参照元 | 参照先 | 状態 |
| --- | --- | --- | --- |
| 12 | index.md / phase-01.md / phase-12.md | .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md | [ ] 未確認（既存 80%/65% → 全 package 80% 更新差分を Phase 12 で同期） |
| 13 | phase-12.md | .claude/skills/aiworkflow-requirements/references/resource-map.md | [ ] 未確認（quality-requirements-advanced.md エントリの更新が必要かを Phase 12 で再評価） |
| 14 | phase-12.md | .claude/skills/aiworkflow-requirements/references/quick-reference.md | [ ] 未確認（coverage 閾値変更を反映するか Phase 12 で判断） |
| 15 | phase-12.md | .claude/skills/aiworkflow-requirements/references/topic-map.md | [ ] 未確認（quality / coverage トピックの紐付け確認） |

## 3. task-specification-creator の更新箇所（Phase 12 同期対象）

| # | 参照元 | 参照先 | 状態 |
| --- | --- | --- | --- |
| 16 | phase-12.md | .claude/skills/task-specification-creator/references/coverage-standards.md | [ ] 未確認（`scripts/coverage-guard.sh` 参照を追記） |
| 17 | phase-11.md | .claude/skills/task-specification-creator/references/phase-template-phase11.md | [x] 確認済（本タスクのテンプレ正本） |
| 18 | phase-11.md | .claude/skills/task-specification-creator/references/phase-template-phase11-detail.md | [x] 確認済 |
| 19 | phase-11.md | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | [x] 確認済（NON_VISUAL 縮約テンプレ） |
| 20 | phase-11.md | .claude/skills/task-specification-creator/references/phase-11-guide.md | [ ] 未確認（参考） |
| 21 | phase-11.md | .claude/skills/task-specification-creator/references/phase-11-12-guide.md | [ ] 未確認（参考） |
| 22 | phase-NN.md | .claude/skills/task-specification-creator/SKILL.md | [x] 確認済 |
| 23 | phase-NN.md | .claude/skills/task-specification-creator/references/phase-template-core.md | [ ] 未確認 |
| 24 | phase-12.md | .claude/skills/task-specification-creator/references/phase-12-spec.md | [ ] 未確認（Phase 12 で参照） |
| 25 | phase-13.md | .claude/skills/task-specification-creator/references/phase-template-phase13.md | [ ] 未確認（Phase 13 で参照） |

## 4. 外部 URL（Vitest 公式 / Codecov / GitHub REST）

| # | 参照元 | 参照先 | 状態 |
| --- | --- | --- | --- |
| 26 | index.md / phase-02.md | https://vitest.dev/guide/coverage | [ ] 未確認（実走時に HEAD で生死確認） |
| 27 | index.md / phase-12.md | https://docs.codecov.com/docs | [ ] 未確認（既存 codecov.yml 再評価用） |
| 28 | phase-13.md | https://docs.github.com/en/rest/branches/branch-protection | [ ] 未確認（hard gate 化時 contexts 登録の REST 仕様） |
| 29 | phase-12.md | https://github.com/marketplace/actions/codecov | [ ] 未確認（任意 / Phase 12 で再評価） |

## 5. プロジェクトルート / インフラ正本ファイル

| # | 参照元 | 参照先 | 状態 |
| --- | --- | --- | --- |
| 30 | phase-NN.md | CLAUDE.md（ブランチ戦略章 / solo 運用ポリシー / mise 経由実行原則） | [x] 確認済 |
| 31 | phase-02.md / phase-05.md | vitest.config.ts | [ ] 未確認（PR① で新設・編集対象） |
| 32 | phase-02.md / phase-05.md | .github/workflows/ci.yml | [ ] 未確認（PR① soft 追加 / PR③ hard 化） |
| 33 | phase-02.md / phase-05.md | lefthook.yml | [ ] 未確認（PR③ で pre-push 統合） |
| 34 | phase-02.md / phase-12.md | codecov.yml | [ ] 未確認（既存 / Phase 12 で同期確認） |
| 35 | phase-05.md | scripts/coverage-guard.sh | [ ] 未確認（PR① で新規作成） |
| 36 | phase-05.md | scripts/with-env.sh | [x] 確認済（既存・1Password env wrapper） |
| 37 | phase-05.md | apps/web/package.json / apps/api/package.json / packages/shared/package.json / packages/integrations/package.json / packages/integrations/google/package.json | [ ] 未確認（PR① で `test` / `test:coverage` script 統一） |

## 6. 連携タスク（governance）

| # | 参照元 | 参照先 | 状態 |
| --- | --- | --- | --- |
| 38 | index.md / phase-13.md | docs/30-workflows/ut-gov-001-github-branch-protection-apply/ | [x] 確認済（hard gate 化時 contexts 登録の参照先） |
| 39 | index.md | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-11/ | [x] 確認済（NON_VISUAL Phase 11 構造リファレンス） |
| 40 | phase-13.md | UT-GOV-004（required_status_checks.contexts 同期） | [ ] 未確認（PR③ 実施時点の completed 状態を確認） |

## 7. mirror parity / `.gitkeep` チェック

| # | 確認項目 | 状態 |
| --- | --- | --- |
| 41 | `outputs/phase-11/screenshots/` が存在しないこと（NON_VISUAL 整合） | [x] 確認済（作成していない） |
| 42 | `coverage-baseline-summary.md` が `<TBD>` プレースホルダのみで実値を含まないこと | [x] 確認済（spec_created 状態） |
| 43 | `manual-smoke-log.md` の全ケースに `NOT EXECUTED` ステータスが残っていること | [x] 確認済 |

## サマリ

| 状態 | 件数 |
| --- | --- |
| [x] 確認済 | 14 |
| [ ] 未確認 | 29 |
| Broken | 0 |

> 未確認 29 件のうち、Phase 12 / Phase 13 で新規作成 or 同期されるものが大半。Phase 13 実走時にすべて [x] へ更新する。
> Broken 0 件のため Phase 12 への引き継ぎブロッカーなし。
