# Phase 13: PR 作成

## 前提

- **user 明示承認後のみ実行**（CONST_002）
- base ブランチ = `dev`（CLAUDE.md 既定）
- GitHub Issue #616 は **CLOSED のまま**。reopen 禁止。PR 本文に `Refs #616`（`Closes` は使わない）

## PR 作成手順

### Step 1: ブランチ確認

```bash
git branch --show-current
# feat/* / fix/* / docs/* のいずれか
```

### Step 2: dev 同期

```bash
git fetch origin dev
git checkout dev && git pull --ff-only
git checkout - && git merge dev
```

### Step 3: 品質検証

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

### Step 4: 変更確認

```bash
git status --porcelain  # 残差分なし
git diff dev...HEAD --name-only
```

### Step 5: PR 作成

```bash
gh pr create --base dev --title "docs(workflow): task-issue-577-followup-002 Miniflare/undici upstream tracking spec" \
  --body "$(cat <<'EOF'
## Summary

- Issue #577 軸B（`--maxWorkers=1`）の上流改善追跡フローを定義
- 直近 release を実 triage し、結論（A: 改善なし → 維持 / B: 改善あり → A/B 採用）を Phase 11 で確定
- （該当時のみ）`apps/api/package.json#test:coverage` の `--maxWorkers` を採用値に更新

## Scope

- 仕様書一式: `docs/30-workflows/task-issue-577-followup-002-miniflare-undici-upstream-tracking/`
- unassigned placeholder の consumed trace 化
- （該当時のみ）`apps/api/package.json` の scripts.test:coverage 更新

## Refs

- Refs #616（CLOSED のまま）

## Test plan

- [ ] Phase 11 triage-table.md レビュー
- [ ] （該当時）ab-summary.md と採用 N の妥当性レビュー
- [ ] CI pass

EOF
)"
```

## PR 本文の必須要素

- Phase 12 implementation-guide.md の主要見出しを反映
- `outputs/phase-11/evidence/` の主要 evidence ファイル参照
- Issue #616 は `Refs #616` で言及（`Closes #616` 禁止）
- scopre 明示（仕様書 + 条件付き package.json）

## 禁止事項

- Issue #616 の reopen
- `--no-verify` での push（hook 失敗時は根本対応）
- `main` への直接 PR（base は `dev`）

## 完了条件

- [ ] PR 作成完了 / URL 取得
- [ ] CI 品質 gate（typecheck / lint）pass
- [ ] Issue #616 ステート確認（CLOSED 維持）

## 最終レポート要素

- PR URL
- 採用ブランチ
- 改善検知有無と採用 N（または「維持」）
- 残課題（あれば）
