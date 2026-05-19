# Lessons Learned: UI Prototype Design System Foundation / parallel-01 globals.css rhythm (2026-05)

> 関連: [[workflow-ui-prototype-design-system-foundation-artifact-inventory]] /
> [[changelog/20260518-ui-prototype-design-system-foundation]]
>
> 対象 wave: `docs/30-workflows/ui-prototype-design-system-foundation/` +
> `parallel-01-globals-css-rhythm/` (Phase 1-13) と
> `apps/web/src/styles/globals.css` への P1-1〜P1-5 selector + admin shell
> width `272px` 反映までの Phase-12 retrospective sync。

## サマリ

19-route design system foundation の正本順位（09 spec > prototype）と、
Tailwind v4 CSS-first build pipeline 上で `apps/web/src/styles/globals.css` /
`apps/web/src/styles/tokens.css` の責務分離をどう保つかを Phase-12 で見直した。
P1-1〜P1-5 の `[data-route]` / `[data-section(-rhythm)]` / `[data-card(-tone)]` /
`[data-shell]` / `[data-text]` selector を rhythm/typography 専用層として
`globals.css` に追加し、tokens.css は OKLch 色 token 専任で維持する。
admin shell width は 09h を SSOT として `240px → 272px` に整列。

---

## L-UIPROTO-001: tokens.css と globals.css の `@import` 構成は維持する（inline 化しない）

**症状**: Phase 5 実装初期に「Tailwind v4 の `@theme inline` と `@import "./tokens.css"`
を同居させると build order が破綻するのではないか」という懸念が出て、tokens を
globals.css へ inline 展開する案が検討された。

**原因**: Tailwind v4 CSS-first build の `@theme inline` 仕様に対する事前推測。
実環境では `@layer base` の `:root { --ubm-* }` 宣言を `@import` した上で、
`@theme inline { --color-...: var(--ubm-color-...); }` で bridge する構造は
ビルド可能。

**修復**: 実装上は `globals.css` 冒頭の `@import "./tokens.css";` を**維持**し、
inline 化はしない。`@layer components` への P1-1〜P1-5 追加のみで完結させた。

**再発防止**:
- Tailwind v4 `@theme inline` の build order 仮説は、必ず `mise exec -- pnpm build` で
  実機検証してから設計判断する。
- `globals.css` 冒頭 8 行（`@import` / `@source` 宣言）は SSOT。
  rhythm/selector 追加で**この import 順序を変更しない**こと。

---

## L-UIPROTO-002: OKLch 正本（09b）と globals.css の var 参照を `--ubm-*` 系に統一する

**症状**: globals.css に追加した selector で `var(--ubm-color-*)` を使う際、
過去 PR の `hsl(var(--background))` / `rgb(var(--background)/...)` 残骸が混在
していると `verify-design-tokens` CI gate が落ちるリスクがある。

**原因**: 09b OKLch 化以前の token bridging で `--background` / `--foreground`
等の HSL alias が混在していた。task-09 設計時点で `--ubm-color-*` を正本へ移し
たが、selector 層での参照経路が複数存在していた。

**修復**: 今回追加した P1-1〜P1-5 / selector hooks（member-card / tag-pill /
data-visibility）はすべて `var(--ubm-color-*)` / `var(--ubm-space-*)` /
`var(--ubm-text-*)` / `var(--ubm-radius-*)` / `var(--ubm-shadow-*)` のみを参照。
tokens.css 側で `--ubm-color-accent` / `--ubm-color-accent-ink` の OKLch 値を
`oklch(0.52 0.13 50)` / `oklch(0.36 0.12 50)` に整列。

**再発防止**:
- `apps/web/src/styles/globals.css` への新規 selector 追加時は
  `var(--ubm-*)` 以外の token alias を**新たに参照しない**こと。
- `verify-design-tokens` (task-18) CI gate を required check に組み入れて
  HEX 直書き / 旧 alias 参照を機械的に block。

---

## L-UIPROTO-003: AppShell admin grid は 09h を SSOT として 272px に揃える

**症状**: `apps/web/app/(admin)/layout.tsx` の grid template が
`md:grid-cols-[240px_1fr]` で固定されていたが、09h spec / prototype
`styles.css` の `.app-shell` は 272px を採用していた。

**原因**: 過去 PR で暫定的に 240px を入れたまま、09h shell SSOT 化（task-21 系）
の反映が漏れていた。

**修復**: `apps/web/app/(admin)/layout.tsx` を `md:grid-cols-[272px_1fr]` に
更新し、`<aside data-shell="sidebar">` と `<main data-route="admin">` を付与。
09h-shell-and-fixtures.md L20 / L42 / L107 / L138 の `272px` を SSOT として
明示。

**再発防止**:
- shell width / sidebar width / topbar height などの数値は
  `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` を SSOT とし、
  prototype `styles.css` は参照値（cross-check）扱い。
- AppShell の構造変更時は 09h を読み直してから layout.tsx に反映する手順を
  artifact inventory の Implementation Boundary に明記。

---

## L-UIPROTO-004: tokens.css は色責務、globals.css は rhythm/typography 責務（SRP 明文化）

**症状**: 今回 `globals.css` に +176 行（P1-1〜P1-5 + selector hooks）を追加した。
将来「tokens 系の追加だから tokens.css に書く」と誤解されると、tokens.css へ
rhythm / selector が漏出してファイル責務が崩れる。

**原因**: 両ファイルの責務境界がコード内コメントにしか無く、skill 側の
references にも明文化されていなかった。

**修復**: 本 lessons-learned で責務を明文化:

| ファイル | 責務 | 含めるもの | 含めないもの |
|---------|------|-----------|-------------|
| `apps/web/src/styles/tokens.css` | OKLch / HEX の **色 token** 正本 (`--ubm-color-*` / 派生 alias) | `:root` および `[data-theme="warm"|"cool"]` の token 値 | selector / rhythm / typography / shadow rule |
| `apps/web/src/styles/globals.css` | Tailwind v4 bridge + rhythm / typography / data-attr selector | `@theme inline` bridge、`@layer base`、`@layer components` 内の selector hooks (P1-1〜P1-5 ほか) | 色 token 値の宣言（必ず tokens.css 側で定義し var 経由で参照） |

**再発防止**:
- `apps/web/src/styles/tokens.css` への変更 PR は色 token 値追加・修正のみ。
  rhythm / selector / shadow rule を tokens.css に書かない。
- artifact inventory の Implementation Boundary にこの SRP を明記。

---

## L-UIPROTO-005: 09a-prototype-map.md の物理配置正本化（09 spec > prototype）

**症状**: `09a-prototype-map.md` の production target 列に
`apps/web/src/app/...` という stale path が残っていた（実体は
`apps/web/app/...` ）。同時に `data-theme="warm" | "cool"` の採否が
「不採用」と書かれていたが、実装側は root / member / admin shell で
theme override に採用していた。

**原因**: `apps/web/src/app` → `apps/web/app` の OpenNext 移行が 09a に
未反映。theme 採否決定の更新も skill 同期されていなかった。

**修復**: 09a を `apps/web/app/...` 物理配置と整合させ、`data-theme` 採用方針を
`採用: root/member は warm、admin は cool` に補正。
`changelog/20260518-ui-prototype-design-system-foundation.md` にも反映済み。

**再発防止**:
- 物理配置の正本順位は `09 spec > prototype` を維持。
  prototype 側 `app.jsx` / `styles.css` を SSOT に昇格させない（CLAUDE.md
  「GAS prototype は本番バックエンド仕様に昇格させない」と同等のルールを
  claude-design-prototype にも適用）。
- `apps/web/app` 物理配置の変更時は 09a / 09h を必ず同一 wave で更新する。

---

## 関連ファイル

- `apps/web/src/styles/globals.css` (+176 行: P1-1〜P1-5 + selector hooks)
- `apps/web/src/styles/tokens.css` (OKLch accent / accent-ink 整列)
- `apps/web/app/(admin)/layout.tsx` (240px → 272px、`data-shell` / `data-route` 付与)
- `apps/web/app/(member)/layout.tsx`, `apps/web/app/(public)/layout.tsx`, `apps/web/app/layout.tsx`
- `docs/00-getting-started-manual/specs/09a-prototype-map.md` (物理配置 / theme 採否)
- `docs/00-getting-started-manual/specs/09b-design-tokens.md` (OKLch 正本)
- `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` (272px SSOT)
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-{01..13}.md`
- [[workflow-ui-prototype-design-system-foundation-artifact-inventory]]
