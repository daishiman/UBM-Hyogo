# Phase 11: 手動テスト結果（VISUAL）

## 撮影状況

| ファイル名 | 状態 | 検証内容 |
|------------|------|----------|
| `screenshots/homepage-call-to-action-cta-desktop.png` | PASS | 1280x800 / CTA section crop |
| `screenshots/homepage-call-to-action-cta-mobile.png` | PASS | 390x844 / CTA section crop |
| `screenshots/homepage-full-with-cta-desktop.png` | PASS | 1280x800 / full page |

## 実行環境

```bash
# mock public API
node - <<'NODE'
# /public/stats, /public/members, /public/form-preview を 127.0.0.1:8787 で返す一時サーバ
NODE

PUBLIC_API_BASE_URL=http://127.0.0.1:8787 \
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 \
INTERNAL_API_BASE_URL=http://127.0.0.1:8787 \
pnpm -F "@ubm-hyogo/web" dev --hostname 127.0.0.1 --port 3000

pnpm exec playwright install chromium
node - <<'NODE'
# Playwright chromium で screenshot-plan.json の 3 capture を保存
NODE
```

## 属性検証

Playwright capture 時に CTA link の外部リンク属性を検証した。

| Capture | href | target | rel |
|---------|------|--------|-----|
| desktop CTA | CLAUDE.md 固定 responderUrl | `_blank` | `noopener noreferrer` |
| mobile CTA | CLAUDE.md 固定 responderUrl | `_blank` | `noopener noreferrer` |
| full page | CLAUDE.md 固定 responderUrl | `_blank` | `noopener noreferrer` |

## 3 層評価

| 層 | チェック項目 | 結果 |
|----|-------------|------|
| Semantic | section 順序（Hero → Stats → ZoneIntro → Timeline → featured-members → CallToActionCTA → Footer） | PASS（`apps/web/app/page.tsx` の JSX 順序 + full-page screenshot） |
| Visual | dark surface + panel 色テキスト、prototype L136-149 と同型、CTA button が accent 色 | PASS（desktop / mobile PNG 保存済み） |
| AI UX | "FOR MEMBERS" eyebrow → h2 → body → CTA の視線導線、外部リンク視覚明示 | PASS（`Icon name="external-link"` 追加、PNG 保存済み） |

## 既知の制限

- 実 production/staging ではなく local mock API による VISUAL evidence。API 契約は `PublicStatsViewZ` / `PublicMemberListViewZ` 相当の形で返し、D1 直接アクセスはしていない。
- token prefix の差異により phase-2.md の CSS 変数名から `--ubm-*` prefix 付きへマッピング
  （outputs/phase-2/design.md に記録）。
