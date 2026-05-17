# Phase 12 — unassigned-task-detection.md（UT-17-FU-005）

本サイクルで検出された follow-up タスクと、他 UT-17 系タスクとの独立性を記録する。

---

## 既存 follow-up への統合: UT-17-FU-006（KV usage dashboard 化）

| 項目 | 値 |
| --- | --- |
| ID | UT-17-FU-006 |
| タイトル | ALERT_DEDUP_KV namespace の usage / latency dashboard 監視整備 |
| 由来 | 既存 `docs/30-workflows/unassigned-task/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring.md`（Issue #702）に、本タスクで予約した `event: "alert_relay_kv_op_failed"` 構造化ログ contract を統合 |
| 起票先 | 新規作成しない。既存 FU-006 ファイルを更新済み |
| 優先度 | LOW（observability 強化系・SLO 化前段）|

### 入力契約（本タスクで予約）

| field | 値 / 形式 |
| --- | --- |
| `event` | `"alert_relay_kv_op_failed"` 固定リテラル |
| `op` | `"get"` / `"put"` の 2 値 |
| `errorClass` | `Error.constructor.name` 由来文字列 |
| `dedupeKeyHash` | SHA-256 first 12 hex chars |
| `isolateId` | UUID v4 |
| `ts` | RFC3339 |

### 想定スコープ（仮）

- Workers Logs → logpush → Cloudflare Analytics Engine（または外部 SaaS）への流し込み
- `op` 別 / `errorClass` 別の時系列グラフ
- SLO 閾値: 直近 1 時間で `op="put"` errorClass="QuotaExceededError" が 5 件超 → アラート
- `isolateId` cardinality を見て isolate 偏りを検知

### 想定スコープ外

- alert-relay 主機能ロジックの変更
- KV 自体の retry / Durable Object 移行
- D1 への乗り換え

---

## 他 UT-17 系タスクとの独立性確認

| タスク | 独立性 | 備考 |
| --- | --- | --- |
| UT-17 親 workflow | 独立 | 親 workflow に back-propagation 不要 |
| UT-17-FU-001 | 独立 | 影響なし |
| UT-17-FU-002（ALERT_DEDUP_KV 永続化）| **前段** | FU-002 完了済みが前提。本タスク内で FU-002 の挙動には介入しない |
| UT-17-FU-003（healthcheck cron）| 独立 | scheduled handler 経路で alert-relay を叩くが、KV 操作経路は本タスクの emit 対象。誤検知（healthcheck 由来 KV op）と本物アラート由来を区別する必要があれば FU-006 dashboard 側で `dedupeKeyHash` 集計を分けるが、FU-005 スコープでは区別しない |
| UT-17-FU-004 | 独立 | 影響なし |
| UT-17-FU-006（既存 unassigned）| **後段** | 本タスクの emit を集計入力に取る。新規 FU-006 は作らず既存 Issue #702 系ファイルへ統合 |

---

## Issue 状態

- GitHub Issue #701（本タスク原典）: `state=closed / state_reason=completed`
  - Issue close 時点では実コード未実装だったため、本 workflow で local implementation と evidence を作成済み
  - ユーザー指示に従い Issue は CLOSED のままにする（再 open しない）
  - 本タスクの完了 evidence は `artifacts.json` と Phase 13 PR で代替する
- 新規 Issue 起票: 不要（UT-17-FU-006 / Issue #702 は既存 unassigned-task へ統合済み）

---

## post-merge アクション

| # | アクション | 担当 |
| --- | --- | --- |
| 1 | `docs/30-workflows/unassigned-task/ut-17-followup-005-*.md` を `completed-tasks/` へ `git mv` | 手動 |
| 2 | 既存 UT-17-FU-006 が本タスクの入力契約を参照していることを確認 | 完了済み |
| 3 | external ops（staging / production deploy / wrangler tail で emit 観測）| プロジェクトオーナー |

---

## 完了条件

- [x] UT-17-FU-006 の既存 unassigned への統合が記録されている
- [x] 入力契約（schema 6 field）が予約として明示されている
- [x] 他 UT-17 系タスクとの関係（前段 FU-002 / 後段 FU-006 / 独立 親-001-003-004）が記録されている
- [x] Issue #701 を CLOSED のままにする方針が明記されている
