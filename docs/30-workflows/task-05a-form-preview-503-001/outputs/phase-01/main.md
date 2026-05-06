# Phase 1 本文 — 要件定義

## 1. 背景と現状

- staging API `https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview` が **HTTP 503** を返す。
- 他の `/public/*`（`/public/members`, `/public/stats` 等）は 200 を返している。
- `/register` ページは `fetchPublic('/public/form-preview')` を呼び出して UI を構築するため、本問題の影響により register 画面が機能しない可能性。
- 503 の発生源（コード上の単一分岐）は `apps/api/src/use-cases/public/get-form-preview.ts` の以下:

```ts
const manifest = await getLatestVersion(ctx, formId);
if (!manifest) {
  throw new ApiError({
    code: "UBM-5500",
    detail: "公開可能な schema_versions が未投入です。schema sync 完了後に再実行してください。",
  });
}
```

- `packages/shared/src/errors.ts` の `UBM_ERROR_CODES` で `UBM-5500` は `status: 503, title: "Service Unavailable"` にマップされている。
- すなわち 503 は「`getLatestVersion()` が `null` を返した」ことの直接的な現れであり、コード分岐は 1 箇所に閉じている。

## 2. 受け入れ条件 (AC)

| ID | 条件 | evidence path |
| --- | --- | --- |
| AC-1 | staging `/public/form-preview` が **HTTP 200** を返す | `outputs/phase-11/staging-form-preview-200.txt`（curl 結果） |
| AC-2 | production `/public/form-preview` が **HTTP 200** を返す | `outputs/phase-11/prod-form-preview-200.txt` |
| AC-3 | staging `/register` が **HTTP 200** を返す | `outputs/phase-11/manual-smoke-log.md` |
| AC-4 | `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` の欠落/正常/空 questions/route mapping ケースが green | `outputs/phase-11/manual-smoke-log.md` |
| AC-5 | root cause が evidence 付きで A/B/C のいずれか 1 件に確定し、再発防止策が `implementation-guide.md` に記述される | `outputs/phase-12/implementation-guide.md` |
| AC-6 | Phase 12 strict 7 files（`main.md` + 6 補助成果物）が揃う | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 3. Scope

### In Scope

- `wrangler tail --env staging` による error stack 取得と分析。
- staging D1 (`ubm-hyogo-db-staging`) の `schema_versions` / `schema_questions` レコード状態確認。
- staging Worker の `GOOGLE_FORM_ID` / `FORM_ID` env / D1 binding 構成確認。
- 必要に応じた seed migration 投入 or schema sync runbook 実行。
- `apps/api/src/use-cases/public/get-form-preview.ts` の 503 分岐に対する **テスト追加**（編集は「不要」を第一選択肢とする）。
- production の `schema_versions` を export し、staging へ同期する場合の差分確認。
- `/register` ページの動作確認。

### Out of Scope

- `/public/form-preview` の **API 仕様変更**（response schema 変更・新規フィールド追加）禁止。
- `apps/web` から D1 への直接アクセス追加禁止。
- form-preview 以外の public route の修正。
- Google Form 構造そのものの変更。

## 4. 不変条件（CLAUDE.md 由来 / 本タスクで遵守）

1. 実フォームの schema をコードに固定しすぎない（`schema_versions` × `schema_questions` を runtime で読む現行実装を維持）。
2. D1 への直接アクセスは `apps/api` に閉じる。
3. schema は `schema_versions` × `schema_questions` に集約する。
4. Cloudflare CLI は **必ず** `bash scripts/cf.sh` 経由で実行する（`wrangler` 直接呼び出し禁止）。
5. `.env` の中身を `cat`/`Read` しない。実値はログ・ドキュメントに転記しない。

## 5. Approval Gate / 自走禁止操作

| 操作 | 理由 | gate |
| --- | --- | --- |
| production D1 への migration apply | 本番影響 | ユーザー承認後に Phase 11 で実行 |
| staging D1 への seed migration 投入 | データ整合性 | Phase 5 設計レビュー後に実行可 |
| `wrangler tail` の長時間実行 | コスト / log 量 | 5 分以内で打ち切り |

## 6. 主要参照

- `docs/30-workflows/unassigned-task/task-05a-form-preview-503-001.md`
- `apps/api/src/use-cases/public/get-form-preview.ts`
- `apps/api/src/repository/schemaVersions.ts`
- `packages/shared/src/errors.ts`
- `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-PRD-005`
- GitHub Issue #388
