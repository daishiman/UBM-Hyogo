# Lessons Learned — Issue #331 CI/CD Runtime Warning Cleanup（2026-05-09）

> task: `issue-331-cicd-runtime-warning-cleanup`
> 関連 spec: `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/phase-{01..13}.md`、`docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/`
> 関連 source: `apps/api/wrangler.toml`、`.github/workflows/web-cd.yml`、`apps/web/wrangler.toml`、`scripts/cf.sh`
> 関連 reference: `references/deployment-gha.md`、`references/deployment-core.md`、`references/deployment-cloudflare.md`、`references/deployment-secrets-management.md`、`references/deployment-branch-strategy.md`、`references/environment-variables.md`、`references/workflow-issue-331-cicd-runtime-warning-cleanup-artifact-inventory.md`

## 教訓一覧

### L-331-001: wrangler `[vars]` は env-scoped block に集約。top-level と併記すると runtime warning の温床になる

- **背景**: `apps/api/wrangler.toml` に top-level `[vars]` と `[env.production.vars]` / `[env.staging.vars]` の両方が存在し、Cloudflare Wrangler が「top-level vars は env-scoped block に inherit しない」旨の runtime warning を出していた。production と staging のどちらが正本か判別困難で、warning を CI 上でゼロ化できなかった。
- **教訓**: Wrangler の env vars 正本は **必ず env-scoped block (`[env.<name>.vars]`) のみ** とし、top-level `[vars]` は使わない。bindings / triggers は env-scoped に inherit される設計のため top-level に残してよいが、vars だけは別扱い。仕様確認時は Cloudflare 公式の inheritance behavior を `references/environment-variables.md` の正本側で固定し、`top-level vars / per-env vars` の二重正本化を防ぐ。
- **将来アクション**: `apps/*/wrangler.toml` 追加時は task-spec の Phase-2 設計に「env-scoped vars only」AC を入れる。`scripts/cf.sh` ラッパー側で `dry-run` 時に `[vars]` top-level grep gate を入れ、再発を repo-local で検出する option を検討。

### L-331-002: アプリの形（OpenNext Workers）と deploy target（Pages）の drift は ADR + cutover task の二段で運用する

- **背景**: `apps/web/wrangler.toml` は既に OpenNext Workers 形式だったが、`.github/workflows/web-cd.yml` は `cloudflare/wrangler-action@v3` で Pages deploy していた。コードと CI が乖離し、warning + deploy 経路の二重保守を生んでいた。
- **教訓**: deploy target の選択は ADR で確定 → unassigned-task で実 cutover を起票 → 個別 issue（#331 / #355 / #419）で repo-side / Cloudflare-side / dormant retirement を**分離**して実装する。一度に全部やろうとすると user-gated 操作（Cloudflare CLI mutation / Pages project 削除 / GitHub secret 切替）が implementation cycle を block する。Issue #331 は repo-side cutover のみに scope を絞り、Cloudflare 側 retirement は Issue #419 へ委譲した。
- **将来アクション**: `task-specification-creator` の deploy target 切替系 task template に「repo-side / runtime-side / retirement-side」3 段の scope 分離を必須化し、`completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/` ADR を起点に supersede 関係を artifact inventory に明示する。

### L-331-003: Cloudflare CLI 直接呼び出し禁止 — `scripts/cf.sh` を CI / local 双方の単一入口にする

- **背景**: `web-cd.yml` の旧実装は `cloudflare/wrangler-action@v3` を使い、ローカル運用 (`scripts/cf.sh`) と CI 運用で deploy 入口が乖離していた。1Password 経由 token 注入、esbuild host/binary 不整合、`mise exec` 経由 Node 24 保証も CI では揃わなかった。
- **教訓**: CI step は `pnpm --filter @ubm-hyogo/web build:cloudflare` で OpenNext bundle を作った後、**`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env <env>`** を使う。`wrangler` 直叩きや `cloudflare/wrangler-action` を CI に残すと、ローカルとの再現性 / token hygiene / esbuild pin が破れる。Cloudflare 系操作は `scripts/cf.sh` の 1 ラッパーに集約することで、CLAUDE.md の「Cloudflare 系 CLI 実行ルール」と CI の deploy 経路を同一化できる。
- **将来アクション**: 新規 `.github/workflows/*.yml` で Cloudflare CLI を直接呼ぶ step を追加してはならない。CI step テンプレを `references/deployment-gha.md` に Workers deploy 経路として正本化し、PR review checklist に「`scripts/cf.sh` 経由か」を入れる。

### L-331-004: CLOSED issue の cleanup PR は `Refs #<n>`、`Closes` / 再オープン禁止

- **背景**: Issue #331 は既に CLOSED 状態だったが、warning が runtime に残っていたため cleanup spec を起票した。PR description に `Closes #331` を書くと issue が誤再オープンされ、後続 follow-up workstream（Issue #419 dormant retirement 等）の supersede 関係が壊れる懸念があった。
- **教訓**: CLOSED issue の派生実装は **`Refs #<issue>` のみ**を使い、`Closes` / `Fixes` / `Resolves` keyword は禁止する。supersede 関係は workflow の artifact inventory + skill changelog 側で記述し、GitHub issue state を二度開閉しない。
- **将来アクション**: `.claude/skills/aiworkflow-requirements/references/task-workflow-rules.md` に「CLOSED issue cleanup は `Refs` only」ルールを明記し、PR template の checklist に追加する。

### L-331-005: NON_VISUAL task の close-out は local-static PASS と runtime evidence を別 enum で扱う

- **背景**: Phase 12 close-out 時、`pnpm typecheck` / `validate-phase-output` / `verify-all-specs` / `static grep "pages deploy"` は repo-local で PASS したが、`gh workflow run web-cd.yml` の runtime warning-zero log と production deploy 成功 log は user approval 待ちで取得できなかった。両方を「PASS」とまとめると誤解を生む。
- **教訓**: Phase 12 main.md の状態文字列は `implemented-local / NON_VISUAL / local-static PASS / runtime evidence pending_user_approval` のように **local-static PASS と runtime evidence を独立に明示**する。AC-2 / AC-5 / AC-6 など runtime gate に依存する条件は、Phase 13 の user-approval 後の証跡取得まで「PASS」と書かない。
- **将来アクション**: `task-specification-creator` の Phase 12 状態文字列 vocab に `local-static PASS` / `runtime evidence pending_user_approval` を正式追加し、Phase 12 strict 7 outputs の compliance check rubric に「runtime gate を Phase 13 に委譲明示」項目を入れる。

## 適用範囲

- 本 lessons は wrangler 設定変更 / CI deploy step 変更 / Cloudflare deploy target 切替を含む全 task に適用する。
- L-331-001 / L-331-003 は API / Web 両アプリの Wrangler 系 task に共通。
- L-331-004 は CLOSED issue 派生 cleanup spec 全般に適用。
- L-331-005 は NON_VISUAL task で runtime evidence が user-gated になる全 task に適用。

## 追跡 / 未解放事項

| 項目 | 接続先 | 状態 |
| --- | --- | --- |
| `gh workflow run web-cd.yml --ref dev` の runtime warning-zero log | Phase 13 user approval 後 | pending |
| Cloudflare Pages project 物理削除 + custom domain detach | Issue #419 dormant retirement workstream | scope 外 |
| OIDC / step-scoped `CF_TOKEN_*` cutover | 既存 token-split workstream | scope 外 |
| `CLOUDFLARE_PAGES_PROJECT` GitHub variable 削除 | Issue #419 dormant cleanup | pending |

## 参考リンク

- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-331-cicd-runtime-warning-cleanup-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260509-issue331-cicd-runtime-warning-cleanup.md`
- `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`
