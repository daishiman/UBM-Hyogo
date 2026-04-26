# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | data-source-and-storage-contract |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-23 |
| 前 Phase | 5 (セットアップ実行) |
| 次 Phase | 7 (検証項目網羅性) |
| 状態 | completed |
| implementation_mode | new |
| task_kind | NON_VISUAL（インフラ・data contract） |

## 目的

Phase 5 で配置済みの sync worker / D1 schema に対し、(1) Sheets API 障害、(2) D1 部分書込失敗、(3) backfill 中の重複検知、(4) audit log 整合性 の 4 系統 + drift 系の異常系を CLI/SQL ベースで検証手順化し、運用復旧基準を確定する。

## 実行タスク

- Sheets API 障害（429 / 5xx / 認証失効）時の sync worker 期待挙動の整理
- D1 partial write 失敗時の transaction rollback / retry 経路の検証
- backfill（truncate-and-reload）中の重複検知（responseId 一意性）
- sync_audit 整合性確認（失敗 reason / 再実行 lineage）
- 異常系シナリオの failure-cases.md 化（最低 7 件）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/sync-flow.md | failure recovery 章 |
| 必須 | outputs/phase-04/test-plan.md | 異常系 test 観点 |
| 必須 | outputs/phase-05/sync-deployment-runbook.md | 配置済み worker の挙動 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | rollback 基本方針 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | D1 無料枠制約 |
| 参考 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | secret 失効時の挙動 |

## 実行手順

### ステップ 1: Sheets API 障害シナリオ
- 429 rate limit: exponential backoff（1s/2s/4s, 最大 3 回）→ 失敗時 sync_audit に reason='SHEETS_RATE_LIMIT'
- 5xx: 同様に retry → 最終失敗で `status='failed'`
- service account 認証失効: 401 検出で即停止、alert（observability=05a）

### ステップ 2: D1 部分書込失敗シナリオ
- batch INSERT のうち N 件失敗 → transaction 全体 rollback、再実行可能な状態を維持
- transaction 中断時の lock 状態を `wrangler d1 execute` で確認する SQL を runbook 化
- 復旧基準: D1 を最後の成功 sync 時点に戻し、Sheets を真として backfill（不変条件: AC-4）

### ステップ 3: backfill 重複検知
- truncate-and-reload で responseId を冪等キーとし、UNIQUE 制約違反は test fail とする
- 部分 backfill（中断 → 再開）でも responseId 件数が source（Sheets）と一致することを SQL で検証

### ステップ 4: audit log 整合性
- 各 sync 実行で 1 件の sync_audit レコードが追加される
- 失敗時 reason が enum 値（SHEETS_RATE_LIMIT / SHEETS_AUTH / D1_TX_FAIL / MAPPING_INVALID / PARTIAL_ABORT）
- 連続実行で `diff_summary_json` で再実行 lineage が辿れる

### ステップ 5: failure-cases.md 出力
- ID / 異常 / 検出方法 / 期待挙動 / 復旧手順 を表形式で記述
- 最低 7 件（rate limit / 5xx / 認証失効 / D1 tx fail / mapping 不整合 / 重複 backfill / drift 検知）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 異常系カバレッジを AC × 検証項目マトリクスに反映 |
| Phase 10 | 復旧基準（AC-4）の最終 gate 判定の根拠 |
| Phase 11 | smoke で実観測する異常系の選定元 |
| Phase 12 | sync_audit 観測項目の close-out 入力 |

## 多角的チェック観点（AIが判断）

- 価値性: 障害時に運用者が「Sheets を直すか D1 を戻すか」を即決できる粒度か
- 実現性: D1 無料枠を異常系検証で逸脱しないか（writes は最小 fixture）
- 整合性: AC-4（Sheets を真として再 backfill）と全シナリオが一致するか
- 運用性: failure-cases.md が runbook 連動でそのまま実行可能か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Sheets API 障害シナリオ | 6 | completed | 429 / 5xx / 401 |
| 2 | D1 partial write 失敗 | 6 | completed | tx rollback |
| 3 | backfill 重複検知 | 6 | completed | responseId UNIQUE |
| 4 | audit log 整合性 | 6 | completed | reason enum / lineage |
| 5 | failure-cases.md 整備 | 6 | completed | 最低 7 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | 異常系 7+ 件の検出・期待・復旧 |
| ドキュメント | outputs/phase-06/main.md | サマリ・観測項目・handoff |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] failure-cases.md に最低 7 件記載
- [ ] 各シナリオに「検出 SQL/コマンド」「期待挙動」「復旧手順」が揃う
- [ ] AC-4 復旧基準と全シナリオの整合性が取れている
- [ ] audit log enum 値が runbook と一致している

## タスク100%実行確認【必須】

- [x] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 異常系（rate limit / tx 失敗 / partial / drift / 認証失効）すべて記述
- [ ] 次 Phase への引き継ぎ事項を記述
- [x] artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 7 (検証項目網羅性)
- 引き継ぎ事項: failure-cases.md を AC × 検証項目 trace matrix へ取り込む
- ブロック条件: AC-4 と矛盾するシナリオがあれば Phase 5 差し戻し

## 異常系シナリオ表 (最低7件)

| ID | 異常 | 検出方法 | 期待挙動 | 復旧 |
| --- | --- | --- | --- | --- |
| A1 | Sheets API 429 | response code | exp backoff x3 → fail | scheduled で次回再試行 |
| A2 | Sheets API 5xx | response code | retry → fail | 同上 + 観測 alert |
| A3 | service account 401 | response code | 即停止 + audit | secret rotate（05a alert） |
| A4 | D1 tx 失敗（N 件中 K 件） | wrangler d1 / audit reason | 全件 rollback | 再実行で完全反映 |
| A5 | mapping 不整合（型/必須欠損） | mapping unit | row skip + audit | Sheets 修正 → 再 sync |
| A6 | backfill 中断 → 重複 | UNIQUE 違反 | abort + audit | resume_from で続行 |
| A7 | schema drift（Sheets 列追加） | mapping 警告 | 既知列のみ反映 | Phase 12 で spec 更新 |

## 再現手順

- A1/A2: モック Sheets endpoint で 429/5xx を返す staging 環境設定
- A3: secret に invalid JSON を一時投入し挙動確認後 rollback
- A4: 不正型 fixture を 1 件混入し batch INSERT を発火
- A5: 必須列空白 fixture
- A6: backfill を中断し再実行
- A7: Sheets に未定義列を追加して sync

## 期待エラーと対処

- 検出漏れ: sync_audit の reason enum を拡張し、Phase 12 で spec sync
- 復旧逸脱: AC-4（Sheets を真）に立ち戻り D1 を再構築
- drift: mapping を拡張余地のある形に保つ（不変条件 1）
