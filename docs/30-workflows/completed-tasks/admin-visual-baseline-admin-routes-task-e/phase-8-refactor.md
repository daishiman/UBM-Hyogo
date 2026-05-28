---
spec_classification: implementation_spec
state: implemented_local_runtime_pending
phase: 8
phase_name: リファクタリング
created_at: 2026-05-27
---

# Phase 8: リファクタリング

[実装区分: 実装仕様書]

## 1. 既存 `admin-dashboard.spec.ts` の統合

- 移動先: `apps/web/playwright/tests/visual/admin-shell/dashboard.spec.ts`
- import path 調整: `../../fixtures/auth` → `../../../fixtures/auth`
- 旧 spec + `admin-dashboard.spec.ts-snapshots/` ディレクトリは **削除**
- 旧 baseline は 1 度 git rm し、CI 側で新パス配下に再撮影する

## 2. 共通 helper への切り出し

- `waitAdminPageReady` / `freezeAnimations` を `_helpers.ts` に集約
- 各 spec は 15-20 行以下に圧縮（storageState 前提 → goto → waitReady → freeze → screenshot の 4 行構成 + import + test 宣言）

## 3. grep gate（rename 漏れ防止 / L-I902-004）

実装完了後、以下の grep が **0 件** であることを Phase 9 で確認:

```bash
# 旧 spec パス参照
git grep -n "tests/visual/admin-dashboard.spec.ts" -- apps/web .github/workflows
# 旧 snapshot dir 参照
git grep -n "admin-dashboard.spec.ts-snapshots" -- apps/web
```

## 4. import path 整合

- `_helpers.ts` は同一 dir 内 → `from './_helpers'`
- `auth` fixture は 3 階層上 → `from '../../../fixtures/auth'`
- `playwright.config.ts` の `testMatch` glob を `tests/visual/admin-shell/**/*.spec.ts` に固定し、旧パスの match を outright 除外

## 5. naming refactor

- 旧: `admin-dashboard.spec.ts` 単体
- 新: `admin-shell/<slug>.spec.ts` 構造
- baseline file 名: `admin-<route-slug>.png`（Playwright 自動付与 suffix `-<project>-linux.png`）
