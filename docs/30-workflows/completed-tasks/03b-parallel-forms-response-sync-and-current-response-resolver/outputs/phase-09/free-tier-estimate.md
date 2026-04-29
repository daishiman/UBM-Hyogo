# Free-tier 試算 — 03b Forms Response Sync

仮定:
- `*/15 * * * *` cron = 1 日 96 起動
- 1 起動あたり最大 `writeCap = 200` 行
- 通常運用での 1 起動の中央値は < 30 行（増分が小さい）

## Cloudflare Workers (Free)

| 制限 | 上限 / 日 | 03b 想定 | 余裕 |
|------|----------|---------|------|
| Requests | 100,000 | cron 96 + admin 数件 + scheduled 内 fetch | >>> |
| CPU time / req | 10ms | 1 invocation < ~5ms（mapper 中心） | OK |
| KV / cache | — | 不使用 | — |

## Cloudflare D1 (Free)

| 制限 | 上限 / 日 | 03b 想定 | 余裕 |
|------|----------|---------|------|
| Rows read | 5,000,000 | 1 起動 ~ 数百 read（identity 解決 + status 確認） → 約 50k | >>> |
| Rows written | 100,000 | 1 起動最大 200 × 96 = **19,200** writes | OK（< 20%） |
| Storage | 5 GB | response_fields + member_responses で当面 < 50 MB | >>> |

writeCap 緩和余地: 100k / 96 = ~1,040 writes/起動まで上げられる（保守的に 200 に固定中）。

## Google Forms API

| 制限 | 公式値 | 03b 想定 |
|------|--------|---------|
| Read requests / 100s / project | 300 | `*/15 min` × `pageSize=100` × 数 page → 安全圏 |
| Read requests / day | 10,000 程度（実績） | 100 程度 |

## Cloudflare Cron Triggers

cron は production / staging で `*/15 * * * *` + `0 */6 * * *`(or `0 * * * *`)。
Workers Free で cron 自体に追加課金はない。

## 結論

- 全項目 Free 枠内
- writeCap を上げる場合は `RESPONSE_SYNC_WRITE_CAP` を上書きして即可（再 deploy のみ）
- 将来 `1k members × 月 1 回更新` でも writes/日 << 1k で余裕
