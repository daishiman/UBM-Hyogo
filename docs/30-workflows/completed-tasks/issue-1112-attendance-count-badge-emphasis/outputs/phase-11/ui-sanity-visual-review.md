# Phase 11 — UI Sanity / 視覚レビュー計画（Apple HIG 観点）

`[visualEvidence: VISUAL_ON_EXECUTION / 実描画確認: local Playwright captured・staging user-gated]`

本ドキュメントは、出席人数バッジの 3 段階色強調（none / normal / high）について、Apple Human Interface Guidelines（HIG）の観点で行う視覚レビュー結果である。実描画（CSS var → 実 RGB）は local Playwright fixture で確認済み。staging `/admin/meetings` の production-equivalent 追加確認は user-gated とする。

## レビュー対象

`/admin/meetings` 開催日タイムラインの `.admin-timeline__heading` 内 出席人数バッジ:

- `<span className="ui-badge" data-attendance-level="none">` → neutral（0名）
- `<span className="ui-badge" data-attendance-level="normal">` → accent-soft（1〜9名）
- `<span className="ui-badge" data-attendance-level="high">` → success-bg（10名以上）

## HIG 観点チェック項目（local Playwright 実描画で確認）

### 1. 色のコントラスト（Color & Contrast）

- [x] 各バッジのテキストと背景のコントラストが十分（小さなテキストでも判読可能）。
- [x] none（neutral）が「未登録/不在」を、過度に警告的に見せず控えめに表現できている。
- [x] high（success-bg）が「多数出席」をポジティブな強調として表現し、エラー/警告色と混同されない。
- [x] 色のみに依存せず、人数の数値そのものもバッジ内で読める（色覚多様性への配慮）。

### 2. 情報階層（Visual Hierarchy）

- [x] 3 段階の強調が「0名 < 1〜9名 < 10名以上」の重みづけと一致し、high が最も視線を引く。
- [x] バッジが見出し（meeting タイトル/日付）より目立ちすぎず、補助情報としての階層を保つ。
- [x] none のバッジが背景に沈みすぎて存在自体が見えなくなっていない（0名であることも情報）。

### 3. 一覧スキャン性（Scannability）

- [x] タイムラインを上から流し読みした際、出席が多い回（high）が一目で識別できる。
- [x] 隣接する開催回でレベルが異なる場合、色差が十分でレベルの違いが即座に判別できる。
- [x] バッジのサイズ・余白がタイムラインのリズムを乱さず、行間スキャンを妨げない。

### 4. 3 段階の色差判別性（最重要）

- [x] none / normal / high の 3 色が、隣接表示でも互いに明確に区別できる（特に normal と high が近すぎないこと）。
- [x] デスクトップ幅で色差が保たれる。モバイルは同一 CSS rule のため追加 staging/mobile capture で再確認可能。
- [x] design token（OKLch 正本）由来の neutral / accent-soft / success-bg が意図通りに解決され、HEX 直書きの混入がない。

## 判定方針

- 各 TC（TC-BADGE-01/02/03）の local screenshot 取得後、本チェック項目を目視で評価済み。
- 色差が不十分・階層が不自然などの所見は無し。token もしくは強調強度の追加調整は不要。
- staging visual review は production-equivalent runtime の追加確認として pending。
