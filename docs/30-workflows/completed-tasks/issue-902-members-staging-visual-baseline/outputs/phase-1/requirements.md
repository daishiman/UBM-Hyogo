# Phase 1 — Requirements

## 1. 背景

UT-DSF-07（親）は public-top / login / profile / admin-dashboard の 4 screens で staging-visual baseline を確立したが、当初スコープに含まれていた `/members`（一覧）と `/members/[id]`（詳細）は drop された。本 follow-up（FU-02 / issue #902）でこの差分を埋める。

## 2. 機能要件

- FR-1: `apps/web/playwright/tests/visual-staging/members-list.spec.ts` を追加し、staging URL `/members` の初期表示（filter 無し・1 ページ目・既定 density）の visual baseline を取得する
- FR-2: `apps/web/playwright/tests/visual-staging/member-detail.spec.ts` を追加し、staging URL `/members/<PLAYWRIGHT_MEMBER_DETAIL_ID>` の visual baseline を取得する
- FR-3: `PLAYWRIGHT_MEMBER_DETAIL_ID` 未指定環境では `test.skip` で安全停止する
- FR-4: `.github/workflows/playwright-smoke.yml` の `staging-visual` job 名表記を `4 screens` → `6 screens` へ更新する

## 3. 非機能要件

- NFR-1: SSR データ差分による flake 抑制のため `maxDiffPixelRatio: 0.05` を採用（既存 4 spec と同値）
- NFR-2: baseline は CI ubuntu-latest 生成 `-staging-visual-chromium-linux.png` を正本とし、macOS local の `-darwin.png` はコミットしない
- NFR-3: 検証対象は OpenNext bundle の design system 描画（OKLch / `@layer` / rhythm / primitives）の local との等価性であり、API データ内容ではない

## 4. 制約

- CLAUDE.md UI prototype alignment 不変条件 #1: 新規 API endpoint / D1 schema 変更 / Google Form 仕様変更を禁止
- CLAUDE.md apps/web env アクセス不変条件: `127.0.0.1:8888` の `apps/web/src/` への焼き込み禁止、`process.env.*` 直接参照禁止（本タスクは spec 配下のみ修正のため対象外）
- CLAUDE.md Cloudflare CLI 実行ルール: `scripts/cf.sh` 経由のみ（user-gated boundary で適用）

## 5. 受け入れ基準

- AC-1: `apps/web/playwright/tests/visual-staging/{members-list,member-detail}.spec.ts` が存在し、staging-visual project の `testMatch` に自動マッチする
- AC-2: `PLAYWRIGHT_MEMBER_DETAIL_ID` 未指定時に `member-detail.spec.ts` が `test.skip` で正常終了する
- AC-3: `.github/workflows/playwright-smoke.yml` の `staging-visual` job 名が `6 screens` 表記になっている
- AC-4: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` が exit 0
- AC-5: `bash scripts/verify-pr-ready.sh` が exit 0
- AC-6（user-gated）: CI で baseline PNG が生成され artifact から download → commit されている
- AC-7（user-gated）: staging に最新 bundle が deploy されている

## 6. Out of scope

- 認証後画面の取得（UT-DSF-07-FU-01 / issue #901）
- staging seed への代表メンバー投入
- CI への `PLAYWRIGHT_MEMBER_DETAIL_ID` 注入（GitHub Actions secrets/vars）
- local visual-chromium baseline 再取得
