# responseEmail 変更時の identity 統合（EMAIL_CONFLICT admin merge UI） - タスク指示書

## メタ情報

| 項目         | 内容                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| タスクID     | 03b-followup-001-email-conflict-identity-merge                                    |
| タスク名     | responseEmail 変更時の identity 統合（EMAIL_CONFLICT admin merge UI）             |
| 分類         | 機能追加                                                                          |
| 対象機能     | admin backoffice の重複メンバー手動マージ                                         |
| 優先度       | 中                                                                                |
| 見積もり規模 | 中規模                                                                            |
| ステータス   | 未実施                                                                            |
| 発見元       | 03b Phase 12 unassigned-task-detection #1                                         |
| 発見日       | 2026-04-28                                                                        |
| 引き取り候補 | 04c-parallel-admin-backoffice-api-endpoints                                       |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

03b（forms response sync）は `member_responses.response_email` に UNIQUE 制約を敷き、
同一 email の再回答を `current_response_id` で切替える設計になっている。一方で「同一人物が
**別メールアドレス** で再回答する」ケースでは、`response_email` が異なるため UNIQUE 制約に
触れず、新しい member identity として別レコードが採番されてしまう。

03b は本ケースを完全に解決するスコープを持たず、`apps/api/src/jobs/sync-forms-responses.ts`
の `classifyError()` で UNIQUE/constraint 違反を `EMAIL_CONFLICT` エラーコードに分類して
sync_jobs.metrics_json に記録するに留めている。実際の identity 統合は admin backoffice で
人間が判断して手動 merge する運用を前提としている。

### 1.2 問題点・課題

- `EMAIL_CONFLICT` エラーコードを返すだけで、admin が衝突を確認・解消する UI が存在しない
- 「同一人物が別メールで再回答」した場合、別 identity として登録され公開ディレクトリに
  重複表示されるリスクがある
- 重複候補を admin に提示するロジック（氏名一致 / 所属一致 / 電話一致など）が未定義
- merge 実行時に `member_responses` / `member_status` / `response_fields` の owner を
  どちらに寄せるか・履歴をどう保持するかの仕様が未確定

### 1.3 放置した場合の影響

- 公開ディレクトリ・出席集計に同一人物が複数 identity で混入する
- 退会・consent 撤回が片方の identity にしか反映されず、PII / consent 不変条件（#3）が崩れる
- sync_jobs の `EMAIL_CONFLICT` 件数が積み上がるが、誰も解消できない死荷重になる

---

## 2. 何を達成するか（What）

### 2.1 目的

`EMAIL_CONFLICT` を含む重複疑い identity を admin backoffice で検出・確認・手動 merge できる
状態にし、03b が記録した衝突を運用上クローズできる経路を提供する。

### 2.2 最終ゴール

- admin が `EMAIL_CONFLICT` を起こした response 一覧と既存 identity 候補を確認できる UI が存在する
- admin が「同一人物として merge する / 別人として残す」を選択できる
- merge 実行時に `member_responses` / `member_status` の owner 統合と履歴保持が
  仕様化されており、不変条件 #1〜#5 を破らない
- 重複候補の判定基準（氏名 / 所属 / 電話 等）が spec として明文化されている

### 2.3 スコープ

#### 含むもの

- 重複候補判定アルゴリズム（氏名一致 + 所属一致 + 電話一致 等）の spec 化
- admin backoffice API（候補一覧取得 / merge 実行 / 別人マーク）
- admin 画面（候補リスト / merge 確認モーダル）
- merge トランザクション仕様（member_responses 統合 / member_status 統合 / 監査ログ）
- `EMAIL_CONFLICT` を起点とした重複検出の cron 連携

#### 含まないもの

- 自動 merge（判定基準の合意と検証が固まるまで scope out）
- 03b の sync ジョブ本体の変更（`EMAIL_CONFLICT` 検出ロジックは既に実装済み）
- 物理削除の導入（merge 後も論理保持）
- 公開ディレクトリ側のフィルタ（04a 責務）

### 2.4 成果物

- `apps/api/src/routes/admin/identity-merge/` 配下のエンドポイント実装
- admin 画面コンポーネント（apps/web 側）
- 重複候補判定 helper の実装と単体テスト
- merge トランザクションの統合テスト
- spec ドキュメント（判定基準・merge 仕様・監査要件）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 03b（forms response sync）が main にマージされている
- 04c（admin backoffice API endpoints）の foundation が用意されている
- `member_responses.response_email` UNIQUE 制約（01a）が DDL 上明示されている
- admin 認証経路（02 系）が利用可能

### 3.2 依存タスク

- 03b マージ済み（必須前提）
- 04c admin backoffice の auth / router foundation
- 02a member identity / status repository
- 01a の `member_responses.response_email` UNIQUE 制約（unassigned #4 の解消）

### 3.3 必要な知識

- `apps/api/src/jobs/sync-forms-responses.ts` の `EMAIL_CONFLICT` 分類ロジック
- `member_responses` / `member_status` / `response_fields` の論理削除セマンティクス
- 不変条件 #1（schema 固定回避）/ #3（PII 取扱）/ #5（D1 直アクセス apps/api 限定）
- 03b implementation-guide の current_response_resolver 仕様

### 3.4 推奨アプローチ

1. **判定基準の spec 固定 → API → UI** の順に進める
2. 判定基準は段階的に: 第一段階「氏名 + 所属の完全一致」のみで運用、誤検出が出たら拡張
3. merge は不可逆に近いため、admin による二段階確認（候補表示 → 確認 → 実行）を必須化
4. merge 実行は単一 D1 transaction で `member_responses.member_id` 付替 + `member_status` 統合 +
   監査ログ記録までを atomic に行う
5. 監査ログは別テーブル（`identity_merge_audit` 等）に永続化し、誤 merge の追跡可能性を担保

---

## 4. 実行手順

### Phase 構成

1. 重複候補判定基準の spec 化
2. admin API 設計（候補取得 / merge 実行 / 別人マーク）
3. merge トランザクション実装
4. admin UI 実装
5. 統合テストと運用 runbook

### Phase 1: 重複候補判定基準の spec 化

#### 目的

「同一人物候補」とみなす条件を明文化し、誤検出と見逃しのトレードオフを記録する。

#### 手順

1. 03b の `EMAIL_CONFLICT` を起こした response の特徴を整理
2. 氏名 / 所属 / 電話 / 過去 responseEmail の組合せで検証
3. 第一段階の判定式（例: `name` 完全一致 AND `affiliation` 完全一致）を確定

#### 完了条件

判定基準が spec ドキュメントに明記され、04c の API 設計に引用可能

### Phase 2: admin API 設計

#### 目的

候補取得 / merge 実行 / 別人マークの 3 エンドポイントを設計する。

#### 手順

1. `GET /admin/identity-conflicts` - `EMAIL_CONFLICT` を起点とした候補一覧
2. `POST /admin/identity-conflicts/:id/merge` - merge 実行（target identity を指定）
3. `POST /admin/identity-conflicts/:id/dismiss` - 別人として確定（再検出から除外）
4. 監査ログテーブル `identity_merge_audit` の DDL を 01a に追加要請

#### 完了条件

OpenAPI / route handler signature が固まり、04c の router に統合可能

### Phase 3: merge トランザクション実装

#### 目的

D1 transaction で identity 統合を atomic に実行する。

#### 手順

1. `member_responses.member_id` を target identity に付け替え
2. `member_status` の最新 snapshot を target に寄せ、source は `is_deleted=1`
3. `current_response_id` を再計算（03b の resolver を再利用）
4. 監査ログを `identity_merge_audit` に記録（actor / source_id / target_id / reason）

#### 完了条件

統合テストで「merge 後の current_response_resolver が正しく動作する」が green

### Phase 4: admin UI 実装

#### 目的

候補一覧と merge 確認画面を apps/web の admin 配下に実装する。

#### 手順

1. 候補一覧ページ（`EMAIL_CONFLICT` 件数バッジ付き）
2. 候補詳細 + merge 確認モーダル（差分プレビュー）
3. 別人マーク操作と監査ログ参照

#### 完了条件

E2E で「重複検出 → admin merge → 公開ディレクトリ重複解消」が green

### Phase 5: 統合テストと運用 runbook

#### 目的

merge 失敗時のリカバリ手順を runbook に明記する。

#### 手順

1. transaction 中断時の state を検証するテスト
2. 誤 merge を取り消す手順（監査ログから手動逆操作）を runbook 化
3. 連続 `EMAIL_CONFLICT` 発生時のアラート（03b-followup-006 と連携）

#### 完了条件

runbook に merge / unmerge / アラート閾値が記載されている

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] 重複候補判定基準が spec として明文化されている
- [ ] `GET /admin/identity-conflicts` が `EMAIL_CONFLICT` 起点の候補を返す
- [ ] `POST /admin/identity-conflicts/:id/merge` が atomic に identity 統合する
- [ ] `POST /admin/identity-conflicts/:id/dismiss` が再検出から除外する
- [ ] admin UI で候補確認 / merge / 別人マークができる
- [ ] `identity_merge_audit` に監査ログが永続化される

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] 統合テスト（merge transaction）green
- [ ] E2E（重複検出 → merge → 公開ディレクトリ重複解消）green

### ドキュメント要件

- [ ] 判定基準が `doc/00-getting-started-manual/specs/` に追記されている
- [ ] runbook に merge 失敗時のリカバリ手順が記載
- [ ] 03b implementation-guide の `EMAIL_CONFLICT` 節から本タスクへの相互参照

---

## 6. 検証方法

### テストケース

- 同一氏名 + 同一所属 + 別メールの 2 response が候補に上がる
- merge 実行後、`current_response_resolver` が target identity の最新 response を返す
- merge 実行後、source identity が論理削除され公開ディレクトリから消える
- dismiss 実行後、同一候補が再検出されない

### 検証手順

```bash
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/api test
mise exec -- pnpm --filter @repo/web test
# E2E
mise exec -- pnpm test:e2e -- admin-identity-merge
```

---

## 7. リスクと対策

| リスク                                         | 影響度 | 発生確率 | 対策                                                                       |
| ---------------------------------------------- | ------ | -------- | -------------------------------------------------------------------------- |
| 判定基準が緩く誤 merge が発生                  | 高     | 中       | 第一段階は厳格な完全一致のみで開始し、UI で必ず admin 二段階確認を入れる   |
| 判定基準が厳しすぎて重複が見逃される           | 中     | 中       | 03b の `EMAIL_CONFLICT` 件数を週次でレビューし、判定式を段階的に拡張       |
| merge 中の transaction 中断で半端な統合状態    | 高     | 低       | 単一 D1 transaction で実行、失敗時は full rollback                         |
| 誤 merge を取り消す手段が無い                  | 高     | 中       | `identity_merge_audit` を残し、unmerge 手順を runbook に明記               |
| PII 取扱（不変条件 #3）違反                    | 高     | 低       | merge 候補表示で responseEmail はマスクし、admin 専用ログは redact なし    |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/outputs/phase-12/unassigned-task-detection.md` (#1)
- `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/outputs/phase-12/system-spec-update-summary.md`
- `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/outputs/phase-12/implementation-guide.md`
- `apps/api/src/jobs/sync-forms-responses.ts` L399-L408 (`classifyError` の `EMAIL_CONFLICT` 分類)
- `doc/00-getting-started-manual/specs/01-api-schema.md`
- `doc/00-getting-started-manual/specs/00-overview.md`

### 参考資料

- 不変条件 #1（schema 固定回避）/ #3（PII 取扱）/ #5（D1 直アクセス apps/api 限定）
- 03b unassigned #4（`member_responses.response_email` UNIQUE 制約の DDL 明文化）

---

## 9. 苦戦箇所メモ

### 9.1 03b 実装時に断念した点

03b 実装時に「同一人物が別メールで再回答した場合の自動判定」を検討したが、判定アルゴリズム
（氏名一致 + 所属一致 + 電話一致 など）の合意が取れず、自動マージは scope out した。
代わりに `EMAIL_CONFLICT` エラーコードを返却し、admin UI 側で手動マージさせる方針を採用した。

### 9.2 判定基準が固まらなかった理由

| 項目     | 内容                                                                                                                       |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| 症状     | 「同姓同名で別所属」「同一人物で所属変更後に別メール再回答」の両ケースが共存し、単一判定式で安全に判定できなかった         |
| 原因     | 03b は sync ジョブの責務に閉じており、admin 運用 UI と判定基準の検証データが揃っていなかった                               |
| 対応     | 03b では `EMAIL_CONFLICT` エラーコードを sync_jobs.metrics_json に積むまでに留め、判定基準は 04c 着手時に固める方針とした   |
| 再発防止 | 本タスク Phase 1 で判定基準を spec として明文化し、第一段階は厳格な完全一致のみで開始する運用ルールを設ける                |

### 9.3 将来 04c 着手時に固めるべきこと

- 第一段階の判定式（推奨: `name` 完全一致 AND `affiliation` 完全一致）
- 第二段階以降の拡張トリガー（`EMAIL_CONFLICT` の月次件数閾値）
- 自動 merge 解禁条件（誤検出ゼロ運用が N ヶ月続いた場合）
- merge 監査ログの保持期間と参照権限

### 9.4 レビュー指摘の原文（該当 phase-12 検出）

```
#1 responseEmail 変更時の identity 統合（同一人物が別メールで再回答）
引き取り候補: 04c-parallel-admin-backoffice-api-endpoints
状態: 確認要
備考: admin 手動 merge UI が必要。本タスクは EMAIL_CONFLICT error code を準備するに留まる
```

### 9.5 補足事項

03b は `EMAIL_CONFLICT` エラーコードと sync_jobs.metrics_json への記録までを完了している。
本タスクはその下流（admin による解消経路）を提供するものであり、03b 単独で閉じることは
構造上不可能だった。04c 着手時に判定基準 spec 固定 → API → UI の順で進めることで、
誤 merge リスクを最小化しつつ運用に乗せられる。
