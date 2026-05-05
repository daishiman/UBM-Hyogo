# Phase 1: 要件定義・GO 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | spec_created |

## 目的

Issue #475 の AC を確定し、`main` 上で `coverage-gate` job が success として記録されているか（context 名登録条件）と、Task C/D の coverage 80% が main に取り込み済かを実測値で確認したうえで、本タスク開始可否（GO / NO-GO）を判定する。

## Step 0: P50 チェック（必須）

```bash
# 1) main 上で coverage-gate job が完走しているか（context 名 GitHub 内部 DB 登録条件）
gh run list --branch main --workflow ci.yml --limit 5 \
  | tee outputs/phase-1/main-ci-run-list.log

# 2) 直近 main run の coverage-gate job 状態
RUN_ID=$(gh run list --branch main --workflow ci.yml --limit 1 --json databaseId -q '.[0].databaseId')
gh run view "$RUN_ID" --log --job coverage-gate \
  | tee outputs/phase-1/main-coverage-gate-job.log

# 3) 現状 branch protection の contexts スナップショット
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  | jq '{contexts: .required_status_checks.contexts, reviews: .required_pull_request_reviews, lock: .lock_branch.enabled, admins: .enforce_admins.enabled}' \
  | tee outputs/phase-1/main-protection-baseline.json

gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | jq '{contexts: .required_status_checks.contexts, reviews: .required_pull_request_reviews, lock: .lock_branch.enabled, admins: .enforce_admins.enabled}' \
  | tee outputs/phase-1/dev-protection-baseline.json
```

期待:
- `main` 最新 CI に `coverage-gate` job が `success`
- `main-protection-baseline.json` の `.contexts` に `coverage-gate` が **未登録**（追加余地確認）
- `required_pull_request_reviews` / `lock_branch` / `enforce_admins` が baseline GET と after GET で同値（現行値 preserve）

## Acceptance Criteria

| ID | 内容 | 計測方法 |
| --- | --- | --- |
| AC-1 | `main` の `required_status_checks.contexts` に `coverage-gate` が含まれる | Phase 11 fresh GET |
| AC-2 | `dev` の同 contexts に `coverage-gate` が含まれる | 同上 |
| AC-3 | solo invariant（`required_pull_request_reviews` / `lock_branch` / `enforce_admins` など）drift なし | baseline と after の normalized diff |
| AC-4 | 既存 contexts (`ci` / `Validate Build` 等) が消えていない | baseline と diff |
| AC-5 | `deployment-branch-strategy.md` current applied 表が更新済み | grep 確認 |
| AC-6 | coverage 未達 検証 PR で merge button disabled | Phase 11 で 1 件確認 |

## GO / NO-GO 判定

| 条件 | 判定 |
| --- | --- |
| Step 0 全て期待通り | GO（Phase 2 へ） |
| `main` CI に `coverage-gate` success がない | NO-GO（Task E main 取り込み待ち） |
| coverage 80% 未達 | NO-GO（Task C/D 差戻し） |
| invariant 既に drift | NO-GO（先に invariant 復元） |

## 成果物

- `outputs/phase-1/main-ci-run-list.log`
- `outputs/phase-1/main-coverage-gate-job.log`
- `outputs/phase-1/main-protection-baseline.json`
- `outputs/phase-1/dev-protection-baseline.json`
- `outputs/phase-1/go-no-go-decision.md`（判定結果と根拠）
