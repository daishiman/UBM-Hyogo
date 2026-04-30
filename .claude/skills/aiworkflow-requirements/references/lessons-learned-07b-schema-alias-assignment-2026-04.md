# lessons-learned: 07b Schema Alias Assignment Workflow 苦戦箇所（2026-04-30）

> 対象タスク: `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/`
> Wave: 7 / parallel / implementation_non_visual
> 関連 references: `api-endpoints.md`（§管理バックオフィス API 04c 07b close-out）, `database-schema.md`（§Schema alias assignment workflow 07b）, `indexes/quick-reference.md`（§UBM-Hyogo Schema Alias Assignment 早見）
> 出典: `outputs/phase-12/implementation-guide.md` / `system-spec-update-summary.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` / `elegant-verification.md`

将来同様の schema alias 確定 / data back-fill workflow を最短で正しく実装するための知見をまとめる。

## L-07B-001: 仕様書 DB スキーマと実 D1 schema の差分を実装前に grep で照合する

**苦戦箇所**: 07b の元仕様（task-spec / Phase 1-2）は `response_fields.questionId` カラムと `response_fields.is_deleted` カラムが存在する前提で書かれていた。実 D1 では既に `response_fields.stable_key='__extra__:<questionId>'` 形式で extra field を表現しており、論理削除も `deleted_members` 別テーブルに分離されていた。Phase 5 実装段階で初めて検出され、back-fill SQL とテストを書き直すロスが発生した。

**解決方針**: extra field 識別子は `stable_key='__extra__:<questionId>'` LIKE 検索を採用し、削除 skip は `member_identities ⋈ deleted_members` 経由で `response_id NOT IN (...)` を発行する。task-specification-creator skill 側にも feedback として「Phase 2 / 4 / 12 で `apps/api/migrations/*.sql` と repository contract を grep 照合する」を昇格させた。

**適用先**: 既存テーブル resp / extra-field 系を扱うタスクは、Phase 1 で実 migration / repository を grep して仕様書差分を明示し、Phase 2 設計で「実 DB 採用 ↔ 仕様書記述」の対応表を必須化する。

## L-07B-002: dryRun と apply は副作用境界（audit_log / queue 遷移）も含めて完全分離する

**苦戦箇所**: 当初 `dryRun=true` でも `audit_log` への試算記録を残していたため、運用上「試算したのに監査ログに残る」混乱と、idempotent re-apply 時に dry-run audit が apply audit と区別できない問題が起きた。さらに dry-run 時に schema_diff_queue.status を一時的に `reviewing` にしようとしたコードが残っており、副作用なしの契約が崩れていた。

**解決方針**: `SchemaAliasAssignResult` を `mode: "dryRun" | "apply"` の discriminated union とし、dry-run 経路は (a) `schema_questions` / `schema_diff_queue` / `response_fields` / `audit_log` のいずれにも書き込まない、(b) 戻り値で `affectedResponseFields` / `currentStableKeyCount` / `conflictExists` のみを返す、を構造で強制する。apply 経路だけが `audit_log.action='schema_diff.alias_assigned'` を追記する。

**適用先**: dry-run / apply / preview を持つ workflow は、最初に discriminated union で戻り値を分け、副作用境界（DB / queue / audit / mail / external API）を type ごとにテストで検証する。

## L-07B-003: stableKey collision は revision-scoped UNIQUE pre-check + 422 で防御し、DB UNIQUE index は別タスクに切り出す

**苦戦箇所**: `schema_questions(revision_id, stable_key)` の物理 UNIQUE index は migration 設計時に未導入で、race condition 下では同一 revision 内に同じ stableKey を持つ別 question_id が並走 apply で書き込まれる余地があった。当初実装は post-write の SELECT で検出していたため、衝突が起きてから rollback する高コスト経路だった。

**解決方針**: apply 経路の最初に `SELECT question_id FROM schema_questions WHERE revision_id=? AND stable_key=? AND question_id<>?` を実行し、ヒットすれば `SchemaAliasAssignFailure({ kind: 'collision', existingQuestionIds })` を投げて HTTP 422 にマッピングする。物理 UNIQUE index 化は race condition の二段防御として `UT-07B-schema-alias-hardening-001` に分離。「pre-check で防げる衝突」と「migration で構造保証する衝突」を別 PR に切る。

**適用先**: 制約追加 migration が即時に取れない局面では、application 層 pre-check で先行防御し、DB 制約を follow-up に分離する。pre-check は必ず「同 scope（revision / tenant / partition）」を WHERE に明示する。

## L-07B-004: back-fill は batch サイズと CPU budget の二重ガードで Workers 30s 制限を逃げる

**苦戦箇所**: `response_fields` の back-fill を一括 UPDATE で書こうとしたところ、テストデータ 250 行ですら D1 round-trip で CPU を食い、本番想定の 10,000 行級では Workers 30s CPU 制限に到達しうると Phase 6 異常系で判明した。途中失敗時の再開可能性も曖昧だった。

**解決方針**: `BACKFILL_BATCH_SIZE=100` / `BACKFILL_CPU_BUDGET_MS=25000`（30s 安全マージン 5s）を constant export し、batch ループ内で `Date.now()` の経過を測って予算超過時は `RetryableError` を throw する。WHERE 句を `stable_key='__extra__:<questionId>'` に固定することで、apply が中断しても再 apply で残件を冪等に処理できる。既に新 stable_key 行が同 response_id に存在する場合は extra 行を `DELETE` して衝突を回避する。

**適用先**: D1 / Workers 環境の bulk update / migration / back-fill は、最初から (a) batch サイズ、(b) CPU budget、(c) 冪等な WHERE、(d) 中断後 resume 可能な設計を 1 セットで採用する。10,000 行級の実機計測は別タスクに分離する。

## L-07B-005: alias 候補提案は score 関数を service 層に分離し、Levenshtein + section/index で stateless に保つ

**苦戦箇所**: `GET /admin/schema/diff` の `recommendedStableKeys` を route handler 内に inline で書いていたため、score 関数のテストが route テストと混ざり、推薦アルゴリズム差し替え時に不要な統合テストを再実行することになった。

**解決方針**: `apps/api/src/services/aliasRecommendation.ts` を新規分離し、`(label, section, index, candidates) => string[]` の純粋関数として実装。Levenshtein 距離 + section 一致 + index 近接スコアで上位 5 件を返す。`aliasRecommendation.test.ts` で stateless 単体テストを完備し、route 層は service の戻り値を response に同梱するだけに留める。日本語 label の Unicode 正規化は follow-up（`UT-07B-...` 内 recommend 多言語化）に分離。

**適用先**: 推薦 / scoring / ranking ロジックは route から services/ 配下に切り出し、純粋関数 + 単体テストで品質保証する。route 層は I/O 接続だけ担当する。

## 関連未タスク・後続 wave 連携

- `UT-07B-schema-alias-hardening-001`: `schema_questions(revision_id, stable_key)` 物理 UNIQUE index migration、10,000 行級 back-fill の wrangler 実機計測、retryable HTTP contract（`backfill_cpu_budget_exhausted` → 503 + `Retry-After`）、apply ↔ back-fill の cron 分割設計
- 06c: admin UI 側 SchemaDiffPanel が `recommendedStableKeys` を chip UI で消費する（既に 06c で実装済み）
- 03a: forms-schema-sync が `schema_diff_queue.status='queued'` を投入する起点。本タスクで `resolved` への遷移 ownership を 07b に固定した
- 04c: `/admin/schema/aliases` の endpoint 定義は 04c で予約済み。本 workflow が handler 本体を書いた

## 参照

- 実装: `apps/api/src/workflows/schemaAliasAssign.ts`, `apps/api/src/services/aliasRecommendation.ts`, `apps/api/src/routes/admin/schema.ts`
- テスト: `apps/api/src/workflows/schemaAliasAssign.test.ts`, `apps/api/src/services/aliasRecommendation.test.ts`, `apps/api/src/routes/admin/schema.test.ts`
- AC × verify: `outputs/phase-07/main.md`（AC-1〜AC-10）
- 不変条件: spec #1（schema 固定しない）/ #14（schema 集約）/ #11（admin 認可境界）+ `outputs/phase-12/implementation-guide.md` の API 契約 / DB 差分吸収表
