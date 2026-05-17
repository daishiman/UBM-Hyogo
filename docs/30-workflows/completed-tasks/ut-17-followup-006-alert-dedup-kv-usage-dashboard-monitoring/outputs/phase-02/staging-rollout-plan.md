# Phase 2: staging rollout plan (2 wave)

## Wave A — 本 PR スコープ (`enabled: false`)

1. policy JSON 2 件を `infra/cloudflare-alerts/policies/` に追加（`enabled: false`）
2. `quota-base.json` に KV キー追加
3. テスト追加・PASS 確認
4. `cf:alerts:diff` で missing が検知されることを確認（dry-run / read-only）
5. **user 承認後**に `bash scripts/cf.sh alerts apply --yes` で Cloudflare 上に作成
6. `cf:alerts:diff` が空になる evidence を取得
7. 検証用一時 policy（極小閾値 + `enabled: true`）か短時間負荷で Slack 着信を 1 件以上証明

## Wave B — 本 PR スコープ外（別 wave）

- 5 営業日 baseline 取得後に閾値を再評価
- `enabled: false` → `true` 切替 PR を別 wave で作成
- production への apply は user 承認後の別 wave で実施

## 完了判定の境界

- 本タスク Phase 1-13 の DoD: Wave A 完了（`enabled: false` apply + Slack 経路 1 件証明）
- Wave B は本タスクの成功条件に含めない（リスク回避）
