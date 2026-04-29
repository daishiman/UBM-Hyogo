# Phase 9 成果物 — パフォーマンス・SLO

## 1. SLO 定義

| metric | 対象 | 目標 | 測定窓口 |
| --- | --- | --- | --- |
| availability | `/health/db` 200 応答率 | 99.5% / 30 日 | Cloudflare Analytics |
| latency p50 | 認証通過後の SELECT 1 RTT | < 50ms | Cloudflare Analytics |
| latency p99 | 同上 | < 250ms | Cloudflare Analytics |
| 503 率 | 全 200/503 のうち 503 占率 | < 0.5% / 30 日 | Workers logs |
| 401 率 | 401 / 全 request | 観測のみ（probing 検知用） | Workers logs |

## 2. 実装の負荷見積

- `prepare("SELECT 1").first()` は D1 内で固定の SQLite 経路、I/O は最小
- token 比較は string 長 43 程度の constant-time loop、O(43) で無視可能
- JSON serialization も小規模

→ Workers CPU time は p99 でも 1ms 未満を見込む。

## 3. UT-08 通知基盤の閾値（提案）

| 条件 | アクション | 根拠 |
| --- | --- | --- |
| 503 が 90 秒以内に連続 3 回 | P2 alert | `Retry-After: 30` を 3 回尊重 = 90 秒の窓 |
| 503 が 5 分以内に 5 回以上 | P2 alert | 単発フリッカーを除外 |
| 503 with `error == "HEALTH_DB_TOKEN unconfigured"` | P1 alert（即時） | config drift。同一環境内で再発しない |
| 401 が 5 分で 50 回 | P3 alert（probing 兆候） | rate limit の閾値とも整合 |
| 200 latency p99 > 500ms（10 分窓） | P3 alert | D1 劣化の早期検知 |

> 上記は提案値。UT-08 通知基盤側 PR で閾値合意を確定。

## 4. 容量計画

外部監視からの probe 想定: 1 req/min/region * 数 region = 数 req/min。WAF rate limit を 60 req/min/IP に置けば余裕で許容。

## 5. 引き渡し

Phase 10 へ: ロールアウト手順とロールバック条件を定義し、UT-22 完了確認 → secret 投入 → デプロイ → smoke までの線形フローを固定。
