# Phase 2 — 設計

## 採用方針

**置換 only（既存コンポーネント再利用 + className 値置換）**。新規 component / primitive / utility / token は導入しない。

## 既存コンポーネント再利用可否（FB-SDK-07-1）

- ✅ `error.tsx` の構造（heading / message / action button）は task-05 で確立済み
- ✅ `text-text-3` / `bg-danger-soft` 等の utility は task-09 で確立済み
- ✅ 新規 UI 実装ゼロで HIG / a11y 維持可能 → 再利用最優先

## 置換マッピング（確定版）

現行 `apps/web/app/` の実コード grep に基づく置換マッピング。

| Before | After |
|---|---|
| `text-[var(--ubm-color-danger)]` | `text-danger` |
| `text-[var(--ubm-color-fg-muted)]`（旧互換 alias / runtime stale） | `text-text-3` |
| `bg-[var(--ubm-color-surface-2)]`（旧互換 alias / runtime stale） | `bg-surface-2` |
| `bg-[var(--ubm-color-primary)]`（未定義） | `bg-accent` |
| `text-[var(--ubm-color-on-primary)]`（未定義） | `text-panel` |
| `border-[var(--ubm-color-border)]`（旧互換 alias / runtime stale） | `border-border` |

> ライン番号は task-05 報告時の参考値。Phase 5 で実コードを grep し最終決定する。

## 命名齟齬の解消方針（FB-CRONVL-001 類似）

`--ubm-color-fg-muted` は 09b 旧互換 mapping には存在するが、runtime consumer では `text-text-3` に正規化する。選択肢:

- (a) SSOT に新 token 追加（`--ubm-color-fg-muted: var(--ubm-color-text-muted)`）→ SSOT 変更 = 別 PR 必要
- (b) consumer 側を `text-text-3`（= `--ubm-color-text-muted` bridge）に置換 → 本 task のスコープ内

**(b) を採用**。理由: SSOT 変更を伴わず命名一貫性を回復できる。`fg-muted` という呼称は SSOT 用語 `text-muted` に統合する。

## 副次対象（grep で同パターンがある場合のみ）

- `apps/web/app/global-error.tsx`
- `apps/web/app/not-found.tsx`
- `apps/web/app/loading.tsx`

Phase 5 冒頭で `rg -n 'text-\[var\(|bg-\[var\(|border-\[var\(|fg-muted|ubm-color-(primary|on-primary|border|surface-2)' apps/web/app/*.tsx` を実行し、対象を確定する。

## 状態所有権

- token 定義: `apps/web/src/styles/tokens.css`（task-08 mirror）
- utility bridge: `apps/web/src/styles/globals.css` `@theme inline`（task-09）
- consumer: `apps/web/app/error.tsx` / `not-found.tsx` / `loading.tsx`（boundary 群）

本 task で touch する layer は **consumer のみ**。SSOT / bridge は不変。

## 設計レビュー観点

| 観点 | 評価 |
|------|------|
| 価値性 | CI gate 通過 + 命名一貫性 |
| 実現性 | className 単純置換 |
| 整合性 | SSOT / bridge 不変、consumer のみ |
| 運用性 | grep gate で再発防止、Phase 11 screenshot と task-18 downstream visual baseline で regression を検知 |
