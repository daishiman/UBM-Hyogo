# Fragment Runbook

## 実装者向け

### fragment 追記（writer）

```bash
mise exec -- pnpm skill:logs:append \
  --skill <skill-name> \
  --type <log|changelog|lessons-learned> \
  --message "<本文>"
```

または `--body-file <path>` で長文を渡す。

### fragment 集約 view（reader）

```bash
mise exec -- pnpm skill:logs:render --skill <skill-name>
mise exec -- pnpm skill:logs:render --skill <skill-name> --since 2026-04-01T00:00:00Z
mise exec -- pnpm skill:logs:render --skill <skill-name> --include-legacy
mise exec -- pnpm skill:logs:render --skill <skill-name> --out /tmp/render.md
```

### 30 日超 legacy 履歴の閲覧（INFO-1 対応）

```bash
git log --follow .claude/skills/<skill>/LOGS/_legacy.md
git log --follow .claude/skills/<skill>/changelog/_legacy.md
```

`--include-legacy` window 外でも、上記で履歴連続性を辿れる。

### 衝突対応

- 同秒・同 branch でも nonce が異なるため衝突しない
- 万一 retry 上限（3 回）超過時は `CollisionError`：環境時計の異常を疑う

## レビュアー向け

### 受入確認

| 観点 | 確認コマンド |
| ---- | ------------ |
| writer 経路に旧 path 残存なし | `git grep -n 'LOGS\.md\|SKILL-changelog\.md' .claude/skills/` |
| `_legacy.md` 履歴連続 | `git log --follow .claude/skills/<skill>/LOGS/_legacy.md` |
| render 降順 | `pnpm skill:logs:render --skill <skill> \| head -40` |
| `--out` tracked 拒否 | `pnpm skill:logs:render --skill <skill> --out .claude/skills/<skill>/LOGS.md` → exit 2 |
| 4 worktree smoke | Phase 11 evidence を参照 |

### NG パターン

- 旧 `LOGS.md` への直接追記が PR に含まれている → R-1 違反
- `_legacy.md` を `git rm` している PR → R-3 違反（履歴温存ポリシー違反）
- `--out` で `lessons-learned-*.md` を指す → exit 2 で正しく拒否される
