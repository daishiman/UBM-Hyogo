# Phase 6 Output: 異常系検証

[実装区分: docs-only / canonical alias]

## Failure Cases

| ケース | 扱い |
| --- | --- |
| duplicate workflow drift | issue-194 へ正本統合して解消 |
| runtime screenshot 未取得 | alias root では NON_VISUAL。実 screenshot は issue-194 Phase 11 pending boundary |
| user approval なし PR | Phase 13 blocked_until_user_approval |
