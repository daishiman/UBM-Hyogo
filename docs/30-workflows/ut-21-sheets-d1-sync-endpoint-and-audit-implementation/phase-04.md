# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 sync endpoint 実装と audit logging (UT-21) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-29 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | spec_created |
| タスク状態 | blocked（GitHub Issue #30 は CLOSED でも仕様書 blocked） |
| タスク分類 | specification-design（test-strategy） |

## 目的

Phase 3 で確定した base case（audit best-effort + outbox 蓄積、SYNC_ADMIN_TOKEN Bearer、`runSync` pure function 化、Workers `crypto.subtle` RS256）に対して、Phase 5 実装着手前に必要な検証スイート（Vitest unit / contract / authorization / scheduled handler）を設計し、TDD Red サイクルで投入するファイル一覧・命名規則・private method テスト方針・事前ビルド確認手順までを揃え、Phase 5 で「迷わず Red→Green→Refactor」が回せる状態にする。03-serial `data-contract.md` との差分ゼロを contract test で固定することを最優先軸とする。

## 実行タスク

1. 検証スイート 4 種類（Vitest unit / contract / authorization / scheduled handler）の対象モジュールと観点を確定する（完了条件: モジュール × 検証種別のマトリクスに空セルが無い）。
2. Vitest targeted run のテストファイルパスを事前列挙する（完了条件: `apps/api/test/sync/*.test.ts` 等のフルパスが列挙され、SIGKILL 回避のため広域実行を排除）。
3. private method テスト方針（pure function 切り出し優先、`as unknown as` キャストは最終手段）を明記する（完了条件: 各モジュールで採用する方針が記録される）。
4. TDD Red 実行前の命名規則整合チェック手順を定義する（完了条件: 既存 `apps/api/src/sync/` 命名と差分ゼロを保証する手順が文書化）。
5. 事前ビルドチェック（`mise exec -- pnpm install` + `mise exec -- pnpm --filter ./apps/api build`）の手順を Red 実行前に組み込む（完了条件: esbuild darwin mismatch 対策が runbook 化）。
6. coverage 計測対象ファイルの allowlist を決定する（完了条件: `apps/api/src/sync/*.ts` のみを対象に line 80%+ / branch 70%+ を達成する vitest 設定が指定可能）。
7. 03-serial `data-contract.md` との差分ゼロを保証する contract test を独立スイートとして配置する（完了条件: 5点同期チェック（COL 定数 / response_id 生成方式 / upsert 列順 / audit 列順 / outbox 列順）の全項目を Vitest snapshot で固定）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-02.md | モジュール設計を検証対象にマップ |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-03.md | base case と open question を取り込む |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md | contract test の正本 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md | scheduled handler / `runSync` 単体テストの状態遷移基準 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/sync*` 認可テスト基準 |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | SYNC_ADMIN_TOKEN Bearer 認可 |
| 参考 | https://vitest.dev/guide/coverage.html | coverage 設定 |
| 参考 | https://developers.cloudflare.com/workers/testing/vitest-integration/ | `@cloudflare/vitest-pool-workers` |

## 検証スイート設計

### 1. Vitest unit テスト（純粋ロジック単位）

| 対象モジュール | テスト観点 | 想定ファイル |
| --- | --- | --- |
| `apps/api/src/sync/mapper.ts` | `mapRowToSheetRow` の境界値（空セル / undefined / 全フィールド埋め）、COL 定数固定、`responseEmail` を system field として注入、`exactOptionalPropertyTypes=true` 整合（`string | undefined` 維持） | `apps/api/test/sync/mapper.test.ts` |
| `apps/api/src/sync/mapper.ts` | `generateResponseId` の SHA-256 冪等性（同入力 → 同出力 / 入力差分 → 出力差分）、Workers `crypto.subtle.digest("SHA-256", ...)` 互換 | `apps/api/test/sync/mapper.response-id.test.ts` |
| `apps/api/src/sync/sheets-client.ts` | JWT 署名の `crypto.subtle.importKey` 経路（`extractable: false` / RSASSA-PKCS1-v1_5 SHA-256）、PEM ヘッダ除去、access_token キャッシュ TTL | `apps/api/test/sync/sheets-client.test.ts` |
| `apps/api/src/sync/worker.ts` | `runSync` の冪等性（同一データ 2 回呼び出しで重複 0 件）、batch 100 件分割、`upsertRow` の `INSERT ... ON CONFLICT(response_id) DO UPDATE` SQL 文字列 | `apps/api/test/sync/worker.run-sync.test.ts` |
| `apps/api/src/sync/worker.ts` | `writeAuditLog` 失敗時に `sync_audit_outbox` への蓄積が走り、主データ upsert はロールバックされない（best-effort 方針） | `apps/api/test/sync/worker.audit-outbox.test.ts` |
| `apps/api/src/sync/worker.ts` | `runBackfill` の range 計算と pagination 終端 | `apps/api/test/sync/worker.backfill.test.ts` |

### 2. contract テスト（03-serial `data-contract.md` 差分ゼロ保証）

| 対象 | 検証内容 |
| --- | --- |
| COL 定数固定 | `mapper.ts` の COL 定数 31 項目が 03-serial `data-contract.md` 準拠であることを Vitest snapshot で固定 |
| response_id 生成式 | `generateResponseId` の入力（formId + responseId 等）と SHA-256 出力が `data-contract.md` 「冪等キー」節と完全一致 |
| `member_responses` upsert 列順 | `INSERT ... ON CONFLICT(response_id) DO UPDATE` SQL 文字列 snapshot |
| `sync_job_logs` 列定義 | required column（`started_at`, `finished_at`, `status`, `fetched_count`, `upserted_count`, `failed_count`, `error_reason`, `trigger`）の型・順序 |
| `sync_audit_outbox` 列定義 | required column（`id`, `event_type`, `payload_json`, `created_at`, `retry_count`, `last_error`）と best-effort 方針整合 |
| `POST /admin/sync` API 契約 | request: 空 body 許容、response: `{ ok, result: { status, fetched, upserted, failed, durationMs, auditWritten, outboxQueued } }` |
| `POST /admin/sync/responses` API 契約 | request: `{ ranges?: string[] }`、response: manual と同型 |
| `GET /admin/sync/audit` API 契約 | response: `{ items: AuditLog[], nextCursor?: string }` |
| 不変条件 #1 / #4 / #5 | Sheets schema が `mapper.ts` を越えて染み出していない / admin-managed data 専用テーブル / D1 access が `apps/api/src/sync/*` に閉じている、をテストファイル import グラフで検証 |

### 3. authorization テスト（`/admin/sync*` ルート全 3 本）

| ケース | 期待 |
| --- | --- |
| Auth.js セッション有 + admin role 有 + CSRF token 一致 | 200 + 同期実行 |
| Auth.js セッション有 + admin role なし | 403 |
| Auth.js セッション無 | 401 |
| CSRF token 不一致 | 403 |
| 既に lock 取得済みでの並行 manual 呼び出し | 409 |
| `GET /admin/sync/audit` への non-admin GET | 403（read も admin 限定） |

### 4. scheduled handler テスト（`runSync` pure function 化方針の活用）

| シナリオ | 構成 |
| --- | --- |
| `scheduled()` が `ctx.waitUntil(runSync(env, { trigger: "cron" }))` を 1 回だけ呼ぶ | `runSync` を vi.mock で差し替え、呼び出し回数 + 引数 assert |
| `runSync` 単体テスト（in-memory D1 / `@cloudflare/vitest-pool-workers`） | mock Sheets fetch → upsert 件数 = 投入件数、`sync_job_logs` に成功 1 行、audit 1 行 |
| 5xx + retry | 1 回目 503 / 2 回目 200 → backoff 経由で成功記録 |
| audit 失敗 | upsert 成功 / audit insert で throw → outbox 1 行追加、`sync_job_logs` は success 記録 |
| 二重実行 | 同 cron 起動 2 回連続 → 後発が `sync_locks` で skip、`sync_job_logs` に skipped 記録 |

## TDD Red 前の命名規則整合検証

- 既存 `apps/api/src/sync/` のファイル命名（`kebab-case.ts`、export 関数 `camelCase`、type は `PascalCase`）と一致させる。
- テストファイルは `apps/api/test/sync/<module>.test.ts`、describe ブロック名は対象モジュールパスに揃える。
- 検証コマンド（参考）: `rg -l '^export ' apps/api/src/sync` で命名差分を目視確認する。
- 03-serial `data-contract.md` の COL 定数命名（`COL_RESPONSE_ID` 等）と `mapper.ts` 内定数名が完全一致することを `rg "^export const COL_" apps/api/src/sync/mapper.ts` で目視確認。

## Vitest targeted run のファイルリスト（SIGKILL 回避）

- 同期ジョブ関連のみ:
  - `apps/api/test/sync/mapper.test.ts`
  - `apps/api/test/sync/mapper.response-id.test.ts`
  - `apps/api/test/sync/sheets-client.test.ts`
  - `apps/api/test/sync/worker.run-sync.test.ts`
  - `apps/api/test/sync/worker.audit-outbox.test.ts`
  - `apps/api/test/sync/worker.backfill.test.ts`
  - `apps/api/test/sync/contract.data-contract.test.ts`
  - `apps/api/test/sync/routes.authorization.test.ts`
  - `apps/api/test/sync/scheduled.test.ts`
- 実行例: `mise exec -- pnpm --filter ./apps/api vitest run test/sync/worker.run-sync.test.ts`（広域 `vitest run` は monorepo 全走で SIGKILL リスクのため避ける）。

## private method テスト方針

| モジュール | 方針 |
| --- | --- |
| `mapper.ts` | 全関数 export 化（class 化しない）→ そのまま単体検証 |
| `sheets-client.ts` | JWT 署名サブステップ（`buildJwtClaim` / `signJwt`）を named export し、`crypto.subtle` をモックして単体検証 |
| `worker.ts` | `runSync` / `runBackfill` を pure function として export（env を引数で受ける）。`upsertRow` / `writeAuditLog` も named export し scheduled / manual 両経路から共有 |
| scheduled handler | `index.ts` 内の `scheduled()` は `runSync` を呼ぶ薄いラッパに留め、handler 自体のテストは vi.mock で `runSync` を差し替えて引数検証のみ |
| SYNC_ADMIN_TOKEN Bearer middleware | Hono middleware として named export し、テストでは `c.set('session', mockSession)` で session 注入。`as unknown as` は使わない |

## 事前ビルドチェック（esbuild darwin mismatch 防止）

```bash
# Red 実行前に毎回実行
mise exec -- pnpm install
mise exec -- pnpm --filter ./apps/api build
mise exec -- pnpm --filter ./apps/api vitest run test/sync/mapper.test.ts
```

- darwin arm64 / x64 で `node_modules/.pnpm/@esbuild/*` が不一致になると CI で SIGABRT 発生 → `pnpm install` で再リンク必須。
- wrangler を直接呼ばず `bash scripts/cf.sh` 経由で `ESBUILD_BINARY_PATH` を解決する（CLAUDE.md ルール準拠）。

## coverage 計測

- 対象 allowlist（変更ファイルのみ）:
  - `apps/api/src/sync/types.ts`
  - `apps/api/src/sync/sheets-client.ts`
  - `apps/api/src/sync/mapper.ts`
  - `apps/api/src/sync/worker.ts`
  - `apps/api/src/index.ts`（`/admin/sync*` ルート 3 本部分のみ）
- 目標: line 80%+ / branch 70%+
- vitest 設定例（`apps/api/vitest.config.ts`）に `coverage.include` で上記 allowlist を渡し、広域指定（`src/**/*`）は禁止。

## 実行手順

1. 検証スイートのマトリクスを `outputs/phase-04/test-strategy.md` に転記する。
2. テストファイルパスを Phase 5 の implementation-runbook と相互参照する。
3. private method テスト方針を全モジュール分埋める。
4. 事前ビルドチェック手順を Phase 5 runbook の Step 0 として組み込み予約する。
5. coverage allowlist を vitest 設定の draft として記述する。
6. 03-serial `data-contract.md` との差分ゼロを保証する contract test snapshot を Phase 5 で生成する手順を予約する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | テストファイルパス 9 件を runbook の Red サイクルに連結 |
| Phase 6 | failure case（audit 失敗 / 5xx / lock 競合）ごとに対応する unit / scheduled テストを紐付け |
| Phase 7 | AC × 検証ファイルのトレース表に流し込み（特に audit best-effort と Auth.js admin role） |
| Phase 9 | coverage 実測値を本 Phase の allowlist に対して取得 |

## 多角的チェック観点

- 価値性: 検証スイートが原典 spec の AC（冪等性 / audit / 認可 / Cron）をすべてカバーするか。
- 実現性: `@cloudflare/vitest-pool-workers` で `crypto.subtle` と D1 binding が再現できるか。
- 整合性（03-serial 契約）: contract test snapshot が `data-contract.md` の 5 点（COL / response_id / member_responses / sync_job_logs / sync_audit_outbox）すべてに対応するか。
- 整合性（不変条件 #1 / #4 / #5）: テストファイル import グラフで違反検出可能か。
- 運用性: targeted run でローカル / CI 両方が SIGKILL せず通るか。
- 認可境界: `/admin/sync*` の 401/403/409 を契約レベルで固定したか、`GET /admin/sync/audit` も admin 限定にしたか。
- audit 失敗時挙動: outbox 蓄積パスのテストが必ず存在し、主データロールバックが起きないことを assert しているか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | Vitest unit スイート 6 ファイル定義 | spec_created |
| 2 | contract スイート（03-serial 5 点同期）定義 | spec_created |
| 3 | authorization スイート 6 ケース定義 | spec_created |
| 4 | scheduled handler スイート 5 シナリオ定義 | spec_created |
| 5 | targeted vitest パス 9 件列挙 | spec_created |
| 6 | private method 方針確定 | spec_created |
| 7 | 事前ビルドチェック手順確定 | spec_created |
| 8 | coverage allowlist 確定 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-strategy.md | 検証スイート設計・targeted run リスト・private method 方針・coverage allowlist |
| メタ | artifacts.json | Phase 4 状態更新 |

## 完了条件

- [ ] 4 種スイート × モジュールのマトリクスに空セル無し
- [ ] targeted vitest ファイルパス 9 件以上列挙
- [ ] private method テスト方針が全モジュール分明記
- [ ] 命名規則整合検証手順が記述
- [ ] 事前ビルドチェック（pnpm install + filter build）が runbook 入り
- [ ] coverage allowlist が `apps/api/src/sync/*` に限定（広域指定禁止）
- [ ] 03-serial `data-contract.md` 5 点同期チェックが contract test snapshot として組み込まれている
- [ ] `runSync` の冪等性テスト / audit 失敗時 outbox 蓄積テストが必須として明記

## タスク100%実行確認【必須】

- 実行タスク 7 件が `spec_created`
- 成果物が `outputs/phase-04/test-strategy.md` に配置済み
- 原典 spec 完了条件（冪等性 / audit / 認可 / Cron）すべてに 1 つ以上のテストケースが対応
- targeted run / 事前ビルドチェックの省略が無い

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - 検証ファイルパス 9 件 → runbook の Red サイクルに紐付け
  - 事前ビルドチェック → Step 0 として予約
  - coverage allowlist → Phase 9 で再利用
  - contract test snapshot 生成タイミング → Step 3 のモジュール完成直後
- ブロック条件:
  - 命名規則差分が解消されない
  - targeted run でも SIGKILL する場合は Phase 5 着手不可
  - 03-serial `data-contract.md` 5 点同期チェックが未組み込み
