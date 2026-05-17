[実装区分: 実装仕様書]

# Phase 11: 手動テスト（VISUAL 51 baseline）

## 目的

取得した 51 baseline PNG を目視確認し、各画面が「production-ready な状態」を映していることを保証する。

## 1. 確認手順

1. `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/` 配下の 51 PNG を順次 open
2. 各 PNG について以下を確認:
   - 画面が真っ白 / エラー画面 / 404 になっていない (`not-found` slug を除く)
   - skeleton / spinner が映り込んでいない
   - 動的 timestamp / 個人情報が映り込んでいない (mask が効いている)
   - 想定 viewport 寸法に一致 (desktop=1280x800 / tablet=768x1024 / mobile=390x844)
   - OKLch token が反映されている（HEX 直書きや old palette が混入していない）

## 2. evidence フォーマット

`outputs/phase-11/evidence/baseline-list.md` に以下を記録:

```markdown
# baseline-list

| # | slug | viewport | filename | sha256 | 目視判定 |
|---|------|----------|----------|--------|---------|
| 1 | root | desktop | full-visual-root-desktop-visual-full-chromium-desktop.png | <sha> | OK |
| 2 | root | tablet | full-visual-root-tablet-visual-full-chromium-tablet.png | <sha> | OK |
| ... | ... | ... | ... | ... | ... |
| 51 | not-found | mobile | full-visual-not-found-mobile-visual-full-chromium-mobile.png | <sha> | OK (expected 404) |
```

sha256 生成:
```bash
cd apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/
shasum -a 256 *.png
```

## 3. NG が出た場合の対応

| 症状 | 対応 |
|------|------|
| skeleton 映り込み | `visual-routes.ts` の該当 entry に `waitFor` selector を追加 → 再取得 |
| 動的要素映り込み | 該当 component に `data-visual-mask` 属性追加 → 再取得 |
| 想定外画面 | 該当 route のページ実装を確認、必要なら別 task として escalation |

## 4. 成果物

- 本ファイル `phase-11-manual-test.md`
- `outputs/phase-11/evidence/baseline-list.md`（実行時生成、51 行）
