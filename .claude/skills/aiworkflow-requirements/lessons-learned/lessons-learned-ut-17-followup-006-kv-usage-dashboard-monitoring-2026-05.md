---
task: UT-17-followup-006
recorded: 2026-05-16
topics: [kv, alert, monitoring, cloudflare, notification-policy, iac, quota, dedup, ut-17, dashboard, rollout-staging, fixtures]
related-references:
  - references/workflow-ut-17-cloudflare-analytics-alerts-artifact-inventory.md
  - references/patterns-kv-dedup.md
  - references/observability-monitoring.md
  - references/deployment-cloudflare.md
  - references/task-workflow-active.md
  - docs/30-workflows/completed-tasks/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring/
  - docs/30-workflows/completed-tasks/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring.md
  - docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md
  - infra/cloudflare-alerts/policies/workers-kv-writes-per-day.json
  - infra/cloudflare-alerts/policies/workers-kv-stored-bytes.json
  - infra/cloudflare-alerts/quota-base.json
  - infra/cloudflare-alerts/lib/__tests__/load.spec.ts
  - infra/cloudflare-alerts/lib/__tests__/quota-base.spec.ts
  - tests/fixtures/cloudflare-alerts/api-list-policies.json
classification:
  - workflow/supersession-cascade
  - design/api-capability-boundary
  - operations/two-stage-rollout
  - testing/fixture-quota-coupling
---

# Lessons Learned — UT-17 Follow-up 006 KV Usage Dashboard Monitoring (2026-05)

UT-17 親タスクおよび followup-002 (KV dedup 永続化) / followup-004 (Cloudflare Notification Policy IaC) の完成を踏まえ、`ALERT_DEDUP_KV` を含む Workers KV の usage を監視する policy を追加した実装で得た 4 教訓を classification-first で整理する。出典は `docs/30-workflows/completed-tasks/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring/outputs/phase-12/` と実装差分（`infra/cloudflare-alerts/policies/workers-kv-*.json`, `infra/cloudflare-alerts/quota-base.json`, `infra/cloudflare-alerts/lib/__tests__/{load,quota-base}.spec.ts`, `tests/fixtures/cloudflare-alerts/api-list-policies.json`, `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`）。

---

## L-UT17FU006-001. workflow / 依存 IaC 完成に伴う unassigned-task supersession

### 状況
followup-006 の source 仕様 `docs/30-workflows/unassigned-task/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring.md` は当初「Cloudflare dashboard 上で手動 monitor を組む dashboard-only タスク」として書かれていた。

### 何が起きたか
followup-004 で Cloudflare Notification Policy IaC (`infra/cloudflare-alerts/policies/*.json` + drift CI) が完成した結果、「dashboard-only」前提が陳腐化し、同じ scope を IaC で扱えるようになった。source 仕様をそのまま実装すると IaC 体系との二重管理になる。

### 対応
- 新しい workflow root `docs/30-workflows/completed-tasks/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring/` を立て、IaC 経路での実装に scope 変更。
- 旧 unassigned-task ファイルに `status: superseded` トレースを残し、新 workflow root へのリンクを記載。
- `resource-map.md` 行に `source ... (superseded), IaC base ...` の cross-link を明文化。

### 再発防止
- 依存 IaC 基盤が完成した直後に、依存する `unassigned-task/` 配下を一括 re-evaluation するゲートを設ける（次回 followup spec 生成時に「親 IaC 完成 → 依存 unassigned を superseded 判定 → 新 workflow root 起票」の固定手順を踏む）。
- `status: superseded` トレースは IaC base へのリンク同梱を必須化（リンク無しの supersede 禁止）。

### 関連 path
- `docs/30-workflows/completed-tasks/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring.md`（旧 source、superseded）
- `docs/30-workflows/completed-tasks/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring/`（新 workflow root）
- `docs/30-workflows/completed-tasks/ut-17-followup-004-cloudflare-notification-policy-iac/`（IaC base）

---

## L-UT17FU006-002. 設計 / Cloudflare API 能力境界に基づく wording 撤回

### 状況
当初 spec では「`ALERT_DEDUP_KV` 専用の usage alert」を立てる方針が記述されていた。

### 何が起きたか
Cloudflare Notification Policy の Workers KV usage alert (`workers_kv_writes_per_day` / `workers_kv_stored_bytes`) は **account 単位の集計**で発火し、**namespace filter 用 API パラメータが存在しない**。実装中に `tests/fixtures/cloudflare-alerts/api-list-policies.json` を schema 整合確認した結果、namespace selector が無いことが確定し、「`ALERT_DEDUP_KV` 専用」表現は API 能力境界を超えていた。

### 対応
- spec / runbook / system spec の wording を「Workers KV usage account-scoped alert」に統一し、「dedup-KV 専用」表現を撤回。
- 「account 内 KV namespace が `ALERT_DEDUP_KV` のみ運用される前提」という境界条件を `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` と `references/observability-monitoring.md` に明文化。
- 他の namespace を後日追加した場合の「account-level 値の解釈が dedup-KV 専用ではなくなる」境界を runbook の補足セクションで宣言。

### 再発防止
- Cloudflare API 機能を前提とする spec は、最初の Phase で `tests/fixtures/cloudflare-alerts/api-list-policies.json` 相当の **実 API shape** を schema validation してから wording 確定する（「desired filter があると仮定する」spec を禁止）。
- 「Xリソース専用」と書きそうな箇所では「account-scoped で前提 namespace は Y のみ」と置き換える wording template を `references/observability-monitoring.md` に追加。

### 関連 path
- `infra/cloudflare-alerts/policies/workers-kv-writes-per-day.json`
- `infra/cloudflare-alerts/policies/workers-kv-stored-bytes.json`
- `tests/fixtures/cloudflare-alerts/api-list-policies.json`
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`
- `references/observability-monitoring.md`

---

## L-UT17FU006-003. 運用 / 二段階 rollout — enabled:false で contract 化 → baseline 後に enabled:true

### 状況
KV usage monitoring の閾値 (`percentage * quota`) を一発で有効化すると、baseline traffic が無いまま発火し false positive が量産される懸念があった。

### 何が起きたか
followup-004 で IaC 化された policy schema は `enabled: boolean` を持つ。これを活用し、本 followup では Wave A で `enabled: false` のまま IaC + `quota-base.json` + fixture を contract として merge し、Wave B で 5 営業日 baseline 観測後に `enabled: true` 切替という二段階 rollout に切り分けた。短時間 smoke を baseline 代替にしようとすると seasonal pattern を捉えられず、再び false positive を招く。

### 対応
- Wave A: `enabled: false` の policy 2 件を merge (`workers-kv-writes-per-day.json`, `workers-kv-stored-bytes.json`)。drift CI と quota-base load test は通過する状態にした。
- Wave B: runbook に「Cloudflare apply 後 5 営業日 baseline 観測 → `enabled: true` PR 切替」の手順を記載。短時間 smoke での代替を明示的に禁止する境界も同 runbook に明記。
- `enabled: true` 切替は user-gated（commit/push/PR 含め runtime mutation はすべて手動承認後）。

### 再発防止
- 新規 usage alert を IaC に追加する場合は **必ず `enabled: false` で contract 段階を経る** ことを runbook テンプレートに固定化。
- baseline 観測期間（最小 5 営業日）を `references/observability-monitoring.md` の閾値設定セクションに記載し、smoke 代替を禁止する。

### 関連 path
- `infra/cloudflare-alerts/policies/workers-kv-writes-per-day.json`（`enabled: false`）
- `infra/cloudflare-alerts/policies/workers-kv-stored-bytes.json`（`enabled: false`）
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`
- `references/observability-monitoring.md`

---

## L-UT17FU006-004. テスト / quota-base.json 中央集約と fixture の同期粒度

### 状況
followup-004 で確立された「閾値は `percentage * quota` から導出、絶対値直書きは禁止」規約のもとで、Workers KV の 2 種の quota key (`workers_kv_writes_per_day=1000`, `workers_kv_stored_bytes`) を新規追加する必要があった。

### 何が起きたか
`quota-base.json` に key を 2 件足すだけでは不十分で、(a) `lib/__tests__/load.spec.ts` が full key set を assert している、(b) `lib/__tests__/quota-base.spec.ts` が key の存在と type を expect している、(c) `tests/fixtures/cloudflare-alerts/api-list-policies.json` がライブ API レスポンスの shape mirror として 2 policies の expected payload を保持している、の 3 箇所に最小差分で同期しないと CI が落ちる。policy json 内では quota の絶対値を直書きせず、`percentage` で表現する不変条件も維持する必要があった。

### 対応
- `quota-base.json` に `workers_kv_writes_per_day: 1000` と `workers_kv_stored_bytes` の 2 key を追加。
- `lib/__tests__/load.spec.ts` と `lib/__tests__/quota-base.spec.ts` に新 key を expect する最小差分を追加。
- `tests/fixtures/cloudflare-alerts/api-list-policies.json` を 2 新 policy（`workers-kv-writes-per-day`, `workers-kv-stored-bytes`）の expected entry を含む形に更新。
- policy json では絶対値ではなく `percentage` で閾値を表現する規約を維持。

### 再発防止
- `quota-base.json` 変更時に同時更新が必須な 3 箇所（`load.spec.ts` / `quota-base.spec.ts` / `tests/fixtures/.../api-list-policies.json`）を `infra/cloudflare-alerts/README.md` のチェックリストに明記。
- 「閾値は `percentage * quota` で導出、policy json への絶対値直書き禁止」を CI 上で grep gate 化する候補を `references/patterns-kv-dedup.md` の follow-up に記録。

### 関連 path
- `infra/cloudflare-alerts/quota-base.json`
- `infra/cloudflare-alerts/lib/__tests__/load.spec.ts`
- `infra/cloudflare-alerts/lib/__tests__/quota-base.spec.ts`
- `tests/fixtures/cloudflare-alerts/api-list-policies.json`
- `infra/cloudflare-alerts/README.md`

---

## 横断サマリ

| 教訓 ID | classification | 主要 gate / artifact |
|---------|----------------|----------------------|
| L-UT17FU006-001 | workflow/supersession-cascade | 旧 unassigned-task `status: superseded` + 新 workflow root リンク |
| L-UT17FU006-002 | design/api-capability-boundary | `tests/fixtures/.../api-list-policies.json` の schema 確認後 wording 撤回 |
| L-UT17FU006-003 | operations/two-stage-rollout | `enabled: false` で contract → 5 営業日 baseline → `enabled: true` |
| L-UT17FU006-004 | testing/fixture-quota-coupling | `quota-base.json` + 2 spec + fixture の同期 3 箇所 |

4 教訓は task-specification-creator Phase 12 の skill-feedback-report と一対一対応する。Cloudflare KV usage を IaC で扱う後続タスクでは `references/patterns-kv-dedup.md` および `references/observability-monitoring.md` の followup-006 節を起点に Progressive Disclosure で本ファイル該当節を辿ること。
