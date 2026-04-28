# Phase 5: 実装本体（Forms Response Sync + Current Response Resolver）

## 概要

Phase 4 で定めたテスト戦略・テストマトリクスを満たす実装を `apps/api` 配下に投入した。
本ドキュメントでは「何を、どこに、なぜ置いたか」を一覧化し、Phase 6〜10 の検証フェーズに引き渡す。

実装と並行して `pnpm typecheck` / `pnpm vitest run` を継続的に green に保つことを完了条件とした。

## 成果物（実装）

| 種別 | パス | 役割 |
|------|------|------|
| migration | `apps/api/migrations/0005_response_sync.sql` | `schema_diff_queue.question_id` 部分 UNIQUE / `response_fields` index |
| job 本体 | `apps/api/src/jobs/sync-forms-responses.ts` | `runResponseSync` / `decideShouldUpdate` / `processResponse` / `classifyError` |
| カーソル | `apps/api/src/jobs/cursor-store.ts` | 直近成功 `sync_jobs.metrics_json.cursor` を読み戻す |
| マッパ | `apps/api/src/jobs/mappers/normalize-response.ts` | `MemberResponse → { known, unknown }` 二系統に分離 |
| マッパ | `apps/api/src/jobs/mappers/extract-consent.ts` | `publicConsent` / `rulesConsent` 抽出（`ruleConsent` legacy alias 含む） |
| route | `apps/api/src/routes/admin/responses-sync.ts` | `POST /admin/sync/responses` factory |
| repo | `apps/api/src/repository/responseFields.ts` (拡張) | `upsertKnownField` / `upsertExtraField`（`__extra__:<qid>` prefix） |
| entry | `apps/api/src/index.ts` (改修) | route mount + cron `*/15 * * * *` ディスパッチ |
| cron | `apps/api/wrangler.toml` (改修) | production / staging に `*/15 * * * *` を追加 |
| re-export | `packages/integrations/src/index.ts` | `GoogleFormsClient` / `createGoogleFormsClient` を公開 |

## 成果物（テスト）

| 種別 | パス | カバレッジ |
|------|------|------|
| unit | `apps/api/src/jobs/sync-forms-responses.test.ts` | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-8, AC-9, AC-10, failure |
| unit | `apps/api/src/jobs/sync-forms-responses.types.test.ts` | AC-7（brand 型混同を `tsc` で拒否） |
| unit | `apps/api/src/jobs/mappers/normalize-response.test.ts` | T-U-03 / T-U-04 / T-U-12 |
| unit | `apps/api/src/jobs/mappers/extract-consent.test.ts` | T-U-05 / T-U-07（legacy alias） |
| route | `apps/api/src/routes/admin/responses-sync.test.ts` | T-A-00 / T-A-01 / T-A-02 / T-A-03 + fullSync 透過 |
| fixture | `apps/api/src/jobs/__fixtures__/d1-fake.ts` | sync 専用最小 D1 fake（既存 MockStore は触らない） |

## キー実装決定

1. **lock semantics** — 既存 `sync_locks` テーブル (TTL 30 min) を `id='response-sync'` で再利用。`sync_jobs` の running 行とは独立に「同種 sync 二重起動」を防ぐ。`sync_locks` 取得失敗時は `runResponseSync` が `'skipped'` を返し、route が 409 にマッピングする（AC-6）。
2. **cursor 永続化** — Phase 3 代替案 A を採択し、新テーブルを追加せず `sync_jobs.metrics_json.cursor` に書き戻す。`cursor-store.ts` は最新 succeeded を `ORDER BY started_at DESC LIMIT 1` で参照する。
3. **system field の分離** — `normalize-response.ts` の `SYSTEM_STABLE_KEYS = new Set(["responseEmail"])` で `responseEmail` を `known` / `unknown` 双方から除外。`response_email` は `member_responses` 列に直接書く（不変条件 #3 / AC-4）。
4. **unknown question 重複 enqueue 抑止** — DB 側の partial UNIQUE で担保し、コード側は `enqueueDiff` を try/catch で握り潰す（AC-2）。
5. **写真ライク巨大 raw を載せない** — `normalize-response.ts` で `rawAnswersByQuestionId` を `JSON.stringify` するが、`MemberResponse` 段階で文字列化済みの値のみ受けるため二重圧縮は発生しない。
6. **`is_deleted=1` の retention** — `processResponse` 内で `findStatusByMemberId` を読み、`is_deleted === 1` のときは `setConsentSnapshot` を呼ばない（AC-9）。`current_response_id` の更新は実施する（identity 単位の最新性は保つ）。
7. **写経禁止の brand 安全性** — `MemberId` / `ResponseId` を `as` 経由で扱う箇所は最小限（`asMemberId(crypto.randomUUID())` の生成点と repository 境界のみ）。テストでは `@ts-expect-error` で混同を拒否する（AC-7 / T-U-11）。

## Phase 5 完了確認

- `mise exec -- pnpm typecheck` → 全パッケージで Done
- `mise exec -- pnpm vitest run` → 43 files / 324 tests 全 green
- 新規ファイルは全て `apps/api/src/...` または `packages/integrations/src/index.ts` に閉じる
- 直接 `wrangler` を呼ぶ箇所はなし（cron 設定は `wrangler.toml` のみ）

→ 詳細手順は `sync-runbook.md`、論理疑似コードは `pseudocode.md` を参照。
