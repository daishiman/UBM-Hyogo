# issue-559-task-03-followup-001-sentry-staging-runtime-evidence

## 実装区分

- **[実装区分: 実装仕様書]** — 親 task-03 (`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`) の AC-7 / AC-4 を staging runtime で検証し、状態語彙を `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` へ昇格させる。Issue label は `area:docs` だが、実態としては「Cloudflare Secrets 投入 / staging deploy 実行 / `apps/web/src/lib/env.ts` の `SENTRY_DSN_WEB` schema 反映 / `instrumentation.ts` の DSN 解決確認 / OpenNext build artifact の grep gate 再走」を伴うため CONST_004 の例外条件には該当せず、**実装仕様書として作成する**。
- 判定根拠: 完了条件に「Cloudflare Secrets 投入」「staging deploy」「Sentry dashboard event 受信」「`.open-next/worker.js` への `requestIdleCallback` 混入 0 件再確認」が含まれ、いずれも env schema・wrangler 設定・build artifact 検証など **コード・設定変更を伴わずに目的達成不能**である。

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | task-03-followup |
| mode | sequential（G1→G2→G3→G4→G5 段階承認） |
| owner | - |
| 状態 | spec_created（実装着手前） |
| visualEvidence | NON_VISUAL（Sentry dashboard screenshot は VISUAL 補助、Phase 11 主証跡は curl log + grep log + secret list） |
| issue | #559 |
| parent_task | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md` |

## purpose

親タスク `task-03-w2-par-sentry-workers-sdk-unify` は `apps/web/src/instrumentation.ts` / `instrumentation-client.ts` / `apps/web/src/lib/sentry/capture.ts` の二重 init 排除構成を確定させ、local PASS 5 点（typecheck / lint / test / build / grep-gate）を取得済みの **`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`** 状態にある。本タスクはその runtime 側 evidence（Cloudflare Workers staging で実 DSN 解決 + Sentry dashboard で server / browser event 受信）を取得し、状態を `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` へ昇格させる。

## why this is not a restored old task

親 task-03 は Phase 11 で local PASS のみを取得した上で `RUNTIME_PENDING` を明示し、staging runtime 検証は意図的に follow-up gate として独立化した（state vocab `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` の運用ルールに従う）。本タスクは親タスクの仕様を再実装するのではなく、env schema 反映・staging secret 配置・staging deploy 実行・Sentry dashboard 観測・OpenNext build artifact grep gate の **runtime 5 点** のみを scope とする。

## scope in / out

### Scope In
- `apps/web/src/lib/env.ts` の zod schema に `SENTRY_DSN_WEB` / `SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` / `SENTRY_TRACES_SAMPLE_RATE` を `.optional()` で反映（既存実装が未反映の場合のみ追加。実装済みなら no-op verification）
- `apps/web/wrangler.toml` の `[env.staging.vars]` に `SENTRY_ENVIRONMENT = "staging"` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT = "staging"` / `SENTRY_TRACES_SAMPLE_RATE = "0.2"` を保持し、production は `0.1` を保持する（非機密のみ。DSN 実値は repository に書かない）
- `apps/web/.dev.vars.example` に `op://...` 参照のみ追記（実値禁止）
- `bash scripts/cf.sh secret put SENTRY_DSN_WEB --config apps/web/wrangler.toml --env staging` / `... --env production` 経由の secret 投入 runbook 作成（実 secret 投入は G1 承認時の人手操作）
- `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` 実行 runbook
- staging URL に対する `curl -sSf -o /dev/null -w '%{http_code}\n' https://<staging-host>/` および `/members` の 200 確認 evidence
- Sentry dashboard で `environment:staging` フィルタ下、server / browser event 各 1 件以上の受信 screenshot 取得（`outputs/phase-11/evidence/sentry-staging-server-event.png` / `sentry-staging-browser-event.png`）
- `pnpm --filter @ubm-hyogo/web build` 後の `.open-next/worker.js` への `requestIdleCallback` / `@sentry/nextjs` 推移混入 0 件再確認（grep gate log: `outputs/phase-11/evidence/grep-gate-runtime.log`）
- `apps/web/src/lib/__tests__/env.test.ts` に Sentry env parse 動作を追加するテストケース
- 状態昇格: `task-03-w2-par-sentry-workers-sdk-unify.md` 冒頭メタ「状態」を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` へ更新（Phase 12 で実施）
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` の Sentry Web staging evidence セクション更新
- multi-stage approval gate G1（secret 投入承認）/ G2（staging deploy 承認）/ G3（curl + Sentry event 観測承認）/ G4（grep gate 再走承認）/ G5（state 昇格 + commit/PR 承認）

### Scope Out
- 親 task-03 本体（instrumentation 構成）の再設計・再実装。実装は既に local PASS 取得済み前提
- production deploy（本タスクは staging runtime 検証まで。secret は production にも投入するが、production deploy 実行は別承認）
- `apps/api` 側 Sentry 統合（親タスク非ゴール継承）
- Sentry release tag 自動化 / replay 有効化 / performance monitoring 拡張
- Slack / PagerDuty / on-call ローテーション連携
- 新規 API endpoint / D1 schema 変更 / Google Form 仕様変更（CLAUDE.md 不変条件）

## dependencies

### Depends On
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md`（parent, local PASS 完了済み）
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-02-w2-par-wrangler-env-injection.md`（`apps/web/src/lib/env.ts` の `getEnv()` schema 基盤）
- `apps/web/wrangler.toml` `[env.staging]` セクション既存定義
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- 1Password 正本 DSN item（`op://UBM-Hyogo/Sentry Web DSN (staging)/dsn`, `op://UBM-Hyogo/Sentry Web DSN (production)/dsn`）

### Blocks
- task-03 の `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` 状態昇格
- ui-prototype-alignment-mvp-recovery workflow 全体の `apps/web` 観測経路 closeout
- production deploy readiness（observability gate）

## refs

- `apps/web/src/instrumentation.ts`（G0 preflight で実在確認。現 worktree で不在なら runtime evidence へ進まない）
- `apps/web/src/instrumentation-client.ts`（G0 preflight で実在確認）
- `apps/web/src/lib/sentry/capture.ts`（G0 preflight で実在確認）
- `apps/web/src/lib/env.ts`
- `apps/web/wrangler.toml`
- `apps/web/.dev.vars.example`
- `scripts/cf.sh`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

## AC

- AC-7-R1: staging URL `/` および `/members` への curl が HTTP 200 を返し、応答 log が `outputs/phase-11/evidence/curl-staging.log` に保存される
- AC-7-R2: Sentry dashboard で `environment:staging` フィルタ下、server runtime tag を持つ event が 1 件以上 staging deploy 後 30 分以内に受信される
- AC-7-R3: 同フィルタ下、browser runtime tag を持つ event が 1 件以上同期間内に受信される
- AC-7-R4: server / browser event の `release` tag が同一 deploy id を指し、二重 init ガード（`__ubmSentryInitialized__` global）に違反する init 重複が dashboard 上に存在しない
- AC-4-R1: `pnpm --filter @ubm-hyogo/web build` 後の `.open-next/worker.js` 内に `requestIdleCallback` 文字列が 0 件である（grep log evidence）
- AC-4-R2: 同 artifact 内に `@sentry/nextjs` の推移依存が含まれない（`rg '@sentry/nextjs' apps/web/.open-next/` が 0 件）
- AC-S1: secret 値（DSN URL / project numeric id）が repository / log / PR body / Sentry screenshot 上のテキストに残らない（screenshot は dashboard UI のみで DSN を露出しない構図で取得）
- AC-G: G1〜G5 全 gate の通過記録が `outputs/phase-11/main.md` に user approval timestamp 付で残る
- AC-V: `task-03-w2-par-sentry-workers-sdk-unify.md` 冒頭メタ「状態」が `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` に更新済み

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
- [phase-11.md](phase-11.md) — 手動 staging runtime evidence
- [phase-12.md](phase-12.md) — ドキュメント更新 / 状態昇格
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
- outputs/phase-11/main.md（`evidence/preflight-g0.log` / `evidence/secret-list-staging.log` / `evidence/deploy-staging.log` / `evidence/curl-staging.log` / `evidence/sentry-staging-server-event.png` / `evidence/sentry-staging-browser-event.png` / `evidence/grep-gate-runtime.log` / `evidence/dsn-leak-scan.log` を実体化）
- outputs/phase-12/main.md（`implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）
- outputs/phase-13/main.md

## invariants touched

- #2 ランタイムシークレットは Cloudflare Secrets（`SENTRY_DSN_WEB`）
- #5 `apps/web` から D1 直接アクセス禁止（Sentry breadcrumb / context に SQL を含めない）
- #14 secret 値を docs / logs に残さない（DSN URL / project numeric id 漏洩禁止）
- #17 incident response readiness（Sentry runtime 受信が成立しないと P1/P2 検知が手動ログに偏る）
- INV: staging と production の secret / event を環境ラベルで完全分離

## completion definition

全 phase 仕様書、env schema 反映方針、wrangler.toml 変更方針、secret 投入 / staging deploy runbook、curl + Sentry dashboard observation 手順、grep gate 再走手順、state 昇格手順、G1〜G5 approval gate、PR 作成手順が確定すること。本仕様書作成サイクルで commit / push / PR / 実 secret 投入 / 実 staging deploy / 実 Sentry dashboard 観測は実行しない（後続実行サイクルで G1〜G5 を順次通過させる）。
