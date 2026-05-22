# Phase 4 — 検証手順設計

仕様書 phase-04.md の 4 種スクリプトをコピペ実行可能な形でまとめる。実 `gh api -X PUT` は Phase 13 user gate でのみ実行されるため、本 Phase は手順策定とローカル dry-run の確定にとどまる。

## 4.1 before / after diff

```bash
diff <(jq -S . outputs/phase-11/before-dev-protection.json) \
     <(jq -S . outputs/phase-11/after-dev-protection.json) \
  | tee outputs/phase-11/dev-diff.txt

jq -r '.required_status_checks.contexts[]' outputs/phase-11/after-dev-protection.json \
  | grep -F 'audit-correlation-verify / verify'
```

## 4.2 不変条件 grep

```bash
for branch in dev main; do
  snap="outputs/phase-11/after-${branch}-protection.json"
  jq -e '
    .required_pull_request_reviews == null and
    (.enforce_admins.enabled // .enforce_admins) == true and
    (.lock_branch.enabled // .lock_branch) == false and
    (.required_linear_history.enabled // .required_linear_history) == true and
    (.required_conversation_resolution.enabled // .required_conversation_resolution) == true and
    (.allow_force_pushes.enabled // .allow_force_pushes) == false and
    (.allow_deletions.enabled // .allow_deletions) == false
  ' "$snap" > /dev/null && echo "OK: $branch invariants" || { echo "DRIFT: $branch"; exit 1; }
done
```

> **注意（Phase 1 drift findings）**: 現実の `enforce_admins=false` / `required_linear_history=false` / main `required_pull_request_reviews=object` のため、上記スクリプトは現状のままだと PUT 後も DRIFT を返す。これは本タスクの責務外の drift である。Phase 13 ユーザー gate で「drift 受容 / 別タスク化」のいずれかを確認したうえで、(a) 不変条件 grep を本タスクでは「contexts 追加成立」のみに限定する形で採点する、または (b) drift 修正を本 PR に含めるか別 PR 化するかを決定する。

### 本タスク現実用 grep（contexts 追加成立のみ採点）

```bash
for branch in dev main; do
  snap="outputs/phase-11/after-${branch}-protection.json"
  jq -e '.required_status_checks.contexts | index("audit-correlation-verify / verify")' "$snap" > /dev/null \
    && echo "OK: $branch — audit-correlation-verify / verify present" \
    || { echo "MISSING: $branch"; exit 1; }
done
```

## 4.3 既存 contexts subset チェック

```bash
for branch in dev main; do
  jq -r '.required_status_checks.contexts[]' "outputs/phase-11/before-${branch}-protection.json" | sort > "/tmp/${branch}-before-ctx.txt"
  jq -r '.required_status_checks.contexts[]' "outputs/phase-11/after-${branch}-protection.json"  | sort > "/tmp/${branch}-after-ctx.txt"
  miss=$(comm -23 "/tmp/${branch}-before-ctx.txt" "/tmp/${branch}-after-ctx.txt")
  test -z "$miss" && echo "OK: $branch contexts subset" || { echo "MISSING contexts in $branch: $miss"; exit 1; }
done
```

## 4.4 PR pending check（任意）

dev に向けた docs-only PR を 1 件作成し、`gh pr checks <PR>` 出力で `audit-correlation-verify / verify` が `Required` としてリストされることを確認。確認後 PR は close 可。

## DoD

- [x] 4 種スクリプトをコピペ可能な形で記録
- [x] Phase 1 drift findings を踏まえた採点方針補足を併記
