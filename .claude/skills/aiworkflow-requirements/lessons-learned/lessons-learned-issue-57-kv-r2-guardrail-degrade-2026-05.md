---
task: issue-57-kv-r2-guardrail-degrade-design
recorded: 2026-05-31
topics: [kv, r2, cloudflare, audit-log, cold-storage, degrade, kill-switch, env-binding, fail-open, type-optional, drift, runbook, wrangler, vitest-d1]
related-references:
  - references/workflow-issue-57-kv-r2-guardrail-degrade-artifact-inventory.md
  - references/deployment-cloudflare.md
  - docs/30-workflows/completed-tasks/issue-57-kv-r2-guardrail-degrade-design/
  - docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md
  - docs/00-getting-started-manual/specs/08-free-database.md
  - scripts/audit-log/export-to-r2.ts
  - scripts/audit-log/__tests__/export-to-r2.spec.ts
  - apps/api/src/env.ts
  - apps/api/src/routes/internal/alert-relay.ts
  - apps/api/src/routes/internal/__tests__/alert-relay.spec.ts
  - apps/api/src/routes/internal/__tests__/alert-relay.sheets-auth.contract.spec.ts
  - .github/workflows/audit-log-cold-storage.yml
classification:
  - implementation/type-optional-fanout
  - operations/fail-open-degrade
  - operations/executable-kill-switch
  - documentation/spec-code-drift
  - testing/d1-config-split
---

# Lessons Learned — Issue #57 KV/R2 Guardrail Detail and Executable Degrade (2026-05)

05a（observability + cost guardrails）が予防しようとした KV/R2 ドリフトが、Issue #514 / #315 の R2
audit cold-storage binding 追加で現実化していた。正本仕様・runbook を current facts に同期し、実稼働中の
R2 export を「手動コード変更不要」で停止できる env フラグ kill-switch を実装する過程で得た 6 教訓を
classification-first で整理する。出典は `docs/30-workflows/completed-tasks/issue-57-kv-r2-guardrail-degrade-design/outputs/phase-12/`
と実装差分（`scripts/audit-log/export-to-r2.ts`, `apps/api/src/{env,routes/internal/alert-relay}.ts`,
`.github/workflows/audit-log-cold-storage.yml`）。

---

## 1. 実装 / required → optional binding 化の影響範囲（L-I57-001）

### 概要
`Env` の `ALERT_DEDUP_KV: KVNamespace` を `?:` optional に是正した瞬間、消費側 `alert-relay.ts` の
全アクセス点（generic 2 + sheets-auth 2 = 計 4）に `if (c.env.ALERT_DEDUP_KV)` ガードが必要になった。
wrangler の KV block がコメントアウト（未活性）なのに型は required を宣言していた「型↔toml 不整合」を、
optional 化で解消したが、型 1 行の変更が利用箇所全網羅の引き金になる。

### なぜ重要か
- optional 化を「型だけ」で済ませると、未活性 runtime で `undefined.get()` / `undefined.put()` を踏む。
- binding を required にしたまま toml をコメントアウトすると、型が嘘をつき degrade 設計が破綻する。

### 再発防止アクション
- binding を optional 化する PR では、その binding を参照する全アクセス点を grep で棚卸しし、
  同一 PR 内で存在ガードを追加する。型変更とガード追加を分割しない。

## 2. 運用 / KV fail-open（dedup より delivery を優先）（L-I57-002）

### 概要
KV 未活性時は dedup を諦め `dedupPersisted:false` を返し、alert 配信そのものは継続する。
`put` の直前に early-return を挿し、`get` は try/catch ごとガード内に入れる二段構造にした。

### なぜ重要か
- dedup は「補助」、配信は「本務」。KV 障害で本務（通知）が止まると、観測の死角を生む。
- fail-closed にすると「KV が死ぬと alert も来ない」という最悪の沈黙障害になる。

### 再発防止アクション
- 補助的な永続層（dedup / cache）は fail-open を既定にし、欠落時の縮退値（`dedupPersisted:false`）を
  明示的に返す。`get`/`put` 双方を存在ガード内に閉じ込める。

## 3. 運用 / executable kill-switch の挿入位置（L-I57-003）

### 概要
`AUDIT_COLD_STORAGE_EXPORT_PAUSED` の `paused` short-circuit を、`exportRunId` 採番直後・既存 manifest
冪等 skip より**前**に配置し、`status: "paused"` manifest を返す。D1 SELECT / manifest write / R2 PUT を
全て短絡し、dry-run 判定よりも優先する。

### なぜ重要か
- degrade を「手動でコードをコメントアウト」運用のままにすると、実稼働 export に対して実行不能。
- short-circuit 位置を誤ると、停止指示後も credential 依存処理（D1/R2 アクセス）が残り「停止したのに触る」事故になる。

### 再発防止アクション
- kill-switch は副作用（外部 I/O・credential 利用）が始まる**前**に置く。runbook には env フラグ 1 本で
  停止/再開できる executable 手順を書き、「コード変更で停止」を手順から排除する。

## 4. 運用 / env フラグの真偽値規約を CI と一致させる（L-I57-004）

### 概要
`process.env.AUDIT_COLD_STORAGE_EXPORT_PAUSED === "true"` で厳密一致判定し、`"TRUE"`/`"1"` は非 pause。
GHA 側 `vars.* || 'false'` fallback と組み合わせ、未設定＝通常動作を保証した。

### なぜ重要か
- 真偽値解釈がコードと CI でズレると、「CI では止めたつもりが runtime では動く」齟齬を生む。
- 緩い truthy 判定（任意の非空文字列＝true）は誤って停止/起動するリスクがある。

### 再発防止アクション
- env フラグの真偽判定は厳密一致（`=== "true"`）で統一し、CI 側の default fallback（`|| 'false'`）と
  ペアで正本化する。spec / runbook / GHA / code の 4 箇所で同一規約を明記する。

## 5. ドキュメント / spec↔code ドリフト是正の正本順位（L-I57-005）

### 概要
`deployment-cloudflare.md` が「R2 binding 未適用 / KV binding 未追加」と古いまま、実体（`UBM_AUDIT_COLD_STORAGE`
/ `UBM_AUDIT_APP_COLD_STORAGE` 適用済み）とズレていた。code 実体（`wrangler.toml` binding）を正とし docs を
current facts へ是正し、「宣言あり・未活性（コメントアウト）」binding と「適用済み」binding を区別する canonical
inventory 表を常設した。

### なぜ重要か
- 「未利用」前提の runbook degrade は、実稼働している binding に対して実行不能。ドリフトは予防対象そのもの。
- 「宣言だけある／実際に活性」の区別を表で固定しないと、再び同じドリフトが生まれる。

### 再発防止アクション
- binding の状態は `active / declared-but-commented / not-applied` の 3 値で表に明記し、所有 Issue を併記する。
- 再ドリフト検知は wrangler binding ↔ docs の CI gate（follow-up-001）で機械化する。

## 6. テスト / D1 config 分離による実行経路の二段化（L-I57-006）

### 概要
`alert-relay.sheets-auth.contract.spec.ts` は root vitest config では拾われず、`vitest.d1.config.ts` で
別実行が必要。focused test を 1 コマンドに束ねられず、Phase 11 evidence は両経路の実行を明示した。

### なぜ重要か
- 「root config で全 spec が走る」前提だと、D1 依存 contract spec を実行し忘れたまま PASS と誤認する。

### 再発防止アクション
- D1 依存 spec の focused 実行は root config 実行と `--config vitest.d1.config.ts` 実行の 2 コマンドを
  evidence に併記し、どちらの欠落も Phase 11 で見落とさない。

---

## Anti-patterns

- **AP-I57-A（optional 化のガード漏れ）**: binding を optional にしたのに消費側ガードを足さず、未活性 runtime で
  `undefined` アクセスを踏む。→ L-I57-001。
- **AP-I57-B（コメントアウト運用 degrade）**: degrade を手動コードコメントアウトで運用し実行不能のまま放置。→ L-I57-003/004。
- **AP-I57-C（緩い truthy 判定）**: 任意の非空文字列を pause と解釈し、CI default fallback とズレる。→ L-I57-004。
- **AP-I57-D（fail-closed な補助層）**: dedup KV を fail-closed にし、KV 障害で alert 配信ごと沈黙させる。→ L-I57-002。
- **AP-I57-E（stale spec 放置）**: code 実体が変わったのに docs を「未適用」のまま残し、degrade 前提を破綻させる。→ L-I57-005。
