---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 9
phase_name: QA
created_at: 2026-05-29
---

# Phase 9: QA

[実装区分: 実装仕様書]

本 Phase は Task A〜E 完了後の実装実行フェーズで踏む検証手順を確定する。
ローカル（macOS）では spec list / smoke 1 回実行までを行い、**visual baseline の macOS 撮影分は commit しない**。
baseline 正本の生成と diff 検証は CI Linux runner（`-linux.png`）で行う。

---

## 1. ローカル検証（macOS）

```bash
# Node 24 で依存インストール
mise exec -- pnpm install

# spec list 検証 — smoke 6 ケース + visual 7 entry（project 別展開前のソース entry）が list される
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/sidebar-shell --list

# smoke を 1 回だけ実行（local webServer + mockApi + auth fixture で完結）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=sidebar-shell-smoke --reporter=line

# visual の dry-run（撮影 png は commit 禁止 / 確認のみ）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=sidebar-shell-visual-desktop --reporter=line
```

期待値:
- `--list` 出力: smoke spec から **S1〜S6 の 6 ケース** + visual spec の 7 test（project により有効化される 7 点。Phase 6 §の `test.skip` で role×viewport を限定）。
- `sidebar-shell-smoke` project: green（diff / 失敗 0）。
- visual dry-run の macOS 撮影 png は CI Linux 撮影と異なる → **commit 禁止**（不変条件 #1）。

---

## 2. CI 検証

- (a) `playwright-smoke / smoke (chromium)` matrix に `sidebar-shell-smoke` が取り込まれ green。
- (b) `playwright-smoke / visual (sidebar-shell)` 新 matrix 3 viewport（desktop / tablet / mobile）全 green。

baseline png 数を集計（CI Linux runner 撮影後）:

```bash
find apps/web/playwright/tests/sidebar-shell -name '*-linux.png' | wc -l
```

期待値: **7**（V1〜V7 の 7 screenshot）。6 以下 / 8 以上は不採用（撮りすぎ / 取りこぼし）。

regression dry-run（visual diff が detect されることの確認）:
1. `apps/web/src/styles/tokens.css` の shell 背景に効く token（例 `--color-surface`）を一時改変。
2. CI で `visual (sidebar-shell)` job が **fail** することを確認（少なくとも 1 viewport で diff 検出）。
3. revert し再実行で green に戻ることを確認。

---

## 3. grep gate（Phase 8 §3 と整合 / すべて 0 件）

```bash
# (1) 旧 e2e パス参照
git grep -n "tests/e2e/sidebar-shell" -- apps/web .github/workflows
# (2) 存在しない storageState export 誤参照
git grep -n "viewerStorageState\|memberStorageState\|adminStorageState" -- apps/web/playwright/tests/sidebar-shell
# (3) 旧 helper dir 参照
git grep -n "_helpers/sidebar" -- apps/web
```

(1)(2)(3) **すべて 0 件** を要求。1 件でもヒットすればパストポロジ補正違反として差し戻す。

---

## 4. CI / hook gate

| gate | コマンド | 期待 |
|---|---|---|
| typecheck | `mise exec -- pnpm typecheck` | green |
| lint | `mise exec -- pnpm lint` | green |
| PR ready | `mise exec -- bash scripts/verify-pr-ready.sh` | green |
| gate-metadata | `mise exec -- pnpm gate-metadata:validate` | ERROR:0 |
| phase12-compliance | `mise exec -- pnpm verify:phase12-compliance` | pass（hasCompletedTasksAncestor は dir 配置に従う） |
| indexes idempotent | `mise exec -- pnpm indexes:rebuild` を 2 回実行 | 再実行で md5 一致（idempotent） |
| test:suffix | lefthook `block-test-suffix`（commit 時自動） | 0 hit（新規は `*.spec.ts` のみ・`.test.ts` 無し） |
| design-tokens | CI `verify-design-tokens` | green（本 spec は CSS 不変更。regression dry-run の token 改変は revert 前提） |

---

## 5. 認証 fixture 整合確認

- `apps/web/playwright/fixtures/auth.ts` の拡張 `test` が export する `anonymousPage` / `memberPage` / `adminPage` を
  Phase 5 着手時に再確認し、role マッピング（viewer=`anonymousPage` / member=`memberPage` / admin=`adminPage`）が
  auth security core の role 判定 `session.isAdmin`（member=`false` / admin=`true`）と一致することを確認する。

```bash
# fixture が期待 export を持つこと
git grep -n "anonymousPage\|memberPage\|adminPage" -- apps/web/playwright/fixtures/auth.ts | head
```

- `memberPage` / `adminPage` で `/profile` / `/admin` を開いた際に **401 / login ページへリダイレクトしないこと**を smoke S2 / S3 で確認する。
  401 へ飛ぶ場合は fixture の session 注入（cookie / mockApi の `/me`・`/session` 応答）が role と不整合 → Phase 5 で fixture seed を補強する（新規 storageState は作らず既存 `mockApi` seed を拡張、AC-8）。
- `mockApi` は read-only GET の固定応答のみに使用し、mutation には触らない（不変条件 #8）。
