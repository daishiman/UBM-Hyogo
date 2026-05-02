# Phase 6: 異常系・失敗ハンドリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 6 |
| 状態 | spec_created |
| taskType | implementation / scripts / runbook |
| subtype | production-migration-apply-orchestrator |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. 新スコープ（orchestrator スクリプト F1〜F7, F9）に対応する異常系を、Phase 4 の bats TC / Phase 5 の exit code 規約と整合させて列挙する。
2. 各異常に対し「検出経路（exit code / fixture / grep）」「停止条件」「rollback 可否」「自己判断で追加 SQL を発行しない」方針を紐付ける。
3. evidence への Token / Account ID 混入は incident として独立扱いとし、即時封じ込め手順を明記する。
4. 課題スコープ表（F1 失敗 / `set -x` 混入 / CI gate 失敗 / Token 漏洩）を bats / CI gate / redaction-check のどこで検知されるかにマップする。

## 目的

production migration の orchestrator 化に伴い発生し得る「二重適用」「UNIQUE 衝突」「DB 取り違え」「ALTER TABLE 二重適用」「evidence 機密混入」「`set -x` 混入」「CI gate 失敗」「Token 漏洩」の 8 主要リスクに対し、検出経路と停止判断を一意に決め、自己判断で SQL を即興発行しない・Token 値を残さない原則を機械的に保証する。

## 参照資料

- `index.md`（AC-7, AC-8, AC-12）
- `artifacts.json`
- `phase-04.md`（TC-U-PF / TC-U-PC / TC-U-EV / TC-U-AP / TC-E）
- `phase-05.md`（exit code 規約 / Section 5 Failure handling）
- `apps/api/migrations/0008_schema_alias_hardening.sql`
- `scripts/cf.sh`
- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md`
- `docs/30-workflows/ut-fix-cf-acct-01-secrets-fix/outputs/phase-05/redaction-check.md`

## 入力

- Phase 4（bats TC / redaction TC）
- Phase 5（exit code 規約 / orchestrator 擬似コード）
- 上流 UT-07B `rollback-runbook.md` の 4 シナリオ

## 異常系シナリオ全体マップ

| 領域 | 検出層 | 関連 exit | 関連 FC |
| --- | --- | --- | --- |
| 適用前 | preflight.sh / 引数 parse | 2, 3 | FC-01〜05 |
| 適用中 | apply-prod.sh / wrangler 出力 | 4 | FC-06〜09 |
| 適用後 | postcheck.sh | 5 | FC-10〜14 |
| evidence 化 | evidence.sh / redaction-check | 6 | FC-15〜18 |
| 開発時 | bats / shellcheck / CI gate | 1, 2 | FC-23〜26 |
| scope 外 | 派生タスク | n/a | FC-19〜22 |

## 1. 適用前（Preflight 段階）

| FC ID | 想定異常 | 検出経路 | 停止条件 | 復旧方針 / rollback |
| --- | --- | --- | --- | --- |
| FC-01 | 二重適用検知（既適用 migration への再 apply） | `preflight.sh` の `assert_unapplied`（TC-U-PF-02） | exit=3、apply 未実行 | rollback 不要。適用済み事実と list 出力を `.evidence/d1/<ts>/preflight.json` に記録して終了。再 apply 禁止 |
| FC-02 | 対象 DB 取り違え（DB 名 / `--env` 不一致） | `preflight.sh parse_args` + `verify_db_exists`（TC-U-PF-03 / 04） | exit=2、apply 未実行 | DB 名・`--env` を訂正して preflight をやり直す |
| FC-03 | 認証疎通失敗（Token scope 不足 / 失効） | `preflight.sh verify_auth`（`cf.sh whoami` exit≠0） | exit=3 | U-FIX-CF-ACCT-01 の rollback / Token 再発行 → 再 preflight。本タスク内では Token 再発行を実施しない |
| FC-04 | 承認ゲート未充足（commit / PR / merge / ユーザー承認のいずれか欠落） | runbook 冒頭 4 ゲートの目視確認 | apply 未実行 | 4 ゲート全通過まで apply に進まない |
| FC-05 | 対象 commit / SQL 内容の差分発生 | `preflight.sh emit_preflight_json` の `head_sha` と承認時 SHA 不一致 | exit=3 | ユーザーに差分提示し再承認 |
| FC-26 | ALTER TABLE 二重適用（`backfill_cursor` 等が既存） | `preflight.sh` 拡張: `PRAGMA table_info(schema_diff_queue)` 結果に既存カラム検出 | exit=3、apply skip 判定 | 既適用扱いとして evidence に記録、apply に進まない |

## 2. 適用中（Apply 段階）

| FC ID | 想定異常 | 検出経路 | 停止条件 | 復旧方針 / rollback |
| --- | --- | --- | --- | --- |
| FC-06 | UNIQUE index 作成失敗（重複データ） | `apply-prod.sh` の wrangler exit≠0 + stderr `UNIQUE constraint failed` | exit=4、再試行禁止 | **rollback 不可（部分適用の可能性）**。① 部分適用範囲を `sqlite_master` 検索で特定 → ② 重複行特定 SQL（read-only）でユーザー提示 → ③ **自己判断で `DROP INDEX` / `DELETE` を発行しない**、ユーザー判断待ち。**別 migration 起票が rollback 経路** |
| FC-07 | ALTER TABLE duplicate column | wrangler 出力に `duplicate column name` | exit=4 | preflight FC-26 漏れを evidence に記録。**自己判断で `ALTER TABLE DROP COLUMN` を発行しない**（D1/SQLite で table 再構築を伴うため） |
| FC-08 | apply 中ネット中断 / API 一時失敗 | wrangler exit≠0、network/5xx | exit=4、1 回のみ再試行可 | 再試行前に `cf.sh d1 migrations list` で部分適用状態を確認。同一コマンドのみ許可、追加 SQL 禁止 |
| FC-09 | apply 出力に Token 値らしき文字列 | `evidence.sh redact_stream` 後の `verify_redaction` grep（TC-E01） | exit=6 | 該当行を削除し、`set -x` 由来でないこと確認。Token 値検出時は U-FIX-CF-ACCT-01 incident 手順へ |

## 3. 適用後（Post-check 段階）

| FC ID | 想定異常 | 検出経路 | 停止条件 | 復旧方針 / rollback |
| --- | --- | --- | --- | --- |
| FC-10 | `schema_aliases` table 不在 | `postcheck.sh verify_table` 0 行（TC-U-PC-02 系） | exit=5 | DB binding 取り違え（FC-02 由来）を疑う。`d1 list` 再確認 |
| FC-11 | UNIQUE index 1 件のみ存在 | `postcheck.sh verify_unique_indexes` 1 行（TC-U-PC-02） | exit=5、部分適用扱い | rollback 不可、判断待ち |
| FC-12 | `backfill_cursor` / `backfill_status` 欠落 | `postcheck.sh verify_columns`（TC-U-PC-03） | exit=5、部分適用扱い | 同上、判断待ち |
| FC-13 | post-check 中に destructive smoke 誤発行 | コマンド履歴に INSERT / UPDATE / DELETE / DROP | 即停止、incident 化 | runbook 違反として evidence 記録、ユーザー報告 |
| FC-14 | back-fill cursor / status を使う実 back-fill 処理を本 runbook で実行 | コマンド履歴 | 即停止 | scope 外。queue/cron split 別タスクへ移管 |

## 4. Evidence 化段階（Token / Account ID 混入）

| FC ID | 想定異常 | 検出経路 | 停止条件 | 復旧方針 |
| --- | --- | --- | --- | --- |
| FC-15 | evidence に Token 様 token 混入 | TC-E01 `grep -rEn '[A-Za-z0-9_-]{40,}'`、`evidence.sh verify_redaction` | exit=6、Phase 11 確定前に redact | **incident**: ① 該当行削除 → ② Cloudflare Dashboard で Token Roll → ③ GitHub Secret 値更新（U-FIX-CF-ACCT-01 rollback）→ ④ git history 残存時は force push 範囲拡張 → ⑤ `meta.json` に incident log（Token 値そのものは記録しない） |
| FC-16 | Account ID 様 32 桁 hex 混入 | TC-E02 grep | exit=6 | redact。Account ID は機密でないが漏洩面最小化方針として記録しない |
| FC-17 | `set -x` 由来の `+ wrangler ...` 出力混入 | TC-E03 grep `^\+ (bash\|wrangler\|cf\.sh\|scripts/) `、bats `apply-prod.bats` で `set -x` 検出 | exit=6 / bats 失敗 | `set -x` 有効化禁止を再徹底、混入ログ削除 |
| FC-18 | `wrangler` 直叩きログ混入 | TC-E04 grep | exit=6 | `cf.sh` 経由縛り再徹底、直叩きログ削除し再実行 |

## 5. 開発時（bats / CI gate / shellcheck）

| FC ID | 想定異常 | 検出経路 | 停止条件 | 復旧方針 |
| --- | --- | --- | --- | --- |
| FC-23 | bats テスト失敗（F1〜F5 の挙動 regression） | `pnpm test:scripts` exit≠0、CI `bats-unit` job 失敗 | PR block | 該当 fixture と関数を見直し、TC を再 GREEN にしてから再 push |
| FC-24 | staging dry-run 失敗 | CI `staging-dry-run` job exit≠0 | PR block | `.evidence/d1/<ts>/` を artifact 取得して原因特定。Token scope 不足なら U-FIX-CF-ACCT-01 へ |
| FC-25 | shellcheck 警告 | CI `lint-shell` 失敗 | PR block | 警告を fix してから再 push、`shellcheck disable` 濫用禁止 |
| FC-26（再掲） | preflight が ALTER TABLE 二重を検知できない | bats `preflight.bats` の追加ケース | TC RED | preflight に `PRAGMA table_info` 検査を追加 |

## 6. scope 外（派生タスク候補）

| FC ID | 想定異常 | 対応 |
| --- | --- | --- |
| FC-19 | UNIQUE 衝突発生時の重複行 quarantine 自動化要請 | 別タスク（UT-07B-FU-04 候補） |
| FC-20 | back-fill cursor / status を使う実 back-fill 処理 | 別タスク（unassigned-task-detection.md 起票済み） |
| FC-21 | admin UI retry label の表示要件 | 別タスク |
| FC-22 | wrangler-action / OIDC 移行 | U-FIX-CF-ACCT-01 Option D 派生 |

## rollback 判断基準

| 状況 | rollback 可否 | 判断 |
| --- | --- | --- |
| Preflight 失敗（FC-01〜05, FC-26） | rollback 不要 | apply 未実行 |
| apply UNIQUE 衝突（FC-06） | **rollback 不可** | DROP INDEX 自己判断禁止、別 migration 起票 |
| apply duplicate column（FC-07） | **rollback 不可** | DROP COLUMN 自己判断禁止、別 migration 起票 |
| apply ネット中断（FC-08） | 部分的 rollback 可 | `migrations list` 確認後ユーザー判断で再試行 or 停止 |
| postcheck 部分欠落（FC-11, FC-12） | rollback 不可 | 判断待ち |
| evidence 混入（FC-15〜18） | rollback 不要 | redaction、Token 混入時は Token Roll |
| 開発時失敗（FC-23〜25） | n/a | PR block で対応 |

> **共通方針**: rollback 不可ケースは **自己判断で追加 SQL を発行せず**、ユーザーへ事象 / 部分適用状態 / 想定復旧経路を提示して判断を仰ぐ。`apps/api/migrations/0008_schema_alias_hardening.sql` 自体の書き換えは UT-07B 責務であり、本 runbook では行わない。

## 課題スコープ → 検知層マップ（要求対応）

| ケース | 検知層 | 対応 exit / 結果 |
| --- | --- | --- |
| 二重適用 | F1 preflight + bats TC-U-PF-02 | exit=3、apply 中断 |
| UNIQUE 衝突 | F4 apply 中の wrangler stderr | exit=4、判断待ち、別 migration 起票 |
| DB 取り違え | F1 引数 parse + `verify_db_exists` | exit=2、即時中断 |
| ALTER TABLE 二重 | F1 preflight `PRAGMA table_info` | exit=3、apply skip |
| evidence 機密混入 | F3 `verify_redaction` | exit=6、Token Roll 検討 |
| `set -x` 混入 | F7 bats（`set -x` 痕跡検出） + redaction-check TC-E03 | bats 失敗 / exit=6 |
| CI gate 失敗 | F6 staging-dry-run / bats-unit / redaction-check / lint-shell | PR block |
| Token 漏洩 | F3 + redaction-check + `redaction-check.md` grep | evidence 削除 + 報告 + Token Roll |

## エラーハンドリング方針

- アプリ実装ロジックを含まないため try/catch は対象外。
- 検出は exit code / SQL 件数 / `migrations list` 出力 / `grep` pattern match の 4 段。
- 復旧操作中に `set -x` を**絶対に有効化しない**。
- `wrangler` 直叩きは復旧操作でも禁止。`bash scripts/cf.sh` 経由のみ。

## 監視・通知

| 観点 | 経路 | 期間 |
| --- | --- | --- |
| apply 結果 | `cf.sh d1 migrations list ubm-hyogo-db-prod --env production` | apply 直後・24h 後 |
| Token 値露出 | redaction-check（CI 永続 gate） + Phase 11 完了直前再実行 | 永続 |
| 既適用差分 | Cloudflare Dashboard → D1 → migration history | apply 後 24h |
| bats regression | CI `bats-unit` job | PR ごと |

## 統合テスト連携

- アプリ統合テストは追加しない。
- 異常検出は exit code / SQL 結果 / grep gate の組み合わせ + bats / CI gate。

## 完了条件

- [ ] 異常系シナリオが 6 領域（適用前 / 中 / 後 / evidence / 開発時 / scope 外）で網羅
- [ ] 各シナリオに検出経路（exit code / TC ID）・停止条件・復旧方針が紐付いている
- [ ] rollback 不可ケース（FC-06, FC-07, FC-11, FC-12）が明示され、自己判断で SQL 発行しない方針が記載されている
- [ ] Token / Account ID 混入時の incident 手順（FC-15, FC-16）が定義されている
- [ ] `set -x` 混入 / CI gate 失敗 / Token 漏洩 が課題スコープ表で検知層にマップされている
- [ ] UT-07B `rollback-runbook.md` の 4 シナリオ（index blocks / collision / back-fill fail / CPU 枯渇）が FC-06 / FC-11 / FC-12 / FC-14 にマップ

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | rollback 不可ケースの「自己判断 SQL 発行禁止」「`cf.sh` 経由縛り」が全シナリオ統一 |
| 漏れなし | PASS | 適用前 / 中 / 後 / evidence / 開発時 / scope 外の 6 領域 × 計 26 シナリオで網羅 |
| 整合性 | PASS | Phase 4 TC ID / Phase 5 exit code 規約と FC が 1:1 対応 |
| 依存関係整合 | PASS | 上流 UT-07B `rollback-runbook.md` 継承、下流 Phase 7 AC マトリクスへ接続 |

## 成果物

- `outputs/phase-06/main.md`
