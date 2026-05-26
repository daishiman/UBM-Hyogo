---
workflow_id: issue-901-authenticated-profile-admin-staging-visual
workflow_state: spec_created
created_at: 2026-05-25
owner: daishiman
taskType: implementation
visualEvidence: VISUAL
implementation_mode: new
source_issue: 901
source_issue_state: closed
issue_reference_mode: refs_only
recovered_from_unassigned: docs/30-workflows/completed-tasks/UT-DSF-07-FU-01-authenticated-profile-admin-staging-visual.md
parent_workflow: ut-dsf-07-staging-visual-runtime-evidence
parent_gate: VISUAL_RUNTIME_AUTHENTICATED_PENDING
spec_creation_strategy: optimize_to_current_codebase
---

# issue-901 — 認証後 profile / admin staging-visual baseline 取得

[実装区分: 実装仕様書]

## 0. 本仕様書の位置づけと issue 最適化判定

本ワークフローは GitHub issue [#901](https://github.com/daishiman/UBM-Hyogo/issues/901)（`[UT-DSF-07-FU-01]`, state: **CLOSED** at 2026-05-25T03:59:29Z）を、**closed-issue-canonical-workflow-recovery** パターンに従い、CLOSED のまま canonical workflow root を後付け生成する実装仕様書である。issue は再 open しない。PR は `Refs #901` のみ（`Closes #901` 禁止）。

### 0.1 調査結論: 本タスクは依然として必要（コード未解決）

| 確認軸 | 状態 | 根拠 |
|--------|------|------|
| `apps/web/playwright/tests/visual-staging/profile.spec.ts` の test 名 | `'staging profile (unauthenticated guard) baseline'` (L7) | **未認証 guard 画面のみ** が baseline。認証後 profile 本文は未撮影 |
| `apps/web/playwright/tests/visual-staging/admin-dashboard.spec.ts` の test 名 | `'staging admin dashboard (unauthenticated guard) baseline'` (L7) | **未認証 guard 画面のみ** が baseline。admin dashboard 本文は未撮影 |
| 認証後 staging-visual spec / project の存在 | ❌ 不在 | `apps/web/playwright/tests/visual-staging-authenticated/` 配下に spec 0 件 / `playwright.config.ts` に `staging-visual-authenticated` project 定義無し |
| storageState 事前生成 CLI | ❌ 不在 | `apps/web/playwright/scripts/mint-staging-storage-state.ts` 不在。reference 実装として `apps/web/scripts/lhci-auth-storage.ts` および `scripts/smoke/mint-staging-bearers.mts` が存在し、再利用可能 |
| 他タスクでの解決 | ❌ なし | `docs/30-workflows/**` を全文 grep しても認証後 profile/admin staging visual を扱う canonical workflow 0 件（unassigned proto-spec のみ） |
| 親 workflow gate | `VISUAL_RUNTIME_AUTHENTICATED_PENDING` 相当 | `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/phase-09-risks.md` §5 / `phase-13-commit-pr-draft.md` §7 にて「認証後 profile/admin の staging visual を別タスク化」と明記 |

結論: コード上未解決。本仕様書を canonical workflow root として後付け生成し、proto-spec を consumed 化する。

### 0.2 issue 原文からの最適化（current codebase 一次根拠化）

#### 実装済み判定表

| 確認対象 | 現コードベース実態 | 結論 |
|---|---|---|
| 未認証 guard staging visual (profile / admin) | UT-DSF-07 にて baseline PNG 確立済 (`*-staging-visual-chromium-linux.png`) | 実装済み（取り直し禁止） |
| 認証後 staging visual (profile / admin) | spec 0 件・PNG 0 件 | **未実装**（本タスクで補完） |
| storageState 注入インフラ (Playwright) | `staging-visual` project あり (`playwright.config.ts:241-249`) / `staging-visual-authenticated` project 無し | **派生 project 追加必要** |
| session JWT mint 基盤 | `@ubm-hyogo/shared` `signSessionJwt` / `verifySessionJwt`、`scripts/smoke/mint-staging-bearers.mts` (TTL=600s pattern)、`scripts/smoke/runtime-admin-web.sh`（`STAGING_ADMIN_SESSION_COOKIE` 読込）、PR #923 (issue-864) の admin runtime smoke CI gate | **再利用可能**（新規 mint ロジック不要・既存 helper を CLI 化） |
| 認証要件（member / admin） | spec 13-mvp-auth §「MVP ログイン条件」+ §「MVP session JWT 構造」 | member: `responseEmail` 登録 + `rulesConsent="consented"` + `isDeleted=false` / admin: `admin_users.active=true` (`isAdmin` claim) |

#### 最新コードへの最適化表

| 観点 | proto-spec 想定 | 現コード実態 | 採る方針 |
|---|---|---|---|
| 認証 session 確立方式 | (a) storageState 事前生成 / (b) Magic Link or OAuth | (a) は既存 `signSessionJwt` 再利用で実装可・(b) は CI 自動化困難 | **(a) を採用**。Playwright dedicated setup project で `signSessionJwt` mint → `authjs.session-token` cookie を含む storageState JSON 生成 |
| Playwright project 構成 | 既存 `staging-visual` を拡張 or 派生 | 既存 `staging-visual` は未認証前提（baseline 衝突回避必要） | **派生 project `staging-visual-authenticated` を新設**。`use.storageState` で member / admin を分離 |
| baseline PNG 命名 | 未指定 | 既存 `*-staging-visual-chromium-linux.png` と衝突回避要 | `*-authenticated-staging-visual-chromium-linux.png` で分離 |
| storageState git コミット | マスキング方針を Phase 7/9 で確定 | cookie 値を含むため漏洩リスク | **git コミット禁止**（`.gitignore` 追記）。CI 内で ephemeral 生成 → 消費 → 破棄 |
| TTL | proto-spec 想定なし（JWT 24h 想定で flake リスク） | `mint-staging-bearers.mts` は TTL=600s | **TTL=600s に統一**（runtime smoke 既存規約と整合 / freshness gate と整合） |
| 認証後画面 assert | guard でないこと | proto-spec 受け入れ基準で必須 | `expect(locator).toBeVisible()` を `toHaveScreenshot` 前に必須配置 |

`metadata.spec_creation_strategy = "optimize_to_current_codebase"` を `artifacts.json` に記録。

### 0.3 根本問題と本仕様の解法

1. **Cloudflare Workers SSR fetch は Playwright `page.route()` で intercept 不可**（親 UT-DSF-07 §0.3 で確立済）。よって認証後 runtime visual には **実 session cookie** が必須。
2. **Magic Link / OAuth は CI 自動化困難**。`signSessionJwt` で **session JWT を直接 mint** し `authjs.session-token` cookie として storageState に注入する方式が唯一の現実解。
3. **cookie 値の evidence 混入禁止**（spec 13-mvp-auth § 固定ルール / CLAUDE.md シークレット管理）。storageState JSON / screenshot / log に cookie 値を残さない。grep gate で 0 hit を強制。

## 1. 目的

UT-DSF-07 で「未認証 guard 画面の design system shell」までしか担保できていない staging visual runtime coverage を、**認証後 profile（member session） / 認証後 admin dashboard（admin session）** の実画面 baseline 取得まで拡張する。これにより親 workflow の `VISUAL_RUNTIME_AUTHENTICATED_PENDING` を `VISUAL_RUNTIME_AUTHENTICATED_OK` へ解除可能な evidence を整える。

## 2. スコープ

| 含む | 含まない |
|---|---|
| `signSessionJwt` を再利用した storageState 事前生成 CLI (`apps/web/playwright/scripts/mint-staging-storage-state.ts`) | 新規 API endpoint 追加・D1 schema 変更・Google Form 仕様変更 |
| Playwright `staging-visual-authenticated` project の追加（`playwright.config.ts`） | production 環境への deploy |
| 認証後 profile spec (`profile-authenticated.spec.ts`) + 認証後 admin dashboard spec (`admin-dashboard-authenticated.spec.ts`) | UT-DSF-07 既存 `*unauthenticated guard*` spec / PNG の取り直し |
| baseline PNG `*-authenticated-staging-visual-chromium-linux.png` の取得 | local visual baseline の取り直し（UT-DSF-06 確立済） |
| `apps/web/.gitignore` への storageState 出力除外追記 | Magic Link / Google OAuth フロー自体の E2E 検証 |
| CI workflow への authenticated job 追加 (`.github/workflows/playwright-staging-visual-authenticated.yml` または既存拡張) | 認証後画面の API データ内容の正しさ検証（既存 E2E / API テストの責務） |
| `outputs/phase-11/` への evidence 物理配置 + inventory ledger + storageState 生成手順ドキュメント | 新規 fixture / seed の追加（既存 staging seed 利用） |
| proto-spec の `status: consumed` 化（recovery §3） | issue #901 の reopen / `Closes #901` |
| 親 UT-DSF-07 への cross-ref 追記（R-03 / §5 / §7 解消記録） | parent workflow の Phase 1-13 の再生成 |

## 3. 不変条件（CLAUDE.md / parent workflow 継承）

1. 既存 API endpoint surface のみ接続。新規 endpoint / D1 schema 変更 / Google Form 仕様変更 0 件。
2. OKLch トークン正本化。HEX 直書き禁止（`verify-design-tokens` gate）。
3. `apps/web` の env 参照は `getEnv()` / `getPublicEnv()` / `getAuthEnv()` 経由のみ。`process.env.*` 直接参照禁止。
4. `apps/web/src/` 配下に `127.0.0.1` 等のローカル限定 endpoint を焼き込まない（Playwright 配下は例外スコープ・staging Worker host のみ参照）。
5. Cloudflare CLI は `scripts/cf.sh` 経由のみ。`wrangler` 直接実行禁止。
6. 新規 test ファイルは `*.spec.ts` のみ。
7. cookie 値 / token 値 / secret 値を evidence / log / 仕様書本文に書かない（env 名のみ参照可）。
8. storageState JSON を git にコミットしない（`.gitignore` 強制）。
9. CONST_007: 1 サイクル完結スコープ。先送り Phase 無し。

## 4. CONST_007 適合宣言

本ワークフローの全 Phase は、後続の実装プロンプト（`03.実装.md`）の **1 サイクル内で完了**できるスコープに収めている。先送り前提の Phase / 別 PR 切り出しは存在しない。storageState mint CLI 実装 → Playwright project 配線 → 2 spec 実装 → CI job 追加 → baseline 取得 → evidence 配置 → proto-spec consumed 化 → 親 workflow cross-ref → PR draft までを 1 サイクルで完結させる。

## 5. Phase 構成

| Phase | ファイル | 責務 |
|---|---|---|
| 1 | `phase-01-requirements.md` | FR/NFR / 受け入れ基準（proto-spec AC を実装可能項目に展開） |
| 2 | `phase-02-architecture.md` | アーキ図（mint CLI → storageState → Playwright project → staging Worker） |
| 3 | `phase-03-task-breakdown.md` | SRP 単位タスク分解（1 ファイル 1 タスク・コミット可能粒度） |
| 4 | `phase-04-data-contract.md` | storageState JSON schema / cookie schema / session JWT claims schema |
| 5 | `phase-05-implementation-guide.md` | 変更ファイル一覧・関数シグネチャ・env 取扱・エラー方針 |
| 6 | `phase-06-test-strategy.md` | unit / visual e2e / grep gate / CI matrix |
| 7 | `phase-07-quality-gates.md` | typecheck / lint / verify-pr-ready / cookie 値 grep / required status checks |
| 8 | `phase-08-dod.md` | Definition of Done（proto-spec AC + 本タスク固有 DoD） |
| 9 | `phase-09-risks.md` | R-01..R-08 リスクと対策（proto-spec リスク表 ベース） |
| 10 | `phase-10-local-verification.md` | `op run` + mint CLI + Playwright update-snapshots 手順 |
| 11 | `phase-11-evidence-inventory.md` | evidence 物理パス一覧・inventory ledger 更新箇所 |
| 12 | `phase-12-compliance.md` | canonical 9 headings + strict 7 outputs + unassigned 0 件主張 |
| 13 | `phase-13-commit-pr-draft.md` | PR draft (base=`dev` / `Refs #901`) / required status checks / rollback |

## 6. 正本順位

1. 本 `index.md`（§0 issue 最適化判定を含む）
2. 親 `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/`（`index.md` / `artifacts.json` / `SCOPE` 系）
3. 現コード実態（`apps/web/playwright.config.ts` / `apps/web/playwright/tests/visual-staging/*.spec.ts` / `packages/shared` `signSessionJwt` / `scripts/smoke/mint-staging-bearers.mts`）
4. `docs/00-getting-started-manual/specs/13-mvp-auth.md` / `02-auth.md`
5. proto-spec `docs/30-workflows/completed-tasks/UT-DSF-07-FU-01-authenticated-profile-admin-staging-visual.md`

衝突時は上位を優先。proto-spec と現コード実態が衝突する場合は §0.2 の最適化判定に従う。

## 7. ToC

- [Phase 1 — Requirements](./phase-01-requirements.md)
- [Phase 2 — Architecture](./phase-02-architecture.md)
- [Phase 3 — Task Breakdown](./phase-03-task-breakdown.md)
- [Phase 4 — Data Contract](./phase-04-data-contract.md)
- [Phase 5 — Implementation Guide](./phase-05-implementation-guide.md)
- [Phase 6 — Test Strategy](./phase-06-test-strategy.md)
- [Phase 7 — Quality Gates](./phase-07-quality-gates.md)
- [Phase 8 — DoD](./phase-08-dod.md)
- [Phase 9 — Risks](./phase-09-risks.md)
- [Phase 10 — Local Verification](./phase-10-local-verification.md)
- [Phase 11 — Evidence Inventory](./phase-11-evidence-inventory.md)
- [Phase 12 — Compliance](./phase-12-compliance.md)
- [Phase 13 — Commit/PR Draft](./phase-13-commit-pr-draft.md)
- [outputs/phase-11/](./outputs/phase-11/) / [outputs/phase-12/](./outputs/phase-12/)

## 8. 参照

- parent workflow: `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/`
- proto-spec (to be consumed): `docs/30-workflows/completed-tasks/UT-DSF-07-FU-01-authenticated-profile-admin-staging-visual.md`
- code (current):
  - `apps/web/playwright.config.ts`（`staging-visual` project L241-249）
  - `apps/web/playwright/tests/visual-staging/{profile,admin-dashboard}.spec.ts`（unauthenticated guard baseline）
  - `apps/web/scripts/lhci-auth-storage.ts`（storageState 生成 reference 実装）
  - `packages/shared`（`signSessionJwt` / `verifySessionJwt`）
  - `scripts/smoke/mint-staging-bearers.mts`（TTL=600s mint pattern）
  - `scripts/smoke/runtime-admin-web.sh`（`STAGING_ADMIN_SESSION_COOKIE` 利用）
  - `.github/workflows/playwright-visual-baseline-update.yml`（CI 拡張候補）
  - issue-864 PR #923（admin staging runtime smoke CI gate / 認証 cookie 注入の CI 配線 reference）
- spec: `docs/00-getting-started-manual/specs/13-mvp-auth.md` / `02-auth.md`
- governance: CLAUDE.md（apps/web env / Cloudflare CLI / シークレット管理 / UI prototype alignment 不変条件）
- skill references:
  - `.claude/skills/task-specification-creator/references/closed-issue-canonical-workflow-recovery.md`
  - `.claude/skills/task-specification-creator/references/phase12-strict-7-workflow-root-parity-gate.md`
  - `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md`
  - `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
