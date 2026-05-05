# Phase 7 成果物: AC マトリクス検証

> ステータス: spec_created / docs-only / NON_VISUAL
> 入力: Phase 1 AC1-AC6、Phase 2 canonical 決定、Phase 4 V1-V4、Phase 5 Step A-F、Phase 6 FC-1〜FC-14

---

## 1. AC マトリクス

| AC | 内容 | 採択値 / 判定 | V スイート | Phase 5 Step | FC 紐付け | 判定 |
| --- | --- | --- | --- | --- | --- | --- |
| AC1 | retry max 回数 | 3（既定）+ env 上書き | V1-1, V1-2, V1-3 | Step C | FC-1, FC-2, FC-4, FC-13 | PASS |
| AC2 | Backoff curve | base 1s / cap 32s / jitter ±20% / 1 tick 収まり | V2-1, V2-2, V2-3 | Step B | FC-1, FC-2, FC-4 | PASS |
| AC3 | `processed_offset` schema | INTEGER NOT NULL DEFAULT 0 / chunk index | V3-1, V3-2, V3-3, V3-4 | Step A, D, E | FC-5, FC-7, FC-8, FC-9, FC-10 | PASS |
| AC4 | migration 影響 | DDL / backfill 不要 / rollback 2 案 | V4-3, V4-4 | Step A | FC-14 | PASS |
| AC5 | quota worst case | 2 req/100s（0.4%） | V4-1, V4-2 | （影響なし）| FC-2 | PASS |
| AC6 | `SYNC_MAX_RETRIES` 存続 | 既定 3 / 過渡期 7 日 | V1-2 | Step F | FC-13 | PASS |

---

## 2. coverage 代替指標と allowlist

本タスクは docs-only のため line coverage は計測しない。代わりに以下:

| 指標 | 値 | 期待 | 判定 |
| --- | --- | --- | --- |
| AC × V スイート 全充足 | 6/6 | 6/6 | PASS |
| AC × Step 全充足 | 5/6（AC5 はコード変更なし）| 5/6 + 1 N/A | PASS |
| FC × V wire-in | 14/14 | 14/14 | PASS |
| open question 件数 | 0（FC-10 / stale lock TTL は Phase 12 unassigned へ）| ≤ 0（受け皿明示）| PASS |

### allowlist（docs-only コンテキスト）

- coverage line/branch 計測の不在は本タスクに限り許容
- 物理 migration apply の不在は本タスクに限り許容（UT-09 / U-UT01-07 へ移譲）
- V1-V4 テスト実装の不在は本タスクに限り許容（UT-09 が実装）

---

## 3. 4 条件評価（最終確認）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 3 軸 canonical 化により UT-09 単独判断不能解消 |
| 実現性 | PASS | docs-only 全 Markdown で完結、AC 6/6 PASS |
| 整合性 | PASS | 不変条件 #1 / #5 違反なし、U-UT01-07 / U-UT01-08 と直交 |
| 運用性 | PASS | 過渡期 7 日 staging 校正フローを Phase 5 で具体化 |

---

## 4. 計測の証跡記録（机上のみ）

| 項目 | 計測方法 | 記録先 |
| --- | --- | --- |
| AC 達成率 | 本マトリクス | 本ファイル |
| 申し送り完備 | UT-09 / U-UT01-07 / U-UT01-08 への申し送り存在チェック | Phase 3 §6, Phase 5 §1, §4 |
| open question | Phase 12 unassigned-task-detection.md と突合 | Phase 12 で確認 |
| docs-only 厳格化 | コード変更 / migration / PR の不在 | Phase 12 spec compliance check |

---

## 5. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | 用語整流化で AC マトリクス内の表記揺れを正本化 |
| Phase 9 | AC5 worst case の数値再計算 |
| Phase 10 | GO/NO-GO ゲートの最終マトリクスとして転記 |

---

## 6. 完了条件チェック

- [x] AC1-AC6 × V × Step × FC マトリクス完成
- [x] coverage 代替指標と allowlist
- [x] 4 条件評価（全 PASS）
- [x] 計測証跡記録
- [x] open question 0（受け皿明示）
- [x] コード変更なし
