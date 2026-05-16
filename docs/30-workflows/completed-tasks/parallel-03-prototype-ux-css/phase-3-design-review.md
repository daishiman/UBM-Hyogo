# Phase 3: 設計レビュー

> Phase: 3 / 13

---

## 目的

Phase 2 設計が Phase 4 進行可能か判定する。

---

## レビュー観点

| 観点 | 判定 | 根拠 |
|------|------|------|
| 不変条件遵守 | `completed (design review)` | OKLch token のみ参照。HEX 直書きなし。`apps/api` / D1 無編集 |
| primitive 新設なし | `completed (design review)` | 既存 `data-component` / `data-visibility` 属性ベース、新規コンポーネントなし |
| State / API 変更なし | `completed (design review)` | CSS / semantic 属性 / local type のみに限定 |
| a11y | `completed (design review)` | `aria-pressed` を主契約、CSS hook は `data-selected`。通常 button に `aria-selected` は付与しない。icon は装飾、意味は text / attribute で担保 |
| token 整合 | `completed (design review)` | `--ubm-color-text-primary` / `--ubm-color-surface-panel` / `--ubm-color-border-strong` / `--ubm-shadow-sm` / `--ubm-color-ok` / `--ubm-color-zone-b` / `--ubm-color-danger` / `--ubm-dur-fast` / `--ubm-ease-standard` がすべて tokens.css に存在することを Phase 5 着手前に grep 確認 |
| scope creep 防止 | `completed (design review)` | section に visibility が無い件は MVP 固定 `"public"` で運用、API 変更へ波及させない |
| same-cycle completion | `completed (design review)` | 全 3 改善点を本 spec 1 サイクル内で完了。先送りタスクなし |

---

## blocker

なし。

## follow-up（本サイクル外候補・要ユーザー判断）

- API 側 section `visibility` field 追加検討（admin 側で section ごとの公開範囲制御が必要になった時点で別タスク化）
- emoji icon → SVG background-image 置換（フォントスタック差異が問題化した場合のみ）

---

## 判定

`PROCEED` — Phase 4 着手可能。
