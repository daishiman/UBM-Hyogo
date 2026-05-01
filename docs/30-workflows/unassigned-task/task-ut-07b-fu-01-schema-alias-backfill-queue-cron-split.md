# UT-07B-FU-01 schema alias back-fill queue/cron split - タスク指示書

## メタ情報

```yaml
issue_number: 361
task_id: UT-07B-FU-01-schema-alias-backfill-queue-cron-split
task_name: Schema alias back-fill queue/cron split for large data volume
category: type:performance
target_feature: 管理画面 schema diff alias assignment workflow
priority: medium
scale: medium
status: 未実施
source_phase: docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md
created_date: 2026-05-01
dependencies:
  - UT-07B-schema-alias-hardening-001
trigger_condition: staging 10,000+ rows evidence で backfill_cpu_budget_exhausted が持続する場合のみ着手
```

---

## 1. なぜこのタスクが必要か（Why）

UT-07B schema alias hardening では、alias 確定と response back-fill を分離し、CPU budget 超過時に `backfill_cpu_budget_exhausted` を retryable な HTTP 202 として返す契約まで実装した。

ただし、Phase 12 の実装ガイドでは staging credentials が必要なため 10,000 行以上の Workers/D1 実測は deferred とされている。Phase 12 未タスク検出でも、queue/cron split は「staging evidence が必要性を証明した場合のみ formalize」と扱われていた。

このタスクは、staging 10,000+ rows の evidence で `backfill_cpu_budget_exhausted` が複数回・継続的に再現し、既存の再実行モデルだけでは実運用時間内に収束しない場合に限って、back-fill を queue/cron 分割へ移行するための条件付きタスクである。

---

## 2. 何を達成するか（What）

staging 実測で CPU budget exhaustion が持続する場合に、schema alias back-fill を単発 API の同期処理から、再開可能な queue/cron 駆動の分割処理へ移行する。

### スコープ

### 含む

- `schema_aliases` / `schema_diff_queue` / back-fill 状態管理の現行契約確認
- Queue または Cron Trigger による back-fill batch continuation の設計と実装
- apply API の応答を「alias confirmed」「back-fill pending/running/exhausted/completed」が追跡できる形へ整理
- staging 10,000+ rows の before/after evidence 作成
- API / DB / operational runbook / Phase 12 documentation の正本同期

### 含まない

- CPU budget exhaustion が staging 10,000+ rows で持続しない場合の実装着手
- 管理 UI の retry label / progress UI 追加
- production migration apply の承認ゲート実行
- unrelated な schema diff recommendation algorithm 改修

---

## 3. どのように実行するか（How）

まず staging で 10,000 行以上の `response_fields` 相当データを用意し、既存 UT-07B 実装の dryRun/apply/retry を Workers 経由で測定する。`backfill_cpu_budget_exhausted` が一時的に出ても、数回の再実行で収束するなら本タスクは実装しない。

着手条件を満たした場合は、alias 確定を API request 内で完了させ、back-fill continuation を Queue consumer または Cron Trigger の小さな batch に移す。各 batch は idempotent に残件だけ処理し、失敗しても次回実行で同じ残件を再取得できる remaining-scan model を維持する。

---

## 4. 実行手順

1. `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md` と `unassigned-task-detection.md` を読み、現行 retryable contract と deferred 条件を確認する。
2. staging D1 / Workers で 10,000 行以上の fixture を作成し、既存 API の dryRun/apply/retry 実測を Phase 11 evidence として保存する。
3. `backfill_cpu_budget_exhausted` が持続するか判定する。持続しない場合は「実装不要」として evidence と判断理由だけ記録して close する。
4. 持続する場合は Queue / Cron のどちらを採用するかを設計し、Cloudflare binding、local test strategy、再実行間隔、最大 batch size を決める。
5. `apps/api/src/workflows/schemaAliasAssign.ts` 周辺を更新し、API request 内では alias confirmation と job enqueue/schedule までを担当させる。
6. worker/consumer 側で back-fill batch を処理し、残件数、最終処理時刻、retryable error、完了状態を記録する。
7. route / workflow / repository tests を追加し、idempotent retry、duplicate enqueue 防止、partial failure recovery を固定する。
8. staging 10,000+ rows で before/after を再測定し、CPU budget exhaustion が queue/cron 分割後に運用上収束することを確認する。
9. Phase 12 で API contract、DB schema、runbook、unassigned-task detection の結果を同期する。

---

## 5. 完了条件チェックリスト

- [ ] staging 10,000+ rows evidence により、着手条件を満たしたこと、または満たさず実装不要と判断したことが記録されている
- [ ] 着手した場合、back-fill が Queue または Cron Trigger の batch 処理として再開可能に実装されている
- [ ] API response から alias confirmation と back-fill continuation status を区別できる
- [ ] 同一 alias apply の duplicate enqueue / duplicate processing が idempotent に抑止されている
- [ ] route / workflow / repository tests が PASS している
- [ ] staging 10,000+ rows の after evidence で CPU budget exhaustion が継続的な失敗にならないことを確認している
- [ ] Phase 12 documentation と aiworkflow-requirements の関連正本が同期されている

---

## 6. 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run \
  apps/api/src/workflows/schemaAliasAssign.test.ts \
  apps/api/src/routes/admin/schema.test.ts
```

期待: 全 PASS。Queue/Cron 分割を実装した場合は enqueue、batch continuation、idempotent retry、partial failure recovery のテストが含まれる。

### 統合検証

```bash
rg "backfill_cpu_budget_exhausted|backfill|schema_aliases|schema_diff_queue" \
  apps/api/src apps/api/migrations docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening
```

期待: API contract、状態管理、migration、Phase 12 文書の用語が一致している。

### staging 実測

```bash
curl -sS -X POST "$STAGING_API/admin/schema/aliases" \
  -H "Authorization: Bearer $ADMIN_SESSION_JWT" \
  -H "Content-Type: application/json" \
  -d '{"questionId":"<question_id>","stableKey":"<stable_key>"}'
```

期待: 10,000+ rows fixture で alias confirmation と back-fill continuation status が返り、queue/cron batch が残件を収束させる。着手条件を満たさない場合は、既存 retry で収束した evidence を残す。

---

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| staging evidence なしに queue/cron を実装し、不要な運用複雑性を増やす | 10,000+ rows で CPU budget exhaustion が持続することを着手 gate にし、持続しない場合は実装不要として close する |
| Queue/Cron の duplicate execution で back-fill が二重更新される | batch 処理を remaining-scan model と idempotent update に限定し、duplicate enqueue test を追加する |
| alias confirmation と back-fill completion を混同し、UI/API 利用者が完了状態を誤認する | response contract に `confirmed` と `backfill.status` を分け、Phase 12 の API 仕様へ同期する |
| Cloudflare binding 追加が staging / production で drift する | `wrangler.toml`、CI variables、runbook を同時更新し、staging 実測 evidence に binding 名を記録する |
| Cron 間隔や batch size が本番負荷に合わない | staging evidence から batch size と interval を決め、rollback 可能な設定値として扱う |

---

## 8. 参照情報

- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-11/main.md`
- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-11/manual-evidence.md`
- `apps/api/src/workflows/schemaAliasAssign.ts`
- `apps/api/src/routes/admin/schema.ts`
- `apps/api/src/repository/schemaAliases.ts`
- `apps/api/src/repository/schemaDiffQueue.ts`

---

## 9. 備考

- このタスクは performance hardening の条件付き follow-up であり、CPU budget exhaustion が staging 10,000+ rows evidence で持続しない限り実装しない。
- Phase 12 検出時点では queue/cron split 以外に admin UI retry label と production migration apply runbook も候補に挙がっているが、本タスクには含めない。
- Cursor semantics は現行の idempotent remaining-scan model を優先し、実 cursor は evidence 上必要になった場合だけ導入する。

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260501-101306-wt-6/docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md`
- 症状: staging credentials が必要なため 10,000+ rows Workers/D1 実測が Phase 11 で deferred となり、queue/cron split の必要性を現時点で確定できない。
- 参照: `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md`

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260501-101306-wt-6/docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md`
- 症状: Phase 12 検出候補では「50,000+ rows persistently exceed CPU budget」と記録されている一方、レビュー disposition では staging 10,000+ row evidence を gate としており、正式タスクでは着手条件を 10,000+ rows evidence に寄せて明示する必要があった。
- 参照: `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md`
