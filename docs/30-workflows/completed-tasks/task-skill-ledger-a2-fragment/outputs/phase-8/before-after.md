# Before / After

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| fragment path 生成 | append.ts 内に直接記述 | `scripts/lib/fragment-path.ts:buildFragmentRelPath` に切り出し | render 側 path 検証で再利用 / 単一実装化 |
| front matter parse | render.ts 内 inline parse | `scripts/lib/front-matter.ts:parseFragment` / `buildFragmentContent` | append/render の write-read parity 保証 |
| timestamp utility | `new Date().toISOString()` 散在 | `scripts/lib/timestamp.ts:nowUtcCompact` / `nowUtcIso` | UTC 形式ぶれ防止 |
| branch escape | 重複実装の懸念 | `scripts/lib/branch-escape.ts:escapeBranch` に集約 | 64 文字 trim / 許可文字判定の単一実装 |
| nonce retry | 内部 while ループ | `scripts/lib/retry-on-collision.ts:retryOnCollision` 高階関数 | 単体テスト容易化（C-3） |

## public API 不変性

- `renderSkillLogs(options: RenderSkillLogsOptions): Promise<RenderSkillLogsResult>` 不変
- `appendFragment(options: AppendFragmentOptions): Promise<AppendFragmentResult>` 不変
- CLI フラグ（`--skill` / `--since` / `--out` / `--include-legacy` / `--type` / `--message` / `--body-file`）不変

## テスト全件再実行結果

```
✓ scripts/skill-logs-append.test.ts (6)
✓ scripts/skill-logs-render.test.ts (9)
Test Files  2 passed
Tests       15 passed
```

## navigation drift 確認

- SKILL.md / references の `LOGS.md` 言及は **歴史的記述** として残置（fragment 化後は `LOGS/_legacy.md` を git mv で参照可能）
- 直接 path を更新する必要のある writer は `scripts/lib/*` を import して fragment 化済 → drift 0
