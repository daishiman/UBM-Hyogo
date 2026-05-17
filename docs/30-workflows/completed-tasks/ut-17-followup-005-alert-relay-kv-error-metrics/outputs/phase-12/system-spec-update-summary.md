# Phase 12 — system-spec-update-summary.md（UT-17-FU-005）

UT-17-FU-005 完了に伴うシステム仕様への影響と、後段契約予約を記録する。

---

## Step 1-A: 完了タスク記録（unassigned-task の移動）

| 対象 | 移動先 | 実施タイミング |
| --- | --- | --- |
| `docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md` | `docs/30-workflows/completed-tasks/` | Phase 13 PR が `dev` にマージされ、staging / production deploy が完了した直後 |

`git mv` コマンド例:

```bash
git mv \
  docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md \
  docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md
```

---

## Step 1-B: 実装状況の遷移

| 段階 | 状態 |
| --- | --- |
| 仕様書作成完了 | `spec_created` |
| local 実装 + テスト + runbook 追記完了 | `implemented_local_evidence_captured` / `implementation_complete_pending_pr` |
| PR マージ + production deploy 完了 | `completed` |

GitHub Issue #701 は既に `state=closed / state_reason=completed` でクローズ済み。
本タスク完了後も Issue を再 open しない（実装状況は本 workflow の `artifacts.json` で追跡）。

---

## Step 1-C: 関連タスクとの独立性確認

| 関連タスク | 関係性 | 影響 |
| --- | --- | --- |
| UT-17（親 / Cloudflare analytics alerts）| 親 workflow | 影響なし（alert-relay 主機能ロジック非改変）|
| UT-17-FU-001 | 独立 | 影響なし |
| UT-17-FU-002（ALERT_DEDUP_KV 永続化）| **前段関係**（本タスクは FU-002 が導入した KV operation の error observability を追加）| FU-002 完了済みが前提 |
| UT-17-FU-003（healthcheck cron）| 独立 | 影響なし |
| UT-17-FU-004 | 独立 | 影響なし |
| UT-17-FU-006（KV usage dashboard）| **後段関係**（本タスクの `event: "alert_relay_kv_op_failed"` を集計入力とする）| 本タスクで予約する `event` 文字列契約に依存 |

---

## Step 2: 後段 logpush / Workers Logs 契約予約

### 予約する固定値

| 項目 | 値 | 性質 |
| --- | --- | --- |
| `event` field | `"alert_relay_kv_op_failed"` | 文字列リテラル固定。logpush filter / Workers Logs grep のキー |
| `op` field 列挙 | `"get"` / `"put"` | 2 値固定 |
| `errorClass` | `Error.constructor.name` 由来文字列 | 例: `TypeError`, `Error`, `AbortError` |
| `dedupeKeyHash` 形式 | SHA-256 first 12 hex chars (lowercase) | 同一 `dedupeKey` で同一 hash 再現 |

### 互換性ポリシー

- `event` 文字列の改名は **本タスク以後の互換性 break** として扱う。
  変更する場合は UT-17-FU-006 以降で follow-up issue を**先に**立て、
  集計側の filter 更新と同期する。
- `op` 列挙への新値追加（例: `"list"` / `"delete"`）は backward compatible だが、
  集計 dashboard の凡例追加を伴うため UT-17-FU-006 と同期する。
- `dedupeKeyHash` の桁数変更は break。raw `dedupeKey` のログ出力解禁も break として扱う。

---

## Step 3: behaviour change 記録

| 観点 | 改修前 | 改修後 | 種別 |
| --- | --- | --- | --- |
| `KV.get(dedupeKey)` 失敗時 | try/catch 無し → handler まで例外伝播 → 500 / unhandled | try/catch + `logKvOperationError("get", ...)` + `seen = null` 相当で通常処理続行 | **意図的な behaviour change（fail-open 化）** |
| `KV.put` 失敗時 | 既存 catch 内で plain object を `console.warn` | 既存 catch 内で `logKvOperationError("put", ...)` を呼び出す。レスポンス挙動（`dedupPersisted: false`）は不変 | log 形式のみ変更（behaviour 不変）|
| dedupe TTL | 不変 | 不変 | — |
| Slack 配信路 | 不変 | 不変 | — |
| レスポンス body / status code | `get` failure path 以外は不変 | 同左 | `get` failure path のみ unhandled 500 → 通常 200 系に変化（fail-open 化の副作用） |

`get` failure path の fail-open 化は、通知系の一般原則（「鳴らさない」より「鳴らす」に倒す）
に基づく意図的変更。詳細は `outputs/phase-02/get-fail-open-policy.md`（本 spec 配下）参照。

---

## Step 4: aiworkflow-requirements skill への反映

本タスクは skill structural change を伴わないが、aiworkflow-requirements の正本索引には
same-wave で反映する。`event` 文字列契約は workflow / runbook / artifact inventory に
集約し、後続 FU-006 dashboard 化の入口として検索可能にする。

| 対象 | 反映内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | UT-17-FU-005 lookup 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | UT-17-FU-005 quick reference 追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 状態追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-ut-17-followup-005-alert-relay-kv-error-metrics-artifact-inventory.md` | artifact inventory 新規作成 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | same-wave sync log 追記 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` / `SKILL-changelog.md` | 最新履歴に UT-17-FU-005 を追記 |

---

## 完了条件

- [x] Step 1-A の `git mv` コマンドが用意されている
- [x] Step 1-B の 3 段階遷移が定義されている
- [x] Step 1-C で UT-17-FU-002（前段）/ FU-006（後段）の関係が明示されている
- [x] Step 2 で `event` 文字列契約と互換性ポリシーが記録されている
- [x] Step 3 で `KV.get` fail-open 化が意図的 behaviour change として記録されている
