# Phase 10: 最終レビューゲート / Go-No-Go（着手 gate 含む）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-07B-FU-01 schema alias back-fill queue/cron split |
| GitHub Issue | #361（CLOSED 維持 / `Refs #361`） |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビューゲート / Go-No-Go（着手 gate を含む） |
| 作成日 | 2026-05-05 |
| 前 Phase | 9（品質保証） |
| 次 Phase | 11（手動検証 / NON_VISUAL 縮約 + staging 10,000+ rows before/after evidence + 着手 gate 判定） |
| 状態 | spec_created |
| taskType | implementation（条件付き：staging 10,000+ rows evidence で着手判断） |
| visualEvidence | NON_VISUAL |
| 実装区分 | **実装仕様書** |

## 目的

Phase 1〜9 で蓄積した要件 / 設計（Queue vs Cron 採用判断 / batch contract / remaining-scan model / API contract `confirmed` 分離 + `backfill.status` / wrangler.toml binding / 異常系 / AC マトリクス / DRY 化 / 品質保証）の各成果物を横断レビューし、AC-1〜AC-11 すべての達成状態と 4 条件最終判定（PASS / MINOR / MAJOR）を確定する。

本 Phase は **2 つのゲート** を扱う:

1. **設計レビューゲート（spec_created → ready）**: Phase 11 着手 gate 判定 + Phase 12 ドキュメント更新 + Phase 13 PR 作成（user_approval 後）が手戻りなく実行できる粒度に仕様書が達しているか。
2. **着手 gate 判定方針（Phase 11 で実行 / 本 Phase で判定基準を確定）**: staging 10,000+ rows before evidence 結果に基づき、実装続行（GO） / 実装不要（NO-GO） / 範囲縮小（PARTIAL）のいずれを採るかの判定基準。

具体的には:

- Queue vs Cron 採用判断（Phase 2）/ 二段化 workflow（Phase 2）/ `confirmed` + `backfill.status` 分離 contract（Phase 2）の 3 軸が唯一の正本
- wrangler-runbook（Phase 5）/ 異常系（Phase 6）/ 性能検証合否基準（Phase 9）が実行可能粒度
- 不変条件 #5 違反 0 が Phase 8 / 9 で機械検証可能
- 着手 gate 判定基準（GO / NO-GO / PARTIAL）が本 Phase で明文化

これらが揃って初めて Phase 11 staging 実測 + 着手 gate 判定 + Phase 12 ドキュメント更新への引き渡しが可能となる。

---

## 実行タスク

1. **AC-1〜AC-11 達成状態評価**: 各 AC を spec_created 視点で評価する（完了条件: 全 11 件に「仕様確定」「Phase 11 で確定予定」「Phase 12 で確定予定」のいずれかが付与）。
2. **4 条件最終再評価**: 価値性 / 実現性 / 整合性 / 運用性 の 4 観点を再確定する（完了条件: PASS / MINOR / MAJOR が一意に決定、根拠付き）。
3. **設計レビューゲート判定**: 6 つの Go 条件すべての充足、または MAJOR 1 件で差し戻しを判定する（完了条件: GO / NO-GO 判定明示）。
4. **着手 gate 判定基準の確定**: Phase 11 で取得する staging 10,000+ rows before evidence 結果に基づき GO / NO-GO / PARTIAL を判断する条件を表化する（完了条件: 3 分岐の判定基準が一意・根拠付き）。
5. **レビュー観点 10 項目以上の確認**: 責務分離 / idempotent / duplicate enqueue 抑止 / partial failure recovery / response contract / Cloudflare binding drift / migration safety / aiworkflow-requirements 同期 / 不変条件 #5 / NON_VISUAL evidence 縮約適合 の 10 観点で各成果物を点検（完了条件: 10 観点すべてに PASS / MINOR / MAJOR 判定）。
6. **不変条件 #5 への影響最終チェック**: queue consumer / cron handler を含む全実装が `apps/api/**` 配下に閉じることを最終確認する（完了条件: `rg apps/web/src` での binding 参照 0 を Phase 9 結果で確定）。
7. **MAJOR 検出時の差し戻しルート確定**: 各成果物に対する差し戻し先 Phase（Phase 2 設計戻り / Phase 5 runbook 戻り）を確定する（完了条件: MAJOR 種別 × 差し戻し先表が完成）。
8. **後続タスク（follow-up）への申し送り**: UT-07B-FU-02（admin UI retry/progress）/ UT-07B-FU-03,04（production migration apply 承認ゲート）/ 監視アラート / shared 配置 の整理（完了条件: 各 follow-up に「本タスクで起票するか / 別タスクで判断するか」の判定）。
9. **open question を Phase 11 / 12 へ送り出す**: 残課題の受け皿 Phase を指定する（完了条件: 全件に受け皿明示）。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-03.md | 設計レビューゲート（base case） |
| 必須 | docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-07.md | AC マトリクス |
| 必須 | docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-08.md | DRY 化結果 |
| 必須 | docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-09.md | QA 結果 |
| 必須 | docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/index.md | AC / 不変条件 / 直交関係 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md | 親タスク完了済仕様 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md | 検出根拠 |
| 参考 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-10.md | 最終レビュー観点の参照事例 |

---

## 苦戦箇所【記入必須】

| # | 苦戦箇所 | 影響範囲 | 緩和策 |
| --- | --- | --- | --- |
| 1 | 着手 gate 判定が Phase 11 staging evidence に依存するため、Phase 10 では「判定基準を確定する」ことしかできず、GO / NO-GO 確定そのものは Phase 11 完了時点まで持ち越す。Phase 10 の GO 判定と着手 gate GO 判定を混同しないよう運用が必要 | Phase 10 / 11 | 本 Phase で「設計レビューゲート（spec_created → ready）」と「着手 gate（implementation 着手 / close）」を明確に区別。前者は本 Phase で確定、後者は基準のみ確定し判定は Phase 11 に委譲する旨を実行タスク冒頭に明示 |
| 2 | PARTIAL（Queue のみ採用 / Cron のみ採用）の場合、未採用案関連の Phase 2 / Phase 5 / Phase 6 記述をどう扱うかが曖昧になりやすい | Phase 10 / 11 / 12 | 本 Phase の「MAJOR 検出時の差し戻しルート」内で PARTIAL 確定時の縮約手順（未採用案を Decision Log に link 参照のみ残す）を Phase 12 への引き渡し条件として明文化 |
| 3 | NO-GO（実装不要 close）の場合、本タスクの仕様書群（Phase 1-13）を spec_created のまま据え置く運用ルールが必要だが、Phase 10 で確定しないと Phase 11 evidence 後に判断基準が散逸 | Phase 10 / 11 / 12 | 本 Phase の「Phase 11 / 12 / 13 引き渡し条件」内で NO-GO 確定時の「Phase 12 で `unassigned-task-detection.md` に実装不要 evidence を記録、artifacts.json は spec_created のまま据え置き、Issue #361 は CLOSED 維持」運用を明記 |

---

## Go / No-Go 判定マトリクス（AC × 達成状態）

> **評価基準**: implementation / spec_created 段階のため、「契約文書 + コード設計が完備し、Phase 11 staging 実測 + 着手 gate 判定 + Phase 12 ドキュメント更新 + Phase 13 PR 作成（user_approval 後）が手戻りなく実行できる粒度」で判定する。

| AC | 内容 | 達成状態（spec_created 時点） | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | staging 10,000+ rows fixture と既存 API の before evidence | Phase 11 で確定予定 | `outputs/phase-11/before-evidence.md` | 引き渡し |
| AC-2 | Queue vs Cron 採用判断が trade-off 表で根拠付き | 仕様確定 | `outputs/phase-02/queue-vs-cron-decision.md` | PASS |
| AC-3 | alias 確定と back-fill 継続の責務分離 | 仕様確定 | `outputs/phase-02/workflow-split-design.md` | PASS |
| AC-4 | API response が `confirmed` と `backfill.status` を区別 | 仕様確定（HTTP 4 ケース） | `outputs/phase-02/api-contract-design.md` | PASS |
| AC-5 | remaining-scan + idempotent update で batch 処理 | 仕様確定 | `outputs/phase-02/workflow-split-design.md` | PASS |
| AC-6 | Cloudflare binding が staging/production/CI/runbook で一致 | 仕様確定（Phase 5 wrangler-runbook） | `outputs/phase-05/wrangler-runbook.md` + `apps/api/wrangler.toml` | PASS（Phase 11 で実機確認） |
| AC-7 | route/workflow/repository tests が duplicate/partial failure を網羅 | 仕様確定（Phase 4 検証戦略 + Phase 9 単体検証コマンド） | Phase 4 / Phase 9 | PASS（Phase 11 で実行 PASS 確認） |
| AC-8 | staging after evidence で CPU budget exhaustion 収束 | Phase 11 で確定予定 | `outputs/phase-11/after-evidence.md` | 引き渡し |
| AC-9 | 不変条件 #5 違反 0 | 仕様確定（Phase 9 で `rg apps/web/src` 0 件方針確認） | 本 Phase + Phase 9 main.md | PASS |
| AC-10 | 4 条件評価が全 PASS | 本 Phase では **design-ready** まで確定。implementation GO は Phase 11 gate のみが判定 | 下記 4 条件最終再評価 | PASS（設計） |
| AC-11 | Phase 12 で 7 必須成果物 + aiworkflow-requirements 同期 | Phase 12 で確定予定 | `outputs/phase-12/*.md` | 引き渡し |

---

## 4 条件最終再評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | Queue / Cron 駆動の二段化により CPU budget exhaustion を運用上収束可能、`confirmed` 分離で admin UI / 運用者の retry 判断が明確化、staging 10,000+ rows before/after evidence で着手 gate を客観判定可能。親タスク 07b の cursor 方式を拡張する位置付け |
| 実現性 | PASS | wrangler.toml への Queue / Cron binding 追加 + 二段化 refactor + 共通 helper 集約 + test 追加で完結。新規ツール導入なし。着手 gate が GO の場合のみ実装着手するため不要な実装コストは発生しない |
| 整合性 | PASS | 不変条件 #5 を侵さない（queue consumer / cron handler すべて apps/api 内）。親タスク 07b 完了済仕様の上書きなし（cursor 方式を継続採用）。UT-07B-FU-02 / FU-03,04 / 監視 follow-up の責務に踏み込まない。Phase 8 DRY 化で値ドメイン / SQL / 命名規約の単一正本化済み |
| 運用性 | PASS | wrangler-runbook（Phase 5）で binding 適用手順、異常系（Phase 6）で duplicate enqueue / partial failure recovery、性能検証（Phase 9）で staging 実測合否基準が確定。着手 gate により「実装不要」evidence を残せばクローズアウトも運用可能 |

**最終判定: design-ready（4 条件は設計仕様として PASS。implementation GO は Phase 11 `gate-decision.md` でのみ確定）**

---

## 設計レビューゲート判定基準

### Go 条件（6 件すべて満たすこと）

- [x] **Queue vs Cron 採用判断確定**: trade-off 表 + 採用案 + 未採用案の Decision Log 記述が Phase 2 で唯一の正本
- [x] **二段化 workflow 確定**: alias 確定（Stage 1）+ back-fill 継続（Stage 2 / queue consumer or cron handler）の責務分離が Phase 2 で記述、共通 helper 集約先（`apps/api/src/repository/schemaDiffQueue.ts`）が Phase 8 で確定
- [x] **API contract 確定**: HTTP 4 ケース（200 confirmed / 202 running / 202 exhausted / 409 / 422）+ `confirmed` / `backfill.status` 4 値 + failure code 3 種が Phase 2 で記述、route test 観点が Phase 4 / Phase 9 で確定
- [x] **wrangler-runbook 確定**: Queue / Cron binding 追加手順 + staging / production / CI variables 一致確認が Phase 5 で記述
- [x] **不変条件 #5 遵守**: queue consumer / cron handler / repository / workflow / route すべて apps/api 内、`rg apps/web/src` で binding 参照 0 件方針を Phase 9 で機械検証可能
- [x] **AC × 成果物トレース完備**: AC-1〜AC-11 が Phase 9 トレーサビリティ表で空セル 0、Phase 11 / 12 で確定予定の 4 件（AC-1 / AC-8 / AC-10 / AC-11）も引き渡し条件明示

### No-Go 条件（いずれか 1 つでも MAJOR で差し戻し）

| MAJOR 条件 | 差し戻し先 |
| --- | --- |
| Queue vs Cron 採用判断が両案併記のまま | Phase 2（queue-vs-cron-decision.md） |
| 二段化 workflow の責務分離が曖昧（共通 helper 集約先が未定） | Phase 2（workflow-split-design.md） |
| API contract（HTTP 4 ケース or `confirmed`/`backfill.status` 分離 or failure code）が抜ける | Phase 2（api-contract-design.md） |
| wrangler-runbook が staging / production / CI variables 不一致 or 適用手順未確定 | Phase 5（wrangler-runbook.md） |
| 不変条件 #5 違反検出 | Phase 2 / Phase 8（設計と DRY 化双方） |
| 親タスク 07b 完了済仕様への上書き / 全文転記が残る | Phase 8（main.md） |
| queue consumer / cron handler のローカル検証戦略が未確定 | Phase 5 / Phase 9 |
| queue message に PII が含まれる設計 | Phase 2（api-contract-design.md）+ Phase 9 セキュリティ確認 |

**判定: GO（6 件すべて充足、MAJOR 0 件）**

---

## 着手 gate 判定方針（Phase 11 で実行）

### 判定基準（3 分岐）

| 判定 | 条件（staging 10,000+ rows before evidence） | アクション |
| --- | --- | --- |
| **GO（実装続行）** | `backfill_cpu_budget_exhausted` が 10,000+ rows fixture で複数回・継続的に再現（3 回以上の連続再現 or 50%+ apply 試行で発生） | Phase 5-6 / Phase 11 after evidence / Phase 12 / Phase 13 PR 作成（user_approval 後）を順次実行 |
| **NO-GO（実装不要 close）** | 既存 retry で運用上収束（apply 1-3 回内で `backfill.status='completed'` 到達）、または 10,000+ rows でも CPU budget exhaustion が再現せず | Phase 12 で `unassigned-task-detection.md` に「実装不要」evidence + 判断理由を記録、artifacts.json は spec_created のまま据え置き、Issue #361 は CLOSED 維持。本仕様書は CPU budget exhaustion 再発時に再起動可能 |
| **PARTIAL（範囲縮小）** | Queue / Cron のいずれか一方のみで運用上収束する見込みが evidence から判断可能（例: cron 5 分間隔で十分 / queue は不要 等） | 採用案のみ Phase 5-6 で実装、未採用案関連の Phase 2 / Phase 5 / Phase 6 記述を Decision Log に link 参照のみ残し本文から縮約。Phase 12 で縮約結果を記録 |

### Phase 11 before evidence 取得計画

- staging 環境で `response_fields` 10,000 / 15,000 / 20,000 行 fixture を投入
- 既存 API（`POST /admin/schema/aliases/dryRun`、`apply`、retry 経路）を順次実行
- 計測軸: apply 試行回数、`backfill_cpu_budget_exhausted` 発生率、`backfill.status` 推移、wallclock、Workers CPU time
- 計測結果を `outputs/phase-11/before-evidence.md` に記録
- 上記 3 分岐の判定基準と照合し、結論を `outputs/phase-11/main.md` に記録

### NO-GO / PARTIAL 確定時の Issue #361 / 仕様書取り扱い

- Issue #361 は CLOSED のまま維持（再 OPEN しない）
- artifacts.json の `phases[*].status` は `spec_created` のまま据え置き
- Phase 12 で `unassigned-task-detection.md` に判定 evidence を記録し、Phase 13 PR 文面でも `Refs #361` を採用
- CPU budget exhaustion が将来再発した場合は本仕様書を再起動

---

## レビュー観点 10 項目（成果物点検）

| # | 観点 | 確認内容 | 判定 |
| --- | --- | --- | --- |
| 1 | 責務分離 | alias 確定（Stage 1）と back-fill 継続（Stage 2）が route / workflow / consumer / cron で重複しない | PASS |
| 2 | idempotent | remaining-scan SQL + idempotent update helper で重複処理 0、duplicate write 0 | PASS |
| 3 | duplicate enqueue 抑止 | 同一 `revisionId` + `batchId` で 2 度 enqueue されても consumer が no-op で吸収 | PASS（Phase 6 異常系） |
| 4 | partial failure recovery | consumer 中途例外 → message retry → 次回処理で remaining 残件のみ | PASS（Phase 6 異常系） |
| 5 | response contract | HTTP 4 ケース + `confirmed` / `backfill.status` 4 値 + failure code 3 種が単一正本 | PASS（Phase 2） |
| 6 | Cloudflare binding drift | wrangler.toml staging / production / CI variables / runbook 一致 | PASS（Phase 5） |
| 7 | migration safety | 親タスク 07b の `backfill_cursor` カラム / partial UNIQUE は本タスクで再 migration せず継続採用、新規 migration なし or 最小（status enum 拡張のみ） | PASS（Phase 5） |
| 8 | aiworkflow-requirements 同期 | api-endpoints / database-schema / task-workflow-active / cloudflare-bindings / indexes の差分が Phase 12 で 1 回に集約 | PASS（Phase 8 で集約済み） |
| 9 | 不変条件 #5 | queue consumer / cron handler / repository / workflow / route すべて apps/api 内 | PASS（Phase 9 で機械検証） |
| 10 | NON_VISUAL evidence 縮約適合 | screenshot 不要、`manual-evidence.md` + `before-evidence.md` + `after-evidence.md` + `link-checklist.md` を採用 | PASS（Phase 11 計画） |
| 11 | セキュリティ | queue message PII 不混入、consumer / cron auth 不要性、log PII 漏洩 0 | PASS（Phase 9） |
| 12 | 着手 gate 判定基準明文化 | GO / NO-GO / PARTIAL の 3 分岐基準が一意・根拠付き | PASS（本 Phase） |

> 12 観点すべて PASS。MAJOR / MINOR 0 件。

---

## 不変条件 #5 への影響最終チェック

| チェック項目 | 確認方法 | 結果 |
| --- | --- | --- |
| wrangler.toml binding | `apps/api/wrangler.toml` に Queue / Cron 追加 | PASS |
| queue consumer | `apps/api/src/workflows/schemaAliasBackfillBatch.ts` 配下 | PASS |
| cron handler | `apps/api/src/workflows/` 配下 or `apps/api/src/index.ts` の scheduled handler | PASS |
| repository helper | `apps/api/src/repository/schemaDiffQueue.ts` | PASS |
| workflow refactor | `apps/api/src/workflows/schemaAliasAssign.ts` | PASS |
| route layer | `apps/api/src/routes/admin/schema.ts` | PASS |
| `apps/web` から D1 / Queue binding 直接参照 | `rg "DB\|D1Database\|env\.DB\|SCHEMA_BACKFILL_QUEUE" apps/web/src` | 期待 0 件（Phase 9 / Phase 11 で実測） |
| `packages/shared` への配置 | 本タスクスコープ外（Phase 8 で follow-up 確定） | PASS |

**最終判定: 不変条件 #5 遵守、違反 0**

---

## Phase 11 / Phase 12 / Phase 13 への引き渡し条件

### Phase 11（手動検証 / NON_VISUAL 縮約 + staging 10,000+ rows before/after evidence + 着手 gate 判定）

- 本タスクは **implementation / NON_VISUAL** のため、screenshot 不要。
- 代替 evidence として以下を Phase 11 で作成:
  - `outputs/phase-11/main.md`: Phase 11 全体サマリー + 着手 gate 判定結果
  - `outputs/phase-11/before-evidence.md`: staging 10,000+ rows fixture 投入 + 既存 API による before 実測ログ（着手 gate 入力）
  - `outputs/phase-11/after-evidence.md`: 着手 gate GO 確定後の after 実測ログ（GO 時のみ作成）
  - `outputs/phase-11/manual-evidence.md`: queue consumer / cron handler の staging 動作ログ（GO 時のみ作成）
  - `outputs/phase-11/link-checklist.md`: link 検証結果
- 入力: Phase 9 性能検証合否基準 / Phase 5 wrangler-runbook / Phase 2 queue-vs-cron-decision.md / 本 Phase 着手 gate 判定基準
- 出力: AC-1 / AC-8 確定 + 着手 gate 判定（GO / NO-GO / PARTIAL）
- 所要時間: fixture 投入 + before 実測で 2-3 時間、GO 後の実装 + after 実測で 4-8 時間

### Phase 12（ドキュメント更新 / 7 必須成果物）

- Phase 12 で以下 7 必須成果物を作成:
  1. `outputs/phase-12/main.md` - サマリー
  2. `outputs/phase-12/implementation-guide.md` - 二段化 workflow / `confirmed` 分離 / queue consumer / cron handler の実装ガイド + 中学生レベル説明
  3. `outputs/phase-12/system-spec-update-summary.md` - `aiworkflow-requirements/references/{api-endpoints,database-schema,task-workflow-active,cloudflare-bindings}.md` への同期差分
  4. `outputs/phase-12/documentation-changelog.md` - 本タスク docs 追加分の changelog
  5. `outputs/phase-12/unassigned-task-detection.md` - 残課題の formalize（NO-GO 時は「実装不要」evidence、PARTIAL 時は未採用案、GO 時は監視 / admin UI polling / shared 配置 を candidate 送出）
  6. `outputs/phase-12/skill-feedback-report.md` - task-specification-creator skill への feedback
  7. `outputs/phase-12/phase12-task-spec-compliance-check.md` - 7 必須成果物の自己整合性チェック
- 入力: Phase 8 DRY 化結果 / Phase 11 evidence + 着手 gate 判定結果
- 出力: AC-11 確定 + `pnpm indexes:rebuild` で indexes 再生成
- 着手 gate NO-GO 時: artifacts.json は spec_created のまま据え置き、Issue #361 CLOSED 維持

### Phase 13（PR 作成 / user_approval 必須）

- Phase 13 は `pending_user_approval`。GitHub Issue #361 は CLOSED のまま、再 OPEN しない。
- PR 文面では **`Closes #361` を使わず `Refs #361` を採用** する。
- `git commit` / `git push` / `gh pr create` の実行手順はユーザー明示承認後の操作として扱う。
- PR 説明文に本 Go-No-Go 判定結果 + 着手 gate 判定結果 + Phase 11 evidence サマリー + Phase 12 system-spec 同期差分を転記する計画を Phase 12 で確定。
- NO-GO 時は spec 作成 + 判定 evidence のみの docs PR として作成（`Refs #361`）。

---

## MAJOR 検出時の差し戻しルート

| MAJOR 種別 | 差し戻し先 Phase | 差し戻し対象成果物 |
| --- | --- | --- |
| Queue vs Cron 採用判断不備（両案併記 / trade-off 不足） | Phase 2 | `outputs/phase-02/queue-vs-cron-decision.md` |
| 二段化 workflow 設計不備（責務分離不足 / 共通 helper 集約先未定） | Phase 2 | `outputs/phase-02/workflow-split-design.md` |
| API contract 設計不備（HTTP 4 ケース欠落 / `confirmed`/`backfill.status` 分離不足 / failure code 不整合） | Phase 2 | `outputs/phase-02/api-contract-design.md` |
| wrangler-runbook 不備（binding drift / 適用順序 / CI variables 不一致） | Phase 5 | `outputs/phase-05/wrangler-runbook.md` |
| 異常系の網羅不足（duplicate enqueue / partial failure recovery / batch boundary 欠落） | Phase 6 | `outputs/phase-06/failure-cases.md` |
| 不変条件 #5 違反 | Phase 2 / Phase 8 | 該当設計成果物 + DRY 化結果 |
| DRY 化不全（重複転記 / 親タスク 07b 上書き） | Phase 8 | `outputs/phase-08/main.md` |
| queue message PII 混入設計 | Phase 2 / Phase 9 | `outputs/phase-02/api-contract-design.md` + Phase 9 セキュリティ確認 |
| Phase 9 検証コマンド不備（queue consumer / cron handler ローカル検証戦略未確定） | Phase 9 | `outputs/phase-09/main.md` |

> 本 Phase での MAJOR 検出は 0 件。差し戻しは発生しない。

---

## 後続タスク（follow-up）への申し送り

| follow-up 候補 | 本タスクでの起票 | 別タスクで判断 | 備考 |
| --- | --- | --- | --- |
| 監視アラート（`backfill.status='exhausted'/'failed'` 検知の閾値設計） | 起票しない | 別タスク（監視ダッシュボード）で起票 | Phase 12 unassigned-task-detection.md に candidate として送出 |
| admin UI polling 対応（`confirmed` / `backfill.status` 表示・自動 retry） | 起票しない | UT-07B-FU-02 で対応（既存 follow-up） | 本タスク Phase 12 で UT-07B-FU-02 にリンク |
| `packages/shared/src/types/zod` への HTTP response body 型 / enum 配置 | 起票しない | UT-07B-FU-02 で admin UI から参照する必要が確定した時点で別タスクで判断 | Phase 8 で base case 確定済み（apps/api 内のみ） |
| production migration apply 承認ゲート | 起票しない | UT-07B-FU-03,04 で対応（既存 follow-up） | 本タスクは migration 最小（status enum 拡張のみ）or 不要 |
| 真 cursor semantics 導入 | 起票しない | 本タスク remaining-scan model で十分。evidence 上必要になった場合のみ別タスク化 | Phase 11 evidence 結果次第 |

---

## open question の Phase 振り分け

| # | 質問 | 受け皿 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | staging 10,000+ rows fixture で `backfill_cpu_budget_exhausted` が再現するか | Phase 11（着手 gate 判定の入力） | open（Phase 11 で確定） |
| 2 | Queue / Cron どちらの採用判断が staging evidence で支持されるか | Phase 11（before evidence + 着手 gate） | open（Phase 11 で確定） |
| 3 | `aiworkflow-requirements/references/cloudflare-bindings.md` ファイルの存在 / 構造 | Phase 12（同期 PR 入力） | Phase 8 で集約済み、Phase 12 で実反映 |
| 4 | NO-GO 時に Issue #361 を spec_created 据え置きで運用するか / 別 issue にして close するか | Phase 12 unassigned-task-detection.md | 本 Phase で「Issue #361 CLOSED 維持 + 仕様書 spec_created 据え置き」確定 |
| 5 | PARTIAL 時に未採用案の Phase 2 / 5 / 6 記述をどこまで縮約するか | Phase 12（縮約結果を documentation-changelog.md に記録） | 本 Phase で「Decision Log に link 参照のみ残す」方針確定 |
| 6 | production cron-string が staging と完全一致するかの最終確認 | Phase 11（staging 実機確認） | open（Phase 11 で確定） |

---

## 4 条件評価（最終）

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | GO 判定により Phase 11 staging 実測 + 着手 gate 判定 + Phase 12 ドキュメント更新 + Phase 13 PR 作成（user_approval 後）が手戻りなく実行可能 |
| 実現性 | PASS | 既存スタック（D1 / Workers / Queue / Cron / wrangler / vitest）で完結、新規ツール導入なし。NO-GO 時は実装着手不要 |
| 整合性 | PASS | 不変条件 #5 遵守（apps/api 内完結）、親タスク 07b 完了済仕様の保護、UT-07B-FU-02 / FU-03,04 / 監視 follow-up との独立性確保 |
| 運用性 | PASS | Phase 9 検証コマンド + Phase 5 runbook + Phase 11 staging evidence + 着手 gate 判定基準で「PASS と言い切れる」運用昇格状態。NO-GO 運用も明文化 |

---

## 多角的チェック観点

- **価値性**: 設計レビュー + 着手 gate の二段ゲート構造により、不要実装を回避しつつ実装続行時の手戻り 0 を担保。
- **実現性**: 既存スタックで完結、NO-GO 時は実装コスト 0。
- **整合性**: 不変条件 #5 遵守、親タスク 07b 保護、follow-up 整理。
- **運用性**: GO / NO-GO / PARTIAL の 3 分岐運用を Phase 12 / 13 まで明文化。
- **認可境界**: admin endpoint のみ更新、consumer / cron は internal binding。
- **無料枠**: D1 storage / Queue 増分は staging fixture 投入時の一時的増加のみ。
- **PR 文面方針**: `Refs #361`（`Closes #361` 不採用）/ user_approval 必須 / Phase 11 evidence + Phase 12 system-spec 同期差分の転記。

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-11 達成状態評価 | 10 | spec_created | 11 件 |
| 2 | 4 条件最終再評価 | 10 | spec_created | 全 PASS |
| 3 | 設計レビューゲート判定（Go 条件 6 件） | 10 | spec_created | 全充足 |
| 4 | 着手 gate 判定基準確定（GO / NO-GO / PARTIAL） | 10 | spec_created | 3 分岐 |
| 5 | レビュー観点 10 項目以上の確認 | 10 | spec_created | 12 観点全 PASS |
| 6 | 不変条件 #5 への影響最終チェック | 10 | spec_created | 違反 0 |
| 7 | MAJOR 差し戻しルート確定 | 10 | spec_created | MAJOR 0 |
| 8 | follow-up 5 件 + open question 6 件 送出 | 10 | spec_created | 受け皿 Phase / 別タスク指定 |
| 9 | go-no-go.md 作成 | 10 | spec_created | GO で確定 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・AC マトリクス・4 条件最終再評価・設計ゲート Go 条件 6 件・着手 gate 判定基準・レビュー観点 12 項目・不変条件 #5・MAJOR 差し戻し・Phase 11/12/13 引き渡し・follow-up / open question |
| メタ | artifacts.json | Phase 10 状態の更新 |

---

## 受入条件 / 完了条件チェックリスト

- [ ] AC-1〜AC-11 全件に達成状態が付与（PASS / 引き渡し が明示）
- [ ] 4 条件最終再評価が全 PASS（根拠付き）
- [ ] 設計レビューゲート Go 条件 6 件すべて充足が確認
- [ ] 着手 gate 判定基準（GO / NO-GO / PARTIAL の 3 分岐）が表化・根拠付き
- [ ] レビュー観点 10 項目以上で MAJOR 0
- [ ] 不変条件 #5 への影響最終チェックで違反 0
- [ ] MAJOR 0 件で差し戻しなしが確定
- [ ] Phase 11 / Phase 12 / Phase 13 引き渡し条件が明文化（着手 gate evidence + 7 必須成果物 + user_approval PR）
- [ ] follow-up 5 件 + open question 6 件すべてに受け皿 Phase or 別タスクが指定
- [ ] outputs/phase-10/go-no-go.md が作成済み
- [ ] 設計レビューゲート GO 判定で確定（着手 gate は Phase 11 で判定）

---

## タスク 100% 実行確認【必須】

- 全実行タスク（9 件）が `spec_created`
- 成果物 `outputs/phase-10/go-no-go.md` 配置予定
- AC × 4 条件 × 設計ゲート Go 条件 × 着手 gate 判定基準 × レビュー観点 × 不変条件 #5 × MAJOR × Phase 11/12/13 引き渡し × follow-up × open question の 10 観点すべて記述
- artifacts.json の `phases[9].status` が `spec_created`
- 親タスク 07b 完了済仕様への上書きなし、`Refs #361` 方針確認済み

---

## 次 Phase への引き渡し

- 次 Phase: 11（手動検証 / NON_VISUAL 縮約 + staging 10,000+ rows before/after evidence + 着手 gate 判定）
- 引き継ぎ事項:
  - 設計レビューゲート GO 判定（spec_created 段階）
  - 着手 gate 判定基準（GO / NO-GO / PARTIAL の 3 分岐表）
  - NON_VISUAL タスクであり screenshot 不要、`before-evidence.md` + `after-evidence.md`（GO 時のみ）+ `manual-evidence.md`（GO 時のみ）+ `link-checklist.md` を採用
  - staging 10,000+ rows fixture 投入手順（Phase 4 / 11 で詳細化）
  - NO-GO 時の Issue #361 CLOSED 維持 + 仕様書 spec_created 据え置き運用
  - PARTIAL 時の未採用案縮約方針（Decision Log に link 参照のみ残す）
  - Phase 12 で 7 必須成果物作成計画 + `aiworkflow-requirements` 同期 PR
  - Phase 13 は user_approval 必須、`Refs #361`（CLOSED 維持）
  - open question #1 / #2 / #6 を Phase 11 で確定、#3-#5 を Phase 12 / 別タスクで処理
- ブロック条件:
  - 4 条件のいずれかが MAJOR
  - AC で PASS / 引き渡し でないものが残る
  - 設計ゲート Go 条件 6 件のいずれかが未充足
  - 着手 gate 判定基準が曖昧（3 分岐の境界未確定）
  - 不変条件 #5 違反が検出される
  - 親タスク 07b 完了済仕様への上書き / 全文転記が残る
  - shared 配置 / queue 分離方針が「未決」のまま Phase 11 に進む

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | 設計ゲート GO + 着手 gate 判定基準を入力に staging 10,000+ rows before/after evidence 取得 + 着手 gate 判定 |
| Phase 12 | 7 必須成果物作成、open question / follow-up を unassigned-task として formalize、`aiworkflow-requirements` 同期 PR を 1 回に集約。NO-GO 時は「実装不要」evidence を `unassigned-task-detection.md` に記録 |
| Phase 13 | GO/NO-GO 結果 + 着手 gate 判定結果を PR description に転記（Issue #361 CLOSED 維持・`Refs #361`） |
| 親タスク 07b 完了 | 07b 既存 test の regression 0 + 既存 implementation-guide の保護を Phase 13 PR で確認 |
| UT-07B-FU-02（関連） | response field 命名（`confirmed` / `backfill.*`）の正本を引き渡し、admin UI polling 対応へ |
