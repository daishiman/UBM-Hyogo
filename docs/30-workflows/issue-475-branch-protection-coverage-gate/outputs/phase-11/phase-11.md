# Phase 11: 手動テスト / runtime evidence（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 作成日 | 2026-05-05 |
| 状態 | runtime_evidence_captured_merge_pr_empirical_pending |
| visualEvidence | NON_VISUAL |

## 目的

NON_VISUAL タスクとして、`coverage-gate` が `main` / `dev` の `required_status_checks.contexts` に追加されたことを fresh GET evidence として記録する。スクリーンショットは取得しない。coverage 未達 PR で merge button が disabled になる経験的観測は commit / push / PR を伴うため、Phase 13 の Gate B 承認後に同 workflow 内で実施する。

## NON_VISUAL evidence 必須ファイル

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-11/main-protection-after-full.json` | main の適用後 fresh GET 完全 JSON |
| 2 | `outputs/phase-11/dev-protection-after-full.json` | dev の同上 |
| 3 | `outputs/phase-11/main-drift.diff` | baseline との diff（contexts に `coverage-gate` のみ追加、他無差分） |
| 4 | `outputs/phase-11/dev-drift.diff` | 同上 |
| 5 | `outputs/phase-11/invariant-check.log` | non-target protection fields が baseline と after で同値であることの確認結果 |
| 6 | `outputs/phase-11/contexts-preserved.log` | 既存 contexts が消えていないことの確認 |
| 7 | `outputs/phase-11/merge-gate-behavior.md` | required context 登録済みの構造的確認。coverage 未達 throwaway PR の `gh pr view --json mergeable,mergeStateStatus` 実観測は Gate B 後 |
| 8 | `outputs/phase-11/ssot-diff.log` | `deployment-branch-strategy.md` の current applied 表更新の git diff |

## 取得手順

```bash
# 1) 適用後 fresh GET
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > outputs/phase-11/main-protection-after-full.json
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-11/dev-protection-after-full.json

# 2) drift 検証
for b in main dev; do
  diff <(jq -S '{contexts: .required_status_checks.contexts, reviews: .required_pull_request_reviews, lock: .lock_branch.enabled, admins: .enforce_admins.enabled}' "outputs/phase-1/${b}-protection-baseline.json") \
       <(jq -S '{contexts: .required_status_checks.contexts, reviews: .required_pull_request_reviews, lock: .lock_branch.enabled, admins: .enforce_admins.enabled}' "outputs/phase-11/${b}-protection-after-full.json") \
    > "outputs/phase-11/${b}-drift.diff" || true
done

# 3) invariant
for b in main dev; do
  diff -u \
    <(jq -S 'del(.required_status_checks.contexts)' "outputs/phase-1/${b}-protection-baseline.json") \
    <(jq -S 'del(.required_status_checks.contexts)' "outputs/phase-11/${b}-protection-after-full.json")
done | tee outputs/phase-11/invariant-check.log

# 4) 既存 contexts 維持
for b in main dev; do
  jq --argjson before "$(jq '.required_status_checks.contexts' outputs/phase-1/${b}-protection-baseline.json)" \
     '.required_status_checks.contexts as $after
      | ($before - $after) as $missing
      | "[" + "'"$b"'" + "] missing=" + ($missing | tostring)' \
    "outputs/phase-11/${b}-protection-after-full.json"
done | tee outputs/phase-11/contexts-preserved.log

# 5) coverage 未達 dry-run PR の挙動（Gate B 承認後）
gh pr view <NUM> --json number,mergeable,mergeStateStatus,statusCheckRollup \
  | tee outputs/phase-11/merge-gate-behavior.md

# 6) SSOT diff
git diff .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md \
  | tee outputs/phase-11/ssot-diff.log
```

## DoD

- [x] 上記 8 ファイルが実体配置
- [x] drift diff が `coverage-gate` 1 件追加のみ（dev は out-of-scope `required_pull_request_reviews` drift を別記）
- [x] Issue #475 起因の non-target drift なし
- [x] 既存 contexts 全件保持
- [ ] coverage 未達 PR の `mergeStateStatus` が `BLOCKED`（または `coverage-gate` failing 表示）を Gate B 後に実観測
