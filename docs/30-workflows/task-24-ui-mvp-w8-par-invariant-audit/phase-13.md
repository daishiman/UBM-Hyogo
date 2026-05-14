# Phase 13: PR作成

## 前提条件

**user の明示承認後のみ実行する。** 本仕様書時点では blocked。

## PR メタ

| 項目 | 値 |
|------|----|
| base ブランチ | `dev` |
| feature ブランチ | `feat/task-24-ui-mvp-w8-par-invariant-audit` |
| タイトル | `feat(audit): add task-24 invariant audit (22 task × 6 invariant matrix)` |

## PR 本文構成

```markdown
## Summary
- UI prototype alignment / MVP recovery ワークフローの不変条件 6 項目を 22 タスクで監査
- INVARIANT-AUDIT.md に 22×6 matrix を出力
- read-only 監査のため apps/ packages/ 配下に diff なし

## Changes
- 仕様書: docs/30-workflows/task-24-ui-mvp-w8-par-invariant-audit/phase-{1..13}.md
- 監査スクリプト: outputs/phase-5/audit-runner.sh
- evidence: outputs/phase-5/grep-evidence.txt
- 最終成果物: docs/30-workflows/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md

## Test plan
- [ ] INVARIANT-AUDIT.md に 22 行 × 6 列の matrix が存在
- [ ] VIOLATION セルすべてに file:line と引用が付随
- [ ] git diff apps/ packages/ が空（read-only 担保）
- [ ] task-27 が本 matrix を参照可能

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 注意

- `--no-verify` 禁止
- screenshot 添付なし（NON_VISUAL）
- CI gate: typecheck / lint / verify-design-tokens は本タスクの diff に影響しない想定
