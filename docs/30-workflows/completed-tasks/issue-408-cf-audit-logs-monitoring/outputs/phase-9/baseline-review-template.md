# 7 日 baseline 学習レビューテンプレ

## メタ情報

| 項目 | 値 |
| --- | --- |
| 学習開始 | YYYY-MM-DD HH:MM JST |
| 学習終了 | YYYY-MM-DD HH:MM JST |
| 学習期間 | 7 日（実日数: ___） |
| baseline JSON | `outputs/phase-11/baseline-7day-thresholds.json` |
| 学習対象除外 | rotation 期間（YYYY-MM-DD 〜 YYYY-MM-DD） |

## 学習結果サマリ

| 重要度 | 期間中検知数（shadow） | うち真陽性 | うち偽陽性 | 偽陽性率 |
| --- | --- | --- | --- | --- |
| HIGH | ___ | ___ | ___ | ___% |
| MEDIUM | ___ | ___ | ___ | ___% |
| LOW | ___ | ___ | ___ | ___% |
| 合計 | ___ | ___ | ___ | ___%（≤ 5% 必須） |

## 学習された閾値

```json
{
  "p99_per_minute_403": ___,
  "off_hours_window": { "start": "22:00", "end": "06:00", "tz": "Asia/Tokyo" },
  "expected_ip_ranges": ["..."],
  "expected_user_agents": ["..."],
  "rotation_blackout": [{ "from": "...", "to": "..." }]
}
```

## レビュー観点

- [ ] 偽陽性 5% 超の重要度区分はないか
- [ ] HIGH カテゴリで偽陰性疑い（手動レビューで気付いた異常）はないか
- [ ] rotation 期間が学習対象から除外されているか（meta-data 連携）
- [ ] expected_ip_ranges に GitHub Actions runner IP range が含まれるか
- [ ] off_hours の TZ が Asia/Tokyo であるか

## 結論

- [ ] PASS（全観点満たし、本番 alerting に昇格可能）
- [ ] CONDITIONAL PASS（軽微な調整後に再検討）
- [ ] FAIL（学習延長 or 閾値ロジック改修）

## 申し送り

学習中に判明した運用上の追加要件（例: weekend 別閾値、複数 Token 同時監視）は `unassigned-task` へ書き出す。
