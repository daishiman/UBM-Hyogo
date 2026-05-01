# Phase 3 Output: Gate Decision

## Decision

採用案は fresh GitHub GET evidence のみを入力正本にする案。

## GO

- dev/main の `branch-protection-applied-*.json` が fresh GET evidenceである。
- `required_status_checks.contexts` が配列として存在する。

## NO-GO

- applied JSON が `blocked_until_user_approval` placeholder。
- expected contexts や payload だけを根拠に final state を書こうとしている。
