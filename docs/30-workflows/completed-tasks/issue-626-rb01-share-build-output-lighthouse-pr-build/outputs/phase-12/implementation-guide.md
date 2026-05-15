# Implementation Guide

## Part 1: 中学生レベル

同じ料理を、別々の人が同じ日に 2 回作っていると、時間も材料ももったいなくなります。今回の作業は、先に作った料理を箱に入れて、次の人がその箱から取り出して使えるようにする整理です。

なぜ必要かというと、今の CI では PR build と Lighthouse が似た build を別々に行い、待ち時間が増えるからです。何をするかというと、PR build が作った `.next` を artifact という「保存箱」に入れ、Lighthouse job がそれを取り出して画面検査に使います。

| 専門用語 | 日常語の言い換え |
| --- | --- |
| CI | 自動で確認してくれる係 |
| build | 動かせる形に作る作業 |
| artifact | 作ったものを一時的に入れる箱 |
| job | 自動確認の担当者 |
| Lighthouse | 画面の速さや品質を測る道具 |
| branch protection | 大事な入口の通行ルール |

## Part 2: 技術者レベル

`pr-build-test.yml` に `lighthouse-ci` job を追加し、`needs: build-test` で順序保証する。`build-test` は `apps/web/.next` を `next-build-${{ github.sha }}` として upload し、`lighthouse-ci` は同名 artifact を `apps/web/.next` に download して `pnpm --filter @ubm-hyogo/web start` と `lhci autorun` を実行する。

```yaml
lighthouse-ci:
  name: lighthouse-ci
  if: github.base_ref == 'dev'
  needs: build-test
```

Parameters:

| Name | Value |
| --- | --- |
| build artifact | `next-build-${{ github.sha }}` |
| report artifact | `lhci-report-${{ github.sha }}` |
| build retention | 1 day |
| report retention | 7 days |
| trust boundary | `pull_request`, `permissions: {}`, no secrets |

Errors and edge cases: artifact download failure blocks `lighthouse-ci`; branch protection contexts must retain current required context `lighthouse-ci`, while `build-test` remains the `needs` dependency; standalone `.github/workflows/lighthouse.yml` must not remain after integration.

## Part 3: 実装結果 (2026-05-12)

### 変更ファイル

| 種別 | パス | 内容 |
| --- | --- | --- |
| 編集 | `.github/workflows/pr-build-test.yml` | `concurrency` + 標準 `Build` 直後の `Upload Next.js build output` step + `lighthouse-ci` job 追加 |
| 削除 | `.github/workflows/lighthouse.yml` | 機能を `pr-build-test.yml` に統合 |
| 編集 | `docs/30-workflows/e2e-quality-uplift/backlog.md` | RB-01 `Status` を `implemented-local-runtime-pending`、Notes に統合先 workflow と runtime pending 境界を明記 |

### SHA pin（採用値）

| action | pinned SHA | tag |
| --- | --- | --- |
| `actions/checkout` | `b4ffde65f46336ab88eb53be808477a3936bae11` | v4（pr-build-test.yml 既存値再利用） |
| `jdx/mise-action` | `5083fe46898c414b2475087cc79da59e7da859e8` | v2（pr-build-test.yml 既存値再利用） |
| `actions/upload-artifact` | `ea165f8d65b6e75b540449e92b4886f43607fa02` | v4.6.2（UT-GOV-007 適用、リポジトリで未 pin だったため公式 release から採用） |
| `actions/download-artifact` | `d3f86a106a0bac45b974a628896c90dbdf5c8093` | v4.1.8（同上） |

### ローカル検証結果（Phase 6）

| 検証項目 | コマンド | 結果 |
| --- | --- | --- |
| actionlint | `/tmp/actionlint .github/workflows/pr-build-test.yml` | exit 0、warning 0 件 |
| typecheck | `mise exec -- pnpm typecheck` | 全 5 workspace project PASS |
| lint | `mise exec -- pnpm lint` | 全 workspace PASS |
| patch script regression | `mise exec -- node --test scripts/__tests__/patch-next-standalone-instrumentation.test.mjs` | 9 / 9 PASS |
| Next.js build | `mise exec -- bash -c 'NODE_ENV=production pnpm --filter @ubm-hyogo/web build'` | exit 0、`apps/web/.next/` 生成 |
| secret grep | `grep -rE "(CLOUDFLARE_API_TOKEN\|AUTH_SECRET\|GITHUB_TOKEN\|SENTRY_AUTH_TOKEN)" apps/web/.next/ --exclude-dir=cache --exclude-dir=standalone` | 9 ファイルで token 名出現。すべて `process.env.*` の code symbol 参照であり secret VALUE の embedding は無いことを確認（`outputs/phase-11/evidence/next-secret-grep.txt`） |
| `lighthouse.yml` 削除 | `test ! -f .github/workflows/lighthouse.yml` | ok |

### Evidence 保管場所

- `outputs/phase-11/evidence/actionlint.log`
- `outputs/phase-11/evidence/typecheck.log`
- `outputs/phase-11/evidence/lint.log`
- `outputs/phase-11/evidence/patch-regression.log`
- `outputs/phase-11/evidence/next-secret-grep.txt`
- `outputs/phase-11/evidence/lighthouse-yml-removed.txt`

`outputs/phase-11/evidence/dry-run-pr-checks.txt` および `outputs/phase-11/evidence/dry-run-lighthouse-ci-log.txt`（PR 上の `build-test` → `lighthouse-ci` 実行ログ）、merge 後の branch protection before/after diff は PR 作成後のランタイム evidence であり、本タスクのローカル実装サイクルでは未取得。state は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。PR runtime 評価と Phase 13 close-out 後に `completed` に進める。

### 不変条件の維持確認

- `name: build-test` / `name: lighthouse-ci`: 維持（`lighthouse-ci` は current required context、`build-test` は dependency）
- `permissions: {}` workflow default: 維持
- `persist-credentials: false`: 維持
- `secrets` 注入: 無し
- `mise exec --` 経由実行: 維持
- 既存 `build` step / `build:cloudflare` step / `verify-web-instrumentation-patch` step: 維持

### CLOSED Issue Reference Rule

Issue #626 は CLOSED（2026-05-12T04:19:14Z）のため、PR / commit には `Closes` / `Fixes` / `Resolves` を使わず `Refs #626, #608` を使う。
