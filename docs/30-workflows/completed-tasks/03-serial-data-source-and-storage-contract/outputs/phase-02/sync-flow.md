# sync-flow.md（manual / scheduled / backfill / recovery / audit）

## 0. 共通事項

- 配置: `apps/api/src/sync/`（apps/web には置かない、不変条件 5）
- 認証: `GOOGLE_SERVICE_ACCOUNT_JSON`（Cloudflare Secrets）で Sheets API 呼び出し
- 冪等キー: `responseId`（upsert）
- direction: Sheets → D1 のみ
- audit: 全実行で `sync_audit` に記録

---

## 1. manual sync flow

### trigger
- 管理者 UI（apps/web admin）→ apps/api `/admin/sync/run` POST → sync worker
- 認証: admin role 必須

### flow
1. `sync_audit` に `trigger='manual', status='running'` で row 作成
2. Sheets API で対象シートの全行を取得（または delta クエリ）
3. responseId ごとに以下:
   - `member_responses` を upsert（PK: response_id）
   - `member_identities` を upsert（UNIQUE: response_email、`current_response_id` を最新へ更新、不変条件 7）
   - consent 値を `member_status.public_consent` / `rules_consent` に反映
4. diff 件数を `sync_audit` に記録、`status='success'` で finalize
5. 失敗時は `status='failed'` + `failed_reason` を記録、return error

### 冪等性
- 同 responseId への再実行: upsert により副作用なし
- 並行実行: `sync_audit.status='running'` の row が存在する場合は新規実行を拒否（mutex 相当）

---

## 2. scheduled sync flow

### trigger
- Cloudflare Workers cron triggers（`wrangler.toml` の `[triggers] crons = ["0 * * * *"]`）
- 頻度: **1 時間ごと（初回値）**

### 頻度根拠
- D1 writes 上限: 100,000 / day（specs/08）
- 1h 周期 = 24 回/day
- 50 名 MVP では 1 回あたりの差分 writes は数件〜数十件オーダー
- 24 × 数十 = 数百〜数千 writes/day → 上限の 1〜3% 程度

### flow
1. `sync_audit` に `trigger='scheduled'` で row 作成
2. Sheets API で `submittedAt > last_success.finished_at` の差分のみ取得
3. manual と同じ upsert 処理
4. `sync_audit` finalize

### 失敗時
- 当該実行を `failed` で記録
- 次回 scheduled が再試行（差分検出により未取込分を回収）
- 連続 N 回失敗で観測 alert（Phase 05a で metrics 化）

---

## 3. backfill flow

### trigger
- 障害時/移行時のみ。runbook（Phase 5）から `wrangler` 経由で発火、または管理者 UI の dedicated ボタン

### flow（truncate-and-reload）
1. `sync_audit` に `trigger='backfill'` で row 作成
2. **D1 トランザクション内で**:
   - `member_responses` を `DELETE`（または新テーブル swap）
   - `member_identities` を `DELETE`
   - admin-managed テーブル（`member_status` の admin 列、`meeting_sessions` 等）は**触らない**
3. Sheets 全行を取得し、responseId 順で upsert
4. `member_identities.current_response_id` を最新の submittedAt で再計算
5. consent を `member_status.public_consent` / `rules_consent` に反映（admin 列は維持）
6. `sync_audit` finalize

### 冪等性
- responseId が冪等キー
- truncate-and-reload なので部分実行で破綻しないよう transaction で囲む

---

## 4. failure recovery

### 原則
- **Sheets を真として再 backfill** することで D1 を再構築（AC-4 / 不変条件 7）

### ケース別
| 障害 | 対応 |
| --- | --- |
| scheduled 単発失敗 | 次回 scheduled で差分回収 |
| scheduled 連続失敗 | manual sync を発火 / `sync_audit` で reason 確認 |
| D1 データ破損 | backfill flow を実行（§3） |
| D1 喪失 | 新 D1 を `wrangler d1 create` → schema migrate → backfill |
| Sheets API rate limit | exponential backoff、次回 scheduled で再試行 |
| Sheets 同時編集による drift | 次回 sync で最新状態が反映される（read-only sync のため drift は自然解消） |
| admin-managed data 喪失 | dump からの import（Sheets では復元不可、`wrangler d1 export` の dump を併用） |

---

## 5. audit log

`sync_audit` テーブルに以下を記録:

| 列 | 内容 |
| --- | --- |
| audit_id | 実行 ID（UUID） |
| trigger | manual / scheduled / backfill |
| started_at / finished_at | 実行時刻 |
| status | running / success / failed |
| inserted_count | 新規 responseId の挿入件数 |
| updated_count | 既存 responseId の更新件数 |
| skipped_count | 変更なしでスキップした件数 |
| failed_reason | 失敗理由（文字列） |
| diff_summary_json | 差分サマリ（responseId 一覧、変更フィールド数等） |

- Phase 05a の observability で metrics として参照
- 管理者 UI に最新 N 件を表示

---

## 6. 異常系の対応設計

| 異常 | 対応 |
| --- | --- |
| Sheets API rate limit | exponential backoff（最大 3 回）、超過時は `failed` 記録 |
| D1 writes 100K/day 上限接近 | scheduled 頻度を 2h / 3h へ後退、または差分判定強化 |
| sync 競合（manual 中に scheduled） | `sync_audit.status='running'` を mutex として後者を拒否 |
| schema 変更（Form 改訂） | `revisionId` / `schemaHash` の変化を検知し、未知 questionId は `extra_fields_json` に格納 |
| consent キーの揺れ | `publicConsent` / `rulesConsent` 以外の表記は受理せず（不変条件 2）、mapping 段で正規化 |

---

## 7. ライブラリ・責務境界

- Sheets API client: Workers 互換の fetch ベース実装（`googleapis` の Node 依存を避ける）
- D1 driver: `wrangler` binding 直接利用。drizzle-orm はオプション扱い（Phase 5 で再評価）
- sync worker 配置: `apps/api/src/sync/`（apps/web 配下禁止 / 不変条件 5）
- GAS prototype の保存方式は持ち込まない（不変条件 6）

---

## 8. AC トレース

| AC | 対応箇所 |
| --- | --- |
| AC-1 | §0（direction 一意化） |
| AC-2 | §1 / §2 / §3（manual / scheduled / backfill 分離） |
| AC-3 | §3 backfill / §4 recovery（runbook 化前提は Phase 5） |
| AC-4 | §4「Sheets を真として再 backfill」 |
| AC-5 | main.md §5 を参照 |
