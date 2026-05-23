# Phase 11: 手動テスト（VISUAL）

## タスク分類

**UI task / VISUAL** — HomePage に visible section を追加するため、screenshot capture を必須とする。

## screenshot 計画

`outputs/phase-11/screenshot-plan.json`:

```json
{
  "mode": "VISUAL",
  "taskId": "integration-fixes-i04-homepage-cta-implementation",
  "captures": [
    {
      "name": "homepage-call-to-action-cta-desktop.png",
      "route": "/",
      "viewport": { "width": 1280, "height": 800 },
      "selector": "[data-component=\"call-to-action-cta\"]",
      "tc": "TC-V01"
    },
    {
      "name": "homepage-call-to-action-cta-mobile.png",
      "route": "/",
      "viewport": { "width": 390, "height": 844 },
      "selector": "[data-component=\"call-to-action-cta\"]",
      "tc": "TC-V02"
    },
    {
      "name": "homepage-full-with-cta-desktop.png",
      "route": "/",
      "viewport": { "width": 1280, "height": 800 },
      "selector": "main[data-page=\"home\"]",
      "tc": "TC-V03"
    }
  ]
}
```

## capture 手順

```bash
PUBLIC_API_BASE_URL=http://127.0.0.1:8787 \
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 \
INTERNAL_API_BASE_URL=http://127.0.0.1:8787 \
pnpm -F "@ubm-hyogo/web" dev --hostname 127.0.0.1 --port 3000

pnpm exec playwright install chromium
# Playwright で http://127.0.0.1:3000 にアクセスし、上記 3 件を撮影
# 出力先: outputs/phase-11/screenshots/
```

local mock API (`127.0.0.1:8787`) は `/public/stats` / `/public/members` / `/public/form-preview` のみを返す。

## 3 層評価

| 層 | チェック項目 |
|----|-------------|
| Semantic | section 順序（Hero → Stats → ZoneIntro → Timeline → featured-members?? → CallToActionCTA → Footer） |
| Visual | dark surface（`var(--ubm-color-text)` ベース）+ panel 色のテキスト、prototype L136-149 と DOM 同型、CTA button が "accent" 色で目立つ |
| AI UX | "FOR MEMBERS" eyebrow → h2 → body → CTA の視線導線、外部リンクであることが clear |

## NON_VISUAL 宣言

該当なし（本タスクは VISUAL）。

## manual-test-result.md に記録する事項

- 撮影 3 件の screenshot 名（canonical 名）
- prototype との視覚的差分（あれば）
- dev server での目視確認結果（route `/` を開いて section の有無・hover 等）
- 既知の制限（dark variant token が不足する場合の暫定対応）

## 完了条件

- [x] screenshots/ に PNG 3 件配置
- [x] manual-test-result.md に上記 4 項目を記録
- [x] prototype と DOM 階層が同型（section → inner flex row → copy block + CTA button）

## 成果物

- `outputs/phase-11/screenshot-plan.json`
- `outputs/phase-11/screenshots/homepage-call-to-action-cta-desktop.png`
- `outputs/phase-11/screenshots/homepage-call-to-action-cta-mobile.png`
- `outputs/phase-11/screenshots/homepage-full-with-cta-desktop.png`
- `outputs/phase-11/manual-test-result.md`
