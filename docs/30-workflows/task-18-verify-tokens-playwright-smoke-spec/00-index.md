[実装区分: インデックス（実装仕様書群への入口）]

# task-18 verify-tokens & playwright-smoke 仕様インデックス

> 正本順位:
> 1. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/08-regression/task-18-w7-solo-verify-tokens-and-playwright-smoke.md`（元仕様）
> 2. 本 spec ディレクトリの phase-01..13 ファイル群
> 3. `docs/00-getting-started-manual/specs/09b-design-tokens.md`（token 値の SSOT）
> 4. `apps/web/src/styles/tokens.css` / `apps/web/src/styles/globals.css`（@theme inline bridge）

本ワークフローは `ui-prototype-alignment-mvp-recovery` の最終 wave（wave-final）を Phase 1-13 に分解した実装仕様書群である。task-02..17 の全成果物に対する CI gate 確立を目的とする。

---

## DAG 座標

| 属性 | 値 |
|------|----|
| Task ID | `task-18-verify-tokens-and-playwright-smoke` |
| Wave | wave-final |
| 依存 (前) | task-02 〜 task-17（全タスク） |
| 依存 (後) | なし（MVP 回帰防止 gate の最終地点） |
| 並列実行 | 不可 |
| 想定工数 | 0.75〜1.0 人日 |
| ブランチ命名 | `feat/ui-mvp-task-18-regression-gate` |

---

## 13 Phase 一覧

| Phase | タイトル | 目的 | 依存 | 仕様ファイル |
|-------|---------|------|------|------------|
| 1 | コンテキスト確定 / DAG 確認 | 上位ゴール・上流 export・19 routes 一覧の固定 | — | （元仕様 §0） |
| 2 | ゴール / 非ゴール宣言 | G1〜G4 と非ゴールの境界線確定 | 1 | （元仕様 §2） |
| 3 | 変更対象ファイル表 | §3 ファイル表の写経・新規/編集/参照のみ区分 | 2 | （元仕様 §3） |
| 4 | テスト戦略 | verify / smoke / visual / branch-protection drift の検証行列 | 3 | `phase-04-test-strategy.md` |
| 5 | verify-design-tokens 実装 | 現行 `apps/web` token test と root script gate の整備 | 4 | `phase-05-impl-verify-design-tokens.md` |
| 6 | Smoke spec / fixture 実装方針 | 現行 `apps/web/playwright/tests` 配下で 19 routes の ROUTES[] と auth fixture | 5 | `phase-06-impl-playwright-smoke.md` |
| 7 | Visual baseline 4 画面実装方針 | login / public-top / admin-dashboard / profile | 6 | `phase-07-impl-visual-baseline.md` |
| 8 | CI workflow 2 本作成 | required check として常時 check を生成する `verify-design-tokens.yml` / `playwright-smoke.yml` | 4, 7 | `phase-08-impl-ci-workflows.md` |
| 9 | ローカル検証実行 | typecheck/lint/verify:tokens/vitest/e2e:smoke/e2e:visual の順次実行 | 8 | `phase-09-local-verification.md` |
| 10 | Required status checks 設定 | branch protection contexts 3 本追加（user-gated） | 9 | `phase-10-required-status-checks.md` |
| 11 | Evidence 収集 | `outputs/phase-11/` への evidence/screenshot 配置 | 10 | `phase-11-evidence.md` |
| 12 | ドキュメント更新 | 必須 6 タスク・7 ファイル / aiworkflow-requirements 同時更新 | 11 | `phase-12-documentation.md` |
| 13 | PR 作成 | `dev` 向け PR・completed-tasks 移動規律 | 12 | `phase-13-pr-creation.md` |

> Phase 1〜13 の詳細正本は本 spec ディレクトリの各 Phase ファイルである。元仕様書は背景入力として参照するが、現行 repo topology（`apps/web/playwright/`、Markdown index、route group を含まない URL）と矛盾する場合は本 spec を優先する。

---

## 不変条件（Phase 全体共通）

1. `apps/api/` の本番コードに触れない
2. `apps/web/src/styles/tokens.css` と `apps/web/src/styles/globals.css` の `@theme inline` bridge は本タスクで値変更しない（drift 検知対象）
3. `09b-design-tokens.md` §9 JSON を token value SSOT とする
4. 既存 Playwright project（`desktop-chromium` / `firefox` / `mobile-webkit`）は温存・追加のみ
5. solo dev ポリシー（`required_pull_request_reviews=null`）の前提を崩さず、品質保証は `required_status_checks` に追加するのみ
6. `.env` に実値を書かない。`E2E_*_SESSION_TOKEN` は GitHub Secrets / 1Password 参照のみ
7. visual baseline は ubuntu-latest（CI と同一 OS）で採取
8. token 抽出は 09b §9 JSON / `tokens.css` / `globals.css @theme inline` の 3 系統を対象とする

---

## 対象 routes 一覧（19 routes / phase-1.md §2.2 より）

| # | 層 | route | auth | landmark |
|---|----|-------|------|---------|
| 1 | 公開 | `/` | unauth OK | `main h1` / `[data-testid="public-hero"]` |
| 2 | 公開 | `/members` | unauth OK | `main h1` / `[data-testid="member-grid"]` |
| 3 | 公開 | `/members/sample-001` | unauth OK | `main h1` |
| 4 | 公開 | `/register` | unauth OK | `main h1` |
| 5 | 公開 | `/privacy` | unauth OK | `main h1` |
| 6 | 公開 | `/terms` | unauth OK | `main h1` |
| 7 | 会員 | `/login` | unauth OK | `form[data-testid="login-form"]` |
| 8 | 会員 | `/login?state=sent` | unauth OK | `[data-testid="login-state-sent"]` |
| 9 | 会員 | `/login?state=unregistered` | unauth OK | `[data-testid="login-state-unregistered"]` |
| 10 | 会員 | `/profile` | auth required | `main h1` |
| 11 | 管理 | `/admin` | admin required | `[data-testid="admin-dashboard"]` |
| 12 | 管理 | `/admin/members` | admin required | `[data-testid="admin-members-table"]` |
| 13 | 管理 | `/admin/tags` | admin required | `[data-testid="admin-tags"]` |
| 14 | 管理 | `/admin/meetings` | admin required | `[data-testid="admin-meetings"]` |
| 15 | 管理 | `/admin/schema` | admin required | `[data-testid="admin-schema"]` |
| 16 | 管理 | `/admin/requests` | admin required | `[data-testid="admin-requests"]` |
| 17 | 管理 | `/admin/identity-conflicts` | admin required | `[data-testid="admin-id-conflicts"]` |
| 18 | 管理 | `/admin/audit` | admin required | `[data-testid="admin-audit"]` |
| 19 | 共通 | `/__not_found_canary` | unauth OK | `[data-testid="not-found"]` |

---

## Required Status Checks（3 本）

`required_status_checks.contexts` に登録する文字列:

1. `verify-design-tokens / verify-design-tokens`
2. `playwright-smoke / smoke (chromium)`
3. `playwright-smoke / visual (chromium, 4 screens)`

設定確認（read-only）:

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection | jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  | jq '.required_status_checks.contexts'
```

mutation（`gh api -X PUT`）は **user 承認後のみ**。Claude Code から unilateral 実行禁止。詳細は `phase-10-required-status-checks.md`。

---

## VISUAL_ON_EXECUTION 区分の運用

本ワークフローの最終アウトカムは Playwright visual baseline 4 png を含むため、PR 状態判定は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を起点とし、runtime（CI 上の actual run）が green になった時点で `PASS` に昇格する。詳細は `phase-11-evidence.md`。
