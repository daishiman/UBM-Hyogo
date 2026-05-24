# Skill Feedback Report

## テンプレ改善

なし。task-specification-creator の docs-only / implementation 再判定規則に従い、実コードへ反映した。

## ワークフロー改善

runtime smoke 401 recurrence では、失敗後の body 分類だけでなく smoke 前の bearer freshness gate を必須観点にする。
同じ知見は aiworkflow 正本へ同期済み。

## ドキュメント改善

Bearer lifecycle SSOT を追加し、runbook から直接リンクした。
秘密値は記録せず、reason / TTL / 同期不変条件のみを正本化した。
