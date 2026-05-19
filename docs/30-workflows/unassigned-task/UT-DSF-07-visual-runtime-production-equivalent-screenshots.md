# UT-DSF-07: VISUAL_RUNTIME production-equivalent runtime での screenshot 再取得

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-DSF-07 |
| タスク名 | production-equivalent (Cloudflare Workers staging) での screenshot 取得 + root Gate-B/C 通過 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 3 |
| 状態 | unassigned |
| 作成日 | 2026-05-19 |
| 既存タスク組み込み | あり |
| 組み込み先 | ui-prototype-design-system-foundation root workflow Gate-B/C（`VISUAL_RUNTIME_PENDING`） |

## 目的

ui-prototype-design-system-foundation root workflow の Gate-B / Gate-C が要求する
**production-equivalent runtime での visual evidence** を確立する。UT-DSF-06（serial-07）で取得した
local Playwright baseline は dev server / mock fixture 起動の screenshot であり、
Cloudflare Workers staging（`next build --webpack` の OpenNext bundle + Workers ランタイム）
での描画と完全一致する保証がない。この差分を解消する screenshot を再取得し、root workflow の
`VISUAL_RUNTIME_PENDING` 状態を解除する。

## スコープ

### 含む

- Cloudflare Workers staging deploy（`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`）
- staging URL に対する Playwright 4 screens screenshot 取得:
  - top / public members list / public member detail / admin dashboard
- 取得した screenshot の `outputs/phase-11/` 配下への物理配置 + inventory ledger 更新
- root workflow `index.md` / `artifacts.json` の `VISUAL_RUNTIME_PENDING` 解除（→ `VISUAL_RUNTIME_OK`）
- `bash scripts/verify-pr-ready.sh` の全 green 確認（`verify:phase12-compliance` / `gate-metadata:validate` /
  `indexes:rebuild` drift の 3 段階）
- root workflow Gate-B / Gate-C の通過条件確認

### 含まない

- local Playwright baseline の取り直し（UT-DSF-06 で確立済み）
- production 環境への deploy（staging のみ）
- 新規 CI workflow の追加（既存 deploy / verify workflow の活用）
- 新規 mock fixture / seed の追加（既存 fixture を staging が解釈できる前提）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 前提 | UT-DSF-01〜06 すべて完了 | local 実装 + local baseline が green 状態 |
| 前提 | Cloudflare staging 環境（既存） | wrangler.toml の `[env.staging]` 設定済み |
| 前提 | 1Password secrets（`CLOUDFLARE_API_TOKEN` 等） | `scripts/cf.sh` 経由の `op run` 動的注入が機能 |

## 苦戦箇所・知見

**dev server vs Workers ランタイムの差分**: `next dev` と `next build --webpack` + Workers ランタイムでは
edge runtime / fetch 動作 / module resolution が異なる。OpenNext Workers が `[project]/...` 仮想 module
specifier を bundle に混入させると runtime error が出るため、build artifact の grep 確認が必要。

**`apps/web` の env アクセス不変条件**: production-equivalent runtime では `getEnv()` / `getPublicEnv()` 経由
のみ env を参照する。`process.env.*` 直接参照が残っていると Workers 環境で undefined になる。task-02
wrangler-env-injection の不変条件継承。

**localhost endpoint 焼き込み禁止 grep**: `127.0.0.1:8888` 等が `apps/web/src/` 配下に残っていると staging で
ヒットしない。UT-DSF-04 受け入れ基準と整合の二重チェック。

**Cloudflare Secrets 投入**: staging 用 secrets が `bash scripts/cf.sh secret put` で投入済みであること。
`.dev.vars.example` の `op://Vault/Item/Field` 参照と staging 実値が drift していないか確認。

**Playwright を staging URL に向ける構成**: 既存 `playwright.config.ts` は localhost dev 前提。staging URL を
`BASE_URL` env 経由で受け取り、test 内で `await page.goto(BASE_URL + '/...')` する構成にする。
visual baseline は staging artifact として別ディレクトリ管理（local baseline と混ざらない）。

**font rendering の OS 差異**: CI runner と staging Workers の font 描画は無関係（Workers は HTML を返すのみ）
だが、Playwright 実行環境（ubuntu-latest）と local 実行環境の font 差異は残る。CI artifact を staging
baseline 化する運用が安全。

**`bash scripts/verify-pr-ready.sh` の 3 段階**: `gate-metadata:validate`（artifacts.json zod schema）→
`verify:phase12-compliance`（canonical 9 headings / Phase 11 evidence 表 / workflow root scan）→
`indexes:rebuild` drift。失敗時は
`.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 を参照。

**root workflow Gate-B / Gate-C の意味**: Gate-B は spec readiness（既に通過）、Gate-C は実装完了 +
production-equivalent visual evidence 揃い。本タスク完了で root workflow を `completed-tasks` 配下に
移動する判定が立つ。

## 受け入れ基準

- [ ] Cloudflare Workers staging に最新 build が deploy 済み
- [ ] staging URL に対する Playwright 4 screens screenshot 取得済み
- [ ] screenshot が `outputs/phase-11/` 配下に物理配置 + inventory ledger と整合
- [ ] root workflow `index.md` / `artifacts.json` の `VISUAL_RUNTIME_PENDING` が解除
- [ ] `bash scripts/verify-pr-ready.sh` が exit 0
- [ ] root workflow Gate-B / Gate-C の通過条件を満たす
- [ ] `apps/web/src/` 配下で `127.0.0.1:8888` / HEX 直書き / `process.env.*` 直接参照 0 件
- [ ] OpenNext Workers bundle に `[project]/...` 仮想 module specifier 混入 0 件

## 参照

正本仕様（root workflow）:

- `docs/30-workflows/ui-prototype-design-system-foundation/index.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/artifacts.json`
- `docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/PROTOTYPE-COVERAGE.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/main.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/phase12-task-spec-compliance-check.md`

正本仕様（前段 sub-workflow Phase 1-13）:

- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/phase-01-requirements.md` 〜 `phase-13-commit-pr-draft.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-11-evidence-inventory.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-11-evidence-inventory.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/phase-11-evidence-inventory.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/phase-11-evidence-inventory.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-11-evidence-inventory.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/phase-11-evidence-inventory.md`

参考:

- `scripts/cf.sh`（Cloudflare CLI wrapper）
- `scripts/verify-pr-ready.sh`
- `apps/web/wrangler.toml`（`[env.staging]` 設定）
- `apps/web/src/lib/env.ts`（`getEnv()` / `getPublicEnv()`）
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
- CLAUDE.md「apps/web env アクセス不変条件」「Cloudflare 系 CLI 実行ルール」
