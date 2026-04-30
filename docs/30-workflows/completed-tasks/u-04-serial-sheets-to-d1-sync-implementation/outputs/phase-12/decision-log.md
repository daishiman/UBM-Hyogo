# u-04 Decision Log（Phase 1-11 重要判断ログ）

Phase 12 close-out の正本。今後の sync 系タスクの参照点とする。

## D-01: Issue #67 の reopen 回避

| 項目 | 内容 |
| --- | --- |
| 日付 | 2026-04-30 |
| Phase | index.md / Phase 1 |
| 判断 | GitHub Issue #67 は CLOSED 維持。実装 PR / commit から `Refs #67` で参照のみ |
| 理由 | Issue は spec_created 段階で既に CLOSED。再 open は履歴汚染となる |
| 影響 | Phase 13 PR description は `Refs #67` 表記のみ |

## D-02: Audit ledger は `sync_job_logs` を採用

| 項目 | 内容 |
| --- | --- |
| 日付 | 2026-04-30 |
| Phase | Phase 2 |
| 判断 | UT-01 設計の論理名 `sync_log` ではなく、既存物理テーブル `sync_job_logs` を audit ledger に採用。mutex は `sync_locks` テーブル併用 |
| 理由 | UT-01 close-out で「physical 名は `sync_job_logs` / `sync_locks` を維持し、論理名は doc trace のみ」と確定済み。新テーブル作成は U-05 migration 範囲を膨らませる |
| 影響 | `audit-ledger-spec.md` のスキーマ対応表で 1:1 trace。`sync/audit.ts` の writer が実体 |

## D-03: Mutex 方式は `sync_locks` テーブル + 30 分自動 expiry

| 項目 | 内容 |
| --- | --- |
| 日付 | 2026-04-30 |
| Phase | Phase 2 / 3 |
| 判断 | Cloudflare Durable Objects ではなく D1 上の `sync_locks` で mutex を実装。`expires_at < now()` で強制取得を許可 |
| 理由 | (a) DO は本タスクスコープ外で課金影響あり (b) cron 頻度（毎時）+ 30 分 expiry なら衝突確率十分低い (c) running 残留時の自動回復が DB 1 クエリで済む |
| 影響 | `sync/mutex.ts`, `sync/audit.ts withSyncMutex`. 09b で「30 分以上残留 alert」設計 |

## D-04: Workers 上の Google Sheets 認証は fetch + `crypto.subtle` JWT 自前実装

| 項目 | 内容 |
| --- | --- |
| 日付 | 2026-04-30 |
| Phase | Phase 2 / 5 |
| 判断 | `googleapis` / `google-auth-library` Node SDK は不採用。`sheets-client.ts` で Service Account JWT を `crypto.subtle.sign` (RS256) で自前生成し、`https://oauth2.googleapis.com/token` に fetch する |
| 理由 | (a) Workers ランタイムは Node 不互換 (b) bundle size 削減 (c) 不変条件 #6（GAS prototype 不昇格）と同じ思想 |
| 影響 | `apps/api/package.json` から Node 専用 SDK を排除。`fetchWithBackoff` で 429/5xx 再試行 |

## D-05: Mapping 統合戦略 — 既存 `jobs/mappers/sheets-to-members.ts` を `sync/mapping.ts` から re-export

| 項目 | 内容 |
| --- | --- |
| 日付 | 2026-04-30 |
| Phase | Phase 5 / 9 |
| 判断 | sync 専用に新規 mapping を書き起こさず、既存 `jobs/mappers/sheets-to-members.ts`（contract test 済み）を `sync/mapping.ts` から re-export する形で統合 |
| 理由 | (a) 31 stableKey contract テストがそのまま通る (b) consent extraction（`extract-consent.ts`）も既存ロジックを再利用 (c) 二重実装による drift を防ぐ |
| 影響 | AC-6（mapping は 31 stableKey 契約に従う）が既存テストで保証される |

## D-06: 認証境界 — `requireSyncAdmin` (Bearer) を `requireAdmin` (cookie) と分離

| 項目 | 内容 |
| --- | --- |
| 日付 | 2026-04-30 |
| Phase | Phase 2 / 5 |
| 判断 | `/admin/sync/*` 系は専用 middleware `requireSyncAdmin` で `SYNC_ADMIN_TOKEN` Bearer を必須とする。人間向け管理 UI の `requireAdmin` (cookie/session) とは完全分離 |
| 理由 | (a) sync は機械操作（curl / Cron）が主用途で cookie 不要 (b) 05a / 04c close-out で sync 系 token gate 維持が正本化済み (c) Bearer rotation は cf secret put のみで完結 |
| 影響 | `apps/api/src/middleware/require-sync-admin.ts` 新設。401/500 ハンドリング |

## D-07: Backfill は admin 列温存（不変条件 #4）

| 項目 | 内容 |
| --- | --- |
| 日付 | 2026-04-30 |
| Phase | Phase 2 / 6 |
| 判断 | backfill は member_responses / member_identities / member_status のうち `member_status.publish_state` / `is_deleted` / `meeting_sessions` 等の admin 列を一切 touch しない |
| 理由 | 不変条件 #4「admin-managed data は sync 対象外」に準拠。Sheets を真として backfill するが、運用者判定の admin 列は保護対象 |
| 影響 | `upsert.ts` / `backfill.ts` が UPDATE 時に admin 列を SET 句に含めない。AC-4 / AC-10 で test 化 |

## D-08: 旧 `POST /admin/sync` は互換 mount として残す

| 項目 | 内容 |
| --- | --- |
| 日付 | 2026-04-30 |
| Phase | Phase 9 |
| 判断 | 既存 `apps/api/src/routes/admin/sync.ts` は削除せず、`runManualSync` への delegate として互換 mount で残置 |
| 理由 | (a) 既存運用スクリプトの URL を破壊しない (b) 正本は `/admin/sync/run` に移動済みで dual-write は発生しない |
| 影響 | Phase 11 で `routes/admin/sync.test.ts` の mock を `runManualSync` シグネチャへ更新 |

## D-09: NON_VISUAL evidence policy

| 項目 | 内容 |
| --- | --- |
| 日付 | 2026-04-30 |
| Phase | Phase 11 |
| 判断 | screenshot / placeholder PNG / `screenshots/.gitkeep` をすべて作成しない。代替 evidence は test 実行ログ + curl runbook + 期待 audit row |
| 理由 | UI 表面が存在しない（manual / scheduled / backfill / audit はいずれも JSON or Cron handler）。`phase-11-non-visual-alternative-evidence.md` 準拠 |
| 影響 | `manual-test-result.md` を主 evidence として運用 |

## D-10: 上流 / 下流 task relay

| 上流 / 下流 | task | 引継ぎ事項 |
| --- | --- | --- |
| 上流 | 03 contract | data-contract.md / sync-flow.md 差分ゼロ確認済み |
| 上流 | U-05 migration | sync_job_logs / sync_locks / member_* スキーマは U-05 で配備済み |
| 上流 | 04 secrets | `GOOGLE_SERVICE_ACCOUNT_JSON` / `SHEETS_SPREADSHEET_ID` / `SYNC_ADMIN_TOKEN` の本番配置 |
| 下流 | 05b smoke readiness | staging 実機 smoke は 05b で実施。runbook-final.md を入力に使う |
| 下流 | 09b cron monitoring | `running` 30 分残留 alert / 成功率 dashboard / cron 表現変更通知 routine |

## D-11: TECH-M-04 — `cf.sh dispatch` fallback

| 項目 | 内容 |
| --- | --- |
| 日付 | 2026-04-30 |
| Phase | Phase 11 |
| 判断 | `bash scripts/cf.sh dispatch` の wrangler 内部挙動が失敗した場合の fallback として、cron 表現を `* * * * *` に一時短縮 → deploy → 1 分待機 → 復元の手順を runbook に明記 |
| 理由 | wrangler の dispatch サブコマンドはバージョンによって挙動が異なる。primary 経路が壊れても scheduled 動作確認できる経路を残す |
| 影響 | `runbook-final.md` §2 / `cron-operations.md` §2 |
