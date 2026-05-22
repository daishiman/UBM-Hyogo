# Phase 10: 監視・運用（再発防止）

## 10.1 GitHub Audit log への自動記録

GitHub は variable 削除を自動的に Audit log に記録する:

- Event type: `repository_actions.delete_actions_variable`
- 確認 URL: `https://github.com/daishiman/UBM-Hyogo/settings/audit-log`
- Repository owner 権限で参照可能

→ 追加の監視 hook は不要。

## 10.2 再発防止策

| 観点 | 施策 |
| --- | --- |
| 未参照 variable 増殖の防止 | Phase 12 detection で `unassigned-task-detection.md` の出力時に variable list を含めるルール（既存運用） |
| closed issue への fold 防止 | Phase 12 `skill-feedback-report.md` に no-op routing として記録。Issue #638 仕様内では closed issue へ `Refs` のみを使う |
| 削除手順の標準化 | 本仕様 Phase 6.2 の delete script を template として今後の variable 削除に再利用 |

## 10.3 監視メトリクス（軽量）

| メトリクス | 値 | 計測方法 |
| --- | --- | --- |
| 未参照 GitHub Variable 件数 | 0 (削除後 baseline) | 月次手動: `gh api .../actions/variables` ↔ `rg <name> .github/` の cross check |
| dormant 期間 | N/A | 本 variable は 2026-04-29 以来 dormant |

定期 cron / CI gate 化は本タスク scope 外（過剰投資）。

## 10.4 周辺タスクとの連携シグナル

- 後続 `issue-331-followup-002` (Pages project 物理削除) 実施時、本 spec の DoD 達成を前提とすること
- 後続 `issue-331-followup-003` (OIDC cutover) は本タスクと独立、影響なし

## 10.5 運用ハンドオフ

本 spec 完了後、運用上必要なアクションはなし。dormant cleanup baseline は本タスクで確立完了。
