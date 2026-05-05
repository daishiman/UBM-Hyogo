# Phase 10: 最終レビュー・rollback 経路

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| 作成日 | 2026-05-05 |
| 状態 | spec_created |

## 目的

Phase 5-9 成果物を最終レビューし、Phase 11 runtime evidence 取得 / Phase 13 PR 作成可否を判定する。MINOR 追跡テーブルの解決状況を確認する。

## レビュー観点

| 観点 | 確認内容 |
| --- | --- |
| AC 達成 | AC-1〜AC-6 達成（AC-1/2/3/4 は Phase 11 fresh GET、AC-5 は SSOT diff、AC-6 は dry-run PR）|
| diff 最小性 | 変更が SSOT docs + skill indexes + 本タスク docs に限定 |
| 後方互換 | 既存 contexts (`ci` / `Validate Build` 等) が contexts 配列内に維持 |
| invariant | non-target protection fields（reviews / lock / admins 等）が fresh GET baseline と after で drift なし |
| rollback 経路 | Phase 5 の rollback コマンド（baseline JSON で再 PUT）が即実行可能 |
| MINOR 追跡 | Phase 3 で記録した MINOR が解決 or unassigned-task に formalize 済 |

## MINOR 追跡テーブル

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase | 備考 |
| --- | --- | --- | --- | --- |
| (Phase 3 で記録があれば転記) | - | - | - | - |

## rollback 手順サマリ

```bash
for b in main dev; do
  jq '{
    required_status_checks: .required_status_checks,
    enforce_admins: .enforce_admins.enabled,
    required_pull_request_reviews: .required_pull_request_reviews,
    restrictions: .restrictions,
    required_linear_history: .required_linear_history.enabled,
    allow_force_pushes: .allow_force_pushes.enabled,
    allow_deletions: .allow_deletions.enabled,
    required_conversation_resolution: .required_conversation_resolution.enabled,
    lock_branch: .lock_branch.enabled,
    allow_fork_syncing: (.allow_fork_syncing.enabled // false)
  }' "outputs/phase-5/${b}-protection-before-full.json" \
    | gh api -X PUT "repos/daishiman/UBM-Hyogo/branches/${b}/protection" --input -
done
```

## 成果物

- `outputs/phase-10/final-review.md`
- `outputs/phase-10/rollback-procedure.md`
