# Phase 2 成果物 (1/2): Canonical Retry / Backoff / Offset Decision

> ステータス: spec_created / docs-only / NON_VISUAL
> Phase 1 入力: `../phase-01/main.md`（真の論点・苦戦箇所 4 件・AC1-AC6・R1-R5・quota 算定前提）
> 上流参照: `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md`、`.../sync-log-schema.md`
> 実装参照: `apps/api/src/jobs/sync-sheets-to-d1.ts`、`apps/api/migrations/0002_sync_logs_locks.sql`

本ファイルは U-UT01-09 における **3 軸の canonical 決定値** を確定する正本ドキュメントである。Phase 3 設計レビューゲート、Phase 4 テスト戦略、Phase 5 UT-09 ハンドオーバーランブック、Phase 7 AC マトリクス、Phase 9 quota 算定、Phase 10 GO/NO-GO はすべて本ファイルを参照する。

---

## 1. 軸 1: Retry 最大回数（AC1）

### 比較表（3 候補 × 5 評価軸）

| 候補 | quota 影響 | SLA 整合 | 監査整合 | 実装変更コスト | UT-09 単独判断不能の解消 |
| --- | --- | --- | --- | --- | --- |
| A. retry=3（仕様準拠） | 軽（最大 4 req/batch）| ◎ UT-01 SLA と一致 | ◎ failed 確定タイミング一意 | 中（`DEFAULT_MAX_RETRIES = 5` → 3）| ◎ 仕様正本と一致 |
| B. retry=5（実装現状） | 中（最大 6 req/batch）| × 仕様 SLA と乖離 | × 「failed と見なすタイミング」が仕様読者と実装で 2 回ずれる | 低（変更不要）| × 仕様 reload しても判断不能 |
| C. 環境可変（既定なし） | 不定 | × 環境差で SLA 揺れ | × ログ検索時に値前提が読めない | 低 | × canonical を放棄 |

### 採択: **A. retry=3（canonical）+ 環境変数 `SYNC_MAX_RETRIES` で上書き可（既定 = 3）**

採択理由:

1. UT-01 Phase 02 確定値（retry 3）と一致し、SLA / monitoring / failed log 解釈が一意化する（苦戦箇所 1 を解消）。
2. quota worst case（後段算定）が 500 req/100s に対し十分余裕を保つ。
3. 環境変数自体は残置し既定値だけ 5→3 に変更することで「staging で値を変えて検証する」運用余地を残す（AC6）。
4. 候補 C は canonical 放棄に等しく、Phase 1 の真の論点（UT-09 単独判断不能の解消）に反する。

**実装委譲事項**（→ Phase 5 / UT-09 への申し送り）:
- `apps/api/src/jobs/sync-sheets-to-d1.ts:49` `DEFAULT_MAX_RETRIES = 5` → `3`
- `wrangler.toml` / `.dev.vars` の `SYNC_MAX_RETRIES` 既定値を 3 へ揃える（未設定可）
- 過渡期 7 日: failed 件数アラートしきい値を staging 実測ベースで再校正（R1）

---

## 2. 軸 2: Exponential Backoff curve（AC2）

### 比較表（3 候補 × 4 評価軸）

| 候補 | base / 上限 | 1 batch worst-case 滞在時間（retry=3）| 1 tick (6h=21600s) 内収まり | quota burst |
| --- | --- | --- | --- | --- |
| A. 仕様準拠（1s / 2s / 4s / 8s / 16s / 32s 上限） | base 1s, factor 2, cap 32s | retry=3 で 1+2+4 = 7s + jitter ±20% | ◎ 余裕 ~21593s | 低（100s ウィンドウ内 4 req） |
| B. 実装現状（baseMs=50） | base 50ms, factor 2, cap 32s（仮）| 50+100+200 = 0.35s | ◎ 収まる | 高（100s 内に多数 batch が burst） |
| C. ハイブリッド（base 1s, jitter ±20%, cap 32s, 同実装の指数）| base 1s, factor 2, cap 32s | retry=3 で 1+2+4 = 7s ± 1.4s | ◎ 余裕 | 低 |

### 採択: **C 相当（実質 A と同パラメータ + jitter ±20%）**

確定パラメータ:

| パラメータ | 値 | 備考 |
| --- | --- | --- |
| base | 1s（1000ms）| `withRetry({ baseMs: 1000 })` |
| factor | 2 | exponential |
| cap | 32s | 6 段で到達（1, 2, 4, 8, 16, 32）|
| jitter | ±20% | 毎 wait 値に乱数で ±20% を乗算 |
| max retries | 3 | 軸 1 と整合 |

採択理由:

1. UT-01 仕様 curve と一致し、苦戦箇所 3 の「実装 50ms vs 仕様 1s」差分を解消。
2. retry=3 まで `1 + 2 + 4 = 7s`（jitter 含めて 8.4s 最悪）であり cron 6h tick に対し 0.04% しか消費しない（R3 解消）。
3. jitter ±20% を採用することで cron + 手動の同時実行下での burst を分散しちらして quota 圧を低減。
4. cap 32s は仕様準拠（実装の `withRetry` が cap 引数を受け付けない場合 cap 引数を追加するのは UT-09 の作業）。

**1 tick 内収まり証明（机上）**: batch_size 100 行 × 想定 2000 行 = 20 batches。1 batch あたり最悪 retry 3 で 7s + upsert ~1s = 8s。20 batches 直列で 160s。cron 6h = 21600s に対して 0.74%。**収まる**（R3 を満たす）。

---

## 3. 軸 3: `processed_offset` schema 採否（AC3）

### 比較表（3 候補 × 5 評価軸）

| 候補 | リカバリ性 | quota 節約 | 行削除耐性 | 実装複雑度 | migration 影響 |
| --- | --- | --- | --- | --- | --- |
| A. 不採用（全範囲再取得 + 冪等 upsert） | × 巨大データで CPU 上限到達 | × 毎 tick フル取得 | ◎ 影響なし（毎回再取得）| 低 | なし |
| B. `processed_offset INTEGER`（行 index 単位）| ◎ batch 単位再開可 | △ batch 取得は減るが Sheets fetch は range 全体 | × 行削除で意味壊れる（R5）| 中 | 列追加 1 件 |
| C. `processed_offset INTEGER`（chunk index 単位 = batch_size 100 行）| ◎ chunk 単位再開可 | ◎ chunk = 100 行単位で skip 判定可 | △ chunk 内行削除は upsert の冪等性で吸収。chunk 境界跨ぎ削除は `total_rows` と組合せて検出 | 中 | 列追加 1 件 |

### 採択: **C. `processed_offset INTEGER`（chunk index 単位）**

確定仕様:

| 項目 | 値 |
| --- | --- |
| 物理列名 | `processed_offset` |
| 型 | `INTEGER NOT NULL DEFAULT 0` |
| 単位 | chunk index（chunk = batch_size 100 行）|
| 進捗更新 | 各 chunk の `upsertMembers()` 成功直後に `processed_offset = i + 1` を UPDATE |
| 再開ロジック | `failed → in_progress` 遷移時、`processed_offset` 値以降の chunk から再開 |
| `total_rows` との関係 | `total_rows` 不変条件: 開始時 fetch で確定。chunk index < ceil(total_rows / 100) を Loop 終了条件 |

採択理由:

1. 苦戦箇所 2（部分失敗リカバリ不能）を解消。600 行進捗時 chunk index = 6 が記録され、再開時 chunk 6 から open。
2. 候補 B（行 index）は Sheets 行削除に脆弱（R5）。chunk index は upsert 冪等性で chunk 内変動を吸収できるため実用上 robust。
3. 候補 A は MVP 想定 2000 行で Workers CPU 制限近接時に「永遠に最後 batch に到達できない」状態が発生する具体ケースが Phase 1 で確認済。
4. 「行削除耐性」は upsert の `ON CONFLICT(response_id) DO UPDATE` により chunk 境界内の行入れ替えは吸収される。chunk 跨ぎでの大規模削除のみ `total_rows` mismatch として検出すればよい（→ Phase 6 失敗ケース）。

**実装委譲事項**（→ Phase 5 / UT-09 / U-UT01-07 への申し送り）:
- 新 migration（`0003_processed_offset.sql` 等）で `sync_job_logs` に列追加（DDL は `migration-impact-evaluation.md` 参照）
- `runSync()` 内 chunk loop で `processed_offset` 進捗更新を SQL に追加
- 再開ロジック（`failed → in_progress` 時の skip）を `acquireSyncLock` 直後に追加

---

## 4. 3 軸組合せの worst case quota / CPU 試算

### 前提（Phase 1 §10 から転記）
- Sheets API quota: 500 req/100s/project
- batch_size: 100 行
- 想定総行数: 2000 行 → 20 chunks
- 同時実行最大: 2（cron + 手動）
- retry max: 3

### worst case 算定

1 sync run = 1 fetchRange (Sheets API) + 20 batches × upsert (D1) + 各 batch 失敗時 retry up to 3。

retry 時に再 fetch する設計か否かで分岐:
- 本実装は fetch 1 回 / 全 chunks に対する upsert retry のみ（コード `fetchRange` 1 回 + `withRetry(upsertMembers)` 各 chunk）→ Sheets API は 1 req/run のみ。
- retry の対象は D1 upsert（quota は別系統）。

**Sheets API quota worst case**: 同時 2 sync = 2 req / 100s ≪ 500 req/100s。**余裕 99.6%**。

**Workers CPU 滞在時間 worst case**:
- 1 chunk 最悪 retry 3 で 7s（backoff）+ 1s（upsert）= 8s
- 20 chunks 直列 = 160s
- scheduled handler の実行枠（free tier 30s / paid 配下 30 min）に対し、cron 既定 6h 内の 160s は完全余裕
- ※ Workers scheduled handler の CPU 30s 上限抵触リスクがあるため、実装は `event.waitUntil()` で chunk loop 全体を切らずに incremental 進捗更新する設計が必要（→ Phase 6 失敗ケース 5）

**結論**: Sheets API quota（500 req/100s）に対し worst case 0.4% 消費。AC5 を満たす。

---

## 5. `SYNC_MAX_RETRIES` 環境変数の存続（AC6）

### 採択: 存続。既定値 = 3。

| 観点 | 判断 |
| --- | --- |
| 存続可否 | 存続 |
| 既定値 | 3（軸 1 採択値と整合）|
| 上書き範囲 | staging のみ運用上書きを許可。production は 3 固定とし wrangler config に明示 |
| 過渡期運用（R1）| 適用後 7 日は staging で failed 件数しきい値を実測ベースで再校正。再校正完了まで production への適用を保留可 |

### `wrangler.toml` / `.dev.vars` 参照ポイント appendix

| ファイル | 参照箇所 | 変更内容 |
| --- | --- | --- |
| `apps/api/wrangler.toml`（環境別 `[env.production.vars]` / `[env.staging.vars]`） | `SYNC_MAX_RETRIES = "3"` | 値変更（既存 5 を 3 へ）または未設定削除（コード既定 3 に委ねる）|
| `apps/api/.dev.vars` | `SYNC_MAX_RETRIES=3` | local 開発の既定値も 3 |
| `apps/api/src/jobs/sync-sheets-to-d1.ts:49` | `const DEFAULT_MAX_RETRIES = 5` | `= 3` |

---

## 6. AC1-AC6 充足表

| AC | 採択 / 結論 | 本ファイル参照箇所 |
| --- | --- | --- |
| AC1 | retry=3 採択 + `SYNC_MAX_RETRIES` 存続（既定 3） | §1 |
| AC2 | base 1s / factor 2 / cap 32s / jitter ±20% / 1 tick 収まり証明済 | §2 |
| AC3 | `processed_offset INTEGER` (chunk index 単位) 採用 | §3 |
| AC4 | migration 影響: 列追加 1 件 / DEFAULT 0 / NOT NULL / backfill 不要 | `migration-impact-evaluation.md` 参照 |
| AC5 | Sheets API worst case 2 req/100s（0.4% 消費）< 500 req/100s | §4 |
| AC6 | `SYNC_MAX_RETRIES` 存続 / 既定 3 / 過渡期 7 日 | §5 |

---

## 7. UT-09 / U-UT01-07 / U-UT01-08 への申し送り

| 申し送り先 | 申し送り内容 |
| --- | --- |
| UT-09（実装）| §1〜§3 の確定値を実装反映。retry=3 / backoff curve / `processed_offset` chunk index ロジック / `SYNC_MAX_RETRIES` 既定 3 |
| U-UT01-07（ledger 整合）| `processed_offset` 列追加は本タスク内で**判断のみ**。物理 migration 発行は U-UT01-07 または UT-09 の責務 |
| U-UT01-08（status / trigger enum 統一）| 本タスクは数値・タイミング・再開ロジックに閉じる。enum 名前空間（`running` / `in_progress` 等）の正規化は U-UT01-08 で別途決定 |

---

## 8. 完了条件チェック

- [x] 軸 1 比較表 3 候補 × 5 評価軸（空セル 0）
- [x] 軸 2 比較表 + jitter 方針確定
- [x] 軸 3 比較表 + offset 単位定義（chunk index）
- [x] 3 軸組合せ worst case quota / CPU 試算（具体数値）
- [x] migration 影響は別ファイル `migration-impact-evaluation.md`
- [x] `SYNC_MAX_RETRIES` 存続可否 + appendix
- [x] UT-09 / U-UT01-07 申し送り
- [x] コード変更 / migration / PR なし
