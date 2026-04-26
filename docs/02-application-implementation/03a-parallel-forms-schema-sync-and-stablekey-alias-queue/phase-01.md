# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | なし（task entry） |
| 次 Phase | 2（設計） |
| 状態 | pending |

## 目的

Forms 同期のうち **schema** に閉じた責務（forms.get → schema_versions / schema_questions、未割当 question を schema_diff_queue へ）を確定し、Wave 4c / 7b へ無矛盾な引き渡しを成立させる。stableKey をコードに埋め込まず alias で吸収する境界を Phase 1 で固定する。

## 実行タスク

1. 02a / 02b / 01b の AC を読み、**何が既に提供されるか**を表に書き出す（schema_questions repository の関数シグネチャ、forms.get wrapper の戻り値型）。
2. `01-api-schema.md` の 31 項目・6 セクション仕様を本タスクの input として確定する（item count / section count / stableKey 一覧）。
3. `03-data-fetching.md` の schema sync flow 章を本タスク scope の唯一参照として固定する。
4. AC（AC-1〜AC-8）を index.md と一致させ、quantitative 表現に書き直す。
5. 真の論点（true issue）/ 依存境界 / 価値とコスト / 4 条件を主成果物に記録する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | 31 項目・6 セクション・stableKey・system fields |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | schema sync flow / alias 戦略 |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | cron 設定 / sync_jobs |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | Wave 3a 詳細 |
| 必須 | doc/02-application-implementation/README.md | 不変条件 #1〜#15 |
| 参考 | doc/00-getting-started-manual/specs/08-free-database.md | schema 系テーブル定義 |

## 実行手順

### ステップ 1: 上流引き渡し物の確定
- 02b が公開する `schemaVersionsRepository` / `schemaQuestionsRepository` / `schemaDiffQueueRepository` の関数シグネチャを確認し、本タスクで利用する関数を outputs/phase-01/main.md に列挙する。
- 01b が公開する `googleFormsClient.getForm(formId)` の戻り値型を確認し、本タスクが解釈すべきフィールドを列挙する。

### ステップ 2: scope 確定
- in: forms.get → flatten → stableKey resolve → upsert / diff queue 投入 / sync_jobs ledger / `POST /admin/sync/schema` の job 関数本体 / cron entry。
- out: response sync（03b）、alias の admin UI 操作（07b）、画面実装（06c）。

### ステップ 3: AC quantitative 化
- AC-1 を「item count = 31、section count = 6 を `schema_questions` / `schema_versions` に対して count(*) で検証」と書き直す。
- AC-3 を「07b の alias 確定後、当該 question の `schema_diff_queue.status = 'resolved'`」と書き直す。

### ステップ 4: 4 条件評価
- 価値性: stableKey 直書きを排除して将来の form 変更に強くする。
- 実現性: forms.get は無料、cron は無料枠内（1 日 1 回 + 手動）。
- 整合性: 03b と repository / sync_jobs を共有しても排他制御が保てる（同種 job 排他）。
- 運用性: `POST /admin/sync/schema` で手動再同期、失敗 retry が cron 経由で可能。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | scope / AC を入力に設計 |
| Phase 4 | AC ごとに verify 設計 |
| Phase 7 | AC matrix の起点 |
| Phase 10 | GO/NO-GO 判定の根拠 |
| 下流タスク 04c | `POST /admin/sync/schema` の API endpoint 実装に引き渡す関数仕様 |
| 下流タスク 07b | `schema_diff_queue` の row 構造を共有 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| stableKey 直書き禁止 | #1 | コードに 31 項目の stableKey をハードコードしない。alias テーブル経由解決に統一 |
| apps/api 限定 | #5 | sync は apps/web から呼べない。`apps/api` 内 job 関数のみで完結 |
| GAS 非依存 | #6 | sync は Forms API + Workers で実施し、GAS prototype の同期処理を持ち込まない |
| responseId / memberId 非汚染 | #7 | schema sync は responseId / memberId に触れない（責務境界） |
| 無料枠内 | #10 | 1 日 1 回 cron + 手動。失敗 retry も exponential backoff で抑制 |
| schema 集約 | #14 | 検出した diff は `/admin/schema` に集約され、本タスクが起点 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 AC を読み引き渡し物を表化 | 1 | pending | outputs/phase-01/main.md |
| 2 | scope in/out 確定 | 1 | pending | 03b / 07b との境界 |
| 3 | AC quantitative 化 | 1 | pending | item=31 / section=6 |
| 4 | 4 条件評価 | 1 | pending | TBD → PASS/MINOR/MAJOR |
| 5 | 真の論点 / 依存境界 / 価値とコスト | 1 | pending | 主成果物末尾 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義（true issue / scope / AC / 4 条件） |
| メタ | artifacts.json | phase 1 を `completed` へ更新 |

## 完了条件

- [ ] 主成果物が作成され、上流 AC（02a/02b/01b）の引き渡し物が網羅されている
- [ ] AC が quantitative に書かれている（数値・row 件数・状態名で表現）
- [ ] 真の論点 / 依存境界 / 価値とコスト / 4 条件が必須セクションとして記載
- [ ] artifacts.json の phase 1 が `completed`

## タスク100%実行確認【必須】

- [ ] 全実行タスク 1〜5 が completed
- [ ] 主成果物 outputs/phase-01/main.md が存在
- [ ] 不変条件 #1, #5, #6, #7, #10, #14 が触れられている
- [ ] 31 項目・6 セクションの数値が文章に明記
- [ ] 次 Phase 2 への引き継ぎ（scope / AC / open question）を末尾に列挙
- [ ] artifacts.json の該当 phase を `completed` に更新

## 次 Phase

- 次: 2（設計）
- 引き継ぎ事項: scope in/out、AC（quantitative）、上流 AC 引き渡し物表
- ブロック条件: 主成果物未作成、AC が定性的、不変条件番号未引用

## 真の論点（true issue）

- 同期 job の **冪等性** をどう保証するか（同一 revisionId の再実行が schema_versions を二重書きしない）。
- **stableKey 未割当** question を どこに退避するか（answer: schema_diff_queue / unresolved）。
- **alias 解決** をコード側でなく D1 側に持つ理由（コード再デプロイなしで吸収するため）。

## 依存境界

| 境界 | 含む | 含まない |
| --- | --- | --- |
| Forms API | forms.get の呼び出し | forms.responses.list（03b 担当） |
| D1 書き込み | schema_versions / schema_questions / schema_diff_queue / sync_jobs | member_responses / response_fields（03b 担当） |
| 公開 endpoint | POST /admin/sync/schema | POST /admin/sync/responses（03b 担当）, GET /admin/schema/diff（04c 担当） |
| 認可 | admin only | 公開 / 会員 |

## 価値とコスト

| 観点 | 内容 |
| --- | --- |
| 初回価値 | form 変更に対するアプリ追従コストを 0 デプロイ化（alias で吸収） |
| 払わないコスト | 31 項目 hardcode、retry 暴走、cron 高頻度実行、二重起動 |
| 残余リスク | Forms API quota、サービスアカウント鍵漏洩 |

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | stableKey 直書き排除でアプリ改修コストを下げるか | PASS |
| 実現性 | 無料枠 + サービスアカウント認証で成立するか | PASS |
| 整合性 | 03b / 07b / 04c と責務境界が衝突しないか | PASS |
| 運用性 | 失敗時に手動 + cron で復旧可能か | PASS |
