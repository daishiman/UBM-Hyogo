# Workflow Artifact Inventory: UT-GOV-001 Second-Stage Reapply（contexts 後追い再 PUT）

> 完了日: 2026-04-30（spec_created / 実 PUT は Phase 13 user 承認後）
> Workflow root: `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/`
> 種別: implementation / governance / NON_VISUAL / approval-gated
> 上流: UT-GOV-001 Phase 13 完了（`contexts=[]` fallback 採用）+ UT-GOV-004 完了
> Issue: #202（CLOSED — `Refs #202` で参照、`Closes #202` 禁止 / 再オープン禁止）

## 1. Phase 別 outputs（13 phases）

| Phase | 主成果物 | 役割 |
| --- | --- | --- |
| 1 | `outputs/phase-01/main.md` | 要件定義 / 4 条件評価 / true issue / 依存境界 / Ownership |
| 2 | `outputs/phase-02/{contexts-source.json,expected-contexts-dev.json,expected-contexts-main.json,payload-design.md}` | UT-GOV-004 由来 context 抽出証跡 / dev・main 別期待 contexts / payload 再生成設計（差分は contexts のみ） |
| 3 | `outputs/phase-03/main.md` | 設計レビュー（代替案比較・30 種思考法・PASS/MINOR/MAJOR 判定・GO/NO-GO ゲート） |
| 4 | `outputs/phase-04/test-strategy.md` | dev / main 独立 PUT 直列実行・集合一致検証・rollback 経路のテスト戦略 |
| 5 | `outputs/phase-05/apply-runbook-second-stage.md` | 後追い再 PUT 実行 runbook（dev / main 独立 PUT・rollback・admin block 回避策） |
| 6 | `outputs/phase-06/failure-cases.md` | 異常系（typo context / 422 schema 不正 / admin block / 片側 PUT 失敗 / drift） |
| 7 | `outputs/phase-07/ac-matrix.md` | AC-1〜AC-14 検証マッピング |
| 8 | `outputs/phase-08/main.md` | DRY 化（payload / runbook 重複排除） |
| 9 | `outputs/phase-09/{main.md,drift-check.md}` | drift 検査（CLAUDE.md / deployment-branch-strategy.md vs 適用後 GET 6 値） |
| 10 | `outputs/phase-10/go-no-go.md` | GO/NO-GO 判定（PASS, MAJOR ゼロ） |
| 11 | `outputs/phase-11/{main.md,manual-smoke-log.md,manual-verification-log.md}` | NON_VISUAL evidence（screenshot N/A / GET-PUT-applied JSON + runbook ステップログ） |
| 12 | `outputs/phase-12/{main.md,implementation-guide.md,system-spec-update-summary.md,documentation-changelog.md,unassigned-task-detection.md,skill-feedback-report.md,phase12-task-spec-compliance-check.md}` | close-out 必須 7 成果物 |
| 13 | `outputs/phase-13/{local-check-result.md,change-summary.md,pr-info.md,pr-creation-result.md,branch-protection-current-{dev,main}.json,branch-protection-payload-{dev,main}.json,branch-protection-applied-{dev,main}.json}` | approval gate + 実 PUT 実行 + PR 作成（user 承認後にのみ実行） |

## 2. 入力契約（UT-GOV-004 由来 / 唯一の機械可読正本）

`docs/30-workflows/completed-tasks/ut-gov-004-required-status-checks-context-sync/outputs/phase-08/confirmed-contexts.yml`

- `required_status_checks.contexts` = `["ci", "Validate Build", "verify-indexes-up-to-date"]`
- `strict.dev` = `false` / `strict.main` = `true`
- 本タスクの `outputs/phase-02/contexts-source.json` に取り込み、`expected-contexts-{dev,main}.json` で dev / main 別配列に展開する

## 3. 出力契約（適用後 GET 正本）

| 出力 | 用途 |
| --- | --- |
| `outputs/phase-13/branch-protection-applied-{dev,main}.json` | GitHub 側 GET 応答 = 最終正本。aiworkflow-requirements references 反映の唯一根拠（AC-14 引き渡し先は `task-utgov001-references-reflect-001`） |
| `outputs/phase-13/branch-protection-current-{dev,main}.json` | 適用前 GET 保全。差分検証の base |
| `outputs/phase-09/drift-check.md` | CLAUDE.md / deployment-branch-strategy.md との 6 値 drift 検査結果 |

## 4. 受入条件（AC-1〜AC-14）抜粋

| AC | 内容 |
| --- | --- |
| AC-1 | UT-GOV-004 由来 context が `outputs/phase-02/contexts-source.json` に保全 |
| AC-2 | `expected-contexts-{dev,main}.json` が dev / main 別配列で確定 + 集合差分明文化 |
| AC-3 | 適用前 GET（dev / main）が個別取得・保全 |
| AC-4 | payload の `required_status_checks.contexts` が UT-GOV-004 由来のみで再生成（`contexts=[]` 残留無し） |
| AC-5 | dev / main 独立 PUT 成功 + 応答 JSON 保存 |
| AC-6 | 適用後 GET の contexts と期待 contexts が集合一致（順序不問） |
| AC-7 | drift 6 値が CLAUDE.md / deployment-branch-strategy.md と一致 |
| AC-8 | dev / main 独立 rollback 経路が runbook 記述（rollback payload は UT-GOV-001 のものを再利用・上書き禁止） |
| AC-9 | typo context 防止（workflow 名禁止 / job 名 or check-run 名のみ採用） |
| AC-10 | `enforce_admins=true` 下での admin 自身 block 回避 rollback 担当・経路の再確認 |
| AC-11 | 30 種思考法レビュー PASS / MAJOR ゼロ |
| AC-12 | 4 条件（価値性 / 実現性 / 整合性 / 運用性）最終判定 PASS |
| AC-13 | Phase 13 はユーザー承認なしに実 PUT・push・PR 作成を行わない |
| AC-14 | aiworkflow-requirements references 反映方針は Phase 12 で明文化、実反映は別タスクへ引き渡し |

## 5. branch protection 運用ルール（second-stage 固有）

| ルール | 内容 |
| --- | --- |
| dev / main 独立 PUT（直列実行） | 同時 PUT 禁止。dev 検証完了後に main 実行。1 PUT 失敗時に他方が部分適用にならない |
| rollback payload の再利用 | UT-GOV-001 `outputs/phase-05/rollback-payload-{dev,main}.json` を再利用。**上書き禁止**（Phase 3 運用ルール 5） |
| admin token 取得経路 | `op://Employee/ubm-hyogo-env/GITHUB_ADMIN_TOKEN`（admin scope 必須）。実値は環境変数で揮発的に渡す。docs / 仕様書には op:// 参照のみ |
| Issue 参照規約 | `Refs #202` のみ採用。`Closes #202` 禁止（Issue は CLOSED のまま再オープン禁止） |
| commit 粒度 | 5 単位（specs / outputs / phase-13 evidence / skill same-wave sync / LOGS row） |

## 6. skill 反映先（aiworkflow-requirements / task-specification-creator）

| 区分 | パス | 反映内容 |
| --- | --- | --- |
| index | `indexes/resource-map.md` | canonical task root 表に本 workflow + lessons-learned + artifact-inventory を追加 |
| index | `indexes/quick-reference.md` | UT-GOV-001 second-stage reapply 早見セクション（rollback payload location 行 / admin token op 経路 行 / Refs #202 採用行） |
| index | `indexes/topic-map.md` | governance / branch-protection / approval-gated NON_VISUAL のキーワード経路に本ファイルへの導線追加 |
| LOGS | `LOGS/_legacy.md` | 2026-04-30 ヘッドラインで spec_created 記録 |
| references | `references/lessons-learned-utgov001-second-stage-reapply-2026-04.md` | 苦戦箇所 8 件 |
| references | `references/workflow-utgov001-second-stage-reapply-artifact-inventory.md` | 本ファイル |
| references | `references/task-workflow-active.md` | Current Active 表に Phase 13 approval gate 付きで追加 |
| skill | `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴 `v2026.04.30-utgov001-second-stage-reapply` |
| skill | `.claude/skills/task-specification-creator/SKILL.md` | approval-gated NON_VISUAL implementation 事例を変更履歴へ追加 |

## 7. リレー先未タスク（Phase 12 unassigned-task-detection 由来）

| relay 先 | 切り出し対象 | 発火条件 |
| --- | --- | --- |
| `task-utgov001-references-reflect-001` | applied GET evidence 取得後の aiworkflow-requirements references final sync（AC-14 履行） | Phase 13 完了後 |
| `task-utgov001-drift-fix-001` | CLAUDE.md / deployment-branch-strategy.md と適用後 GET 6 値の drift 是正 | drift 検出時のみ |
| `task-utgov-downstream-precondition-link-001` | UT-GOV-005〜007 への前提リンク追記 | second-stage 適用完了後 |
| UT-GOV-001 完了タスク §8.2 | 後追い再 PUT 経路として本タスクへリンク追記 | second-stage 適用完了後 |

## 8. 不変条件 touched

CLAUDE.md §「重要な不変条件」#1〜#7 への影響なし（governance 層に閉じる）。drift 6 値（`required_pull_request_reviews=null` / `enforce_admins=true` / `allow_force_pushes=false` / `allow_deletions=false` / `required_linear_history` / `required_conversation_resolution`）はすべて維持し、`required_status_checks.contexts` のみを書き換える。
