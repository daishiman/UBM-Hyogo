# Phase 13 — PR Summary（spec ドラフト / 実 PR 作成は user 明示承認後）

> 本ファイルは PR 本文の **spec ドラフト**である。`git push` / `gh pr create` は **user 明示承認後のみ**実行する（CLAUDE.md「PR 作成の完全自律フロー」/ artifacts.json `user_gated_operations`）。本タスク仕様書作成フェーズでは push / PR を実行しない。

## PR タイトル案

```
feat(issue-836): schema alias rollback 後の recompute トリガー（reverse-backfill + audit + UI）
```

## Base ブランチ

`dev`（CLAUDE.md 既定。production リリース時のみ `dev → main`）

## ブランチ

- 実装込み: `feat/issue-836-schema-alias-recompute-trigger`
- spec のみ: `docs/issue-836-schema-alias-recompute-trigger-spec`

（artifacts.json `user_gated_operations` の push 先と整合）

---

## PR 本文ドラフト

### 概要

`/admin/schema` の SchemaDiffPanel から、rollback 済み schema alias の `response_fields` を **API + 監査ログ経由で再集計（reverse-backfill）** できる経路を追加する。rollback 後に古い `stable_key` が残存して集計が汚染される問題を、admin 明示トリガーの idempotent な reverse-backfill（+ audit_log + job status 追跡）で解消する。

### 背景（Issue #836 を最新コードに最適化）

- Issue #836（CLOSED 2026-05-23・linked PR / comment なし）を **コード実態を一次根拠に**鮮度調査した結果、recompute 実行 API / workflow / audit action / 実行 UI はいずれも**未実装**（`SchemaDiffPanel.tsx:248-250` の warning text のみ）と確定。他タスクでも未解決。
- 原典が想定した「派生集計 view / テーブル」は現コードに**未実在**。実体としての派生データは `response_fields.stable_key` であり、recompute の正体は resolve 時 `backfillResponseFields()`（`schemaAliasAssign.ts:192-277`）の **逆操作（reverse-backfill）**。`alias.stableKey` → `__extra__:{aliasQuestionId}` へ戻す。
- CLOSED Issue は **reopen せず**、本 PR で local implementation + 正本同期まで完結する（`spec_creation_strategy = optimize_to_current_codebase`）。

### 変更内容

| 種別 | パス | 内容 |
| --- | --- | --- |
| migration | `apps/api/migrations/0020_schema_alias_recompute_jobs.sql` | `schema_alias_recompute_jobs` テーブル新規。`UNIQUE(alias_id, stable_key, trigger_key)` + `idx_schema_alias_recompute_jobs_alias`（AC-7） |
| workflow | `apps/api/src/workflows/schemaAliasRecompute.ts` | `reverseBackfillResponseFields`（chunk + CPU budget + 衝突回避）/ idempotency 判定 / audit_log insert（`schema_alias.recompute`）（AC-1, AC-2, AC-3, AC-8） |
| repository | `apps/api/src/repository/schemaAliasRecomputeJobs.ts` | `createOrGetJob` / `updateJobStatus` / `getLatestJobByAlias`（AC-2, AC-4） |
| endpoint | `apps/api/src/routes/admin/schema.ts` | `POST /admin/schema/aliases/:aliasId/recompute`（job 作成 + 実行）/ `GET /admin/schema/aliases/:aliasId/recompute`（直近 job status・不在時 null）（AC-1, AC-4） |
| web helper | `apps/web/src/lib/admin/api.ts` | `recomputeSchemaAlias` / `getSchemaAliasRecomputeStatus` / `RecomputeApiError`（`RollbackApiError` と同パターン） |
| web UI | `apps/web/src/components/admin/SchemaDiffPanel.tsx` | warning（248-250）→ 実 recompute 実行ボタン + status バッジ（pending/running/completed/failed）。`submitting` 中のみ disable、server `running` は続行可。`useAdminMutation` 経由（AC-5, AC-6, AC-9） |
| spec | `docs/00-getting-started-manual/specs/11-admin-management.md` | recompute 操作仕様（権限・実行契機・status バッジ・idempotency・audit 記録項目）追記（AC-13） |
| spec | `docs/00-getting-started-manual/specs/01-api-schema.md` | recompute endpoint 2 本（path / request / response / error）追記（AC-13） |
| docs | `docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/**` | 本ワークフロー仕様書一式 |

### AC 充足サマリ（Local Acceptance）

| AC | 内容 | 担保 |
| --- | --- | --- |
| AC-1 | `POST .../recompute` が job 作成 + reverse-backfill（`stableKey` → `__extra__:{qid}`） | `schema.recompute.spec.ts` happy path |
| AC-2 | idempotency: 同一 `(alias_id, stable_key, trigger_key)` 2 回実行で二重変動なし | `schemaAliasRecompute.spec.ts`「2 回 == 1 回」 |
| AC-3 | 成功時 `audit_log` に `schema_alias.recompute`（`after_json` に jobId / affectedCount / processedCount / updatedCount / deletedCollisionCount / relatedRollbackAuditId） | `schema.recompute.spec.ts` audit 行検証 |
| AC-4 | `GET .../recompute` が直近 job status / count / lastError、不在時 null | `schema.recompute.spec.ts` status GET |
| AC-5 | rollback 自動連動なし。admin 明示ボタン押下でのみ起動 | `SchemaDiffPanel.component.spec.tsx` 配線検証 |
| AC-6 | `data-role="recompute-warning"` を実行 UI（ボタン + status バッジ）へ置換。submitting 中のみ disable、server `running` は続行可 | `SchemaDiffPanel.component.spec.tsx` happy / submitting disable / running continue / failed |
| AC-7 | migration が `UNIQUE(alias_id, stable_key, trigger_key)` を持つ | `PRAGMA table_info` / `index_list` |
| AC-8 | CPU budget exhausted 時 `running` + cursor 保持で再開可能 | `schemaAliasRecompute.spec.ts` exhausted→再開 |
| AC-9 | web 呼び出しは `@/features/admin/hooks/useAdminMutation` 経由（legacy 不参照） | UI spec + import 確認 |
| AC-10 | OKLch token のみ（status バッジ含め HEX / `bg-[#xxx]` なし） | `verify-design-tokens` CI gate |
| AC-11 | 新規 test は `*.spec.{ts,tsx}` 命名のみ | lefthook `block-test-suffix` |
| AC-12 | D1 直接アクセス禁止（`apps/web` から binding 直叩きなし・`lib/admin/api.ts` 経由） | topology 境界 |
| AC-13 | `11-admin-management.md` / `01-api-schema.md` に recompute 仕様追記 | Phase 12 system-spec-update-summary |

### Runtime Acceptance（RAC-1〜3 / user-gated・runtime_pending）

> 以下は staging 環境での実行を伴うため **user 明示承認後**に取得する。Gate-C（artifacts.json）は `pending`。本 PR では evidence プレースホルダのみ。

| RAC | 内容 | 状態 |
| --- | --- | --- |
| RAC-1 | staging で `bash scripts/cf.sh d1 migrations apply` 後、`PRAGMA table_info(schema_alias_recompute_jobs)` にカラム存在の evidence MD | runtime_pending（user-gated） |
| RAC-2 | staging `/admin/schema` で dummy alias の resolve → rollback → recompute を実行し、`audit_log` に 3 行・`response_fields` が `__extra__:{qid}` へ戻る runtime evidence（screenshot + SQL 結果） | runtime_pending（user-gated） |
| RAC-3 | Playwright visual baseline に SchemaDiffPanel recompute ボタン + status バッジの screenshot 追加（task-18 visual-full required check 整合） | runtime_pending（user-gated） |

### テスト（4 系統 spec）

- [ ] `apps/api/src/routes/admin/__tests__/schema.recompute.spec.ts`（新規）— endpoint happy / idempotent re-run / not-found / status GET / audit insertion
- [ ] `apps/api/src/workflows/schemaAliasRecompute.spec.ts`（新規）— reverse-backfill 件数 / idempotency / 衝突回避 / CPU budget exhausted 分岐
- [ ] `apps/web/src/lib/admin/__tests__/api.spec.ts`（追記）— `recomputeSchemaAlias` / `getSchemaAliasRecomputeStatus`
- [ ] `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`（追記）— 再集計ボタン happy / submitting disable / running continue / failed 表示

> 全件 `pnpm test` ではなく上記 4 ファイルを targeted run（FB-UI-02-2 / メモリ制約対策）。spec ドラフト段階のためチェックは未充足（`[ ]`）。

### 視覚証跡（VISUAL）

- Phase 11 screenshot canonical 名: `schema-diff-panel-recompute-<state>.png`（`<state>` = `idle` / `running` / `completed` / `failed`）。
- 実画像は staging runtime（RAC-3）で取得し、user 承認後に PR 本文へ参照を反映する。本 spec 段階では実画像未取得のため画像参照プレースホルダのみ。

### 互換性 / 不変条件

- **破壊的変更なし**: 既存 resolve / `/rollback` endpoint は touch せず、recompute は別 path namespace で追加。`schemaAliasRollback.ts` に自動連動は追加しない（AC-5）。
- **D1 直接アクセスなし**: `apps/web` から D1 binding を直叩きしない。すべて `lib/admin/api.ts` 経由（CLAUDE.md #5 / AC-12）。
- **OKLch token のみ**: status バッジ含め HEX / `bg-[#xxx]` 直書きなし（AC-10）。

### 関連 Issue

- `Refs: #836`（**CLOSED 維持 / reopen しない**。`Closes` / `Fixes` / `Resolves` は使わない）

---

## Test plan（実 PR 作成時のチェック・user 承認後に充足）

- [ ] `mise exec -- pnpm install --force`
- [ ] `mise exec -- pnpm typecheck` 0 error
- [ ] `mise exec -- pnpm lint` 0 error
- [ ] `bash scripts/verify-pr-ready.sh` PASS（gate-metadata:validate / verify:phase12-compliance / indexes:rebuild drift）
- [ ] `git diff dev...HEAD --name-only` が実装範囲・Phase 文書と一致

## PR 本文末尾フッタ（実 PR 作成時に付与）

> 実 `gh pr create` 時、PR 本文末尾に以下を付与する:

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## ユーザー承認待ち

`git push` / `gh pr create --base dev` / `bash scripts/cf.sh d1 migrations apply` は **user 明示承認後**に実施。本フェーズでは Markdown 仕様書作成のみ。secret 実値・Cloudflare token・D1 binding 実値は本ファイルに一切記載しない。
