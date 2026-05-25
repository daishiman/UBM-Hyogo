# Phase 4: テスト作成（TDD Red）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 名称 | テスト作成（TDD Red・recompute endpoint / workflow / web helper / UI の先行 spec 化） |
| 依存 | phase-03.md（設計レビュー GO） |
| 成果物 | 本ファイル（phase-04.md） |
| 状態 | spec_created |

## 目的

Phase 2/3 で確定した設計（migration `0020` / recompute endpoint 2 本 / `reverseBackfillResponseFields` / job repository / web helper / SchemaDiffPanel recompute UI）に対して、実装が存在しない状態で **必ず fail する** テストを先に書く。TDD Red を成立させ、Phase 5 実装の合格判定基準を固定する。AC-1〜AC-12（および AC-13 の spec 追記は Phase 12）を test に落とし込む。

## テストファイル一覧（phase-01 inventory の test 4 系統）

| ファイル | 変更種別 | 種別 | 既存 spec パターン参照元 |
| --- | --- | --- | --- |
| apps/api/src/workflows/schemaAliasRecompute.spec.ts | 新規 | workflow（D1 in-memory） | `apps/api/src/repository/schemaAliases.repository.spec.ts`（`setupD1` 利用） |
| apps/api/src/routes/admin/__tests__/schema.recompute.spec.ts | 新規 | endpoint（D1 in-memory + Hono `app.request`） | `apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts` |
| apps/web/src/lib/admin/__tests__/api.spec.ts | 編集 | web helper（`fetch` spy） | 既存 `rollbackSchemaAlias` 3 ケース（L475-521） |
| apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx | 編集 | UI component（RTL + `vi.mock` api） | 既存 `rollbackSchemaAliasMock` 配線 |

> **配置補正（実コード整合）**: phase-01 inventory は workflow test を `apps/api/src/workflows/__tests__/` と記すが、実コードの workflow spec（`schemaAliasAssign.contract.spec.ts` 等）は **`apps/api/src/workflows/` 直下**に置かれる慣習。本タスクも実慣習に揃え `apps/api/src/workflows/schemaAliasRecompute.spec.ts`（`__tests__` を挟まない）とする。endpoint spec は `apps/api/src/routes/admin/__tests__/` 直下（rollback spec と同列）。

## D1 テストのセットアップ方針（実コード準拠）

- workflow / endpoint spec はいずれも `apps/api/src/repository/__tests__/_setup.ts` の `setupD1()` を使う。`setupD1()` は `apps/api/migrations/*.sql` を**全件昇順で apply** するため、Phase 5 で `0020_schema_alias_recompute_jobs.sql` を追加すれば in-memory D1（Miniflare）に `schema_alias_recompute_jobs` テーブルが自動生成される。
- spec 冒頭は `// @vitest-environment node` を付ける（rollback spec と同一）。
- endpoint spec は `createAdminSchemaRoute()` + `app.request(path, init, makeEnv(env))`、認証は `adminAuthHeader()`（`../_test-auth`）を使う（rollback spec と同型）。
- alias / response_fields / audit_log / schema_diff_queue の seed は rollback spec の `insertAlias()` ヘルパーと同パターンで spec 内に定義する。response_fields は `INSERT INTO response_fields (response_id, stable_key, ...)` で直接 seed する。
- workflow spec は `env.ctx`（`DbCtx`）を直接 `schemaAliasRecompute(env.ctx, input)` に渡す。

## private 関数テスト方針

- `reverseBackfillResponseFields` は phase-02 recompute-algorithm.md で `export const` 指定のため、直接 import してテストできる（キャスト不要）。
- `findRollbackAuditId` / `countReverseTargets` が module 非公開（非 export）の場合は、workflow の公開関数 `schemaAliasRecompute` 経由の結果（`relatedRollbackAuditId` / `affectedCount`）で間接検証する。直接呼び出しが必要なら `(mod as unknown as { findRollbackAuditId: ... })` キャストで参照する（既存 spec で多用される最小キャスト方針）。
- repository（`createOrGetJob` / `updateJobStatus` / `getLatestJobByAlias`）は `export` 前提なので直接 import で検証する。

## テストケース（T-01〜T-12）

| ID | 対象ファイル | 検証内容 | 対応 AC | Red 期待（未実装で fail する理由） |
| --- | --- | --- | --- | --- |
| T-01 | schemaAliasRecompute.spec.ts | rollback 済み alias に対し `schemaAliasRecompute` 実行 → `response_fields.stable_key` が `alias.stableKey`（例 `full_name`）→ `__extra__:{aliasQuestionId}` に整復され、`affectedCount` / `processedCount` が seed 件数と一致 | AC-1 | `apps/api/src/workflows/schemaAliasRecompute.ts` が存在せず import 解決不能 |
| T-02 | schemaAliasRecompute.spec.ts | idempotency: 同一 server-derived triggerKey（`relatedRollbackAuditId` fallback `aliasId:version`）で `schemaAliasRecompute` を 2 回呼ぶ → 2 回目は既存 completed job と `recomputeAuditId` を冪等返却し `response_fields` の `__extra__` 件数が 1 回目と同一（二重変動なし） | AC-2 | workflow / job repository 未実装 |
| T-03 | schemaAliasRecompute.spec.ts | 衝突回避: 対象 response に既に `__extra__:{qid}` 行が存在する状態で recompute → `stable_key=full_name` 行は DELETE され UNIQUE 違反せず完了、`__extra__` 行が 1 行のみ残る | AC-1 / 不変条件6 | `reverseBackfillResponseFields` 未実装 |
| T-04 | schemaAliasRecompute.spec.ts | CPU budget exhausted → running 継続: `reverseBackfillResponseFields(..., cpuBudgetMs=0)` で `status="exhausted"` / `cursor` 非 null を返し、`schemaAliasRecompute` の job が `running` のまま残る。再呼び出し（通常 budget）で `completed` へ遷移し残件が整復される | AC-8 | workflow / exhausted 分岐未実装 |
| T-05 | schemaAliasRecompute.spec.ts | not_rolled_back: `deleted_at IS NULL`（未 rollback）の alias に recompute → `SchemaAliasRecomputeFailure` kind=`not_rolled_back` を throw し `response_fields` が無変更 | AC-1（rollback 後限定） | failure class / ガード未実装 |
| T-06 | schema.recompute.spec.ts | POST happy: rollback 済み alias seed → `POST /schema/aliases/:id/recompute` が 200 + `{ jobId, aliasId, status:"completed", affectedCount, processedCount, recomputeAuditId, relatedRollbackAuditId }` を返す | AC-1 | endpoint 未追加 → 404（route 不在） |
| T-07 | schema.recompute.spec.ts | 冪等返却: 同 alias へ 2 回 POST → 2 回目も 200 で同一 `jobId`、`response_fields` の `__extra__` 件数が増えない | AC-2 | endpoint / job UNIQUE 未実装 |
| T-08 | schema.recompute.spec.ts | not_found 404: 存在しない aliasId へ POST → 404 `{ error: "not_found" }` | AC-1 | endpoint 未追加 |
| T-09 | schema.recompute.spec.ts | not_rolled_back 409: `deleted_at IS NULL` の alias へ POST → 409 `{ error: "not_rolled_back" }` | AC-1 | endpoint / ガード未実装 |
| T-10 | schema.recompute.spec.ts | GET status: recompute 実行後 `GET /schema/aliases/:id/recompute` が `{ jobId, status, affectedCount, processedCount, lastError, updatedAt }` を返す。job 不在 alias は body `null` を返す | AC-4 | GET endpoint 未追加 |
| T-11 | schema.recompute.spec.ts | audit 行: recompute 200 後 `audit_log` に `action='schema_alias.recompute'` の行が 1 件存在し、`after_json` に `jobId` / `affectedCount` / `processedCount` / `relatedRollbackAuditId` / `reason` を含む | AC-3 | audit insert 未実装 |
| T-12 | api.spec.ts | web helper: `recomputeSchemaAlias({aliasId})` が `POST /api/admin/schema/aliases/{enc}/recompute` を呼び body `{reason}` を送る（success 200、client は `triggerKey` を送らない）／ 409 を `RecomputeApiError`（status/code）へ変換／ network error を status=0 へ変換。`getSchemaAliasRecomputeStatus(aliasId)` が body `null` の時 `null` を返す | AC-9 / AC-12 | helper / `RecomputeApiError` 未追加 → undefined function |

### UI component ケース（T-13U〜T-15U・既存 spec へ追記）

| ID | 対象 | 検証内容 | 対応 AC | Red 期待 |
| --- | --- | --- | --- | --- |
| T-13U | SchemaDiffPanel.component.spec.tsx | `recomputeSchemaAlias` を `vi.mock` し `data-role="recompute-trigger"` ボタン押下 → mock が `{ aliasId }` で呼ばれる（admin 明示操作でのみ起動・自動実行なし） | AC-5 | recompute ボタン / 配線未実装（`recompute-trigger` 要素なし） |
| T-14U | SchemaDiffPanel.component.spec.tsx | mutation promise pending の submitting 中はボタンが `disabled`、API が `status:"running"` を返した後は `data-role="recompute-status"` が running バッジを表示し「再集計を続行」ボタンが押下可能 | AC-6 / AC-8 | UI 状態機械未実装 |
| T-15U | SchemaDiffPanel.component.spec.tsx | mock が reject（`RecomputeApiError`）→ `data-role="recompute-status"` が failed、`data-role="recompute-error"` に lastError 表示、再試行ボタン押下可。旧 `data-role="recompute-warning"` が DOM に存在しない | AC-6 | warning 未置換 |

> UI ケースは phase-01 命名規則表の `recompute-action` / `recompute-status` / `recompute-trigger` data-role、ui-state-machine.md の状態遷移に整合させる。`recomputeSchemaAlias` を既存 `rollbackSchemaAliasMock` と同パターンで `vi.mock("../../../lib/admin/api")` に追加する。mutation は `@/features/admin/hooks/useAdminMutation` 経由（legacy `@/lib/useAdminMutation` を import しない / AC-9）。

## targeted run コマンド（phase-01 リスト準拠・実 package 名で確定）

実 package 名は `@ubm-hyogo/api` / `@ubm-hyogo/web`。全件 `pnpm test` ではなく path 指定で targeted run する:

```bash
# api: workflow（in-memory D1）
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/workflows/schemaAliasRecompute.spec.ts
# api: endpoint
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/routes/admin/__tests__/schema.recompute.spec.ts
# web: helper
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/lib/admin/__tests__/api.spec.ts
# web: UI component
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx
```

> `--filter <pkg> test <path>` の `test` script は `vitest run ... --root=../.. --config=vitest.config.ts <scope>` を実行する。workflow / endpoint の D1 spec は `// @vitest-environment node` を付与し `setupD1()` が migrations を apply するため、unit config（`vitest.config.ts`）でそのまま動く（rollback spec と同経路）。

## TDD Red 確認（このフェーズの終了状態）

- T-01〜T-12 / T-13U〜T-15U がいずれも **fail**（import 解決不能 / 関数 undefined / route 404 / DOM 要素不在）することを確認し、Red を記録する。
- spec 命名は全て `*.spec.{ts,tsx}`（`*.test` 禁止 / AC-11 / CLAUDE.md #8）。lefthook `block-test-suffix` を通過する。

## 完了条件 (DoD)

- [ ] workflow spec（`schemaAliasRecompute.spec.ts`）が T-01〜T-05 を実装し全て Red
- [ ] endpoint spec（`schema.recompute.spec.ts`）が T-06〜T-11 を実装し全て Red
- [ ] web helper spec（`api.spec.ts` 追記）が T-12 を実装し Red
- [ ] UI component spec（`SchemaDiffPanel.component.spec.tsx` 追記）が T-13U〜T-15U を実装し Red
- [ ] 全 spec が `*.spec.{ts,tsx}` 命名（AC-11）
- [ ] D1 spec が `setupD1()` + `// @vitest-environment node` で構成（実コード慣習準拠）
- [ ] targeted run コマンドが実 package 名（`@ubm-hyogo/api` / `@ubm-hyogo/web`）で記録されている
- [ ] 各テストケースに対応 AC（AC-1〜AC-9 / AC-11 / AC-12）が紐付いている
