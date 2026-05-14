[実装区分: 実装仕様書]

# Phase 13: PR 作成（user 承認後 / base=dev）

## 1. ヘッダー

| 項目 | 値 |
|------|----|
| Phase | 13 / 13 |
| 名称 | `dev` 向け PR 作成 / completed-tasks 移動規律遵守 |
| 依存 (前) | Phase 12（ドキュメント完了） |
| 依存 (後) | なし（MVP 回帰防止 gate ワークフローの最終地点） |
| 想定工数 | 0.05 人日 |
| Mutation 種別 | **不可逆 / user 承認後実行**（`gh pr create` / `git push`） |

## 2. ゴール / 非ゴール

### ゴール
1. `dev` を base ブランチとする PR を作成（CLAUDE.md ポリシー: 既定 base は `dev`、`main` PR は `dev → main` リリース時のみ）
2. PR 本文に Phase 11 evidence / Phase 12 implementation guide / 4 screenshot 参照を含める
3. `git diff dev...HEAD --name-only` の scope が §3 ファイル表 + spec dir 配下のみであることを確認
4. completed-tasks への移動は `git mv` で行う（`git rm -r` 純削除禁止）

### 非ゴール
- `main` への PR（リリース時 `dev → main` の別フローで実施）
- CI green の確認（runtime の遷移は PR 作成後の状態監視）

## 3. 変更対象ファイル

| パス | 種別 | 説明 |
|------|------|------|
| GitHub PR | mutation | `--base dev` で作成 |
| `git push origin feat/ui-mvp-task-18-regression-gate` | mutation | ブランチ初回 push |
| `docs/30-workflows/completed-tasks/<task-dir>` | git mv | 完了 dir のアーカイブ（該当する場合） |

## 4. 手順 / コマンド

### 4.1 PR 作成前チェック

```bash
# CLAUDE.md「PR作成前チェック」項目
git status --porcelain                                     # 空であること
git fetch origin dev
git diff dev...HEAD --name-only                             # PR scope 確認
git diff dev...HEAD --name-only | grep -vE \
  '^(apps/web/(playwright\.config\.ts|tests/e2e/|package\.json)|scripts/verify-design-tokens|\.github/workflows/(verify-design-tokens|playwright-smoke)\.yml|package\.json|docs/(30-workflows|00-getting-started-manual/specs/09b))' \
  && echo 'OUT-OF-SCOPE FILE DETECTED' || echo 'scope OK'
```

scope 外ファイルを検出した場合は `git checkout HEAD -- <path>` で復旧してから commit（SCOPE.md §6 diff scope 規律）。

### 4.2 dev 同期 → ブランチへ取り込み

```bash
git fetch origin dev
git checkout dev && git pull --ff-only origin dev
git checkout feat/ui-mvp-task-18-regression-gate
git merge dev
# conflict は CLAUDE.md「コンフリクト解消の既定方針」表に従い解消
```

### 4.3 品質再検証（CLAUDE.md PR 作成 3 コマンド）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

失敗時は CLAUDE.md「品質検証失敗時の自動修復」に従い最大 3 回修復。

### 4.4 push & PR 作成（user 承認後実行）

```bash
git push -u origin feat/ui-mvp-task-18-regression-gate

# PR 本文は HEREDOC で送る
gh pr create --base dev --title "feat(ui-mvp): task-18 verify-tokens & playwright-smoke regression gate" --body "$(cat <<'EOF'
## Summary
- `ui-prototype-alignment-mvp-recovery` ワークフローの最終 wave。
- verify-design-tokens / playwright-smoke (19 routes) / visual baseline (4 screens) の 3 本を CI gate 化。
- branch protection `main` / `dev` の `required_status_checks.contexts` に 3 本を追加（別途 user-gated）。

## Scope
- 新規: `scripts/verify-design-tokens.ts(.test.ts)` / `apps/web/tests/e2e/full-smoke.spec.ts` / `apps/web/tests/e2e/visual/*.spec.ts` (+ `__screenshots__/`) / `apps/web/tests/e2e/fixtures/auth.ts` / `.github/workflows/{verify-design-tokens,playwright-smoke}.yml`
- 編集: `apps/web/playwright.config.ts` / `package.json` / `apps/web/package.json` / `docs/00-getting-started-manual/specs/09b-design-tokens.md` (§10 verify gate 言及のみ)
- 仕様書: `docs/30-workflows/task-18-verify-tokens-playwright-smoke-spec/` (Phase 1-13 / 00-index)

## Evidence
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-11/main.md`
- `outputs/phase-11/evidence/` (typecheck / lint / verify-tokens / test / e2e-smoke / e2e-visual / branch-protection JSON)
- baseline 4 png: `apps/web/tests/e2e/visual/__screenshots__/{login,public-top,admin-dashboard,profile}.spec.ts/*.png`

## Implementation Guide
- `outputs/phase-12/implementation-guide.md` (Part1) / `implementation-guide-part2.md` (Part2)

## Test plan
- [ ] CI `verify-design-tokens / verify-design-tokens` green
- [ ] CI `playwright-smoke / smoke (chromium)` green
- [ ] CI `playwright-smoke / visual (chromium, 4 screens)` green
- [ ] branch protection contexts に 3 本追加済み（user-gated mutation: Phase 10 で別途実行）

State: PASS_BOUNDARY_SYNCED_RUNTIME_PENDING (CI 3 本 green で PASS 昇格)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 4.5 PR にスクリーンショット参照（CLAUDE.md ルール）

`outputs/phase-11/` 配下に png がある場合のみ PR 本文に Screenshots セクションを追加する。本 task の screenshot 正本は `apps/web/tests/e2e/visual/__screenshots__/` 配下のため、Phase 11 で `outputs/phase-11/` 直下に画像を置かない場合は Screenshots セクションを作らない（CLAUDE.md 既定方針）。

### 4.6 completed-tasks 移動（該当する場合）

仕様書ディレクトリを完了アーカイブへ移す必要が出た場合は **必ず `git mv`** を使う:

```bash
git mv docs/30-workflows/ui-prototype-alignment-mvp-recovery/08-regression/task-18-w7-solo-verify-tokens-and-playwright-smoke.md \
       docs/30-workflows/completed-tasks/task-18-verify-tokens-and-playwright-smoke/task-18-w7-solo-verify-tokens-and-playwright-smoke.md

# 禁止: git rm -r （履歴を断つ純削除は SCOPE.md §6 違反）
```

本 PR では元仕様の即時 archive は行わず、上位ワークフロー全体の完了をもって別 PR で archive する（task-18 単独で先に archive すると DAG の依存元参照が壊れるリスクがあるため）。

## 5. テスト・検証方針

| 検証項目 | 方法 |
|---------|------|
| PR scope 適合 | `git diff dev...HEAD --name-only` が §3 表 + spec dir 配下のみ |
| 本文 PR Template 適合 | Summary / Scope / Evidence / Implementation Guide / Test plan / State の 6 セクションを含む |
| base ブランチ | PR の base ref が `dev`（production リリース時のみ `main`） |
| 画像参照整合 | `outputs/phase-11/` 直下に png がなければ Screenshots セクションを設けない |
| linear history | merge コミットを feat ブランチ側に作っていない（`git log --merges feat/ui-mvp-task-18-regression-gate ^dev` が空） |

## 6. ローカル実行コマンド

```bash
# 事前チェック
git status --porcelain
git fetch origin dev
git diff dev...HEAD --name-only

# 再検証
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# push & PR 作成 (user 承認後)
git push -u origin feat/ui-mvp-task-18-regression-gate
gh pr create --base dev --title "..." --body "..."
```

## 7. DoD チェックリスト

- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` の scope が §3 ファイル表 + spec dir のみ
- [ ] `pnpm typecheck` / `pnpm lint` 通過
- [ ] PR の base ブランチが `dev`（`main` でないこと）
- [ ] PR 本文に Summary / Scope / Evidence / Implementation Guide / Test plan / State の 6 セクション
- [ ] PR 本文の Test plan に required status checks 3 本がチェック項目として並ぶ
- [ ] State 行に `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を明記
- [ ] completed-tasks への移動が必要な場合は `git mv` を使用、`git rm -r` 純削除は使っていない
- [ ] PR URL を最終レポートに記載
