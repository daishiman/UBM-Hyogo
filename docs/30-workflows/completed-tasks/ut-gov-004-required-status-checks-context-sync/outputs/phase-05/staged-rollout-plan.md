# staged-rollout-plan.md — Phase 5 確定（再掲）

> Phase 2 の同名ファイルを Phase 5 で確定として再掲。差分なし。

## フェーズ 1（即時投入）

```yaml
contexts:
  - "ci"
  - "Validate Build"
  - "verify-indexes-up-to-date"
strict:
  dev: false
  main: true
```

## フェーズ 2（後追い投入）

`unit-test` / `integration-test` / `security-scan` / `docs-link-check` は UT-GOV-005 で workflow 新設後、以下条件を満たした日に追加。

1. workflow 新設（`.github/workflows/` に存在）
2. main または dev で `conclusion=success` が 1 回以上
3. 投入 24 時間前に `name:` が変更されないことを確認
4. branch protection 更新と同一 PR で投入

## 名前変更事故対応 (AC-9)

- 経路 A: workflow `name:` / job `name:` の変更を含む PR と branch protection 更新を同一 PR で実施
- 経路 B: 新旧並列 → 新側 1 回 PASS → 旧外し

## ロールバック

```bash
gh api -X PATCH /repos/daishiman/UBM-Hyogo/branches/main/protection \
  -F required_status_checks='{"strict":true,"contexts":[]}'
```
