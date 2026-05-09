# Phase 6 Output: 異常系検証（implementation cycle）

Canonical source: `../../phase-06.md`

- unreachable host (127.0.0.1:1) → exit 1 + summary.json status=FAIL（T-4-1）
- `env != staging` → exit 2（T-4-3）
- 不明オプション → exit 2（T-4-4）
- summary.json 不在で `ci-summary-post.sh` → exit 1（T-5-3）
- Slack webhook 未設定 → post 抑制 + stdout fallback（T-5-2）
- Bearer 値が summary に混入 → redact 経由で stdout から除去（T-5-4）
