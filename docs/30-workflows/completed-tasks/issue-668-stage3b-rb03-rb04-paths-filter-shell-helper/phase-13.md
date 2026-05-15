# Phase 13: PR 作成

| 項目 | 値 |
|------|----|
| base | `dev` |
| head（想定） | `feat/issue-668-rb03-rb04` |
| 関連 Issue | #668（部分 follow-up） |

---

## 1. PR 作成前最終チェック

| # | 確認 | 状態 |
|---|------|------|
| C-1 | Phase 7 ローカル全 gate green | ☐ |
| C-2 | Phase 8 dry-run PR CI8-A / CI8-B 最低 2 本で `e2e-tests-coverage-gate` pass を観測 | ☐ |
| C-3 | `outputs/phase-11/evidence/` 配下 evidence が commit 済 | ☐ |
| C-4 | 旧 unassigned-task ファイルに deprecation 注記が追加済 | ☐ |
| C-5 | `pnpm indexes:rebuild` 実行 → drift なし | ☐ |
| C-6 | `git diff dev...HEAD --name-only` で意図しないファイルが含まれていない | ☐ |

---

## 2. PR title / body テンプレート

### title

```
ci(issue-668): add e2e paths filter + ci-shell-prelude + shellcheck gate (RB-3b-03/04)
```

### body

```markdown
## 概要

Issue #668 の残課題 2 RB（RB-3b-03 paths filter / RB-3b-04 shell helper + shellcheck gate）を完了する。

- RB-3b-01 (#700) / RB-3b-02 (#699) は実装済 (CLOSED)
- 本 PR で残り 2 RB を完了させ、Issue #668 の宣言と実態を一致させる

## スコープ

- `.github/workflows/e2e-tests.yml` に `precheck` job を追加
- `.github/workflows/e2e-tests.yml` に `precheck` job を追加し、docs-only PR でも `e2e-tests-coverage-gate` context を no-op success で完了させる（required check pending 罠の回避）
- `scripts/lib/ci-shell-prelude.sh` を新設し共通 prelude / GitHub Actions annotation helper を提供
- `scripts/coverage-gate-e2e.sh` / `scripts/coverage-guard.sh` を prelude `source` 化に refactor（既存挙動不変）
- `.github/workflows/lint-shell.yml` を新設し `shellcheck --severity=warning` gate を追加

## 不変条件

- `e2e-tests-coverage-gate` context name は変更なし（dev/main required check 維持）
- `.github/actions/setup-project` 改変なし
- D1 / Cloudflare 設定への影響なし
- mise / Node 24.15.0 / pnpm 10.33.2 維持

## 受入基準

- [ ] AC-668r-01 code PR で e2e matrix が起動
- [ ] AC-668r-02 docs-only PR で e2e matrix が skip
- [ ] AC-668r-03 docs-only PR でも `e2e-tests-coverage-gate` = success
- [ ] AC-668r-04 `ci-shell-prelude.sh` が必須関数を提供
- [ ] AC-668r-05 `coverage-gate-e2e.sh` / `coverage-guard.sh` が prelude を source
- [ ] AC-668r-06 `lint-shell.yml` が exit 0
- [ ] AC-668r-07 既存 coverage 判定挙動が回帰しない

## evidence

`docs/30-workflows/issue-668-stage3b-rb03-rb04-paths-filter-shell-helper/outputs/phase-11/evidence/` 配下:
- `outputs/phase-11/local-evidence-summary.md`
- `local/coverage-gate-{79,80,81}.log`
- `ci/ci8a-docs-only-pr-checks.txt` / `ci/ci8b-code-pr-checks.txt`
- `ci/lint-shell-run.txt`
- `inventory/files-changed.txt`

## 関連

- Refs #668 (CLOSED, 部分 follow-up)
- PR #700 (RB-3b-01 完了)
- PR #699 (RB-3b-02 完了)
- 親仕様書: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/`
- 本 spec: `docs/30-workflows/issue-668-stage3b-rb03-rb04-paths-filter-shell-helper/`

## test plan

- [ ] dry-run PR (docs-only / code) で `e2e-tests-coverage-gate` = success を確認
- [ ] `gh run list --workflow=lint-shell.yml` で shellcheck gate が起動
- [ ] `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` で required contexts に drift なし

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 3. PR 作成コマンド（user approval gate）

以下はユーザーが commit / push / PR 作成を明示承認した後にだけ実行する。Issue #668 は CLOSED のため、PR body では `Closes #668` / `Fixes #668` / `Resolves #668` を使わず `Refs #668` のみを使う。

```bash
gh pr create --base dev \
  --title "ci(issue-668): add e2e paths filter + ci-shell-prelude + shellcheck gate (RB-3b-03/04)" \
  --body "$(cat docs/30-workflows/issue-668-stage3b-rb03-rb04-paths-filter-shell-helper/outputs/phase-13/pr-body.md)"
```

> PR 本文は `outputs/phase-13/pr-body.md` として実装フェーズで切り出すことを推奨（再利用性のため）。

---

## 4. PR merge 後の post-actions

| # | アクション |
|---|------------|
| P-1 | Issue #668 に `gh issue comment 668 --body "follow-up PR merged: <URL>"` で notify |
| P-2 | 旧 `docs/30-workflows/unassigned-task/task-e2e-stage3b-rb-followup-composite-actions-001.md` を `docs/30-workflows/completed-tasks/` 配下に移動 |
| P-3 | 本仕様書ディレクトリも `docs/30-workflows/completed-tasks/issue-668-stage3b-rb03-rb04-paths-filter-shell-helper/` に移動 |
| P-4 | `docs/30-workflows/LOGS.md` に entry を追記（存在する場合） |

---

## 5. 完了条件

- [x] PR title / body テンプレートが確定
- [x] 作成コマンドが明示
- [x] 事前 6 チェック / 事後 4 アクションが列挙
