# 03b-parallel-forms-response-sync-and-current-response-resolver - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | forms-response-sync-and-current-response-resolver |
| ディレクトリ | docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver |
| Wave | 3 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | sync |
| 状態 | Phase 12 completed / Phase 13 blocked_user_approval |
| タスク種別 | implementation_non_visual |

## purpose

`forms.responses.list` で実フォームの全 response を D1 へ同期し、stableKey 経由で field 値を解決する。同一メールの再回答を `current_response_id` で切替、`publicConsent` / `rulesConsent` の snapshot を `member_status` に反映する。`responseEmail` を system field として保存し、unknown field は `extraFields` と `schema_diff_queue` の双方に積む。

## scope in / out

### scope in
- `forms.responses.list` 実行（cursor pagination 対応、cron 15 分毎 + 手動）
- `member_responses` / `response_sections` / `response_fields` への upsert（`responseId` ベース）
- stableKey 経由 answer 正規化（`answersByStableKey` + `rawAnswersByQuestionId` 両方残す）
- `responseEmail` を system field として `member_responses.response_email` に保存
- `member_identities` upsert（`response_email` 主キー）
- current response 選定（`submittedAt` 最新を `current_response_id` に設定）
- unknown field を `response_fields.stable_key='__extra__:<questionId>'` の extra row と `schema_diff_queue` 両方に投入
- `member_status` への consent snapshot 反映（`publicConsent` / `rulesConsent` を current response から）
- `POST /admin/sync/responses` の job 関数
- `sync_jobs` ledger 書き込み（job_type=response_sync）

### scope out
- schema sync 本体（03a に分離）
- 個別会員の current_response 手動切替 UI（admin 04c）
- profile 本文編集（不変条件 #4 で禁止）
- delete request 処理（04b の API 担当）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 02a-parallel-member-identity-status-and-response-repository | members / identities / status / responses / sections / fields / extraFields の repository を使う |
| 上流 | 02b-parallel-meeting-tag-queue-and-schema-diff-repository | `schema_questions` を引いて stableKey 解決、`schema_diff_queue` に unknown 投入 |
| 上流 | 01b-parallel-zod-view-models-and-google-forms-api-client | `googleFormsClient.listResponses(formId, cursor)` を使う |
| 下流 | 04a-parallel-public-directory-api-endpoints | current_response + member_status を view model 化 |
| 下流 | 04b-parallel-member-self-service-api-endpoints | `/me/profile` で current_response を読む |
| 下流 | 04c-parallel-admin-backoffice-api-endpoints | `POST /admin/sync/responses` を expose |
| 下流 | 07a-parallel-tag-assignment-queue-resolve-workflow | response 更新後に tag queue を起動 |
| 下流 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow | 削除済みの除外条件で current_response を参照 |
| 並列 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | 同 Wave で独立、sync_jobs lock を共有 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | 31 項目 / system fields / consent / publicConsent / rulesConsent |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | response sync flow / current response 選定 / consent snapshot |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | cron */15 / sync_jobs |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | 順序 |
| 参考 | .claude/skills/aiworkflow-requirements/references/database-schema.md | テーブル構造 |
| 参考 | .claude/skills/aiworkflow-requirements/references/security-api.md | rulesConsent と auth gate 関係 |

## AC

- AC-1: 同一メール (`responseEmail`) の再回答で `member_identities.current_response_id` が最新 `submittedAt` を持つ response に切り替わる
- AC-2: unknown field（stableKey 未割当）が `response_fields.stable_key='__extra__:<questionId>'` の extra row に保存され、同 question_id が `schema_diff_queue` にも 1 件 enqueue される（重複 enqueue は no-op）
- AC-3: current response の `publicConsent` / `rulesConsent` の正規化値（`consented` / `declined` / `unknown`）が `member_status.public_consent` / `rules_consent` に反映される
- AC-4: `responseEmail` は `member_responses.response_email` に保存される（form field として `response_fields` に重複保存しない）
- AC-5: `POST /admin/sync/responses` で cursor を指定可能、初回は full sync、以降は差分 sync
- AC-6: 同種 job 排他: 既に `running` の response_sync があれば新規実行は 409 Conflict
- AC-7: `responseId` と `memberId` は型レベルで混同されない（`type ResponseId = Brand<string,'ResponseId'>` と `MemberId`）
- AC-8: 旧 `ruleConsent` 文字列が API / DB / コードに登場しない（lint で検出、入力時に `rulesConsent` へ正規化）
- AC-9: 退会済み (`is_deleted=true`) の identity は consent snapshot 更新を skip
- AC-10: cron 15 分毎の起動で D1 write が無料枠内（per sync write 上限を runbook に記載）

## 13 phases

| Phase | 名称 | ファイル | 状態 | 概要 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | true issue / scope / 4条件 / AC ドラフト |
| 2 | 設計 | phase-02.md | completed | Mermaid / module / sync_jobs lock / consent snapshot |
| 3 | 設計レビュー | phase-03.md | completed | alternative 4 案 / PASS-MINOR-MAJOR |
| 4 | テスト戦略 | phase-04.md | completed | unit / contract / E2E / authz |
| 5 | 実装ランブック | phase-05.md | completed | runbook + 擬似コード + sanity check |
| 6 | 異常系検証 | phase-06.md | completed | 401 / 403 / 422 / 5xx / cursor 失敗 / 二重起動 |
| 7 | AC マトリクス | phase-07.md | completed | AC-1〜AC-10 |
| 8 | DRY 化 | phase-08.md | completed | 03a 共通モジュールとの整理 |
| 9 | 品質保証 | phase-09.md | completed | 無料枠 / secret hygiene / a11y |
| 10 | 最終レビュー | phase-10.md | completed | GO / NO-GO |
| 11 | 手動 smoke | phase-11.md | completed | curl / wrangler / cursor 動作 |
| 12 | ドキュメント更新 | phase-12.md | completed | 6 成果物 |
| 13 | PR 作成 | phase-13.md | blocked_user_approval | 承認後 PR |

## outputs

- `outputs/phase-01/main.md` 〜 `outputs/phase-13/main.md`
- `outputs/phase-02/sync-flow.mermaid`
- `outputs/phase-04/test-matrix.md`
- `outputs/phase-05/sync-runbook.md` + `outputs/phase-05/pseudocode.md`
- `outputs/phase-06/failure-cases.md`
- `outputs/phase-07/ac-matrix.md`
- `outputs/phase-09/free-tier-estimate.md` + `outputs/phase-09/secret-hygiene.md`
- `outputs/phase-11/manual-evidence.md`
- `outputs/phase-12/implementation-guide.md` ほか 6 成果物
- `outputs/phase-13/change-summary.md` + `outputs/phase-13/local-check-result.md`

## services / secrets

| サービス | 用途 |
| --- | --- |
| Google Forms API | `forms.responses.list` 実行 |
| Cloudflare D1 | `member_responses` / `response_sections` / `response_fields` / `member_identities` / `member_status` / `schema_diff_queue` / `sync_jobs` |
| Cloudflare Workers (apps/api) | sync ジョブ実行 |
| Cloudflare Workers Cron | 15 分毎 trigger |

| secret 名 | 配置先 | 用途 |
| --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Cloudflare Secrets | サービスアカウント |
| `GOOGLE_PRIVATE_KEY` | Cloudflare Secrets | サービスアカウント |
| `GOOGLE_FORM_ID` | Cloudflare Secrets | formId |

## invariants touched

- #1（schema 固定禁止）— stableKey 解決は 03a の schema_questions テーブル参照に統一
- #2（consent キーは `publicConsent` / `rulesConsent`）— 旧 `ruleConsent` を入力時点で正規化、内部に持ち込まない
- #3（`responseEmail` は system field）— `member_responses.response_email` に保存、form field として扱わない
- #4（profile 本文は D1 override で編集しない）— 同期は新 response の追加のみで、既存 response 本文を上書きしない
- #5（apps/web → D1 直接禁止）— 同期は apps/api 内で完結
- #6（GAS prototype 非昇格）— 同期は Forms API + Workers
- #7（responseId と memberId 混同禁止）— 型 brand で物理分離
- #10（無料枠）— cron 15 分 = 96 回/日、 1 回 write 上限を runbook で制限
- #14（schema 集約）— unknown field は schema_diff_queue 経由で集約

## completion definition

- 全 13 phase の status が `completed`
- AC-1〜AC-10 が Phase 7 / 10 で完全トレース
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 12 の 6 成果物が生成済み
- Phase 13 はユーザー承認まで blocked

## 関連リンク

- 上位 README: ../README.md
- 設計書: ../_design/phase-2-design.md（Wave 3b 詳細）
- 共通テンプレ: ../_templates/phase-template-app.md
- 並列タスク: ../03a-parallel-forms-schema-sync-and-stablekey-alias-queue/
- 下流: ../04a / ../04b / ../04c / ../07a / ../07c
