# UT-07B schema alias hardening - タスク指示書

## メタ情報

```yaml
issue_number: 293
task_id: UT-07B-schema-alias-hardening-001
status: consumed / implemented-local workflow created
task_name: Schema alias apply hardening / 大規模 back-fill 再開可能化
category: パフォーマンス
target_feature: 管理画面 schema diff alias assignment workflow
priority: 高
scale: 中規模
source_phase: docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/unassigned-task-detection.md
workflow_root: docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/
created_date: 2026-04-30
dependencies: []
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-07B-schema-alias-hardening-001 |
| タスク名 | Schema alias apply hardening / 大規模 back-fill 再開可能化 |
| 分類 | implementation / reliability / performance |
| 対象機能 | 管理画面 schema diff alias assignment workflow |
| 優先度 | 高 |
| 見積もり規模 | 中規模 |
| ステータス | consumed / implemented-local workflow created |
| 発見元 | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-04-30 |
| issue_number | #293 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

07b では `GET /admin/schema/diff` の `recommendedStableKeys` と `POST /admin/schema/aliases` の dryRun/apply を実装し、`schema_questions` の stableKey 確定、`response_fields` の `__extra__:<questionId>` back-fill、`schema_diff_queue.status = resolved` 更新、`audit_log.action = schema_diff.alias_assigned` 記録までを完了した。

一方で Phase 12 の未タスク検出により、race condition への DB 制約、10,000 行以上の Workers/D1 実測、CPU budget 超過時の retryable HTTP contract は今回タスクの範囲外として分離された。

### 1.2 問題点・課題

現状の collision 防御は repository / workflow 層の pre-check が中心で、同一 revision に同じ stableKey を並列 apply する race condition に対する物理 UNIQUE index はまだない。また、back-fill は in-memory D1 と 250 行級のテストで検証済みだが、10,000 行以上の D1 実測と Workers CPU budget 超過時の queue / cron 分割判断が未完了である。

### 1.3 放置した場合の影響

- 並列 apply 時に同一 revision 内で stableKey が重複し、管理 UI の schema diff 表示と response 集計が不整合になる
- 大規模 back-fill が Workers CPU budget を超えた場合、途中失敗後の再開条件や利用者向け retry response が曖昧になる
- DB 実スキーマと仕様書の差分を実装時に再発見し、migration / repository / API contract の手戻りが増える
- 本番データ量に近い性能証跡がないまま alias apply を運用に載せることになる

---

## 2. 何を達成するか（What）

### 2.1 目的

Schema alias apply を、DB 制約・再開可能 back-fill・大規模実測・retryable HTTP contract を備えた運用可能な workflow に強化する。

### 2.2 最終ゴール

- `schema_questions(revision_id, stable_key)` の同一 revision collision が DB constraint または同等の二段防御で保証されている
- alias 確定と response back-fill が分離され、back-fill が途中失敗しても再実行で残件処理できる
- 10,000 行以上の D1 / Workers 実測結果が Phase 11 evidence に残っている
- `backfill_cpu_budget_exhausted` など retryable failure が API contract と正本仕様に同期されている

### 2.3 スコープ

#### 含む

- `apps/api/migrations/*.sql` と実 DB schema を確認したうえでの UNIQUE index 追加可否判断
- 必要な migration / repository / workflow / route / test の更新
- alias 確定と back-fill 継続処理の責務分離
- 10,000 行以上の D1 / Workers 実測と Phase 11 evidence 記録
- `aiworkflow-requirements` の `api-endpoints.md` / `database-schema.md` / `task-workflow-active.md` / indexes 同期

#### 含まない

- 管理 UI の新規画面追加（既存 admin schema UI の表示調整が必要な場合のみ最小限）
- unrelated な schema diff algorithm 改修
- Phase 13 の commit / push / PR 作成

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 07b 本体の Phase 12 が完了し、`docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/implementation-guide.md` が参照可能である
- 実 DB schema を `apps/api/migrations/*.sql` と repository contract の両方から確認する
- Cloudflare Workers / D1 の staging 実測が可能な環境を用意する

### 3.2 依存タスク

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 07b schema alias assignment workflow | base endpoint / workflow / tests が前提 |
| 関連 | `aiworkflow-requirements` database/API contract | migration と API error contract の正本同期が必要 |

### 3.3 推奨アプローチ

1. `apps/api/migrations/*.sql`、`apps/api/src/repository/schemaQuestions.ts`、`apps/api/src/workflows/schemaAliasAssign.ts` を照合し、revision-scoped stableKey の物理制約案を設計する。
2. UNIQUE index が既存データと衝突する場合は、事前検出 SQL と rollback 手順を Phase 5 runbook に含める。
3. apply API を「alias 確定」と「back-fill 継続」に分け、back-fill が CPU budget で停止しても retryable response で再実行できるようにする。
4. 10,000 行以上の fixture を staging D1 に投入し、Workers 経由の実測を Phase 11 に残す。
5. API contract / database schema / lessons learned を正本仕様に同期する。

---

## 4. 実行手順

### Phase 1: 現状確認

1. `apps/api/migrations/*.sql` で `schema_questions` と `response_fields` の実カラムを確認する。
2. `apps/api/src/workflows/schemaAliasAssign.ts` の current back-fill 条件と CPU budget 処理を読む。
3. `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/implementation-guide.md` の「実 DB と仕様書の差分吸収」を確認する。

### Phase 2: DB 制約設計

1. `schema_questions(revision_id, stable_key)` の UNIQUE index 追加可否を検証する。
2. 既存 `unknown` / `__extra__:*` / nullable stableKey との整合ルールを決める。
3. migration と rollback 手順を作成する。

### Phase 3: 再開可能 back-fill 実装

1. alias 確定と back-fill 継続の状態を分離する。
2. CPU budget 超過時に `backfill_cpu_budget_exhausted` を返す。
3. 再実行で残件のみ処理する idempotent 条件を repository test で固定する。

### Phase 4: API contract / route 更新

1. retryable failure を HTTP status / response body に追加する。
2. route test で 409 / 422 / retryable failure の境界を固定する。

### Phase 5: 大規模実測

1. 10,000 行以上の `response_fields` fixture を staging D1 または wrangler 実環境で用意する。
2. dryRun / apply / retry の実測時間と batch 数を記録する。
3. CPU budget 超過が再現する場合は queue / cron 分割案を同タスク内で採用するか、明確な follow-up に分離する。

### Phase 6: 仕様同期

1. `aiworkflow-requirements` の API / DB / task workflow / index を同期する。
2. lessons learned に「DB schema grep と repository contract 照合」「再開可能 back-fill」の知見を追加する。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] 同一 revision stableKey collision が DB constraint または同等の二段防御で保証されている
- [ ] back-fill が途中失敗後に再実行で残件処理できる
- [ ] retryable failure が route から識別可能な response として返る

### 品質要件

- [ ] `apps/api/migrations/*.sql` と repository contract の照合結果が Phase 2 / Phase 4 / Phase 12 に記録されている
- [ ] 10,000 行以上の D1 / Workers 実測が Phase 11 evidence に残っている
- [ ] unit / route / workflow tests が stableKey collision、idempotent retry、CPU budget 超過を網羅している

### ドキュメント要件

- [ ] Phase 12 implementation guide に中学生レベル説明と技術者向け contract が記載されている
- [ ] `aiworkflow-requirements` の API / DB / workflow index が同期されている
- [ ] 今回の苦戦箇所と再発防止策が skill feedback または lessons learned に残っている

---

## 6. 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run \
  src/workflows/schemaAliasAssign.test.ts \
  src/services/aliasRecommendation.test.ts \
  src/routes/admin/schema.test.ts
```

期待: 全 PASS。collision / retryable failure / idempotent back-fill のテストが含まれる。

### 統合検証

```bash
rg "CREATE.*INDEX|schema_questions|response_fields" apps/api/migrations apps/api/src/repository
```

期待: migration と repository contract の stableKey / revision / response_fields 前提が一致している。

### 実環境検証

```bash
# staging D1 / Workers で 10000+ rows fixture を投入後に実行する
curl -sS -X POST "$STAGING_API/admin/schema/aliases?dryRun=true" \
  -H "Authorization: Bearer $ADMIN_SESSION_JWT" \
  -H "Content-Type: application/json" \
  -d '{"questionId":"<question_id>","stableKey":"<stable_key>"}'
```

期待: affected rows / conflict / retryable state が API contract 通りに返り、apply 再実行で残件が収束する。

---

## 7. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| UNIQUE index 追加時に既存データ重複で migration が失敗する | 高 | Phase 2 で事前検出 SQL と rollback 手順を作成し、重複解消なしに apply しない |
| back-fill と alias 確定を単一 transaction 前提で設計し、Workers CPU budget を超える | 高 | alias 確定と back-fill 継続を分離し、retryable response で再開可能にする |
| 実 DB schema と仕様書の差分を見落とす | 中 | Phase 1 / 2 / 12 で `apps/api/migrations/*.sql` と repository contract を grep 照合する |
| staging fixture が本番データ特性を再現しない | 中 | 10,000 行以上、同一 response_id collision、deleted member skip を含む fixture を用意する |

---

## 8. 参照情報

- `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/skill-feedback-report.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema.md`

---

## 9. 備考

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260430-091723-wt-1/apps/api/src/workflows/schemaAliasAssign.ts`
- 症状: 仕様書では `response_fields.questionId` / `response_fields.is_deleted` 前提だったが実 DB に該当カラムがなく、`__extra__:<questionId>` と `deleted_members` join で実装時に吸収する必要があった。
- 参照: `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/implementation-guide.md`

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260430-091723-wt-1/apps/api/src/repository/schemaQuestions.ts`
- 症状: revision-scoped stableKey collision は pre-check で検出しているが、DB UNIQUE index が未実装のため並列 apply への二段防御が不足している。
- 参照: `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/unassigned-task-detection.md`

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260430-091723-wt-1/apps/api/src/workflows/schemaAliasAssign.ts`
- 症状: in-memory D1 と 250 行級テストでは back-fill 挙動を固定できたが、10,000 行以上の Workers CPU budget 実測は未実施で、queue / cron 分割判断を先送りしている。
- 参照: `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/skill-feedback-report.md`
