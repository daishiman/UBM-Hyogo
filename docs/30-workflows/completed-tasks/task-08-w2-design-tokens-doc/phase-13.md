# Phase 13: PR 作成

実装区分: ドキュメントのみ仕様書

> **PR 作成は自動実行しない**。ユーザーの明示的な許可を得てから実行する（`references/quality-gates.md` 準拠）。

## 事前確認

```bash
# 1. Phase 1〜12 が completed
jq '.phases[] | select(.status != "completed" and .id < 13)' docs/30-workflows/task-08-w2-design-tokens-doc/artifacts.json

# 2. 主成果物の存在
test -s docs/00-getting-started-manual/specs/09b-design-tokens.md

# 3. 7 ファイル実体（Phase 12）
ls -la docs/30-workflows/task-08-w2-design-tokens-doc/outputs/phase-12/

# 4. evidence 5 点（Phase 11）
ls -la docs/30-workflows/task-08-w2-design-tokens-doc/outputs/phase-11/evidence/

# 5. diff scope 規律（範囲外 0 件）
git diff --name-only main...HEAD | grep -vE '^(docs/00-getting-started-manual/specs/09b-design-tokens\.md|docs/00-getting-started-manual/specs/00-overview\.md|docs/30-workflows/task-08-w2-design-tokens-doc/|docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE\.md|\.claude/skills/aiworkflow-requirements/)' \
  && { echo "FAIL: scope violation"; exit 1; } || echo "scope OK"
```

## ブランチ確認

```bash
git rev-parse --abbrev-ref HEAD   # → feat/task-08-w2-design-tokens-spec を期待
```

ブランチが `main` 直上の場合は本タスク用に切り替えて作業をやり直す（CLAUDE.md ブランチ戦略準拠）。

## main 同期 → マージ → 検証

```bash
# main を最新化
git fetch origin main
git checkout main && git pull --ff-only origin main

# 作業ブランチに戻り main を取り込み
git checkout feat/task-08-w2-design-tokens-spec
git merge main   # コンフリクト時は CLAUDE.md「sync-merge」セクション準拠

# 品質検証
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm indexes:rebuild   # aiworkflow-requirements indexes 同期
```

## commit / push / PR

```bash
# 残ステージなし確認
git status --porcelain

# push（初回 -u）
git push -u origin feat/task-08-w2-design-tokens-spec

# PR 作成
gh pr create --base main --title "docs(specs): add 09b-design-tokens.md (task-08-w2)" --body "$(cat <<'EOF'
## Summary

- `docs/00-getting-started-manual/specs/09b-design-tokens.md` を新規作成（OKLch カラー / radius / shadow / typography / spacing / motion トークンの正本）
- `--ubm-*` prefix 統一・3 テーマ (stone/warm/cool) 全値転記・Tailwind v4 `@theme inline` 直結テンプレ・sRGB fallback・dark mode placeholder を含む
- 後続 task-09 / task-10 / task-18 のブロッカー解除

## Test plan

- [ ] `wc -l specs/09b-design-tokens.md` → 380+
- [ ] `grep -c '^## ' specs/09b-design-tokens.md` → 12
- [ ] `awk '/^\`\`\`json$/,/^\`\`\`$/' specs/09b-design-tokens.md | sed '1d;$d' | jq .` → exit 0
- [ ] `grep -oE '\`--ubm-[a-z0-9-]+\`' specs/09b-design-tokens.md | sort -u | wc -l` → 60+
- [ ] `bash docs/30-workflows/task-08-w2-design-tokens-doc/outputs/phase-09/cross-check.sh` → exit 0
- [ ] `mise exec -- pnpm indexes:rebuild` → drift 0
- [ ] `git diff --name-only main...HEAD` → 09b spec + overview link + workflow dir + aiworkflow-requirements sync のみ

## 実装区分

ドキュメントのみ仕様書（CONST_004）— コード変更を一切伴わない。`apps/web` / `apps/api` / `scripts/` への diff 0。

## 関連

- 親 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`
- 元仕様: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-08-w2-par-design-tokens-doc.md`
- 後続: task-09 tailwind-v4-setup / task-10 ui-primitives / task-18 verify-design-tokens

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 多段承認ゲート（NON_VISUAL irreversible なし → 単一 G1 のみ）

本タスクは docs-only / NON_VISUAL / runtime deploy / D1 apply / Forms sync いずれも伴わないため、`references/non-visual-irreversible-task-rules.md` の G1-G4 multi-stage approval gate は適用外。**G1（spec PR review）の単一ゲート**で完了。

| ゲート | 内容 |
| --- | --- |
| G1 | spec PR review（CI green + reviewer approval） |

## post-merge

```bash
# main 取り込み後 indexes drift 確認
git checkout main && git pull --ff-only origin main
mise exec -- pnpm sync:check
```

## 完了条件

- [ ] 事前確認 5 項目すべて PASS
- [ ] CI green（typecheck / lint / verify-indexes / lint:md）
- [ ] PR merge（reviewer approval、solo dev のため `required_pull_request_reviews=null`）
- [ ] post-merge で他 worktree への通知 OK
