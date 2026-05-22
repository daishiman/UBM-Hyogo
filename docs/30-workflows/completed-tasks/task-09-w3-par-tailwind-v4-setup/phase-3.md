# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| 名称 | 設計レビュー |
| タスクID | TASK-W3-TAILWIND-V4-SETUP-001 |
| 状態 | implemented-local |
| 実装区分 | 実装仕様書 |

## 目的

Phase 2 設計を 4 観点（v4 互換性 / Workers ビルド互換性 / token prefix 衝突 / fallback 戦略）で監査し、Phase 4 着手前に設計を凍結する。

## レビュー観点と判定

### R3-1. Tailwind v4 互換性

| 項目 | 確認内容 | 判定基準 |
| --- | --- | --- |
| `@import "tailwindcss"` の位置 | globals.css の最初 | OK / NG |
| `@theme inline` キーワード | bridge ブロックに付与されているか | inline 必須（dark mode `[data-theme]` 切替に追従させるため） |
| `tailwind.config.ts` の theme 拡張 | `theme` キーが空であること | v4 CSS-first 原則 |
| `@plugin` directive | 本タスクでは未使用 | MVP では plugin 導入しない |

### R3-2. Cloudflare Workers ビルド互換性（最大リスク）

| 項目 | 確認内容 |
| --- | --- |
| `@opennextjs/cloudflare` の PostCSS pipeline 互換 | Phase 9 で `pnpm --filter @ubm-hyogo/web build:cloudflare` exit 0 を実行確認 |
| Workers preview 起動 | Phase 11 で `preview:cloudflare` 起動 + `/` 200 |
| 失敗時の fallback | `tailwindcss` を v4.0.x stable 最新パッチに pin、それでも fail なら v4.0.0 → 4.0.x の patch 範囲内で互換調査 |

### R3-3. token prefix 衝突確認

| 項目 | 確認内容 |
| --- | --- |
| `--ubm-*` prefix 重複 | 既存 `apps/web/app/styles.css` 内の CSS custom properties と衝突しないか grep |
| Tailwind 既定 `--color-*` 直接定義禁止 | `tokens.css` 内に `--color-*` が存在しないことを grep で確認 |
| @theme inline 内のみ `--color-*` 宣言 | globals.css 以外に `--color-*` 直接定義がないか grep |

### R3-4. fallback 戦略

| 項目 | 確認内容 |
| --- | --- |
| `@supports not (color: oklch(0 0 0))` の宣言 | tokens.css に存在 |
| fallback 内の HEX | accent / ok / warn / danger / info の最低 5 色が sRGB 近似で定義 |
| HEX grep gate との整合 | `@supports not` ブロック内 HEX は CI gate の例外として許可（Phase 4 のテストでも除外パターンを定義） |

## 既知リスクと緩和策

| ID | リスク | 影響 | 緩和策 |
| --- | --- | --- | --- |
| RISK-1 | Tailwind v4 と `@opennextjs/cloudflare` の PostCSS pipeline 非互換 | build:cloudflare 失敗 | Phase 9 で `build:cloudflare` を DoD 必須化、失敗時は v4 stable 最新パッチへ pin |
| RISK-2 | OKLch を解釈できない古い Safari 系 | 一部色が透明化 | tokens.css の `@supports not` fallback を維持 |
| RISK-3 | `app/styles.css` 撤去で既存ページの prototype class が壊れる | UI 崩れ | task-10 と直列実行（本 PR では崩れる前提）、Phase 11 main.md に既知影響として記録 |
| RISK-4 | Tailwind v4 の `@theme` 仕様変更（v4.0.x → v4.1.x） | 後追い修正 | v4.0.x で固定、minor 更新は別 PR |
| RISK-5 | `paths` 追加で既存 import が壊れる | typecheck fail | Phase 9 で `pnpm typecheck` 0 error を gate |

## ロールバック手順

```bash
git revert <commit-of-task-09>
mise exec -- pnpm install --force
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
```

リバート後は `apps/web/app/styles.css` が復活するため、prototype class 依存ページが再び動作する。

## 完了条件

- [ ] R3-1〜R3-4 のレビュー結果が `outputs/phase-3/review-result.md` に記録されている
- [ ] RISK-1〜RISK-5 の緩和策が確定している
- [ ] ロールバック手順が文書化されている
- [ ] Phase 2 設計が凍結（変更があれば Phase 2 を更新してから Phase 4 へ進む）

## 成果物

- `outputs/phase-3/main.md`
- `outputs/phase-3/review-result.md`
- `outputs/phase-3/risk-and-rollback.md`
