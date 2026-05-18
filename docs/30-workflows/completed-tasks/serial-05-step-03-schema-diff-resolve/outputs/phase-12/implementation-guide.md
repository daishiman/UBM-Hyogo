**[実装区分: 実装仕様書]**

# Phase 12 — Implementation Guide (serial-05-step-03-schema-diff-resolve)

## Part 1 — 中学生レベル概念説明

### なぜ必要か

学校の出席表を想像してください。先生が「山田太郎」という名前を「山田 太郎（漢字）」に書き直したとき、同じ人なのか別の人なのか、表だけを見ると迷うことがあります。会員サイトでも同じで、Google フォームの質問文が変わると、システムは「これは前からある質問と同じものか」を判断しにくくなります。

このズレを放置すると、会員の答えが正しい場所に入らなかったり、管理画面で見つけにくくなったりします。そこで管理者が画面で「この新しい質問は、前のこの項目と同じです」と結び付けます。

### 何をするか

`/admin/schema` 画面には、すでに質問のズレを一覧で見る `SchemaDiffPanel` があります。このタスクでは、新しい画面を一から作るのではなく、今ある画面をより確実に動くように整えます。

管理者はズレの一覧を見て、正しい内部名を入力して保存します。保存に成功した場合、途中で続きが必要な場合、すでに別の項目に使われていた場合を、それぞれ別のメッセージで分かるようにします。

### 専門用語セルフチェック

| 用語 | 日常語での言い換え |
| --- | --- |
| schema | 質問表の決まり |
| diff | 前と今の違い |
| stableKey | システムの中で使う変わりにくい名前 |
| alias | 別名として結び付けること |
| queued | まだ処理待ちの状態 |
| resolved | 解決済みの状態 |

## Part 2 — 技術者レベル設計

### 2.1 Current Topology

```text
apps/web/app/(admin)/admin/schema/page.tsx
  fetchAdmin<SchemaDiffListView & { sections?: FormSection[] }>("/admin/schema/diff")
  -> <SchemaDiffPanel initial={data} />

apps/web/src/components/admin/SchemaDiffPanel.tsx
  4 panes: added / changed / removed / unresolved
  local state: active / stableKey / busy / feedback
  postSchemaAlias()

apps/web/src/lib/admin/api.ts
  browser proxy POST /api/admin/schema/aliases

apps/api/src/routes/admin/schema.ts
  Worker GET /admin/schema/diff
  Worker POST /admin/schema/aliases
```

### 2.2 API Contract

#### Browser proxy `GET /api/admin/schema/diff` → Worker `GET /admin/schema/diff`

Response 200:

```json
{
  "total": 1,
  "items": [
    {
      "diffId": "d-001",
      "revisionId": "rev-001",
      "type": "added",
      "questionId": "q-xxx",
      "stableKey": null,
      "label": "氏名（漢字）",
      "suggestedStableKey": "full_name",
      "status": "queued",
      "resolvedBy": null,
      "resolvedAt": null,
      "createdAt": "2026-05-16T00:00:00.000Z"
    }
  ]
}
```

#### Browser proxy `POST /api/admin/schema/aliases` → Worker `POST /admin/schema/aliases`

Request:

```json
{
  "diffId": "d-001",
  "questionId": "q-xxx",
  "stableKey": "full_name"
}
```

Response 200:

```json
{ "ok": true, "mode": "apply", "confirmed": true, "backfill": { "status": "completed", "remaining": 0 } }
```

Response 202 retryable continuation:

```json
{ "ok": true, "mode": "apply", "confirmed": true, "backfill": { "status": "exhausted", "remaining": -1, "retryable": true, "code": "backfill_cpu_budget_exhausted" } }
```

Response 409 conflict:

```json
{ "ok": false, "error": "alias already assigned", "existingStableKey": "full_name" }
```

Response 422 collision:

```json
{ "ok": false, "code": "stable_key_collision", "error": "stableKey collision", "existingQuestionIds": ["q-old"] }
```

### 2.3 Component Responsibilities

| File | Responsibility |
| --- | --- |
| `page.tsx` | server-side fetch + section fallback + render |
| `SchemaDiffPanel.tsx` | 4 pane display, row selection, form state, feedback rendering |
| `api.ts` | `postSchemaAlias()` and retryable continuation predicate |
| `server-fetch.ts` | `fetchAdmin()` and task fixture route for `/admin/schema/diff` |

### 2.4 Error Handling

| Case | UI behavior |
| --- | --- |
| 200 apply | `data-feedback-kind="success"` and `router.refresh()` |
| 202 retryable continuation | `data-feedback-kind="retryable"`; form remains usable |
| 409 conflict | `data-feedback-kind="conflict_error"` |
| 422 stable_key_collision | `data-feedback-kind="validation_error"` |
| network / 5xx | `data-feedback-kind="error"` |

POST 422 / 409 / 202 are not read-only fallback triggers. New env gate `ADMIN_SCHEMA_RESOLVE_ENABLED` is not introduced.

### 2.5 Test Plan

- `SchemaDiffPanel.component.spec.tsx`: render, selection, questionId missing, 200 / 202 / 409 / 422 feedback.
- `api.spec.ts`: `postSchemaAlias()` path and retryable continuation predicate.
- E2E smoke: `PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1 mise exec -- pnpm e2e:smoke -- admin-schema-diff-resolve`.

### 2.6 Known Limits

- System spec update is no-op unless a later implementation wave changes API shape or UI-visible contract.
- Commit / push / PR remain user-gated.

### 2.7 Implementation delta in this wave

本 wave は `implemented-local-runtime-pending` として、仕様書 13 phases に加え、既存 `SchemaDiffPanel` hardening も同梱する。

| 種別 | 変更 |
| --- | --- |
| Hardening | `apps/web/src/components/admin/SchemaDiffPanel.tsx`: API 側と同一 regex `/^[a-zA-Z][a-zA-Z0-9_]*$/` で stableKey を client-side 検証。input には `pattern` / `aria-invalid` / `aria-describedby`、送信時に不正値なら `postSchemaAlias()` を呼ばず `data-feedback-kind="validation_error"` を表示。422 サーバ往復前に明らかな入力ミスを弾く。 |
| Test | `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`: UI-06 を追加（不正値で submit→`postSchemaAlias` not called / `aria-invalid=true` / validation_error feedback / 修正後 disabled 解除）。 |
| API contract | 変更なし。`/admin/schema/diff` の `{ total, items }` / 200・202・409・422 は既存仕様のまま。新規 endpoint / env gate なし。 |
| Token / env | OKLch / `getEnv()` 不変条件は維持（grep gate match=0）。 |

Evidence (5 点セット, `outputs/phase-11/evidence/`):

- `typecheck.log` EXIT_CODE=0
- `lint.log` EXIT_CODE=0
- `test.log` Tests 31 passed（focused: `SchemaDiffPanel.component.spec.tsx` + `api.spec.ts`）EXIT_CODE=0
- `build.log` `pnpm --filter @ubm-hyogo/web build`（OpenNext workers bundle）
- `grep-gate.log` EXIT_CODE=0（changed production files の新規違反 0 件。既存 `server-fetch.ts` fallback baseline は明示記録）

Screenshots: Issue #775 recovery workflow で `outputs/phase-11/manifest.json` の `screenshots.status="completed"` に昇格済み。11 PNG は fixture-backed local runtime evidence として取得し、legacy `admin-schema-diff-list.placeholder.txt` は PASS screenshot inventory から除外する。real D1 / staging smoke はこの PASS 境界の外側で、commit / push / PR と同じく user-gated。
