# Phase 4: テスト計画

## テスト戦略

本タスクは GitHub branch protection への構成変更が主体であり、unit/integration テストの新規追加は最小限。**検証は「適用後の状態が期待値と一致するか」を `gh api` で確認するスモークテスト**を中心とする。

## テスト対象とテストレベル

| 対象 | テストレベル | テスト方法 |
|------|------------|-----------|
| `.github/branch-protection/dev.json` | static | `jq` で構文 + 必須キー存在検証 |
| `.github/branch-protection/main.json` | static | 同上 |
| `.github/branch-protection/apply.sh` | unit | bats もしくは bash の dry-run check（usage 表示・存在チェック） |
| branch protection 状態（dev） | integration | apply 実行後の `gh api GET` 結果が `dev.json` の contexts と一致 |
| branch protection 状態（main） | integration | 同上 |
| `lighthouse.yml` の起動 step | integration | `workflow_dispatch` または dev 向け実 PR で `lighthouse-ci` を 1 回成功させる |

## テストケース

### TC-1: branch-protection JSON 構文

```bash
jq -e 'has("required_status_checks") and (.required_status_checks.contexts | length > 0)' \
  .github/branch-protection/dev.json
jq -e 'has("required_status_checks") and (.required_status_checks.contexts | length > 0)' \
  .github/branch-protection/main.json
```

期待: 両方 `true` を返す。

### TC-2: apply.sh usage

```bash
bash .github/branch-protection/apply.sh         # 引数なし → all 動作 or usage
bash .github/branch-protection/apply.sh invalid # → exit 1 + usage 表示
```

### TC-3: dev contexts 一致

```bash
diff <(jq -S '.required_status_checks.contexts | sort' .github/branch-protection/dev.json) \
     <(gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
        | jq -S '.required_status_checks.contexts | sort')
```

期待: diff 出力なし。

### TC-4: main contexts 一致

```bash
diff <(jq -S '.required_status_checks.contexts | sort' .github/branch-protection/main.json) \
     <(gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
        | jq -S '.required_status_checks.contexts | sort')
```

期待: diff 出力なし。

### TC-5: CLAUDE.md 不変条件 drift 検査

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | jq '{
      reviews: .required_pull_request_reviews,
      enforce_admins: .enforce_admins.enabled,
      lock_branch: .lock_branch.enabled,
      linear: .required_linear_history.enabled
    }'
```

期待: `{reviews: null, enforce_admins: true, lock_branch: false, linear: true}`。

### TC-6: lighthouse workflow の prod server 起動

```bash
gh workflow run lighthouse.yml --ref docs/issue-608-e2e-quality-uplift-stage-3
gh run watch
```

期待: `Wait for server (wait-on)` step が exit 0、後続 LHCI step が completion まで進む。

### TC-7: 新規 PR ブロッキング動作

`dev` 向け dummy PR を 1 件作成し、`e2e-tests-coverage-gate` / `lighthouse-ci` が "Required" として表示されることを GitHub UI で確認。代替で `gh pr checks <PR>` 出力に新 contexts が含まれることを確認。

## カバレッジ目標

- branch protection drift gate（CLAUDE.md UT-GOV-001 適用範囲）: 100%
- 新規 status check の registration 検証: 100%（dev / main 双方）

## テスト実行コマンド一覧

```bash
# Static
jq -e 'has("required_status_checks")' .github/branch-protection/dev.json
jq -e 'has("required_status_checks")' .github/branch-protection/main.json

# Integration（apply 後）
bash .github/branch-protection/apply.sh all
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | jq '.required_status_checks.contexts' \
  | tee docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/runtime-evidence/required-contexts-dev.txt
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  | jq '.required_status_checks.contexts' \
  | tee docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/runtime-evidence/required-contexts-main.txt
```
