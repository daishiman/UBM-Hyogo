# rollback remove-contexts payload draft

| 項目 | 値 |
|------|------|
| 目的 | dev / main の `required_status_checks.contexts` から 3 viewport context を除外する |
| 実行条件 | Phase 5 / 9 で異常検知された場合のみ |
| 承認 | user 明示承認必須 |

## 生成コマンド

```bash
REPO=daishiman/UBM-Hyogo
for b in dev main; do
  cat > /tmp/visual-full-contexts-remove.json <<'JSON'
{
  "contexts": [
    "visual-full (desktop)",
    "visual-full (tablet)",
    "visual-full (mobile)"
  ]
}
JSON
done
```

## 実行コマンド（user 承認後のみ）

```bash
gh api -X DELETE repos/daishiman/UBM-Hyogo/branches/dev/protection/required_status_checks/contexts --input /tmp/visual-full-contexts-remove.json
gh api -X DELETE repos/daishiman/UBM-Hyogo/branches/main/protection/required_status_checks/contexts --input /tmp/visual-full-contexts-remove.json
```

## 検証

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '.required_status_checks.contexts | sort'
# 期待: ["Validate Build","ci","coverage-gate","e2e-tests-coverage-gate","lighthouse-ci"]
```
