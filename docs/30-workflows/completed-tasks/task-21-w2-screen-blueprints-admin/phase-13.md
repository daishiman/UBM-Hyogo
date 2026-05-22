# Phase 13: PR 作成準備（ユーザー承認後実行）

[実装区分: ドキュメントのみ]
判定根拠: PR 本文 / change-summary / local-check 結果の文書化のみ。実 PR 作成は user 承認後にのみ実行。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-21-w2-screen-blueprints-admin |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成準備 |
| Wave | W2 (parallel) |
| Mode | sequential / docs-only / NON_VISUAL |
| 作成日 | 2026-05-07 |
| 前 Phase | 12（ドキュメント整備） |
| 次 Phase | なし |
| 状態 | blocked_pending_user_approval |

## 目的

09g 作成または repair + 本 workflow package（13 phase 仕様書 + outputs）を 1 つの PR にまとめる準備として、local-check 結果 / change-summary / PR テンプレを作成する。
**PR 自体の作成は user の明示承認後にのみ実行する**（CLAUDE.md PR 作成自律フロー準拠）。

## 主要意思決定

- **決定 1**: 本 PR の diff scope は `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` 作成/修正 + `docs/30-workflows/task-21-w2-screen-blueprints-admin/**` のみ。task-21 末尾 diff scope 規律に従う。
- **決定 2**: PR title は `docs(specs): add 09g-screen-blueprints-admin (admin 8 routes blueprint)`（70 字以下）。
- **決定 3**: PR 本文は `.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として準拠し、Phase 12 implementation-guide.md の主要見出しを反映する。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 12 | 6 ドキュメント | PR 本文 source |
| 上流 | Phase 11 | evidence | PR 本文 evidence section |
| 外部 | user 承認 | go/no-go | PR 作成 trigger |

## 変更対象ファイル（C/R/M/D）

| 区分 | path |
| --- | --- |
| C | `outputs/phase-13/main.md` |
| C | `outputs/phase-13/local-check-result.md` |
| C | `outputs/phase-13/change-summary.md` |
| C | `outputs/phase-13/pr-template.md` |
| C | `outputs/phase-13/pr-info.md` |
| C | `outputs/phase-13/pr-creation-result.md`（user 承認後にのみ追記。承認前は blocked であることを記録） |

## 実行タスク

- 本 Phase の目的に対応する文書作成・検証・記録を実行する。
- 実行結果は `outputs/phase-N/` 配下へ保存し、root `artifacts.json` の該当 Phase status と整合させる。
- docs-only / NON_VISUAL のため、`apps/` / `packages/` の実装コードは本 Phase では変更しない。

## 統合テスト連携

N/A。pure docs-only / NON_VISUAL workflow のため、実装統合テストは発生しない。代替として本 Phase の grep / diff / lint / file-existence evidence を Phase 11 と Phase 12 compliance check に連携する。

## 成果物

- 本 Phase の `outputs/phase-N/main.md` または同等の phase evidence。
- 必要に応じた補助ログ・差分・チェック結果。
- root `artifacts.json` の phase status 更新。

## 入力 / 出力

- 入力: Phase 11 evidence、Phase 12 6 ドキュメント、09g 完成版
- 出力: 6 ファイル（pr-creation-result.md は user 承認後）

## テスト方針（local-check）

```bash
# diff scope 確認
git status --short | tee /tmp/diff-scope.txt
# 期待: 09g + docs/30-workflows/task-21-w2-screen-blueprints-admin/** のみ
sed -E 's/^.. //' /tmp/diff-scope.txt \
  | grep -vE '^(docs/00-getting-started-manual/specs/09g-screen-blueprints-admin\.md|docs/30-workflows/task-21-w2-screen-blueprints-admin/)' \
  && echo "FAIL: out of scope file detected" || echo "PASS"

# local checks: docs-only だが workspace script がある場合のみ実行
mise exec -- pnpm install --force
node -e "process.exit(require('./package.json').scripts?.typecheck ? 0 : 1)" \
  && mise exec -- pnpm typecheck \
  || echo "NO_TYPECHECK_SCRIPT_OR_SKIPPED"
node -e "process.exit(require('./package.json').scripts?.lint ? 0 : 1)" \
  && mise exec -- pnpm lint \
  || echo "NO_LINT_SCRIPT_OR_SKIPPED"

# 09g 視覚値 0 件再確認
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
! grep -nE '#[0-9a-fA-F]{3,8}\b|oklch\(|\b[0-9]+px\b|\bbg-\[' "$F" && echo PASS || echo FAIL
```

## PR テンプレ（pr-template.md）

```markdown
## Summary
- `09g-screen-blueprints-admin.md`（新規 700〜1200 行）を追加し、admin 8 routes + AdminSidebar 共通の blueprint を確定
- AdminSidebar §1 集約 / 派生ルール正本転記 / 視覚値 0 件 / phase-3 §2 と §X.4 完全一致を全て満たす
- task-15 / 16 / 17 の admin 実装着手の正本となる

## Changes
- C/M: `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`
- C: `docs/30-workflows/task-21-w2-screen-blueprints-admin/**`（13 phase 仕様 + outputs evidence）

## Evidence (NON_VISUAL)
- `outputs/phase-11/evidence/structure.json` — AC-1/2/3/4/9
- `outputs/phase-11/evidence/visual-grep.log` — AC-5（4 パターン 0 hits）
- `outputs/phase-11/evidence/api-parity.diff` — AC-6（diff 0 行）
- `outputs/phase-11/evidence/a11y-strings.log` — AC-7
- `outputs/phase-11/evidence/schema-two-stage.log` — AC-8
- `outputs/phase-11/evidence/lint.log` — markdown lint error 0

## Test plan
- [ ] markdown lint error 0
- [ ] 視覚値 grep 4 パターン全て 0 hits
- [ ] phase-3 §2 ↔ 09g §X.4 API trace diff 0 行
- [ ] §1 AdminSidebar 1 箇所 / Sidebar 参照 8 箇所
- [ ] §X.1〜X.8 合計 64 サブセクション
- [ ] §99 不採用 3 件

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 実行コマンド

```bash
mkdir -p docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-13
# local-check
mise exec -- pnpm install --force
node -e "process.exit(require('./package.json').scripts?.typecheck ? 0 : 1)" && mise exec -- pnpm typecheck || echo "NO_TYPECHECK_SCRIPT_OR_SKIPPED"
node -e "process.exit(require('./package.json').scripts?.lint ? 0 : 1)" && mise exec -- pnpm lint || echo "NO_LINT_SCRIPT_OR_SKIPPED"
# diff scope check
git status --short > docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-13/diff-scope.txt

# user 承認後にのみ実行
# git add docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md docs/30-workflows/task-21-w2-screen-blueprints-admin/
# git commit -m "..."
# git push -u origin <branch>
# gh pr create --title "..." --body "$(cat outputs/phase-13/pr-template.md)"
```

## DoD

- [ ] local-check-result.md に 3 コマンド結果 + 視覚値 grep 結果
- [ ] change-summary.md に C ファイル一覧と総行数
- [ ] pr-template.md が `.claude/commands/ai/diff-to-pr.md` 準拠
- [ ] pr-info.md にブランチ名 / base / title / body 要約
- [ ] **user 承認**取得済み（pr-creation-result.md 着手の前提）
- [ ] 承認後: `gh pr create` 実行 → pr-creation-result.md に PR URL 記録

## 完了条件チェック

- [ ] outputs/phase-13/{main,local-check-result,change-summary,pr-template,pr-info}.md 配置
- [ ] user 承認前は pr-creation-result.md に blocked_pending_user_approval を記録、承認後に PR URL を追記
- [ ] artifacts.json の phase 13 を completed
- [ ] 全 phase が completed

## 参照資料

- CLAUDE.md「PR 作成の完全自律フロー」
- `.claude/commands/ai/diff-to-pr.md`
- task-21 末尾 diff scope 規律
- Phase 11 evidence / Phase 12 implementation-guide

## 実行手順

### ステップ 1: local-check
3 コマンド + 視覚値 grep を実行し local-check-result.md に保存。

### ステップ 2: diff scope 確認
`git status --short` が 09g + 本 package のみで構成されることを確認。untracked と削除済みファイルも scope gate 対象に含める。

### ステップ 3: change-summary 作成
C ファイル一覧 + 総行数 + 主要決定 3 件を記述。

### ステップ 4: pr-template / pr-info 作成
PR 本文と branch / title / body を確定。

### ステップ 5: user 承認待ち
本 Phase はここで停止し、user の明示承認を待つ。

### ステップ 6: 承認後 PR 作成
`gh pr create` 実行 → pr-creation-result.md に PR URL を記録。

## 次 Phase

なし（タスク完了）。
