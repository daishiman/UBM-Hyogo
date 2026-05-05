# Phase 13: ユーザー承認待ち commit / PR 境界の記録 — 06b-c-runtime-evidence-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-c-runtime-evidence-execution |
| phase | 13 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation（gate） |
| user_approval_required | **true**（commit / push / PR 作成すべて） |

## 目的

本タスクは Issue #449 に従い「commit / push / PR 作成は含めない」。Phase 13 では **user 明示承認待ちの blocked placeholder** として、commit message draft / PR title draft / PR body template を `outputs/phase-13/main.md` に記録するに留める。実行は禁止する。

## 入力 / 出力

| | 内容 |
| --- | --- |
| 入力 | Phase 11 runtime summary、Phase 12 implementation-guide |
| 出力 | `outputs/phase-13/main.md`（blocked placeholder + drafts） |
| 副作用 | **無し**。`git add` / `git commit` / `git push` / `gh pr create` は本仕様書段階でも実行段階でも user 明示指示まで実行しない |

## 13.1 blocked placeholder

`outputs/phase-13/main.md` 冒頭に明示する:

```md
# Phase 13 — BLOCKED (awaiting explicit user approval)

このタスクは Issue #449 に従い、commit / push / PR 作成を含めない。
以下の draft はすべて placeholder として記録されており、user 明示承認まで実行しない。

- 承認待ちアクション: git add / git commit / git push -u origin <branch> / gh pr create
- 承認者: <user>
- 承認日: <pending>
- 承認 scope: 「以下に列挙する evidence / docs 更新を当該ブランチに commit し、PR を作成して良い」
```

## 13.2 ブランチ命名

| 用途 | ブランチ名 |
| --- | --- |
| 仕様書作成（既存） | `docs/issue-449-06b-c-runtime-evidence-execution-task-spec` |
| runtime evidence commit（承認後に新規作成） | `chore/issue-449-06b-c-runtime-evidence-capture` |

## 13.3 commit message draft（user 承認後に使用）

```text
chore(profile-evidence): capture 06b-C /profile logged-in runtime evidence

- M-08 / M-09 / M-10 / M-16 を Playwright + capture wrapper で実測
- M-14 / M-15 は手動取得（または BLOCKED 記録）
- manual-smoke-evidence.md を pending → captured/blocked に同期
- 06b-C 完成版 outputs/phase-12/ implementation-guide.md / unassigned-task-detection.md /
  phase12-task-spec-compliance-check.md / skill-feedback-report.md を runtime 実測で更新
- 本タスク workflow root (docs/30-workflows/06b-c-runtime-evidence-execution/) を新規追加

Refs: #449
Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## 13.4 PR title draft

- `chore(profile): capture 06b-C runtime evidence (Issue #449)`（70 文字以内）

## 13.5 PR body template

```md
## Summary
- Issue #449 (closed) に対応する runtime evidence execution
- 先行タスク 06b-C-profile-logged-in-visual-evidence で準備済み spec / wrapper を実測実行
- M-08 / M-09 / M-10 / M-16 を capture、M-14 / M-15 を手動取得 or BLOCKED 記録
- 先行タスク Phase 11 / Phase 12 を runtime 実測値へ同期

## Changes
### evidence (先行タスク outputs/phase-11/ 配下)
- screenshots/M-08-{desktop,mobile}-{date}.png
- screenshots/M-10-{desktop,mobile}-{date}.png
- screenshots/M-16-redirect-{date}.png
- dom/M-09-no-form-{desktop,mobile}.json (counts=0)
- dom/M-10-edit-query-ignored-{desktop,mobile}.json (counts=0)
- manual-smoke-evidence.md (pending → captured/blocked)
- main.md (runtime summary 追記)

### 先行タスク Phase 12 sync
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/documentation-changelog.md

### 本タスク workflow root
- docs/30-workflows/06b-c-runtime-evidence-execution/ 新規（index / artifacts / phase-01..13 / outputs）

## Evidence
- runtime command（redact 済）: outputs/phase-05/command-log.md
- AC matrix: outputs/phase-07/ac-matrix.md
- secret check: outputs/phase-09/main.md
- runtime summary: outputs/phase-11/main.md

## Test plan
- [x] dry-run（production guard reject 確認）
- [x] storageState 取得・gitignore 確認
- [x] capture wrapper 実行 (exit 0)
- [x] DOM dump counts = 0 検査
- [x] redaction 目視 + grep
- [x] secret 露出チェック PASS
- [ ] CI（typecheck / lint / verify-indexes）GREEN（PR 作成後に確認）

## Invariants
- #4 本文更新は Google Form 再回答のみ — M-09 で form/textarea/submit count = 0 を実測
- #5 public/member/admin boundary — M-10 / M-16 で境界確認
- #8 GAS prototype を正本にしない — 該当なし
- #11 管理者も他人本文を直接編集しない — self-profile read-only 確認

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 13.6 user 承認後の実行手順（draft / 本仕様書では実行しない）

承認が得られた場合のみ、以下を順に実行する:

1. `git fetch origin main && git checkout main && git pull --ff-only`
2. `git checkout -b chore/issue-449-06b-c-runtime-evidence-capture`
3. `git merge main`（コンフリクトは CLAUDE.md 方針）
4. `mise exec -- pnpm install --force && pnpm typecheck && pnpm lint`
5. `git add` で以下を明示追加（**`git add -A` は禁止**。state.json 等の混入防止）:
   - `docs/30-workflows/06b-c-runtime-evidence-execution/`（本タスク全体）
   - `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/screenshots/M-*.png`
   - `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/dom/M-*.json`
   - `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/manual-smoke-evidence.md`
   - `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/main.md`
   - `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-12/*.md`
6. `git status` で意図しない file（state.json / .env / token 系）が staged になっていないか目視
7. `git commit -m "$(cat <<'EOF' ... EOF)"` で 13.3 のメッセージで commit
8. `git push -u origin chore/issue-449-06b-c-runtime-evidence-capture`
9. `gh pr create --title "..." --body "$(cat <<'EOF' ... EOF)"` で 13.4 / 13.5 を投入
10. `gh pr view --json url` で URL 確認、`outputs/phase-13/main.md` の `pr_url` に記録

## 完了条件チェックリスト

- [ ] `outputs/phase-13/main.md` に BLOCKED 宣言が記載
- [ ] commit message / PR title / PR body の draft が記載
- [ ] 承認後の実行手順（10 ステップ）が draft として記載
- [ ] 本仕様書段階で `git add` / `git commit` / `git push` / `gh pr create` を実行していない
- [ ] PR 作成は user 明示承認まで保留である旨が明記

## 次 Phase への引き渡し

完了。user 承認後に 13.6 を実行することで、Issue #449 と本タスクが closeable となる。
