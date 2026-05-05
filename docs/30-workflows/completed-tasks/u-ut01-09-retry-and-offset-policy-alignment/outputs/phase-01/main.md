# Phase 1 成果物: 要件定義（U-UT01-09 retry / offset policy alignment）

> ステータス: spec_created / docs-only / NON_VISUAL
> 上位仕様: `../../phase-01.md`
> 親タスク: UT-01 Sheets→D1 同期方式定義（`docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/`）
> GitHub Issue: #263 (CLOSED) — canonical 設計判断記録として保管

---

## 1. タスクの位置づけ

UT-01 論理仕様（retry 3 / backoff 1s〜32s / `processed_offset` 採用）と、現行実装（`apps/api/src/jobs/sync-sheets-to-d1.ts` の `DEFAULT_MAX_RETRIES = 5` / `SYNC_MAX_RETRIES` 環境変数 / `withRetry({ baseMs: 50 })`）と、現行 migration（`apps/api/migrations/0002_sync_logs_locks.sql` に `processed_offset` 不在）の間にある **3 軸差分** を、UT-09 実装が単独判断不能にならない粒度で「真の論点」として固定する。

本 Phase は「コード変更・migration 作成・PR 作成を一切伴わない」docs-only タスクであり、後続 Phase 2 が canonical 採択候補を一意比較できる入力（4 つの苦戦箇所 / AC1-AC6 / 依存境界 / quota 算定前提）を確定することがゴールである。

---

## 2. 真の論点（true issue）

「retry を 3 にするか 5 にするか」「offset を採るか採らないか」の二択ではなく、**3 つの canonical 値（retry 最大回数 / Exponential Backoff curve / `processed_offset` schema 採否）の一意化により UT-09 が単独で値判断を下す状態を解消する** ことが本タスクの本質。

副次的論点:

1. 3 つの値は独立変数ではなく `retry × backoff 上限 × batch_size × cron 間隔` の積で Sheets API quota（500 req/100s/project）と Workers CPU 制限を踏み抜かないことが必要。
2. `processed_offset` 採用時の単位（行 / chunk index / 安定 ID 集合）を本タスクで確定する。Sheets 行削除に対するロバスト性を備えた単位を選ぶ。

---

## 3. visualEvidence 確定

| 項目 | 値 |
| --- | --- |
| visualEvidence | NON_VISUAL |
| 物理形態 | Markdown（13 phases / outputs 配下） |
| 検証方法 | 机上算定 + Phase 3 / Phase 10 設計レビューゲート + Phase 11 spec walkthrough |
| 実機検証 | UT-09 実装 phase に委譲（本タスク範囲外）|

`artifacts.json.metadata.visualEvidence = "NON_VISUAL"` で確定。

---

## 4. 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | UT-01 Phase 02 `sync-method-comparison.md` | retry 3 / backoff 1s〜32s / batch 100 / cron 6h | canonical 比較表の論理 base case |
| 上流 | UT-01 Phase 02 `sync-log-schema.md` | `processed_offset` 論理定義（再開可能境界） | offset 採否判断の論理 base case |
| 上流 | UT-01 Phase 12 `unassigned-task-detection.md` | U-9 検出文脈、U-7 / U-8 直交関係 | 直交境界の確定根拠 |
| 直交 | U-UT01-07 (`sync_log` ledger 整合) | テーブル名・カラム名整合 | 値ポリシーは本タスクで閉じる |
| 直交 | U-UT01-08 (status / trigger enum 統一) | enum 名前空間統一 | 数値・タイミング・再開ロジックは本タスクで閉じる |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | canonical 確定後の retry / backoff / offset | Phase 2 `canonical-retry-offset-decision.md` を申し送り |
| 下流 | UT-09 / U-UT01-07 migration 作業 | `processed_offset` 採否 + 影響評価 | Phase 2 `migration-impact-evaluation.md` を申し送り |

---

## 5. 苦戦箇所（4 件）

### 苦戦箇所 1: retry 回数差分による失敗解釈の二重化

- 仕様: retry 3 で failed 確定。SLA / monitoring も 3 前提。
- 実装: `DEFAULT_MAX_RETRIES = 5` で暗黙 5 回。
- 同一エラーで仕様読者と実装ログ読者が「failed と見なすタイミング」がずれ、SRE が手動介入を始めても自動再試行が並行する race。
- quota 圧: 5 回試行中に Sheets API 500 req/100s を消費し、手動同期が同時 fail する具体ケース。

### 苦戦箇所 2: `processed_offset` 不在による部分失敗リカバリ不能

- 1000 行同期中に 600 行 upsert 完了 → batch 7（行 601-700）が 3 連続 fail → ジョブ全体 failed。
- 現行実装は次回 tick / 手動再実行で行 0 から再取得 + 冪等 upsert 依存。
- Sheets API quota を毎回フル消費し、Workers CPU 上限近接時に「最後の batch に永遠に到達できない」状態。
- offset 採用時は単位選定（行 / chunk index / 安定 ID 集合）が canonical 必要。

### 苦戦箇所 3: backoff curve 差分が quota 上限を踏み抜く

- 仕様 curve: 1s / 2s / 4s / 8s / 16s / 32s（合計 ~63s 上限）。
- 実装 curve: `withRetry({ baseMs: 50 })`、同じ指数なら 50ms / 100ms / 200ms / 400ms / 800ms と 1 オーダー短い。
- batch_size 100 + 並走 cron で短い backoff のまま retry 5 回が走ると burst 発生 → quota 超過波及。
- canonical curve 確定なしには UT-09 で「baseMs を秒オーダーへ + retry 3」「baseMs 維持 + retry 5」のどちらに収束させるか判断不能。

### 苦戦箇所 4: failed log 30 日保持と offset の意味整合

- `sync-log-schema.md` は `processed_offset` を「再開可能な書き込み済境界」として論理定義するが、`0002_sync_logs_locks.sql` の `sync_job_logs` には列がない。
- failed 監査時に「どこまで進んでいたか」が SQL で復元不能。
- failed → in_progress 再開時に `started_at` を上書きしないという仕様も offset なしでは判定根拠が `retry_count` だけになり、「上限超過後の手動再開」と「途中 batch 再開」を区別不能。

---

## 6. リスク R1-R5

| # | リスク | 影響 | 対策（割当先 Phase） |
| --- | --- | --- | --- |
| R1 | retry 5→3 への寄せ直後に過渡的に failed log 件数が増える | 監査ノイズ / アラート過剰発火 | Phase 2 で「適用 7 日は failed しきい値を staging 実測ベースで再校正」を明記（→ Phase 5 ランブックへ） |
| R2 | `processed_offset` 列追加が prod D1 への破壊的変更 | rollback リスク | 本タスクは机上評価のみ。物理 migration は UT-09 / U-UT01-07 へ移譲。本タスクでは「列追加 / 別経路 / 不採用」の 3 択判断のみ確定 |
| R3 | backoff を秒オーダーに伸ばすと 1 tick 内完了不能 batch が増える | scheduled handler 打ち切り | Phase 2 で「batch_size × max_retries × backoff 上限」の理論最大時間を算定し cron 間隔（6h）と非衝突を証明 |
| R4 | `SYNC_MAX_RETRIES` の既定値変更を忘れる | 値が変わっても挙動が旧値 | Phase 2 appendix で `wrangler.toml` / `.dev.vars` 参照ポイントを列挙、UT-09 受入条件へ申し送り |
| R5 | offset resume 採用しても Sheets 行削除で意味壊れる | 600 行目以降が誤った行を指す | Phase 2 で offset 単位 3 候補（行 / chunk index / chunk index + 安定 ID）を比較し行削除耐性を持つ単位を採択 |

---

## 7. 受入条件 AC1-AC6

| ID | 条件 |
| --- | --- |
| AC1 | canonical retry 最大回数（候補: 3 / 5 / 環境変数で可変）が Phase 2 比較表で評価され、採択値と理由が明文化 |
| AC2 | canonical Exponential Backoff curve（base / 上限 / jitter 採否）が確定し、batch 100 + cron 6h で 1 tick 内に収まることが机上証明 |
| AC3 | `processed_offset` schema 採否（追加 / 不採用 / hybrid）が決定し、採択ケースの offset 単位が定義 |
| AC4 | D1 migration 影響（追加列・DEFAULT・backfill・rollback）が机上評価され、UT-09 / U-UT01-07 申し送り内容が記載 |
| AC5 | Sheets API quota 整合が worst case シナリオ（cron + 手動 + retry 上限）で 500 req/100s 以下と算定 |
| AC6 | `SYNC_MAX_RETRIES` 環境変数の存続可否と既定値、`DEFAULT_MAX_RETRIES = 5` を canonical へ寄せる過渡期方針が記載 |

---

## 8. スコープ

### 含む
- canonical 3 軸決定（retry / backoff / offset）の比較評価と採択理由
- 既存実装値を canonical へ寄せる過渡期影響評価
- `SYNC_MAX_RETRIES` 存続可否
- D1 migration 影響範囲の机上評価
- Sheets API quota 整合性の再検証

### 含まない
- 実装変更（コード / migration / wrangler 設定）
- UT-09 ジョブのコード変更
- `sync_job_logs` リネーム（→ U-UT01-07）
- enum リネーム（→ U-UT01-08）
- 本番再同期実施
- PR / commit

---

## 9. 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-09 単独判断不能を解消、retry / offset / backoff の 3 軸 canonical 化で監査・SLA・quota 整合一意化 |
| 実現性 | PASS | docs-only。Markdown 2 ファイルの机上評価で完結 |
| 整合性 | PASS | 不変条件 #1（schema 固定回避）/ #5（D1 アクセスは apps/api 限定）に違反しない |
| 運用性 | PASS | UT-09 受入条件へ申し送りで実装側参照経路が一意化 |

---

## 10. quota 算定前提（Phase 2 / Phase 9 で使用）

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| Sheets API quota | 500 req/100s/project | Google Sheets API v4 公開上限 |
| Workers CPU 制限 | 30s（scheduled）/ 50ms (default request) | Cloudflare Workers free tier baseline |
| batch_size | 100 行 | UT-01 Phase 02 確定値 |
| cron 間隔 | 6h（既定） | UT-01 Phase 02 確定値 |
| 想定総行数 | 〜2000 行（MVP）| Sheets 既定 range `A1:ZZ10000` |
| 同時実行最大 | 2（cron + 手動）| `sync_locks` で 1 件に制限可能だが quota 試算では 2 同時を worst case とする |

---

## 11. 完了条件（チェック結果）

- [x] artifacts.json.metadata.visualEvidence = NON_VISUAL
- [x] 真の論点が「3 つの canonical 値の一意化 + UT-09 単独判断不能の解消」に再定義
- [x] 4 条件評価が全 PASS で根拠付き
- [x] 依存境界表に上流 3 / 直交 2 / 下流 2 すべて記載
- [x] 苦戦箇所 4 件すべて具体ケース付き
- [x] AC1-AC6 が canonical 入力と完全一致
- [x] R1-R5 の対策割当済（Phase 2 / Phase 5）
- [x] 不変条件 #1 / #5 違反なし

---

## 12. 次 Phase への引き渡し

- 真の論点 = 3 canonical 値（retry / backoff / offset）の一意化
- 苦戦箇所 4 件 + AC1-AC6 + R1-R5 を Phase 2 比較表の評価軸へ
- quota 算定前提（500 req/100s / batch 100 / cron 6h / 想定 2000 行 / 同時 2）を Phase 2 の固定値として使用
- 依存境界（UT-01 上流 / UT-09 下流 / U-UT01-07 / U-UT01-08 直交）を維持
