# Phase 7: AC マトリクス / カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 同期ジョブ実装 (UT-09) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス / カバレッジ確認 |
| 作成日 | 2026-04-27 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | spec_created |
| タスク分類 | specification-design（traceability） |

## 目的

index.md で定義された AC-1〜AC-11 に対し、Phase 4（検証スイート）/ Phase 5（実装ファイル）/ Phase 6（failure case）の成果物を縦串で結び、トレーサビリティ表として Phase 8 以降に引き継ぐ。同時に、変更ファイル限定の coverage 計測方針（line 80%+ / branch 70%+）を確定し、広域指定を排除した allowlist を最終化する。

## 実行タスク

1. AC × 4 列（AC 内容 / 検証 / 実装 / 関連 failure case）の 11 行マトリクスを完成する（完了条件: 空セル無し）。
2. coverage 目標（line 80%+ / branch 70%+）と対象 allowlist を vitest 設定 draft として確定する（完了条件: 変更ファイルのみがリストアップ）。
3. 広域指定（`src/**/*` 等）を採用しないルールを文書化する（完了条件: 禁止パターン例示あり）。
4. coverage 実測の証跡記録方法を定義する（完了条件: `vitest run --coverage` のオプション + 出力先パスが指定）。
5. Phase 9 への引き継ぎ項目（実測値・gap 分析）を予約する（完了条件: Phase 9 input が箇条書きで明示）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | AC-1〜AC-11 原典 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-04.md | 検証ファイルパス |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-05.md | 実装ファイルパス |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-06.md | failure case ID |
| 参考 | https://vitest.dev/config/#coverage-include | coverage 設定 |

## AC マトリクス

| AC# | AC 内容 | 検証（Phase 4 ファイル） | 実装（Phase 5 ファイル） | 関連 failure case（Phase 6） |
| --- | --- | --- | --- | --- |
| AC-1 | Cron Trigger による同期ジョブが dev 環境で定期実行 | `apps/api/test/jobs/sync-sheets-to-d1.test.ts`（integration: scheduled handler 起動） | `apps/api/src/index.ts`（scheduled export）、`wrangler.toml`（[triggers] crons） | #10（二重起動）、#11（pagination 中断） |
| AC-2 | Sheets→D1 マッピング・格納の正しさ | `apps/api/test/jobs/util/mapper.test.ts`、`apps/api/test/jobs/sync-sheets-to-d1.test.ts`（正常系） | `apps/api/src/jobs/util/mapper.ts`、`apps/api/src/jobs/sync-sheets-to-d1.ts` | #4（range invalid） |
| AC-3 | 冪等性（同データ 2 回同期しても重複なし） | `apps/api/test/jobs/sync-sheets-to-d1.test.ts`（冪等シナリオ） | `apps/api/src/jobs/sync-sheets-to-d1.ts`（INSERT ... ON CONFLICT DO UPDATE） | #10、#13 |
| AC-4 | 1000 件超データの A1 range 分割または chunk 処理 | `apps/api/test/jobs/util/sheets-fetcher.test.ts`、integration 2000-row シナリオ | `apps/api/src/jobs/util/sheets-fetcher.ts` | #11 |
| AC-5 | `/admin/sync` 認証付き動作 | `apps/api/test/routes/admin/sync.test.ts`（authorization 4 ケース） | `apps/api/src/routes/admin/sync.ts` | #12、#13、#14 |
| AC-6 | 同期実行ログの D1 記録 | `apps/api/test/jobs/sync-sheets-to-d1.test.ts`（log assertion）、contract test | `apps/api/src/jobs/sync-sheets-to-d1.ts`（startLog/finishLog）、`migrations/00xx_sync_logs_locks.sql` | 全件（log は全ケース共通） |
| AC-7 | `SQLITE_BUSY` retry/backoff、queue serialization、短い transaction、batch 制限 | `apps/api/test/jobs/util/retry-backoff.test.ts`、`write-queue.test.ts`、integration 競合シナリオ | `apps/api/src/jobs/util/retry-backoff.ts`、`util/write-queue.ts`、`sync-sheets-to-d1.ts`（batch=100） | #5、#7、#9 |
| AC-8 | staging load/contention test 破綻なし | Phase 11 手動 smoke（log 観測）+ integration 同時実行シナリオ | `apps/api/src/jobs/util/lock-manager.ts`、`util/write-queue.ts` | #7、#10 |
| AC-9 | SA JSON が Cloudflare Secrets 経由 | `apps/api/test/jobs/util/sheets-fetcher.test.ts`（env binding mock）+ ソース grep（ハードコード検出） | `apps/api/src/jobs/util/sheets-fetcher.ts`（env.GOOGLE_SHEETS_SA_JSON のみ参照） | #1 |
| AC-10 | wrangler.toml に dev / main 別 Cron スケジュール | wrangler.toml の review（`apps/api/test/wrangler.test.ts` または PR レビューチェック） | `apps/api/wrangler.toml`（[env.dev]、[env.production]） | #10 |
| AC-11 | 4 条件最終判定 PASS | Phase 10 go-no-go.md の判定 | 本 Phase の AC マトリクス自体を入力 | 全件（MAJOR 残存有無を確認） |

## coverage 目標と allowlist

### 目標

- line coverage: 80% 以上
- branch coverage: 70% 以上
- 対象は変更ファイル限定（既存ファイルへの広域計測は行わない）

### allowlist（`apps/api/vitest.config.ts` の `coverage.include`）

```ts
coverage: {
  include: [
    "src/jobs/sync-sheets-to-d1.ts",
    "src/jobs/util/retry-backoff.ts",
    "src/jobs/util/write-queue.ts",
    "src/jobs/util/sheets-fetcher.ts",
    "src/jobs/util/mapper.ts",
    "src/jobs/util/lock-manager.ts",
    "src/routes/admin/sync.ts",
  ],
  // exclude は include がある時点で他は計測対象外
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
  apps/api/test/jobs apps/api/test/routes/admin/sync.test.ts

# 結果は apps/api/coverage/ に出力
# - apps/api/coverage/coverage-summary.json （CI 解析用）
# - apps/api/coverage/lcov.info             （Codecov 等連携用）
# - apps/api/coverage/index.html            （ローカル目視）
```

- Phase 9 で `coverage-summary.json` から allowlist 各ファイルの line/branch を抽出し、目標未達がある場合は test 追記して Green。
- 証跡として `outputs/phase-09/coverage-summary.json` を保存する（Phase 7 では allowlist の draft のみ確定）。

## 実行手順

1. 11 行 × 4 列の AC マトリクスを `outputs/phase-07/ac-matrix.md` に転記。
2. allowlist を vitest 設定 draft として記録（実コミットは Phase 5 実装フェーズで反映）。
3. 広域指定の禁止パターンを Phase 8 DRY 化の入力として固定。
4. Phase 9 への引き継ぎ項目を箇条書きで明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | 重複コード検出時、AC マトリクスの行が崩れないことを確認 |
| Phase 9 | coverage 実測 → allowlist 各ファイルの line/branch を計測 |
| Phase 10 | go-no-go の根拠として AC マトリクスの空セル無しを参照 |
| Phase 11 | AC-1 / AC-8 / AC-10 を staging 手動 smoke で再確認 |

## 多角的チェック観点

- 価値性: 11 件 AC が抜け漏れ無く検証 → 実装 → failure case にトレースされているか。
- 実現性: allowlist が変更ファイルに限定され、既存コードへ無関係に boundary を拡張していないか。
- 整合性: Phase 4 / 5 / 6 のファイル名と差分ゼロ。
- 運用性: coverage 実測コマンドが PR 上で再現可能か。
- 認可境界: AC-5 が authorization スイートの 4 ケース全てに対応しているか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | AC マトリクス 11 行 × 4 列 | spec_created |
| 2 | coverage allowlist 確定 | spec_created |
| 3 | 広域指定禁止ルール文書化 | spec_created |
| 4 | 証跡記録手順確定 | spec_created |
| 5 | Phase 9 引き継ぎ項目予約 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装 × failure case のトレース表 + coverage allowlist |
| メタ | artifacts.json | Phase 7 状態更新 |

## 完了条件

- [ ] AC マトリクス 11 行 × 4 列に空セル無し
- [ ] allowlist が変更ファイル 7 件に限定
- [ ] 広域指定の禁止パターンが例示
- [ ] coverage 実測コマンド + 出力先が記述
- [ ] Phase 9 への引き継ぎ項目が箇条書き

## タスク100%実行確認【必須】

- 実行タスク 5 件が `spec_created`
- 成果物が `outputs/phase-07/ac-matrix.md` に配置済み
- AC-1〜AC-11 の 11 行が全て埋まる
- 関連 failure case 列が Phase 6 の case# を 1 つ以上参照（AC-6/AC-11 は「全件」可）
- coverage allowlist と Phase 5 の新規ファイル一覧が一致

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC マトリクス → Phase 10 go-no-go の根拠として再利用
  - coverage allowlist → Phase 9 で実測値取得
  - 広域指定禁止ルール → Phase 8 / Phase 9 で逸脱を防ぐ
- ブロック条件:
  - AC マトリクス空セル残存
  - allowlist が広域指定に変質
