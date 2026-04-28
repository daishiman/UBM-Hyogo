# Alias Fallback Diff

## 方針

`docs_inconclusive_requires_execution` のまま apply-001 を進める場合は fail-closed とし、alias から `--dangerously-skip-permissions` を外す。

```diff
- alias cc='claude --permission-mode bypassPermissions --dangerously-skip-permissions'
+ alias cc='claude --permission-mode bypassPermissions'
```

settings 層の `defaultMode: "bypassPermissions"` は維持可能だが、deny 実効性を確認できるまで危険フラグは常用しない。
