# Artifact Inventory: issue-57-kv-r2-guardrail-degrade-design

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-57-kv-r2-guardrail-degrade-design/` |
| state | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #57（GitHub OPEN。本 task は Issue 状態を変更しない） |
| date | 2026-05-31 |

## 背景

05a（observability + cost guardrails）が想定した KV/R2 ドリフトが、Issue #514 / #315 で R2 audit
cold-storage binding（`UBM_AUDIT_COLD_STORAGE` / `UBM_AUDIT_APP_COLD_STORAGE`）が production/staging
両方に追加され `scripts/audit-log/export-to-r2.ts` が実 R2 書き込みを行う形で現実化していた。
正本仕様・runbook がこの変化に追従しておらず、「R2 未利用 / KV binding なし」前提で degrade が実行不能だった。

## Implementation Targets

- `scripts/audit-log/export-to-r2.ts`（`AUDIT_COLD_STORAGE_EXPORT_PAUSED` kill-switch / `paused` short-circuit + `status: "paused"` manifest）
- `scripts/audit-log/__tests__/export-to-r2.spec.ts`（TC-PAUSE-01 ほか pause guard test）
- `apps/api/src/env.ts`（`ALERT_DEDUP_KV` を required → optional `?:` に是正、wrangler コメントアウト状態と型整合）
- `apps/api/src/routes/internal/alert-relay.ts`（KV optional fail-open ガード、未活性時は dedup を諦め配信継続）
- `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`（KV optional regression）
- `apps/api/src/routes/internal/__tests__/alert-relay.sheets-auth.contract.spec.ts`（D1 config 分離で別実行）
- `.github/workflows/audit-log-cold-storage.yml`（`AUDIT_COLD_STORAGE_EXPORT_PAUSED` env bridge）
- `docs/00-getting-started-manual/specs/08-free-database.md`（KV / R2 free-tier limits + 確認日 2026-05-31）
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`（current KV/R2 binding inventory 表 + free-tier values 表 + stale 記述是正）
- `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md`（§2-7 数値閾値 + §4-2 executable degrade）

## Evidence

- `mise exec -- pnpm exec vitest run scripts/audit-log/__tests__/export-to-r2.spec.ts apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`: PASS（root config 2 files / 43 tests）
- `mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/routes/internal/__tests__/alert-relay.sheets-auth.contract.spec.ts`: PASS（1 file / 4 tests）
- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck`: PASS
- `mise exec -- pnpm lint`: PASS
- `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/completed-tasks/issue-57-kv-r2-guardrail-degrade-design`: PASS（0 errors）

## Unassigned follow-ups

- `docs/30-workflows/completed-tasks/issue-57-followup-001-wrangler-binding-drift-ci-gate.md`
- `docs/30-workflows/unassigned-task/issue-57-followup-002-d1-backup-pause-linkage.md`
- `docs/30-workflows/unassigned-task/issue-57-followup-003-kv-alert-policy-drift-detection.md`

## User-Gated Boundary

Commit, push, PR creation（`Refs #57`）, GitHub repository variable mutation
（`AUDIT_COLD_STORAGE_EXPORT_PAUSED`）, production scheduled export run remain user-gated.

## Lessons Learned

- **L-I57-001（required → optional binding の影響範囲）**: `Env` の `ALERT_DEDUP_KV: KVNamespace` を `?:` optional 化すると、消費側 `alert-relay.ts` の全アクセス点（generic 2 + sheets-auth 2 = 計 4）に `if (c.env.ALERT_DEDUP_KV)` ガードが必要になる。型 1 行の変更が利用箇所全網羅の引き金になるため、optional 化と同時に消費側を機械的に棚卸しする。
- **L-I57-002（KV fail-open：dedup より delivery 優先）**: KV 未活性時は dedup を諦め `dedupPersisted:false` を返し alert 配信を継続する。`put` 直前に early-return を挿し、`get` は try/catch ごとガード内に入れる二段構造で、KV 障害が通知遮断に化けないようにする。
- **L-I57-003（kill-switch の挿入位置）**: `paused` short-circuit は `exportRunId` 採番直後・既存 manifest 冪等 skip より**前**に置く。D1 SELECT / manifest write / R2 PUT を全て短絡し、dry-run 判定よりも優先する。位置を誤ると credential 依存が残り「停止したのに R2 を触る」事故になる。
- **L-I57-004（厳密一致 `"true"` 判定）**: `process.env.AUDIT_COLD_STORAGE_EXPORT_PAUSED === "true"` で判定し `"TRUE"`/`"1"` は非 pause 扱い。GHA 側 `vars.* || 'false'` fallback と組み合わせ、未設定＝通常動作を保証する。env フラグの真偽値解釈はコードと CI で同一規約に揃える。
- **L-I57-005（spec↔code ドリフト是正の正本順位）**: docs が「R2/KV 未適用」と古いまま実体とズレている場合、code 実体（`wrangler.toml` binding）を正とし docs を current facts へ是正する。「宣言あり・未活性（コメントアウト）」binding と「適用済み」binding を区別する canonical inventory 表を常設し、再ドリフトを CI gate（follow-up-001）で検知可能にする。
- **L-I57-006（D1 config 分離による test 二段化）**: `alert-relay.sheets-auth.contract.spec.ts` は root vitest config では拾われず `vitest.d1.config.ts` で別実行が必要。focused test を 1 コマンドに束ねられないため、evidence には両経路の実行を明示し、どちらかの欠落を Phase 11 で見落とさないようにする。

anti-pattern:

- **AP-I57-A**: optional 化した binding を「使っていないから」と消費側ガードなしで残し、未活性 runtime で `undefined.get()` を踏む。→ optional 化と同時に全アクセス点ガード（L-I57-001）。
- **AP-I57-B**: degrade を「手動でコードをコメントアウト」運用のまま放置し、実稼働 export に対して実行不能にする。→ env フラグ kill-switch + runbook executable 手順（L-I57-003/004）。
