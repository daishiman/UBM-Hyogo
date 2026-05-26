---
task_id: issue-908-staging-rollback-notification-runtime-smoke
governance_mutation_user_gate: true
---

# Phase 2: 設計 — タスク仕様書

## メタ情報

| Phase | 2 |
| --- | --- |
| Phase名 | 設計 |
| 機能名 | issue-908-staging-rollback-notification-runtime-smoke |

---

## 採用案 A: 単一 bash helper + 3 ケース手動実行 + tracked evidence MD

### topology

```
operator (user-gated)
   │
   │ 1. dry-run plan を確認
   ▼
scripts/runtime-smoke/schema-alias-rollback.sh
   │
   ├─ op run --env-file=.env （secret 揮発注入）
   ├─ bash scripts/cf.sh d1 execute  （audit_log read）
   └─ curl POST /admin/schema/aliases/:aliasId/rollback  （rollback 実行）
   │
   ▼ stdout/stderr（redact 済）
operator が evidence MD へ転記
   │
   ▼
outputs/phase-11/evidence/staging-smoke.md（親 root 配下・tracked）
   │
   ▼ 相互リンク
親 outputs/phase-11/manual-test-result.md（Status 更新）
親 artifacts.json（Gate-C 昇格）
```

### helper script I/O 仕様

#### コマンドラインインターフェース

```
Usage:
  bash scripts/runtime-smoke/schema-alias-rollback.sh \
    --env <staging|production> \
    --alias <TEST_ALIAS_ID> \
    [--dry-run] \
    [--scenario <sent|skipped|failed>]

引数:
  --env       Cloudflare 環境（必須・staging 既定推奨・production は明示）
  --alias     rollback 対象の test schema alias ID（必須）
  --dry-run   D1 mutation / curl POST を skip し計画のみ stdout に出力（副作用ゼロ）
  --scenario  evidence MD への記録対象シナリオ（情報目的のみ・分岐はしない）

出力:
  - stdout: rollback HTTP status, audit_log entry JSON（redact 済）
  - stderr: 進捗ログ・[USER-GATE] 確認 prompt
  - 終了コード: 0=成功 / 1=失敗 / 2=user abort
```

#### 副作用境界

- `--dry-run` 不在時: staging D1 mutation + 実 Slack/mail webhook 発火 + audit_log INSERT
- `--dry-run` 指定時: `cf.sh` `--dry-run`-equivalent な D1 read のみ実行（mutation 0件）
- 実行前に必ず `[USER-GATE] About to mutate staging D1 and trigger real provider. Continue? [y/N]` を stderr に出し、`y` 入力以外は exit 2

#### redact 関数

```bash
redact() {
  # webhook URL の domain 以降を伏字化
  sed -E 's#(https://hooks\.slack\.com/services/)[A-Za-z0-9/]+#\1<REDACTED>#g; s#(Authorization: Bearer )[A-Za-z0-9._-]+#\1<REDACTED>#g'
}
```

- すべての curl `-v` ログ / cf.sh stdout を `| redact` 経由で出力する
- `set -x` での実値 echo は禁止

### evidence MD 構造

```
outputs/phase-11/evidence/staging-smoke.md
├─ ## Summary（実行日時 / executor / staging deploy version_id）
├─ ## Scenario S-sent（HTTP 200 / audit JSON / Slack 着信目視）
├─ ## Scenario S-skipped（HTTP 200 / audit status=skipped）
├─ ## Scenario S-failed（HTTP 200 / audit status=failed / rollback 200 維持）
├─ ## AC mapping（AC-1..7 達成チェック）
└─ ## Redaction note（webhook URL/token を含まないことの明示）
```

### 親 mutation 仕様

#### `outputs/phase-11/manual-test-result.md`

```diff
- `local_evidence_captured_runtime_pending`
+ `runtime_evidence_captured`
```

末尾に以下を追加:

```markdown
## Staging Runtime Evidence

Captured via issue-908 followup runtime smoke. See:
[outputs/phase-11/evidence/staging-smoke.md](./evidence/staging-smoke.md)
```

#### `artifacts.json`

```diff
- "status": "runtime_pending",
- "workflow_state": "implemented_local_evidence_captured",
+ "status": "completed",
+ "workflow_state": "implemented_runtime_evidence_captured",
...
   "11": {
-    "status": "runtime_pending",
-    "artifacts": ["outputs/phase-11/manual-test-result.md"]
+    "status": "completed",
+    "artifacts": [
+      "outputs/phase-11/manual-test-result.md",
+      "outputs/phase-11/evidence/staging-smoke.md"
+    ]
   },
...
   {
     "gate_id": "Gate-C",
-    "status": "pending",
-    "passed_at": null,
-    "evidence_path": "docs/30-workflows/unassigned-task/issue-838-followup-001-staging-rollback-notification-smoke.md",
+    "status": "passed",
+    "passed_at": "2026-05-25T00:00:00Z",
+    "evidence_path": "docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/evidence/staging-smoke.md",
     "approver": "daishiman",
     "notes": "external_ops: staging provider smoke captured via issue-908 runtime-smoke helper"
   }
```

---

## 不採用案 B: vitest による D1 emulator runtime smoke

### 概要

`vitest.d1.config.ts` 経由で miniflare D1 を起動し、route handler を直接 invoke し audit_log を検証する。

### 不採用理由

- AC-6 は「**staging runtime** での実 Slack/mail provider delivery evidence」が必須。emulator では実 webhook が発火せず AC-1 / AC-4 の runtime 性が満たせない。
- 親 issue-838 で既に focused unit test（emulator 含む）は PASS。emulator 重複追加は冗長。

---

## 不採用案 C: GitHub Actions cron による自動 smoke

### 不採用理由

- staging D1 mutation を含む cron はガバナンス上 user-gated を破る。
- 通知 dispatch の Slack 着信は人間目視が必要であり、cron 完結に向かない。
- 将来 `ut-17-followup-003` で healthcheck cron が確立した後、別タスクとして検討可。

---

## 関数シグネチャ

bash helper のため関数シグネチャは bash function 形式:

```bash
usage() { ... }                              # stderr に Usage 出力
parse_args() { ... }                         # 引数解析
require_user_gate() { ... }                  # confirm prompt
redact() { ... }                             # secret マスキング pipe
run_rollback() { ... }                       # curl POST 実行（dry-run なら echo のみ）
fetch_audit_entry() { ... }                  # cf.sh d1 execute 実行（dry-run でも read 可）
emit_evidence_block() { ... }                # evidence MD 用 markdown ブロックを stdout 出力
main() { ... }
```

---

## redaction 設計（3層）

1. **helper script 層**: webhook URL / Authorization header を `redact()` pipe で伏字化
2. **evidence MD 層**: 雛形に `<REDACTED>` placeholder を予め埋め、operator が転記時に実値挿入しても直前に redact 関数 output を貼る運用
3. **audit_log after_json**: 親 issue-838 実装で既に `{status, channel, attempts, errorClass, dispatchedAt}` のみ保存（secret 値そもそも非保持）

---

## config gate

helper は以下 env を op 参照経由のみで受け取る:

| env | 用途 |
| --- | --- |
| `STAGING_API_BASE` | rollback POST 先 host |
| `STAGING_ADMIN_BEARER` | admin Bearer token（op 参照） |
| `CLOUDFLARE_API_TOKEN` | cf.sh d1 execute 用（op 参照） |

実値は `.env` に op 参照 (`op://...`) のみ記載。実値転記禁止（CLAUDE.md シークレット管理ルール）。

---

## 完了条件

- [x] topology を確定
- [x] helper I/O / dry-run / redact / user-gate を確定
- [x] evidence MD 構造を確定
- [x] 親 mutation diff を確定
- [x] 不採用案 B / C の理由を明記

---

## 次Phase

`phase-3-design-review.md`（設計レビュー）へ進む。
