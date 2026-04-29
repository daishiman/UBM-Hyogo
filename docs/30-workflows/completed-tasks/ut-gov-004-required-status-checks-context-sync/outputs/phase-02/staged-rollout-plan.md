# staged-rollout-plan.md — 段階適用案

> Phase 2 設計成果物 / 入力: context-name-mapping.md

## フェーズ 1: 既出 context のみ先行投入

UT-GOV-001 で `required_status_checks.contexts` に投入する初期セット:

```yaml
contexts:
  - "ci"
  - "Validate Build"
  - "verify-indexes-up-to-date"
```

投入条件:
- 各 context が過去 30 日以内に `conclusion=success` を 1 回以上記録（証跡: `context-name-mapping.md §5`）
- main / dev 両ブランチで同一 contexts を投入
- `strict` は `lefthook-ci-correspondence.md §3` の決定に従い dev=false / main=true

## フェーズ 2: 新規 context の後追い投入条件

除外 4 件 (`unit-test` / `integration-test` / `security-scan` / `docs-link-check`) は UT-GOV-005 で workflow 新設後、以下条件を満たした日に追加投入する。

| 条件 | 詳細 |
| --- | --- |
| 1. workflow 新設 | UT-GOV-005 の PR がマージされ `.github/workflows/` に存在 |
| 2. 実 run 観測 | 新 workflow が main または dev で 1 回以上 `conclusion=success` を出力 |
| 3. 名前固定 | 投入 24 時間前に最終 `name:` が変更されないことを確認 |
| 4. 同一 PR | branch protection の `contexts` 追加 PR と同一 PR で投入を行う（あるいは UT-GOV-001 専用 PR を別出して同日内に追加適用） |

投入トリガコマンド例:

```bash
gh api -X PATCH /repos/daishiman/UBM-Hyogo/branches/main/protection \
  -f required_status_checks[contexts][]="ci" \
  -f required_status_checks[contexts][]="Validate Build" \
  -f required_status_checks[contexts][]="verify-indexes-up-to-date" \
  -f required_status_checks[contexts][]="<新規 context>"
```

## 名前変更事故への対応運用 (AC-9)

context 名を変更する workflow refactor は次のいずれか 1 経路でのみ許可する。

### 経路 A: 同一 PR ルール

workflow `name:` / job `name:` 変更を含む PR は、`branch protection` 設定更新 (`gh api -X PATCH …/protection`) の操作を同一 PR の merge と同時刻に行う。

```bash
# PR merge と同一トランザクション内で
gh api -X PATCH /repos/daishiman/UBM-Hyogo/branches/main/protection \
  -F required_status_checks='{"strict":true,"contexts":["new-name", "Validate Build", "verify-indexes-up-to-date"]}'
```

### 経路 B: 新旧並列 → 旧外し

1. workflow に新旧両方の `name:` を一時並列（matrix or 別 workflow）
2. 新側で 1 回 PASS を確認
3. branch protection から旧 context を外す
4. 旧 workflow を削除

> 経路 A が原則。経路 B は新規 workflow 新設で旧 workflow と独立に併存可能な場合のみ採用。

## ロールバック手順

投入後に永続停止が発生した場合の admin override:

```bash
# 即時 contexts を空にする（最小ロールバック）
gh api -X PATCH /repos/daishiman/UBM-Hyogo/branches/main/protection \
  -F required_status_checks='{"strict":true,"contexts":[]}'

# あるいは protection を完全削除（最終手段）
gh api -X DELETE /repos/daishiman/UBM-Hyogo/branches/main/protection
```

復旧後、原因究明ログを `docs/30-workflows/ut-gov-004-.../outputs/phase-12/incident-log.md`（必要時）に記録し、再投入前に `gh api check-runs` で最新の実績再確認を行う。

## AC 充足

- AC-4: 除外 context と後追い投入条件を表化 ✅
- AC-9: 名前変更事故対応 (経路 A / B) を文書化 ✅
