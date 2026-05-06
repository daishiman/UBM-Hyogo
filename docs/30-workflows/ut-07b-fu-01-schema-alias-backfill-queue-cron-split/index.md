# ut-07b-fu-01-schema-alias-backfill-queue-cron-split - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | UT-07B-FU-01 schema alias back-fill queue/cron split |
| GitHub Issue | #361（CLOSED 維持 / 再 OPEN しない / PR 文面は `Refs #361`） |
| 親タスク | ut-07b-schema-alias-hardening |
| 起票元 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md` |
| 検出仕様書 | Issue #361 body（unassigned-task formalization） |
| 作成日 | 2026-05-05 |
| ステータス | implemented-local（staging deploy / production apply / PR は user-gated） |
| 総 Phase 数 | 13 |
| taskType | implementation（条件付き：staging 10,000+ rows evidence で着手判断） |
| visualEvidence | NON_VISUAL |
| Wave | 2（親タスク完了後） |
| 優先度 | MEDIUM |
| 見積もり規模 | 中規模（Cloudflare Queue/Cron binding + workflow 分離 + idempotent batch + staging 実測） |

---

## 実装区分

`[実装区分: 実装仕様書]`

判定根拠: 本タスクは Cloudflare Queue binding 追加、`apps/api/src/workflows/schemaAliasBackfillBatch.ts` / `schemaAliasEnqueue.ts` の workflow 分離、API response contract の `confirmed` / `backfill.status` 分離、batch continuation 実装、route / workflow tests の追加を伴う。今回サイクルではユーザー指示により docs-only ラベルより実態を優先し、implemented-local としてコード・仕様・成果物を同期する。staging deploy / Cloudflare Queue 作成 / production migration apply / commit / push / PR は未実行で user-gated。

Phase 11 境界:
- local implementation GO: ユーザー明示のレビュー実行により今回サイクルで実装まで進める。
- runtime evidence: staging 10,000+ rows fixture / Cloudflare Queue 作成 / deploy 後 after evidence は未実行。Phase 13 以降の user-gated runtime cycle で取得する。
- runtime NO-GO が後続で判明した場合は Queue binding / migration apply を進めず、実装差分を別判断で撤回または dormant 化する。

---

## 目的

UT-07B schema alias hardening 完了後に残された条件付き follow-up を運用可能な形に正本化する。具体的には、staging 10,000+ rows evidence で `backfill_cpu_budget_exhausted` が持続する場合に、schema alias back-fill を「単発 API 同期処理」から「Cloudflare Queue または Cron Trigger 駆動の再開可能な batch 処理」に分離するための実装仕様を確定する。

alias 確定（API request 内で完了）と back-fill 継続（queue/cron で残件処理）を責務分離し、idempotent remaining-scan model を維持しつつ、API response から `confirmed` と `backfill.status` を区別できる契約まで実装する。

---

## スコープ

### 含む

- `schema_aliases` / `schema_diff_queue` / back-fill 状態管理の現行契約確認
- staging 10,000+ rows fixture 設計と実測 evidence 契約（runtime 実測は user-gated）
- Cloudflare Queue による back-fill batch continuation の設計と local 実装
- `apps/api/src/workflows/schemaAliasBackfillBatch.ts` / `schemaAliasEnqueue.ts` による workflow 分離（alias 確定 + job enqueue / batch consumer）
- apply API response の `confirmed`（alias 確定）と `backfill.status`（pending/running/exhausted/completed）への分離
- Cloudflare Workers binding 追加（`wrangler.toml` / staging / production）と CI variables / runbook 同期
- batch idempotent retry / duplicate enqueue 防止 / partial failure recovery を網羅する route / workflow / repository test 追加
- local tests と Phase 12 ドキュメント・aiworkflow-requirements 同期。staging before/after evidence は user-gated runtime cycle に残す

### 含まない

- staging 10,000+ rows fixture で CPU budget exhaustion が持続しない場合の実装着手（着手 gate 不成立で close）
- 管理 UI の retry label / progress UI 追加（UT-07B-FU-02 へ分離済み）
- production migration apply の承認ゲート実行（UT-07B-FU-03 / FU-04 へ分離済み）
- 無関係な schema diff recommendation algorithm 改修
- 真 cursor semantics の導入（remaining-scan model で十分。evidence 上必要になった場合のみ別タスク化）

---

## 受入条件（AC）

- AC-1: Phase 11 に local implementation GO と runtime evidence pending の境界が保存され、staging 10,000+ rows fixture と既存 API（dryRun/apply/retry）の before evidence は user-gated runtime cycle に残っている
- AC-2: 着手 gate 成立時、Cloudflare Queue または Cron Trigger のいずれを採用するかの設計判断が Phase 2 で根拠付き決定されている（trade-off 表）
- AC-3: 着手 gate 成立時、alias 確定と back-fill 継続の状態が API request 内 / queue/cron consumer 内に責務分離されている
- AC-4: 着手 gate 成立時、API response が `confirmed: true` と `backfill.status: pending|running|exhausted|completed` を区別して返す契約に統一されている
- AC-5: 着手 gate 成立時、batch 処理が remaining-scan model + idempotent update で実装され、duplicate enqueue / duplicate processing / partial failure recovery が test で固定されている
- AC-6: Cloudflare Queue binding が `wrangler.toml` で staging / production 一致し、Queue/DLQ 作成・deploy・rollback は user-gated runtime cycle の運用境界として記録されている
- AC-7: route / workflow / repository tests が PASS し、idempotent retry / duplicate enqueue 抑止 / partial failure recovery / batch size boundary を網羅している
- AC-8: staging 10,000+ rows after evidence は runtime pending として明記され、PASS と誤記していない
- AC-9: 不変条件 #5（D1 直接アクセスは apps/api 限定）違反ゼロ。queue consumer / cron handler すべて `apps/api/**` 配下に閉じる
- AC-10: 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き
- AC-11: Phase 12 で 7 必須成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / main）と aiworkflow-requirements（api-endpoints / database-schema / task-workflow-active / indexes）が同期されている

---

## Phase 一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | spec_created |
| 2 | 設計（Queue vs Cron / batch contract / remaining-scan model） | [phase-02.md](phase-02.md) | spec_created |
| 3 | 設計レビューゲート | [phase-03.md](phase-03.md) | spec_created |
| 4 | 検証戦略 | [phase-04.md](phase-04.md) | spec_created |
| 5 | 仕様 runbook 作成（binding 追加 / Queue 設定 / response contract） | [phase-05.md](phase-05.md) | completed |
| 6 | 異常系（duplicate enqueue / partial failure recovery / batch boundary） | [phase-06.md](phase-06.md) | completed |
| 7 | AC マトリクス | [phase-07.md](phase-07.md) | completed |
| 8 | DRY 化 / 仕様間整合 | [phase-08.md](phase-08.md) | completed |
| 9 | 品質保証 | [phase-09.md](phase-09.md) | completed |
| 10 | 最終レビューゲート（着手 gate 含む） | [phase-10.md](phase-10.md) | completed |
| 11 | 手動検証（NON_VISUAL 縮約 + staging 10,000+ rows before/after evidence） | [phase-11.md](phase-11.md) | blocked_runtime_evidence |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | completed |
| 13 | PR 作成 | [phase-13.md](phase-13.md) | spec_created |

---

## 実行フロー

```
Phase 1 → Phase 2 → Phase 3 (Gate) → Phase 4 → Phase 5 → Phase 6 → Phase 7
                         ↓                                      ↓
                    (MAJOR→戻り)                           (未達→戻り)
                         ↓                                      ↓
Phase 8 → Phase 9 → Phase 10 (Gate) → Phase 11 (着手 gate) → Phase 12 → Phase 13 → 完了
                                              ↓
                                      (gate 不成立→close as not-needed)
```

Phase 11 で staging 10,000+ rows evidence による着手 gate を判定する。gate 不成立の場合、Phase 12 で「実装不要」evidence と判断理由を記録して close する（仕様書は spec_created のまま据え置き、CPU budget exhaustion が再発した時点で本仕様書を再起動する）。

---

## 不変条件への影響

| # | 不変条件 | 本タスクの取り扱い |
| --- | --- | --- |
| 1 | 実フォーム schema をコードに固定しすぎない | 既存 `__extra__:<questionId>` alias 取り扱いを維持。新規ハードコードなし |
| 4 | admin-managed data はフォーム外として分離 | alias / stableKey 編集は admin operation。既存方針を維持 |
| 5 | D1 への直接アクセスは `apps/api` に閉じる | **本タスクの中心制約**。Queue consumer / Cron handler すべて apps/api 内で完結。`apps/web` からの D1 binding 直接参照を発生させない |
| 7 | MVP では Google Form 再回答を本人更新の正式な経路とする | 影響なし。本タスクは admin schema alias workflow 内に閉じる |

---

## 主要参照

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Issue #361 body | 起票仕様（source of truth）。CLOSED 状態維持 |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md` | 検出根拠（条件付き follow-up） |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md` | 親タスク完了状態 / retryable contract / 実 DB 差分吸収方針 |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-11/main.md` | NON_VISUAL evidence template |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-11/manual-evidence.md` | staging deferred evidence 形式 |
| 必須 | `apps/api/src/workflows/schemaAliasAssign.ts` | 現行 alias 確定 / back-fill / CPU budget 処理 |
| 必須 | `apps/api/src/routes/admin/schema.ts` | dryRun / apply / retryable failure 境界 |
| 必須 | `apps/api/src/repository/schemaAliases.ts` | alias write target |
| 必須 | `apps/api/src/repository/schemaDiffQueue.ts` | back-fill 残件管理 |
| 必須 | `apps/api/wrangler.toml` | Cloudflare binding（Queue / Cron / KV） |
| 参考 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | API contract 正本 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | D1 schema 正本 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | workflow 一覧 |

---

## 注意事項

- **Issue #361 は CLOSED のまま再 OPEN しない**。本タスクは「条件付き未タスク仕様書化」であり、PR 文面でも `Closes #361` は使わず `Refs #361` を用いる。close 主導はしない。
- **着手 gate を Phase 11 で判定**する。staging 10,000+ rows evidence なしに Phase 5 以降の実装に着手しないこと。Phase 1-4 / 7-10 は仕様書整備として先行可能。
- 実装着手時のコミット / push / PR 作成は Phase 13 で user_approval 必須。
- Cursor semantics は現行の idempotent remaining-scan model を優先し、実 cursor は evidence 上必要になった場合のみ別タスク化する。
- Cloudflare Queue / Cron どちらを採用するかは Phase 2 で trade-off 表に基づき決定する。binding drift 防止のため staging / production / CI variables / runbook を同一 wave で同期する。

---

## Decision Log

- 2026-05-05: Issue #361 CLOSED 状態維持を確認。本仕様書は spec_created として作成し、PR 文面でも `Closes #361` を使わず `Refs #361` を採用する。
- 2026-05-05: taskType = implementation（条件付き）。docs-only ではなく Cloudflare Queue/Cron binding + workflow 分離 + batch consumer の実コード追加を伴う。visualEvidence = NON_VISUAL（admin API + DB + Workers binding 系で UI 追加なし）。
- 2026-05-05: 着手 gate 判定を Phase 11 に置く。Phase 10 の GO は `design-ready` のみを意味し、implementation GO / NO-GO / staging-deferred は Phase 11 `gate-decision.md` だけが確定する。Phase 1-4 / 7-10 は先行整備、Phase 5-6 / 11-13 は gate 結果に従って実行する。
- 2026-05-06: Phase 12 strict outputs と root/outputs artifacts parity を実体化。公開 API `backfill.status` 4 値と internal DB failure state を分離し、migration extension は `dedupe_key` / `failed_items_json` / `retry_count` / `last_error` + remaining-scan を正本として再固定した。
