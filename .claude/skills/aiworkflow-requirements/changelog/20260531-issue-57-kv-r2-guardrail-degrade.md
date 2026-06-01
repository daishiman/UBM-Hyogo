# 2026-05-31 issue-57-kv-r2-guardrail-degrade-design

`issue-57-kv-r2-guardrail-degrade-design` を `implemented_local_evidence_captured / implementation / NON_VISUAL`
として同期した。05a が予防しようとした KV/R2 ドリフトが Issue #514 / #315 の R2 audit cold-storage binding
追加（`UBM_AUDIT_COLD_STORAGE` / `UBM_AUDIT_APP_COLD_STORAGE`）で現実化していたため、正本仕様・runbook を
current facts へ同期し、実稼働中の R2 export を env フラグで停止できる kill-switch を実装した。

実装は 3 点。(1) `scripts/audit-log/export-to-r2.ts` に `AUDIT_COLD_STORAGE_EXPORT_PAUSED` kill-switch を
追加し、`paused` short-circuit を `exportRunId` 採番直後・manifest 冪等 skip より前に置いて D1 SELECT /
manifest write / R2 PUT を全短絡（`status: "paused"`）。(2) `.github/workflows/audit-log-cold-storage.yml` に
`vars.* || 'false'` fallback の env bridge を追加。(3) `apps/api/src/env.ts` の `ALERT_DEDUP_KV` を
required → optional に是正し、wrangler コメントアウト状態と型整合。消費側 `alert-relay.ts` の全アクセス点
（計 4）に存在ガードを足し、KV 未活性時は dedup を諦め配信継続する fail-open に統一した。

正本同期は同一 wave で実施。`specs/08-free-database.md` に KV / R2 free-tier limits（確認日 2026-05-31）、
`deployment-cloudflare.md` に current KV/R2 binding inventory 表 + free-tier values 表 + stale 記述是正、
`cost-guardrail-runbook.md` §2-7 数値閾値 + §4-2 executable degrade、quick-reference / resource-map /
artifact inventory / lessons-learned（L-I57-001..006）/ task-workflow-active / SKILL-changelog を反映した。

env フラグの真偽判定は `=== "true"` 厳密一致で統一し、`"TRUE"`/`"1"` は非 pause。未設定＝通常動作を保証する。
新規 binding 追加（`R2_BUCKET`=UT-12 / `SESSION_KV`=UT-13 / `ALERT_DEDUP_KV` 活性化=ut-17-followup-002）は
scope 外として分離した。commit / push / PR（`Refs #57`）/ GitHub variable mutation / production scheduled
export は user-gated。
