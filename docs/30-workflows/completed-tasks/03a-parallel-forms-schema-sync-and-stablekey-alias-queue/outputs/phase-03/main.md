# Phase 3 成果物: 設計レビュー — forms-schema-sync-and-stablekey-alias-queue

Phase 2 採用案（A: 1 日 1 回 cron + 手動 endpoint + D1 alias + diff queue）に対し、3 案以上の alternative を比較し PASS / MINOR / MAJOR で判定する。

---

## 1. alternative 列挙

| 案 | 概要 |
| --- | --- |
| **A（採用）** | Cloudflare Workers cron 1 日 1 回（03:00 JST） + `POST /admin/sync/schema` 手動。stableKey は **D1 alias テーブル**で解決。未解決は `schema_diff_queue` に `queued` 投入、07b で resolve |
| B | cron なし、admin 手動 endpoint のみで同期 |
| C | 1 時間 cron + stableKey を **JSON manifest としてコード同梱** |
| D | 1 日 1 回 cron + Google Forms watch（push 通知）受信 |

---

## 2. 比較表

| 観点 | A（採用） | B: 手動のみ | C: 1h cron + JSON manifest | D: 1day cron + Forms watch |
| --- | --- | --- | --- | --- |
| Forms API quota 余裕 | 高（1 日 1 回） | 高 | 中（24 倍） | 高 |
| D1 write コスト | 低 | 最低 | 高（毎時 31 行 upsert） | 低 |
| stableKey 直書き禁止（**#1**） | 適合（D1 alias） | 適合 | **違反**（コード同梱） | 適合 |
| schema 集約（**#14**） | 適合 | 適合 | 適合 | 適合 |
| 無料枠（**#10**） | 適合 | 適合 | **危険**（D1 write 24x、cron job 数増） | 適合 |
| GAS 非依存（#6） | 適合 | 適合 | 適合 | 適合 |
| apps/api 限定（#5） | 適合 | 適合 | 適合 | 適合 |
| 即時性 | 中（admin 手動可） | 低（人依存） | 高 | 高 |
| 実装コスト | 中 | 低 | 高（manifest 同梱 + 反映 PR 必須） | 高（push 受信 endpoint + secret） |
| 運用性（再実行・retry） | 高（ledger + 手動 + cron） | 中 | 中 | 中（push 欠落で気付けない） |
| schema 変更追従 | 高（0 デプロイ） | 中 | **低**（PR + デプロイが毎回必要） | 高 |
| 障害時の隔離性 | 高（job_type 別 lock） | 高 | 中 | 中（push idempotency 設計が必要） |
| **採用否** | **採用** | 不採用 | 不採用 | 不採用 |
| **判定理由** | 無料枠内 + 即時性 + #1 適合の三拍子 | 即時性なし、運用人依存 | **#1 #10 違反**で却下 | 実装/運用コストが価値を上回る |

---

## 3. PASS / MINOR / MAJOR 判定

| 項目 | 判定 | 根拠 |
| --- | --- | --- |
| 設計の自己整合 | **PASS** | flow / SQL / module / env がすべて一貫 |
| 不変条件適合（#1, #5, #6, #10, #14） | **PASS** | §2 比較表で全項目適合 |
| 上流引き渡し物との整合（02b / 01b） | **PASS** | 既存 repository / forms client を呼ぶだけ |
| 下流境界（04c / 07b） | **PASS** | endpoint と diff queue の 2 接点で結合最小 |
| 並列タスク（03b）排他 | **PASS** | `sync_jobs.job_type` で衝突なし |
| 無料枠 | **PASS** | cron 1 日 1 回 + 31 行 upsert + diff queue 数件 |
| **総合** | **PASS** | 採用案 A をそのまま Phase 4 へ |

---

## 4. リスク登録

| ID | リスク | 重大度 | 緩和策 | 対応 Phase |
| --- | --- | --- | --- | --- |
| R-1 | Forms API quota 超過 | 中 | cron 1 日 1 回上限、`withBackoff` 指数 retry 上限化、admin 手動連打を rate-limit | Phase 6 |
| R-2 | サービスアカウント鍵漏洩 | 高 | Cloudflare Secrets のみで保管、commit 禁止 lint、`.env` は op 参照のみ | Phase 9 |
| R-3 | 同種 job の同時実行（cron と admin 手動の重複） | 中 | `sync_jobs` `job_type='schema_sync' AND status='running'` 検出 → **HTTP 409** で reject（AC-6） | Phase 4 / 6 |
| R-4 | 同一 `revisionId` の重複 upsert で row 増殖 | 低 | `ON CONFLICT(revision_id) DO UPDATE` で no-op 化（AC-4） | Phase 4 |
| R-5 | 既知 stableKey の取りこぼし（resolve 失敗） | 中 | Phase 4 で 31 項目 fixture assertion / cron 後の `COUNT(stable_key NOT NULL)` を metrics へ | Phase 4 / 7 |
| R-6 | unresolved の diff queue 投入漏れ | 中 | `resolveStableKey` が unknown を返した分岐で **必ず** `enqueue` 経由する unit test | Phase 4 |
| R-7 | stableKey リテラル混入（#1 違反） | 高 | ESLint custom rule `no-stable-key-literal` を `apps/api/src/sync/schema/**` に強制適用（AC-7） | Phase 5 / 8 |
| R-8 | items 並び順変動による schemaHash 揺れ | 低 | hash 計算前に `itemId` 昇順正規化 | Phase 5 |
| R-9 | 削除検出（removed sweep）の誤検出 | 中 | 直前 `state='active'` revision に限定して比較、`questionId` がフォーム側で変わるケースは alias 経由で resolve | Phase 6 |

---

## 5. 不変条件 #1 / #14 適合度の比較

| # | A | B | C | D |
| --- | --- | --- | --- | --- |
| #1（stableKey をコード固定しない） | 適合（D1 alias） | 適合（ただし alias 戦略未定義のまま運用） | **違反**（manifest 同梱） | 適合 |
| #14（schema 変更は `/admin/schema` 集約） | 適合（diff queue 起点） | 適合（手動同期から起点） | 適合 | 適合 |

---

## 6. 採用案 A の確定事項（Phase 4 引き継ぎ）

- **採用**: 案 A、判定 **PASS**。
- **runbook 設計入力**: Phase 2 の `runSchemaSync` flow / 6 ブロックの SQL。
- **test 設計入力**: AC-1〜AC-8 と R-1〜R-9 を test matrix へ展開。
  - AC-1: fixture 31 項目を流して row count 検証
  - AC-2: unknown question を含む fixture で diff queue 1:1 投入を検証
  - AC-3: alias 確定 → 次回 sync で `queued` 件数 delta = 0
  - AC-4: 同一 revisionId 連続実行 no-op
  - AC-5: ledger 状態遷移
  - AC-6: 並行実行で 409
  - AC-7: lint rule（snapshot test）
  - AC-8: 31 項目欠落なし（cron シナリオ）
- **異常系展開**（Phase 6）: R-1〜R-9 のうち R-1 / R-3 / R-5 / R-6 / R-9 を異常系シナリオへ。

---

## 7. 完了条件チェック

- [x] alternative が 4 案（A / B / C / D）記載済み
- [x] PASS / MINOR / MAJOR 判定の理由付き（§3）
- [x] 比較表に #1 / #10 / #14 が登場（§2）
- [x] リスク **9 件**（要件 4 件以上）登録（§4）
- [x] 採用案が Phase 2 と矛盾しない（A = Phase 2 採用設計と一致）
- [x] 次 Phase 4 が test 設計を始められる前提条件が揃っている（§6）

---

## 8. 次 Phase への注記

- 採用 A を Phase 4 の verify 設計に渡す。
- R-1〜R-9 を Phase 6 の異常系に分解。R-7（lint rule）は Phase 5 実装ランブックで具体化。
- open question（Phase 2 §9）への回答:
  1. `removed` 検出は `queued` で投入し 07b で resolve（手動確認）させる方針で確定。
  2. 削除検出範囲は直前 `state='active'` revision に限定。
  3. `schemaHash` は SHA-256（hex）を採用、items を `itemId` 昇順で正規化してから JSON 化する。
