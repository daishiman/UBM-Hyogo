# Phase 02 outputs / main

## 追跡対象 repo（3 件）

| repo | release 取得 |
| --- | --- |
| cloudflare/workers-sdk | `gh api repos/cloudflare/workers-sdk/releases` |
| nodejs/undici | `gh api repos/nodejs/undici/releases` |
| cloudflare/workerd | `gh api repos/cloudflare/workerd/releases` |

## triage キーワード（6 件）

1. `socket`
2. `EADDRNOTAVAIL`
3. `keep-alive` / `keepalive`
4. `agent pool` / `Agent` / `Pool`
5. `port`
6. `TIME_WAIT`

## チェック頻度

| trigger | 頻度 |
| --- | --- |
| 月次定期 | 毎月 1 日 |
| Miniflare メジャー更新 | major version 検知時 |
| Issue #577 関連再発 | 即時 |

## 判定基準

- **改善あり**: 上記キーワード hit + 挙動変化明示
- **改善なし**: hit 無し / internal refactor のみ
- **保留**: 影響範囲不明 → 今回は維持決定、次サイクル再評価

## 設計不変条件

- 追跡 repo は削減不可（追加のみ可）
- キーワードは削除不可（追加のみ可）
- 月次 trigger は固定

## 次フェーズ

Phase 3 で代替案比較（手動 vs cron / Renovate / Dependabot）。
