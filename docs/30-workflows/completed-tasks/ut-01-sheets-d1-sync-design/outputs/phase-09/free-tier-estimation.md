# Phase 9 成果物: 無料枠見積もり（free-tier-estimation.md）

> **ステータス**: completed
> 仕様本体は `../../phase-09.md` を参照。
> 出典: Cloudflare Workers 公式 https://developers.cloudflare.com/workers/platform/limits/ ／ Cloudflare D1 公式 https://developers.cloudflare.com/d1/platform/limits/ ／ Google Sheets API 公式 https://developers.google.com/sheets/api/limits （いずれも 2026-04-29 アクセス）

## 前提

- 採択方式: **Cloudflare Workers Cron Triggers による定期 pull**（base case B / Phase 2 採択）
- 想定データ規模: バンドマン約 1,000 件（MVP 想定上限）
- 既定同期頻度: `0 */6 * * *`（6 時間ごと、1 日 4 回）
- 平常時の差分件数: 1 回あたり 0〜10 行程度を想定
- バックフィル: 月 1 回程度（手動トリガー / 1,000 行）

## 1. Cloudflare Workers 実行回数（無料枠 100,000 req/day）

| Cron 間隔 | 1 日実行回数 | 月間実行回数 | 無料枠ヘッドルーム |
| --- | --- | --- | --- |
| **6h（base case 既定）** | 4 | 約 120 | **99.99% 余裕** |
| 1h（高頻度オプション） | 24 | 約 720 | 99.28% 余裕 |
| 5min（最高頻度オプション） | 288 | 約 8,640 | 91.36% 余裕 |

`/admin/sync` 手動トリガーは月数回程度の想定で、無料枠への影響は無視できる範囲。**結論**: いずれの Cron 間隔でも無料枠の 10% 未満で完結。

## 2. Workers CPU 時間（無料枠 10ms/req のバースト + 50ms 上限 / I/O 待ちは非カウント）

| 観点 | 値 | 判定 |
| --- | --- | --- |
| Sheets API 取得（100 行 / batch） | 約 200ms〜1s（外部 I/O 待ち） | I/O 待ちは CPU 時間にカウントされない |
| D1 書込（UPSERT 100 行） | 約 5〜20ms | 無料枠内 |
| ハッシュ計算（SHA-256 × 100 行） | 約 1〜5ms | 無料枠内 |
| sync_log 更新（status / offset） | 約 1〜2ms | 無料枠内 |
| **合計 CPU 時間（実行 1 回 / 100 行 batch）** | **約 7〜27ms** | **50ms 上限内** |

1,000 行を 1 tick で処理する場合は 100 行 × 10 batch で約 70〜270ms 必要となり 50ms 上限を超える可能性がある。そのため `processed_offset` ベースで tick 跨ぎ resume を前提とする（FC-3 / 苦戦箇所 #1）。

## 3. Cloudflare D1 書込量（無料枠: 5GB Storage / 25M reads/day / 50K writes/day）

> 注: 無料枠は 2026-04 時点の公式値。Cloudflare の公式 limits ページに従う。

| シナリオ | 1 日書込行数 | 50K writes/day 比 |
| --- | --- | --- |
| 平常時（差分 10 行 × 4 回 / day） | 40 | 0.08%（**99.92% 余裕**） |
| 平常時 + sync_log 書込（4 ジョブ × 平均 3 status 更新） | 約 52 | 0.10% |
| 月次フル同期（1,000 行 × 1 回 / month） | 約 33（月次平均化） | 0.07% |
| バックフィル（1,000 行 × 1 回 / day） | 1,000（一過性） | 2.0%（バックフィル日のみ） |
| バックフィル 5 倍規模（5,000 行 × 1 回 / day） | 5,000 | 10%（一過性、許容） |

D1 Storage（5GB）に対しては、members 1,000 行 + sync_log 数千レコード（completed=7d / failed=30d 保持）でも MB オーダーで余裕あり。

## 4. Sheets API quota - 平常時（6h Cron + 100 行 batch）

| 観点 | 値 | quota 比（500 req/100s/project） |
| --- | --- | --- |
| 1 回実行の API 呼び出し数 | 1〜10 req（行数依存）| 0.2〜2% / 100s |
| 1 日の API 呼び出し数 | 4〜40 req | quota は 100s 単位なので per-day 比較不要 |
| ピーク 100s 内の想定 req 数 | 10 req（1 回の sync 実行内に集中する場合） | **2%（98% ヘッドルーム）** |

## 5. Sheets API quota - バックフィル時

| シナリオ | 連続 API 呼び出し数 | quota 比 / 100s |
| --- | --- | --- |
| 1,000 行を 100 行 batch × 10 req | 10 req | 2% |
| 100s 内に再実行された場合 | 20 req | 4% |
| 5,000 行（障害復旧）バックフィル | 50 req | **10%** |
| 10,000 行（極端ケース） | 100 req | 20% |

並列度 1 + バッチ 100 行 + Backoff 1〜32s + quota 超過時 100s 待機の 4 段防御により、いずれのシナリオでも quota 内で完結見込み。

## 6. quota 超過リスク評価

| シナリオ | 超過確率 | 対策 |
| --- | --- | --- |
| 平常時 | 極低（< 1%） | Backoff 不要だが防御的に 1〜32s Backoff を残す |
| バックフィル単独 | 低（< 5%） | 100 行 batch + 並列度 1 で安全マージン |
| 他プロジェクトと quota 共有 | 中（環境依存） | **MINOR-M-Q-01**: Service Account / API Key を UT-01 専用で確保（UT-03 引き継ぎ） |
| 複数 Cron 同時実行（多重起動） | 低 | 二重実行防止（sync_log `in_progress` レコード + `lock_expires_at` で排他、FC-9） |

## 7. 結論

- **Cloudflare Workers 実行回数**: 6h Cron で 99.99% ヘッドルーム → **PASS**
- **Workers CPU 時間**: 100 行 batch × tick 跨ぎ resume で 50ms 上限内 → **PASS**
- **Cloudflare D1 書込量**: 平常時 0.1%、バックフィル 2〜10% → **PASS**
- **Sheets API quota**: 平常時 2%、バックフィル 10% → **PASS**
- **総合**: 全サービスとも無料枠の 10% 以下で完結 → **PASS**

## 8. 持ち越し（MINOR）

| ID | 内容 | 引き継ぎ先 |
| --- | --- | --- |
| TECH-M-02 | Cron 間隔（6h / 1h / 5min）の最終確定は UT-09 staging 実測で決定 | UT-09 |
| MINOR-M-Q-01 | GCP プロジェクト共有時の Sheets API quota 配分確認 | UT-03 |
| TECH-M-04 | sync_log 保持期間（completed=7d / failed=30d）の運用調整余地 | Phase 12 / UT-08 |

## 9. 監視推奨指標（UT-08 への引き継ぎ）

| 指標 | 閾値 | アラート起動条件 |
| --- | --- | --- |
| Cron 実行成功率 | > 99% | 24h 内に 2 回以上 failed |
| sync_log.failed 件数 | < 5 / 24h | 5 件以上 |
| Sheets API quota 利用率 | < 50% / 100s | 50% 超過時 WARN、80% 超過時 CRIT |
| D1 writes 利用率 | < 50% / day | 50% 超過時 WARN |
| sync_log `in_progress` の stale 件数（lock_expires_at < now） | 0 件 | 1 件以上で stale lock 解放 |
