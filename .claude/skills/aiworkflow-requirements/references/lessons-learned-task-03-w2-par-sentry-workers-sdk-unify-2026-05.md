# Task-03 W2 Sentry Workers SDK Unify Lessons (2026-05)

## Scope

Workflow: `docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/`

Task type: `implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

Source: `outputs/phase-12/implementation-guide.md`、`outputs/phase-12/skill-feedback-report.md`、`outputs/phase-12/system-spec-update-summary.md`、`outputs/phase-12/unassigned-task-detection.md`

## Lessons

### L-T03-001: Cloudflare Workers + Next.js では server/browser で Sentry SDK を必ず分離する

- Symptom: `@sentry/nextjs` を共通 SDK として両 runtime に置くと、Workers bundle に `replayIntegration` / `captureRouterTransitionStart` などブラウザ専用 API が推移混入し、deploy 後 runtime で 500 を引き起こす。
- Cause: Next.js 標準の `instrumentation.ts` が server/edge/browser を 1 ファイルで初期化する前提に倣い、Workers (server) でもブラウザ向け SDK を読み込んだ。
- Recurrence condition: `@opennextjs/cloudflare` 経由の Workers + Next.js プロジェクトで Sentry / 任意 observability SDK を導入するとき。
- 5-minute resolution: Server entry (`apps/web/src/instrumentation.ts`) は `@sentry/cloudflare`、Browser entry (`apps/web/src/instrumentation-client.ts`) は `@sentry/nextjs` に分離し、共通 capture wrapper (`apps/web/src/lib/sentry/capture.ts`) で両 runtime の API 表面を `captureException` / `captureMessage` / `register` の3関数に揃える。grep gate G-1b で `apps/web/.open-next/worker.js` への browser SDK 推移混入をビルド後に毎回検出する。
- Evidence path: `docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/outputs/phase-12/implementation-guide.md` Part 2、`outputs/phase-11/evidence/grep-gate.log`

### L-T03-002: DSN は server secret と browser public var に二系統分離する

- Symptom: 単一 `SENTRY_DSN` 変数を server / browser 双方で再利用すると、ブラウザに secret 名が露出するか、または server 側に public var を bind してしまう。Cloudflare Secret と GitHub Variable のスコープ境界が曖昧になり secrets management が崩れる。
- Cause: Sentry DSN を「機密」「公開」の二分法で扱わず、SDK が読む環境変数名と公開可否を分けなかった。
- Recurrence condition: Cloudflare Workers にデプロイされる Next.js / OpenNext アプリで、observability SDK の DSN を導入するとき。
- 5-minute resolution: `SENTRY_DSN_WEB` は **Cloudflare Secret**（`bash scripts/cf.sh secret put`）、`NEXT_PUBLIC_SENTRY_DSN` は **GitHub Variable + build-time inline**（公開前提）として明確に分離する。server 側読み取りは `apps/web/src/lib/env.ts` の `getEnv()` ヘルパーに閉じ、Cloudflare runtime binding 優先・local test/dev は `process.env` fallback を契約する。`NEXT_PUBLIC_*` を secret として扱うと `wrangler` のビルド差し込みで誤って Cloudflare Secret に登録される事故が起きる。
- Evidence path: `outputs/phase-12/implementation-guide.md` Settings table、`outputs/phase-12/skill-feedback-report.md` aiworkflow-requirements 「Web Sentry secret name drifted」

### L-T03-003: code 実装を含む workflow は PASS_BOUNDARY_SYNCED_RUNTIME_PENDING で停止し runtime PASS と切り離す

- Symptom: `taskType=implementation / docs_only=false` で apps/web に code diff が入っているのに、staging/production runtime でのエラー発生確認をしないまま Phase 11 を `runtime PASS` と表現し、aiworkflow-requirements の current fact を最終昇格してしまう。
- Cause: `implemented-local` (ローカルビルド・テスト・grep gate PASS) と runtime PASS (実 deploy 後の Sentry イベント受信確認) を同列に扱った。
- Recurrence condition: deploy を含まない wave で apps/web / apps/api の observability / 認証 / data path 系コードを実装するとき。
- 5-minute resolution: Phase 11 を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 状態で締め、`outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log` の5本を canonical evidence として固定する。aiworkflow-requirements の同 wave 同期は (1) `references/task-workflow-active.md`, (2) `indexes/resource-map.md`, (3) `indexes/quick-reference.md`, (4) `changelog/<date>-<slug>.md` の4ファイルに限定し、最終 current fact 昇格は runtime smoke 完了の implementation follow-up wave に延期する（L-355-004 と同パターン）。
- Evidence path: `outputs/phase-12/system-spec-update-summary.md` Updated 表、`outputs/phase-12/phase12-task-spec-compliance-check.md` Phase 11 state 欄

### L-T03-004: capture wrapper は fail-soft 契約で アプリ本体へ例外を伝播させない

- Symptom: SDK 未 init、DSN 未設定、dynamic import 失敗、Sentry サービス側 5xx などの観測層エラーをアプリ本体に伝播させると、ユーザー操作が無関係な観測層障害で 500 を返す。
- Cause: `Sentry.captureException` をそのまま呼ぶと SDK 未 init 時に throw する実装が混じる。
- Recurrence condition: 任意の observability/監視 SDK をアプリ本体の例外パスから呼び出すとき。
- 5-minute resolution: `captureException` / `captureMessage` ともに `Promise<string | undefined>` を返す wrapper にし、内部 try/catch で全例外を握りつぶして `undefined` を返す。`__ubmSentryInitialized__` のような double-init guard を server / browser それぞれに用意する。
- Evidence path: `outputs/phase-12/implementation-guide.md` 「エラーハンドリング」「設定項目と定数一覧」

### L-T03-005: unassigned-task-detection は「検出4件以上」DoD でも no-op 判定可能、ただし trace を残す

- Symptom: phase-12 の DoD「unassigned-task が4件以上検出される」を「4件配置」と誤解釈し、本来 out-of-scope や既存ワークフローでカバー済みの候補も新規 unassigned task として配置してしまう。
- Cause: 「検出」と「配置」を区別せず、検出=配置と読み替えた。
- Recurrence condition: implementation 系 spec で隣接スコープ（ここでは apps/api Sentry / release tag automation / performance tuning / D1・KV breadcrumb）を Phase 12 で評価するとき。
- 5-minute resolution: `unassigned-task-detection.md` に4件以上の Reviewed Candidates を表として並べ、各候補について `Decision (no new task / new task <id>)` と `Reason (out of scope / covered by <existing workflow>)` を明示する。`phase12-task-spec-compliance-check.md` には「DoD #4 trace」セクションを設け、4件以上が検出表に存在し no-op 判定が妥当である旨と、既存カバー先の workflow root へのリンクを残す。これにより compliance PASS の根拠が後追い可能になる。
- Evidence path: `outputs/phase-12/unassigned-task-detection.md`、`outputs/phase-12/phase12-task-spec-compliance-check.md` DoD #4 trace 行
