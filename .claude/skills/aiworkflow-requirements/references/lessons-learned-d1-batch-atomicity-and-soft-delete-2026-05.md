# D1 Batch Atomicity + Soft Delete + Optimistic Lock Lessons（2026-05）

Issue #778 (`docs/30-workflows/issue-778-schema-alias-rollback-undo/`) で確立した、Cloudflare D1 における soft delete + 楽観ロック + `db.batch()` atomic mutation + audit relation の苦戦箇所と対策を集約する。本ドキュメントは正本パターン `pattern-d1-soft-delete-optimistic-lock-batch.md` の経験的補足。

---

## L-DBATCH-001: `db.batch()` の atomicity 仕様引用を Phase 02 design で必須化する

Cloudflare D1 `db.batch([...])` は all-or-nothing transaction として動作するが、Cloudflare Workers Docs の該当節を Phase 02 design ドキュメントから直接引用しないと、レビュー時に「途中失敗時の挙動が保証されているか」が再質問として戻ってくる。

- design に `developers.cloudflare.com/d1/worker-api/d1-database/#batch` への URL を含める
- Phase 07 contract spec で **fault-injection test** を必須化する: 「最後の prepare を bind error で意図的に失敗させ、(a) soft-delete UPDATE / (b) downstream insert が rollback されることを assert」
- `db.prepare(...).run()` を連続記述する形（batch 化されていない）を grep gate で禁止する

---

## L-SOFTDEL-001: `FROM <table>` の全箇所に `AND deleted_at IS NULL` を grep gate で強制する

soft delete を導入すると、既存 repository の SELECT は何も変更しなければ deleted 行も拾い続けてしまう。type system では検知できないため、grep による physical enforcement が必要。

- 推奨 gate: `rg "FROM schema_aliases" apps/api/src | rg -v "deleted_at IS NULL"` で 0 行
- partial unique index (`WHERE deleted_at IS NULL`) は unique 衝突回避のために必須（active と soft-deleted を同一 stable_key で並列保持できるようにする）
- `idx_schema_aliases_deleted_at` を併設し、`deleted_at IS NULL` の cold path / hot path を index 単位で分離する

---

## L-OPTLOCK-001: `If-Match: version=N` の parse 失敗（400）と version 衝突（409）を route handler 層で明確に分離する

`If-Match` header の parse 失敗と楽観衝突は両方とも client retry 動作が異なるため、混在させると client 側のリトライ戦略が破綻する。

- header 形式は `version=<int>` 固定（ETag 互換の引用符は採用しない）
- parse 失敗 → `400 bad_request`、parse 成功 + `db.batch()` の `meta.changes === 0` → `409 version_mismatch`
- contract spec に「parse 失敗 / 衝突 / row 不在（404 not_found）/ 既削除（404 already_deleted）」を 4 ケースとして固定し、route test (`__tests__/<route>.rollback.spec.ts`) で網羅
- 409 response body は `{ error: 'version_mismatch', currentVersion: <N> }` 形式とし、client が GET 不要で即リトライできるようにする

---

## L-AUDITREL-001: `audit_log` と `cf_audit_log` の責務分離を SKILL ドキュメントで明示する

- `audit_log` (application table) — admin mutation の正本。`after_json.relatedAuditId` で元 mutation を参照
- `cf_audit_log` (Cloudflare ingestion table) — Cloudflare 側 audit ingestion のリードオンリー mirror。application mutation で書かない

rollback workflow の audit insert を `cf_audit_log` 側に書いてしまうと、Cloudflare ingestion との衝突 / schema drift が発生する。issue-778 の Phase 02 design で当初混同が発生し、Phase 07 spec review で application `audit_log` 側に修正した経緯がある。今後同類タスクでは Phase 02 design の冒頭で対象テーブル名を明示する。

---

## L-SCOPE-001: bulk rollback / notification / recompute は followup に分離し、CONST_007 例外宣言を `index.md` 冒頭に必須化する

rollback / undo 系タスクは「ついでに bulk operation も入れたい」「成功時 Slack 通知も入れたい」「下流 cache の recompute trigger も入れたい」と scope が膨張しがち。SRP を保つため、issue-778 では以下 3 件を unassigned-task として physical separation した:

- `serial-05-step-03-followup-005-schema-alias-recompute-trigger.md`
- `serial-05-step-03-followup-006-schema-alias-bulk-rollback.md`
- `serial-05-step-03-followup-007-schema-alias-rollback-notification.md`

本タスクの `index.md` 冒頭で「除外スコープ（CONST_007 例外）」として上記 3 件を明示し、レビュー時の scope creep 質問を予防する。followup は `phase-12/unassigned-task-detection.md` で正規に登録し、artifact inventory の Source And Parent 欄に列挙する。

---

## 参考

- 正本パターン: `references/pattern-d1-soft-delete-optimistic-lock-batch.md`
- 参考実装: Issue #778 `docs/30-workflows/issue-778-schema-alias-rollback-undo/`
- artifact inventory: `references/workflow-issue-778-schema-alias-rollback-undo-artifact-inventory.md`
- 関連 lessons: `lessons-learned-07b-schema-alias-assignment-2026-04.md`, `lessons-learned-ut07b-schema-alias-hardening-2026-05.md`
