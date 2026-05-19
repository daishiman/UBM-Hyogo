[実装区分: 実装仕様書]

# Phase 2 — 設計

| 項目 | 値 |
|------|------|
| phase | 2 |
| 名称 | 設計 |
| status | completed |
| 完了条件 | PUT payload 設計、check run name 実測手順、責務境界、冪等性ロジック確定 |

## 1. 責務境界

| 範囲 | 仕様書 (Phase 2-4) | 実行 (Phase 5) |
|------|------------------|---------------|
| read-only GET | OK | OK |
| status-check contexts payload draft | OK | — |
| `gh api -X PUT` 実行 | 禁止 | **user 明示承認後のみ実行** |
| rollback context removal | draft のみ | 失敗時のみ実行 |

## 2. check run name 実測手順

GitHub Actions の check run 名は `<workflow name> / <job display name>` 形式。matrix job は `<workflow> / <job> (<matrix value>)` となる。実測の 2 段コマンド:

```bash
# 1) 最新の playwright-visual-full run id を取得
RUN_ID=$(gh api repos/daishiman/UBM-Hyogo/actions/workflows/playwright-visual-full.yml/runs \
  --jq '.workflow_runs[0].id')

# 2) その run の job 名を全列挙（required context として使う正本）
gh api repos/daishiman/UBM-Hyogo/actions/runs/$RUN_ID/jobs \
  --jq '.jobs[].name'
```

期待される job 名（workflow yaml `job key: visual-full`, matrix `viewport: [desktop, tablet, mobile]`）:

- `visual-full (desktop)`
- `visual-full (tablet)`
- `visual-full (mobile)`

required_status_checks の context には **Phase 1 で実測した `jobs[].name` をそのまま投入する**。仕様書内で job-local 名へ短縮しない。

## 3. before GET payload 取得設計

```bash
mkdir -p docs/30-workflows/task-761-visual-full-required-status-check/outputs/phase-11/evidence

gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > /tmp/dev-protection-before.json

gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > /tmp/main-protection-before.json

# 既存 contexts 抽出（drift 比較用）
jq '.required_status_checks.contexts' /tmp/dev-protection-before.json
jq '.required_status_checks.contexts' /tmp/main-protection-before.json
```

## 4. contexts endpoint payload 設計（full PUT 回避）

GitHub branch protection の full PUT は省略フィールド drift リスクが高いため、本タスクでは `POST /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts` を使い、`required_status_checks.contexts` だけを追加する。before GET は drift 検知と rollback 用 snapshot として保持する。

```bash
cat > /tmp/visual-full-contexts.json <<'JSON'
{
  "contexts": [
    "visual-full (desktop)",
    "visual-full (tablet)",
    "visual-full (mobile)"
  ]
}
JSON
```

full PUT は rollback 最終手段としてのみ扱う。通常 rollback は `DELETE /required_status_checks/contexts` 相当の remove-contexts endpoint で追加 3 context だけを除去する。

## 5. 冪等性ロジック

```bash
# 既に 3 件が contexts に含まれていれば PUT スキップ
DEV_HAS=$(jq -r '.required_status_checks.contexts
  | map(. == "visual-full (desktop)" or . == "visual-full (tablet)" or . == "visual-full (mobile)")
  | map(select(.))
  | length' /tmp/dev-protection-before.json)
if [ "$DEV_HAS" = "3" ]; then
  echo "SKIP: dev already has all 3 viewport contexts"
fi
```

## 6. dev / main 独立実行

1. dev contexts POST → after GET → diff 確認
2. dev OK 確認後に main contexts POST → after GET → diff 確認
3. いずれか失敗時、当該 branch のみ remove-contexts endpoint で rollback（他方は触らない）

## 7. rollback payload draft

```bash
cat > /tmp/visual-full-contexts-remove.json <<'JSON'
{
  "contexts": [
    "visual-full (desktop)",
    "visual-full (tablet)",
    "visual-full (mobile)"
  ]
}
JSON
```

## 8. 不変条件チェック (Phase 9 で検証)

- `required_pull_request_reviews == null`
- `enforce_admins == true`
- `lock_branch == false`
- `required_linear_history == true`
- `required_conversation_resolution == true`
- `allow_force_pushes == false`
- `allow_deletions == false`
- 既存 5 context 全て残存
