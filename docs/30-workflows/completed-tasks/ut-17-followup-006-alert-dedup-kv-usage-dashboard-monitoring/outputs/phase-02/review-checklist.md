# Phase 2 → Phase 3 review checklist

- [ ] policy 命名が既存命名規約と整合
- [ ] threshold 絶対値が repo に存在しない（percentage × quotaBase）
- [ ] schema / lib 変更が不要であることの根拠が明確
- [ ] 初期 `enabled: false` で baseline 取得前の誤通知リスクが無い
- [ ] webhook 再利用が `ut-17-relay` のみで新規 destination を作らない
- [ ] runbook の Step 4 / 4b 更新方針が決まっている
- [ ] 5 営業日 baseline 取得 + `enabled: true` 切替が本タスク完了条件から分離されている
