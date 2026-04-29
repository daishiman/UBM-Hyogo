# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 sync endpoint 実装と audit logging (UT-21) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-29 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | blocked |
| タスク分類 | specification-design（failure-case） |

## 目的

Phase 5 で組み立てた `apps/api/src/sync/*` の manual route / scheduled handler / audit writer の各経路に対し、認可（SYNC_ADMIN_TOKEN Bearer）/ 外部 API（Sheets）/ 内部 DB（D1）/ ランタイム（Cloudflare Workers）/ 暗号（RS256 JWT）の 5 層で発生し得る異常系を網羅し、検出方法・retry 戦略・復旧手順・ログ JSON を揃える。03-serial の `data-contract.md` で確定された「audit は best-effort + 失敗を別 outbox に蓄積」方針を厳密に守ることを前提に、Phase 7 AC トレース表 / Phase 9 品質保証で検証可能な形に固定する。

## 実行タスク

1. 異常系を 5 層別に列挙し、14 件以上のマトリクスを完成する（完了条件: 各ケースに分類・原因・検出・retry 戦略・復旧・ログ JSON の 6 項目が埋まる）。
2. 各ケースの retry 戦略（即時失敗 / exponential / linear / no-retry / outbox 退避）を一意に決定する（完了条件: 全件で戦略が一意）。
3. audit best-effort + outbox 退避シナリオを独立節として記述する（完了条件: sync 本体成功 × audit 失敗の挙動が runbook 化されている）。
4. Auth.js admin role 失敗 (401/403) と CSRF 不正 (403) の境界を明示する（完了条件: 4 ケース＝未認証/role 不足/CSRF 欠落/CSRF 不一致 が独立に記述）。
5. Cron 二重起動・RS256 鍵不整合・Workers crypto.subtle 例外の Workers 固有ケースを記述する（完了条件: 3 件すべてに復旧コマンド付き）。
6. failure case ごとに Phase 4 の Vitest スイートへ wire-in を割り当てる（完了条件: 全件で対応スイートが特定）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-05.md | runbook 上の例外パスを起点 |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-04.md | Vitest スイート対応 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md | audit best-effort + outbox 方針 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md | 状態遷移と例外境界 |
| 必須 | docs/30-workflows/completed-tasks/ut-02-d1-wal-mode/index.md | `SQLITE_BUSY` 対策の前提 |
| 参考 | https://developers.google.com/sheets/api/limits | Sheets API quota |
| 参考 | https://developers.cloudflare.com/d1/platform/limits/ | D1 50K writes/day |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | crypto.subtle 仕様 |

## failure cases マトリクス

| # | 分類 | ケース | 原因 | 検出 | retry 戦略 | 復旧 | ログ JSON 例 |
| - | --- | --- | --- | --- | --- | --- | --- |
| 1 | Auth | 401 未認証 | Auth.js セッション cookie 欠落 | middleware で `getSession()` が null | no-retry | 呼び出し側ログイン誘導 | `{level:"warn",code:"SYNC_AUTH_UNAUTHORIZED",route:"/admin/sync"}` |
| 2 | Auth | 403 admin role 不足 | session.user.role !== 'admin' | role guard | no-retry | role 付与依頼 | `{code:"SYNC_FORBIDDEN_ROLE",actualRole:"member"}` |
| 3 | Auth | 403 CSRF 欠落 | `x-csrf-token` header なし | CSRF middleware | no-retry | UI 側 token 添付 | `{code:"SYNC_CSRF_MISSING"}` |
| 4 | Auth | 403 CSRF 不一致 | token 値が session と不一致 | CSRF middleware | no-retry | 再ログイン | `{code:"SYNC_CSRF_MISMATCH"}` |
| 5 | Sheets API | 401 Unauthorized | SA 鍵期限切れ / 1Password Employee vault 不整合 | fetch.status === 401 | no-retry、即時失敗 | `op://Employee/ubm-hyogo-env/GOOGLE_SHEETS_SA_JSON` 更新 → `wrangler secret put` | `{code:"SHEETS_AUTH_FAILED",sa:"ubm-hyogo-sheets-reader@..."}` |
| 6 | Sheets API | 403 Forbidden | SA がシート閲覧権限未付与 | fetch.status === 403 | no-retry | シート共有設定追加 | `{code:"SHEETS_FORBIDDEN",sheetId:"..."}` |
| 7 | Sheets API | 404 Not Found | `SHEETS_SPREADSHEET_ID` 誤り | fetch.status === 404 | no-retry | Variable 修正 → 再デプロイ | `{code:"SHEETS_NOT_FOUND",status:404}` |
| 8 | Mapper | 422 mapper 失敗 | 列順変更 / 必須フィールド欠落 / `exactOptionalPropertyTypes` 違反 | `mapRowToSheetRow` throw | no-retry（運用判断要） | mapper 列定数 (`COL`) を更新（不変条件 #1: schema をコードに固定しすぎない、運用ルール厳守） | `{code:"MAPPER_FAILED",rowIndex:42,missing:["consentAt"]}` |
| 9 | Sheets API | 5xx outage | Google 側障害 | fetch.status >= 500 | exponential backoff、最大 3 回（500ms + jitter） | 自動再試行のみ。3 回失敗で skipped 記録 + outbox | `{code:"SHEETS_5XX_RETRY",attempt:1,nextDelayMs:500}` |
| 10 | Sheets API | 429 quota | 300 req/min 超過 | retry-after header | linear backoff（header 値準拠）最大 3 回 | 次 cron まで待機 | `{code:"SHEETS_429",retryAfterSec:30}` |
| 11 | D1 | `SQLITE_BUSY` | 同時書き込み競合 | wrangler 例外 | exponential backoff（50/100/200/400/800ms + jitter）最大 5 回 | 自動再試行 | `{code:"D1_BUSY_RETRY",attempt:3}` |
| 12 | D1 | quota exceeded | 50K writes/day 超過 | wrangler error | no-retry、当日スキップ | 翌日 0:00 UTC リセット待ち / batch 集約 | `{code:"D1_QUOTA_EXCEEDED",writesToday:50001}` |
| 13 | Audit | audit 書き込み失敗 (主データ成功) | `INSERT INTO sync_audit_logs` で D1 例外 | catch in `writeAuditLog` | **outbox 退避**（no-retry、本体トランザクションを巻き戻さない） | outbox テーブルから replay バッチで再投入。03-serial data-contract.md に厳密準拠 | `{code:"AUDIT_OUTBOX_ENQUEUED",syncId:"...",reason:"D1_BUSY"}` |
| 14 | Crypto | RS256 鍵不整合 | PEM ヘッダ除去ミス / base64 デコード失敗 / `importKey` で `extractable:false` 違反 | `crypto.subtle.importKey` throw | no-retry、即時失敗 | 1Password Employee vault の SA 鍵を再 export → secret put | `{code:"JWT_SIGN_FAILED",cause:"InvalidKey"}` |
| 15 | Workers | Cron 二重起動 | 前回未完了 scheduled が残存 / manual と scheduled の同時実行 | `sync_locks` 行存在 | no-retry、後発スキップ | TTL 経過後に自動 acquire / 緊急時は手動 DELETE | `{code:"SYNC_SKIPPED_LOCKED",lockedSinceMs:300000,trigger:"cron"}` |
| 16 | Workers | CPU time 超過 | batch 過大 / `runSync` 内 loop | `Error: Worker exceeded CPU` | no-retry | `ctx.waitUntil()` 化 / batch 縮小 | `{code:"CPU_OVERRUN",batchSize:100}` |
| 17 | API | `/admin/sync` 5xx | mapper / D1 例外の catch-all | top-level catch | no-retry | error log + UT-07 通知委譲 | `{code:"SYNC_INTERNAL",cause:"...",route:"/admin/sync"}` |

合計: 17 件（要件 14 件以上を満たす）。

## audit best-effort + outbox 退避の独立 runbook

03-serial の `data-contract.md` 抜粋方針:

> sync 本体が成功して audit 書き込みのみ失敗した場合、ロールバックすると主データが失われ、放置すると監査性が破綻する。audit は best-effort + 失敗を別 outbox に蓄積する。勝手にトランザクション化しないこと。

実装上の挙動:

```
runSync(env, options)
  → fetchSheets()       (失敗 → 全体失敗)
  → upsertRows()        (失敗 → 全体失敗、audit には書かない)
  → writeAuditLog()     (失敗 → outbox に enqueue、本体は成功扱い)
  → return SyncResult { ok: true, auditDeferred: true }
```

outbox replay は別ジョブ（本タスクスコープ外、UT-08 monitoring 連携で formalize 候補）。本 Phase では「outbox に積むまで」を保証範囲とする。

## SYNC_ADMIN_TOKEN Bearer の 4 ケース境界

| ケース | HTTP | middleware 段階 | 識別子 |
| --- | --- | --- | --- |
| 未認証 | 401 | `requireSession` | `SYNC_AUTH_UNAUTHORIZED` |
| role 不足 | 403 | `requireAdminRole` | `SYNC_FORBIDDEN_ROLE` |
| CSRF 欠落 | 403 | `requireCsrfToken` | `SYNC_CSRF_MISSING` |
| CSRF 不一致 | 403 | `requireCsrfToken` | `SYNC_CSRF_MISMATCH` |

> middleware は Hono で集約し、`/admin/sync*` 全ルートに付け忘れない構成にする（Phase 8 DRY 化対象）。

## 各ケース ↔ Vitest スイート wire-in

| Case # | 対応スイート（Phase 4） |
| --- | --- |
| 1, 2, 3, 4 | `apps/api/test/sync/auth.test.ts`（authorization 4 ケース） |
| 5, 6, 7 | `apps/api/test/sync/sheets-client.test.ts`（contract 4xx 分類） |
| 8 | `apps/api/test/sync/mapper.test.ts`（型・列定数・exactOptionalPropertyTypes 検証） |
| 9, 10 | `apps/api/test/sync/sheets-client.test.ts`（retry-after / exponential） |
| 11, 12 | `apps/api/test/sync/worker.test.ts`（D1 競合・quota） |
| 13 | `apps/api/test/admin/sync/audit.test.ts`（best-effort + outbox enqueue） |
| 14 | `apps/api/test/sync/sheets-client.test.ts`（JWT 署名 import 異常系） |
| 15 | `apps/api/test/sync/scheduled.test.ts`（lock 競合） |
| 16, 17 | integration（`runSync` を直接呼ぶ pure 経路） |

## 復旧 runbook（代表 3 ケース）

### Case 5: SA 鍵期限切れ

```bash
# 1Password Employee vault で新 SA JSON を export → JSON.stringify
bash scripts/cf.sh wrangler secret put GOOGLE_SHEETS_SA_JSON --config apps/api/wrangler.toml --env production
# 残存 sync_locks をクリア
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote \
  --command "DELETE FROM sync_locks WHERE expires_at < strftime('%s','now')*1000"
# 手動リラン（admin session + CSRF token 必須）
curl -X POST https://api.example.com/admin/sync \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"
```

### Case 13: audit outbox 滞留

```bash
# outbox 件数確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote \
  --command "SELECT COUNT(*) FROM sync_audit_outbox WHERE replayed_at IS NULL"
# 手動 replay（UT-08 で別ジョブ化予定。MVP では admin route 経由）
curl -X POST https://api.example.com/admin/sync/audit/replay -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"
```

### Case 15: Cron 二重起動 / lock 残置

```bash
# 通常は TTL 経過後に自動失効。緊急時のみ強制解除
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote \
  --command "DELETE FROM sync_locks"
# 再実行
curl -X POST https://api.example.com/admin/sync -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case を AC マトリクスの「関連 failure case」列に紐付け |
| Phase 8 | auth middleware / SHA-256 hashing util / runSync ラッパの DRY 化 |
| Phase 9 | retry 戦略の境界値テストを coverage 対象に含める |
| Phase 10 | audit outbox 滞留と Cron 二重起動を blocker 評価対象 |
| Phase 11 | 復旧 runbook を staging で 1 件以上手動 smoke |

## 多角的チェック観点

- 価値性: 各ケースが運用者にとって意味のある復旧パスを示しているか。
- 実現性: Workers 50ms CPU 制限 / D1 50K writes/day を超えない設計か。
- 整合性: 不変条件 #1（schema をコードに固定しすぎない・mapper 失敗時の対処と整合）/ #4（admin-managed data 分離）/ #5（D1 アクセスは apps/api 内）を維持。
- 運用性: 復旧コマンドが `scripts/cf.sh` ラッパ経由で記述（wrangler 直叩き禁止）。
- 認可境界: SYNC_ADMIN_TOKEN Bearer の 4 ケースが独立に検出されるか。
- 無料枠: 5xx retry の最大回数が Sheets quota / D1 writes を圧迫しないか。
- 監査性: audit 失敗時に主データを巻き戻さず outbox に退避する 03-serial 契約に厳密準拠。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 17 件の failure case マトリクス | blocked |
| 2 | retry 戦略付与 | blocked |
| 3 | audit outbox 退避 runbook | blocked |
| 4 | SYNC_ADMIN_TOKEN Bearer 4 ケース境界 | blocked |
| 5 | Vitest スイート wire-in | blocked |
| 6 | 代表 3 ケース復旧 runbook | blocked |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | 17 件マトリクス + outbox runbook + 復旧コマンド |
| メタ | artifacts.json | Phase 6 状態更新 |

## 完了条件

- [ ] 14 件以上の failure case が分類別に網羅
- [ ] 全ケースで retry 戦略が一意
- [ ] audit best-effort + outbox 挙動が独立節で記述
- [ ] SYNC_ADMIN_TOKEN Bearer 4 ケース境界が独立に記述
- [ ] Cron 二重起動 / RS256 / crypto.subtle の Workers 固有ケースが含まれる
- [ ] 全ケースに対応する Phase 4 Vitest スイートが指定
- [ ] 代表 3 ケースの復旧 runbook が `scripts/cf.sh` ラッパ経由で記述

## タスク100%実行確認【必須】

- 実行タスク 6 件が `blocked`
- 成果物が `outputs/phase-06/failure-cases.md` に配置予定
- 17 件全てに 6 項目（分類・原因・検出・戦略・復旧・ログ）が記入
- Phase 5 擬似コードの例外パス（auth 失敗 / fetch 失敗 / mapper 失敗 / upsert 失敗 / audit 失敗 / lock 失敗）が全て failure case に対応

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - 17 件の failure case ID を AC マトリクスの「関連 failure case」列で参照
  - audit outbox 退避を AC として独立評価
  - 復旧 runbook を Phase 11 手動 smoke の対象に予約
- ブロック条件:
  - 14 件未満で Phase 7 へ進む
  - audit best-effort + outbox 方針が記述されない
  - SYNC_ADMIN_TOKEN Bearer 4 ケース境界が曖昧
