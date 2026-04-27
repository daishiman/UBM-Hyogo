# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-parallel-forms-response-sync-and-current-response-resolver |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 2（設計） |
| 次 Phase | 4（テスト戦略） |
| 状態 | pending |

## 目的

Phase 2 の設計に対し alternative を 4 案検討、PASS / MINOR / MAJOR で判定し、リスク登録を行う。

## 実行タスク

1. 案 A〜D を列挙、比較表を作成。
2. PASS-MINOR-MAJOR 判定。
3. consent snapshot のリスク（admin が触った値の上書き）を緩和策と合わせて整理。
4. リスク登録（cursor lost / Forms quota / responseEmail 重複 / unknown 漏れ / 二重起動）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | 設計 |
| 必須 | outputs/phase-02/sync-flow.mermaid | flow |
| 必須 | doc/02-application-implementation/README.md | 不変条件 |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | flow / consent snapshot 仕様 |

## 実行手順

### ステップ 1: alternative 列挙
- A（採用）: cursor を sync_jobs.payload に保存、cron */15 + 手動、consent snapshot は public/rules のみ更新。
- B: cursor を別テーブル（`sync_cursors`）。
- C: cron */5 で全件 list、cursor 不使用（毎回 full sync）。
- D: cursor を KV (Workers KV) に保存、binding 追加。

### ステップ 2: 比較表
- 後述参照。

### ステップ 3: 判定
- 採用: A、判定 PASS。
- 理由: KV 不要、テーブル新設不要、無料枠対応。

### ステップ 4: リスク登録
- 後述参照。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用案の verify 設計 |
| Phase 5 | runbook |
| Phase 7 | リスク影響を AC に反映 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| consent キー統一 | #2 | 全案で `rulesConsent` 統一 |
| schema 集約 | #14 | 全案で unknown は queue 経由 |
| 無料枠 | #10 | 案 C は cron 3 倍 + 全件 → 無料枠リスク |
| ID 混同禁止 | #7 | 全案で responseId / memberId 分離 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | alternative 列挙 | 3 | pending | A/B/C/D |
| 2 | 比較表 | 3 | pending | コスト / 不変条件 |
| 3 | PASS 判定 | 3 | pending | A 採用 |
| 4 | リスク登録 | 3 | pending | 6 件以上 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 比較 / 判定 / リスク |
| メタ | artifacts.json | phase 3 を `completed` |

## 完了条件

- [ ] alternative 4 案
- [ ] PASS 判定 + 理由
- [ ] リスク 6 件以上

## タスク100%実行確認【必須】

- [ ] サブタスク 4 件すべて completed
- [ ] 比較表に「採用否」「理由」がある
- [ ] consent 上書きリスクが緩和策付き
- [ ] artifacts.json の phase 3 が `completed`

## 次 Phase

- 次: 4（テスト戦略）
- 引き継ぎ事項: 採用案 + リスク

## 比較表（alternative）

| 観点 | A: cursor=sync_jobs.payload, cron */15（採用） | B: 別 sync_cursors テーブル | C: cursor 不使用 cron */5 全件 | D: KV cursor |
| --- | --- | --- | --- | --- |
| インフラ追加 | なし | テーブル 1 件追加 | なし | KV binding 追加 |
| 無料枠（#10） | 適合 | 適合 | 危険（毎回 full） | 適合 |
| consent キー（#2） | 適合 | 適合 | 適合 | 適合 |
| 排他 | sync_jobs lock | sync_jobs lock | sync_jobs lock | KV race あり |
| 復旧性 | sync_jobs.payload で確認可 | テーブル参照 | cursor なくロスレス（全件） | KV inspect |
| 実装コスト | 低 | 中 | 低 | 高 |
| 採用否 | 採用 | 不採用（重複） | 不採用（コスト） | 不採用（KV 増） |

## PASS-MINOR-MAJOR 判定

| 項目 | 判定 |
| --- | --- |
| 設計の自己整合 | PASS |
| 不変条件適合 | PASS |
| 上下流境界 | PASS |
| 無料枠 | PASS |
| 総合 | PASS |

## リスク登録

| ID | リスク | 重大度 | 緩和策 |
| --- | --- | --- | --- |
| R-1 | cursor lost（sync_jobs payload 破損） | 中 | full sync を `POST /admin/sync/responses?fullSync=true` で手動実行可能 |
| R-2 | Forms API 429 quota | 中 | retry exponential backoff（1s/2s/4s）+ cron 次回再試行 |
| R-3 | responseEmail 重複（複数 identity が混入） | 高 | UNIQUE(response_email) + violation 時に admin alert |
| R-4 | unknown field 漏れ（diff queue 投入忘れ） | 中 | unit test で normalize → enqueue 一致を assert |
| R-5 | 二重起動 | 中 | sync_jobs lock |
| R-6 | consent snapshot で admin が触った publish_state を上書きする事故 | 高 | snapshot は public_consent / rules_consent のみ。publish_state / is_deleted は触らない |
| R-7 | submittedAt 同値タイ時の current_response 不安定 | 低 | responseId lexicographic 最大採用ルールで決定的に |
| R-8 | ruleConsent 旧名混入 | 中 | extract-consent 内で alias 正規化 + lint rule |

## 次 Phase への注記

- 採用 A を Phase 4 verify 設計に渡す。
- リスク R-1〜R-8 を Phase 6 異常系に対応付ける。
