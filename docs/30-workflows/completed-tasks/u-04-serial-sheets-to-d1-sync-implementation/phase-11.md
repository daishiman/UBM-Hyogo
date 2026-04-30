# Phase 11: 受け入れ確認（NON_VISUAL smoke）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sheets-to-d1-sync-implementation |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 受け入れ確認 |
| 作成日 | 2026-04-30 |
| 前 Phase | 10 (ドキュメント整備) |
| 次 Phase | 12 (ドキュメント更新) |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | apps/api sync layer manual / scheduled / backfill / audit writer |
| 起源 Issue | GitHub #67（CLOSED 維持） |
| 状態 | pending |

## 目的

Phase 1 で確定した AC-1〜AC-12 と、不変条件 #1〜#7 すべてに対して、Phase 4〜10 で生成された evidence（unit test / contract test / integration smoke / runbook 実行ログ / audit ledger query）を 1:1 で紐付けし、PASS / FAIL を決定する。**本タスクは NON_VISUAL（API + Cron handler + DB writer 実装）であり、screenshot は取得しない**。代替 evidence として `curl` ログ、Cloudflare log、audit ledger の SELECT 結果、JSON テストレポートを root evidence とする。

## NON_VISUAL evidence ポリシー

| 項目 | 内容 |
| --- | --- |
| 主ソース | `outputs/phase-09/main.md`（test report）、`outputs/phase-05/runbook.md` 実行ログ、`sync_audit` SELECT 結果 |
| screenshot を作らない理由 | UI 表面が存在しない。manual / backfill / audit endpoint は `requireSyncAdmin` 経由の JSON、scheduled は HTTP endpoint を持たない。検証は curl + DB query のみで完結する |
| placeholder PNG | **作成しない**（UBM-010 / phase-11-non-visual-alternative-evidence.md に従い、`screenshots/.gitkeep` も配置しない） |
| 環境 | local（miniflare）+ staging（dev branch deploy）の 2 段。production は本タスク対象外（09b へ引継ぎ） |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-12 定義 |
| 必須 | outputs/phase-04/main.md | テスト戦略（unit / contract / integration） |
| 必須 | outputs/phase-05/runbook.md | manual / scheduled / backfill 起動手順 |
| 必須 | outputs/phase-07/ac-matrix.md | AC × 実装トレース |
| 必須 | outputs/phase-09/main.md | 品質結果 |
| 必須 | outputs/phase-10/main.md | GO / NO-GO 判定 |
| 必須 | `docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md` | flow 期待値 |
| 参考 | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` | NON_VISUAL evidence ルール |

## 実行手順

### ステップ 0: 前提確認

| 項目 | 期待 | 確認方法 |
| --- | --- | --- |
| Phase 10 GO 判定 | GO | outputs/phase-10/main.md |
| `apps/api/src/sync/{manual,scheduled,backfill,audit}.ts` の 4 ファイル存在 | あり | `ls apps/api/src/sync/` |
| `wrangler.toml` `[triggers] crons` 追記 | あり | `grep -A2 '\[triggers\]' apps/api/wrangler.toml` |
| `sync_audit` テーブル存在 | あり | `bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --command "PRAGMA table_info(sync_audit)" --env staging` |
| secrets 配置（staging） | あり | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` で `GOOGLE_SERVICE_ACCOUNT_JSON` を確認（値は出力しない） |

### ステップ 1: local smoke

| ID | 手順 | 期待 | evidence |
| --- | --- | --- | --- |
| S-01 | `mise exec -- pnpm --filter @ubm/api dev`（miniflare 起動） | apps/api ローカル起動 | local dev ログ |
| S-02 | `curl -s -X POST http://localhost:8787/admin/sync/run -H "Authorization: Bearer $ADMIN_TOKEN"` | 200 + `{ auditId, status:"success", upserts:N }` | `outputs/phase-11/evidence/curl/S-02.log` |
| S-03 | S-02 直後に `bash scripts/cf.sh d1 execute ubm-hyogo-db-local --command "SELECT id,trigger,status,started_at,finished_at FROM sync_audit ORDER BY id DESC LIMIT 1" --local` | 1 row、status=success、trigger=manual | `outputs/phase-11/evidence/db/S-03.json` |
| S-04 | S-02 を即時 2 回連続実行 | 2 回目は 409 + `{ error:"sync_in_progress" }` または順次 success（mutex 動作） | `outputs/phase-11/evidence/curl/S-04.log` |
| S-05 | 同一 responseId を 2 回 sync（fixture で再現） | upsert 冪等、`member_responses` 行が重複しない | `outputs/phase-11/evidence/db/S-05.json` |
| S-06 | `curl -X POST .../admin/sync/backfill` 実行後、`SELECT publish_state, is_deleted FROM member_status WHERE member_id=...` を before/after 比較 | admin 列の値が変化しない | `outputs/phase-11/evidence/db/S-06.json` |
| S-07 | mock Sheets API で 429 を返す → backoff 3 回後 `failed` 記録 | `sync_job_logs.status='failed'`, `error_reason` redacted | `outputs/phase-11/evidence/db/S-07.json` |
| S-08 | consent 列に `publicConsent`/`rulesConsent` 以外の値を含む fixture を sync | mapping 段で正規化 or unmapped、payload に該当キーが残らない | `outputs/phase-11/evidence/db/S-08.json` |

### ステップ 2: staging smoke

| ID | 手順 | 期待 | evidence |
| --- | --- | --- | --- |
| S-10 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` | deploy 成功 | `outputs/phase-11/evidence/deploy/S-10.log` |
| S-11 | `curl -s -X POST https://api-staging.<host>/admin/sync/run -H "Authorization: Bearer $ADMIN_TOKEN_STAGING"` | 200 + `{ auditId, status }` | `outputs/phase-11/evidence/curl/S-11.log` |
| S-12 | scheduled handler を `bash scripts/cf.sh dispatch --config apps/api/wrangler.toml --env staging --cron "0 * * * *"` で手動発火 | scheduled 経由で audit ledger row 作成、status=success | `outputs/phase-11/evidence/db/S-12.json` |
| S-13 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --command "SELECT trigger,COUNT(*) FROM sync_audit GROUP BY trigger" --env staging` | manual / scheduled の両方が 1 件以上 | `outputs/phase-11/evidence/db/S-13.json` |
| S-14 | `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging` を別端末で起動し S-11 を再実行 | log に `sync.start` / `sync.finish` が出る | `outputs/phase-11/evidence/log/S-14.log` |

### ステップ 3: AC × evidence マトリクス

| AC | 内容 | 検証 evidence | PASS 条件 |
| --- | --- | --- | --- |
| AC-1 | `manual.ts` / `scheduled.ts` / `backfill.ts` / `audit.ts` 4 ファイル配備 | `ls apps/api/src/sync/` 出力（`outputs/phase-11/evidence/fs/AC-01.log`） | 4 ファイル存在 |
| AC-2 | `POST /admin/sync/run` admin 必須 + 200 + `auditId` | S-02 / S-11 | 両環境で 200 + auditId 取得 |
| AC-3 | scheduled handler が Cron Trigger から起動し全件 upsert sync | S-12 / S-14 | scheduled trigger row が `sync_audit` に記録 |
| AC-4 | backfill が admin 列に触れない | S-06 | publish_state / is_deleted の before == after |
| AC-5 | 全経路で `sync_audit` row 作成 → running → success/failed finalize | S-03 / S-07 / S-12 | running が 1 度も残らない |
| AC-6 | 同 responseId 再実行で副作用なし | S-05 | 行数増分 0 |
| AC-7 | mutex（status='running' 中は新規拒否） | S-04 | 409 または順序保証ログ |
| AC-8 | data-contract.md mapping に対する contract test pass | `outputs/phase-09/main.md` の contract test サマリー | 差分 0 件 |
| AC-9 | apps/web から D1 直アクセス禁止に違反しない | `grep -rn "from \"@cloudflare/d1\"" apps/web/` 結果 0 件（`outputs/phase-11/evidence/fs/AC-09.log`） | 0 件 |
| AC-10 | Workers 非互換依存（`googleapis` 等）を持ち込まない | `grep -E "\"googleapis\"\|\"google-auth-library\"" apps/api/package.json` 結果 0 件（`outputs/phase-11/evidence/fs/AC-10.log`） | 0 件 |
| AC-11 | consent キーは `publicConsent` / `rulesConsent` のみ受理 | S-08 | DB 上に該当キー以外なし |
| AC-12 | rate limit 時に exponential backoff 最大 3 回、超過時 failed | S-07 | retry 3 回ログ + failed 記録 |

### ステップ 4: 不変条件チェック

| # | 不変条件 | 確認 evidence |
| --- | --- | --- |
| #1 | schema コード固定回避 | `form_field_aliases` を経由した mapping ログ（S-08） |
| #2 | consent キー統一 | S-08 |
| #3 | responseEmail = system field | mapping.ts の grep + AC-11 |
| #4 | admin 列分離 | S-06 |
| #5 | apps/web から D1 直接禁止 | AC-9 evidence |
| #6 | GAS prototype 不昇格 | AC-10 evidence |
| #7 | Sheets を真として backfill | S-06 + sync-flow.md trace |

### ステップ 5: evidence 収集

```
outputs/phase-11/
├── main.md                                # 結果サマリー（GO / NO-GO 判定 + AC マトリクス）
├── manual-test-result.md                  # NON_VISUAL evidence メタ（主ソース・撮影しない理由）
└── evidence/
    ├── curl/                              # S-02 / S-04 / S-11 等
    ├── db/                                # SELECT JSON 出力
    ├── fs/                                # ls / grep 結果
    ├── deploy/                            # cf.sh deploy ログ
    └── log/                               # Cloudflare tail ログ（scripts/cf.sh 経由）
```

> `screenshots/` ディレクトリは**作らない**（NON_VISUAL）。`.gitkeep` も配置しない。

## 統合テスト連携【必須】

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke 結果を documentation-changelog.md に記録、AC マトリクスを implementation-guide.md Part 2 に転記 |
| Phase 13 | PR description に S-02 / S-11 / S-12 のサマリーと `sync_audit` 取得結果を引用 |
| 下流 05b | smoke readiness の入力（manual / scheduled / backfill が staging で稼働している証跡） |
| 下流 09b | Cron 監視 / runbook 化の入力（S-12 / S-14 の trail ログ） |

| 判定項目 | 基準 | 結果記録先 |
| --- | --- | --- |
| Unit Line | 80%+ | outputs/phase-09/main.md |
| Unit Branch | 60%+ | outputs/phase-09/main.md |
| Contract test（mapping 差分ゼロ） | 100% | outputs/phase-09/main.md |
| Integration（manual / scheduled / backfill） | 100% | 本 Phase S-02〜S-14 |

## 多角的チェック観点

| # | 不変条件 | 観点 |
| --- | --- | --- |
| #1 | schema 固定回避 | mapping.ts に stableKey 文字列ハードコードがないか |
| #2 | consent キー統一 | DB / payload に `publicConsent` / `rulesConsent` 以外がないか |
| #4 | admin 列分離 | backfill 後の `member_status` 列で admin 列が不変か |
| #5 | D1 アクセス境界 | apps/web 側に `@cloudflare/d1` import が混入していないか |
| #6 | GAS 不昇格 | apps/api/package.json に Node 専用 SDK が混入していないか |
| #7 | Sheets を真 | backfill による Sheets-side 値の上書きが期待通りか |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 前提確認 | 11 | pending | ステップ 0 |
| 2 | local smoke S-01〜S-08 | 11 | pending | miniflare |
| 3 | staging smoke S-10〜S-14 | 11 | pending | dev 環境 |
| 4 | AC マトリクス埋め込み | 11 | pending | AC-1〜AC-12 |
| 5 | 不変条件チェック | 11 | pending | #1〜#7 |
| 6 | evidence 配置 | 11 | pending | curl / db / fs / log |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | 結果サマリー + AC マトリクス |
| メタ | outputs/phase-11/manual-test-result.md | NON_VISUAL evidence メタ（主ソース / placeholder 不採用理由） |
| evidence | outputs/phase-11/evidence/ | curl / DB SELECT / fs / deploy / log |
| メタ | artifacts.json | phase 11 status |

## 完了条件

- [ ] S-01〜S-08（local）と S-10〜S-14（staging）が PASS
- [ ] AC-1〜AC-12 すべてに evidence が紐付き PASS
- [ ] 不変条件 #1〜#7 すべてに evidence が紐付き PASS
- [ ] `outputs/phase-11/evidence/` 以下にファイルが配置されている
- [ ] `screenshots/` ディレクトリは作成していない（NON_VISUAL）
- [ ] manual-test-result.md に主ソースと placeholder 不採用理由が記録されている
- [ ] **本 Phase 内の全タスクを 100% 実行完了**

## タスク 100% 実行確認【必須】

- 全 6 サブタスクが completed
- outputs/phase-11/main.md と manual-test-result.md 配置
- AC × evidence マトリクス（12 行）が空欄なし
- 不変条件 #1〜#7 が evidence で証明
- artifacts.json の phase 11 を completed に更新

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: AC マトリクス、smoke evidence path、placeholder 不採用判定
- ブロック条件: AC のいずれか FAIL、不変条件違反、evidence 不足のいずれかなら進まない

## 真の論点

- staging で `sync_audit` の `status='running'` が retry 中に残った場合、次回 cron で 409 が連発する → 09b の monitoring へ「running が 30 分以上残った場合 alert」を引き継ぐ
- `bash scripts/cf.sh dispatch` の内部 wrangler 挙動に依存する。失敗時は cron 表現を `* * * * *`（毎分）に一時変更して観測する代替手順を S-12 に明記すること
