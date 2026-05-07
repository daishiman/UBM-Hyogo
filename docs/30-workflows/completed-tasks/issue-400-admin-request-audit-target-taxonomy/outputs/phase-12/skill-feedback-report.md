# スキルフィードバックレポート

## テンプレ改善

なし。Phase 12 strict 7、root/outputs artifacts parity、NON_VISUAL evidence は既存 `task-specification-creator` 仕様でカバー済み。

## ワークフロー改善

なし。CLOSED Issue を `Refs` で扱い、reopen / close automation を避ける運用は既存ルールに沿う。

## ドキュメント改善

`aiworkflow-requirements` の audit taxonomy は `references/api-endpoints.md` に集約し、`quick-reference.md` / `resource-map.md` / `task-workflow-active.md` から到達可能にする。独立した audit taxonomy reference は現時点では過剰分割のため作らない。

## routing

| item | target | reason |
| --- | --- | --- |
| request audit target type | `references/api-endpoints.md` | API contract の一部 |
| workflow registration | `indexes/resource-map.md`, `indexes/quick-reference.md`, `references/task-workflow-active.md` | Progressive Disclosure の導線 |
| skill feedback | no-op | 既存ルールで吸収可能 |
