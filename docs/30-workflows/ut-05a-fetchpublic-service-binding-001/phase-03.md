# Phase 3: 設計レビュー — ut-05a-fetchpublic-service-binding-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-fetchpublic-service-binding-001 |
| phase | 3 / 13 |
| wave | Wave 5 |
| mode | serial |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1-2 で確定した scope / 設計（`fetchPublic` 二経路分岐、`wrangler.toml` services 設定、Phase 11 evidence contract）が、`fetchSessionResolve` の既存 pattern、aiworkflow-requirements 不変条件、CLAUDE.md secret 管理ポリシーと整合することをレビューで担保する。

## 実行タスク

1. `apps/web/src/lib/fetch/public.ts` の二経路分岐が `fetchSessionResolve` と同一 pattern であることを diff / Read で確認する。
2. `apps/web/wrangler.toml` の `[[env.<env>.services]]` 設定が staging / production で揃い、`apps/api/wrangler.toml` の worker 名と一致していることを grep で確認する。
3. CLAUDE.md「Cloudflare 系 CLI 実行ルール」（`bash scripts/cf.sh` 強制）に整合しているか確認する。
4. `.claude/skills/aiworkflow-requirements/references/` の関連参照と矛盾がないか確認する。
5. local dev 経路（`pnpm dev` + `.dev.vars` の `PUBLIC_API_BASE_URL`）の regression check 手順が再現可能であることを確認する。

## 参照資料

- apps/web/src/lib/fetch/public.ts
- apps/web/src/lib/auth.ts (`fetchSessionResolve`)
- apps/web/wrangler.toml / apps/api/wrangler.toml
- CLAUDE.md（secret / cf.sh 規約 / 不変条件 5）
- .claude/skills/aiworkflow-requirements/references/task-workflow-active.md

## 統合テスト連携

- 上流: `task-05a-build-prerender-failure-001`（build 成功）/ ut-27 secrets / ut-28 Pages project
- 下流: Phase 11 runtime evidence と `ut-05a-followup-google-oauth-completion` verification gate にレビュー結果を渡す

## 実行手順

- レビューは grep / ls / Read 等の事実確認をもとに行い、想像で書かない。
- 仮置きパスや仮置きコマンドが残っている場合は Phase 2 に差し戻す。
- secret 値・Cloudflare account id が一切埋め込まれていないことを grep で確認する。

## レビュー観点

### ① service-binding 未注入時の fallback が確実に効くか

- `env.API_SERVICE` が `undefined` の場合に必ず `PUBLIC_API_BASE_URL` 経由の HTTP fallback が選ばれる分岐になっているか。
- `env.API_SERVICE` と `env.PUBLIC_API_BASE_URL` が両方未定義の場合に早期 throw する起動構成チェックが入っているか。

### ② header / cookie 伝搬の崩れ

- `init.headers` が service-binding 経由 / HTTP fallback 経由のどちらでも素通しになっているか。
- cookie / `x-forwarded-*` を破壊する独自ヘッダ書き換えが入っていないか。
- redaction 対象外のヘッダ（`authorization`、cookie 値）が log に残っていないか。

### ③ local dev での regression

- `pnpm dev` 起動時に `env.API_SERVICE` が注入されないことを前提に、HTTP fallback で API に到達できることが phase-02 の手順で再現できるか。
- `.dev.vars` の `PUBLIC_API_BASE_URL` 設定例が記載されているか（実値は書かない）。

### ④ session-resolve との pattern 整合

- `fetchSessionResolve` と関数 signature・分岐構造・transport ログ key が揃っているか。
- 同一 pattern を 2 箇所で重複保守しないため、共通 helper への抽出余地を Phase 8（DRY 化）に申し送るかをレビューで判断する。

### ⑤ `wrangler.toml` の env 別 services 重複定義リスク

- `[[env.staging.services]]` / `[[env.production.services]]` が一度ずつしか定義されていないか（`binding = "API_SERVICE"` の重複なし）。
- `service` 名が `apps/api/wrangler.toml` の env ごとの worker 名と一字違わぬか（`ubm-hyogo-api-staging` / `ubm-hyogo-api`）。
- top-level `[services]` と env-scoped `[[env.<env>.services]]` の混在で binding が上書きされる事故が起きていないか。

## 多角的チェック観点

- システム系: web→api 通信は service-binding 優先 / HTTP fallback の 2 経路で 1 unified contract に揃っている
- 戦略・価値系: production deploy リスクを staging 200 evidence で前倒しに取り除く目的に合致
- 問題解決系: `P11-PRD-003`（loopback subrequest 404）の真因（同一 account workers.dev への subrequest 失敗）に対処している

## サブタスク管理

- [ ] `public.ts` と `auth.ts` の pattern 一致を Read で確認
- [ ] `wrangler.toml` services 設定の env 別重複なしを grep で確認
- [ ] cf.sh 経由になっているか grep で確認
- [ ] secret 値 / account id が一切埋め込まれていないか grep で確認
- [ ] 仮置きパスが残っていないか grep で確認
- [ ] outputs/phase-03/main.md を作成する

## 成果物

- outputs/phase-03/main.md
- 差し戻しが必要な場合は outputs/phase-03/review-findings.md

## 完了条件

- 全レビュー観点（①〜⑤）で OK が確認されている
- 不整合があれば Phase 1 / 2 にフィードバックされている
- レビュー結果が Phase 4 以降の前提として明文化されている

## タスク100%実行確認

- [ ] 仮置き path / command が消えている
- [ ] secret / account id / 個人情報が含まれていない
- [ ] `fetchSessionResolve` と pattern が一致している
- [ ] `apps/api` 側 routes を変更する設計になっていない

## 次 Phase への引き渡し

Phase 4 へ、レビュー済 scope / 設計、解消した不整合一覧、共通 helper 抽出可否（Phase 8 申し送り）、残課題を渡す。
