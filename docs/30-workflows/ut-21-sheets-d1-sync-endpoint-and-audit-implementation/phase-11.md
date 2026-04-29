# Phase 11: 手動 smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 sync endpoint 実装と audit logging (UT-21) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-29 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク分類 | application_specification（manual smoke / non-visual） |
| user_approval_required | false |
| Issue | #30 (CLOSED — 仕様書化のため再オープンしない) |
| タスク状態 | blocked（03-serial で基本実装済み・認証/テスト未完） |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由:
  - 本タスクは Cloudflare Workers の Hono ルート (`POST /admin/sync` / `POST /admin/sync/responses` / `GET /admin/sync/audit`) と Cron 経由の `scheduled()` ハンドラであり、エンドユーザー向け UI は持たない。
  - 出力先は D1 テーブル（`member_responses` / `sync_audit_logs` / `sync_audit_outbox` 等）と Workers ログ / curl JSON 応答に閉じる。
  - 結果として screenshot は不要。`curl -i` の HTTP 応答ヘッダ＋ボディと `wrangler d1 execute` の SELECT 結果が一次証跡となる。
- 必須 outputs:
  - `outputs/phase-11/main.md`（smoke 実行サマリー / 既知制限 / 自動テスト結果）
  - `outputs/phase-11/manual-smoke-log.md`（コマンド単位の実行ログ）
  - `outputs/phase-11/link-checklist.md`（参照リンク死活確認）
- **`outputs/phase-11/screenshots/.gitkeep` は作成しない**（NON_VISUAL 整合）。

## 目的

03-serial-data-source-and-storage-contract で確定した sync 契約に従い `apps/api/src/sync/*` 配下に実装された
`runSync` / `runBackfill` / `writeAuditLog` および Hono ルート (`POST /admin/sync` / `POST /admin/sync/responses` / `GET /admin/sync/audit`)
を、ローカル `wrangler dev --test-scheduled` および dev 環境において手動で smoke 実行する。
SYNC_ADMIN_TOKEN Bearer ガード、audit best-effort + outbox、SQLITE_BUSY 回避、冪等性、
03-serial の data-contract / sync-flow / runbook との 5 点同期が崩れていないことの一次証跡を採取する。
load/contention test や Cron の本番スケジュール最終チューニング (U-03) は本 Phase の対象外。

## 実行タスク

1. ローカル `wrangler dev --test-scheduled` で scheduled handler を起動し、`[triggers].crons` が読まれていることを確認する（完了条件: 起動ログに crons 行）。
2. `curl -X POST http://localhost:8787/__scheduled` で scheduled を疑似発火し、`runSync` の start → fetch → upsert → audit → complete のログが取得できることを確認する（完了条件: HTTP 200 + 5 状態のログ出力）。
3. `POST /admin/sync` を **Auth.js Authorization Bearer token** 付きで叩き、200 と件数 JSON が返ることを確認する。トークン無し / 一般ユーザー role / CSRF 欠落で 401 / 403 が返ることも別途確認する（完了条件: 認証 PASS / 認可境界 PASS）。
4. `POST /admin/sync/responses` を Bearer token 付きで叩き、history 含めた upsert が走り audit に `trigger_type='backfill'` が記録されることを確認する（完了条件: backfill 行 audit に存在）。
5. `GET /admin/sync/audit?limit=10` を Bearer token 付きで叩き、直近 audit 行が JSON で返ることを確認する（完了条件: 件数 / status / response_id_count / outbox_count フィールドが期待通り）。
6. `wrangler d1 execute --command="SELECT * FROM sync_audit_logs ORDER BY started_at DESC LIMIT 5"` で audit 行を確認する（完了条件: started_at / finished_at / trigger_type / fetched_count / upserted_count / status が埋まっている）。
7. 二重実行 / 冪等性テスト（同一データで 2 回 manual 実行）を実施し、`member_responses` に重複が生じないこと（`response_id` SHA-256 一意制約）と SQLITE_BUSY が retry で解消されることを確認する（完了条件: 重複 0 / retry ログ観測）。
8. **audit 失敗時の outbox 蓄積確認**: 故意に audit テーブル名を一時的に rename した状態で `runSync` を走らせ、本体 upsert は成功 + audit が outbox に蓄積されること、ロールバックされないことを確認する（完了条件: `sync_audit_outbox` に行が存在 / `member_responses` の主データはコミット済み）。
9. 既知制限を `outputs/phase-11/main.md` に列挙する（完了条件: local 環境では Cron 自動発火しない・Sheets quota など 5 件以上）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | UT-21 原典 spec |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md | 状態遷移の正本 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md | audit best-effort + outbox 仕様 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-05/sync-deployment-runbook.md | deploy / smoke 手順 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/sync*` 認可境界 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler 操作 |
| 必須 | CLAUDE.md | scripts/cf.sh / op 参照ルール / 認証要件 |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/outputs/phase-11/ | UT-09 smoke 構成リファレンス |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/#test-cron-triggers | `--test-scheduled` 公式 |

## 実行手順

### ステップ 1: ローカル wrangler dev 起動

```bash
cd apps/api
mise exec -- pnpm wrangler dev --test-scheduled --local --persist-to .wrangler/state
```

- 期待値: `Ready on http://localhost:8787` と Cron 設定読み込みログ。
- 失敗時: `wrangler.toml` の `[triggers].crons` と D1 binding (`DB`) を確認。
- secret 注入は `bash scripts/cf.sh` 経由ではなく、ローカル `.dev.vars` に op 参照を解決した値を一時注入する（`scripts/with-env.sh` 経由）。CLAUDE.md の op 参照ルールに従い実値を `.env` には書かない。

### ステップ 2: scheduled の疑似発火

```bash
curl -i -X POST 'http://localhost:8787/__scheduled?cron=0+*+*+*+*'
```

- 期待値: HTTP 200、ログに `sync.start` / `sync.fetched=N` / `sync.upserted=N` / `sync.audit.write` / `sync.complete` が連続出力。
- 失敗時: SA JSON (`op://Employee/ubm-hyogo-env/GOOGLE_SHEETS_SA_JSON`) と SPREADSHEET_ID の `.dev.vars` 反映を確認。SA 名は `ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com`。

### ステップ 3: `/admin/sync` 手動実行（SYNC_ADMIN_TOKEN Bearer）

```bash
# admin セッション cookie を Auth.js から取得済みとする
curl -i -X POST http://localhost:8787/admin/sync \
  -H "Cookie: authjs.session-token=$ADMIN_SESSION" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

- 期待値: HTTP 200 + `{ "ok": true, "result": { "status": "success", "fetched": N, "upserted": N, "auditId": "...", "durationMs": M } }`。
- 認可境界の追加検証:
  - cookie 無し → 401
  - 一般ユーザー role の cookie → 403
  - CSRF token 欠落 → 403
  - Authorization Bearer 不一致 → 401

### ステップ 4: `/admin/sync/responses` 実行

```bash
curl -i -X POST http://localhost:8787/admin/sync/responses \
  -H "Cookie: authjs.session-token=$ADMIN_SESSION" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"
```

- 期待値: HTTP 200 + history 含めて upsert、audit に `trigger_type='backfill'`。Sheet に実回答が必要。

### ステップ 5: `/admin/sync/audit` 取得

```bash
curl -s http://localhost:8787/admin/sync/audit?limit=10 \
  -H "Cookie: authjs.session-token=$ADMIN_SESSION" | jq .
```

- 期待値: 直近 audit 行配列。`status` / `trigger_type` / `fetched_count` / `upserted_count` / `outbox_count` を含む。

### ステップ 6: D1 audit / outbox 確認

```bash
mise exec -- pnpm wrangler d1 execute ubm-hyogo-local --local \
  --command="SELECT id, started_at, finished_at, trigger_type, status, fetched_count, upserted_count, error_reason FROM sync_audit_logs ORDER BY started_at DESC LIMIT 5;"

mise exec -- pnpm wrangler d1 execute ubm-hyogo-local --local \
  --command="SELECT id, payload, created_at FROM sync_audit_outbox ORDER BY created_at DESC LIMIT 5;"
```

### ステップ 7: 冪等性 / SQLITE_BUSY 回避テスト

```bash
( curl -s -X POST http://localhost:8787/admin/sync -H "Cookie: ..." -H "X-CSRF-Token: ..." & \
  curl -s -X POST http://localhost:8787/admin/sync -H "Cookie: ..." -H "X-CSRF-Token: ..." & \
  wait )
```

- 期待値: 両応答とも 200。`member_responses` に `response_id` の SHA-256 重複が無いこと（`generateResponseId` の冪等性）。SQLITE_BUSY が発生しても `runSync` 内 retry で吸収されること。

### ステップ 8: audit 失敗時 outbox 蓄積テスト

```bash
# 一時的に audit テーブル名を rename してから sync を走らせる
mise exec -- pnpm wrangler d1 execute ubm-hyogo-local --local \
  --command="ALTER TABLE sync_audit_logs RENAME TO sync_audit_logs_tmp;"

curl -s -X POST http://localhost:8787/admin/sync -H "Cookie: ..." -H "X-CSRF-Token: ..."

# outbox に蓄積されたか
mise exec -- pnpm wrangler d1 execute ubm-hyogo-local --local \
  --command="SELECT COUNT(*) FROM sync_audit_outbox;"

# 主データは入っているか（best-effort 方針: 本体ロールバックしない）
mise exec -- pnpm wrangler d1 execute ubm-hyogo-local --local \
  --command="SELECT COUNT(*) FROM member_responses;"

# 後始末
mise exec -- pnpm wrangler d1 execute ubm-hyogo-local --local \
  --command="ALTER TABLE sync_audit_logs_tmp RENAME TO sync_audit_logs;"
```

- 期待値: outbox 行 ≥1、`member_responses` の主データはコミット済み。03-serial data-contract.md の「audit best-effort + outbox」方針通り。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | test-strategy.md の手動 smoke 観点を本 Phase の手順に落とし込み |
| Phase 7 | AC matrix の smoke 列に本 Phase の証跡パスを記入 |
| Phase 9 | 自動テスト結果サマリー（unit / contract / integration / authz）を本 Phase の `main.md` に転記 |
| Phase 12 | smoke 知見を unassigned-task-detection / skill-feedback-report に登録 |

## 自動テスト結果サマリー（Phase 9 から転記）

| 種別 | テスト数 | PASS | FAIL | 主な検証対象 |
| --- | --- | --- | --- | --- |
| unit (mapper / generateResponseId / sheets-client JWT) | TBD | TBD | TBD | SHA-256 冪等キー / RS256 署名 / SheetRow 変換 |
| contract (Sheets API client / D1 repo) | TBD | TBD | TBD | UT-03 SA 認証・UT-04 / UT-22 schema 整合 |
| integration (`runSync` / `runBackfill` / `writeAuditLog`) | TBD | TBD | TBD | 状態遷移 + audit best-effort + outbox |
| authorization (Bearer) | TBD | TBD | TBD | `/admin/sync*` 認可境界 |

> 自動テストが本 Phase の主証跡。手動 smoke は AC 最終確認と既知制限確定が目的。

## 多角的チェック観点

- 価値性: ローカルで sync が回り D1 / audit / outbox に正しく反映されているか。
- 実現性: `--test-scheduled` + `/__scheduled` POST + 3 つの Hono ルートで全経路発火確認できているか。
- 整合性: 03-serial の data-contract / sync-flow / runbook と実装ログが 5 点同期しているか。
- 運用性: SQLITE_BUSY 発生時に retry が効き、二重実行で冪等が保たれるか。
- 認可境界: SYNC_ADMIN_TOKEN Bearer の 3 点が PASS / 401 / 403 双方で動作しているか。
- Secret hygiene: ログに SA JSON / Bearer / session cookie / op 参照値が漏洩していないか。
- exactOptionalPropertyTypes: SheetRow の `field: string | undefined` が DB バインドで `?? null` 処理されているか。
- Workers crypto.subtle: PEM ヘッダ除去 + base64 decode + RSASSA-PKCS1-v1_5/SHA-256 で JWT 署名が成功しているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | wrangler dev --test-scheduled 起動 | 11 | spec_created | local 起動 |
| 2 | /__scheduled POST 発火 | 11 | spec_created | scheduled 経路 |
| 3 | /admin/sync + admin/CSRF | 11 | spec_created | manual 経路 + 認可境界 |
| 4 | /admin/sync/responses 実行 | 11 | spec_created | trigger_type=backfill |
| 5 | /admin/sync/audit 取得 | 11 | spec_created | JSON 整合 |
| 6 | sync_audit_logs / outbox SELECT | 11 | spec_created | D1 証跡 |
| 7 | 冪等性 + SQLITE_BUSY 回避 | 11 | spec_created | retry 確認 |
| 8 | audit 失敗時 outbox 蓄積 | 11 | spec_created | best-effort 方針検証 |
| 9 | 既知制限のリスト化 | 11 | spec_created | 5 件以上 |

## manual evidence（実装後に採取するログの placeholder）【必須】

| 項目 | コマンド | 採取先 | 採取済 |
| --- | --- | --- | --- |
| wrangler dev 起動ログ | `wrangler dev --test-scheduled` | manual-smoke-log.md §1 | TBD |
| /__scheduled 応答 | `curl -X POST .../__scheduled` | §2 | TBD |
| /admin/sync 応答（admin + CSRF） | `curl -X POST .../admin/sync` | §3 | TBD |
| /admin/sync 認可境界 (401/403) | 4 パターン | §3-auth | TBD |
| /admin/sync/responses 応答 | `curl -X POST .../admin/sync/responses` | §4 | TBD |
| /admin/sync/audit 応答 | `curl .../admin/sync/audit` | §5 | TBD |
| sync_audit_logs SELECT | `wrangler d1 execute ...` | §6 | TBD |
| sync_audit_outbox SELECT | `wrangler d1 execute ...` | §6-outbox | TBD |
| 冪等性 + SQLITE_BUSY 並列実行 | 同時 2 並列 POST | §7 | TBD |
| audit 失敗時 outbox 蓄積 | rename + sync + COUNT | §8 | TBD |

> 各セクションには「コマンド」「実行日時」「stdout / stderr 抜粋」「期待値との一致 / 不一致」を記録。
> SA JSON / Bearer / session cookie / op:// 参照値は必ずマスクする。

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | local では Cloudflare Cron Triggers が自動発火しない | 自動定期実行確認不可 | `--test-scheduled` + `/__scheduled` POST 代替 / dev 環境で再確認 |
| 2 | local D1 は本番 WAL 非前提制約を再現しきれない | contention 挙動 | UT-26 staging-deploy-smoke へ委譲 |
| 3 | Sheets API quota は project 共有 | 開発時 rate limit | mock client を unit/contract で利用 |
| 4 | `--test-scheduled` の cron query は実 cron 式と独立 | 時刻依存ロジック検証不可 | dev で実観測 |
| 5 | 1Password CLI 未導入環境では `.dev.vars` 手動配置 | 開発者オンボーディング | `scripts/with-env.sh` フォールバック |
| 6 | `wrangler login` の OAuth トークンは禁止（CLAUDE.md） | CLI 認証 | `scripts/cf.sh` 経由で op 参照 `CLOUDFLARE_API_TOKEN` を使う |
| 7 | Cron スケジュール最終チューニングは U-03 に委譲 | dev/prod 分離 | 05a-observability で対応 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 実行サマリー・自動テスト結果・既知制限 |
| ログ | outputs/phase-11/manual-smoke-log.md | 8 命令分の実行ログ |
| チェックリスト | outputs/phase-11/link-checklist.md | 参照ドキュメントのリンク死活確認 |
| メタ | artifacts.json | Phase 11 状態の更新 |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 ファイルが揃っている
- [ ] manual evidence テーブル（10 項目）すべての採取列が完了（または各 N/A 理由が記載）
- [ ] 自動テスト結果サマリー（unit / contract / integration / authorization）が転記されている
- [ ] 冪等性 + SQLITE_BUSY 回避が証明されている
- [ ] audit 失敗時 outbox 蓄積（best-effort 方針）が証明されている
- [ ] 認可境界 4 パターン (admin OK / no cookie 401 / non-admin 403 / no CSRF 403) が記録されている
- [ ] 既知制限が 5 項目以上列挙され、それぞれ委譲先または補足が記述されている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）

## タスク100%実行確認【必須】

- 全実行タスク（9 件）が `spec_created`
- 成果物 3 ファイルが `outputs/phase-11/` 配下に配置される設計になっている
- AC × smoke の対応が Phase 7 ac-matrix と整合する設計になっている
- contention test (load) が UT-26 へ委譲されることが明記
- artifacts.json の `phases[10].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - smoke 実行で得られた運用知見を Phase 12 の unassigned-task-detection / skill-feedback-report に渡す
  - 既知制限 #2 (contention 検証) を UT-26 へ register
  - 自動テスト結果サマリーを system-spec-update-summary.md の影響範囲に転記
  - 03-serial data-contract / sync-flow / runbook との 5 点同期チェック結果を Phase 12 に渡す
- ブロック条件:
  - manual evidence の項目に未採取 / 未 N/A 化が残っている
  - 冪等性テストで重複が観測された（→ Phase 5 へ差し戻し）
  - audit 失敗時に主データがロールバックされた（→ best-effort 方針違反 / Phase 5 差し戻し）
  - `screenshots/` ディレクトリが誤って作成されている
