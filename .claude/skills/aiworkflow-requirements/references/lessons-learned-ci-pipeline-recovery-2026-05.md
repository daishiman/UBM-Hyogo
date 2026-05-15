# Lessons Learned: CI pipeline recovery (web-cd / runtime-smoke / 2026-05-09)

| ID | Lesson |
| --- | --- |
| L-CIPR-001 | Next.js 16 default Turbopack は `[project]/...` 仮想 module specifier を Workers bundle に焼き込み、ローカル `next build` が green でも Cloudflare Workers runtime で起動失敗する。`apps/web` production build は `next build --webpack` を正本にし、Turbopack は local dev 限定に閉じる（commit 80ee5616）。 |
| L-CIPR-002 | `scripts/patch-next-standalone-instrumentation.mjs --verify-only` は standalone emit が無いとき exit 0 で skip すること。builder mode（webpack / Turbopack）や OpenNext build の段階で standalone 出力の有無が変動するため、verify を fail-closed にすると CI が偽陽性で停止する（commit 532d9ab5）。 |
| L-CIPR-003 | テスト path は webpack build path に整合させること。Turbopack 出力 path を前提にしたテストを残すと、builder switch 時に test だけが silent に hit せず coverage drift を生む（commit ec0556f9）。 |
| L-CIPR-004 | `wrangler-action` 経由の deploy は global esbuild バージョンとの不整合で intermittent fail を起こす。`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env <env>` を正本経路として CI / 手動運用の両方で固定し、`pnpm wrangler` / `npx wrangler` / GitHub Action の wrangler 直接呼び出しを禁止する。 |
| L-CIPR-005 | 通知 / post step は `hashFiles('<artifact>') != ''` で前提 artifact の存在を guard しないと、artifact 不在時に Slack webhook POST 等で連鎖失敗する。`runtime-smoke-staging.yml` の `if: ${{ failure() && hashFiles('ci-evidence/summary.json') != '' }}` を pattern として canonical 化した。 |
| L-CIPR-006 | GitHub Environment が作成済みでも secret が 0 件のまま smoke を起動すると `${VAR:?}` が exit 2 で job 全段を連鎖失敗させる。`bash scripts/smoke/provision-staging-secrets.sh` を canonical pre-flight にし、`gh secret list --env <env> --json name -q '.[].name'` で **name のみ** の inventory 検証を smoke 起動 gate にする。 |
| L-CIPR-007 | web-cd は backend-ci が使う `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` ではなく **environment-scoped `CLOUDFLARE_API_TOKEN`** を正本とする。理由は (a) `scripts/cf.sh` ラッパーが `CLOUDFLARE_API_TOKEN` を env 期待として固定していること、(b) 将来の OIDC cutover で web-cd 側のみ移行先 IAM 単位を分離可能にすること、(c) 1Password 正本も `CLOUDFLARE_API_TOKEN` 名で保持されており GitHub 派生コピー名と整合させるため。task-01 当時は job 冒頭の boolean 存在確認 step を置いたが、この形は L-CIPR-007A で superseded。 |
| L-CIPR-007A | Issue #640 以降、L-CIPR-007 の secret 名選択は維持するが、job 冒頭の separate verify step は superseded。`web-cd.yml` は deploy step のみ `CLOUDFLARE_API_TOKEN` を受け取り、同 step 内で存在確認してから `scripts/cf.sh deploy` を実行する。job-level env へ戻す変更は `scripts/__tests__/workflow-env-scope.test.sh` / `pnpm test:workflow-secrets` で fail させる。 |
| L-CIPR-008 | GitHub Environment secret は `gh secret set --env <env>` 投入直後に同 environment を要求する workflow run へ即反映されるが、**Environment 名と wrangler `--env` 値の文字列一致**が前提。`scripts/cf.sh deploy --env staging` と GitHub Environment `staging` が一致しないと、CI 上 secret は注入されているのにランタイムで `wrangler` が違う env section を読みに行き、`vars` / `secrets` 不一致で deploy が silent に default env へ fallback する。命名は `staging` / `production` の lowercase 一語に固定し、`apps/web/wrangler.toml` の `[env.staging]` / `[env.production]` セクション名と GitHub Environments name を完全一致させる。 |
| L-CIPR-009 | task-02 readiness gate は smoke script を書き換えず、`runtime-smoke-staging.yml` の **smoke 実行前 step に `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER` の name-only 存在確認を埋め込む**形が elegant。理由は (a) smoke business logic を変えないことで既存テスト資産を保全、(b) `${VAR:?}` の連鎖失敗より早く明示的にどの secret が欠けているかを露出、(c) skip-like false positive（早期 success exit）を生まず gate として fail-loud であること。pre-check は値ではなく `[ -n "$VAR" ]` ベースの boolean のみ stdout に出す（commit task-02）。 |
| L-CIPR-010 | 親 workflow 同期では parent doc の `implemented-local-runtime-pending` 表記時に **task-01 と task-02 の両 child を逐語列挙**する。片方だけ name すると aiworkflow-requirements quick-reference / task-workflow-active が parent claim と child evidence の boundary を失い、後続 wave が runtime evidence acquisition を片側だけ実施したと誤認する。Phase 12 strict 7 outputs は `phase-12.md` に source notes が既存していても **必ず task root の `outputs/phase-12/` 配下 7 ファイルを別途生成**し、root `artifacts.json` と `outputs/artifacts.json` を `cmp -s` PASS で固定する。 |

## 関連リソース

- workflow root: `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/`
- changelog: `.claude/skills/aiworkflow-requirements/changelog/20260509-ci-pipeline-recovery-web-cd-runtime-smoke.md`
- references: `deployment-cloudflare-opennext-workers.md` §11.1, `deployment-gha.md` (workflow lint scope / failure cascade), `deployment-secrets-management.md` (Environment secret 0 件問題)
- 関連 commits: `80ee5616`, `532d9ab5`, `ec0556f9`
- 関連 lessons-learned: `lessons-learned-web-app-route-bundle-parse-fix-2026-05.md`, `lessons-learned-issue-560-next-standalone-instrumentation-patch-2026-05.md`
