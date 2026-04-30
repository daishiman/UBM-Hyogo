# D1 migration `sync_locks` / `sync_job_logs` の down + 削除 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-ut09-sheets-migration-withdrawal-001 |
| タスク名 | D1 migration `sync_locks` / `sync_job_logs` の down + 削除 |
| 分類 | 撤回（migration） |
| 対象機能 | Forms/Sheets to D1 sync |
| 優先度 | 高（次 wave） |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | UT-09 Phase 12 未タスク検出（B-02） |
| 発見日 | 2026-04-29 |
| 関連 blocker | B-02 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-09 Phase 12 direction reconciliation（`task-ut09-direction-reconciliation-001`）の結果、同期 job の台帳を `sync_jobs` に一本化する方針が確定した。

旧 UT-09 の Sheets API 実装が追加した D1 migration には `sync_locks` と `sync_job_logs` の 2 テーブルが含まれている。これらは `sync_jobs` ledger と役割が重複しており、direction reconciliation で撤回対象として B-02 に分類された。

### 1.2 問題点・課題

`sync_locks` / `sync_job_logs` テーブルが本番 / staging の D1 スキーマに残ったままでは、次のような問題が生じる。

- `sync_jobs` と `sync_locks` / `sync_job_logs` の二重 ledger が継続し、03a / 03b / 09b cron 運用設計が混乱する
- 後続タスクが誤ったテーブルを参照して実装を進めるリスクがある
- D1 スキーマと正本仕様（`sync_jobs` 一本化）が乖離したまま PR が進む

### 1.3 放置した場合の影響

- 03a（parallel forms schema sync）/ 03b（parallel forms response sync）/ 09b（cron triggers monitoring）が `sync_jobs` と `sync_locks` のどちらを参照すべきか曖昧なままになる
- staging / 本番 D1 に不要テーブルが残り続け、将来の schema drift 監査でノイズになる
- B-01（impl 撤回）と同 wave で処理しないと、コードと D1 スキーマの不整合が長期化する

---

## 2. 何を達成するか（What）

### 2.1 目的

`sync_locks` / `sync_job_logs` テーブルを D1 から削除する down migration を作成・適用し、`sync_jobs` ledger による一本管理を完成させる。

### 2.2 最終ゴール

| 検証対象 | 期待状態 |
| --- | --- |
| 本番 D1 migration リスト | `sync_locks` / `sync_job_logs` を作成した migration が down 適用済み |
| staging D1 migration リスト | 同上 |
| D1 スキーマ | `sync_locks` / `sync_job_logs` テーブルが存在しない |
| `sync_jobs` テーブル | 変更なし・正常稼働 |

### 2.3 スコープ

#### 含むもの

- `sync_locks` / `sync_job_logs` を作成した up migration に対応する down script の作成
- staging D1 への down migration 適用（`bash scripts/cf.sh d1 migrations apply` 経由）
- 本番 D1 への down migration 適用（同上）
- 適用後の migration リストと D1 スキーマの確認

#### 含まないもの

- `sync_locks` / `sync_job_logs` を参照するアプリコードの撤回（B-01 スコープ）
- `sync_jobs` テーブル・migration の変更
- commit / push / PR 作成
- staging 実機 smoke の全量確認（UT-26 で扱う）

### 2.4 成果物

- down migration SQL ファイル（`apps/api/migrations/` 配下）
- staging / 本番への適用ログ（コマンド出力スクリーンショットまたはテキスト記録）
- 本タスク完了を示す `migrations list` 出力記録

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- B-10（runtime kill-switch）が完了していること
- B-01（impl 撤回）と同 wave で実施すること（コードと D1 スキーマの整合を保つため）
- `bash scripts/cf.sh` ラッパーが使用可能な状態であること（`wrangler` 直叩き禁止）
- 本番適用前に staging で動作確認を完了していること

### 3.2 依存タスク

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 前提（ブロッカー） | B-10（runtime kill-switch） | kill-switch 未適用の状態で migration を down すると cron が旧テーブルへ書き込みを試みる |
| 同 wave | B-01（impl 撤回） | コードと D1 スキーマを同タイミングで整合させる |
| 上流 | task-ut09-direction-reconciliation-001 | `sync_jobs` 一本化の方針決定 |
| 下流 | UT-26（staging smoke test） | 撤回後の実機動作確認 |

### 3.3 必要な知識

- Cloudflare D1 migration の up / down 仕組み
- `bash scripts/cf.sh d1 migrations apply` の使い方と `--env` オプション
- `sync_locks` / `sync_job_logs` テーブルの元 migration ファイル名・番号
- D1 schema の確認方法（`d1 migrations list` / `d1 execute --command "SELECT name FROM sqlite_master WHERE type='table'"` 等）

### 3.4 推奨アプローチ

1. 既存 migration ファイルを確認し、`sync_locks` / `sync_job_logs` を作成した up script を特定する
2. 対応する down script を作成する（`DROP TABLE IF EXISTS sync_locks; DROP TABLE IF EXISTS sync_job_logs;`）
3. staging に適用して migration リストとスキーマを確認する
4. 問題なければ本番に適用して同様に確認する

---

## 4. 実行手順

### Phase 1: 対象 migration の特定

1. `apps/api/migrations/` ディレクトリ配下の migration ファイルを確認する。
2. `sync_locks` / `sync_job_logs` の `CREATE TABLE` を含む migration ファイル名と番号を特定する。
3. `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` を実行し、現在の適用済み migration 一覧を確認する。

### Phase 2: down migration SQL の作成

1. 特定した migration ファイルに対応する down script を作成する。
   - ファイル名例: `<番号>_drop_sync_locks_sync_job_logs.sql`
   - 内容:
     ```sql
     DROP TABLE IF EXISTS sync_locks;
     DROP TABLE IF EXISTS sync_job_logs;
     ```
2. down script が `sync_jobs` や他の正式テーブルに影響しないことを確認する。

### Phase 3: staging への適用

1. staging D1 へ down migration を適用する:
   ```bash
   bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
   ```
2. 適用後に migration リストを確認する:
   ```bash
   bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
   ```
3. `sync_locks` / `sync_job_logs` テーブルが存在しないことを確認する:
   ```bash
   bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
     --command "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('sync_locks','sync_job_logs')"
   ```
   → 0 件が返ること。

### Phase 4: 本番への適用

1. staging での確認が完了したら、本番 D1 へ down migration を適用する:
   ```bash
   bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
   ```
2. 適用後に migration リストを確認する:
   ```bash
   bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
   ```
3. `sync_locks` / `sync_job_logs` テーブルが存在しないことを確認する:
   ```bash
   bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
     --command "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('sync_locks','sync_job_logs')"
   ```
   → 0 件が返ること。

### Phase 5: `sync_jobs` テーブルの正常性確認

1. `sync_jobs` テーブルが変更を受けていないことを確認する:
   ```bash
   bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
     --command "SELECT name FROM sqlite_master WHERE type='table' AND name='sync_jobs'"
   ```
   → 1 件が返ること。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `sync_locks` / `sync_job_logs` を作成した up migration に対応する down script が存在する
- [ ] staging D1 に down migration が適用されている
- [ ] 本番 D1 に down migration が適用されている
- [ ] `sync_locks` / `sync_job_logs` テーブルが staging / 本番 D1 の両方に存在しない
- [ ] `sync_jobs` テーブルが staging / 本番 D1 の両方で正常に存在している

### 品質要件

- [ ] `wrangler` を直接実行していない（`bash scripts/cf.sh` 経由のみ）
- [ ] down migration SQL が `sync_jobs` や他の正式テーブルを誤って削除しない
- [ ] staging 確認後に本番適用する順序が守られている
- [ ] B-10（runtime kill-switch）完了後に本タスクを実施している

### ドキュメント要件

- [ ] migration リスト出力が記録されている（staging / 本番双方）
- [ ] スキーマ確認クエリの結果が記録されている
- [ ] B-01（impl 撤回）との同 wave 実施が確認されている

---

## 6. 検証方法

| ケース | 検証コマンド | 期待結果 |
| --- | --- | --- |
| 本番 migration リスト確認 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` | `sync_locks` / `sync_job_logs` 作成 migration が down 状態 |
| staging migration リスト確認 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` | 同上 |
| 本番 テーブル不在確認 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('sync_locks','sync_job_logs')"` | 0 件 |
| staging テーブル不在確認 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('sync_locks','sync_job_logs')"` | 0 件 |
| `sync_jobs` 正常確認 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "SELECT name FROM sqlite_master WHERE type='table' AND name='sync_jobs'"` | 1 件 |

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| B-10（kill-switch）未適用状態で down すると cron が旧テーブルへ書き込みを試みてエラーになる | 高 | 中 | B-10 完了を事前に確認する。未完了なら本タスクをブロック |
| down migration SQL が誤って `sync_jobs` を削除する | 高 | 低 | SQL レビューで `DROP TABLE` 対象を明示確認。staging で先に検証する |
| staging と本番で migration 番号・適用状態がずれる | 中 | 低 | staging 確認後に本番適用。両環境で `migrations list` を記録する |
| `wrangler` 直叩きによるシークレット漏洩 | 高 | 低 | `bash scripts/cf.sh` ラッパーのみ使用を徹底する |

---

## 8. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md` | `sync_jobs` 一本化の方針決定記録 |
| 必須 | `apps/api/migrations/` | 対象 migration ファイルの特定 |
| 必須 | `scripts/cf.sh` | D1 操作ラッパー（wrangler 直叩き禁止） |
| 参考 | `docs/00-getting-started-manual/specs/08-free-database.md` | D1 構成と無料構成 |
| 参考 | `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` | cron runbook 正本 |

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | migration 二重 ledger（`sync_jobs` vs `sync_locks` + `sync_job_logs`）が混在し、03a / 03b / 09b の cron 運用設計に影響した |
| 原因 | 旧 UT-09 Sheets API 実装が独自の job 台帳テーブル（`sync_locks` / `sync_job_logs`）を追加したが、既存の `sync_jobs` ledger との整合確認が行われないまま migration が追加された |
| 対応 | UT-09 Phase 12 で `sync_jobs` 一本化を確認し、`sync_locks` / `sync_job_logs` を撤回対象（B-02）として formalize。本タスクで down migration を作成・適用する |
| 再発防止 | 新規 job 台帳テーブルを追加する場合は、既存 `sync_jobs` との責務重複がないか `task-sync-forms-d1-legacy-umbrella-001` と正本仕様を照合してから migration を作成する |

### 作業ログ

- 2026-04-29: UT-09 Phase 12 direction reconciliation の未タスク検出（B-02）として formalize。`task-ut09-direction-reconciliation-001` の Phase 2-A 結果を受けて本タスクを作成。

### 補足事項

- `wrangler` の直接実行は禁止。すべての D1 操作は `bash scripts/cf.sh` 経由で行う。
- B-01（impl 撤回）と同 wave で実施することで、コードと D1 スキーマの整合を保つ。
- B-10（runtime kill-switch）が完了していない場合は、本タスクの本番適用をブロックする。
