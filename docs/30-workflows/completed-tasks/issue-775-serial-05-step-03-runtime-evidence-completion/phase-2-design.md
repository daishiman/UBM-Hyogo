# Phase 2: 設計

[実装区分: 実装仕様書]

## 1. 設計概要

既存 Playwright admin auth fixture と `PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1` の schema diff fixture で `/admin/schema` を描画し、Playwright で 11 PNG を capture する。`SchemaDiffPanel` / API endpoint の production code は不変、新規 spec + seed SQL + `.auth` 除外設定のみ追加する。

## 2. 構成図

```
┌──────────────────────────────┐       ┌──────────────────────────────┐
│ Playwright admin auth fixture│       │ Next.js dev server           │
│ authjs.session-token 注入     │       │ PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1 │
│ (既存 fixtures/auth.ts)       │──────▶│ schema diff fixture SSR      │
└──────────────────────────────┘       └──────────────────────────────┘
        ▲                                       ▲
        │ optional seed SQL for future real-D1  │ route mock for resolve states
        │                                       │
┌──────────────────────────────┐       ┌──────────────────────────────┐
│ scripts/cf.sh d1 execute     │       │ Playwright runner            │
│ (op run wrapped)             │       │ admin-schema-diff.spec.ts    │
└──────────────────────────────┘       └──────────────────────────────┘
                                                 │
                                                 ▼
                                    completed-tasks/.../phase-11/
                                      screenshots/*.png (11 PNG)
                                      evidence/playwright.log
```

## 3. 主要コンポーネント

### 3.1 新規 Playwright config

- パス: `apps/web/playwright.admin-schema-diff.config.ts`
- 役割: `admin-schema-diff.spec.ts` 専用 config。
- 構成:
  - `testDir: "./playwright/tests/visual"`
  - `testMatch: /admin-schema-diff\.spec\.ts$/`
  - `webServer.command`: `pnpm dev:webpack --hostname 127.0.0.1`（既存 dev server 起動済みなら reuseExistingServer）
  - `PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1` で SSR 側 `/admin/schema/diff` fixture を使用
  - projects: `chromium-desktop` (1280x800) / `chromium-mobile` (375x812)
  - `reporter`: `[["line"], ["html", { open: "never" }]]`

### 3.2 新規 Playwright spec

- パス: `apps/web/playwright/tests/visual/admin-schema-diff.spec.ts`
- 役割: `/admin/schema` の 4 pane × 2 viewport + resolve 3 状態の screenshot
- 主要シグネチャ:
  - `test.describe("SchemaDiffPanel runtime evidence", () => { ... })`
  - 各 pane test は `goto("/admin/schema")` → `expect(paneRegion).toBeVisible()` → pane region screenshot
  - resolve 3 状態は `goto("/admin/schema")` → 該当 row の button click → form fill → submit → `expect(feedback).toBeVisible()` → screenshot
- 出力先: `process.env.ADMIN_SCHEMA_DIFF_EVIDENCE_DIR` 経由で evidence path を差し込む（既定 = 親 workflow `completed-tasks/.../outputs/phase-11/screenshots`）

### 3.3 D1 seed fixture

- パス: `scripts/fixtures/serial-05-step-03/seed-diff.sql`
- 役割: 将来の local D1 実結合 capture で `/admin/schema/diff` を diff > 0 状態に揃える補助 fixture
- 内容:
  - `schema_versions` / `schema_questions` / `schema_diff_queue` にダミー行を投入し added/changed/removed/unresolved 各 pane を非空にする
  - 409 / 422 は今回の Playwright spec では browser route mock で再現する
- 注意: secret / 個人情報を一切含めない。fixture data はテスト用ダミーのみ
- cleanup: `scripts/fixtures/serial-05-step-03/seed-cleanup.sql`（seed の逆操作。冪等な DELETE）

### 3.4 auth fixture / storageState exclusion

- 既存 `apps/web/playwright/fixtures/auth.ts` の `adminPage` fixture が admin session cookie を注入する
- `playwright/.auth/.gitignore` を新規追加し `*.json` を除外（ファイル自体は commit）
- 本タスクでは storageState JSON を生成・commit しない

## 4. データフロー

1. Playwright config が `PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1` を注入
2. `apps/web` 起動 → `/admin/schema` が SSR 経由で fixture-backed `fetchAdmin("/admin/schema/diff")` を呼ぶ
3. Playwright `adminPage` fixture が admin session cookie を注入
4. pane region 8 枚 + resolve 3 状態をキャプチャ（resolve POST は browser route mock）
5. evidence path に 11 PNG 出力
6. manifest.json / state ファイル更新

## 5. エラーハンドリング設計

| 状況 | 対処 |
|------|------|
| fixture が空 | `PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1` の config 注入と `server-fetch.ts` fixture branch を確認 |
| Auth.js gate redirect (302 → /login) | `adminPage` fixture の session cookie injection を確認 |
| Playwright timeout | dev server hot reload 中の可能性 — reuseExistingServer false で再起動 |
| 422 toast が出ない | spec 側で入力値（regex 違反パターン）を確認 |

## 6. 既存実装との接続

- `apps/web/src/lib/admin/server-fetch.ts` — `PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1` の fixture branch で schema diff list を返す
- `apps/web/src/components/admin/SchemaDiffPanel.tsx` — 4 pane は常時表示。spec は pane region を個別 capture する
- `apps/api/src/routes/admin/schema.ts` — `POST /admin/schema/alias` の 409 / 422 レスポンス shape は既存 contract spec (`schema.contract.spec.ts`) で固定済み

## 7. 設計トレードオフ

- **新規 spec 追加 vs 手動 capture**: 再現性・regression baseline 化を優先し新規 spec を採用。手動 capture は §10 runbook fallback
- **PNG 配置先を親 workflow に置く**: 親 workflow の evidence path に統合することで manifest update が単一箇所に集約される。既存 `admin-schema-diff-list.png` は非 PNG placeholder だったため `.placeholder.txt` に退避し、PASS screenshot inventory から除外する
- **storageState を commit しない**: session token leak 防止。今回の実行は fixture cookie injection で完結する
