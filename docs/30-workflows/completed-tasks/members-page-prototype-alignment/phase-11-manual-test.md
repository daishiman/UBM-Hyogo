# Phase 11: 手動テスト + visual evidence

## 1. evidence 取得方針

`visualEvidence: VISUAL` のため screenshot を必須とする。

## 2. 取得対象

| ID | 画面 | viewport | 状態 |
|---|---|---|---|
| EV-1 | `/members` density=comfy | 1280×800 | 初期 |
| EV-2 | `/members` density=dense | 1280×800 | dense 切替 |
| EV-3 | `/members` density=list | 1280×800 | list 切替 |
| EV-4 | `/members` density=comfy | 375×800 | mobile |
| EV-5 | `/members?q=zzznotfound` | 1280×800 | empty-state |
| EV-6 | `/members` の header (focus state) | 1280×800 | nav hover / focus |

## 3. 保存先

```
docs/30-workflows/members-page-prototype-alignment/outputs/phase-11/
├── screenshots/
│   ├── EV-1-comfy-desktop.png
│   ├── EV-2-dense-desktop.png
│   ├── EV-3-list-desktop.png
│   ├── EV-4-comfy-mobile.png
│   ├── EV-5-empty-desktop.png
│   └── EV-6-header-focus.png
└── runtime-notes.md
```

## 4. Phase 11 evidence file inventory

| Classification | Path | Status | Source | Captured at |
|---|---|---|---|---|
| screenshot | `outputs/phase-11/screenshots/EV-1-comfy-desktop.png` | present | Playwright local dev | 2026-05-23T05:38:53.907Z |
| screenshot | `outputs/phase-11/screenshots/EV-2-dense-desktop.png` | present | Playwright local dev | 2026-05-23T05:38:53.907Z |
| screenshot | `outputs/phase-11/screenshots/EV-3-list-desktop.png` | present | Playwright local dev | 2026-05-23T05:38:53.907Z |
| screenshot | `outputs/phase-11/screenshots/EV-4-comfy-mobile.png` | present | Playwright local dev | 2026-05-23T05:38:53.907Z |
| screenshot | `outputs/phase-11/screenshots/EV-5-empty-desktop.png` | present | Playwright local dev | 2026-05-23T05:38:53.907Z |
| screenshot | `outputs/phase-11/screenshots/EV-6-header-focus.png` | present | Playwright local dev | 2026-05-23T05:38:53.907Z |
| manual notes | `outputs/phase-11/runtime-notes.md` | present | Playwright local dev | 2026-05-23T05:38:53.907Z |

> Status `present` の行は workflow root 相対 path の物理ファイル実在を同一 wave で確認済み。

## 5. 手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev   # localhost:3000
# 別タブで Playwright をヘッドありで実行し screenshot 取得、または手動で headless chrome を立てる
```

## 6. 完了条件

- 上記 6 evidence が `present` 状態で物理配置されている
- runtime-notes.md に取得日時 / コミット SHA / 観察された差異を記録
