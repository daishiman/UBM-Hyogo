# [#210] [TASK-CODEOWNERS-REQUIRE-REVIEWS-RUNBOOK-001] require_code_owner_reviews=true 切替 runbook 整備

## メタ情報

```yaml
issue_number: 210
title: [TASK-CODEOWNERS-REQUIRE-REVIEWS-RUNBOOK-001] require_code_owner_reviews=true 切替 runbook 整備
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/210
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

将来 contributor 増 / 監査要件変更等のトリガで `require_code_owner_reviews=true` を有効化する判断が発生したときの事前 runbook を整備する。UT-GOV-003 (Issue #146) の Phase 12 unassigned-task-detection.md C-5 として検出（低優先度）。

## 仕様書

`docs/30-workflows/unassigned-task/task-codeowners-require-reviews-runbook-001.md`

## スコープ

- 切替判断トリガ基準の明文化
- 切替前チェックリスト（CODEOWNERS 網羅性 / owner 存在 / bypass 経路 / SLO）
- 切替手順（branch protection API / UI）
- ロールバック手順（緊急 disable / 段階的 disable）
- 切替後 smoke

## 受入条件

- AC-1: runbook を `docs/30-workflows/` または `docs/00-getting-started-manual/runbooks/` に配置
- AC-2: トリガと判断主体が箇条書き
- AC-3: チェックリストはチェックボックス形式
- AC-4: ロールバック 2 種記述
- AC-5: UT-GOV-001 / UT-GOV-003 への双方向リンク

## 補足

solo 運用が継続している間は本 runbook を実行しない。整備のみが本タスクの完了条件。

## 関連

- 親: UT-GOV-003 (#146)
- 連携: UT-GOV-001 (branch protection apply), TASK-CODEOWNERS-VALIDATOR-CI-001
