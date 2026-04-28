# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 同期ジョブ実装 (UT-09) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-27 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | spec_created |
| タスク分類 | specification-design（failure-case） |

## 目的

Phase 5 runbook で組み立てた同期処理に対し、外部 API（Sheets）/ DB（D1）/ 実行環境（Cloudflare Workers）/ 認可境界（`/admin/sync`）の 4 層で発生し得る異常系を網羅し、検出方法・復旧手順・ログ出力例まで揃える。Phase 7 の AC トレース表に紐付けし、Phase 9 の品質保証で検証可能な形式にする。

## 実行タスク

1. 異常系を 4 層別に列挙し、12 件以上のマトリクスを完成する（完了条件: 各ケースに分類・原因・検出・復旧・ログ例の 5 項目が埋まる）。
2. 各ケースの retry 戦略（即時失敗 / exponential / linear / no-retry）を明示する（完了条件: 全件で戦略が一意）。
3. ログ出力例（JSON 形式の `sync_job_logs.error` / Workers Logs）を提示する（完了条件: 後段の通知基盤 UT-07 が読める形式）。
4. failure case ごとに Phase 4 のテストファイルへ wire-in を割り当てる（完了条件: 全件で対応する vitest スイートが特定）。
5. ロールバック / 手動復旧 runbook を整備する（完了条件: D1 quota 超過・lock 残置・SA 認証失効の 3 件で手順が完結）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-05.md | runbook 上の例外パスを起点にする |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-04.md | 検証スイート対応 |
| 必須 | docs/30-workflows/completed-tasks/ut-02-d1-wal-mode/index.md | `SQLITE_BUSY` の前提 |
| 参考 | https://developers.google.com/sheets/api/limits | Sheets API quota / error code |
| 参考 | https://developers.cloudflare.com/d1/platform/limits/ | D1 50K writes/day 制限 |

## failure cases マトリクス

| # | 分類 | ケース | 原因 | 検出 | 戦略 | 復旧 | ログ例 |
| - | --- | --- | --- | --- | --- | --- | --- |
| 1 | Sheets API | 401 Unauthorized | SA JSON 期限切れ / 鍵回転ミス | fetch response.status | no-retry、即時失敗 | Secret 再登録 → `/admin/sync` 手動リラン。UT-07 通知委譲 | `{level:"error",code:"SHEETS_AUTH_FAILED",status:401}` |
| 2 | Sheets API | 403 Forbidden | SA がシート閲覧権限未付与 | fetch response.status | no-retry | シート共有設定追加 | `{code:"SHEETS_FORBIDDEN",status:403,sheetId:"..."}` |
| 3 | Sheets API | 404 Not Found | `SHEETS_SPREADSHEET_ID` 誤設定 | fetch response.status | no-retry | Variable 修正 → 再デプロイ | `{code:"SHEETS_NOT_FOUND",status:404}` |
| 4 | Sheets API | 422 Range Invalid | range 文字列誤り | fetch response.status | no-retry | mapper / fetcher コード修正 | `{code:"SHEETS_RANGE_INVALID",range:"A1:ZZ"}` |
| 5 | Sheets API | 5xx 一時障害 | Google 側 outage | fetch response.status (>=500) | exponential backoff、最大 3 回（base 500ms + jitter） | 自動再試行のみ。3 回失敗で skipped 記録 | `{code:"SHEETS_5XX_RETRY",attempt:1,nextDelayMs:500}` |
| 6 | Sheets API | 429 Quota Exceeded | 300 req/min/project 超過 | fetch response.status / `retry-after` header | linear backoff（header 値準拠）、最大 3 回 | 同上、超過時は次 cron まで待つ | `{code:"SHEETS_429",retryAfterSec:30}` |
| 7 | D1 | `SQLITE_BUSY` | 同時書込競合 | wrangler 例外メッセージ | exponential backoff（50/100/200/400/800ms + jitter）、最大 5 回 | 自動再試行 | `{code:"D1_BUSY_RETRY",attempt:3}` |
| 8 | D1 | quota exceeded（50K writes/day） | 無料枠超過 | wrangler error code | no-retry、当日スキップ | 翌日まで待機 / 段階的同期に変更 | `{code:"D1_QUOTA_EXCEEDED",writesToday:50001}` |
| 9 | Workers | CPU time 超過（50ms/req）| batch 過大 | `Error: Worker exceeded CPU` | no-retry、batch=100 維持 | `ctx.waitUntil()` で scheduled handler を非同期化 | `{code:"CPU_OVERRUN",batchSize:100}` |
| 10 | Workers | scheduled 二重起動 | 前回未完了 cron が残存 | `sync_locks` 行存在 | no-retry、後発スキップ | TTL 経過後に自動 acquire | `{code:"SYNC_SKIPPED_LOCKED",lockedSinceMs:300000}` |
| 11 | Workers | range/chunk 処理中断 | A1 range 分割途中 / Worker timeout | log の `fetched_count` / `upserted_count` 不整合 | no-retry（再実行で全取得） | 次 cron で全量取得 | `{code:"SYNC_RANGE_INTERRUPTED"}` |
| 12 | API | `/admin/sync` 401 | token mismatch / header 無し | Hono middleware | no-retry | 呼び出し側 token 確認 | `{code:"ADMIN_SYNC_UNAUTHORIZED"}` |
| 13 | API | `/admin/sync` 409 | 既に lock 取得済 | lock-manager.acquire 失敗 | no-retry | 前回完了待ち | `{code:"ADMIN_SYNC_CONFLICT"}` |
| 14 | API | `/admin/sync` 5xx | 内部例外（mapper / D1 例外） | catch-all | no-retry（呼び出し側に返す） | error log + UT-07 通知 | `{code:"ADMIN_SYNC_INTERNAL",cause:"..."}` |

合計: 14 件（要件 12 件以上を満たす）。

## 各ケース ↔ 検証スイート wire-in

| Case # | 対応スイート（Phase 4） |
| --- | --- |
| 1, 2, 3, 4 | contract（Sheets API レスポンス）+ unit（sheets-fetcher 分類） |
| 5 | unit（retry-backoff）+ integration（5xx + retry シナリオ） |
| 6 | unit（retry-backoff の retry-after 解釈） |
| 7 | unit（retry-backoff の SQLITE_BUSY 判定）+ integration（書込競合） |
| 8 | unit（quota error 検出）/ 実機確認は staging |
| 9 | integration（batch=100 + ctx.waitUntil） |
| 10 | integration（二重実行シナリオ） |
| 11 | unit（pagination loop 中断後の再実行で全件回復） |
| 12, 13, 14 | authorization スイート + integration |

## 復旧 runbook（代表 3 ケース）

### Case 1: SA JSON 期限切れ

```bash
# 1Password で新 SA JSON を取得 → JSON.stringify
wrangler secret put GOOGLE_SHEETS_SA_JSON --env production
# 残存 sync_locks をクリア
wrangler d1 execute ubm_hyogo_db --env production --remote \
  --command "DELETE FROM sync_locks WHERE expires_at < strftime('%s','now')*1000"
# 手動リラン
curl -X POST https://api.example.com/admin/sync -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN}"
```

### Case 8: D1 quota exceeded

```bash
# 当日の同期をスキップ。次日 0:00 UTC で quota リセット
# 段階的同期（差分のみ）への移行は UT-10 で標準化
# 当面は cron を一時停止
wrangler deploy --env production --triggers ""   # cron 無効化
```

### Case 10: lock 残置（Worker クラッシュ後）

```bash
# TTL 超過行のみ自動失効するが、緊急時は強制解除
wrangler d1 execute ubm_hyogo_db --env production --remote \
  --command "DELETE FROM sync_locks"
# その後 /admin/sync で再実行
```

## 実行手順

1. 14 件のマトリクスを `outputs/phase-06/failure-cases.md` に転記。
2. 各ケースのログ JSON フォーマットを UT-07 想定に合わせ統一。
3. 検証スイート wire-in を Phase 4 ファイル名と相互参照。
4. 代表 3 ケースの復旧 runbook をコマンドベースで記述。
5. open question（UT-10 で標準化される項目）を Phase 12 unassigned に送る。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case を AC マトリクスの「関連 failure case」列に紐付け |
| Phase 9 | retry 戦略の境界値テストを coverage に含める |
| Phase 11 | 復旧 runbook を staging で 1 件以上手動 smoke |
| Phase 12 | UT-07 / UT-10 への引き継ぎ事項を unassigned-task-detection に登録 |

## 多角的チェック観点

- 価値性: 各ケースが運用者にとって意味のある復旧パスを示しているか。
- 実現性: 50ms CPU 制限を超えない batch=100 が実際の Sheets レコードで成立するか。
- 整合性: ログ JSON フォーマットが UT-07 通知基盤の入力契約と一致するか。
- 運用性: 復旧コマンドがコピペで完結するか。
- 認可境界: `/admin/sync` の 401/409/5xx が定義済か。
- 無料枠: 5xx retry の最大回数が Sheets quota を圧迫しない設計か。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 14 件の failure case マトリクス | spec_created |
| 2 | retry 戦略付与 | spec_created |
| 3 | ログ JSON フォーマット統一 | spec_created |
| 4 | Phase 4 スイートへの wire-in | spec_created |
| 5 | 代表 3 ケースの復旧 runbook | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | 14 件マトリクス + 復旧 runbook + ログ例 |
| メタ | artifacts.json | Phase 6 状態更新 |

## 完了条件

- [ ] 12 件以上の failure case が分類別に網羅
- [ ] 全ケースで retry 戦略が一意
- [ ] 全ケースに対応する Phase 4 スイートが指定
- [ ] 代表 3 ケースの復旧 runbook がコマンド付き
- [ ] ログ JSON フォーマットが UT-07 想定と整合

## タスク100%実行確認【必須】

- 実行タスク 5 件が `spec_created`
- 成果物が `outputs/phase-06/failure-cases.md` に配置済み
- 14 件全てに 5 項目（分類・原因・検出・復旧・ログ例）が記入
- Phase 5 擬似コードの例外パス（acquireLock 失敗 / fetch 失敗 / upsert 失敗）が全て failure case に対応

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - 14 件の failure case ID を AC マトリクスの「関連 failure case」列で参照
  - 復旧 runbook を Phase 11 手動 smoke の対象に予約
- ブロック条件:
  - 12 件未満で Phase 7 へ進む
  - 復旧手順が記述されないケースが残る
