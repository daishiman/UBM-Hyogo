# 別メール再回答による identity 重複の検出・admin merge API & UI 実装 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                                                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| タスクID     | 04c-followup-001-email-conflict-merge-api-and-ui                                                                                                                                                                  |
| タスク名     | 別メール再回答による identity 重複の検出・admin merge API & UI 実装                                                                                                                                               |
| 分類         | 実装（API + admin UI）                                                                                                                                                                                            |
| 対象機能     | admin backoffice の identity 重複候補検出・merge / dismiss 操作・監査ログ                                                                                                                                         |
| 優先度       | 高                                                                                                                                                                                                                |
| 見積もり規模 | 大規模                                                                                                                                                                                                            |
| ステータス   | 未実施                                                                                                                                                                                                            |
| 親タスク     | 03b-followup-001-email-conflict-identity-merge                                                                                                                                                                    |
| 委譲先 wave  | 04c (admin backoffice API) + 06c (admin UI)                                                                                                                                                                       |
| 発見元       | 03b Phase 12 unassigned-task-detection #1 を 03b-followup-001 spec で詳細化、本タスクは spec 完成後の実装着手分                                                                                                   |
| 発見日       | 2026-05-02                                                                                                                                                                                                        |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

03b では Google Form 再回答を本人更新の正式経路としつつ、`response_email` を識別キーとして `member_identities` を採番する設計を確定させた。`member_identities.response_email` には UNIQUE 制約があるため、**同一メールでの再回答**は同一 identity として整合する。
一方、03b-followup-001 spec で詳細化された通り、**同一人物が別メールアドレスで再回答した場合** UNIQUE 制約に触れず別 identity が採番されるため、見かけ上 2 名のメンバーとして分裂する。spec は既に確定しており、本タスクは admin backoffice 側の検出・merge 機能の実装着手分である。

### 1.2 問題点・課題

- 別メール再回答が放置されると、会員数カウント・公開ディレクトリ・admin 操作対象がすべて二重化する
- D1 UNIQUE 制約だけでは検出できないため、アプリケーション層で氏名+所属のマッチングを行い候補化する必要がある
- merge は `member_identities` PK 統合と `member_status` 集約を伴う破壊的操作であり、誤マージからの復旧手順（unmerge runbook）が無いと運用に投入できない
- merge 進行中に Google Form sync が走った場合、`current_response_id` 切替えと merge transaction の競合が発生し得る

### 1.3 放置した場合の影響

- 公開ディレクトリで同一人物が複数件表示され UBM 兵庫支部会の信頼性が損なわれる
- admin が二重化に気付かずメッセージ送信・状態変更を誤った identity に対して行う
- 会員数集計が水増しされ、運用 KPI が歪む
- 誤マージ発生時の復旧手段が無いと事故が即座にデータ損失に直結する

---

## 2. 何を達成するか（What）

### 2.1 目的

admin が氏名+所属で一致する identity 重複候補を検出・確認・merge / dismiss できる API と UI を提供し、誤マージからの復旧 runbook までを揃えて運用投入可能にする。

### 2.2 最終ゴール

- `apps/api` (04c) に `/admin/identity-conflicts` 系 endpoint 群が実装され、候補一覧 / merge preview / merge 実行 / dismiss が動作する
- `apps/web` (06c) admin UI に候補リスト・merge 確認モーダル・監査ログ参照画面が実装されている
- merge transaction が `member_identities` PK 統合 + `member_status` 集約 + 監査ログ (before/after payload) を atomic に処理する
- unmerge 復旧 runbook が文書化され、誤マージから 24h 以内の復旧が可能
- 監査ログ before/after payload を保存する D1 schema 拡張が完了している

### 2.3 スコープ

#### 含むもの

- 04c で `/admin/identity-conflicts` 系 endpoint 群実装（Hono + D1）
  - `GET /admin/identity-conflicts` 候補一覧
  - `GET /admin/identity-conflicts/:id` 詳細（merge preview 兼用）
  - `POST /admin/identity-conflicts/:id/merge` merge 実行
  - `POST /admin/identity-conflicts/:id/dismiss` 別人マーク保存
- 重複候補判定アルゴリズム第一段階: 氏名完全一致 + 所属完全一致
- 06c で admin UI 実装（候補リスト / merge 確認モーダル / 監査ログ表示）
- 監査ログ before/after payload 用 D1 schema 拡張（migration）
- merge transaction 仕様（`member_identities` PK 統合 + `member_status` 集約 + 監査ログ atomic 書き込み）
- unmerge 復旧 runbook 文書化

#### 含まないもの

- 03b-followup-001 spec 改訂（spec 確定済み）
- 03b-followup-001 workflow root 作成（別タスク `03b-followup-001-workflow-elevation`）
- 第二段階以降の判定アルゴリズム拡張（氏名+所属一致以外。運用フェーズで月次レビューにより追加）
- public web 側からの自動 merge トリガー（admin 起点のみ）

### 2.4 成果物

- `apps/api` の `/admin/identity-conflicts` 系 handler / service / repository 一式
- `apps/web` admin UI の候補リスト Page / merge 確認モーダル Component / 監査ログ参照 Component
- D1 migration（監査ログ payload 拡張）
- merge transaction 仕様書（前提条件・手順・ロールバック）
- unmerge runbook（`docs/30-workflows/.../runbooks/unmerge-identity.md`）
- 統合テスト（merge 成功 / dismiss / sync 競合 / unmerge）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 03b-followup-001 spec が確定している（`completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-001-email-conflict-identity-merge.md`）
- 03b 本体の `member_identities` / `member_status` / `responses` schema が staging で稼働している
- admin 認証基盤（06c 側）が cookie session を発行可能
- 判定アルゴリズム段階拡張のフィードバックループ（後述 4.1）が運用ルールとして確定している

### 3.2 実行手順

1. 03b-followup-001 spec を再読し、merge transaction 要件・監査ログ要件・unmerge 要件を抽出
2. D1 migration を設計（監査ログテーブルに `before_payload_json` / `after_payload_json` / `merge_transaction_id` カラム追加、`identity_dismissals` テーブル新設）
3. 04c で repository 層に氏名+所属完全一致クエリを実装（`COLLATE NOCASE` / 全角半角・空白正規化を spec に従って適用）
4. service 層で merge transaction を実装（D1 batch / `BEGIN`-`COMMIT` 相当）。`current_response_id` 切替えと merge は `lock_token` で相互排他化（4.2 参照）
5. handler 層で `/admin/identity-conflicts` 系 endpoint 4 本を実装。Zod schema で request/response を fix
6. 06c で admin UI 候補リスト Page / merge 確認モーダル / 監査ログ参照 Component を実装
7. unmerge runbook を作成（before payload からの復元手順・24h 以内の SLA・手順失敗時のエスカレーション）
8. 統合テスト（merge 成功 / dismiss 永続 / sync 競合時の lock 動作 / unmerge 手順 dry-run）
9. visual evidence（admin UI screenshot）と implementation-guide.md を整備

### 3.3 受入条件 (AC)

- AC-1: `GET /admin/identity-conflicts` が氏名+所属完全一致の候補ペアを返す（dismiss 済みは除外）
- AC-2: `POST /admin/identity-conflicts/:id/merge` が `member_identities` を統合し、`member_status` を集約し、監査ログに before/after payload を残す（atomic）
- AC-3: `POST /admin/identity-conflicts/:id/dismiss` が別人マークを保存し、以後同一ペアは候補に再出現しない
- AC-4: admin UI で候補リスト表示・merge 確認モーダル（差分プレビュー付き）・監査ログ参照が動作する
- AC-5: unmerge runbook が文書化されており、誤マージから 24h 以内に before payload から復元可能（dry-run で検証済み）
- AC-6: merge 進行中に Google Form sync が走っても `current_response_id` 整合性が壊れない（lock_token による調停）

---

## 4. 苦戦箇所 / 学んだこと（必ず記載）

### 4.1 判定アルゴリズムの段階拡張メカニズム未定

第一段階の「氏名+所属完全一致」は false positive リスクが極小だが、その分**見逃しリスク**が大きい（旧姓・改姓・所属変更・転記揺れで一致しない）。spec 上「運用フェーズで段階的に拡張」と明記されているが、

- 月次レビューの実施主体・トリガー閾値（見逃し件数・admin 体感）
- 第二段階（漢字/かな揺れ・所属部分一致・電話番号一致）の優先順位
- 拡張時の false positive 監視メトリクス

が未確定。**実装着手前に運用ルール確定が必須**。確定しないまま第二段階以降を実装すると、admin 工数を超える候補リストが生成され機能停止に追い込まれるリスクがある。本タスクの DoD には「第一段階の運用」までを含め、第二段階拡張は別タスクとして切り出す。

### 4.2 merge と sync の競合

identity merge 進行中に Google Form 再回答 sync が走った場合、

- merge 側: 2 つの identity を統合し `current_response_id` を勝者側に集約しようとする
- sync 側: 敗者側 identity の `current_response_id` を新しい response に切替えようとする

の二者で `current_response_id` 書き込みが競合する。03b の lock TTL recovery runbook と類似の問題で、`sync_jobs` の `lock_token` を merge transaction にも拡張し、merge 開始時に対象 identity 双方の lock を取得、sync 側は lock 取得失敗で deferred queue に積む方式が安全。実装前に 03b の lock 設計を再読し、merge 用 lock scope を spec 化する必要がある。

### 4.3 監査ログの粒度

before/after payload を全フィールド保存するか差分のみかは、

- **法的観点**: PII（氏名・所属・連絡先）を平文で長期保存することへの利用規約整合性
- **運用負荷**: 全フィールド保存は復旧容易だが容量肥大、差分のみは復旧時に欠損リスク
- **保存期間**: unmerge SLA 24h を満たすには最低 30 日、運用監査観点では 1 年が妥当

のトレードオフ判断が必要。本タスクでは「全フィールド JSON snapshot を 90 日保持し、以降は差分要約のみ残す」を初期方針として提案するが、利用規約レビュー（`docs/00-getting-started-manual/google-form/`）と admin 運用合意を実装前に取ること。

---

## 5. 関連リソース

- 親 spec: `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-001-email-conflict-identity-merge.md`
- 03b implementation guide: `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/outputs/phase-12/implementation-guide.md`（存在すれば）
- 既存フォーマット参考: `docs/30-workflows/unassigned-task/04b-followup-008-me-profile-ui-consumption.md`
- API schema 仕様: `docs/00-getting-started-manual/specs/01-api-schema.md`
- D1 構成仕様: `docs/00-getting-started-manual/specs/08-free-database.md`
- 利用規約（PII 保存方針判断材料）: `docs/00-getting-started-manual/google-form/`
- 関連 followup: `03b-followup-001-workflow-elevation`（workflow root 作成、別タスク）
