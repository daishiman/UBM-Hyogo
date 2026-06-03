# 2026-06-02 issue-1056-kv-alert-policy-binding-drift-detection

`issue-1056-kv-alert-policy-binding-drift-detection` を `implemented_local_evidence_captured / implementation / NON_VISUAL`
として同期した。Issue #57（KV/R2 guardrail degrade）系で予防対象としていたドリフトのうち、既存の
`cloudflare-alerts-drift`（宣言↔実デプロイ軸）が見ていなかった「binding が**活性化**しているのに対応する
alert policy が `enabled:false` のまま」という監視ギャップを、read-only / Cloudflare API 非接触の検知モジュール
+ CLI + PR validate gate として実装した。

実装は 1 モジュール + 配線。(1) `infra/cloudflare-alerts/lib/binding-policy-drift.ts` に、wrangler.toml の
コメント行を尊重する自前 line parser `parseActiveBindings`、`loadActiveBindings`、副作用ゼロの純関数
`buildBindingPolicyDrift`、kind 粒度 const `BINDING_POLICY_MAP` を実装。drift 種別は
`isActive && !enabled → MONITORING_GAP` / `!isActive && enabled → STALE_MONITORING`、policy 不在は
`enabled:false` 扱い。(2) `infra/cloudflare-alerts/lib/cli.ts` に `cmdBindingDrift` を追加（整合 exit 0 /
drift exit 2 / usage error exit 64、Cloudflare API 非接触）、`scripts/cf.sh` に `alerts binding-drift`
サブコマンド（allowlist + non-CI local-only 分岐 + usage）、`package.json` に `cf:alerts:binding-drift`。
(3) `.github/workflows/cloudflare-alerts-drift.yml` に **secret 不要**の PR validate gate を追加。

現 baseline は drift 0。KV（`ALERT_DEDUP_KV`）は wrangler.toml でコメントアウト（未活性）かつ KV policy
`enabled:false` で整合、R2（`MEMBER_PHOTOS` / `UBM_AUDIT_*`）は活性かつ `r2-class-a` policy `enabled:true` で
整合。将来 binding を活性化した際の policy 有効化忘れ（MONITORING_GAP）を捕捉する green baseline ガードとして機能する。

正本同期は同一 wave で実施。`deployment-cloudflare.md` に binding↔policy 対応表 + 現 baseline + 責務境界、
quick-reference / resource-map / task-workflow-active / artifact inventory / lessons-learned
（新規 L-I1056-001..006）/ LOGS / SKILL-changelog を反映、topic-map / keywords は `indexes:rebuild` 委譲。
回帰 spec は `binding-policy-drift.spec.ts` 9 + `cf-alerts-cli.spec.ts` の binding-drift ケースで全分岐網羅
（合計 28 PASS）、typecheck exit 0。

検知器は read-only・local-only で、Cloudflare API を呼ばず policy の enable / apply を行わない。policy
enablement / runtime apply は UT-17-followup-006 / user-gated。Issue #1056 は spec 作成時 OPEN → 本サイクル中に
CLOSED（`closedAt: 2026-06-02T03:32:56Z`）へ変化したため docs の state 記述を実態へ整合（reopen はしない）。
commit / push / PR / Issue mutation は user-gated。
