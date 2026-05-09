# Phase 13: PR 作成（Stage 0）

date (absolute): 2026-05-09 / branch: `feat/e2e-quality-uplift` / PR base: `dev` / coverageTier: `standard`

---

## 0. 前提（user 明示承認待ち）

| 項目 | 値 |
| --- | --- |
| PR 作成は user 明示承認後のみ | YES（本仕様書段階では PR 作成しない） |
| 本 phase の役割 | PR 本文 draft / quality gate 手順 / branch 状態確認手順を仕様書化する |
| 実 PR 作成は次の user prompt（「PR 作成」「diff-to-pr」等）で起動 | YES |

---

## 1. 採用フロー

`.claude/commands/ai/diff-to-pr.md` の Phase 13 仕様 + CLAUDE.md「PR作成の完全自律フロー」に準拠する。本 PR は implementation のため簡素化:

| step | 操作 |
| --- | --- |
| 1 | `git status --porcelain` で docs / apps/web / .claude/skills / Stage 1-3 spec package の実差分を確認 |
| 2 | `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward |
| 3 | 作業ブランチ `feat/e2e-quality-uplift` に戻り `git merge dev`（コンフリクトは想定なし、docs のみ） |
| 4 | `mise exec -- pnpm install --force` |
| 5 | `mise exec -- pnpm typecheck` |
| 6 | `mise exec -- pnpm lint` |
| 7 | `git add` はユーザー承認後に、Stage 0実装差分とStage 1-3 spec packageを明示 path 指定で行う |
| 8 | commit message を HEREDOC で生成（後述） |
| 9 | `git push -u origin feat/e2e-quality-uplift` |
| 10 | `gh pr create --base dev --title <title> --body <body>` |

---

## 2. PR title（70 文字以内）

```
test(e2e): formalize stage 0 Playwright quality uplift
```

---

## 3. PR body（diff-to-pr.md 準拠）

```
## Summary

- Stage 0 仕様書を Phase 4〜13 まで完成させ、Playwright README / project filter / evidence-capture project / logged-in readonly evidence spec rename を実装した
- R1（`profile-readonly.spec.ts` の evidence 専用性がファイル名から分からない問題）を **案 A: evidence-only spec rename/extract** に確定
- `quality-gates.md` §7.1 / §7.5 と coverage standards を同期し、Stage 1-3 は `spec_verified_pending_dependency` として実装済み扱いしない

## Changes

| path | 種別 |
| --- | --- |
| apps/web/playwright/README.md | new |
| apps/web/playwright.config.ts / apps/web/package.json | edit |
| apps/web/playwright/tests/profile-readonly-logged-in.spec.ts | new |
| apps/web/playwright/tests/profile-visibility-request.spec.ts / profile-delete-request.spec.ts | edit |
| .claude/skills/task-specification-creator/** | edit |
| .claude/skills/aiworkflow-requirements/** | edit |
| docs/30-workflows/e2e-quality-uplift-stage-0..3/ | new/edit spec package |

## Test plan

- [x] L1 docs-grep（phase-11 §2）: 13 phase 見出し / `evidence-capture` 言及 / R1 案 A 言及
- [x] L2 lint-boundary（phase-11 §2）: apps/web / .claude/skills 実差分を本サイクル対象として確認
- [x] line budget（phase-9 §1）: 全 phase <= 350 行
- [x] mise exec -- pnpm --filter @ubm-hyogo/web typecheck
- [x] mise exec -- pnpm --filter @ubm-hyogo/web lint
- [x] mise exec -- pnpm --filter @ubm-hyogo/web test:e2e:list
- [x] mise exec -- pnpm --filter @ubm-hyogo/web test:e2e:evidence:list
- [ ] スクリーンショット: NON_VISUAL タスクのため不要（phase-11 §1 宣言）

## Boundary

Full browser E2E, Stage 2 coverage enforcement, Stage 3 CI / Lighthouse / branch protection apply are not claimed in this PR. Stage 1-3 remain `spec_verified_pending_dependency`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 4. quality gate 想定結果

| gate | 期待 |
| --- | --- |
| `pnpm install --force` | 成功（lockfile 変動なし想定） |
| `pnpm typecheck` | 成功（TS source 未変更） |
| `pnpm lint` | 成功（markdown のみ、ESLint 対象外） |
| CI `verify-indexes-up-to-date` | pass（skill indexes 未 touch） |
| CI `verify-design-tokens` | pass（CSS / TSX 未 touch） |

---

## 5. PR 作成後アクション

- PR URL を user に報告
- Phase 10 §3 残課題（H-1〜H-6）を本サイクル task spec の入力として明示
- Stage 1 着手前に本 PR が `dev` に merge されていることを `gh pr view` で確認

---

## 6. Phase 13 完了条件

- PR title / body / step フロー仕様化 ✓
- quality gate 想定結果記録 ✓
- user 明示承認待ち宣言 ✓

→ Stage 0 全 13 phase 完了。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-0
- phase: 13
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: verified

## 目的

Stage 0 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
