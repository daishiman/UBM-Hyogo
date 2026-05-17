---
task: UT-17-followup-005
recorded: 2026-05-16
topics: [alert-relay, kv, observability, structured-logging, fail-safe, workers-isolate, dedup, hashing, fixtures, grep-gate]
related-references:
  - references/workflow-ut-17-followup-005-alert-relay-kv-operation-error-metrics-artifact-inventory.md
  - docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-operation-error-metrics/
  - docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md
  - apps/api/src/routes/internal/alert-relay.ts
  - apps/api/src/routes/internal/__tests__/alert-relay.spec.ts
  - .claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-ut-17-followup-002-alert-relay-dedup-kv-2026-05.md
classification:
  - implementation/fail-safe-logging
  - design/isolate-identity
  - operations/log-schema-migration
  - testing/fixture-scale
  - documentation/placeholder-grep
  - governance/skill-feedback-followup
---

# Lessons Learned — UT-17 Follow-up 005 Alert Relay KV Operation Error Metrics (2026-05)

UT-17 followup-002 で導入した `ALERT_DEDUP_KV` の `.get` / `.put` 失敗を observable にする後続タスクで得た教訓を classification-first で整理する。出典は `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-operation-error-metrics/outputs/phase-12/` と実装差分（`apps/api/src/routes/internal/alert-relay.ts`、`apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`、`docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`）。

---

## L-UT17-FU005-001. 実装 / fail-safe 三段 try/catch の境界設計

### Context
`ALERT_DEDUP_KV.get` / `.put` 失敗時に観測可能性を持たせるため、`logKvOperationError` を導入した。logging sink 自体（`console.warn`）の throw、`dedupeKeyHash` 計算（`computeDedupeKeyHash` = `crypto.subtle.digest`）の throw も alert relay 本処理を絶対に落とさない設計が要求された。

### Problem
単一 `try/catch` でくくると、(a) KV 操作失敗、(b) hash 計算失敗、(c) `console.warn` 自体の throw のどれが起きたか区別できず、最悪 alert relay endpoint が 500 を返して Cloudflare Notification Policy が retry storm を起こす。逆に細かく分けすぎると可読性が落ち、fallback path が複線化して spec で守るべき不変条件（`dedupPersisted:false` / `hash_error`）が抜け落ちる。

### Resolution
三段に固定:
1. **logKvOperationError** 全体を `try { ... } catch { /* swallow */ }`（sink failure guard）。
2. その内側で **computeDedupeKeyHash** を独立 `try/catch` し、失敗時は `dedupeKeyHash="hash_error"` で fallback。
3. **KV.get** は fail-open（`event=alert_relay_kv_op_failed` 出力後 dedup 判定をスキップして送信続行）、**KV.put** は `dedupPersisted:false` を返して上位ロジックで判別。

### 再発防止
- fail-safe logging を追加する際は「(sink failure) ⊃ (payload computation failure) ⊃ (target operation failure)」の包含関係で try/catch を積み、内側ほど fallback 値を spec で明文化する。
- spec 上の不変条件は `dedupPersisted:boolean` / `dedupeKeyHash:string|"hash_error"` のように **型レベルで fallback 値を表現**する。

### 関連 path
- `apps/api/src/routes/internal/alert-relay.ts`
- `outputs/phase-12/implementation-guide.md`

---

## L-UT17-FU005-002. 設計 / module-top isolateId と Workers isolate lifecycle

### Context
`event=alert_relay_kv_op_failed` の構造化ログに `isolateId` を含めることで、Cloudflare Workers Logs 上で同一 isolate の連続失敗を相関できるようにした。実装は `const ISOLATE_ID = crypto.randomUUID();` を module top-level に置く方式。

### Problem
- 関数内で都度 `randomUUID()` を呼ぶと、1 リクエスト内の複数 log 行が別 id になり相関できない。
- request scope に保持すると、isolate 再利用時の連続失敗（例: KV 通信劣化中の連続 alert）が「同じ isolate なのに別 id」となり、Workers Logs 側の相関クエリが組めない。
- 一方 Workers の isolate は eviction される/されないが SDK 観測できず、`module-top` 採用は「isolate が生きている間は同一」という確率的観測値であることを spec に明記する必要がある。

### Resolution
- `ISOLATE_ID` は **module top-level の `const`** に固定。
- 仕様書（`outputs/phase-12/implementation-guide.md` / runbook）に「isolate 生存中は同一、isolate 再起動で再生成。完全な request 単位の相関 id ではない」旨を明記。
- 将来 trace-id が必要になれば `cf-request-id` 等を別 field として追加する（既存 isolateId は維持）。

### 再発防止
- Workers でのプロセス相関 id は **module-top const** をデフォルトとし、request 相関が欲しい場合は別 field として追加。決して同一 field に二義性を持たせない。

### 関連 path
- `apps/api/src/routes/internal/alert-relay.ts`（module top）
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`

---

## L-UT17-FU005-003. 運用 / `console.warn(message, obj)` から structured JSON へのログスキーマ移行

### Context
既存 `apps/api/src/routes/internal/alert-relay.ts` は `console.warn('alert relay ...', { ...obj })` 形式で warn を出していたが、本タスクで **`event=alert_relay_kv_op_failed`** を含む single-line JSON へ移行する必要があった。Workers Logs / Logpush の grep 検索性と、既存 monthly healthcheck runbook の field 表（runbook の field table）と整合させる要件。

### Problem
- いきなり全 `console.warn` を JSON 化すると、既存 runbook の grep pattern が壊れる。
- 逆に新 event だけ JSON 化し旧 warn を残すと、log 出力が二系統になり「どちらを grep すべきか」が runbook 読者に伝わらない。
- log schema は backward-compat を保ちつつ新 field（`event` / `op` / `isolateId` / `dedupeKeyHash` / `error` / `errorName`）を追加する。

### Resolution
- 新規 KV operation error の場合のみ `console.warn(JSON.stringify({...}))` 形式に統一し、`event` field を必須にした。
- 旧 warn は alert relay の他経路ではそのまま残し、runbook の field table を新 event だけのスキーマで記述。
- runbook（`ut-17-alert-relay-monthly-healthcheck.md`）に grep コマンド例（`grep alert_relay_kv_op_failed`）と field 表を追加。

### 再発防止
- structured logging 移行は **新 event 単位** で行い、既存 warn を一括変換しない。
- runbook の field 表は **新 event ごとに節を切る** スタイルに統一する。

### 関連 path
- `apps/api/src/routes/internal/alert-relay.ts`
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`

---

## L-UT17-FU005-004. テスト / `alert-relay.spec.ts` 850 行肥大化と KV stub fixture の将来抽出余地

### Context
本タスクで `alert-relay.spec.ts` は 27 tests を含み、ファイルサイズは約 850 行まで肥大化した。`createKvStub()`（followup-002 で導入）に加え、本タスクでは **KV.get throw / KV.put throw / hash throw / warn-sink throw** を simulate するための個別 spy fixture が増殖した。

### Problem
- `alert-relay.spec.ts` 単一ファイルに「正常系 / KV.get 失敗 / KV.put 失敗 / hash 失敗 / sink 失敗」の 5 系統が並び、describe ブロックが深くなり読解負荷が高い。
- 将来 fail-safe 三段の上にさらに observability 拡張（例: latency metric）が乗ると 1000 行を超え、focused test の実行時間が無視できなくなる。
- 一方 followup-005 単独で fixture 分離 PR を出すとレビュー単位が肥大化するため、本 PR では同一ファイルに留めた。

### Resolution
- 本 PR では同一 spec 内に保持し、`describe('logKvOperationError', ...)` で論理分離。
- 将来の抽出余地として `apps/api/test/helpers/kv-stub.ts` に「throw-on-call」variant、`apps/api/test/fixtures/alert-relay-payloads.ts` 切り出しを **未着手 TODO** として lessons に記録（コード内 TODO コメントは grep 誤検知を避けるため置かない）。

### 再発防止
- KV / external sink を stub するテストは、ファイル行数 600 を超えた段階で **helpers/fixtures 抽出 PR** を follow-up unassigned task として登録する運用に切り替える。

### 関連 path
- `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`
- `apps/api/test/helpers/kv-stub.ts`

---

## L-UT17-FU005-005. ガバナンス / placeholder grep 誤検知の取扱

### Context
Phase 11 evidence で `grep-gate.txt` を生成し「placeholder / TODO / WIP」混入を block する CI gate を通す必要があった。本タスクの spec / runbook に「TODO リスト」や「Phase 13 で対応する TODO」のように **通常文として "TODO" 文字列**が含まれていた。

### Problem
- naive な `grep -i 'TODO\|FIXME\|XXX'` は通常文も拾い、false-positive で gate が fail する。
- 一方 grep pattern を緩めすぎると、本来 block すべきコード内 `// TODO:` を見逃す。

### Resolution
- code path（`apps/api/src/**`）と docs path（`docs/30-workflows/**`）で grep 対象を分離し、code 側だけ厳格に block。
- docs 側は「TODO:」コロン付き or コードフェンス内の TODO を block 対象にし、本文中の "TODO リスト" のような自然言語は許容。
- `outputs/phase-11/evidence/grep-gate.txt` に **使用した grep コマンドそのもの**を記録し、後続タスクで pattern を継承できるようにした。

### 再発防止
- placeholder gate は **path scope × pattern strictness** の 2 軸で設計する。code path は strict、docs path は permissive（`TODO:` コロン required）。
- gate コマンド自体を evidence に保存し、後続タスクで継承する。

### 関連 path
- `outputs/phase-11/evidence/grep-gate.txt`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

---

## L-UT17-FU005-006. ガバナンス / skill-feedback-report 経由の stale package filter 検出

### Context
本タスクの Phase 12 `skill-feedback-report.md` 作成中に、`pnpm --filter @repo/api test` のような **古い workspace filter** が docs / コマンド例に残存している箇所を検出した。現在の workspace package 名は `@ubm-hyogo/api`。

### Problem
- `@repo/api` filter は現行 monorepo では match せず、runbook / spec の手順をそのまま実行すると no-op になり、運用者が「テストが pass している」と誤認するリスク。
- `@repo/*` 系の名残は本タスク本体（alert-relay 実装）と無関係だが、skill-feedback の close-out review でしか拾えない種類の drift。

### Resolution
- 本 PR では本タスクが触れた path のみ補正（runbook / spec / lessons）。
- skill-feedback-report に「`@repo/api` → `@ubm-hyogo/api` の歴史的 stale filter」を明示し、後続 unassigned task として登録余地を残す（本タスクのスコープ外として明文化）。

### 再発防止
- skill-feedback-report の close-out review では、`grep -r '@repo/' docs/ .claude/` を定型ステップとして runbook 化する。
- workspace package rename が起きた際は、PR 内で `docs/` と `.claude/skills/**/references/**` を grep する gate を check list 化する。

### 関連 path
- `outputs/phase-12/skill-feedback-report.md`
- `pnpm-workspace.yaml`（参照: 現行 package 命名）

---

## メモ

- 本タスクは local 実装と evidence capture までを完了し、Cloudflare runtime deploy / Workers Logs tail / commit / push / PR は **すべて user-gated** で残した。
- 関連: `lessons-learned-ut-17-followup-002-alert-relay-dedup-kv-2026-05.md`（dedup KV の初期導入時の Env contravariance / KV stub fixture / wrangler binding gating）、`lessons-learned-ut-17-followup-003-healthcheck-cron-2026-05.md`（mail fallback no-throw / cron 表記）、`lessons-learned-ut-17-followup-004-cloudflare-notification-policy-iac-2026-05.md`（PUT 統一 / token split）。
