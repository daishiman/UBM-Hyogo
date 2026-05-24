# Unassigned Task Detection

## 結果

1 件（2026-05-24 再分類）。

| # | 未タスク | priority | 配置先 | 状態 |
|---|---|---|---|---|
| 1 | STAGING_AUTH_SECRET 投入と mint path 有効化 | 高 | `docs/30-workflows/unassigned-task/runtime-smoke-staging-mint-recurrence-fix-followup-001-staging-auth-secret-provisioning-mint-activation.md` | 未実施・Issue 化済み |

## 判定根拠（再分類）

検出した改善点（鮮度ゲート、auth path 可視化、401 reason 細分化、mint self-verify、SSOT/runbook 同期）は本改善サイクルで実装済み。

当初は外部操作（GitHub secret 投入、runtime rerun、commit/push/PR）を一律 user-gated の承認境界として 0 件判定していたが、`STAGING_AUTH_SECRET` 投入＋mint 有効化は単なる承認境界ではなく **根本原因 R-5 の直接対策**（恒久対策の手動ステップが台帳漏れで忘却され 24h 周期で再発）であり、既存 Issue にも該当しないため、ユーザー承認のうえ未タスクとして formalize した。

- **実行**自体は引き続き user-gated（secret 投入・workflow 再実行はユーザー操作）。
- **追跡対象としての台帳化**を承認境界と分離する。台帳化しないこと自体が R-5 の再演になるため。
- #899（`ci-green-recovery-followup-001-static-bearer-fallback-retirement`、static fallback 撤去）の**前提タスク**であり、重複ではなく依存関係（本タスク → #899）として相互リンクする。

commit / push / PR / runtime rerun は引き続き未タスク送りではなく Phase 13 / user-gated 承認境界として扱う。
