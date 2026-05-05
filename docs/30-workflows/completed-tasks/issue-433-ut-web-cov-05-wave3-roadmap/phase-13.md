# Phase 13: PR 作成

## 目的

Phase 12 まで完了した状態で、user の明示的な許可後に PR を作成する。`Refs #433` のみ使用し Issue は再 open しない。

## 実行前提（Approval Gate）

- Phase 1〜12 が全て completed
- Phase 12 7 ファイル実体存在
- `wave-3-roadmap.md` がリポジトリに配置済（Phase 9）
- aiworkflow-requirements references 2 ファイル更新済（Phase 10）
- `verify-indexes-up-to-date` が green（Phase 11）
- user による「PR 作成」明示指示

## ローカル品質ゲート

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

結果は `outputs/phase-13/local-check-result.md` に保存。失敗時は最大 3 回まで自動修復し、修復差分をコミット（CLAUDE.md「PR 作成の完全自律フロー」§品質検証失敗時の自動修復）。

## change-summary 構成

`outputs/phase-13/change-summary.md`:

- 新規: `docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md`
- 編集: `.claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md`
- 編集: `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- 編集: `docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md`（状態欄追記のみ）
- 再生成: `.claude/skills/aiworkflow-requirements/indexes/*`
- 仕様書一式: `docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/`

## PR 本文テンプレート

`outputs/phase-13/pr-template.md`:

```
## Summary
- UT coverage wave-2 完了後の残 gap を layer 別に集計し、wave-3 候補タスク 5〜10 件を rubric スコアリング付きで roadmap 化
- aiworkflow-requirements references から wave-3 roadmap が参照可能になり、indexes drift 0 / verify-indexes CI green を担保
- 元 unassigned-task spec（`Refs #433`）の状態欄を仕様書化済へ更新

## AC
- AC-1〜AC-5 を Phase 6 / 9 / 10 / 11 で達成（trace は implementation-guide.md 参照）

## Test plan
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `verify-indexes-up-to-date` CI green
- [ ] `wave-3-roadmap.md` 内リンクが全件 OK

Refs #433
```

## diff-to-pr 連携

CLAUDE.md「PR作成の完全自律フロー」に従い、user が「PR 作成」「PR 出して」「diff-to-pr」または同等指示をした場合に限り、確認質問なしで:

1. `git fetch origin main` → ローカル `main` を ff 同期
2. 作業ブランチに戻り `main` をマージ（コンフリクトは CLAUDE.md 既定方針）
3. ローカル品質ゲート 3 コマンド
4. `git status --porcelain` を確認し、対象ファイルだけを明示 `git add` して commit。`git add -A` は対象外 workflow 削除を巻き込むため禁止
5. `gh pr create` で本文を上記テンプレートで作成

## 変更対象ファイル一覧（CONST_005）

なし（PR 作成のみ。リポジトリ実体差分は Phase 9 / 10 / 12 で発生済）

## 入力 / 出力 / 副作用

- 入力: 全 Phase 出力、CLAUDE.md PR フロー、`gh` CLI
- 出力: `outputs/phase-13/local-check-result.md`、`change-summary.md`、`pr-template.md`、`pr-creation-result.md`（PR URL 記録）
- 副作用: branch push + PR 作成（user 承認後）

## テスト方針

- typecheck / lint exit 0
- PR 本文に AC-1〜5 trace と `Refs #433` が含まれる
- `gh pr view <num>` で title / body 確認

## 完了条件 / DoD

- [ ] user 承認後に PR 作成完了
- [ ] PR URL が `pr-creation-result.md` に記録
- [ ] `Refs #433`（Issue は CLOSED のまま、再 open しない）
- [ ] CI gate（typecheck / lint / verify-indexes）がすべて green

## 出力

- outputs/phase-13/main.md
- outputs/phase-13/local-check-result.md
- outputs/phase-13/change-summary.md
- outputs/phase-13/pr-template.md
- outputs/phase-13/pr-creation-result.md

## 参照資料

- CLAUDE.md「PR作成の完全自律フロー」
- .claude/commands/ai/diff-to-pr.md
- outputs/phase-12/implementation-guide.md

## メタ情報

- Phase: 13
- taskType: implementation
- visualEvidence: NON_VISUAL

## 実行タスク

- user approval 後にのみ commit / push / PR を実行する。

## 成果物/実行手順

- `outputs/phase-13/*` を作成し、PR 実行結果は承認後に記録する。

## 統合テスト連携

- NON_VISUAL。typecheck / lint / verify-indexes CI green を PR 前後で確認する。
