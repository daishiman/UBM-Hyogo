# Phase 11: 手動テスト

## 4 viewport 評価ポイント

| viewport | 幅 | 評価点 |
|---------|----|--------|
| mobile | 375px | sidebar 非表示 (CSS `@media` でプロトタイプ準拠) / main padding 維持 |
| tablet | 768px | sidebar 表示 / 13 nav item 折り返しなし / badge 視認 |
| desktop | 1280px | sidebar 272px 固定 / 全 nav 表示 / footer user-chip 2 行 |
| wide | 1536px | content-area max-width 1440 中央寄せ |

## screenshot 撮影リスト

| ファイル名 | 状況 |
|------------|------|
| `task-A-sidebar-desktop-1280.png` | active = `/admin` |
| `task-A-sidebar-desktop-1280-members-active.png` | active = `/admin/members` |
| `task-A-sidebar-tablet-768.png` | tablet sidebar 表示 |
| `task-A-sidebar-mobile-375.png` | sidebar 非表示確認 |
| `task-A-sidebar-schema-badge.png` | schemaDiffCount=3 (`status="queued"` fixture) を再現 |
| `task-A-topbar-removed-1280.png` | topbar header DOM 不在を devtools で証跡 |

## canonical evidence path

`docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/outputs/phase-11/` 配下に次を配置する。

| Artifact | Status |
| --- | --- |
| `manual-test-result.md` | present / local Playwright fixture captured |
| `screenshot-plan.json` | present |
| `ui-sanity-visual-review.md` | present / captured |
| `phase11-capture-metadata.json` | present / captured |
| 上記 6 PNG | present / captured |

## 撮影手順 (概要)

1. local Playwright fixture で admin session を発行する
2. `PLAYWRIGHT_EVIDENCE_TASK=task-17-admin-schema-conflicts-audit` で schema diff fixture (`queued` 3 件) を有効化する
3. `apps/web/playwright/tests/admin-shell-topbar-sidebar-integration.spec.ts` で各 viewport / route を撮影する
4. mobile viewport で sidebar 非表示と main padding を確認する
5. 各 png と metadata / visual review を `outputs/phase-11/` に保存する

## 合否判定

- 全 6 screenshot 取得完了
- AC-2 (active 1 件のみ) / AC-3 (3 group) / AC-4 (badge on/off) / AC-5 (footer 構成) が目視で確認できること
- DoD ブロック (phase-13-pr.md) の staging deploy 項目 check
