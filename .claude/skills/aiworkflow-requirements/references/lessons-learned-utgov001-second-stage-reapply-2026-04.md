# Lessons Learned: UT-GOV-001 Second-Stage Reapply（contexts 後追い再 PUT）

> 由来: `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/`
> 完了日: 2026-04-30（spec_created / 実 PUT は Phase 13 user 承認後）
> タスク種別: implementation / governance / NON_VISUAL / approval-gated
> 出典: `index.md §苦戦箇所・知見`、`outputs/phase-12/system-spec-update-summary.md`、`outputs/phase-12/skill-feedback-report.md`、`phase-13.md`

## 概要

UT-GOV-001 で `required_status_checks.contexts=[]` を暫定 fallback として採用したケースに対し、UT-GOV-004 完了成果物（`required-status-checks-contexts.{dev,main}.json`）から実在 context を抽出して dev / main を独立 PUT で書き換える「second-stage reapply」タスクを Phase 1〜13 で仕様書化したときに得た 8 件の苦戦知見を集約する。本タスクは approval-gated NON_VISUAL implementation の第一適用例であり、`spec_created` で close-out しつつ実 PUT・push・PR は Phase 13 user 明示承認後にのみ実行する二重ゲート構造を持つ。

## 苦戦箇所 8 件（index.md §苦戦箇所・知見 由来）

### L-GOV001-2ND-001: typo context による merge 完全 block

| 項目 | 内容 |
| --- | --- |
| カテゴリ | governance / branch-protection / contexts hygiene |
| 症状 | `required_status_checks.contexts` に未出現 context 名（typo / 廃止 workflow 名）を入れると、対象 PR が永続的に green にならず merge 不能 |
| 解決 | workflow 名ではなく実 GitHub Actions の job 名 / check-run 名を採用。UT-GOV-004 成果物（実 check 由来）を唯一の入力源とする |
| 再発防止 | Phase 2 で「workflow 名禁止 / job 名 or check-run 名のみ採用」を AC-1 / AC-9 として明文化 |

### L-GOV001-2ND-002: dev / main 片側だけ更新による乖離

| 項目 | 内容 |
| --- | --- |
| カテゴリ | governance / branch-protection / atomicity |
| 症状 | 1 PUT が成功して 1 PUT が失敗した場合、dev / main の protection が乖離する |
| 解決 | `branch-protection-payload-{branch}.json` / `branch-protection-applied-{branch}.json` を branch 別ファイルとして必須化。直列 PUT（dev 検証完了後に main 実行）を runbook で固定 |
| 再発防止 | 片側失敗時に他方を再 PUT で揃える経路と部分 ROLLBACK 経路を `outputs/phase-05/apply-runbook-second-stage.md` に記述 |

### L-GOV001-2ND-003: admin block（`enforce_admins=true` 下）

| 項目 | 内容 |
| --- | --- |
| カテゴリ | governance / branch-protection / rollback readiness |
| 症状 | contexts を埋めた瞬間、対応 check-run が走っていない既存 PR は admin でも merge できなくなる |
| 解決 | 実行者が UT-GOV-001 で確立した rollback payload に即時アクセスできる状態で PUT を行う。Phase 11 事前 open PR check-run 進行確認を実行直前に再実施 |
| 再発防止 | rollback payload の location（UT-GOV-001 `outputs/phase-05/rollback-payload-{dev,main}.json`）を Phase 13 承認ゲート項目と quick-reference に明示。**rollback payload は再利用のみ・上書き禁止** |

### L-GOV001-2ND-004: UT-GOV-004 同期前の暫定 `contexts=[]` 残留

| 項目 | 内容 |
| --- | --- |
| カテゴリ | governance / drift / structural mitigation |
| 症状 | 1 段階目で `contexts=[]` が残ったまま忘れると、必須 status checks が事実上機能しない governance に陥る |
| 解決 | 本タスクの存在自体（second-stage reapply の独立タスク化）がこのリスクへの構造的対策。UT-GOV-001 完了タスクの §8.2 に後追い再 PUT 経路を明記 |
| 再発防止 | UT-GOV-001 Phase 12 unassigned-task-detection C-3 で必ず second-stage タスクを起票するゲートを敷く |

### L-GOV001-2ND-005: workflow 名 vs job 名の混同

| 項目 | 内容 |
| --- | --- |
| カテゴリ | governance / branch-protection / context-name semantics |
| 症状 | workflow ファイル名（`build-and-test.yml`）と check-run 名（`build (ubuntu-latest)` 等）は別物。誤って workflow 名を contexts に入れると merge block 事故 |
| 解決 | Phase 2 で「workflow 名禁止 / job 名 or check-run 名のみ採用」を明示。`<workflow name> / <job name>` フルパス記載（UT-GOV-004 AC-8 と整合） |
| 再発防止 | `outputs/phase-02/expected-contexts-{dev,main}.json` を実 check-run 名で固定し、AC-1 / AC-9 の検証対象とする |

### L-GOV001-2ND-006: dev / main 別 contexts の必要性

| 項目 | 内容 |
| --- | --- |
| カテゴリ | governance / branch-protection / per-branch divergence |
| 症状 | dev / main で走る workflow が異なる場合（例: dev のみ smoke deploy、main のみ release notes）、contexts 配列が異なる |
| 解決 | dev / main を 1 つの配列で扱わず、`expected-contexts-{dev,main}.json` 個別ファイルで管理。集合差分を `payload-design.md` で明文化 |
| 再発防止 | AC-2 として「dev / main 別配列 + 集合差分明文化」を必須化 |

### L-GOV001-2ND-007: CLAUDE.md drift 検査の片務化

| 項目 | 内容 |
| --- | --- |
| カテゴリ | governance / drift / canonical source authority |
| 症状 | GitHub 側 protection を正本としつつ、CLAUDE.md の記述が古いまま放置されると将来の運用判断を誤る |
| 解決 | Phase 9 で drift 検査（6 値: `required_pull_request_reviews=null` / `enforce_admins=true` / `allow_force_pushes=false` / `allow_deletions=false` / `required_linear_history` / `required_conversation_resolution`）を行い、検出時は `task-utgov001-drift-fix-001` を別タスクで起票（aiworkflow-requirements references 反映含む） |
| 再発防止 | 適用後 GET を正本として `applied-{branch}.json` を保全し、drift 検出 → 別タスク起票の片務化解消経路を Phase 12 unassigned-task-detection で固定 |

### L-GOV001-2ND-008: PR / commit / push の自動実行禁止（approval-gated NON_VISUAL）

| 項目 | 内容 |
| --- | --- |
| カテゴリ | process / Phase 13 boundary / destructive ops |
| 症状 | Phase 12 完了 = `spec_created` を「実 PUT してよい」と誤解されやすく、自走で `gh api PUT` / `git commit` / `git push` / `gh pr create` が走る事故が起きうる |
| 解決 | Phase 13 を「ユーザー承認ゲート + 実 PUT 実行ゲート + PR 作成ゲート」の三役に固定。Claude Code は以下 3 項目を **絶対に自走実行しない**: (1) `gh api -X PUT .../branches/{dev,main}/protection`、(2) `git commit` / `git push` / `gh pr create`、(3) Issue #202 への二段階目クローズアウトコメント |
| 再発防止 | `artifacts.json` の `phases[12].user_approval_required = true` を機械可読フラグ化。Issue #202 は CLOSED のまま扱い、PR body は `Refs #202` を採用し `Closes #202` は使用しない（再オープン禁止）。L-GOV-003 の二重ゲートをさらに「approval-gated NON_VISUAL implementation」へ拡張 |

## 同期完了サマリー（same-wave sync）

| 同期対象 | 状態 | 証跡 |
| --- | --- | --- |
| `docs/30-workflows/LOGS.md` | done | `utgov001-second-stage-reapply` spec_created 行を追加 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | done | 変更履歴 `v2026.04.30-utgov001-second-stage-reapply` |
| `.claude/skills/task-specification-creator/SKILL.md` | done | approval-gated NON_VISUAL implementation 事例を変更履歴へ追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | done | canonical task root 表に本 workflow を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | done | UT-GOV-001 second-stage reapply 早見を追加（rollback payload location 行 / admin token op 経路 行） |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | done | Phase 13 approval gate 付き active workflow として追加 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | done | aiworkflow-requirements 側 headline log へ追加 |

## skill 改善フィードバック（skill-feedback-report.md 由来）

| Skill | フィードバック | 提案 |
| --- | --- | --- |
| task-specification-creator | Approval-gated implementation tasks needs explicit distinction between `spec_created` and real execution | Phase 13 approval + execute pattern を採用 |
| task-specification-creator | NON_VISUAL implementation evidence は docs-only evidence と異なる | GET / PUT JSON artifacts を有効な NON_VISUAL evidence として文書化 |
| aiworkflow-requirements | Branch protection final-state 反映は applied GET evidence 取得後に限る | GitHub GET を canonical source として保持 |
| automation-30 | 30-method を Phase 3 と Phase 10 に分割する設計は機能する | 変更不要 |

## 関連リレー先 / 連鎖発火タスク

| relay 先 | 責務 |
| --- | --- |
| `task-utgov001-references-reflect-001` | Phase 13 applied GET evidence 取得後の aiworkflow-requirements references final sync（AC-14） |
| `task-utgov001-drift-fix-001` | drift（CLAUDE.md / deployment-branch-strategy.md と適用後 GET 6 値）検出時のみ条件発火 |
| `task-utgov-downstream-precondition-link-001` | UT-GOV-005〜007 への前提リンク追記 |
| UT-GOV-001 完了タスク §8.2 | 後追い再 PUT 経路として本タスクへリンク追記 |

## 不変条件 touched

CLAUDE.md §「重要な不変条件」#1〜#7 への影響なし。本タスクは GitHub governance 層に閉じる。`required_pull_request_reviews=null` / `enforce_admins=true` / `allow_force_pushes=false` / `allow_deletions=false` / `required_linear_history` / `required_conversation_resolution` の 6 値はすべて維持し、`required_status_checks.contexts` のみを書き換える。

## 関連参照

- `.claude/skills/aiworkflow-requirements/references/lessons-learned-ut-gov-001-2026-04.md` — UT-GOV-001 first apply の L-GOV-001〜004
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-ut-gov-004-branch-protection-context-sync.md` — UT-GOV-004 contexts 同期の L-GOV004-001〜006
- `.claude/skills/aiworkflow-requirements/references/workflow-utgov001-second-stage-reapply-artifact-inventory.md` — Phase 別 outputs と canonical 入力契約
- `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-13.md` — approval-gated NON_VISUAL の三役ゲート定義
- `docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md` §8.2 — 後追い再 PUT 経路の運用境界
