# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 2（設計） |
| 次 Phase | 4（テスト戦略） |
| 状態 | pending |

## 目的

Phase 2 の設計に対し simpler / different alternative を 3 案検討し、PASS / MINOR / MAJOR で判定する。採用案の確定とリスク登録を行う。

## 実行タスク

1. 採用案（A）に対する代替案を 3 つ書き、メリット / デメリット / 採用否を記載する。
2. PASS（このまま採用） / MINOR（軽微修正で採用）/ MAJOR（差し戻し）の判定を実施する。
3. 不変条件 #1 / #14 への適合度を 3 案で比較する。
4. リスク登録（Forms API quota / 鍵漏洩 / 競合 / 二重起動）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | 採用設計 |
| 必須 | outputs/phase-02/sync-flow.mermaid | 図 |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | flow / alias 戦略 |
| 必須 | doc/02-application-implementation/README.md | 不変条件 |

## 実行手順

### ステップ 1: alternative 列挙
- 案 A（採用）: 1 日 1 回 cron + 手動 endpoint、alias は D1 テーブル、unresolved は queue へ。
- 案 B（簡素）: cron なし、admin が手動同期する。
- 案 C（最大網羅）: 1 時間ごと cron、alias を JSON manifest にコード同梱。
- 案 D（中庸）: 1 日 1 回 + Forms watch（push 通知）。

### ステップ 2: 比較表作成
- 後述「比較表」を参照。

### ステップ 3: 判定
- 採用: A、判定 PASS。
- 理由: 無料枠、admin 即時同期、alias は D1 で吸収（コード再デプロイ不要）。

### ステップ 4: リスク登録
- 後述「リスク登録」を参照。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用案ベースで test 設計 |
| Phase 5 | 採用案の runbook を実装 |
| Phase 7 | リスク → AC への影響を反映 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| stableKey 直書き | #1 | 案 C は alias を JSON でコード同梱するため #1 違反 |
| schema 集約 | #14 | 案 B / C も `/admin/schema` 集約は守れるが、案 A が運用コスト最小 |
| 無料枠 | #10 | 案 C は cron 24 倍で D1 write 増 → 無料枠リスク |
| 排他 | #5 / #6 | sync は apps/api 内、GAS 不採用は全案共通 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | alternative 4 案列挙 | 3 | pending | A / B / C / D |
| 2 | 比較表作成 | 3 | pending | コスト / 運用性 / 不変条件 |
| 3 | PASS-MINOR-MAJOR 判定 | 3 | pending | 採用 = A, PASS |
| 4 | リスク登録 | 3 | pending | quota / 鍵 / 競合 / 二重起動 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 比較表 / 判定 / リスク |
| メタ | artifacts.json | phase 3 を `completed` に更新 |

## 完了条件

- [ ] alternative が 3 案以上記載
- [ ] PASS / MINOR / MAJOR の理由付き判定
- [ ] 不変条件 #1 / #10 / #14 が比較表に登場
- [ ] リスク 4 件以上登録

## タスク100%実行確認【必須】

- [ ] サブタスク 4 件すべて completed
- [ ] 比較表に「採用否」「判定理由」が両方ある
- [ ] 採用案が Phase 2 と矛盾しない
- [ ] 次 Phase 4 が test 設計を始められる前提条件が揃っている

## 次 Phase

- 次: 4（テスト戦略）
- 引き継ぎ事項: 採用案 A、リスク登録
- ブロック条件: 判定 MAJOR の場合、Phase 2 へ戻る

## 比較表（alternative 評価）

| 観点 | A: 1日1回 cron + 手動 + D1 alias（採用） | B: 手動のみ | C: 1時間 cron + JSON alias | D: 1日1回 + Forms watch |
| --- | --- | --- | --- | --- |
| Forms API quota 余裕 | 高 | 高 | 中 | 高 |
| D1 write コスト | 低 | 最低 | 高（毎時 upsert） | 低 |
| stableKey 直書き禁止（#1） | 適合 | 適合 | 違反 | 適合 |
| schema 集約（#14） | 適合 | 適合 | 適合 | 適合 |
| 無料枠（#10） | 適合 | 適合 | 危険 | 適合 |
| 即時性 | 中（手動可） | 低（人依存） | 高 | 高 |
| 実装コスト | 中 | 低 | 高（manifest 同梱） | 高（push 受信） |
| 運用性 | 高（ledger / retry） | 中 | 中 | 中 |
| 採用否 | 採用 | 不採用 | 不採用 | 不採用 |

## PASS-MINOR-MAJOR 判定

| 項目 | 判定 |
| --- | --- |
| 設計の自己整合 | PASS |
| 不変条件適合 | PASS |
| 上流 / 下流境界 | PASS |
| 無料枠 | PASS |
| 総合 | PASS |

## リスク登録

| ID | リスク | 重大度 | 緩和策 |
| --- | --- | --- | --- |
| R-1 | Forms API quota 超過 | 中 | 1 日 1 回 cron + 手動を上限化、retry に exponential backoff |
| R-2 | サービスアカウント鍵漏洩 | 高 | Cloudflare Secrets 管理、リポジトリ commit 禁止 lint |
| R-3 | 同種 job の同時実行 | 中 | sync_jobs に `running` 行があれば 409 で reject |
| R-4 | revision 重複 upsert で row 増殖 | 低 | `ON CONFLICT(revision_id) DO UPDATE` で no-op 化 |
| R-5 | 既知 stableKey の取りこぼし | 中 | Phase 4 で 31 項目を assertion |
| R-6 | unresolved の漏れ（diff queue 未投入） | 中 | resolveStableKey が unknown を返したら必ず queue へ |

## 次 Phase への注記

- 採用 A を Phase 4 の verify 設計に渡す。
- 6 リスクを Phase 6 の異常系に分解する。
