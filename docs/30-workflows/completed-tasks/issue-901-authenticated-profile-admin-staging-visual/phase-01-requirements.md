---
phase: 1
title: Requirements
workflow_id: issue-901-authenticated-profile-admin-staging-visual
status: spec_created
---

# Phase 1 — Requirements

[実装区分: 実装仕様書]

## 1. ユーザー要求

UT-DSF-07 で確立した staging visual runtime evidence は profile / admin について「未認証 guard 画面」までしか撮れていない。認証後の `/profile`（自分のプロフィール本文）と `/admin`（管理 dashboard 本文）の design system 描画が Cloudflare Workers staging 上で local baseline と等価に再現されることを、production-equivalent runtime visual baseline として確立したい。

## 2. 機能要件 (FR)

| FR | 内容 |
|---|---|
| FR-01 | staging Worker host (`https://ubm-hyogo-web-staging.daishimanju.workers.dev`) に対し、member session を持つ Playwright context で `/profile` を訪問し、認証後本文要素 (`responseEmail` 表示) の可視性を assert したうえで `toHaveScreenshot` を実行できる |
| FR-02 | 同 staging Worker host に対し、admin session を持つ Playwright context で `/admin` を訪問し、admin 専用 widget の可視性を assert したうえで `toHaveScreenshot` を実行できる |
| FR-03 | member / admin の storageState JSON を **CI 内で ephemeral 生成** する CLI (`apps/web/playwright/scripts/mint-staging-storage-state.ts`) が、`signSessionJwt` 経由で TTL=600s の session JWT を mint し、`authjs.session-token` cookie を含む storageState を出力する |
| FR-04 | Playwright `staging-visual-authenticated` project が `use.storageState` で生成済 storageState を読み込み、UT-DSF-07 既存 `staging-visual` project と独立して動作する（baseline PNG 命名空間が衝突しない） |
| FR-05 | 取得した baseline PNG は `*-authenticated-staging-visual-chromium-linux.png` の suffix を持ち、UT-DSF-07 既存 baseline と物理的に分離されている |
| FR-06 | CI workflow が GitHub Secrets (`STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` / `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL`) を mint CLI に注入し、Playwright 実行後に storageState を artifact として残さず破棄する |

## 3. 非機能要件 (NFR)

| NFR | 内容 | 検証 |
|---|---|---|
| NFR-01 | visual diff threshold は UT-DSF-07 未認証 baseline と同水準（`maxDiffPixelRatio` ≤ 0.05 を原則とし、データ揺れ領域は spec 内で clip / mask） | Playwright `toHaveScreenshot` config |
| NFR-02 | session JWT TTL = 600s（10 分）。runtime smoke / `mint-staging-bearers.mts` 既存規約と統一 | CLI 内 `exp = iat + 600` を unit test で固定検証 |
| NFR-03 | cookie 値 / token 値 / `AUTH_SECRET` 値を storageState 生成ログ / screenshot / spec 本文に出力しない | grep gate（`STAGING_AUTH_SECRET` / cookie 値 prefix 0 hit） |
| NFR-04 | storageState JSON を git にコミットしない | `.gitignore` 追記 + pre-commit grep |
| NFR-05 | 認証後画面が guard / redirect 画面でないことを screenshot 前に assert する（`expect(locator).toBeVisible({ timeout: 10_000 })`） | spec 内 assert |
| NFR-06 | 新規 API endpoint / D1 schema 変更 / production deploy 0 件 | code diff scope |
| NFR-07 | mint CLI は dry-run mode（`--dry-run`）で実 cookie を出力せず schema 検証のみ実行できる | unit test で dry-run path 検証 |

## 4. 受け入れ基準（proto-spec AC の実装可能展開）

| AC | 内容 | 充足判定 |
|---|---|---|
| AC-01 | storageState 事前生成方式（`signSessionJwt` 経由）が CLI として実装され、TTL=600s で `authjs.session-token` cookie を生成する | `mint-staging-storage-state.ts` 存在 + unit test green |
| AC-02 | member session storageState 注入で `/profile` 認証後実画面の staging-visual baseline を取得 | `outputs/phase-11/screenshots/profile-authenticated.png` + `apps/web/playwright/tests/visual-staging-authenticated/profile-authenticated-snapshots/*-authenticated-staging-visual-chromium-linux.png` 物理存在 |
| AC-03 | admin session storageState 注入で `/admin` 認証後 dashboard の staging-visual baseline を取得 | `outputs/phase-11/screenshots/admin-dashboard-authenticated.png` + `apps/web/playwright/tests/visual-staging-authenticated/admin-dashboard-authenticated-snapshots/*-authenticated-staging-visual-chromium-linux.png` 物理存在 |
| AC-04 | 認証後画面が guard / redirect 画面ではない（profile 本文 / admin 専用 widget の存在を assert） | spec 内 `expect().toBeVisible()` 配置 + Playwright run log で pass |
| AC-05 | baseline PNG が CI ubuntu-latest 生成 `-authenticated-staging-visual-chromium-linux.png` で揃っている | PNG filename suffix 一致確認 |
| AC-06 | screenshot / metadata が `outputs/phase-11/` に物理配置 + inventory ledger と整合 | Phase 11 inventory `present` 化 |
| AC-07 | 親 UT-DSF-07 workflow に認証後 evidence の cross-ref（Phase 9 §5 / R-03 解消記録 / Phase 13 §7 解消）が反映されている | parent phase ファイル diff |
| AC-08 | storageState / screenshot / log に session cookie 値・OAuth token 値が混入していない（grep 0 件） | CI grep gate exit 0 |
| AC-09 | 新規 API endpoint / D1 schema 変更 / production deploy を行っていない | code diff scope review |
| AC-10 | `mise exec -- pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` が exit 0 | CI run log |
| AC-11 | proto-spec ファイル末尾に `status: consumed` YAML frontmatter + `canonical_workflow` pointer 追記 | proto-spec diff |
| AC-12 | `apps/web/.gitignore` に `playwright/.auth/*.json` 相当の storageState 出力除外が追加されている | `.gitignore` diff |

## 5. スコープ境界（再掲）

含む: §index.md §2 参照。含まない: §index.md §2 参照。

## 6. 苦戦予測

- staging に admin / member の seed が無い場合、`/admin` が guard に redirect されて baseline が取れない → Phase 9 R-02 対策
- `apps/web` (Auth.js cookie) と `apps/api` (`verifySessionJwt`) の `AUTH_SECRET` drift で session が無効化される → Phase 9 R-05 対策
- Playwright `globalSetup` vs dedicated setup project の選択 → Phase 2 §2.3 で setup project を採用（依存可視性 + 失敗時の log 分離が容易）

## 7. 参照

- proto-spec: `docs/30-workflows/completed-tasks/UT-DSF-07-FU-01-authenticated-profile-admin-staging-visual.md` § 受け入れ基準 / § スコープ
- spec: `docs/00-getting-started-manual/specs/13-mvp-auth.md`（MVP session JWT 構造 / admin gate）
- parent: `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/phase-01-requirements.md` / `phase-09-risks.md` §5
