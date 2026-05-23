# Phase 6: 実装手順（ステップバイステップ / 1 PR + close-out コミット）

## 目的

Phase 5 で確定した変更対象を 1 PR で実装し、D+7 で close-out コミットを 1 件追加するための順序付き手順を確定する。各ステップに「実行コマンド / 期待出力 / NG 時の対処」を併記し、Phase 7（テスト計画）で検証可能な形に揃える。

## 完了条件

- [ ] PR 1 本で workflow YAML 編集 + 7day summary YAML 新規 + SSOT 4 ファイル編集 + Phase 11 local 5 点 evidence + Phase 12 strict 7 outputs が完結する手順が確定している
- [ ] 各ステップに「実行コマンド / 期待出力 / NG 時の対処」が併記されている
- [ ] D+7 close-out コミットの手順が `outputs/phase-11/evidence/` 4 ファイル追加 + SSOT 再 commit で確定している
- [ ] rollback 必要時の即時手順（`gh variable set` 1 行 + revert PR）が含まれている

## 前 Phase 依存

- Phase 4: Gate 通過 / 環境準備 / production D1 列確認
- Phase 5: 変更対象ファイルと I/O 契約

## ステップ 1: ブランチ作成（dev 起点）

```bash
git fetch origin dev
bash scripts/new-worktree.sh feat/issue-586-post-switch-7day-close-out
cd .worktrees/<生成された worktree dir>
mise exec -- pnpm install
```

期待: 新規 worktree に Node 24 / pnpm 10 で依存解決が成功。NG 時は `mise install` 再実行 + `pnpm install --force`。

## ステップ 2: `.github/workflows/cf-audit-log-monitor.yml` 編集

Phase 5-2-1 の after diff を反映:

- `environment: production` を job に追加
- `permissions: { contents: read, issues: write }` を追加
- `env:` に `CF_AUDIT_CLASSIFIER: ${{ vars.CF_AUDIT_CLASSIFIER }}` / `ML_MODEL_PATH: ${{ secrets.CF_AUDIT_ML_MODEL_PATH_PROD }}` を設定
- 末尾 step に leakage grep / fallback alert / artifact upload を追加（`if: always()` を 2 番目以降に付与し hourly fail でも artifact は残す）

```bash
mise exec -- pnpm prettier --check .github/workflows/cf-audit-log-monitor.yml
```

期待: prettier check pass。NG 時は `--write` で整形。

## ステップ 3: `.github/workflows/cf-audit-log-7day-summary.yml` 新規作成

Phase 5-2-2 の YAML をそのまま配置。

```bash
ls -la .github/workflows/cf-audit-log-7day-summary.yml
mise exec -- pnpm prettier --check .github/workflows/cf-audit-log-7day-summary.yml
```

期待: ファイル存在確認 + prettier pass。

## ステップ 4: GitHub Variables 設定（PR merge と独立した手動 1 step）

```bash
# 現在値確認（マスク表示）
gh variable list --env production | grep CF_AUDIT_CLASSIFIER || echo "(unset)"

# 設定（ユーザー明示承認後のみ実行）
gh variable set CF_AUDIT_CLASSIFIER --env production --body "ml"
```

期待: 設定後 `gh variable list --env production` に entry が現れる。NG 時は env scope を持つ admin token を使い直す。

> このステップは workflow YAML PR の merge と同じタイミングで実行する。PR merge 前に設定すると `vars.CF_AUDIT_CLASSIFIER` 参照がない旧 workflow が ml をすでに参照する形になり矛盾する。

## ステップ 5: SSOT 4 ファイル編集

Phase 3-4 の追記内容を反映:

1. `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`: `pass_runtime_synced` 状態定義 + canonical evidence path
2. `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`: 親 #549 entry の `state` を `pass_runtime_synced` に更新する手順を本サイクルでは「D+7 で適用」と注記。本サイクル merge 時点では `implemented-local-runtime-pending` を維持
3. `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-13.md` legacy stub: 「`spec_created`; do not treat as completed evidence.」を残しつつ「D+7 で `pass_runtime_synced` に書き換え予定」のリード文を追加
4. `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`: 7 日観測手順 + `pass_runtime_synced` 昇格条件 + canonical evidence path

```bash
git diff --stat docs/ .claude/skills/aiworkflow-requirements/references/
```

期待: 4 ファイルに diff、それ以外には diff なし。

## ステップ 6: Phase 11 local 5 点 evidence 取得

```bash
mkdir -p outputs/phase-11/evidence
mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-11/evidence/typecheck.log
mise exec -- pnpm lint 2>&1 | tee outputs/phase-11/evidence/lint.log
mise exec -- pnpm vitest run \
  scripts/cf-audit-log/observation/__tests__ \
  scripts/cf-audit-log/__tests__/evaluation.test.ts \
  --reporter=verbose 2>&1 | tee outputs/phase-11/evidence/test.log
mise exec -- pnpm build 2>&1 | tee outputs/phase-11/evidence/build.log
mise exec -- pnpm tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts \
  outputs/phase-11/evidence/ --exit-on-detect 2>&1 | tee outputs/phase-11/evidence/grep-gate.log
echo $?
```

期待: typecheck / lint は新規エラー 0 件（既存 `@sentry/*` missing は known-failure）/ focused test pass / build pass / grep-gate exit 0。

NG 時:
- typecheck 失敗 → 新規導入の YAML 改修以外で TS 影響なしのはず。出た場合は最小修正
- focused test 失敗 → fixture と aggregation 出力 schema を Phase 5-3 と照合

## ステップ 7: Phase 12 strict 7 outputs 配置

`outputs/phase-12/` 配下に Phase 12 仕様（`phase-12.md`）に従い:

1. `main.md`
2. `implementation-guide.md`（Part 1 中学生レベル + Part 2 技術者レベル）
3. `system-spec-update-summary.md`
4. `documentation-changelog.md`
5. `unassigned-task-detection.md`
6. `skill-feedback-report.md`
7. `phase12-task-spec-compliance-check.md`

短縮名・別名は禁止。

## ステップ 8: 7day summary workflow の dry-run

GitHub UI または CLI から `cf-audit-log-7day-summary.yml` を `workflow_dispatch` で 1 回実行する（Phase 4 で Gate-PARENT-MERGED が通っていることが前提）。

```bash
gh workflow run cf-audit-log-7day-summary.yml --ref dev
gh run list --workflow=cf-audit-log-7day-summary.yml --limit 1
```

期待: download-artifact が 0 件でも aggregation script が `actualSnapshots: 0` の summary を出力し PR 起票せず exit 1（merge 直後は hourly artifact が無いため正常な dry-run 失敗）。NG 時は YAML 構文エラーを修正。

## ステップ 9: commit / push（ユーザー明示承認後）

```bash
git add .github/workflows/cf-audit-log-monitor.yml \
        .github/workflows/cf-audit-log-7day-summary.yml \
        docs/00-getting-started-manual/specs/15-infrastructure-runbook.md \
        docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-13.md \
        .claude/skills/aiworkflow-requirements/references/observability-monitoring.md \
        .claude/skills/aiworkflow-requirements/references/task-workflow-active.md \
        docs/30-workflows/issue-586-post-switch-7day-close-out/
git commit -m "feat(cf-audit-log): post-switch 7-day close-out workflow + spec (Refs #549, Refs #586)"
git push -u origin feat/issue-586-post-switch-7day-close-out
```

## ステップ 10: PR open（Phase 13 へ）

Phase 13 の多段承認 Gate を通過後、`gh pr create --base dev --title "feat(cf-audit-log): post-switch 7-day close-out (Refs #549, Refs #586)" --body "..."` を実行する。

## ステップ 11（D+7 close-out コミット）

production switch merge から 168 hour 経過後:

```bash
# 7day summary workflow を手動 trigger（または scheduled run の自動起動を待つ）
gh workflow run cf-audit-log-7day-summary.yml --ref dev

# 起票された evidence PR を確認
gh pr list --base dev --search "7-day evidence"
```

7day summary workflow が起票した PR を merge することで `outputs/phase-11/evidence/hourly-run-7day-summary.json` 等 4 ファイルが `dev` に commit される。同時に SSOT 4 ファイルの `pass_runtime_synced` 文言を **本サイクルの spec_created 状態から実反映** に書き換えるフォローアップ PR を 1 件出す（手動）。

## ステップ 12（rollback 手順 / 必要時のみ）

致命検知時:

```bash
gh variable set CF_AUDIT_CLASSIFIER --env production --body "threshold"
# 必要なら revert PR
gh pr create --base dev --title "revert: cf-audit-log post-step (Refs #549, Refs #586)" --body "..."
```

D1 schema は触らない（forward-safe）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 参照資料

- `phase-05.md`
- 親 `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-06.md`
