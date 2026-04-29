# Phase 8: DRY 化 / リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 sync endpoint 実装と audit logging (UT-21) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / リファクタリング |
| 作成日 | 2026-04-29 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | blocked |
| タスク分類 | specification-design（refactoring / dry） |

## 目的

03-serial で先行実装された `apps/api/src/sync/*`（`types.ts` / `sheets-client.ts` / `mapper.ts` / `worker.ts` / `index.ts` ルート登録）を題材に、命名・型・パス・エンドポイントの一貫性を担保する DRY 化方針を docs として確定する。**実装そのものは行わず、コード抽出方針のみを文書化**し、Phase 9 品質保証以降に「同じ概念に複数の表記が並ぶ」状態を持ち越さない。特に重複コード抽出の最優先候補は (a) `runSync` の manual / scheduled 二重呼び出し、(b) SHA-256 hashing utility（`generateResponseId` と audit hash 用途で重複の可能性）、(c) SYNC_ADMIN_TOKEN Bearer middleware の 3 件。

## 実行タスク

1. Phase 1〜7 の仕様書 / outputs path / artifacts.json を横断 grep し、命名揺れ（例: `runSync` vs `executeSync`、`/admin/sync` vs `/admin/sync` vs `/sync/run`）を表化する（完了条件: 揺れ件数が表化）。
2. 共通型 `Env` / `SheetRow` / `SyncResult` の単一定義先（`apps/api/src/sync/types.ts`）を確定する（完了条件: 重複定義 0、`exactOptionalPropertyTypes=true` 配慮済み）。
3. 重複コード抽出候補を 6 件以上列挙し、抽出先・他ジョブ転用可否・コード抽出方針（実装は別タスク）を判定する（完了条件: 6 件以上、特に runSync / SHA-256 / auth middleware の 3 件は必須）。
4. `/admin/sync` `/admin/sync/responses` `/admin/sync/audit` `/admin/sync/audit/replay` の URL / メソッド / 認可方式の表記を全 Phase で統一する（完了条件: 全 Phase 一致、SYNC_ADMIN_TOKEN Bearer token で統一）。
5. artifacts.json の outputs path と各 phase-XX.md の参照 path が一致するか確認する（完了条件: 不一致 0）。
6. doc 内リンクを全部辿り、リンク切れがないか確認する（完了条件: navigation drift 0）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-01.md 〜 phase-07.md | DRY 化対象 |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/artifacts.json | path 整合の起点 |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/index.md | 用語・命名の正本 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md | 状態遷移の正本 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md | audit / upsert 仕様 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/sync*` 命名規約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | テーブル名・カラム名規約 |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-08.md | 類似 DRY 化事例 |

## Before / After 比較テーブル

### 命名規則

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| sync 実行関数 | `runSync` / `executeSync` / `doSync` 揺れ想定 | `runSync(env, options)` に統一 | 03-serial sync-flow.md と整合、pure function 設計 |
| backfill 関数 | `runBackfill` / `backfillAll` | `runBackfill(env, options)` | runSync と命名規則を揃える |
| audit writer | `writeAuditLog` / `logAudit` / `recordAudit` | `writeAuditLog` に統一 | 03-serial data-contract.md 準拠 |
| outbox enqueue | `enqueueOutbox` / `pushOutbox` | `enqueueAuditOutbox` | 用途明示 |
| trigger 種別 | `cron` / `scheduled` / `manual` / `admin` 混在 | `'cron' \| 'manual' \| 'backfill'` の union | `SyncTrigger` 型として types.ts に集約 |
| sync log table | `sync_logs` / `syncJobLogs` | `sync_audit_logs`（03-serial 準拠） | 03-serial data-contract.md の table 名 |
| sync lock table | `sync_lock` / `syncLocks` | `sync_locks`（複数形） | snake_case + 複数形 |

### 型定義

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| Sheets 行 | 各モジュールで `string[]` 直書き | `SheetRow` を `apps/api/src/sync/types.ts` に集約、全フィールド `string \| undefined` 明示 | 不変条件 #1 + `exactOptionalPropertyTypes=true` 配慮（`field?: string` ではなく `field: string \| undefined`） |
| 同期結果 | `{ ok, count }` 散在 | `SyncResult { ok, fetched, upserted, failed, durationMs, lockHeldMs, auditDeferred, trigger }` 単一定義 | Phase 6 異常系（auditDeferred）と Phase 5 log と一致 |
| Env binding | adhoc `any` | `Env` interface 単一定義（D1 binding + GOOGLE_SHEETS_SA_JSON + SHEETS_SPREADSHEET_ID + SYNC_ADMIN_TOKEN + SYNC_ADMIN_TOKEN） | Phase 9 secret hygiene 前提 |
| Trigger | string literal 散在 | `SyncTrigger = 'cron' \| 'manual' \| 'backfill'` | union 型で網羅性検査 |

### パス（ディレクトリ整理方針 — 実装は別タスク）

| 対象 | 現状（03-serial 実装） | 提案（実装時に検討） | 理由 |
| --- | --- | --- | --- |
| sync 集約 | `apps/api/src/sync/{types,sheets-client,mapper,worker}.ts` + `index.ts` 内 route | `apps/api/src/sync/{types,sheets-client,mapper,worker,manual,scheduled,audit}.ts` に分離 | manual route と scheduled handler を `index.ts` から切り出し、AC-3 pure function 化を明確化 |
| auth middleware | 未集約 | `apps/api/src/middlewares/sync-auth.ts` に集約 | Phase 6 で 4 ケース（401/403 role/403 CSRF 欠落/403 CSRF 不一致）を保証 |
| SHA-256 utility | `mapper.ts` 内に閉じる | `apps/api/src/sync/crypto.ts`（同 sync ディレクトリ内）に切り出し | audit hash と response id 双方で再利用 |

### エンドポイント

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 手動同期 | `/admin/sync` / `/admin/sync` / `/admin/sync/run` 揺れ想定 | `POST /admin/sync` | 03-serial 実装と整合、api-endpoints.md と一致 |
| backfill | `/admin/sync/responses` / `/admin/admin/sync/responses` | `POST /admin/sync/responses` | 同上 |
| audit 取得 | `/admin/sync/audit` / `/admin/audit` | `GET /admin/sync/audit` | 同上 |
| audit replay | `/admin/sync/audit/replay` / `/admin/admin/sync/audit/replay` | `POST /admin/sync/audit/replay` | outbox 滞留対策 |
| 認可方式 | header 名揺れ（`X-Admin-Token` 等） | **`Authorization: Bearer <SYNC_ADMIN_TOKEN>`** | UT-21 固有: Bearer ではなく Auth.js セッションベース。CLAUDE.md 認証要件と整合 |

## 重複コードの抽出箇所（コード抽出方針のみ・実装は別タスク）

| # | 重複候補 | 抽出先（提案） | 他ジョブ転用可否 | 抽出方針 |
| --- | --- | --- | --- | --- |
| 1 | **`runSync` の manual route と scheduled handler の二重呼び出し** | `apps/api/src/sync/worker.ts` の `runSync(env, options)` を pure function として確立し、`manual.ts` / `scheduled.ts` は薄いラッパに留める | 限定的（sync 系のみ） | manual は HTTP context から `trigger:'manual'` を渡す、scheduled は ScheduledController から `trigger:'cron'` を渡す。両者は副作用ゼロの呼び出し側に徹する |
| 2 | **SHA-256 hashing utility** | `apps/api/src/sync/crypto.ts` に `sha256Hex(input: string): Promise<string>` を切り出す | 可（audit / response id 共通） | `crypto.subtle.digest('SHA-256', ...)` をラップ。`generateResponseId` と audit hash の両方で利用 |
| 3 | **SYNC_ADMIN_TOKEN Bearer middleware** | `apps/api/src/middlewares/sync-auth.ts` に `requireAdmin` を集約 | 可（UT-26 admin route 系と共有） | `getSession()` → role 判定 → `x-csrf-token` 検証の 3 段。Hono の `app.use('/admin/sync*', requireAdmin)` 形式で集約し、ルート毎に付け忘れない |
| 4 | RS256 JWT 署名 ロジック | `apps/api/src/sync/sheets-client.ts` 内に閉じる（外部公開不要） | 不可（Sheets API 専用） | PEM ヘッダ除去 + base64 decode + `crypto.subtle.importKey` ({extractable:false}) + sign の 4 ステップを単一関数 `signGoogleJwt(saKey, claims)` に集約 |
| 5 | audit best-effort + outbox enqueue | `apps/api/src/admin/sync/audit.ts` に `writeAuditLog` + `enqueueAuditOutbox` を集約 | 限定的 | 失敗時に主データを巻き戻さない仕様を関数境界で表現（呼び出し側で try/catch しない） |
| 6 | env validation（GOOGLE_SHEETS_SA_JSON / SHEETS_SPREADSHEET_ID / SYNC_ADMIN_TOKEN 揃っているか） | `apps/api/src/sync/env.ts` または既存の `lib/env.ts` | 可 | API 起動時 fail-fast |
| 7 | structured logger（trigger / syncId / durationMs を含む JSON ログ） | `apps/api/src/sync/logger.ts`（限定的） | 限定的（sync 系のみ） | UT-08 monitoring と連携想定 |

## navigation drift の確認

| チェック項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` と各 phase-XX.md の成果物 path 一致 | grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` の file 列と実ファイル名 | ls 照合 | 完全一致 |
| index.md `主要成果物` 表のパス | artifacts.json と突き合わせ | 完全一致 |
| phase-XX.md 内の他 phase 参照リンク | `../phase-YY.md` 全件確認 | リンク切れ 0 |
| 原典 unassigned-task への参照 | `docs/30-workflows/unassigned-task/UT-21-...` 実在 | 実在 |
| 03-serial 参照 | `docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/{sync-flow,data-contract}.md` 実在 | 実在 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/` 実在 | 実在 |

## 共通化パターン

- 命名: snake_case（DB） / camelCase（TS 変数） / PascalCase（型） / kebab-case（ファイル）。
- 4条件は「価値性 / 実現性 / 整合性 / 運用性」順序固定。
- Cron 表記は cron 式のまま `'0 */6 * * *'` を文字列で記述（自然言語と併記）。
- AC ID は `AC-1`〜`AC-12` のハイフン区切りで全 Phase 統一。
- 03-serial 由来の用語（`runSync` / `SyncResult` / `sync_audit_logs`）は変更禁止。03-serial を編集してから本タスクを追従させる原則を遵守（不変条件 #1 と同趣旨）。
- 1Password 参照は `op://Employee/ubm-hyogo-env/<FIELD>` 形式に統一。

## 削除対象一覧

- 実装フェーズで残った仮命名（例: `temp_sync` テーブル、`debug_log` 等）。
- `wrangler.toml` 内の不要 binding コメントアウト。
- 旧 GAS prototype 由来の命名（`syncSheetsToDb` 等、不変条件 #6 違反）。
- `wrangler login` で生成されうる `~/Library/Preferences/.wrangler/config/default.toml`（CLAUDE.md 禁止事項）。

## 実行手順

### ステップ 1: 命名揺れ洗い出し
- `grep -rn 'runSync\|executeSync\|doSync\|admin/sync\|sync/manual' docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation` を実行。
- 表記揺れを表化。

### ステップ 2: Before / After 比較テーブル作成
- 4 区分（命名 / 型 / path / endpoint）で記述。

### ステップ 3: 重複コード抽出箇所の特定
- 6 件以上、優先 3 件（runSync / SHA-256 / auth middleware）必須。

### ステップ 4: navigation drift 確認
- artifacts.json と各 phase-XX.md の path 照合。
- リンク切れ 0 を確認。

### ステップ 5: outputs/phase-08/main.md に集約
- 上記すべてを 1 ドキュメントに統合。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化済み命名・path を品質保証チェックリストの前提に使用 |
| Phase 10 | navigation drift 0 を GO/NO-GO 根拠 |
| Phase 12 | system-spec-update-summary.md / documentation-changelog.md に反映 |
| UT-09 | retry-backoff util の formalize 候補と整合 |
| UT-26 | `requireAdmin` middleware を共有想定 |

## 多角的チェック観点

- 価値性: DRY 化により実装フェーズ手戻り削減 + audit / sync 双方で同じ utility を再利用可能。
- 実現性: 既存 `apps/api/src/sync/*` への切り出しが Workers ビルドサイズ制約に抵触しない（utility 抽出のため bundle 増は最小）。
- 整合性: 不変条件 #1（schema 固定回避）/ #4（admin-managed data 分離）/ #5（D1 アクセスは apps/api 内）すべて維持。03-serial 用語と完全一致。
- 運用性: 命名一貫性で runbook / log 検索性が向上、auth middleware 集約で付け忘れ防止。
- 認可境界: `/admin/sync*` の SYNC_ADMIN_TOKEN Bearer を全 Phase 統一。
- 監査性: audit best-effort + outbox 退避を関数境界で表現（呼び出し側 try/catch 禁止）。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 命名揺れ洗い出し | blocked |
| 2 | 共通型の単一定義先確定 | blocked |
| 3 | 重複コード抽出箇所特定（7 件） | blocked |
| 4 | endpoint 表記統一（SYNC_ADMIN_TOKEN Bearer） | blocked |
| 5 | navigation drift 確認 | blocked |
| 6 | outputs/phase-08/main.md 作成 | blocked |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果（Before/After・重複抽出 7 件・navigation drift） |
| メタ | artifacts.json | Phase 8 状態更新 |

## 完了条件

- [ ] Before / After 比較テーブルが 4 区分（命名 / 型 / path / endpoint）すべてで埋まっている
- [ ] 重複コード抽出が 6 件以上、特に runSync / SHA-256 / auth middleware の 3 件が含まれる
- [ ] navigation drift（artifacts.json / index.md / phase-XX.md / outputs path）が 0
- [ ] 共通型の単一定義先が確定（`apps/api/src/sync/types.ts`、`exactOptionalPropertyTypes=true` 配慮）
- [ ] `/admin/sync*` + SYNC_ADMIN_TOKEN Bearer token で全 Phase 一致
- [ ] outputs/phase-08/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `blocked`
- 成果物 `outputs/phase-08/main.md` 配置予定
- Before / After が 4 区分網羅
- 重複コード抽出 7 件、優先 3 件カバー
- navigation drift 0
- artifacts.json の `phases[7].status` が `blocked`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - DRY 化済み命名・path 表（Phase 9 free-tier 見積もり / secret hygiene の前提）
  - 重複抽出 utility 7 件の一覧（Phase 9 line budget 計算で考慮）
  - navigation drift 0 状態の維持（Phase 9 link 検証で再確認）
  - auth middleware 集約方針 → Phase 9 secret hygiene の `SYNC_ADMIN_TOKEN` `SYNC_ADMIN_TOKEN` 確認の前提
- ブロック条件:
  - Before / After に空セルが残る
  - navigation drift が 0 にならない
  - 共通型の単一定義先が決まらない
  - 優先 3 件（runSync / SHA-256 / auth middleware）の抽出方針が記述されない
