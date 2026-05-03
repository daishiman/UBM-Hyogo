# Phase 11 Output Placeholder — ut-05a-fetchpublic-service-binding-001

## 状態

`spec_created` / `execution_allowed: false until explicit_user_instruction`。

実 staging / production deploy + curl + wrangler tail + local fallback 確認は user 明示指示後に
実行し、本ファイルへ実行サマリを記録する。

## 期待される evidence path

| path | 関連 AC |
| --- | --- |
| `outputs/phase-11/code-diff-summary.md` | AC-1 / AC-2 |
| `outputs/phase-11/staging-curl.log` | AC-3 |
| `outputs/phase-11/production-curl.log` | AC-4 |
| `outputs/phase-11/wrangler-tail-staging.log` | AC-5 |
| `outputs/phase-11/local-dev-fallback.log` | AC-6 |
| `outputs/phase-11/redaction-checklist.md` | 全体 |

## 注記

- `wrangler tail` の `transport: 'service-binding'` ログは複数件確認すること
- secret / PII を log に含めない
- production deploy は user 明示指示が無い限り行わない
