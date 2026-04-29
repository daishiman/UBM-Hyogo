# 03a-parallel-forms-schema-sync-and-stablekey-alias-queue - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | forms-schema-sync-and-stablekey-alias-queue |
| ディレクトリ | docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue |
| Wave | 3 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | sync |
| 状態 | phase-12-completed / phase-13-user-approval-required |
| タスク種別 | spec_created |

## purpose

`forms.get` で実フォーム（formId=`119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`、31 項目・6 セクション）の live schema を D1 へ同期し、`stableKey` 未割当 question を `schema_diff_queue` に積む。`stableKey` 直書きをコードから排除し、alias 解決ロジックを通して `schema_questions` を更新する。

## scope in / out

### scope in
- `forms.get` 実行（Google Forms API、サービスアカウント認証）
- `schema_versions` / `schema_questions` への upsert（revisionId / schemaHash 基準）
- 31 項目・6 セクションの flatten と stableKey resolve
- `stableKey` 未割当 question を `schema_diff_queue` に登録（diff種別: `added` / `changed` / `removed` / `unresolved`）
- alias 解決ロジック（`schema_questions.stableKey` を alias テーブル経由で更新）
- `POST /admin/sync/schema` の job 関数（手動同期 entry point）
- cron からの起動 entry point（1 日 1 回）
- sync_jobs への job ledger 書き込み（status: `running` / `succeeded` / `failed`）

### scope out
- response sync 本体（03b に分離）
- alias の admin UI 割当 workflow（07b に分離）
- `/admin/schema` 画面実装（06c に分離）
- `forms.responses.list` の呼び出し
- D1 schema migration 自体（01a に既出）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 02a-parallel-member-identity-status-and-response-repository | members repo は schema sync が触らないが、AC test で fixture 共有 |
| 上流 | 02b-parallel-meeting-tag-queue-and-schema-diff-repository | `schema_versions` / `schema_questions` / `schema_diff_queue` の repository を使う |
| 上流 | 01b-parallel-zod-view-models-and-google-forms-api-client | `forms.get` wrapper を使う |
| 下流 | 04c-parallel-admin-backoffice-api-endpoints | `POST /admin/sync/schema` を expose |
| 下流 | 07b-parallel-schema-diff-alias-assignment-workflow | `schema_diff_queue` の resolve を行う |
| 並列 | 03b-parallel-forms-response-sync-and-current-response-resolver | 同 Wave で独立実行可能（schema と response を分離） |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references-hyogo/api-endpoints.md | `POST /admin/sync/schema` contract |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-implementation-core.md | schema_versions / schema_questions / schema_diff_queue / sync_jobs |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | cron schedule / Worker 運用 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | Google Forms service account / formId |
| 参考 | packages/integrations/google/src/forms/mapper.ts | 31 項目 stableKey label map |

## AC

- AC-1: `forms.get` の取得結果から 31 項目・6 セクションが `schema_versions` / `schema_questions` に保存される（item count / section count を quantitative に検証）
- AC-2: 新規 question（既知 stableKey マッピング外）は `schema_diff_queue` に `unresolved` として 1 件 = 1 row で積まれる
- AC-3: alias 解決後（外部 workflow 07b 経由）に `schema_questions.stableKey` が更新され、次回 sync で `unresolved` 件数が 0 に減ること
- AC-4: 同一 `revisionId` の再実行は no-op（schema_versions に重複 row を作らない）
- AC-5: `POST /admin/sync/schema` 実行時に `sync_jobs` へ `running` → `succeeded`（or `failed`）遷移が記録される
- AC-6: 同種 job が `running` のとき新規実行は 409 Conflict で拒否される
- AC-7: コードに stableKey 文字列リテラルを直書きしない（lint rule 経由で検出）
- AC-8: cron 1 日 1 回起動で stableKey 既知 31 項目に欠落がないことを assertion test で確認

## 13 phases

| Phase | 名称 | ファイル | 状態 | 概要 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | true issue / scope / 4条件 / AC ドラフト |
| 2 | 設計 | phase-02.md | completed | Mermaid flow / module 配置 / dependency matrix / env |
| 3 | 設計レビュー | phase-03.md | completed | alternative 3 案 / PASS-MINOR-MAJOR |
| 4 | テスト戦略 | phase-04.md | completed | unit / contract / E2E / authorization 設計 |
| 5 | 実装ランブック | phase-05.md | completed | runbook + 擬似コード + sanity check |
| 6 | 異常系検証 | phase-06.md | completed | 401 / 403 / 422 / 5xx / sync 失敗 / 部分失敗 |
| 7 | AC マトリクス | phase-07.md | completed | Phase 1 AC × Phase 4 検証 × Phase 5 実装 |
| 8 | DRY 化 | phase-08.md | completed | 命名・型・path / endpoint の正規化 |
| 9 | 品質保証 | phase-09.md | completed | 無料枠 / secret hygiene / a11y |
| 10 | 最終レビュー | phase-10.md | completed | GO / NO-GO 判定 / blocker |
| 11 | 手動 smoke | phase-11.md | completed | curl / wrangler / forms.get 結果 evidence |
| 12 | ドキュメント更新 | phase-12.md | completed | implementation-guide ほか 6 成果物 |
| 13 | PR 作成 | phase-13.md | pending | ユーザー明示承認まで blocked |

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
| Google Forms API | `forms.get` 実行 |
| Cloudflare D1 | `schema_versions` / `schema_questions` / `schema_diff_queue` / `sync_jobs` 永続化 |
| Cloudflare Workers (apps/api) | sync ジョブ実行コンテナ |
| Cloudflare Workers Cron | 1 日 1 回 schema sync trigger |

| secret 名 | 配置先 | 用途 |
| --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Cloudflare Secrets (api) | サービスアカウント email |
| `GOOGLE_PRIVATE_KEY` | Cloudflare Secrets (api) | サービスアカウント private key |
| `GOOGLE_FORM_ID` | Cloudflare Secrets (api) | formId（非機密だが secret 配置で運用統一） |

## invariants touched

- #1（実フォーム schema をコードに固定しすぎない）— stableKey 直書き禁止 / alias 経由更新で吸収
- #5（apps/web から D1 直接アクセス禁止）— sync は apps/api 配下のみで完結
- #6（GAS prototype を本番仕様に昇格させない）— 同期は GAS でなく Forms API
- #7（responseId と memberId を混同しない）— 本タスクは schema 同期のみで responseId に触れない
- #10（Cloudflare 無料枠内）— sync 実行頻度を 1 日 1 回に絞り、retry を制限
- #14（schema 変更は /admin/schema に集約）— 本タスクが diff 検出 / queue 投入の起点

## completion definition

- 全 13 phase の status が `completed`（artifacts.json と一致）
- AC-1〜AC-8 が Phase 7 / 10 で完全トレース
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が全 PASS
- Phase 12 の 6 成果物が生成済み
- Phase 13 はユーザー承認まで blocked

## 関連リンク

- 上位 README: ../README.md
- 設計書: ../_design/phase-2-design.md（Wave 3a 詳細仕様）
- 共通テンプレ: ../_templates/phase-template-app.md
- 並列タスク: ../03b-parallel-forms-response-sync-and-current-response-resolver/
- 下流タスク: ../04c-parallel-admin-backoffice-api-endpoints/, ../07b-parallel-schema-diff-alias-assignment-workflow/
