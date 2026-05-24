# Phase 11: 手動テスト（VISUAL_ON_EXECUTION 証跡）

admin topbar は画面に描画される chrome（VISUAL_ON_EXECUTION）。本サイクルでは local component / layout DOM / axe 証跡に加え、`outputs/phase-11/screenshots/` 配下にローカル視覚証跡を保存する。authenticated `/admin` browser smoke は admin session 利用時に再実行可能な追加確認とする。

## 0. 認証 gate 前提

`(admin)/layout.tsx` は `session.isAdmin` の認証 gate 配下にあるため、admin topbar を描画するには **admin session が必要**。手動確認には admin テストアカウントでのログインが前提となる。

| 項目 | 値 |
|---|---|
| 確認 route | `/admin` |
| 認証 gate | `session.isAdmin`（admin session 必須） |
| admin テストアカウント | `manjumoto.daishi@senpai-lab.com`（memory `project_test_accounts`） |

## 1. 事前準備

```bash
mise exec -- pnpm install
# apps/api を並走起動（D1 binding / session 提供）
mise exec -- bash scripts/with-env.sh pnpm --filter @ubm-hyogo/api dev
# 別ターミナルで apps/web dev
mise exec -- bash scripts/with-env.sh pnpm --filter @ubm-hyogo/web dev
```

1. ブラウザで `http://localhost:3000/login` を開く。
2. admin テストアカウント（`manjumoto.daishi@senpai-lab.com`）でログインする。
3. `http://localhost:3000/admin` へ遷移し、admin AppShell が描画されることを確認する。

## 2. 手動テストケース（TC 表）

### TC-1: topbar に「管理」breadcrumb が表示される（目視 + スクリーンショット）

- `/admin` を開き、画面上部 topbar の左側に既定テキスト「**管理**」が表示されることを目視確認する。
- スクリーンショットを `outputs/phase-11/screenshots/admin-topbar-default.png` に保存する。
- 期待: breadcrumb slot に「管理」が表示される（props 省略時の既定描画 = 抽出前と同一）。

### TC-2: topbar の下境界線 + padding が parallel-03 と同一（regression なし）

- topbar 下端に境界線（`border-b`）が表示され、左右 padding（`px-4`）・上下 padding（`py-3`）が抽出前（parallel-03）と視覚的に同一であることを目視確認する。
- 期待: `border-b border-[var(--ubm-color-border-default)] px-4 py-3` の見た目が維持され、罫線・余白に regression がない。

### TC-3: DOM 契約検証（DevTools Console）

DevTools の Console で以下を実行する。

```js
const topbar = document.querySelector('[data-shell="topbar"]');
console.log("topbar", topbar?.tagName);                                  // → "HEADER"
console.log("breadcrumb", !!topbar?.querySelector('[data-component="admin-breadcrumb-slot"]'));  // → true
console.log("actions",    !!topbar?.querySelector('[data-component="admin-topbar-actions"]'));   // → true
// route group / theme は wrapper 側に残ること（primitive へ移っていないこと）
console.log("routeGroup", document.querySelector('[data-route-group="admin"]')?.tagName);        // → "DIV"
```

- 期待:
  - `[data-shell="topbar"]` が存在し tagName が `HEADER`。
  - その内部に `[data-component="admin-breadcrumb-slot"]` と `[data-component="admin-topbar-actions"]` が存在する。
  - `[data-route-group="admin"]` / `[data-theme="cool"]` は wrapper `<div>` 側に残る（primitive 側へ移動していない = Phase 3 R-1 回避確認）。
- Console 出力を `outputs/phase-11/screenshots/admin-topbar-dom-contract.txt` に保存する。

### TC-4: axe critical violation 0

- ブラウザ拡張（axe DevTools）で `/admin` をスキャンする。自動 spec（`AdminTopbar.spec.tsx` の axe 検証）が PASS していれば併せて根拠とする。
- 期待: critical violation 0。空 actions placeholder の `aria-hidden="true"`（props 省略時）により aria 警告が出ないこと（Phase 3 R-2 回避確認）。
- スキャン結果を `outputs/phase-11/screenshots/admin-topbar-axe.png` に保存する。

### TC-5: regression — sidebar / main が従来通り表示

- topbar 抽出後も `/admin` の左 sidebar（`[data-shell="sidebar"]` の `<aside>`）と main 領域（`[data-route="admin"]` の `<main>`）が従来どおり grid 配置（`md:grid-cols-[272px_1fr]` / `grid-rows-[auto_1fr]`）で表示されることを目視確認する。
- 期待: sidebar / main のレイアウトに変化なし。topbar は row1 / col2 に従来どおり配置される。
- 全体レイアウトのスクリーンショットを `outputs/phase-11/screenshots/admin-shell-regression.png` に保存する。

## 3. 証跡保存

`outputs/phase-11/` 配下に以下を保存する（FB-LLM-MOD-05-001: screenshot canonical 名は `admin-topbar-<state>.png` 形式）。

```
outputs/phase-11/
  ├─ manual-test-result.md                       # TC-1〜TC-5 の結果（PASS/FAIL・日付・実行者）
  └─ screenshots/
      ├─ admin-topbar-default.png                # TC-1: breadcrumb「管理」目視
      ├─ admin-topbar-dom-contract.txt           # TC-3: DevTools Console 出力
      ├─ admin-topbar-axe.png                    # TC-4: axe スキャン結果
      └─ admin-shell-regression.png              # TC-5: sidebar/main regression なし
```

> screenshot-plan mode は **VISUAL_ON_EXECUTION**。canonical 名は `admin-topbar-<state>.png`（`<state>` = `default` / `regression` 等）。

## 4. NG 時の対応

| 症状 | 切り分け |
|---|---|
| breadcrumb「管理」が出ない | AdminTopbar の `breadcrumb ?? "管理"` フォールバック / layout からの props 未指定を確認 |
| topbar の罫線・余白が変わった | inline JSX からの class 移植漏れ（`border-b ... px-4 py-3`）を確認 |
| `[data-route-group="admin"]` が `<header>` 側に出る | Phase 3 R-1。`data-route-group` / `data-theme` を primitive へ誤移動していないか layout.tsx wrapper を確認 |
| axe critical（空 actions の aria 警告） | Phase 3 R-2。props 省略時のみ `aria-hidden="true"` が付くこと（`actions === undefined` 判定）を確認 |
| sidebar / main がずれた | grid 配置の保全（Phase 2 §6）。AdminTopbar が余分な wrapper `<div>` を増やしていないか確認 |
