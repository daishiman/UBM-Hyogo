# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 同期ジョブ実装 (UT-09) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-27 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | spec_created |
| タスク分類 | specification-design（test-strategy） |

## 目的

Phase 3 で確定した base case（Cron pull + 手動 admin route）に対して、Phase 5 実装着手前に必要な検証スイート（unit / contract / integration / authorization）を設計し、TDD Red サイクルで投入する Vitest ファイル一覧・命名規則・private method テスト方針・事前ビルド確認手順までを揃え、Phase 5 で「迷わず Red→Green→Refactor」が回せる状態にする。

## 実行タスク

1. 検証スイート 4 種類（unit / contract / integration / authorization）の対象モジュールと観点を確定する（完了条件: 8 モジュール × 検証種別のマトリクスに空セルが無い）。
2. Vitest targeted run のテストファイルパスを事前列挙する（完了条件: `apps/api/test/jobs/*.test.ts` 等のフルパスが列挙され、SIGKILL 回避のため広域実行を排除）。
3. private method テスト方針（`as unknown as` キャスト or public callback 注入）を明記する（完了条件: 各モジュールで採用する方針が記録される）。
4. TDD Red 実行前の命名規則整合チェック手順を定義する（完了条件: 既存 Hono handler / `apps/api/src/routes/` の命名規則と差分ゼロを保証する手順が文書化）。
5. 事前ビルドチェック（`pnpm install` + `pnpm --filter ./apps/api build`）の手順を Red 実行前に組み込む（完了条件: esbuild darwin mismatch 対策が runbook 化）。
6. coverage 計測対象ファイルの allowlist を決定する（完了条件: 変更行のみを対象に line 80%+ / branch 70%+ を達成する vitest 設定が指定可能）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-02.md | 8 モジュール設計を検証対象にマップ |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-03.md | base case と open question を取り込む |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/sync` 認可テスト基準 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | mapper / upsert 契約 |
| 参考 | https://vitest.dev/guide/coverage.html | coverage 設定 |
| 参考 | https://developers.cloudflare.com/workers/testing/miniflare/ | miniflare D1 mock |

## 検証スイート設計

### 1. unit テスト（純粋ロジック単位）

| 対象モジュール | テスト観点 | 想定ファイル |
| --- | --- | --- |
| `retry-backoff.ts` | exponential backoff の jitter 範囲、最大試行数到達で throw、`SQLITE_BUSY` 判定の真偽 | `apps/api/test/jobs/util/retry-backoff.test.ts` |
| `write-queue.ts` | FIFO 直列化、enqueue 中のエラーが後続を止めないこと、空キューでの no-op | `apps/api/test/jobs/util/write-queue.test.ts` |
| `mapper.ts` | Sheets row → D1 column の項目順、null/空セルの扱い、`responseEmail` の system field 注入 | `apps/api/test/jobs/util/mapper.test.ts` |
| `lock-manager.ts` | acquire 成功/失敗、TTL 超過で再取得、release で行削除 | `apps/api/test/jobs/util/lock-manager.test.ts` |
| `sheets-fetcher.ts`（純関数部分） | A1 range 分割、`ValueRange.values` 正規化、HTTP error の分類 | `apps/api/test/jobs/util/sheets-fetcher.test.ts` |

### 2. contract テスト（外部 I/F 契約）

| 対象 | 検証内容 |
| --- | --- |
| Sheets API レスポンス契約 | `ValueRange.values: string[][]` 構造、空シート時の `values: undefined`、`nextPageToken` 非使用 |
| D1 `member_responses` upsert 契約 | `INSERT ... ON CONFLICT(response_id) DO UPDATE` の SQL 文字列スナップショット |
| D1 `sync_job_logs` 契約 | required column（`started_at`, `finished_at`, `status`, `fetched_count`, `upserted_count`, `failed_count`, `error_reason`）の型 |
| `POST /admin/sync` API 契約 | request: 空 body 許容、response: `{ok, result: {status, fetched, upserted, failed, durationMs}}` |

### 3. integration テスト（scheduled handler E2E）

| シナリオ | 構成 |
| --- | --- |
| 正常系 | mock Sheets fetch → in-memory D1 → `member_responses` 件数 = 投入件数、`sync_job_logs` に成功 1 行 |
| 1000行超データ | A1 range 2 分割または 2000 行 ValueRange mock → D1 100 行 chunk upsert 成功 |
| 二重実行 | 同 cron 起動 2 回連続 → 後発が `sync_locks` で skip、`sync_job_logs` に skipped 記録 |
| 5xx + retry | 1 回目 503 / 2 回目 200 → backoff 経由で成功記録 |

### 4. authorization テスト（`/admin/sync`）

| ケース | 期待 |
| --- | --- |
| `Authorization: Bearer <SYNC_ADMIN_TOKEN>` 一致 | 200 + 同期実行 |
| ヘッダ無し | 401 |
| token mismatch | 401 |
| token あり + 既に lock 取得済 | 409 |

## TDD Red 前の命名規則整合検証

- 既存 `apps/api/src/routes/` のファイル命名（`kebab-case.ts`、export 関数 `camelCase`）と一致させる。
- `apps/api/src/jobs/` 配下も同規則。テストファイルは `*.test.ts`、describe ブロック名は対象モジュールパスに揃える。
- 検証コマンド（参考）: `rg -l '^export ' apps/api/src/jobs apps/api/src/routes/admin` で命名差分を目視確認する。

## Vitest targeted run のファイルリスト（SIGKILL 回避）

- 同期ジョブ関連のみ:
  - `apps/api/src/utils/with-retry.test.ts`
  - `apps/api/src/utils/write-queue.test.ts`
  - `apps/api/src/jobs/mappers/sheets-to-members.test.ts`
  - `apps/api/src/jobs/sync-sheets-to-d1.test.ts`
  - `apps/api/src/routes/admin/sync.test.ts`
- 実行例: `pnpm test apps/api/src/jobs/sync-sheets-to-d1.test.ts`（広域 `vitest run` は monorepo 全走で SIGKILL リスクのため避ける）。

## private method テスト方針

| モジュール | 方針 |
| --- | --- |
| `retry-backoff.ts` | 関数 export 化（class 化しない）→ そのまま単体検証 |
| `write-queue.ts` | class 化する場合は `as unknown as { _queue: Promise<unknown> }` でキューの内部状態を観測 |
| `lock-manager.ts` | DB 副作用は miniflare D1 で観測（private state を直接読まない） |
| `sync-sheets-to-d1.ts` | private 段階の hook を public callback として export し、テストで wire-in（`as unknown as` 乱用を避ける） |

## 事前ビルドチェック（esbuild darwin mismatch 防止）

```bash
# Red 実行前に毎回実行
mise exec -- pnpm install
mise exec -- pnpm --filter ./apps/api build
mise exec -- pnpm --filter ./apps/api vitest run apps/api/test/jobs/util/retry-backoff.test.ts
```

- darwin arm64 / x64 で `node_modules/.pnpm/@esbuild/*` が不一致になると CI で SIGABRT 発生 → `pnpm install` で再リンク必須。

## coverage 計測

- 対象 allowlist（変更ファイルのみ）:
  - `apps/api/src/jobs/sync-sheets-to-d1.ts`
  - `apps/api/src/jobs/util/*.ts`
  - `apps/api/src/routes/admin/sync.ts`
- 目標: line 80%+ / branch 70%+
- vitest 設定例（`apps/api/vitest.config.ts`）に `coverage.include` で上記 allowlist を渡し、広域指定（`src/**/*`）は禁止。

## 実行手順

1. 検証スイートのマトリクスを `outputs/phase-04/test-strategy.md` に転記する。
2. テストファイルパスを Phase 5 の implementation-runbook と相互参照する。
3. private method テスト方針を 8 モジュール分埋める。
4. 事前ビルドチェック手順を Phase 5 runbook の Step 0 として組み込み予約する。
5. coverage allowlist を vitest 設定の draft として記述する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | テストファイルパスを runbook の Red サイクルに連結 |
| Phase 6 | failure case ごとに対応する unit / integration テストを紐付け |
| Phase 7 | AC × 検証ファイルのトレース表に流し込み |
| Phase 9 | coverage 実測値を本 Phase の allowlist に対して取得 |

## 多角的チェック観点

- 価値性: 検証スイートが AC-1〜AC-11 をすべてカバーするか。
- 実現性: miniflare で `sync_locks` / `sync_job_logs` の同時挿入が再現できるか。
- 整合性: 既存 `apps/api/test/` 構成と命名規則が衝突しないか。
- 運用性: targeted run でローカル / CI 両方が SIGKILL せず通るか。
- 認可境界: `/admin/sync` の 401/409 を契約レベルで固定したか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | unit スイート 5 モジュール定義 | spec_created |
| 2 | contract スイート 4 件定義 | spec_created |
| 3 | integration スイート 4 シナリオ定義 | spec_created |
| 4 | authorization スイート 4 ケース定義 | spec_created |
| 5 | targeted vitest パス列挙 | spec_created |
| 6 | private method 方針確定 | spec_created |
| 7 | 事前ビルドチェック手順確定 | spec_created |
| 8 | coverage allowlist 確定 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-strategy.md | 検証スイート設計・targeted run リスト・private method 方針・coverage allowlist |
| メタ | artifacts.json | Phase 4 状態更新 |

## 完了条件

- [ ] 4 種スイート × 8 モジュールのマトリクスに空セル無し
- [ ] targeted vitest ファイルパス 7 件以上列挙
- [ ] private method テスト方針が 8 モジュール分明記
- [ ] 命名規則整合検証手順が記述
- [ ] 事前ビルドチェック（pnpm install + filter build）が runbook 入り
- [ ] coverage allowlist が変更ファイルに限定（広域指定禁止）

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物が `outputs/phase-04/test-strategy.md` に配置済み
- AC-1〜AC-11 すべてに 1 つ以上のテストケースが対応
- targeted run / 事前ビルドチェックの省略が無い

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - 検証ファイルパス 7 件 → runbook の Red サイクルに紐付け
  - 事前ビルドチェック → Step 0 として予約
  - coverage allowlist → Phase 9 で再利用
- ブロック条件:
  - 命名規則差分が解消されない
  - targeted run でも SIGKILL する場合は Phase 5 着手不可
