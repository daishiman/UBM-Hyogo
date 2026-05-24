---
phase: 2
title: 設計 — scrape spec topology と evidence データフロー
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-followup-002-admin-runtime-evidence
status: spec_created
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: verify_existing
---

# Phase 2 — 設計

[実装区分: 実装仕様書]

## 1. 既存コンポーネント再利用可否（[FB-SDK-07-1]）

新規 UI 実装ゼロ。既存 fixture / 取得パターンを再利用する。

| 必要機能 | 再利用するもの | 新規作成するもの |
|----------|----------------|------------------|
| admin 認証セッション | `apps/web/playwright/fixtures/auth.ts` の `adminPage` fixture（`signSessionJwt` + `authjs.session-token` cookie + 内蔵 mock API 8787） | なし |
| `/admin` の DOM 取得 | `task15-admin-screenshots.spec.ts` の `adminPage.goto('/admin')` パターン | なし |
| data-* 抽出 + ファイル書き出し | Node `fs/promises`（`task15` spec と同様） | scrape spec 1 ファイル |

## 2. データフロー（runtime evidence 取得）

```
Playwright runner
  └─ fixtures/auth.ts: adminPage
       ├─ adminContext: signSessionJwt(AUTH_SECRET, {memberId:'admin-1', isAdmin:true})
       │    → cookie authjs.session-token を baseURL に注入
       │    → 内蔵 mock API (127.0.0.1:8787) が /admin/dashboard 等を返す（D1 非経由）
       └─ adminPage.goto('/admin')
            → (admin)/layout.tsx が data-theme/route-group/testid/shell/route を SSR
            → page.content() で production-equivalent HTML 取得
            → grep /data-(theme|route-group|shell|route|testid)=/ で契約属性のみ抽出
            → 親 outputs/phase-11/dom-scrape-admin.txt へ write
```

> `/admin` layout は `getSession()`→`auth()` で admin gate を通る。fixture が `isAdmin:true` の JWT を注入するため redirect されず admin shell が SSR される。

## 3. 状態所有権 / 責務境界

| 要素 | 責務 | 所有 |
|------|------|------|
| `(admin)/layout.tsx` | data-* 契約属性の SSR 出力（**変更しない**） | parallel-03 既実装 |
| `parallel-03-admin-shell-scrape.spec.ts` | runtime DOM 取得 + 契約 grep + evidence 書き出し | 本タスク（新規） |
| 親 `phase-11-evidence-inventory.md` | EV 台帳の status / 取得手順の正本 | 本タスクで EV-12 行を更新 |
| `verify-phase11-evidence-existence.ts` | status 語彙検証 + present 行のファイル存在検証 | 既存 gate（変更しない） |

## 4. ライブラリ選定 / 出力契約

- 追加依存なし。`@playwright/test` と Node 標準 `fs/promises` / `path` のみ。
- 出力ファイルは **テキスト（grep 結果の改行区切り）**。non-empty を満たすため最低限 `data-theme="cool"` / `data-route-group="admin"` / `data-route="admin"` を含む。
- 出力 path（spec からの相対）: `../../docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt`（`task15` spec の `OUT_DIR` と同じ相対基準 = `apps/web` cwd 起点）。

## 5. validation path（status 語彙の整合設計）

`verify-phase11-evidence-existence.ts` の挙動を前提に設計する:

| status | validator 挙動 | 本タスクでの使い方 |
|--------|----------------|---------------------|
| `present` | ファイル存在を検証（無ければ missing で fail） | EV-12 を `present` に更新 → `dom-scrape-admin.txt` を実在させる |
| `pending` | 存在検証しない（valid） | EV-13/15/16 を `pending` のまま残し委譲注記 |
| `n/a` | 存在検証しない（valid） | 使わない |
| `captured` / `deferred-*` 等 | **invalid → gate fail** | **使用禁止**（原 issue 記述の罠） |

## 6. dev server / mock の起動方式

- Playwright `playwright.config.ts` の `webServer` 設定で `apps/web` dev server を起動（既存 spec と同経路）。mock API は fixture が内蔵起動するため別途不要。
- 実行コマンドは Phase 5 / Phase 10 で確定。

## 7. リスクと対策

| リスク | 対策 |
|--------|------|
| `/admin` が SSR ではなく client streaming で `page.content()` 時点に data-* 未出力 | `await adminPage.waitForSelector('[data-testid="admin-shell"]')` で shell 出現を待ってから `content()` |
| grep 0 hit（契約 regression） | spec 内で `expect(scraped).toMatch(/data-theme="cool"/)` 等を assert し 0 hit を fail 扱い |
| 出力 path のディレクトリ未作成 | `mkdir(dir, {recursive:true})`（`task15` spec と同じ） |
| status 語彙の取り違え | Phase 5/12 で `present` 固定、`captured` 禁止を明記 |
