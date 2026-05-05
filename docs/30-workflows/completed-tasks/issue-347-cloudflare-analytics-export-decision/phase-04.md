# Phase 4 — テスト戦略（docs-only 文書整合）

## 目的

docs-only / NON_VISUAL タスクのため、unit / integration test は対象外。代わりに「文書の正本性 / 参照導線 / PII 非保存ルール」の 3 観点を grep / 文書整合検証マトリクスで担保する。

## 検証マトリクス

| ID | 検証項目 | 検証コマンド | 期待値 |
| --- | --- | --- | --- |
| T-1 | 採用 export 方式が 1 つだけ | `grep -E "採用|adopt" outputs/phase-02/decision-matrix.md \| head` | GraphQL Analytics API 1 件 |
| T-2 | 取得指標が 4 metric groups / 5 scalar values として列挙 | `grep -E "requests\|errors5xx\|readQueries\|writeQueries\|invocations" outputs/phase-05/storage-policy.md` | 5 scalar values |
| T-3 | PII 非保存ルールが明示 | `grep -E "URL query\|request body\|user data" outputs/phase-06/redaction-rules.md` | 3 件以上 |
| T-4 | retention が定量定義 | `grep -E "[0-9]+ ?(件\|か月\|months)" outputs/phase-05/storage-policy.md` | 1 件以上 |
| T-5 | aiworkflow-requirements 導線 | `grep -r "issue-347-cloudflare-analytics-export-decision" .claude/skills/aiworkflow-requirements/references/` | Phase 12 後に 1 件以上 |
| T-6 | 09c parent state 据え置き | `grep "workflow_state" docs/30-workflows/completed-tasks/09c-*/index.md` | spec_created or completed（変更なし） |

## 出力

- `outputs/phase-04/main.md`: 上記マトリクス + 各 T-x の実行ログ場所

## 完了条件

- [ ] T-1〜T-6 すべての検証コマンドが定義
- [ ] 期待値が定量化
- [ ] Phase 11 で実行する T-x（T-1〜T-4）と Phase 12 後に実行する T-x（T-5）が分離

## 受け入れ条件（AC mapping）

- AC-1, AC-2, AC-3, AC-4, AC-7, AC-8

## 検証手順

```bash
test -f docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-04/main.md
```

## リスク

| リスク | 対策 |
| --- | --- |
| grep パターンが文書差分で false positive | Phase 11 実行時に actual count を記録し閾値再調整 |
