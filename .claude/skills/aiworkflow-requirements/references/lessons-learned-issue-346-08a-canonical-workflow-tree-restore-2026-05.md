# Lessons learned: issue-346 08a canonical workflow tree restore (2026-05)

| ID | 教訓 | 適用 | 根拠 |
| --- | --- | --- | --- |
| L-I346-001 | docs-only canonical tree restore タスクは、root と outputs の `artifacts.json` parity を必須要件にし、parity 例外は明示的承認が必要 | task-specification-creator Phase 12 spec / phase12-task-spec-compliance-check.md | docs-only タスクで artifacts.json drift が起きると root が唯一正本かどうか曖昧になり、Phase 13 PR 引き継ぎが破綻する |
| L-I346-002 | Phase 12 compliance check は「未取得 evidence を取得済みと宣言する」ことを reject し、未取得は `planned evidence` ラベルで残す | task-specification-creator phase-12-spec.md | docs-only / NON_VISUAL タスクで Phase 11 evidence を空 placeholder のまま PASS 扱いにする drift を防ぐ |
| L-I346-003 | `legacy-ordinal-family-register.md` の `current/partial` / `completed-successor` / `restored-canonical` 状態語は decision table 化して正本側に保持する | aiworkflow-requirements legacy-ordinal-family-register.md | 状態語が散在すると 08a のような multi-state（current/partial + restore trace）の判断が一貫しない |
| L-I346-004 | docs-only review でも `automation-30` の四条件 gate に「物理パス存在チェック」を必須項目として組み込む | automation-30 elegant-review template | 09c の broken-link が物理不在に起因していたため、書面 review だけでは canonical drift を検出できない |
| L-I346-005 | closed Issue から仕様作成する場合、PR / commit message は `Refs #<issue>` のみ使用し、`Closes #<issue>` は使わない | task-specification-creator Phase 13 / commit policy | 既に CLOSED な Issue への `Closes` は GitHub 側で no-op になり、history からは reopen を期待した運用と読まれて誤解を生む |
| L-I346-006 | 08a-A のような follow-up は「current canonical root の代替ではない」境界を CHANGELOG / task-workflow-active 双方に文字列で明記する | aiworkflow-requirements SKILL.md / task-workflow-active.md | follow-up が canonical を実質的に置き換えてしまう drift を防ぐ |

## 苦戦箇所（unassigned-task 由来）

- 対象: 09c production release runbook（`docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-10.md`）
- 症状: 09c final review path validation で、08a current canonical path が削除状態なのに上流 contract gate として参照されていた
- 構造的原因: canonical tree の物理移動が registration 側へ反映されておらず、書面 review では検出できなかった
- 再発防止: L-I346-003 / L-I346-004（decision table 化 + 物理パス存在チェック）

## 関連 skill feedback

`outputs/phase-12/skill-feedback-report.md` も併読:
- task-specification-creator: artifacts.json parity 必須化 / planned evidence ラベル
- aiworkflow-requirements: state 語の decision table 化
- automation-30: 四条件 gate に物理パス存在チェック追加
