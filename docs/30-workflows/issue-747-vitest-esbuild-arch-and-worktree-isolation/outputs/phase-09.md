# Phase 9: 依存関係 / 並列性 / ロールバック

## 9.1 ファイル変更の依存グラフ

```
verify-node-arch.mjs ─┐
verify-worktree-...mjs ┼─→ package.json scripts ─→ lefthook.yml ─→ CI workflow
verify-esbuild-...mjs ─┘                                          ↘ runbook.md
                                                                  ↘ CLAUDE.md (1 行)
                                                                  ↘ unassigned-task consumed
```

- verify scripts → package.json: scripts entry が verify file path 参照
- package.json → lefthook.yml: hook が `pnpm verify:*` 経由で起動
- package.json → CI workflow: 同上
- runbook / CLAUDE.md / consumed 化は他 implementation step 完了後に並列可能

## 9.2 並列化可能箇所

| バッチ | 並列で実装可能 |
| --- | --- |
| Batch A | `verify-node-arch.mjs`、`verify-worktree-node-modules-isolation.mjs`、`verify-esbuild-version.mjs` |
| Batch B（A 完了後） | `package.json` scripts、`.mise.toml` hook |
| Batch C（B 完了後） | `lefthook.yml`、`.github/workflows/verify-esbuild.yml` |
| Batch D（A-C と独立） | `runbook.md`、`CLAUDE.md` 1 行追記、`unassigned-task` consumed 化 |

## 9.3 ロールバック計画

| Step | ロールバック手段 |
| --- | --- |
| verify scripts 追加 | ファイル削除 + `package.json` scripts entry 削除 |
| lefthook 追加 | `pre-push.commands.verify-esbuild` block 削除 |
| CI workflow 追加 | `.github/workflows/verify-esbuild.yml` 削除 |
| `.mise.toml` hook | `[hooks].postinstall` 行削除 |
| 旧仕様書 consumed | frontmatter から該当 YAML 削除 |

## 9.4 完了条件（Phase 9）

- 依存グラフが Batch A→B→C→D の順に実行可能
- 各 Step のロールバックが 1 操作で完結
