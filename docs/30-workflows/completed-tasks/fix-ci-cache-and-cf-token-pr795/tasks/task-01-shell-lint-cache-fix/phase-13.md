# Phase 13 — PR 作成 (task-01)

## 実行条件

**ユーザー明示承認後のみ**実行する。本仕様書作成時点では PR 作成・コミット・push を一切行わない。

## PR 作成手順 (承認後)

### Step 1: pre-flight 検証

```bash
bash scripts/verify-pr-ready.sh
pnpm typecheck
pnpm lint
```

### Step 2: コミット (未コミットなら)

```bash
git add .github/actions/setup-project/action.yml .github/workflows/ci.yml
git add docs/30-workflows/fix-ci-cache-and-cf-token-pr795/tasks/task-01-shell-lint-cache-fix/
git commit -m "fix(ci): allow setup-project to disable cache for install: false callers (Refs PR #795)

- add \`cache\` input to .github/actions/setup-project/action.yml (default 'pnpm')
- pass empty string from workflow-shell-lint job to skip post-cleanup path validation
"
```

### Step 3: push

```bash
git push -u origin <feature-branch>
```

### Step 4: PR 作成

```bash
gh pr create --base dev --title "fix(ci): disable cache for setup-project install: false callers" --body "$(cat <<'EOF'
## Summary
- `.github/actions/setup-project/action.yml` に `cache` input を追加 (default `'pnpm'`)
- `workflow-shell-lint` job からは `cache: ''` を渡し pnpm cache の post-cleanup を抑止
- これにより PR #795 後も残存していた `Path Validation Error` annotation を根絶

## Test plan
- [ ] `./actionlint .github/workflows/ci.yml .github/actions/setup-project/action.yml` が exit 0
- [ ] CI run の `workflow-shell-lint` job が success
- [ ] `gh run view <id> --log | grep -c "Path Validation Error"` が 0
- [ ] 他 caller (pr-build-test / e2e-tests / verify-stable-key-update / playwright-visual-* / ci.yml L103・L223) が green
EOF
)"
```

## PR 作成前 self-check

| 項目 | チェック |
| ---- | -------- |
| base ブランチ = `dev` | ✓ |
| feature branch 名: `fix/ci-shell-lint-cache` または同等 | ✓ |
| `git diff dev...HEAD --name-only` に意図したファイルのみ | ✓ |
| Phase 11 evidence が phase-11.md に記載済み | ✓ |
| Phase 12 implementation-guide が canonical 9 headings 充足 | ✓ |

## 完了後の作業

- PR URL を Phase 11 evidence に追記
- `artifacts.json` の phase-4..13 status を `completed` に更新
- (将来) `workflow-shell-lint` を dev / main の required status check に登録 (別タスク・別承認)
