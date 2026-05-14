---
task: UT-17-followup-002
recorded: 2026-05-13
topics: [alert-relay, dedup, kv, cloudflare, slack, env-binding, type-narrowing, wrangler, fixtures, eventual-consistency]
related-references:
  - references/workflow-ut-17-followup-002-alert-relay-dedup-kv-artifact-inventory.md
  - references/patterns-kv-dedup.md
  - docs/30-workflows/ut-17-followup-002-alert-relay-dedup-kv/
  - docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md
  - apps/api/src/routes/internal/alert-relay.ts
  - apps/api/src/env.ts
  - apps/api/src/index.ts
  - apps/api/wrangler.toml
  - apps/api/src/routes/internal/__tests__/alert-relay.test.ts
classification:
  - implementation/type-contravariance
  - testing/fixture-design
  - operations/binding-gating
  - design/persistence-ordering
  - documentation/wording-discipline
---

# Lessons Learned — UT-17 Follow-up 002 Alert Relay Dedup KV (2026-05)

UT-17 親タスクで isolate-local `Map` に置いていた alert dedup 状態を、Cloudflare KV (`ALERT_DEDUP_KV`) に永続化する移行で得た 5 教訓を classification-first で整理する。出典は `docs/30-workflows/ut-17-followup-002-alert-relay-dedup-kv/outputs/phase-12/` と実装差分（`apps/api/src/{env,index}.ts`, `apps/api/src/routes/internal/alert-relay.ts`, `apps/api/src/routes/internal/__tests__/alert-relay.test.ts`, `apps/api/wrangler.toml`）。

---

## 1. 実装 / 必須 binding 追加時の Env 型 contravariance

### 概要
`Env` interface に必須 `ALERT_DEDUP_KV: KVNamespace` を追加した瞬間、`(env: Env) => X` を受ける関数（特に `buildFormsClient`）に従来の狭い env slot を渡せなくなった。TypeScript の引数位置（contravariance）により、required key が増えた `Env` は「狭い env」のサブタイプではないため、`apps/api/src/index.ts` の env narrowing 修正が必須になった。

### なぜ重要か
- KV/D1/Queue 等の binding を 1 つ追加するだけで、`Env` を引数で受ける全 helper の呼び出し側に波及する。
- `Pick<Env, ...>` で必要 key だけ受ける形に narrow しないと、テスト fixture も全 binding をスタブ化する羽目になり、テスト負荷が肥大化する。

### 再発防止アクション
- 新 binding 追加 PR では `Env` を直接引数に取る helper の signature を `Pick<Env, "REQUIRED_KEYS_ONLY">` または最小 interface に narrow し直す。
- `apps/api/src/index.ts` の `buildFormsClient` 呼び出しのように、追加 binding を使わない helper には narrow した env を渡す。
- typecheck 失敗の修正対象を「binding 追加 commit」と同一 commit に閉じ込め、後続 commit で型不整合が紛れないようにする。

### 関連 reference
- `apps/api/src/env.ts`
- `apps/api/src/index.ts`
- `references/patterns-kv-dedup.md` § Env binding narrowing

---

## 2. テスト / KV stub fixture 設計

### 概要
`apps/api/test/helpers/kv-stub.ts` で `createKvStub()` を提供し、`{ kv, puts, store }` 形式の return shape で KV 動作を観測可能にした。TTL を実時間で待つと flaky になるため、`vi.useFakeTimers()` + 論理時刻進行で expiration を simulate するパターンに統一した。

### なぜ重要か
- `KVNamespace.put(..., { expirationTtl })` を実時間で検証すると最短でも数秒の sleep が必要となり、CI で flaky 化しやすい。
- Slack 配信成功後に `put` する順序を検証するためには、`puts` 配列で呼び出し順 / payload を assert できる shape が必要。
- 既存 `apps/api/test/` ディレクトリは新規追加（git untracked）であり、Miniflare 実体を直接使うより stub の方が focused test の所要時間を短縮できる。

### 再発防止アクション
- KV を扱う route の test fixture は `createKvStub()` を経由し、`puts` への push を assert する。
- TTL 検証は `vi.useFakeTimers()` + `vi.advanceTimersByTime()` で論理時間を進める。`setTimeout` / 実 `sleep` 禁止。
- `store` Map 内部を直接覗かず、`kv.get(key)` 経由で取得して isolate-cross 整合性をテストする。

### 関連 reference
- `apps/api/test/helpers/kv-stub.ts`
- `apps/api/src/routes/internal/__tests__/alert-relay.test.ts`
- `references/patterns-kv-dedup.md` § KV stub fixture

---

## 3. 運用 / `wrangler.toml` binding gating

### 概要
KV namespace id は **user が `wrangler kv:namespace create` を実行して初めて発行**される。placeholder id (`""` や `xxxxxxxx`) を active TOML に書くと、`wrangler deploy` 実行時に invalid binding error で全 route が落ちる。本タスクでは staging / production の KV namespace block を**コメントアウトしたまま PR レビュー対象**とし、namespace 作成後に user 自身がコメント解除する運用に揃えた。

### なぜ重要か
- placeholder のまま push すると CD pipeline が壊れる。
- `[[kv_namespaces]]` を active のまま commit すると `wrangler deploy --dry-run` でも fail し、本タスクで意図する「コードは local 完了、deploy は user-gated」という境界が崩れる。
- Cloudflare 側 mutation は user 明示承認後のみ行う運用ポリシー（CLAUDE.md `scripts/cf.sh` 経由）に整合させる必要がある。

### 再発防止アクション
- KV / R2 / D1 binding を新規追加する PR では `wrangler.toml` 内に `# TODO: uncomment after user-gated namespace creation` の commented block として残す。
- staging / production それぞれの env section に同じ binding を **同名 placeholder block** で配置し、user が両方を同時に有効化できるようにする。
- `references/patterns-kv-dedup.md` § wrangler binding gating を必ず参照する。

### 関連 reference
- `apps/api/wrangler.toml`
- `references/patterns-kv-dedup.md` § wrangler binding gating
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` § KV healthcheck

---

## 4. 設計 / Dedup persistence ordering — Slack 成功後に put

### 概要
旧実装は alert 受信直後に `seenAlerts.set(key, now)` を呼んでいた。KV 移行で同じ順序を踏襲すると「Slack 配信失敗 → Cloudflare retry で再投げ → KV hit で dedup → Slack に永久に届かない」silent failure が発生する。新実装では **Slack 配信成功（HTTP 2xx）後にだけ `ALERT_DEDUP_KV.put`** する順序に変更した。

### なぜ重要か
- alert relay の最終的な goal は Slack に通知が**届くこと**で、dedup はその副次最適化に過ぎない。
- KV を eventual consistent な「届いた記録」として使うため、未配信状態を記録しないことで Cloudflare retry を握り潰さない。
- focused test に「Slack 失敗後 retry が dedup されない」回帰ケース（HTTP 500 → 再送で再び Slack POST が走る）を必須化した。

### 再発防止アクション
- KV/Cache を「外部副作用の成否ステータス」に使う場合は、必ず外部 call 成功後に persist する。受信直後 persist は禁止。
- focused test に「外部 call 失敗 → retry が新しい外部 call を起こす」回帰ケースを含める。
- code review 時のチェックリストに「dedup `put` の位置は Slack 成功分岐の内側か」を追加。

### 関連 reference
- `apps/api/src/routes/internal/alert-relay.ts`
- `apps/api/src/routes/internal/__tests__/alert-relay.test.ts`
- `references/patterns-kv-dedup.md` § Persistence ordering

---

## 5. ドキュメント / Eventual consistency の境界 wording 規律

### 概要
Cloudflare KV は eventual consistent（最大 60 秒程度の伝播遅延）であるため、"exactly-once" や "guarantee" を使うと誤った期待値を読み手に与える。本タスクでは spec / runbook / artifact inventory / quick-reference の全箇所で **「実用上大幅低減 (practical reduction)」「重複通知を実用的に抑える」** に wording を統一した。

### なぜ重要か
- "exactly-once guarantee" と書くと、user が KV 直後の二重通知を bug と判断して報告し、調査コストが膨らむ。
- 監査トレースで「保証する」という記述が残ると、SLO 文書が後付けで作られた時の根拠として誤援用されるリスクがある。
- 5 ファイル以上に同じ概念が点在するため、wording 統一は classification-first の同一 wave で実施しないと drift が発生する。

### 再発防止アクション
- KV / Durable Object など eventually consistent な store を扱う spec では `eventual` / `practical reduction` / `best-effort` を使い、`guarantee` / `exactly-once` / `strict` を禁止語彙とする。
- aiworkflow-requirements 同期時に「該当 task の全 reference を一括 grep」して禁止語彙の残留を確認。
- `docs/30-workflows/ut-17-followup-002-alert-relay-dedup-kv/outputs/phase-12/system-spec-update-summary.md` の wording 統一ルールを継承する。

### 関連 reference
- `docs/30-workflows/ut-17-followup-002-alert-relay-dedup-kv/`
- `references/workflow-ut-17-followup-002-alert-relay-dedup-kv-artifact-inventory.md`
- `references/task-workflow-active.md` § UT-17 follow-up 002

---

## 横断サマリ

| 教訓 | classification | 主要 gate / artifact |
|------|----------------|----------------------|
| 1 | implementation/type-contravariance | `apps/api/src/index.ts` env narrowing |
| 2 | testing/fixture-design | `apps/api/test/helpers/kv-stub.ts` + fake timers |
| 3 | operations/binding-gating | commented `[[kv_namespaces]]` block in `wrangler.toml` |
| 4 | design/persistence-ordering | Slack 2xx 後の `ALERT_DEDUP_KV.put` |
| 5 | documentation/wording-discipline | "practical reduction" 統一 / "exactly-once" 禁止 |

5 教訓は task-specification-creator Phase 12 の skill-feedback-report と一対一対応する。Cloudflare KV を使う後続タスクでは `references/patterns-kv-dedup.md` を起点に Progressive Disclosure で本ファイル該当節を辿ること。
