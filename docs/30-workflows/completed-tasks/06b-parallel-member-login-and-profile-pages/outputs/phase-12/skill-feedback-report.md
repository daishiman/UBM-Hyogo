# skill feedback report

| skill | feedback |
| --- | --- |
| task-specification-creator | AuthGateState のような state machine UI は phase-2 の設計表に「state ↔ UI ブロック ↔ CTA」3 列フォーマットを標準化すると良い |
| aiworkflow-requirements | `/no-access` 不採用や profile read-only のような「やらない」ルールが reference に index 化されていると参照効率が上がる |

## 詳細

### task-specification-creator

- 5 状態の switch case 設計のような「網羅性が UX に直結する場面」では、phase-2 設計表に固定フォーマット（state / Banner / 主 CTA / 副 CTA）を提案テンプレートに含めると、phase-3 設計レビュー時の代替案比較表との整合性が取れやすい
- failure case 表（F-XX）が 17 件まで膨らむケースでは、テンプレートが UI / status / 不変条件の 3 列を最低限要求すると有用

### aiworkflow-requirements

- 「やらない」ルール（`/no-access` 不採用、本人本文編集禁止 等）が複数の不変条件にまたがって参照されるため、references 配下に「禁止行為一覧 (NOT-DO list)」index を用意し、各タスクの phase-1 で必ずその index を参照する流れにすると検索コストが下がる
