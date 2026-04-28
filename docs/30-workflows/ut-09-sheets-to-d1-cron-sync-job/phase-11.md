# Phase 11: 手動 smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 同期ジョブ実装 (UT-09) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-27 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク分類 | application_specification（manual smoke / non-visual） |
| user_approval_required | false |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由:
  - 本タスクは Cloudflare Workers Cron Trigger と `POST /admin/sync` のバックエンドジョブであり、エンドユーザー向け UI を提供しない。
  - 出力先は D1 テーブル（`members` / `sync_job_logs` / `sync_locks`）と Workers のログのみで、画面 / コンポーネント / レイアウト / インタラクションを伴わない。
  - 結果として screenshot による視覚証跡は不要。エンドポイント応答（JSON）と D1 行の SELECT 結果が一次証跡となる。
- 必須 outputs:
  - `outputs/phase-11/main.md`（smoke 実行サマリー / 既知制限 / 自動テスト結果）
  - `outputs/phase-11/manual-smoke-log.md`（コマンド単位の実行ログ）
  - `outputs/phase-11/link-checklist.md`（参照リンクが死んでいないかの最小チェック）
- **`outputs/phase-11/screenshots/.gitkeep` は作成しない**（NON_VISUAL のため screenshots ディレクトリ自体不要）。

## 目的

Phase 5 の implementation-runbook に基づき実装された `apps/api` の Cron 同期ジョブを、ローカルおよび dev 環境において手動で smoke 実行し、AC-1〜AC-7 / AC-9 / AC-10 がエンドツーエンドで動作することの一次証跡を採取する。staging 段階の load/contention test（AC-8）は UT-26 へ委譲し、本 Phase は **「実行を回せる」「ログが出る」「冪等である」** の確認に範囲を絞る。

## 実行タスク

1. ローカル `wrangler dev --test-scheduled` で scheduled handler を起動できることを確認する（完了条件: 起動ログ取得）。
2. `curl -X POST http://localhost:8787/__scheduled` で scheduled を疑似発火し、200 / 同期完了ログが返ることを確認する（完了条件: HTTP 200 + 件数ログ）。
3. `POST /admin/sync` を Bearer トークン付きで叩き、200 と件数 JSON が返ることを確認する（完了条件: 認証 PASS / Sheets→D1 件数一致）。
4. `wrangler d1 execute --command="SELECT * FROM sync_job_logs ORDER BY started_at DESC LIMIT 5"` で実行ログが記録されていることを確認する（完了条件: started_at / finished_at / fetched_count / upserted_count / failed_count / status が埋まっている）。
5. `wrangler d1 execute --command="SELECT * FROM sync_locks"` で lock の取得・解放サイクルが正しいことを確認する（完了条件: 実行中のみ row が存在し、終了後解放）。
6. 二重実行テストを実施する（同時に 2 回 POST する / もしくは 1 回目の在中に 2 回目を投げる）（完了条件: 2 回目が 409 系または skipped レスポンスで返る）。
7. 既知制限を `outputs/phase-11/main.md` に列挙する（完了条件: local 環境では Cron 自動発火しない等の制限が明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/outputs/phase-05/implementation-runbook.md | smoke 対象の実装手順 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/outputs/phase-07/ac-matrix.md | AC × smoke 項目の対応 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/outputs/phase-10/go-no-go.md | GO 判定の前提確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler 操作手順 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/sync` 認可確認 |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/#test-cron-triggers | `--test-scheduled` 公式 |

## 実行手順

### ステップ 1: ローカル wrangler dev 起動

```bash
cd apps/api
mise exec -- pnpm wrangler dev --test-scheduled --local --persist-to .wrangler/state
```

- 期待値: `Ready on http://localhost:8787` と `Cron triggers will be tested via /__scheduled` の出力。
- 失敗時: `wrangler.toml` の `[triggers].crons` 記述、binding 名（`DB`）を確認。

### ステップ 2: scheduled の疑似発火

```bash
curl -i -X POST 'http://localhost:8787/__scheduled?cron=0+*/6+*+*+*'
```

- 期待値: HTTP 200、Workers ログに `sync.start` / `sync.fetched=N` / `sync.upserted=N` / `sync.finished` が連続出力される。
- 失敗時: `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` の `.dev.vars` 反映を確認。

### ステップ 3: `/admin/sync` 手動実行

```bash
curl -i -X POST http://localhost:8787/admin/sync \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

- 期待値: HTTP 200 + `{ "ok": true, "result": { "status": "success", "fetched": N, "upserted": N, "durationMs": M } }` 形式の JSON。
- 認証検証: トークン未指定 / 不一致で 401、フォーマット不正で 401 を確認。

### ステップ 4: D1 ログの確認

```bash
mise exec -- pnpm wrangler d1 execute ubm-hyogo-local --local \
  --command="SELECT id, started_at, finished_at, status, fetched_count, upserted_count, failed_count, error_reason FROM sync_job_logs ORDER BY started_at DESC LIMIT 5;"

mise exec -- pnpm wrangler d1 execute ubm-hyogo-local --local \
  --command="SELECT id, acquired_at, expires_at, holder, trigger_type FROM sync_locks;"
```

- 期待値: `sync_job_logs` に最低 1 行（`status='success'`、`fetched_count` / `upserted_count` が Sheets 件数と一致）。`sync_locks` は実行終了後に行が削除されている。

### ステップ 5: 二重実行（idempotency）テスト

```bash
( curl -s -X POST http://localhost:8787/admin/sync -H "Authorization: Bearer $SYNC_ADMIN_TOKEN" & \
  curl -s -X POST http://localhost:8787/admin/sync -H "Authorization: Bearer $SYNC_ADMIN_TOKEN" & \
  wait )
```

- 期待値: 2 回のうち少なくとも 1 回が `result.status: 'skipped'` を返す。`member_responses` 行に重複が発生しない（`response_id` unique 制約で保証）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | test-strategy.md の手動 smoke 観点を本 Phase の手順に落とし込み |
| Phase 7 | AC matrix の smoke 列に本 Phase の証跡パスを記入 |
| Phase 9 | 自動テスト結果サマリー（unit / contract / E2E）を本 Phase の `main.md` に転記 |
| Phase 12 | smoke 実行で判明した運用知見を unassigned-task-detection.md / skill-feedback-report.md に登録 |

## 自動テスト結果サマリー（Phase 9 から転記、本 Phase の主証跡ソース）

| 種別 | テスト数 | PASS | FAIL | 主な検証対象 |
| --- | --- | --- | --- | --- |
| unit (mapper / validator) | TBD | TBD | TBD | Sheets row → D1 row 変換の冪等性 |
| contract (Sheets API client / D1 repo) | TBD | TBD | TBD | UT-03 認証・UT-04 スキーマ整合 |
| integration (`scheduled()` / `/admin/sync`) | TBD | TBD | TBD | end-to-end 同期 + lock + log |
| authorization (Bearer / no token / wrong token) | TBD | TBD | TBD | `/admin/sync` 認可境界 |

> **本 Phase の証跡の主ソースは自動テスト**。手動 smoke は AC の最終確認と既知制限の確定が目的であり、自動テストの代替ではない。

## 多角的チェック観点

- 価値性: ローカルで sync が回り D1 に件数が反映されているか。
- 実現性: `--test-scheduled` と `/__scheduled` POST の両方で発火確認できているか。
- 整合性: AC-1〜AC-7 / AC-9 / AC-10 の証跡パスが Phase 7 の AC matrix と整合しているか。
- 運用性: 二重実行が正しく 1 回に収束し、`sync_locks` が解放されるか。
- 認可境界: `/admin/sync` の Bearer 検証が PASS / 401 双方で動作しているか。
- Secret hygiene: ログに Service Account JSON / Bearer token が漏洩していないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | wrangler dev --test-scheduled 起動 | 11 | spec_created | local 起動確認 |
| 2 | /__scheduled POST 発火 | 11 | spec_created | scheduled 経路 |
| 3 | /admin/sync 手動実行 | 11 | spec_created | manual 経路 |
| 4 | sync_job_logs / sync_locks SELECT | 11 | spec_created | D1 証跡採取 |
| 5 | 二重実行テスト | 11 | spec_created | idempotency |
| 6 | 既知制限のリスト化 | 11 | spec_created | local Cron 自動発火不可等 |
| 7 | 自動テスト結果サマリー転記 | 11 | spec_created | Phase 9 から |

## manual evidence（実装後に採取するログの placeholder）【必須】

| 項目 | コマンド | 採取先 | 採取済 |
| --- | --- | --- | --- |
| wrangler dev 起動ログ | `wrangler dev --test-scheduled` | outputs/phase-11/manual-smoke-log.md §1 | TBD |
| /__scheduled 応答 | `curl -X POST http://localhost:8787/__scheduled` | outputs/phase-11/manual-smoke-log.md §2 | TBD |
| /admin/sync 応答 | `curl -X POST http://localhost:8787/admin/sync -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"` | outputs/phase-11/manual-smoke-log.md §3 | TBD |
| sync_job_logs SELECT | `wrangler d1 execute --command="SELECT * FROM sync_job_logs ORDER BY started_at DESC LIMIT 5"` | outputs/phase-11/manual-smoke-log.md §4 | TBD |
| sync_locks SELECT | `wrangler d1 execute --command="SELECT * FROM sync_locks"` | outputs/phase-11/manual-smoke-log.md §5 | TBD |
| 二重実行テスト応答 | 同時 2 並列 POST | outputs/phase-11/manual-smoke-log.md §6 | TBD |

> 各セクションには「コマンド」「実行日時」「stdout / stderr 抜粋」「期待値との一致 / 不一致」を記録すること。Bearer / SA_JSON は必ずマスクする。

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | local 環境では Cloudflare Cron Triggers が自動発火しない | 自動定期実行の確認は不可 | `--test-scheduled` + `/__scheduled` POST で代替 / dev 環境で再確認 |
| 2 | local D1 はファイルベースで本番の WAL 非前提制約を再現しきれない | contention 挙動 | UT-26 staging-deploy-smoke で再確認 |
| 3 | Sheets API quota は project 共有のため CI 並列実行で消費される | 開発時の rate limit | mock client を unit / contract で利用 |
| 4 | `--test-scheduled` の cron query は実 cron 式と独立 | 時刻に依存するロジックは smoke では検証不可 | dev で 1h 間隔観測 |
| 5 | 1Password CLI 未導入の環境では `.dev.vars` を手動で配置する必要がある | 開発者オンボーディング | `scripts/with-env.sh` のフォールバック使用 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 実行サマリー・自動テスト結果・既知制限 |
| ログ | outputs/phase-11/manual-smoke-log.md | 6 命令分の実行ログ（コマンド / stdout / stderr） |
| チェックリスト | outputs/phase-11/link-checklist.md | 参照ドキュメントのリンク死活確認 |
| メタ | artifacts.json | Phase 11 状態の更新 |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 ファイルが揃っている
- [ ] manual evidence テーブルの 6 項目すべての採取列が完了（または各 N/A 理由が記載）
- [ ] 自動テスト結果サマリー（unit / contract / integration / authorization）が転記されている
- [ ] 二重実行テストで idempotency が証明されている
- [ ] 既知制限が 5 項目以上列挙され、それぞれ委譲先または補足が記述されている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 3 ファイルが `outputs/phase-11/` 配下に配置される設計になっている
- AC-1〜AC-7 / AC-9 / AC-10 の証跡採取コマンドが定義済み
- AC-8（contention test）が UT-26 へ委譲されることが明記
- artifacts.json の `phases[10].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - smoke 実行で得られた運用知見を Phase 12 の `unassigned-task-detection.md` / `skill-feedback-report.md` に渡す
  - 既知制限 #2（contention 検証委譲）を UT-26 へ register
  - 自動テスト結果サマリーを `system-spec-update-summary.md` の影響範囲に転記
- ブロック条件:
  - manual evidence の 6 項目に未採取 / 未 N/A 化が残っている
  - 二重実行テストで重複が観測された（→ Phase 5 へ差し戻し）
  - `screenshots/` ディレクトリが誤って作成されている
