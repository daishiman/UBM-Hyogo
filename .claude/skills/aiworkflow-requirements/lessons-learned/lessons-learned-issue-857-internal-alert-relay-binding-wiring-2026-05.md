---
task: issue-857-internal-alert-relay-binding-wiring
recorded: 2026-05-24
topics: [alert-relay, internal-subrequest, wrangler-vars, env-binding, cf-webhook-auth-secret, silent-no-op, secret-fallback, deploy-required, sheets-auth-healthcheck, binding-parity]
related-references:
  - references/workflow-issue-857-internal-alert-relay-binding-wiring-artifact-inventory.md
  - references/task-workflow-active.md
  - docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/
  - docs/30-workflows/completed-tasks/UT-25-DERIV-02-FU-01-internal-alert-binding-wiring.md
  - docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/
  - apps/api/wrangler.toml
  - apps/api/src/env.ts
  - apps/api/src/scheduled/sheets-auth-healthcheck.ts
  - apps/api/src/scheduled/sheets-auth-healthcheck.binding.spec.ts
  - apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts
  - apps/api/src/routes/internal/verify-cf-webhook-auth.ts
classification:
  - operations/wrangler-vars-inheritance
  - security/receiver-contract-first
  - implementation/optional-vs-deploy-required
  - design/secret-fallback-sharing
  - operations/binding-parity-gate
---

# Lessons Learned — issue-857 Internal Alert Relay Binding Wiring (2026-05)

UT-25-DERIV-02（SA key 失効監視）の healthcheck が `/internal/alert-relay` へ内部 POST する設計だったが、`apps/api/wrangler.toml` に self-subrequest 先 URL (`API_INTERNAL_BASE_URL`) が未配線で deploy 後も silent no-op に落ちていた。この config 配線タスクで得た 5 教訓を classification-first で整理する。出典は `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/`、消化元 `docs/30-workflows/completed-tasks/UT-25-DERIV-02-FU-01-internal-alert-binding-wiring.md` §苦戦箇所、実装差分（`apps/api/wrangler.toml`, `apps/api/src/env.ts`, `apps/api/src/scheduled/sheets-auth-healthcheck.{binding,contract}.spec.ts`）。

---

## L-857ALERT-001. 運用 / `wrangler.toml` `[vars]` は named environment へ継承されない

### 概要
`apps/api/wrangler.toml` の top-level `[vars]` は `[env.staging]` / `[env.production]` へ**継承されない**（Wrangler 仕様）。`API_INTERNAL_BASE_URL` を top-level だけに書いても、staging / production deploy 後の Worker env には載らず、healthcheck は `reason: "missing API_INTERNAL_BASE_URL or token"` の no-op に落ちる。本タスクでは `[env.staging.vars]` と `[env.production.vars]` の**両方**に同名 var を明記した。

### なぜ重要か
- 片側 env にしか書かないと sibling 環境（特に production）で alert が静かに発火しなくなる。設定漏れは deploy 時には error にならず、runtime まで露見しない。
- 既存 env (`AUTH_URL` 等) も同じ理由で両 env に重複記述されており、新 var だけ top-level に置くと一貫性が崩れる。

### 再発防止アクション
- 非機密 var を追加する際は `[env.staging.vars]` / `[env.production.vars]` の両方に同名キーを書く。top-level `[vars]` への単独追加は禁止。
- 値が自 Worker の public URL（self-subrequest 先）の場合、各 env の `AUTH_URL` と同じホストに揃える（staging は `api-staging.*`、production は `api.*`）。
- → 検証は [L-857ALERT-005] の binding parity gate test で固定する。

### 関連 reference
- `apps/api/wrangler.toml`（`[env.production.vars]` / `[env.staging.vars]`）
- `apps/api/src/scheduled/sheets-auth-healthcheck.binding.spec.ts`

---

## L-857ALERT-002. セキュリティ / 受信契約優先 — issue が提案する新 secret を鵜呑みにしない

### 概要
issue #857 / 元 unassigned task は「`INTERNAL_ALERT_TOKEN` を新規投入する」案を含んでいた。しかし受信側 `apps/api/src/routes/internal/verify-cf-webhook-auth.ts` は `CF_WEBHOOK_AUTH_SECRET` **単一照合**であり、別値 `INTERNAL_ALERT_TOKEN` を投入すると relay が 401 で drop し、alert が逆に届かなくなる。送信側 healthcheck は `env.INTERNAL_ALERT_TOKEN ?? env.CF_WEBHOOK_AUTH_SECRET` で fallback するため、新 secret を入れない限り既存 secret で正しく通る。本タスクでは新 token を投入せず、`CF_WEBHOOK_AUTH_SECRET` fallback を正本化した。

### なぜ重要か
- 「issue / spec が要求する追加」を実装する前に、**受信側の実際の検証ロジックを読む**ことが root fix の前提。提案された auth surface 拡張がむしろ機能破壊を招くケースがある。
- タスクの再フレーミングが効いた典型例：「secret を足す」ではなく「既に設計済みの relay を到達可能かつ認証可能にする」が真の課題だった。

### 再発防止アクション
- 内部 POST / webhook 系タスクでは、送信側を変える前に受信側の token / signature 検証ロジックを必ず確認し、契約が一致する経路だけを採用する。
- 採用しなかった代替（別 token 投入）は unassigned-task の消化注記と Phase 12 compliance §9 に「なぜ却下したか」を残す。
- → 採用経路は [L-857ALERT-003] の fallback 回帰テストで固定する。

### 関連 reference
- `apps/api/src/routes/internal/verify-cf-webhook-auth.ts`
- `apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts`（`CF_WEBHOOK_AUTH_SECRET` fallback TC）
- `docs/30-workflows/completed-tasks/UT-25-DERIV-02-FU-01-internal-alert-binding-wiring.md` §2

---

## L-857ALERT-003. 実装 / optional binding と「deploy 時 required」の表現乖離

### 概要
`apps/api/src/env.ts` の `API_INTERNAL_BASE_URL?: string` は型上 optional のままにした。local / unit test では env 抜けでも有効（alert relay を正当に skip できる）だが、deploy 環境では healthcheck の前提として **実質 required** になる。optional のまま放置すると unit test は緑なのに runtime で silent no-op に落ちるギャップが生まれる。本タスクでは型は optional を維持しつつ、env.ts コメント・spec・artifact inventory で「deploy-required」を明文化し、`CF_WEBHOOK_AUTH_SECRET` fallback の存在を contract test で固定した。

### なぜ重要か
- 型を required に格上げすると、env を skip できるべき local / test path まで throw して壊れる。optional の利便性と deploy 必須性の両立が必要。
- 「no-op（設定不足で意図的に skip）」と「failure（設定はあるが POST 失敗）」を healthcheck の log で区別できないと、運用時に「なぜ alert が来ないか」の切り分けが不能になる。

### 再発防止アクション
- 「local optional / deploy required」な env は、型 optional を保ったまま env.ts コメント + spec で deploy-required を明示し、required 性は config（wrangler.toml vars）と test で担保する。
- healthcheck の log は `reason` を no-op 系（`missing ...`）と failure 系（`relay POST failed`）で分離し、evidence trail に残す。

### 関連 reference
- `apps/api/src/env.ts`（`API_INTERNAL_BASE_URL` コメント）
- `apps/api/src/scheduled/sheets-auth-healthcheck.ts`

---

## L-857ALERT-004. 設計 / `CF_WEBHOOK_AUTH_SECRET` 共有 fallback の trade-off

### 概要
送信側は `INTERNAL_ALERT_TOKEN ?? CF_WEBHOOK_AUTH_SECRET` で fallback する。同一 secret を内部 alert relay と外部 webhook で**共有**すると、key rotation 時の影響範囲（blast radius）が両経路に広がる。MVP では auth surface を増やさない価値が勝つため fallback を維持したが、運用フェーズで token を分離する判断点を spec に留保した。

### なぜ重要か
- secret 共有は「鍵 1 本で済む」運用簡素化と「rotation 影響範囲が広い」のトレードオフ。今は前者を採るが、後で分離する際の前提（受信側を multi-token 受理に拡張）を残さないと判断が再現できない。
- [L-857ALERT-002] の「新 token を入れない」決定は MVP 限定であり、恒久決定ではないことを明示する必要がある。

### 再発防止アクション
- secret を複数経路で共有する場合、共有の是非と「いつ分離するか（運用フェーズ移行・rotation 頻度上昇時）」の判断点を spec / lessons-learned に明記する。
- 分離時は受信側 `verify-cf-webhook-auth.ts` を multi-token 受理へ拡張してから送信側に新 token を投入する順序を守る（受信先行）。

### 関連 reference
- `apps/api/src/routes/internal/verify-cf-webhook-auth.ts`
- `docs/30-workflows/completed-tasks/UT-25-DERIV-02-FU-01-internal-alert-binding-wiring.md` §苦戦箇所 4

---

## L-857ALERT-005. 運用 / binding parity gate — #855 (AUTH_SECRET 復旧) 再発防止

### 概要
PR #855（staging AUTH_SECRET binding 復旧）で学んだ通り、staging で env binding が抜けても Workers tail には readable error が出にくく、silent failure になりがち。本タスクでは `sheets-auth-healthcheck.binding.spec.ts` を新設し、`API_INTERNAL_BASE_URL` が staging / production 両 vars に存在し各 `AUTH_URL` とホスト整合することを **static TOML guard** として固定した。

### なぜ重要か
- 新 binding / var を追加するたびに「3 環境（dev/staging/production）× vars/secret の parity」を人手確認するのは漏れる。binding 抜けは runtime まで露見しないため、deploy 前に test で落とす価値が高い。
- contract test（[L-857ALERT-003]）が「コードが env を正しく使う」ことを保証するのに対し、binding test は「config が env を正しく供給する」ことを保証する。両者は補完関係。

### 再発防止アクション
- 新 binding / var 追加 PR では wrangler.toml を静的にパースし、対象 env すべてにキーが存在することを assert する binding guard test を同梱する。
- 値が他 var（`AUTH_URL` 等）とホスト整合すべき場合は、その parity も同 test で固定する。
- secret は値を test に持ち込めないため、runtime 確認は `bash scripts/cf.sh secret list --env <env>` の name presence に限定する（CLAUDE.md secret 運用ポリシー準拠）。

### 関連 reference
- `apps/api/src/scheduled/sheets-auth-healthcheck.binding.spec.ts`
- `apps/api/wrangler.toml`
- `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-11/evidence/api-internal-base-url-grep.log`

---

## 横断サマリ

| 教訓 | classification | 主要 gate / artifact |
|------|----------------|----------------------|
| L-857ALERT-001 | operations/wrangler-vars-inheritance | `[env.staging.vars]` + `[env.production.vars]` 両方に `API_INTERNAL_BASE_URL` |
| L-857ALERT-002 | security/receiver-contract-first | `verify-cf-webhook-auth.ts` 単一照合 → 新 token 不投入 |
| L-857ALERT-003 | implementation/optional-vs-deploy-required | env.ts optional + spec で deploy-required 明文化 |
| L-857ALERT-004 | design/secret-fallback-sharing | `INTERNAL_ALERT_TOKEN ?? CF_WEBHOOK_AUTH_SECRET` fallback 維持 + 分離判断点 |
| L-857ALERT-005 | operations/binding-parity-gate | static TOML guard `binding.spec.ts` |

5 教訓は issue-857 Phase 12 の skill-feedback-report「ワークフロー改善」（受信契約優先 + 回帰テスト先行）と整合する。alert-relay 系後続タスクでは `references/workflow-issue-857-internal-alert-relay-binding-wiring-artifact-inventory.md` を起点に Progressive Disclosure で本ファイル該当節を辿ること。dedup KV 側の教訓は `lessons-learned-ut-17-followup-002-alert-relay-dedup-kv-2026-05.md` を参照。
