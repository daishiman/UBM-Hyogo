[実装区分: 実装仕様書]

# Phase 6 — テスト拡充

| 項目 | 値 |
|------|------|
| phase | 6 |
| 名称 | テスト拡充 |
| status | completed |
| 完了条件 | rollback dry-run 手順 / drift 検知 grep / 重複追加防止 を設計 |

## 1. rollback dry-run

```bash
REPO=daishiman/UBM-Hyogo
gh api repos/$REPO/branches/dev/protection > /tmp/dev-current.json

# rollback remove-contexts payload を生成するだけ（mutation はしない）
cat > /tmp/visual-full-contexts-remove.json <<'JSON'
{
  "contexts": [
    "visual-full (desktop)",
    "visual-full (tablet)",
    "visual-full (mobile)"
  ]
}
JSON
jq '.contexts | length == 3' /tmp/visual-full-contexts-remove.json
# 期待: true
```

## 2. drift 検知 grep（定期監視用）

```bash
expected='["Validate Build","ci","coverage-gate","e2e-tests-coverage-gate","lighthouse-ci","visual-full (desktop)","visual-full (mobile)","visual-full (tablet)"]'
actual=$(gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '.required_status_checks.contexts | sort')
[ "$actual" = "$expected" ] || echo "DRIFT detected"
```

## 3. 重複追加防止テスト

Phase 2 §5 の冪等性ロジックが正しく動作するか:

```bash
# 既に 3 件入っている状態で再度 append → unique で重複しないこと
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > /tmp/dev-now.json
jq '.required_status_checks.contexts + [
  "visual-full (desktop)",
  "visual-full (tablet)",
  "visual-full (mobile)"
] | unique | length' /tmp/dev-now.json
# 期待: 8
```

## 4. governance 不変条件回帰テスト

```bash
for branch in dev main; do
  out=$(gh api repos/daishiman/UBM-Hyogo/branches/$branch/protection)
  echo "$out" | jq -e '.required_pull_request_reviews == null' >/dev/null || echo "NG: $branch reviews"
  echo "$out" | jq -e '.enforce_admins.enabled == true'       >/dev/null || echo "NG: $branch enforce_admins"
  echo "$out" | jq -e '.lock_branch.enabled == false'          >/dev/null || echo "NG: $branch lock_branch"
  echo "$out" | jq -e '.required_linear_history.enabled == true' >/dev/null || echo "NG: $branch linear"
  echo "$out" | jq -e '.required_conversation_resolution.enabled == true' >/dev/null || echo "NG: $branch conv"
done
```

## 5. 自動テスト化スコープ外

- このタスクでは shell script として保存しない（governance 一回操作のため）。
- 定期監視は UT-GOV-001 系の既存 audit ジョブに組み込み余地あり（out-of-scope）。
