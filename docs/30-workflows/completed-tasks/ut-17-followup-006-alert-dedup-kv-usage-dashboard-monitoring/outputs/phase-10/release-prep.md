# Phase 10: リリース準備 (staging apply + 擬似発火準備)

## 本 PR スコープ内

- repo IaC declaration 完了 (`enabled: false`)
- mock fixture を用いた apply→diff 収束テスト PASS
- runbook / README 更新済み

## user 承認後に実施する手順（PR マージ前後）

```bash
# 1. read-only で現状の drift を確認 (missing 2 件期待)
mise exec -- pnpm cf:alerts:diff

# 2. user 承認後 apply (webhook → policy 順)
bash scripts/cf.sh alerts apply --yes

# 3. 冪等性確認 (2 回連続)
bash scripts/cf.sh alerts apply --yes
mise exec -- pnpm cf:alerts:diff   # exit 0 / "no drift detected" 期待
```

## 擬似発火検証 (Slack 着信 evidence 取得)

policy は `enabled: false` のため、Slack 経路の証明には次のいずれかを使用:

| オプション | 手順 | リスク |
| --- | --- | --- |
| 検証用一時 policy | 別 policy（極小閾値・`enabled: true`・短時間） を Dashboard で手動作成→発火→削除 | dashboard 手動編集が drift を生むため、検証直後に diff で 0 に戻す |
| 既存 `/internal/alert-relay` への curl payload | `runbooks/ut-17-alert-relay-monthly-healthcheck.md` Step 1 を流用 | Slack staging チャネルへ 1 件のみ送信 |

本タスクでは推奨手順として後者（Step 1 curl）を用い、Slack staging 着信を `outputs/phase-11/` に evidence として記録する。

## Wave B（別 wave）

5 営業日 baseline 取得後、閾値を再評価して `enabled: true` への切替 PR を作成する。本タスクには含めない。
