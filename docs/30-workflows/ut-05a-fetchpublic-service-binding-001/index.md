# ut-05a-fetchpublic-service-binding-001

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | Wave 5 |
| mode | serial |
| owner | - |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | https://github.com/daishiman/UBM-Hyogo/issues/387 (CLOSED, keep closed) |
| task_id | UT-05A-FETCHPUBLIC-SERVICE-BINDING-001 |

## purpose

`apps/web` の `fetchPublic` を Cloudflare Workers の **service-binding (`env.API_SERVICE.fetch(...)`)** 経路に統一する local 実装済差分を、deploy verification と evidence 取得、Phase 12 system spec 同期まで完遂し、staging / production の `/` および `/members` を 200 に戻す。session-resolve と同一 pattern に揃え、同一 Cloudflare account の workers.dev への loopback subrequest が 404 を返す問題を回避する。

## why this is not a restored old task

このタスクは過去の機能追加タスクの復活ではなく、`docs/30-workflows/unassigned-task/task-05a-fetchpublic-service-binding-001.md` で formalize された「local 実装済 fetchPublic service-binding rewrite を deploy verification + evidence 取得 + system spec 同期まで完遂する」だけを責務とする follow-up である。`ut-05a-followup-google-oauth-completion` Phase 11 Stage B-1 で発見された `P11-PRD-003`（staging `/` `/members` 500）の真因を bug-fix として閉じる。新機能追加・API 側ルーティング変更・session-resolve 経路変更は含まない。

## scope in / out

### Scope In

- `apps/web/src/lib/fetch/public.ts` の service-binding 優先 + HTTP fallback 二経路実装の仕様化（実コード差分は local 実装済）
- `apps/web/wrangler.toml` の `[[env.staging.services]]` / `[[env.production.services]]` への `binding = "API_SERVICE"` / `service = "ubm-hyogo-api-staging" / production `service = "ubm-hyogo-api"`` 設定の確認と仕様化
- staging redeploy → `curl -o /dev/null -w "%{http_code}"` による `/` `/members` 200 evidence 取得
- production redeploy 後の `/` `/members` 200 evidence 取得
- `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging` による `transport: 'service-binding'` log 取得
- local `pnpm dev` での HTTP fallback regression なし確認
- Phase 12 での system spec / `references/task-workflow-active.md` 同期

### Scope Out

- API 側のルーティング変更（apps/api 側 routes は不変）
- session-resolve（`fetchSessionResolve`）の経路変更
- 新規 UI / API 機能の追加
- Issue #387 の再オープン
- Cloudflare secret 値そのものの記録・文書化
- ユーザー明示指示なしの commit / push / PR 作成

## dependencies

### Depends On

- task-05a-build-prerender-failure-001（前提 — build 失敗解消後でないと staging redeploy できない）
- ut-27-github-secrets-variables-deployment（Cloudflare API token / account id）
- ut-28-cloudflare-pages-projects-creation 系列（staging / production deploy target）

### Blocks

- ut-05a-followup-google-oauth-completion の verification gate（本タスクの 200 evidence が公開ルート復旧の前提）

## refs

- docs/30-workflows/unassigned-task/task-05a-fetchpublic-service-binding-001.md
- https://github.com/daishiman/UBM-Hyogo/issues/387
- docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md (`P11-PRD-003`)
- apps/web/src/lib/fetch/public.ts（編集対象 — service-binding 優先 + HTTP fallback）
- apps/web/src/lib/auth.ts (`fetchSessionResolve` — service-binding pattern の参照元)
- apps/web/wrangler.toml（編集対象 — `[[env.<env>.services]]` 追加または確認）
- apps/api/wrangler.toml（service 名の一致確認）
- scripts/cf.sh / scripts/with-env.sh
- .claude/skills/aiworkflow-requirements/references/task-workflow-active.md

## AC

- AC-1: `apps/web/src/lib/fetch/public.ts` が service-binding (`env.API_SERVICE.fetch(...)`) 優先、`PUBLIC_API_BASE_URL` HTTP fallback の二経路で実装されている
- AC-2: `apps/web/wrangler.toml` の `[[env.staging.services]]` および `[[env.production.services]]` に `binding = "API_SERVICE"` / `service = "ubm-hyogo-api-staging" / production `service = "ubm-hyogo-api"`` が設定されている
- AC-3: staging redeploy 後に `curl -o /dev/null -w "%{http_code}"` で `/` と `/members` がともに 200
- AC-4: production redeploy 後も `/` `/members` が 200
- AC-5: `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging` のログに `transport: 'service-binding'` が現れる
- AC-6: local `pnpm dev` で `PUBLIC_API_BASE_URL` HTTP fallback 経由で API に到達し regression なし（`env.API_SERVICE` 未注入時のみ HTTP 経路を選ぶ分岐が機能する）

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md

`spec_created` 時点では Phase 11 runtime evidence（curl exit code / wrangler tail 抜粋）は未実行であり、`outputs/phase-11/` 配下の runtime evidence は実行後に実体化する。Phase 12 の 7 固定成果物は仕様準拠のため spec 作成段階でも実体を配置する。

## invariants touched

- 不変条件 5「D1 への直接アクセスは `apps/api` に閉じる」 — web→api 通信は HTTP loopback ではなく **service-binding 優先**で行うことを本タスクで規約化する
- session-resolve (`fetchSessionResolve`) と同一の service-binding pattern / header 構成に揃え、二系統の fetch 経路の整合を維持する
- Cloudflare CLI は `bash scripts/cf.sh` 経由で扱い、直接 `wrangler` 実行を正本手順にしない
- staging / production secret 値を stdout / artifact / log / commit / 仕様書に記録しない（存在確認のみ）
- local dev では `env.API_SERVICE` 未注入時のみ HTTP fallback を選ぶ分岐を保ち、regression を出さない
- Issue #387 は CLOSED のまま運用し、再オープンしない

## completion definition

全 phase 仕様書（phase-01〜phase-13）が揃い、Phase 11 evidence contract（curl 200 / `transport: 'service-binding'` log / local fallback regression check）と Phase 12 close-out の 7 成果物が定義され、`apps/web` redeploy 手順、production deploy gate、ユーザー承認 gate（commit / push / PR / production deploy）が明確であること。本仕様書作成では実 staging / production deploy・commit・push・PR を行わない。

## issue 連携

- Issue #387 はクローズド状態のままタスク仕様書を作成する（再オープンしない）
- spec-created 段階では Issue 状態を変更しない
- 実 staging / production deploy・PR 作成時に必要であればユーザーが明示的に指示する
