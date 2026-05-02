# Phase 6: 異常系・失敗ハンドリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 6 |
| 状態 | spec_created |
| taskType | requirements / operations / runbook |
| subtype | production-migration-runbook |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. production migration apply 運用で想定される異常系を「適用前 / 適用中 / 適用後 / evidence 化」の 4 領域に分けて列挙する。
2. 各シナリオに検出経路（コマンド・gate）／停止条件／復旧方針／rollback 可否を紐付ける。
3. rollback 不可（UNIQUE 衝突等）のケースは「手動修復 + ユーザー判断待ち」を明記し、自己判断で追加 SQL を即興発行する選択肢を排除する。
4. evidence への Token / Account ID 混入は incident として独立扱いとし、即時封じ込め手順を明記する。
5. scope 外（queue/cron split / admin UI retry / OIDC 移行）を派生タスク候補として明示する。

## 目的

production migration の運用において、二重適用 / UNIQUE 衝突 / DB 取り違え / ALTER TABLE 失敗 / ネット中断 / Token 混入の各リスクを、Token 値を残さず・自己判断で SQL を即興発行せずに復旧できるよう、一意の停止判断と復旧経路を定義する。

## 参照資料

- `index.md`（AC-7, AC-8, AC-12）
- `artifacts.json`
- `phase-04.md`（TC-N01〜N04, TC-E01〜E04）
- `phase-05.md`（Section 7 Failure handling 概要、Section 8 Smoke 制限）
- `apps/api/migrations/0008_schema_alias_hardening.sql`
- `scripts/cf.sh`
- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md`

## 入力

- Phase 4（TC ID）
- Phase 5（runbook 本体構造）
- 上流 UT-07B `rollback-runbook.md` の 4 シナリオ（index blocks / collision / back-fill fail / CPU 枯渇）

## 異常系シナリオ

### 1. 適用前（Preflight 段階の異常）

| シナリオ ID | 想定異常 | 検出経路 | 停止条件 | 復旧方針 / rollback 可否 |
| --- | --- | --- | --- | --- |
| FC-01 | 二重適用検知（既適用 migration への再 apply） | Preflight: `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` で `0008_schema_alias_hardening.sql` が既適用側 | apply に**進まない**（exit せず Section 7-A へ） | rollback 不要。適用済み事実と適用日時（list の出力）を evidence に記録して runbook 終了。再度の apply は禁止 |
| FC-02 | 対象 DB 取り違え（staging 用 DB 名 / `--env staging` 混在） | Preflight: コマンド文字列 review、`d1 list` で `ubm-hyogo-db-prod` 存在確認 | apply に進まない | DB 名を `ubm-hyogo-db-prod`、環境を `--env production` に修正してから Preflight をやり直す |
| FC-03 | 認証疎通失敗（Token scope 不足 / 失効） | Preflight: `bash scripts/cf.sh whoami` が exit≠0 または `Authentication error [code: 10000]` | apply に進まない | U-FIX-CF-ACCT-01 の rollback / Token 再発行 → 再 Preflight。本タスク内では Token 再発行を実施しない |
| FC-04 | 承認ゲート未充足（commit 未 merge / ユーザー承認なし） | Section 2 チェックリストの未充足項目 | apply に進まない | 未充足項目を解消するまで待機。ユーザー承認なしでの apply は禁止 |
| FC-05 | 対象 commit / SQL 内容の差分発生 | `git rev-parse HEAD` と承認時 commit SHA の不一致、または `apps/api/migrations/0008_schema_alias_hardening.sql` の last commit hash 変更 | apply に進まない | 承認を再取得。差分内容をユーザーに提示して再承認 |

### 2. 適用中（Apply 段階の異常）

| シナリオ ID | 想定異常 | 検出経路 | 停止条件 | 復旧方針 / rollback 可否 |
| --- | --- | --- | --- | --- |
| FC-06 | UNIQUE index 作成失敗（既存 `schema_aliases` に重複データ） | apply 出力に `UNIQUE constraint failed` または `code: ...` | 即停止。再試行禁止 | **rollback 不可（部分適用の可能性あり）**。次手順:<br>① `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "SELECT name FROM sqlite_master WHERE type IN ('table','index') AND name LIKE 'schema_aliases%' OR name LIKE 'idx_schema_aliases%';"` で部分適用範囲を特定<br>② 重複行の特定 SQL（read-only）でユーザーに提示<br>③ 自己判断で `DROP INDEX` / `DELETE` を発行しない。ユーザー判断待ち |
| FC-07 | ALTER TABLE duplicate column（`backfill_cursor` / `backfill_status` が既存） | apply 出力に `duplicate column name: backfill_cursor` 等 | 即停止 | Preflight `PRAGMA table_info(schema_diff_queue)` の確認漏れを evidence に記録。既存カラムの整合性をユーザー判断で評価。**自己判断で `ALTER TABLE DROP COLUMN` を発行しない**（D1/SQLite 制約上、列削除は table 再構築を伴うため） |
| FC-08 | apply 中のネットワーク中断 / Cloudflare API 一時失敗 | exit≠0、wrangler 出力に network / 5xx | 1 回のみ再試行可、それでも失敗なら即停止 | 再試行前に必ず `migrations list` で部分適用状態を確認。再試行は同一コマンドのみ許可、追加 SQL は禁止 |
| FC-09 | apply コマンド出力の途中に Token 値らしき文字列 | `cf.sh` 出力を redaction gate で grep（TC-E01） | evidence 化前に redact、Token Roll を検討 | 該当行を削除し、`set -x` 由来でないことを確認。Token 値が確認された場合は U-FIX-CF-ACCT-01 の incident 手順へ |

### 3. 適用後（Post-check 段階の異常）

| シナリオ ID | 想定異常 | 検出経路 | 停止条件 | 復旧方針 / rollback 可否 |
| --- | --- | --- | --- | --- |
| FC-10 | post-check で `schema_aliases` table 不在 | Section 5 SELECT 結果が 0 行 | apply 失敗扱い | apply 出力を再確認。実際は適用されているのに DB binding が staging に向いていた可能性を疑う（FC-02 由来）。`d1 list` で対象 DB を再確認 |
| FC-11 | UNIQUE index 2 件のうち片方のみ存在 | Section 5 SELECT 結果が 1 行 | 部分適用扱い | rollback 不可。残 1 件の作成失敗原因を SQL ログから特定し、ユーザー判断待ち |
| FC-12 | `backfill_cursor` / `backfill_status` のいずれかが PRAGMA 結果に欠落 | Section 5 PRAGMA 出力で対象列なし | 部分適用扱い | 同上、判断待ち |
| FC-13 | post-check 中に destructive smoke を誤って発行 | コマンド履歴に INSERT / UPDATE / DELETE / DROP | 即停止、incident 化 | runbook Section 8 違反として evidence に記録、ユーザーへ報告 |
| FC-14 | back-fill cursor / status を使う実 back-fill 処理を本 runbook で実行 | コマンド履歴に該当処理 | 即停止 | scope 外。queue/cron split 別タスクへ移管 |

### 4. Evidence 化段階の異常（Token / Account ID 混入）

| シナリオ ID | 想定異常 | 検出経路 | 停止条件 | 復旧方針 / rollback 可否 |
| --- | --- | --- | --- | --- |
| FC-15 | evidence に Token 値らしき長 token 混入 | TC-E01 `grep -rEn '[A-Za-z0-9_-]{40,}' outputs/` でヒット | Phase 11 確定前に必ず redact | **即時 incident 対応**: ① 該当行を削除 → ② Cloudflare Dashboard で Token Roll → ③ GitHub Secret 値更新（U-FIX-CF-ACCT-01 の rollback 手順）→ ④ git history に残ったら force push 範囲を main 含め全 ref に拡張 → ⑤ Phase 11 evidence に incident log 追記（Token 値そのものは記録しない） |
| FC-16 | evidence に Account ID らしき 32 桁 hex 混入 | TC-E02 `grep -rEn '[a-f0-9]{32}' outputs/` でヒット | 同上 | 該当行を redact。Account ID は機密ではないが、漏洩面の最小化方針として記録しない |
| FC-17 | `set -x` 由来の `+ wrangler ...` 出力混入 | TC-E03 `grep -rnE '\+ (bash\|wrangler\|cf\.sh) '` でヒット | redaction 必須 | runbook 実行中の `set -x` 有効化を禁止。混入したログは削除 |
| FC-18 | `wrangler` 直叩きログ混入 | TC-E04 `grep -v 'scripts/cf.sh'` の wrangler 行 | redaction 必須 | runbook の `bash scripts/cf.sh` 経由縛りを再徹底。直叩きログは削除し、cf.sh 経由で再実行 |

### 5. scope 外（派生タスク候補）

| シナリオ ID | 想定異常 | 対応 |
| --- | --- | --- |
| FC-19 | UNIQUE 衝突発生時の重複行 quarantine 自動化要請 | 別タスク化（UT-07B-FU-04 候補）。本 runbook では手動判断のみ |
| FC-20 | back-fill cursor / status を使う実 back-fill 処理（queue/cron split） | 別タスク（unassigned-task-detection.md で起票済み） |
| FC-21 | admin UI retry label の表示要件 | 別タスク（同上） |
| FC-22 | wrangler-action / OIDC 移行 | U-FIX-CF-ACCT-01 の Option D 派生として別タスク化 |

## rollback 判断基準

| 状況 | rollback 可否 | 判断 |
| --- | --- | --- |
| Preflight 失敗（FC-01〜05） | rollback 不要 | apply 未実行のため何も戻さない |
| apply 中 UNIQUE 衝突（FC-06） | **rollback 不可** | DROP INDEX で部分復旧は可能だが、自己判断で発行しない。ユーザー判断待ち |
| apply 中 duplicate column（FC-07） | **rollback 不可** | D1/SQLite で `DROP COLUMN` は table 再構築を伴うため自己判断不可。ユーザー判断待ち |
| apply 中ネット中断（FC-08） | 部分的 rollback 可 | `migrations list` で適用状態確認後、ユーザー判断で再試行 or 停止 |
| post-check 部分欠落（FC-11, FC-12） | rollback 不可 | 部分適用の確定後、ユーザー判断 |
| evidence 混入（FC-15〜18） | rollback 不要 | redaction で対応。Token 混入は Token Roll が rollback 相当 |

> **共通方針**: rollback 不可（FC-06 / FC-07 / FC-11 / FC-12）の場合は、自己判断で追加 SQL を即興発行せず、ユーザーへ事象・部分適用状態・想定復旧経路を提示して判断を仰ぐ。`apps/api/migrations/0008_schema_alias_hardening.sql` 自体の書き換えは UT-07B の責務であり、本 runbook では行わない。

## エラーハンドリング方針

- 本タスクはアプリ実装ロジックを含まないため try/catch は対象外。
- 検出は **`cf.sh` exit code / SQL SELECT 件数 / `migrations list` 出力 / `grep` pattern match** の四段に委ねる。
- 復旧操作中は `set -x` 等の echo を**絶対に有効化しない**。
- `wrangler` 直叩きは復旧操作でも禁止。`bash scripts/cf.sh` 経由のみ。

## 監視・通知

| 観点 | 経路 | 期間 |
| --- | --- | --- |
| apply 結果 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` の事後確認 | apply 直後・24h 後 |
| Token 値露出 | TC-E01〜E04 を Phase 11 完了直前に必須実行 | 永続 gate |
| 既適用 / 未適用差分 | Cloudflare Dashboard → D1 → 該当 DB の migration history | apply 後 24h |

## 統合テスト連携

- 本タスクではアプリ統合テストを追加しない。
- 異常検出は `cf.sh` exit code / SQL 結果 / grep gate の組み合わせのみ。

## 完了条件

- [ ] 異常系シナリオが ID 付きで 4 領域すべて（適用前 / 適用中 / 適用後 / evidence 化）に列挙されている
- [ ] 各シナリオに検出経路・停止条件・復旧方針が紐付いている
- [ ] rollback 不可シナリオ（FC-06 / FC-07 / FC-11 / FC-12）が明示され、自己判断で SQL を即興発行しない方針が記載されている
- [ ] Token / Account ID 混入時の incident 手順（FC-15 / FC-16）が定義されている
- [ ] scope 外シナリオ（FC-19〜FC-22）が派生タスク候補として明示されている
- [ ] UT-07B `rollback-runbook.md` の 4 シナリオ（index blocks / collision / back-fill fail / CPU 枯渇）が FC-06 / FC-11 / FC-12 / FC-14 にマップされている

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | rollback 不可シナリオでの「自己判断で SQL 発行しない」方針が一貫。`bash scripts/cf.sh` 経由縛りも全シナリオで統一 |
| 漏れなし | PASS | 適用前 / 中 / 後 / evidence の 4 領域 × 計 22 シナリオで網羅。UT-07B `rollback-runbook.md` の 4 シナリオも全てマップ |
| 整合性あり | PASS | Phase 4 TC-N / TC-E と FC が対応。Phase 5 Section 7 の概要を本 Phase で詳細化 |
| 依存関係整合 | PASS | 上流 UT-07B `rollback-runbook.md` を継承し、下流 Phase 7 AC マトリクス（AC-7, AC-8, AC-12）に接続 |

## 成果物

- `outputs/phase-06/main.md`
