# PR Template

## Summary

- Claude Code permissions の project-local-first vs global-first 比較設計タスク仕様書を追加
- 4 層責務表と 3 案 x 5 軸比較表を整備
- 実 settings / shell alias の書き換えは `task-claude-code-permissions-apply-001` に委譲

## Related

- Issue #142（CLOSED のまま運用）
- `task-claude-code-permissions-apply-001`
- `task-claude-code-permissions-deny-bypass-verification-001`

## Test plan

- `artifacts.json` JSON validity
- outputs parity
- secrets scan
- NON_VISUAL 証跡確認

