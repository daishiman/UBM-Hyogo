# Phase 12 — documentation-changelog.md（UT-17-FU-005）

本タスクで実施したドキュメント変更の履歴。

---

## 変更ドキュメント一覧

### 1. `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`

種別: 編集（追記）

追加セクション: 「KV 操作エラーログの確認」

内容:

- **grep コマンド例**
  ```bash
  bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \
    | grep alert_relay_kv_op_failed
  ```
- **しきい値**: 直近 1 時間で 10 件超 emit が観測された場合、調査開始（KV 一時障害 /
  global replication 遅延 / write rate limit 接近を疑う）。
- **構造化ログ schema 表**

  | field | 型 | 例値 |
  | --- | --- | --- |
  | event | string (固定) | `"alert_relay_kv_op_failed"` |
  | op | "get" \| "put" | `"get"` |
  | errorClass | string | `"TypeError"` / `"AbortError"` |
  | dedupeKeyHash | string (12 hex chars) | `"3f8a9c12e0b4"` |
  | isolateId | string (UUID) | `"550e8400-e29b-41d4-a716-446655440000"` |
  | ts | string (RFC3339) | `"2026-05-16T10:23:45.123Z"` |

- **後段 dashboard への引き継ぎ**: UT-17-FU-006 で `event === "alert_relay_kv_op_failed"`
  を入力に取る dashboard 化を予定している旨を 1 行追記。

---

### 2. `docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/` 配下

種別: 新規

| ファイル | 役割 |
| --- | --- |
| `index.md` | タスク仕様書 index（既存）|
| `phase-{01..13}.md` | 各 Phase 仕様（Phase 12 / 13 を本サイクルで追加）|
| `outputs/phase-{01..13}/*` | 各 Phase 出力（Phase 12 strict 7 outputs / Phase 13 pr-summary を本サイクルで追加）|
| `artifacts.json` | root workflow state |
| `outputs/artifacts.json` | outputs parity marker |

---

### 3. `docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md`

種別: 移動（Phase 13 マージ後）

移動先: `docs/30-workflows/completed-tasks/`

`git mv` コマンドは `system-spec-update-summary.md` Step 1-A 参照。

---

## 変更なしを明示するドキュメント

| ドキュメント | 理由 |
| --- | --- |
| `apps/api/wrangler.toml` | `[triggers]` / `[vars]` / `[env.*]` に変更なし。binding `ALERT_DEDUP_KV` は既存設定を参照のみ |
| `apps/api/src/env.ts` | `ALERT_DEDUP_KV` 型は既存定義を参照のみ。新規 env 追加なし |
| `.dev.vars.example` | 新規 secret なし |
| `.claude/skills/aiworkflow-requirements/references/*.md` | workflow artifact inventory と task-workflow-active を同一 wave で更新 |
| `.claude/skills/aiworkflow-requirements/indexes/*` | resource-map / quick-reference / keywords を同一 wave で更新 |
| `docs/00-getting-started-manual/specs/*.md` | 本タスクは observability 領域で、システム設計の正本仕様（auth / api-schema / database 等）に影響しない |

---

## 機密値スキャンチェック

| パターン | 期待 |
| --- | --- |
| Slack Webhook URL `hooks\.slack\.com/services/...` | 0 件 |
| Resend API key `re_[A-Za-z0-9]{20,}` | 0 件 |
| 実 email アドレス | 0 件 |
| raw `dedupeKey` 値（ハッシュ前文字列）| 0 件（spec.ts でも hash 後のみを assertion） |

---

## 完了条件

- [x] runbook 追記が `outputs/phase-08/docs-updates.md` と整合
- [x] 本 changelog に runbook 追記内容 / 新規 workflow ファイル / 移動予定の unassigned-task が記載されている
- [x] 「変更なしを明示するドキュメント」セクションで影響範囲外を列挙
