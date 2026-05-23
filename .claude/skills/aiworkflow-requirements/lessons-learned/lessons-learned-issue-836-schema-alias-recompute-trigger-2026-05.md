# Lessons Learned: Issue #836 schema alias recompute trigger

対象 workflow: `docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/`
状態: `local_implementation_complete_runtime_pending / implementation / VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
作成日: 2026-05-23
親パターン: [pattern-d1-soft-delete-optimistic-lock-batch.md](../references/pattern-d1-soft-delete-optimistic-lock-batch.md) §Admin batch job idempotency pattern（Issue #836 recompute）
初出参考: Issue #778（`schemaAliasRollback.ts` / `backfillResponseFields()`）

> 本ファイルは「設計パターンの再利用テンプレート」（pattern 側）に対し、**実装時に実際に詰まった箇所と意思決定の記録**を残す。同じ recompute / batch job 系タスクを将来簡潔に解決するための知見集。

## L-RECOMPUTE-001: reverse-backfill は既存 backfill の「対称（逆）操作」として実装する

最も詰まったのは「再集計とは具体的に何を SQL で書き戻すのか」の定義だった。resolve 時の `backfillResponseFields()`（`schemaAliasAssign.ts:192-277`）は `response_fields.stable_key` を `__extra__:{questionId}` → `alias.stableKey` へ前進させる。recompute はこの**完全な逆**で `alias.stableKey` → `__extra__:{aliasQuestionId}` へ戻す。

設計を「rollback の延長」として捉えると衝突回避の向きを間違える。**backfill の対称表**（from / to / 衝突回避 / 単位 / no-op 判定）を `outputs/phase-02/recompute-algorithm.md` に正本化し、各列を逆向きに対応付けることで実装ブレを防いだ。特に衝突回避は「to（`__extra__`）が既存なら from（`stableKey`）行を DELETE」で、backfill の「to が既存なら from を DELETE」と同じ構造だが対象キーが入れ替わる点が事故りやすい。`extraKey === stableKey` の no-op 判定も対称に置く。

**How to apply:** backfill / unbackfill 系を実装するときは、まず既存の前進操作を表で分解し、各セルを逆向きに転記した「対称表」を design output に固定してから SQL を書く。コードから先に書かない。

## L-RECOMPUTE-002: triggerKey は client から受け取らず server-side derivation に固定する

冪等キーをどこで決めるかで迷った。client が triggerKey を送る設計だと、改ざん・再送で UNIQUE 制約をすり抜けて二重 recompute が起きうる。最終的に **client からは一切受け取らず**、server 側で `relatedRollbackAuditId ?? "${alias.id}:${alias.version}"` から導出する設計に固定した。POST body は `{ reason?: string(<=500) }` のみ。

これにより job UNIQUE index `(alias_id, stable_key, trigger_key)` の冪等性が「server が観測した rollback 事実」に紐づき、client 操作では破れなくなる（AC-2）。

**Why:** 冪等性キーを信頼境界の外（client）に置くと、UNIQUE 制約が冪等保証にならない。**How to apply:** idempotency key は必ず server が観測可能な事実（audit id / version）から導出し、API contract に「client からは受け取らない」と明記する。

## L-RECOMPUTE-003: job UNIQUE / optimistic version / SQL レベル冪等の三重防御を分けて考える

冪等性を 1 つの仕組みで担保しようとして破綻しかけた。実際には**3 層が別々の失敗モードを潰す**：

1. **job UNIQUE index**（`alias_id, stable_key, trigger_key`）= 同一 trigger の二重 job 作成を防ぐ
2. **lease claim**（`locked_at` / `run_token` の conditional update）= 同一 running job への並行 runner 流入を防ぐ
3. **SQL レベル冪等**（reverse-backfill の `WHERE` が「すでに目的状態なら 0 件」）= job ledger を信用せず DB 状態自体を冪等にする

3 を入れたのが効いた。job ledger だけに依存すると、ledger と実データがズレた場合（手動 SQL 介入・部分失敗）に二重変動する。batch 本体も「目的状態なら更新対象 0 件」になる WHERE にして、ledger 非依存の冪等性を最終防衛線に置く。

**How to apply:** 「冪等な batch job」は ledger・lease・SQL 述語の 3 層で別々に設計する。どれか 1 つを冪等性の単一根拠にしない。

## L-RECOMPUTE-004: CPU budget exhausted は `running` + cursor 保存 + 再 POST lease 継続で表現する

D1 / Workers の CPU budget 内で全件処理が終わらないケースの設計が重かった。Queue fan-out を入れたくなるが、本体完成を優先して**同期 POST の再実行で継続する**方式にした：

- chunk（`BACKFILL_BATCH_SIZE`）+ CPU budget（`BACKFILL_CPU_BUDGET_MS`、`schemaAliasAssign.ts` から export 再利用）で処理
- budget 超過時は job を `running` のまま、last processed `response_id` を `cursor` に保存して中断
- 次の POST が同一 job を lease claim し、`cursor` から継続。全件処理で `completed`（AC-8）
- `affectedCount` は初回 `countReverseTargets()` で確定し、再実行で減らさない（進捗率が逆行しないため）

Queue fan-out は「運用実績が出た時点で新規起票」の将来候補として `unassigned-task-detection.md` に明記し、今 wave に入れない（L-RECOMPUTE-007）。

**How to apply:** 大量件数の同期 batch は「running + cursor 保存 + 再呼び出しで lease 継続」を第一候補にする。Queue 化は運用実績が出てから。`affectedCount` は初回確定で固定する。

## L-RECOMPUTE-005: `not_rolled_back` を 409 で早期 fail させ recompute の前提を守る

recompute は「rollback 済み alias」だけが対象という前提を、コードのどこで担保するかで迷った。`getById(aliasId, { includeDeleted: true })` で取得し、不在は `not_found`（404）、`deletedAt == null`（=まだ rollback されていない）は `not_rolled_back`（409）として**workflow 冒頭で早期 fail** させる設計に固定した。

これを入れないと、active な alias に recompute を呼ぶと「resolve した見出しを勝手に剥がす」破壊操作になる。`SchemaAliasRecomputeFailure.kind`（`not_found` / `not_rolled_back` / `batch_failed`）を HTTP status へ写像する 1 箇所に集約し、route handler を薄く保つ。

**How to apply:** 前提条件（rollback 済みであること）は workflow 冒頭の guard で早期 fail させ、kind → HTTP status の写像を 1 箇所に集約する。

## L-RECOMPUTE-006: completed job は batch 本体・audit insert を再実行せず recomputeAuditId だけ返す

冪等返却の「何を返し、何を再実行しないか」が曖昧だと監査が二重に積まれる。completed job を再 POST した場合は、**reverse-backfill 本体も `audit_log` INSERT も実行せず**、初回保存した `recompute_audit_id` を含む `RecomputeResult` をそのまま返す。audit は初回のみ INSERT し、job の `recompute_audit_id` に保存しておく。

これで「再集計を 2 回押しても audit_log に 1 行」が保証される。`cf_audit_log`（ingestion 側 read-only）ではなく application `audit_log` に書く点も親パターン（L-AUDITREL）から継承して厳守。

**How to apply:** 冪等返却では「初回 audit id を job に保存 → 2 回目以降は本体も audit も実行せず保存済み id を返す」を契約に固定する。

## L-RECOMPUTE-007: recompute 本体を rollback と同 PR に混ぜず followup-005 として分離（CONST_007）

Issue #778（rollback）実装時に「rollback 後の response_fields 整復」も一緒にやりたくなったが、本体（rollback）完成のリスクを下げるため `followup-005` として `unassigned-task/` に分離していた。今回それを消化する形で recompute を実装した。

さらに recompute 実装中も bulk recompute（followup-006）・通知（followup-007）・Queue fan-out（将来候補）を同時に入れたくなったが、本体 1 サイクル完結を優先して全て分離・残置した。CLOSED Issue #836 を reopen せず、source `serial-05-step-03-followup-005-...md` を `consumed_via_issue_836_recompute_trigger_spec` に更新、006/007 は pending 残置（重複起票なし）。

**Why:** scope 肥大化は本体未完成リスクを生む。**How to apply:** `index.md` 冒頭で CONST_007 例外宣言（除外スコープの明示）を必須にし、followup は `unassigned-task/` に分離して consumed/pending を fold-state で追跡する。

## 関連参照

- workflow root: `docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/`
- design 正本: `outputs/phase-02/{api-contract,d1-schema-migration,recompute-algorithm,ui-state-machine}.md`
- 親 pattern: `references/pattern-d1-soft-delete-optimistic-lock-batch.md`（§Admin batch job idempotency pattern）
- 親 lessons（rollback）: `references/lessons-learned-d1-batch-atomicity-and-soft-delete-2026-05.md`（L-DBATCH / L-SOFTDEL / L-OPTLOCK / L-AUDITREL / L-SCOPE）
- 実装: `apps/api/src/workflows/schemaAliasRecompute.ts`, `apps/api/src/repository/schemaAliasRecomputeJobs.ts`, `apps/api/src/routes/admin/schema.ts`, `apps/api/migrations/0020_schema_alias_recompute_jobs.sql`, `apps/web/src/components/admin/SchemaDiffPanel.tsx`, `apps/web/src/lib/admin/api.ts`
- system spec: `docs/00-getting-started-manual/specs/01-api-schema.md`, `docs/00-getting-started-manual/specs/11-admin-management.md`
- skill index 同期: `indexes/resource-map.md`, `indexes/quick-reference.md`, `references/task-workflow-active.md`, `references/workflow-issue-836-schema-alias-recompute-trigger-artifact-inventory.md`
- changelog: `changelog/20260523-issue836-schema-alias-recompute-trigger.md`
