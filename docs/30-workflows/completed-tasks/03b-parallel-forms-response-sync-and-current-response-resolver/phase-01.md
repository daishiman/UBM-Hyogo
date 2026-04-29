# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-parallel-forms-response-sync-and-current-response-resolver |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | なし |
| 次 Phase | 2（設計） |
| 状態 | pending |

## 目的

response 同期に閉じた責務（forms.responses.list → member_responses / response_fields / member_identities / member_status snapshot）を確定し、04* / 07* に矛盾なく引き渡す。`responseEmail` を system field として正しく扱い、consent キー混同（`ruleConsent` 旧名）を完全に排除する。

## 実行タスク

1. 上流 02a / 02b / 01b の引き渡し物（repository 関数 / Forms client 戻り型）を表化。
2. `01-api-schema.md` の system fields / consent / publicConsent / rulesConsent 仕様を input として確定。
3. `03-data-fetching.md` の response sync flow / current response 選定 / consent snapshot を本タスク scope の唯一参照として固定。
4. AC-1〜AC-10 を quantitative に書き直す。
5. 真の論点 / 依存境界 / 価値とコスト / 4 条件を主成果物に記録。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | system fields / consent |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | response sync flow / current response 選定 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | cron */15 / sync_jobs |
| 必須 | docs/30-workflows/02-application-implementation/_design/phase-2-design.md | Wave 3b 詳細 |
| 必須 | docs/30-workflows/02-application-implementation/README.md | 不変条件 |
| 参考 | .claude/skills/aiworkflow-requirements/references/security-api.md | rulesConsent と auth gate |
| 参考 | .claude/skills/aiworkflow-requirements/references/database-schema.md | テーブル構造 |

## 実行手順

### ステップ 1: 上流引き渡し物の表化
- 02a: `memberResponsesRepository`, `responseSectionsRepository`, `responseFieldsRepository`, `memberIdentitiesRepository`, `memberStatusRepository`
- 02b: `schemaQuestionsRepository.findStableKeyByQuestionId()`, `schemaDiffQueueRepository.enqueue()`
- 01b: `googleFormsClient.listResponses(formId, { pageToken? })`

### ステップ 2: scope 確定
- in: forms.responses.list / response upsert / current_response 切替 / consent snapshot / `POST /admin/sync/responses` / cron entry
- out: schema sync（03a）、admin UI（06c）、認証（05a/b）、profile 編集（不採用）

### ステップ 3: AC quantitative 化
- AC-1 を「同一 `responseEmail` の最新 `submittedAt` が `member_identities.current_response_id` に一致」と書き直す。
- AC-3 を「current response の consent = `consented` のとき `member_status.public_consent = consented`」と書き直す。
- AC-10 を「per sync で D1 write < 200 row（cursor full sync 時）」と書き直す。

### ステップ 4: 真の論点 / 依存境界 / 4 条件
- 後述参照。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | scope / AC を入力に設計 |
| Phase 4 | AC ごとに verify 設計 |
| Phase 7 | AC matrix 起点 |
| Phase 10 | GO/NO-GO 根拠 |
| 下流 04a | view model `PublicMemberListView` の元になる current_response + member_status |
| 下流 04b | `/me/profile` が current_response を読む契約 |
| 下流 04c | `POST /admin/sync/responses` の handler |
| 下流 07a | response 更新後に tag queue を起動 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| schema 固定禁止 | #1 | stableKey 解決は schema_questions 経由 |
| consent キー統一 | #2 | `ruleConsent` 旧名を入力時点で正規化、内部に持ち込まない |
| responseEmail = system field | #3 | response_fields に保存しない |
| profile 本文編集禁止 | #4 | 同期は新 response の追加のみ、既存本文を上書きしない |
| apps/api 限定 | #5 | sync は apps/api 配下 |
| GAS 排除 | #6 | Forms API + Workers のみ |
| responseId / memberId 混同禁止 | #7 | 型 brand で物理分離 |
| 無料枠 | #10 | cron */15 の write 量制限 |
| schema 集約 | #14 | unknown は schema_diff_queue へ |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流引き渡し物表化 | 1 | pending | 02a/02b/01b |
| 2 | scope in/out 確定 | 1 | pending | 03a / 04* / 07* との境界 |
| 3 | AC quantitative 化 | 1 | pending | AC-1〜AC-10 |
| 4 | 4 条件評価 | 1 | pending | TBD → PASS |
| 5 | 真の論点 / 依存境界 / 価値とコスト | 1 | pending | 末尾 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義 |
| メタ | artifacts.json | phase 1 を `completed` |

## 完了条件

- [ ] 主成果物に scope / AC / 上流引き渡し物 / 4 条件 / 真の論点 が揃う
- [ ] 不変条件 #1〜#7, #10, #14 が触れられている
- [ ] AC-1〜AC-10 が quantitative

## タスク100%実行確認【必須】

- [ ] サブタスク 5 件すべて completed
- [ ] AC-1 で `submittedAt 最新` が明記
- [ ] AC-2 で `extra field row (`response_fields.stable_key=__extra__:<questionId>`)` + `schema_diff_queue` の両方が明記
- [ ] AC-7 で `Brand<>` 型が明記
- [ ] AC-8 で `ruleConsent` 旧名禁止が明記
- [ ] artifacts.json の phase 1 が `completed`

## 次 Phase

- 次: 2（設計）
- 引き継ぎ事項: scope / AC / 上流引き渡し物表
- ブロック条件: 主成果物未作成、AC が定性的

## 真の論点（true issue）

- **current response 選定**: `submittedAt` 同値タイ時の決定ルール（`responseId` lexicographic で最大採用）。
- **consent snapshot**: 既に `member_status` を admin が触っている場合、consent snapshot で上書きしてよいか（answer: `public_consent` / `rules_consent` のみ snapshot 上書き、`publish_state` / `is_deleted` は触らない）。
- **unknown field の二重 write**: `extra field row (`response_fields.stable_key=__extra__:<questionId>`)` だけでなく `schema_diff_queue` にも積むことで、admin が一覧で気付ける（answer: 両方 write 必須）。
- **responseEmail の正本化**: Forms API 上は metadata 扱いだが、ログイン照合に使う最重要キー → `member_responses.response_email` に列としても物理保存。

## 依存境界

| 境界 | 含む | 含まない |
| --- | --- | --- |
| Forms API | forms.responses.list | forms.get（03a 担当） |
| D1 書き込み | member_responses / response_sections / response_fields / member_identities / member_status (consent のみ) / schema_diff_queue / sync_jobs | schema_versions / schema_questions（03a 担当）、tag queue（07a 担当）、admin notes（02c / 04c） |
| 公開 endpoint | POST /admin/sync/responses | POST /admin/sync/schema（03a 担当） |
| 認可 | admin only | 公開 / 会員 |

## 価値とコスト

| 観点 | 内容 |
| --- | --- |
| 初回価値 | Form 再回答 = profile 更新の正規ルートを成立させる（不変条件 #7 / 03-data-fetching.md） |
| 払わないコスト | profile 編集 UI、既存 response 上書き、ruleConsent 旧名持ち込み |
| 残余リスク | Forms quota、cron 過剰 write、cursor 失念 |

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | Form 再回答を更新ルートに昇格させて UI 編集レス化 | PASS |
| 実現性 | cron */15 + 無料枠で成立 | PASS |
| 整合性 | 03a / 04* / 07* と責務境界が衝突しない | PASS |
| 運用性 | 失敗時 retry / 排他 lock / cursor 永続化で復旧可能 | PASS |
