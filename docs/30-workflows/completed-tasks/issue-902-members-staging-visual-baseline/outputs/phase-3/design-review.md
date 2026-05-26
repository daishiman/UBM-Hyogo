# Phase 3 — Design Review

## 1. SRP（Single Responsibility Principle）

| ファイル | 責務 |
|---------|------|
| `members-list.spec.ts` | `/members` 初期表示の design system 描画等価性検証のみ |
| `member-detail.spec.ts` | `/members/[id]` 代表 1 件の design system 描画等価性検証のみ |
| `playwright-smoke.yml` 変更 | screens 数表記の同期のみ |

各 spec は独立。共通 helper は導入しない（4 spec 既存のスタイルを踏襲）。

## 2. 既存資産との一貫性

- 既存 4 spec（public-top / login / profile / admin-dashboard）と同一構造（`page.route` + `addStyleTag` でアニメ抑止 + `toHaveScreenshot` + `maxDiffPixelRatio: 0.05`）
- `staging-visual` project の testMatch / baseURL / retries / viewport をそのまま継承

## 3. CLAUDE.md 不変条件チェック

| 不変条件 | 適合 | 根拠 |
|---------|------|------|
| 既存 API のみ接続 | ✅ | spec は `/members` / `/members/[id]` の SSR 出力を screenshot するだけで API は追加・変更しない |
| OKLch トークン正本化 | ✅ | spec 内で HEX 直書きなし |
| D1 直接アクセス禁止 | ✅ | `apps/web` 側の test 配下のみ変更 |
| apps/web env アクセス | ✅ | `process.env.PLAYWRIGHT_MEMBER_DETAIL_ID` は Playwright spec（`apps/web/playwright/` 配下）のみ。`apps/web/src/` 配下への env 直接参照ではない |
| `127.0.0.1:8888` 焼き込み | ✅ | spec に含まず |
| `*.spec.ts` 命名 | ✅ | `*.test.ts` 禁止に適合 |

## 4. 代替案検討

| 案 | 採否 | 理由 |
|----|------|------|
| 代表 ID を spec 内定数固定 | ❌ | seed 移行で baseline 壊れる |
| members-list 1 件目から ID 動的解決 | ❌ | list 並び順依存で flake 増 |
| **`PLAYWRIGHT_MEMBER_DETAIL_ID` + `test.skip`** | ✅ | seed 移行耐性 + 未注入環境での noise 排除 |
| `playwright.config.ts` で staging-visual project 分岐拡張 | ❌ | 既存 testMatch で自動マッチ可能。変更は不要 |

## 5. 同一サイクル完結性

| 項目 | サイクル内 | 理由 |
|------|----------|------|
| spec 2 件追加 | ✅ | 単純な spec ファイル追加 |
| job 名表記更新 | ✅ | 1 行 yaml 変更 |
| typecheck / lint | ✅ | local で完結 |
| baseline PNG 生成 | user-gated | CI dispatch 必須 |
| staging deploy | user-gated | infra ops |
| commit / push / PR | user-gated | ユーザー指示制 |

CONST_007 に適合。先送り 0 件、user-gated 境界は明確に分離。
