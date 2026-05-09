# Phase 13: PR 作成

## 目的

ユーザー承認後に PR を `dev` 宛に作成する。本タスクは独立 issue 番号を持たないため、PR 本文には該当 issue リンクを付けず、根因と再発防止のみを記載する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | blocked_pending_user_approval |

## 多段ゲート（NON_VISUAL の二重承認）

| Gate | 内容 | 承認方法 |
| --- | --- | --- |
| G1 | spec 完了（Phase 1〜10 + 仕様書）と local pre-flight evidence | ユーザー明示 OK |
| G2 | staging deploy + smoke 5.2 + tail grep 5.3 PASS | ユーザー明示 OK |
| G3 | production deploy + smoke 5.4 PASS | ユーザー明示 OK |
| G4 | commit / push / PR open 承認 | ユーザー明示 OK |

各 Gate を独立に承認させる。合算承認は禁止。

## PR 構成

| 項目 | 値 |
| --- | --- |
| Title | `fix(apps/web): switch next build to webpack to fix App Route Handler bundle parse error` |
| Base | `dev` |
| Head | `fix/web-app-route-bundle-parse-fix` |

### PR 本文（テンプレ）

```md
## Summary

- Switch `apps/web` build from Turbopack (Next 16 default) to webpack via `--webpack` flag
- Fix `Could not parse module '[project]/...app-router-context.js'` 500 on `/api/auth/error` and other App Route Handlers
- Server Component pages (`/`, `/members`, `/login`, `/register`) remain 200 (no regression)

## Why

Next.js 16 default Turbopack emits `[project]/...` virtual module specifiers in App Route Handler bundles. `@opennextjs/cloudflare` 1.19.4 cannot resolve these to real files at Worker bundle stage, so handlers fail with `Could not parse module` at request time. webpack output uses real paths (`node_modules/next/dist/...`), which OpenNext can resolve.

## Test plan

- [x] `pnpm --filter @ubm-hyogo/web typecheck` exit 0
- [x] `pnpm --filter @ubm-hyogo/web lint` exit 0
- [x] `pnpm --filter @ubm-hyogo/web build:cloudflare` exit 0, `.open-next/worker.js` generated
- [ ] staging deploy + smoke (5 URL) returns expected status (pending user gate G2)
- [ ] staging tail: `grep -c "Could not parse module" tail.log` = 0 (pending user gate G2)
- [ ] production deploy + smoke same as staging (pending user gate G3)

## Rollback

`bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/web/wrangler.toml --env <ENV>`
- staging prev: `efc4051e-160b-4c77-93ca-6a5751e952f3`
- production prev: `e608d54e-37a8-414d-865c-798ebfd71735`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## blocked 条件

- G1〜G3 のいずれかが未承認 → Phase 13 blocked
- staging または production smoke fail → Phase 8 / Phase 1 へ戻る

## 完了条件

- [ ] G1〜G4 すべてユーザー承認済み
- [ ] PR が `dev` base で open され URL が記録されている
- [ ] CI（required status checks）すべて green

## 出力

- `phase-13.md`（本仕様）
- 実装サイクルで PR URL を `outputs/phase-13/pr.md` 等に記録予定

## 参照資料

- `outputs/phase-04/task-01-switch-next-build-to-webpack.md` §10
- `CLAUDE.md` §「PR作成の完全自律フロー」
