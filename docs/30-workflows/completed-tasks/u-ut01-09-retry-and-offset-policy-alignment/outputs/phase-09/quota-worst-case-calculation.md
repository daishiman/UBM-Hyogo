# Phase 9 成果物: Quota worst case 算定 / SLA

> ステータス: spec_created / docs-only / NON_VISUAL
> 入力: Phase 1 §10 quota 算定前提、Phase 2 canonical 決定、Phase 6 FC マトリクス
> AC 連動: AC2（1 tick 内収まり）/ AC5（Sheets API 500 req/100s 整合）

---

## 1. 前提値（Phase 6 / Phase 2 から転記）

| 項目 | 値 | 出典 |
| --- | --- | --- |
| Sheets API quota | 500 req/100s/project | Google Sheets API v4 |
| Workers scheduled CPU 制限 | 30s（free / paid 共通の CPU 時間枠は wall-clock 別だが保守的に 30s 仮定） | Cloudflare Workers |
| batch_size | 100 行 | UT-01 Phase 02 |
| cron 間隔 | 6h（既定 21600s） | UT-01 Phase 02 |
| 想定総行数 | 2000 行（MVP） | Phase 1 |
| 同時実行最大 | 2（cron + 手動）| Phase 1 |
| retry max | 3 | Phase 2 §1 |
| backoff base / cap / jitter | 1s / 32s / ±20% | Phase 2 §2 |

---

## 2. 算定式

### 2.1 Sheets API request カウント

1 sync run で Sheets API を叩く回数:
- `fetcher.fetchRange(range)` 1 回（実装は単一呼び出しで全 range を取得）
- retry の対象は D1 upsert のため Sheets API へ追加 req は発生しない

→ **1 sync run = 1 Sheets API req**

### 2.2 100s ウィンドウ内の Sheets API req

- 同時実行最大 2（cron + 手動 + sync_locks による skip 競合は worst case で双方成功と仮定する保守的試算）
- 100s 内に複数 cron は発生しない（cron 6h 間隔）
- 手動同期の頻度を 1 req/100s と保守的に置く

→ **worst case: 2 req / 100s**

### 2.3 D1 upsert 試行回数

1 chunk あたり最大 retry 3 = 4 試行（初回 + 3 retry）。20 chunks × 4 = 80 試行。
これは D1 への試行であり Sheets API quota とは別系統。

### 2.4 Workers 滞在時間 worst case

```
1 chunk worst-case = backoff(1s) + backoff(2s) + backoff(4s) + upsert(1s) = 8s
20 chunks 直列 = 160s
```

- cron 6h tick 内で 160s は 0.74%
- ただし Workers scheduled CPU 制限 30s に対しては超過リスクあり → 対策: chunk 単位の `processed_offset` 進捗で次 tick 再開可能（FC-5）

### 2.5 jitter による時間分散

backoff に ±20% jitter を入れることで burst を 100s ウィンドウ内で分散。同時 2 sync が完全同時に retry burst することを防ぐ。

---

## 3. worst case 集約表

| シナリオ | Sheets API req / 100s | D1 試行 / sync | Workers 滞在時間 | quota 達成率 | 判定 |
| --- | --- | --- | --- | --- | --- |
| 通常: 単独 cron run（無障害） | 1 | 20 | 21s（20 × ~1s upsert）| 0.2% | PASS |
| 単独 cron run + Sheets 5xx 一時障害 | 1 | 〜80 | 〜160s | 0.2% | PASS（Workers CPU 30s 超過は次 tick 再開で吸収） |
| 同時 cron + 手動（lock skip）| 1（一方は skipped）| 20 | 21s | 0.2% | PASS |
| 同時 cron + 手動（lock 双方成功・保守的試算）| 2 | 〜160 | 〜160s | 0.4% | PASS |
| quota_exhausted 発生（FC-2）| 2（直近 100s）| 80（D1 retry）| 〜160s | 0.4% | PASS（自動 backoff で次回 100s で回復） |
| 致命的 burst（手動同期 5 連発） | 5 | 20 × 5 = 100 | 並列で短い | 1.0% | PASS（500 req/100s に対し余裕 99%） |

---

## 4. offset 戦略別の追加 quota 影響

| 戦略 | 追加 Sheets API req | 採否 |
| --- | --- | --- |
| 全範囲再取得（offset 不採用） | 失敗時に毎 tick 全 range 再 fetch = 1 req（変わらず）| 不採用（FC-5 で詰む） |
| chunk index 採用（本タスク採択）| failed 後再開時 1 req（範囲は同じ）| 採用 |
| 安定 ID 集合 | 採用時は ID 集合の取得で +1 req になる可能性 | 不採用（複雑度に対する quota 影響限定）|

→ **chunk index 採用は quota 影響中立**

---

## 5. SLA 算定

| SLA 項目 | 値 | 根拠 |
| --- | --- | --- |
| 1 sync run 完了時間（通常） | < 30s | 20 chunks × ~1s upsert + fetch |
| 1 sync run 完了時間（worst） | < 200s（次 tick 再開込み）| 20 chunks × 8s + fetch + 進捗 UPDATE |
| failed 確定時間 | retry 3 完了時点 = 1 chunk あたり最大 8s | Phase 2 §2 |
| 再開遅延 | 次 cron tick 6h 内 | Phase 6 FC-5 |
| 監視ラグ | sync_job_logs 書き込み即時 | 既存実装 |

---

## 6. a11y / mirror parity / line budget / link 検証

docs-only タスクのため:

- a11y: NON_VISUAL のため対象外
- mirror parity: `.claude/skills/aiworkflow-requirements/` の正本利用、mirror 不在のため対象外
- line budget: 各 Phase output ファイル 100-400 行範囲、本ファイル 200 行以内
- link 検証: Phase 11 link-checklist.md で実施

---

## 7. 結論

- **AC2**: 1 tick (21600s) 内に worst case 160s で完了 → PASS
- **AC5**: Sheets API worst case 0.4% / quota 余裕 99.6% → PASS
- 過渡期 7 日（R1）でも quota 影響は同水準を維持

---

## 8. 完了条件チェック

- [x] 前提値転記
- [x] 算定式記載
- [x] worst case 集約表（具体数値）
- [x] offset 戦略別追加影響
- [x] SLA 算定
- [x] AC2 / AC5 充足判定
- [x] コード変更 / migration / PR なし
