# Phase 9: ロールバック設計

| 項目 | 値 |
|------|----|
| 影響範囲 | CI workflow 2 本 + shell library 1 本 + shell script 2 本 |
| ランタイム影響 | なし（apps/web / apps/api / D1 への影響ゼロ） |

---

## 1. ロールバック分類

| 種別 | 適用条件 | 手順 |
|------|----------|------|
| R-1 全面 revert | 本 PR merge 後に dev / main の required check が pending 化 | `gh pr revert <PR>` → revert PR を作成 → merge |
| R-2 部分 revert（paths filter のみ） | docs-only PR で context 衝突など RB-3b-03 起因の障害 |  を `git rm` + `e2e-tests.yml` の `precheck branch を削除 |
| R-3 部分 revert（shell helper のみ） | `coverage-gate-e2e.sh` または `coverage-guard.sh` が CI で fail | `scripts/lib/ci-shell-prelude.sh` を残したまま、2 つの `.sh` の `source` 行を消し `set -euo pipefail` を直書きに戻す |
| R-4 shellcheck gate のみ無効化 | 既存 `.sh` の violation 続発で開発が停止 | `.github/workflows/lint-shell.yml` を `git rm`（prelude / refactor は残す） |

---

## 2. 詳細手順

### R-1 全面 revert

```bash
gh pr view <merged-PR> --json mergeCommit --jq '.mergeCommit.oid'
git revert -m 1 <merge-commit-sha>
git push origin HEAD:revert-issue-668-rb03-rb04
gh pr create --base dev --title "revert: issue-668 rb03-rb04" --body "..."
```

### R-2 部分 revert（paths filter）

```bash
# .github/workflows/e2e-tests.yml の precheck job / run_e2e 分岐を手動削除
# commit / push / PR はユーザー承認後にのみ実行する
```

### R-3 部分 revert（shell helper）

```bash
# scripts/coverage-gate-e2e.sh / scripts/coverage-guard.sh を手動差分で旧 prelude 直書きへ戻す
# commit / push / PR はユーザー承認後にのみ実行する
# scripts/lib/ci-shell-prelude.sh は残置（他用途に流用可能）
```

### R-4 shellcheck gate のみ無効化

```bash
git rm .github/workflows/lint-shell.yml
# commit / push / PR はユーザー承認後にのみ実行する
```

---

## 3. ロールバック後の検証

| ロールバック | 検証 |
|------------|------|
| R-1 / R-2 | code PR で `e2e-tests-coverage-gate` が success / docs-only PR で context が消える（required check 側で外す必要あり） |
| R-3 | `pnpm vitest run scripts/coverage-guard.spec.ts` green |
| R-4 | shell scripts は無検証で merge 可能になるため、最低限ローカル `shellcheck` を CONTRIBUTING に明記 |

---

## 4. ロールバック判断基準

| シグナル | 推奨アクション |
|----------|---------------|
| dev / main で `e2e-tests-coverage-gate` が 24h 以上 pending | R-2 即時実施 |
| `coverage-guard.sh` 由来で本来 block すべき PR が通過した | R-3 即時実施 |
| 既存 `.sh` violation で 1 週間以上 dev への merge が停止 | R-4 で gate を一旦外し別 issue で段階修正 |
| 全体的に挙動不明 | R-1 全面 revert |

---

## 5. 完了条件

- [x] R-1〜R-4 の 4 段階ロールバックが定義
- [x] 各段階の検証手順が定義
- [x] 判断基準（シグナル → アクション）が定義
