[実装区分: 実装仕様書]

# Phase 4: テストプラン

## 目的

51 baseline の取得手順・retry 戦略・mask 方針・視覚検証項目を確定する。

---

## 入力

- `outputs/phase-2/design.md`
- `outputs/phase-3/design-review.md`

---

## 1. baseline 取得手順（ローカル）

```bash
# 1. 環境準備
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium

# 2. apps/web build（OpenNext Workers 互換 webpack）
mise exec -- pnpm --filter @ubm-hyogo/web build

# 3. baseline 初回生成
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=visual-full-chromium-desktop \
  --project=visual-full-chromium-tablet \
  --project=visual-full-chromium-mobile \
  --update-snapshots

# 5. 再実行で差分 0 確認
mise exec -- pnpm --filter @ubm-hyogo/web test:visual-full
```

> **重要**: baseline 初回生成は CI（ubuntu-latest）で行う。ローカル macOS で生成した baseline をコミットすると OS フォントレンダリング差で CI fail するため、必ず baseline update workflow 経由でリポジトリへ取り込む。

---

## 2. baseline 命名検証

51 baseline ファイル名は以下で全件列挙可能:

```bash
ls -1 apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/ | sort | wc -l
# => 51
```

ファイル名フォーマット regex: `^[a-z0-9-]+-(desktop|tablet|mobile)-visual-full-chromium-(linux|darwin|win32)\.png$`

---

## 3. retry 戦略

`apps/web/playwright.config.ts` の root `retries` は既存 W7 設定を継承（`process.env.CI ? 2 : 0`）。本タスクで上書きしない。

---

## 4. `expect.toHaveScreenshot` パラメータ

| パラメータ | 値 | 根拠 |
|-----------|-----|------|
| `fullPage` | `true` | スクロール込みの page 全体を baseline 化 |
| `maxDiffPixelRatio` | `0.02` | W7 から継承（root expect で既定） |
| `animations` | `'disabled'` | flaky 抑止 |
| `caret` | `'hide'` | input caret blink 抑止 |
| `scale` | `'css'` | DPR 影響排除 |
| `mask` | `[time, [data-visual-mask]]` | 動的時刻・動的画像を除外 |

---

## 5. mask 対象

| 種別 | selector | 理由 |
|------|----------|------|
| 時刻表示 | `time` element | 現在時刻が毎回異なる |
| 動的画像 | `[data-visual-mask]` 属性付き要素 | 個別マスク用 escape hatch |

将来追加候補（必要時 Phase 6 で実装）: ランダム ID 表示、外部 image proxy 経由のサムネ。

---

## 6. 視覚的検証項目（17 routes × 3 viewport）

| 項目 | 検証内容 |
|------|---------|
| layout | コンテナ幅・余白・grid 配置が viewport に応じて変化 |
| typography | font-size / line-height / font-family（Inter / Noto Sans JP） |
| color | OKLch tokens が反映（HEX 直書きなし） |
| icon / image | 仮画像ではない実コンテンツが表示 |
| navigation | header / footer / sidebar が viewport 適合 |
| empty state | データなし時の状態（admin/audit 等） |

---

## 7. 成果物

- `outputs/phase-4/test-plan.md`
