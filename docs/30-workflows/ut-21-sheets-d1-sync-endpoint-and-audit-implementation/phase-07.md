# Phase 7: AC マトリクス / カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 sync endpoint 実装と audit logging (UT-21) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス / カバレッジ確認 |
| 作成日 | 2026-04-29 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | blocked |
| タスク分類 | specification-design（traceability） |

## 目的

index.md で定義された AC-1〜AC-12 に対し、Phase 4（Vitest スイート）/ Phase 5（実装ファイル: `apps/api/src/sync/*`）/ Phase 6（failure case ID）の成果物を 4 軸トレーサビリティ表として縦串で結び、Phase 8 DRY 化以降に引き継ぐ。同時に、変更ファイル限定の coverage 計測方針（line 80%+ / branch 70%+）を確定し、03-serial で先行実装された `apps/api/src/sync/*` のみに allowlist を絞る。

## 実行タスク

1. AC × 4 列（AC 内容 / 検証 / 実装 / 関連 failure case）+ Phase 列の 5 列・12 行マトリクスを完成する（完了条件: 空セルなし）。
2. coverage 目標（line 80%+ / branch 70%+）と allowlist を vitest 設定 draft として確定する（完了条件: `apps/api/src/sync/*` のみがリストアップ）。
3. 広域指定（`src/**/*` 等）禁止ルールを文書化する（完了条件: 禁止パターン例示あり）。
4. coverage 実測の証跡記録方法を定義する（完了条件: `mise exec -- pnpm --filter` 経由のコマンドと出力先パスが指定）。
5. Phase 9 への引き継ぎ項目（実測値・gap 分析・dev 環境 D1 writes 試算）を予約する（完了条件: Phase 9 input が箇条書き明示）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/index.md | AC-1〜AC-12 原典 |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-04.md | 検証ファイルパス |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-05.md | 実装ファイルパス |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-06.md | failure case ID |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md | audit 契約 |
| 参考 | https://vitest.dev/config/#coverage-include | coverage 設定 |

## AC マトリクス（4 軸トレーサビリティ）

> AC は index.md と完全一致。`SyncResult` `runSync` 等の用語は 03-serial と整合。

| AC# | AC 内容 | 検証（Phase 4 ファイル） | 実装（Phase 5 ファイル） | 関連 failure case (Phase 6) | Phase |
| --- | --- | --- | --- | --- | --- |
| AC-1 | `apps/api/src/sync/worker.ts` の `runSync` / `runBackfill` がコアロジックとして実装され、scheduled / manual 双方から呼び出される | `apps/api/test/sync/worker.test.ts` | `apps/api/src/sync/worker.ts` | #11, #16, #17 | 5, 8 |
| AC-2 | `POST /admin/sync` / `POST /admin/sync/responses` / `GET /admin/sync/audit` の3ルートが `apps/api/src/index.ts` に登録されている | route contract test | `apps/api/src/index.ts` | #1, #2, #17 | 5, 6, 7 |
| AC-3 | `wrangler.toml` `[triggers]` で dev / production 環境別 Cron スケジュールが分離されている | wrangler.toml review | `apps/api/wrangler.toml` | #15 | 5, 10 |
| AC-4 | `Authorization: Bearer <SYNC_ADMIN_TOKEN>` が `/admin/sync*` ルートに一括適用されている | `apps/api/test/sync/auth.test.ts` | `apps/api/src/index.ts` または sync middleware | #1, #2, #3, #4 | 5, 6, 7 |
| AC-5 | 同一 Sheets 行データを2回同期しても D1 に重複が発生しない | `apps/api/test/sync/worker.test.ts`（idempotency） | `apps/api/src/sync/mapper.ts` + `worker.ts` | #11, #15 | 5, 6 |
| AC-6 | audit log 書き込み成功時 / 失敗時の挙動が best-effort + outbox 方針に従う | `apps/api/test/sync/audit.test.ts` | `apps/api/src/sync/worker.ts`（`writeAuditLog` / outbox enqueue） | #13 | 5, 6, 8 |
| AC-7 | 03-serial の data-contract / sync-flow / runbook と本実装の差分がない | contract sync check | 03-serial outputs + `apps/api/src/sync/*` | 全件 | 9, 10 |
| AC-8 | dev 環境で Cron Triggers 経由の scheduled 実行が観測でき、backfill テストを兼ねている | Phase 11 smoke | `scheduled()` + `/admin/sync/responses?fullSync=true` | #15 | 11 |
| AC-9 | Workers crypto.subtle による RS256 JWT 署名が `sheets-client.ts` で動作し、googleapis 依存が混入していない | `apps/api/test/sync/sheets-client.test.ts` | `apps/api/src/sync/sheets-client.ts` | #14, #5 | 5, 6 |
| AC-10 | `exactOptionalPropertyTypes=true` 下で SheetRow が型安全で、DB バインドは `?? null` 合体されている | `apps/api/test/sync/mapper.test.ts` + typecheck | `apps/api/src/sync/types.ts`, `mapper.ts`, `worker.ts` | #8 | 4, 5 |
| AC-11 | Service Account JSON / SHEETS_SPREADSHEET_ID / Auth.js secrets が 1Password Employee vault → Cloudflare Secrets 経由で注入され、コードにハードコードされていない | secret grep + env binding mock | `sheets-client.ts`, `wrangler.toml` | #5 | 5, 9 |
| AC-12 | 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS である | Phase 10 go-no-go.md | 本 Phase の AC マトリクス自体を入力 | 全件 | 10 |

## coverage 目標と allowlist

### 目標

- line coverage: 80% 以上
- branch coverage: 70% 以上
- 対象は `apps/api/src/sync/*` および `apps/api/src/middlewares/sync-auth.ts` 限定（既存ファイルへの広域計測は行わない）

### allowlist（`apps/api/vitest.config.ts` の `coverage.include`）

```ts
coverage: {
  include: [
    "src/sync/types.ts",
    "src/sync/sheets-client.ts",
    "src/sync/mapper.ts",
    "src/sync/worker.ts",
    "src/index.ts",
  ],
}
```

### 禁止パターン（広域指定）

```ts
// 以下は禁止: 既存ファイルが coverage 落ちで red になる
include: ["src/**/*"]
include: ["**/*.ts"]
include: ["src/**/*.{ts,tsx}"]
```

## coverage 実測の証跡記録

```bash
mise exec -- pnpm --filter ./apps/api vitest run --coverage \
  apps/api/test/sync

# 結果は apps/api/coverage/ に出力
# - apps/api/coverage/coverage-summary.json （CI 解析用）
# - apps/api/coverage/lcov.info             （Codecov 連携用）
# - apps/api/coverage/index.html            （ローカル目視）
```

- Phase 9 で `coverage-summary.json` から allowlist 各ファイルの line/branch を抽出し、目標未達は test 追記して green。
- 証跡として `outputs/phase-09/coverage-summary.json` を保存（Phase 7 では allowlist の draft のみ確定）。

## 実行手順

1. 12 行 × 5 列の AC マトリクスを `outputs/phase-07/ac-matrix.md` に転記。
2. allowlist を vitest 設定 draft として記録（実コミットは Phase 5 実装フェーズで反映）。
3. 広域指定の禁止パターンを Phase 8 DRY 化の入力として固定。
4. Phase 9 への引き継ぎ項目を箇条書きで明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | 重複コード抽出時に AC マトリクスの行が崩れないことを確認（特に AC-1 middleware / AC-3 runSync / AC-5 SHA-256） |
| Phase 9 | coverage 実測 → allowlist 各ファイルの line/branch を計測 |
| Phase 10 | go-no-go の根拠として AC マトリクスの空セル無しを参照 |
| Phase 11 | AC-2 / AC-9 / AC-10 を staging 手動 smoke で再確認 |

## 多角的チェック観点

- 価値性: 12 件 AC が抜け漏れ無く検証 → 実装 → failure case → Phase にトレースされているか。
- 実現性: allowlist が `apps/api/src/sync/*` に限定され、03-serial 既存コードへ広域拡張していないか。
- 整合性: Phase 4 / 5 / 6 のファイル名と差分ゼロ。03-serial 用語（`runSync` / `SyncResult` / `mapRowToSheetRow`）と完全一致。不変条件 #1（schema をコードに固定しすぎない）/ #4（admin-managed data 分離）/ #5（D1 アクセスは apps/api 内）違反なし。
- 運用性: coverage 実測コマンドが `mise exec` 経由で再現可能。
- 認可境界: AC-1 が SYNC_ADMIN_TOKEN Bearer 4 ケース全てに対応しているか（#1〜#4）。
- 監査性: AC-7 が audit best-effort + outbox 退避を独立 AC として保持。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | AC マトリクス 12 行 × 5 列 | blocked |
| 2 | coverage allowlist 確定（8 ファイル） | blocked |
| 3 | 広域指定禁止ルール文書化 | blocked |
| 4 | 証跡記録手順確定 | blocked |
| 5 | Phase 9 引き継ぎ項目予約 | blocked |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装 × failure case × Phase の 4 軸トレース表 + coverage allowlist |
| メタ | artifacts.json | Phase 7 状態更新 |

## 完了条件

- [ ] AC マトリクス 12 行 × 5 列に空セル無し
- [ ] allowlist が `apps/api/src/sync/*` + `middlewares/sync-auth.ts` の 8 ファイルに限定
- [ ] 広域指定の禁止パターンが例示
- [ ] coverage 実測コマンド + 出力先が記述
- [ ] Phase 9 への引き継ぎ項目が箇条書き

## タスク100%実行確認【必須】

- 実行タスク 5 件が `blocked`
- 成果物が `outputs/phase-07/ac-matrix.md` に配置予定
- AC-1〜AC-12 の 12 行が全て埋まる
- 関連 failure case 列が Phase 6 の case# を 1 つ以上参照（AC-11/AC-12 は「全件」可）
- coverage allowlist と Phase 5 の実装ファイル一覧が一致

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC マトリクス → Phase 10 go-no-go の根拠として再利用
  - coverage allowlist → Phase 9 で実測値取得
  - 広域指定禁止ルール → Phase 8 / Phase 9 で逸脱を防ぐ
  - AC-1 (auth middleware) / AC-3 (runSync 集約) / AC-5 (SHA-256 utility) を Phase 8 DRY 抽出の優先候補に指定
- ブロック条件:
  - AC マトリクス空セル残存
  - allowlist が広域指定に変質
