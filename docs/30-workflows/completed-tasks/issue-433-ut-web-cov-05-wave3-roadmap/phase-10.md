# Phase 10: aiworkflow references 反映 + indexes 再生成

## 目的

`wave-3-roadmap.md` を aiworkflow-requirements skill から参照可能にし、`pnpm indexes:rebuild` 後の indexes drift を 0 にして AC-4 / AC-5 を達成する。

## 編集対象 1: workflow-ut-coverage-2026-05-wave-artifact-inventory.md

`.claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md`

- wave-2 アーティファクト一覧の末尾、または「wave-3 計画」見出し（無ければ追加）配下に以下のエントリを追加:
  - `docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md` — wave-2 後の残 gap 層別分析と wave-3 候補タスクリスト
  - `docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/` — 本タスク仕様書（roadmap の上流仕様）

## 編集対象 2: task-workflow-active.md

`.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

- active workflow 索引に以下を追加:
  - `issue-433-ut-web-cov-05-wave3-roadmap` / 状態: `spec_created` / 種別: `implementation / NON_VISUAL` / 関連: `ut-coverage-2026-05-wave` / 参照: `wave-3-roadmap.md`

既存項目の並び順は時系列降順（最新を上）を踏襲する。

## indexes 再生成

```bash
mise exec -- pnpm indexes:rebuild
git status -- .claude/skills/aiworkflow-requirements/indexes
```

drift（未コミット差分）があれば全件 add 対象とする。drift が 0 のまま再生成成功した場合も、生成物が既にコミット済みであれば status は clean。

## 変更対象ファイル一覧（CONST_005）

| パス | 変更種別 | 備考 |
| --- | --- | --- |
| .claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md | 編集 | roadmap link 追加 |
| .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | 編集 | active workflow 索引追加 |
| .claude/skills/aiworkflow-requirements/indexes/* | 再生成 | `pnpm indexes:rebuild` |

## 入力 / 出力 / 副作用

- 入力: `wave-3-roadmap.md`（Phase 9 で配置済）
- 出力: 上記 2 references の diff + 再生成 indexes + `outputs/phase-10/aiworkflow-references-diff.md` + `indexes-rebuild-log.md`
- 副作用: indexes 配下のファイル更新（コミット必要）

## テスト方針

- references 2 ファイルから `wave-3-roadmap.md` への相対リンクが grep でヒット
- `pnpm indexes:rebuild` exit 0
- `git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes` 後に追加すべき drift がコミットに含まれている（drift 0 化）

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm indexes:rebuild | tee docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-10/indexes-rebuild-log.md

grep -l 'wave-3-roadmap.md' \
  .claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md \
  .claude/skills/aiworkflow-requirements/references/task-workflow-active.md
```

## 完了条件 / DoD

- [ ] AC-4: 2 references から `wave-3-roadmap.md` が参照可能
- [ ] `pnpm indexes:rebuild` exit 0、ログ保存済み
- [ ] indexes drift 0 でコミット可能
- [ ] aiworkflow-references-diff.md に変更前後の差分が記録

## 出力

- outputs/phase-10/main.md
- outputs/phase-10/aiworkflow-references-diff.md
- outputs/phase-10/indexes-rebuild-log.md

## 参照資料

- CLAUDE.md「よく使うコマンド」/「Git hook の方針」
- .github/workflows/verify-indexes.yml

## メタ情報

- Phase: 10
- taskType: implementation
- visualEvidence: NON_VISUAL

## 実行タスク

- aiworkflow references を同期し、indexes を再生成する。

## 成果物/実行手順

- `outputs/phase-10/main.md`、`aiworkflow-references-diff.md`、`indexes-rebuild-log.md` を作成する。

## 統合テスト連携

- NON_VISUAL。`pnpm indexes:rebuild` exit 0 と references grep を確認する。
