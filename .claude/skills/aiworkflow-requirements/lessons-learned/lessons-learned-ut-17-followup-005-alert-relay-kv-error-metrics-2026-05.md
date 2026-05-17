---
task: UT-17-followup-005
recorded: 2026-05-16
topics: [alert-relay, kv, observability, structured-logging, fail-open, pii, isolate-id, vitest-mock-leak]
related-references:
  - references/workflow-ut-17-followup-005-alert-relay-kv-error-metrics-artifact-inventory.md
  - docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-error-metrics/
  - docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md
  - apps/api/src/routes/internal/alert-relay.ts
  - apps/api/src/routes/internal/__tests__/alert-relay.spec.ts
classification:
  - implementation/isolate-identity
  - implementation/fail-open-semantics
  - security/pii-hashing
  - contract/log-schema-literal
  - testing/mock-leak-prevention
---

# Lessons Learned — UT-17 Follow-up 005 Alert Relay KV Error Metrics (2026-05)

UT-17-FU-002 で導入した `ALERT_DEDUP_KV.get` / `put` の失敗を observable 化するために、構造化 JSON warn ログ emit を `apps/api/src/routes/internal/alert-relay.ts` に追加した実装から得た 5 教訓。後段 UT-17-FU-006（KV usage dashboard 化）が本 emit を入力に取るため、教訓 3〜4 は schema 互換契約として残す必要がある。出典は `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-error-metrics/outputs/phase-12/` と実装差分。

---

## 1. 実装 / `isolateId` は module top で 1 回だけ採番する

### 概要
`crypto.randomUUID()` を handler 内で呼ぶと、毎リクエストで isolateId が変わってしまい「同一 isolate で連続発生したエラー」を Workers Logs 上で束ねられなくなる。module top（`createAlertRelayRoute` の外）に `const isolateId = crypto.randomUUID();` を置き、isolate ライフサイクルと一致させた。

### なぜ重要か
- Cloudflare Workers の isolate は warm 時に複数リクエストを跨いで再利用される。isolate 内で発生する KV 局所障害（接続キャッシュ劣化など）を診断するには、同一 isolate 由来であることを後段集計で識別できる必要がある。
- handler ローカルで採番すると、後段 dashboard でグルーピング軸が崩れる。

### 再発防止アクション
- 構造化ログに `isolateId` を出す場合は module 評価時の単発採番をデフォルトにする。
- review 時のチェックリストに「`crypto.randomUUID()` を request handler の中で呼んでいないか」を追加。

### 関連 reference
- `apps/api/src/routes/internal/alert-relay.ts`（module top `const isolateId = crypto.randomUUID();`）

---

## 2. 実装 / `KV.get` 失敗時の fail-open 化は意図的挙動変更として spec に明記

### 概要
従来は `KV.get(dedupeKey)` が throw すると Hono のデフォルト 500 ハンドラに伝播し、Slack 配信は走らないまま 500 を返していた。本タスクで `try/catch` で囲い、catch ブランチでは `seen = null` 相当として fall through させ、Slack 配信を実行する fail-open 動作に切り替えた。

### なぜ重要か
- alert relay の最終 goal は Slack 配信であり、dedup は副次最適化。KV 障害で alert 通知自体が止まる方が運用上のリスクが大きい。
- 「同じ入力で前回まで 500 だったものが 200 になる」のは観測可能な挙動変更。後続レビューで「regression では？」と誤判断されないよう、`outputs/phase-12/implementation-guide.md` Part 3 に意図的変更として表で明記した。

### 再発防止アクション
- 外部副作用付き route で「失敗時の status code が変わる」改修は、Phase 12 implementation-guide の behaviour change 表に列挙する。
- focused test に「KV throw 時の HTTP 200 + 構造化 warn 出力 + Slack 配信成功」を AC として残す（本タスク TC-KV-05）。

### 関連 reference
- `apps/api/src/routes/internal/alert-relay.ts`（`try { seen = await c.env.ALERT_DEDUP_KV.get(...) } catch { ... }`）
- `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` TC-KV-05

---

## 3. セキュリティ / PII を含む可能性のある dedupeKey は SHA-256 hash で出す

### 概要
`dedupeKey` は `policy_id || name || alert_type` を含む可能性があり、外部の policy 命名次第では PII 相当の文字列がログに出る恐れがある。本実装では SHA-256 を取った first 12 hex chars（lowercase）だけを `dedupeKeyHash` として emit する設計に固定した。

### なぜ重要か
- raw key をログに出すと、Workers Logs / logpush 経由で外部保存ストレージに PII 相当が伝播するリスクがある。
- 12 hex chars（48 bits）で同一キーの再現性は十分担保しつつ、reverse は実用上不可能なバランス。
- 後段 dashboard でも「同一 dedupeKey での再発」を hash 同値で検出できる（TC-DEDUPE-KEY-HASH で再現性を担保）。

### 再発防止アクション
- ログ schema 設計時に「外部命名空間に依存するキーは raw で出さない」を原則とする。
- hash 長は 12 hex chars を基準にし、衝突が問題になったケースで初めて拡張する。

### 関連 reference
- `apps/api/src/routes/internal/alert-relay.ts`（`sha256Hex12` helper）
- `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` TC-DEDUPE-KEY-HASH

---

## 4. 契約 / `event` 文字列リテラルは後段集計の固定契約として予約する

### 概要
`event: "alert_relay_kv_op_failed"` は後段 UT-17-FU-006 dashboard / logpush filter が grep する固定文字列リテラル。TypeScript 側では `as const` で narrow するが、より重要なのは「半年後の改修で勝手に名前を変えない」契約を spec に残すこと。`outputs/phase-12/system-spec-update-summary.md` Step 2 に明記した。

### なぜ重要か
- 構造化ログの field 名や enum 値を改名すると、後段の logpush filter / Workers Logs クエリが silent に 0 件返すようになる（dashboard が壊れる）。
- "spec 上の固定契約" として明文化していないと、refactor で消えやすい。

### 再発防止アクション
- 後段の集計や filter が依存する文字列リテラルは「契約予約」として `system-spec-update-summary.md` Step 2 に列挙する。
- 改名が必要な場合は follow-up issue を立てて互換性 break として PR 説明に明記する。

### 関連 reference
- `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-error-metrics/outputs/phase-12/system-spec-update-summary.md`
- `apps/api/src/routes/internal/alert-relay.ts`（`event: "alert_relay_kv_op_failed" as const`）

---

## 5. テスト / `vi.spyOn(console, "warn")` は `afterEach` で必ず restore する

### 概要
`vi.spyOn(console, "warn").mockImplementation(() => {})` を fail-open テストで使うと、restore しないまま次の describe ブロックに leak し、別テストで「warn が呼ばれた」assertion を狂わせる。本タスクで `afterEach(() => vi.restoreAllMocks())` を必ず置く形に統一した。

### なぜ重要か
- vitest の mock は file scope で残るため、test order に依存して flaky な fail を起こす。
- 「console.warn が呼ばれてないこと」を assert する成功パステスト（TC-KV-10）が、leak した spy のせいで falsely PASS する事故が起きやすい。

### 再発防止アクション
- `vi.spyOn(console, ...)` を使う spec には必ず `afterEach(() => vi.restoreAllMocks())` を describe 直下に置く。
- 「success path で warn が呼ばれないこと」を assert する回帰ケースを必ず含める（本タスク TC-KV-10）。

### 関連 reference
- `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`（`afterEach(() => { vi.restoreAllMocks(); })`）

---

## 横断サマリ

| 教訓 | classification | 主要 gate / artifact |
|------|----------------|----------------------|
| 1 | implementation/isolate-identity | `const isolateId = crypto.randomUUID();` を module top に置く |
| 2 | implementation/fail-open-semantics | KV.get throw → 200 + warn + Slack 配信。behaviour change を Phase 12 表に明記 |
| 3 | security/pii-hashing | `sha256Hex12(dedupeKey)` で raw key を出さない |
| 4 | contract/log-schema-literal | `event: "alert_relay_kv_op_failed"` を後段集計の固定契約として予約 |
| 5 | testing/mock-leak-prevention | `afterEach(() => vi.restoreAllMocks())` を `console.warn` spy で必須化 |

5 教訓は task-specification-creator Phase 12 の skill-feedback-report と独立し、後続 UT-17-FU-006 の KV usage dashboard 化で 3〜4 の schema 契約を直接利用する。Cloudflare Workers の構造化ログ emit を新規追加する後続タスクでは、本ファイル 1〜5 を起点に Progressive Disclosure で参照する。
