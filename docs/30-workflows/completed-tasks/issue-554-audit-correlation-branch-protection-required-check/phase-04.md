# Phase 4: 検証手順設計（before/after diff / 不変条件 grep）

## 目的

PUT 前後の protection スナップショットを比較し、「期待差分のみ発生 / 不変条件 drift ゼロ」を機械的に検証する手順を確定する。

## 検証手順

### 4.1 before / after diff（期待差分のみ）

```bash
# 期待差分: contexts に "audit-correlation-verify / verify" が 1 件追加されているのみ
diff <(jq -S . /tmp/dev-before.json) <(jq -S . /tmp/dev-after.json) \
  | tee outputs/phase-11/dev-diff.txt

# contexts 追加チェック
jq -r '.required_status_checks.contexts[]' /tmp/dev-after.json \
  | grep -F 'audit-correlation-verify / verify'
```

### 4.2 不変条件 grep（dev / main 双方）

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

### 4.3 既存 contexts subset チェック

```bash
# before の contexts が after の contexts に完全に含まれることを確認（欠落ゼロ）
jq -r '.required_status_checks.contexts[]' /tmp/dev-before.json | sort > /tmp/dev-before-ctx.txt
jq -r '.required_status_checks.contexts[]' /tmp/dev-after.json  | sort > /tmp/dev-after-ctx.txt
comm -23 /tmp/dev-before-ctx.txt /tmp/dev-after-ctx.txt
# 上記出力が空であること（before にあって after に無い context = 0）
```

### 4.4 PR pending check 動作確認（任意）

dev に向けた小さな docs-only PR を作成し、`gh pr checks <PR>` で `audit-correlation-verify / verify` が Required としてリストされることを 1 度だけ確認。完了したら PR は close（またはそのまま merge してよい）。

## DoD（Phase 4）

- [ ] `outputs/phase-4/phase-4.md` に上記 4 種の検証スクリプトが書き出されている
- [ ] 全コマンドがコピペで実行可能な形になっている
