# Lessons Learned: task-05a form preview 503

> task: `task-05a-form-preview-503-001` / Issue #388 / 2026-05-05
> classification: implemented-local-runtime-evidence-blocked / implementation / NON_VISUAL
> 親 inventory: `references/workflow-task-05a-form-preview-503-001-artifact-inventory.md`

## L-05A-FP503-001: D1 column/state drift breaks runbooks

`schema_versions` の current contract は `form_id` / `revision_id` / `state = 'active'` / `synced_at` で、`schema_questions` は `revision_id` をキーに取得する。仕様書や runbook で `formId` / `revisionId` / `state='published'` / `id, version` のように camelCase や別 enum を混ぜると、復旧コマンド（`bash scripts/cf.sh d1 execute ... --command "SELECT * FROM schema_versions WHERE state='active'"`）が空を返して原因切り分けが詰まる。実装契約は必ず `apps/api/src/repository/schemaVersions.ts` と `apps/api/migrations/0001_init.sql` を先に読み、ドキュメント側は code に合わせる。

## L-05A-FP503-002: NON_VISUAL は screenshot path を混ぜない

API HTTP status verification は `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` / `manual-test-result.md` を主証跡とする。`/register` ページは form-preview に依存するが、本タスクは API 側 503 を主題とするため `/register` 確認も curl 200 で代替し、screenshot path を AC に混ぜない。VISUAL 化したい場合は別 follow-up（08b / 09a 系）に委譲する。

## L-05A-FP503-003: AC は root workflow と Phase 1 で単一化する

`index.md` と `outputs/phase-01/main.md` の AC が分岐すると、Phase 10/11/12 の判定が false green になる。root cause は独立 `root-cause.md` ではなく `implementation-guide.md` に統合し、Phase 12 strict 7 files へ寄せる。compliance check 側で「AC が 1 か所しかないこと」を grep で確認する運用にする。

## L-05A-FP503-004: spec_created と runtime PASS を分離する

Phase 12 strict outputs が揃っていても、staging curl / production curl / Vitest の runtime evidence は user approval gate 後にしか取れない。`PENDING_RUNTIME_EVIDENCE` を PASS と書かず、`Phase 13 blocked_until_user_approval` ラベルで deploy / mutation / commit / push / PR を止める。2026-05-05 の review でも staging 503 / production 503 が観測されたが、これは「root cause 仮説の支持証拠」であって「実装後の PASS 証跡」ではない。

## L-05A-FP503-005: `logWarn({ code: "UBM-5500" })` は throw の直前に 1 回だけ

`get-form-preview.ts` の `getLatestVersion()` null 経路では、`ApiError` を throw する**直前**に `logWarn({ code: "UBM-5500", message, context: { where, formId, usedFallback } })` を 1 回だけ emit する。これにより `wrangler tail --env staging | grep UBM-5500` で staging の root cause を即特定できる。注意点:

- handler 側 `apps/api/src/_shared/error-handler.ts` で 5xx を warn ログ化する経路と二重出力にならないよう、use-case 側は **manifest 欠落の早期検知用**に限定する（他の `UBM-5500` 経路では log しない）。
- `usedFallback` は env から見て `GOOGLE_FORM_ID === undefined && FORM_ID === undefined` の判定で、固定 fallback formId（`119ec539...nfhp7Xg`）を使った場合に `true` となる。staging で env が漏れているケースを切り分けられる。
- structured payload は `code` を最上位に置き、tail / Logpush / 後段の Worker Analytics でドリル可能にする。

## L-05A-FP503-006: helper `bindLog` で env→D1 lookup の優先順位を assert する

`createPublicD1Mock` に `bindLog?: Array<{ sql, bindings }>` を opt-in で追加し、`MockStmt.bind()` 内で SQL と bind 値を記録する。これによって use-case 内の env 解決順位（`GOOGLE_FORM_ID` → `FORM_ID` → FALLBACK）が壊れていないことを、SQL を経由した actual binding でテストできる（TC-RED-02-A / RED-02-B）。helper 拡張は既存テストへ非破壊（option 未指定時は no-op）であることを設計境界として固定する。

## L-05A-FP503-007: テスト戦略は use-case と route の二段で書く

- use-case 層 (`__tests__/get-form-preview.test.ts`): TC-RED-01（空 fields でも 200）/ RED-02-A / RED-02-B（env 優先順位）/ FAIL-01 / FAIL-02（`choice_labels_json` 不正値の fallback）/ COV-01（manifest null 経路の `logWarn` payload 厳格 assert）。
- route 層 (`routes/public/index.test.ts`): TC-RED-03（503 mapping + `Cache-Control: public, max-age=60` リーク防止）。
- 二段にする理由は「use-case は ApiError を throw する責務」「route 層は HTTP/header に翻訳する責務」を分離するため。route 層側で response shape を assert することで、success path で誤って付与されているキャッシュヘッダが 503 path にリークしないことも担保する。

## L-05A-FP503-008: runtime evidence と user approval gate の責務境界

`logWarn` 追加・テスト追加は code-side の事前準備で、staging / production の HTTP 200 evidence は次の user approval gate 後シーケンスで取る:

1. `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging` を別タブで張る。
2. staging で `curl https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview` を打ち、tail に `code:"UBM-5500"` の structured warn が出るか確認。
3. 出る場合: `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT * FROM schema_versions WHERE state='active'"` で行欠落を確認し、seed migration or sync 実行（user 明示承認後のみ）。
4. 出ない場合: 別経路（D1 binding 不整合 / fetch 経路 / Workers env）に切り替え、本タスクのスコープ外として別タスクへ分岐する判断を Issue #388 に追記する。
5. 200 evidence 取得後に `outputs/phase-11/manual-test-result.md` を確定値で更新する。

この順序を踏まずに staging に書き込んだり PR を作ると、`PENDING_RUNTIME_EVIDENCE` を PASS と誤記して compliance check が false green になる。
