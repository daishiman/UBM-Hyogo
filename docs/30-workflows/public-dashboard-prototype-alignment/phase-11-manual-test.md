---
実装区分: 実装仕様書
状態: runtime_pending
Phase: 11
作成日: 2026-05-26
task_id: public-dashboard-prototype-alignment
task_type: UI task
visual_category: VISUAL
親: [index.md](./index.md)
前: [phase-10-final-review.md](./phase-10-final-review.md)
次: [phase-12-documentation.md](./phase-12-documentation.md)
---

# Phase 11: 手動テスト (VISUAL)

## 1. task 分類確認

| 項目 | 値 |
| --- | --- |
| taskType | `UI task` |
| visualEvidence | `VISUAL` |
| visualMode | `screenshot` (Playwright headed + 手動目視) |
| implementationMode | `verify_existing` (一部 `new`) |
| 評価層 | Semantic + Visual + AI UX (3 層) |
| 環境 | (1) staging deploy 後 / (2) local `pnpm dev` |

## 2. 環境準備

### 2.1 Staging

| 項目 | 値 |
| --- | --- |
| URL | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/` |
| auth | 不要 (public route) |
| deploy | Phase 11 は local/manual evidence を取得する。Phase 13 後の staging refresh は user-gated post-PR evidence として分離 |

### 2.2 Local

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
# http://localhost:3000/
```

empty state 検証: `apps/api` を起動しない or `apps/web/.env.local` で `API_BASE_URL` を不到達 endpoint に差し替え。

## 3. Screenshot 計画 (4 viewport × 1 key screen + 状態 2 = 計 6 枚)

### 3.1 viewport

| key | width | height | device |
| --- | --- | --- | --- |
| mobile | 375 | 812 | iPhone X |
| tablet | 768 | 1024 | iPad portrait |
| laptop | 1024 | 768 | small laptop |
| desktop | 1440 | 900 | standard desktop |

### 3.2 key screen

| key | URL |
| --- | --- |
| home | `/` |

### 3.3 canonical 名

形式: `home-<viewport>.png` (normal) + `home-empty-<viewport>.png` (empty)

| # | filename | 状況 |
| --- | --- | --- |
| 1 | `home-mobile.png` | normal (members≥6, recentMeetings≥1) |
| 2 | `home-tablet.png` | normal |
| 3 | `home-laptop.png` | normal |
| 4 | `home-desktop.png` | normal |
| 5 | `home-empty-desktop.png` | members=0, recentMeetings=0 |
| 6 | `home-empty-mobile.png` | 同上 mobile |

合計 **6 枚**。保存先 `docs/30-workflows/public-dashboard-prototype-alignment/outputs/phase-11/`.

## 4. screenshot-plan.json 雛形

`outputs/phase-11/screenshot-plan.json`:

```json
{
  "taskId": "public-dashboard-prototype-alignment",
  "mode": "VISUAL",
  "visualCategory": "VISUAL",
  "baseUrl": "https://ubm-hyogo-web-staging.daishimanju.workers.dev",
  "auth": { "type": "none" },
  "viewports": [
    { "key": "mobile",  "width": 375,  "height": 812 },
    { "key": "tablet",  "width": 768,  "height": 1024 },
    { "key": "laptop",  "width": 1024, "height": 768 },
    { "key": "desktop", "width": 1440, "height": 900 }
  ],
  "screens": [
    { "key": "home", "url": "/" }
  ],
  "scenarios": [
    {
      "key": "normal",
      "filenamePattern": "home-{viewport}.png"
    },
    {
      "key": "empty",
      "apiMock": { "members": { "items": [] }, "stats": { "recentMeetings": [] } },
      "viewports": ["desktop", "mobile"],
      "filenamePattern": "home-empty-{viewport}.png"
    }
  ],
  "outputDir": "docs/30-workflows/public-dashboard-prototype-alignment/outputs/phase-11/"
}
```

## 5. 3 層評価

### 5.1 Semantic 評価

| 観点 | 期待 |
| --- | --- |
| heading 階層 | `h1` 1 個 (Hero), `h2` per section (Stats=sr-only / AboutUbm×2 / Featured / Timeline) |
| role | section = `region` (implicit via aria-labelledby), CTA = link |
| aria-label | Hero accent は `aria-hidden="true"` |
| 文言 | prototype `pages-public.jsx` L11-152 と一致 (microcopy 差は MINOR) |

### 5.2 Visual 評価 (vs prototype)

| 観点 | 許容差 |
| --- | --- |
| primary color | OKLch token 完全一致 (HEX 直書きなら fail) |
| Hero serif font | size 54px ±2px、letter-spacing -0.03em |
| Stats grid | 4 列 (desktop) / 2 列 (laptop) / 1 列 (mobile) breakpoint 整合 |
| About grid | 2 列 (≥768px) / 1 列 (<768px) |
| spacing | prototype rhythm ±4px |
| iconography | 文字符号 (`→`, `▶`) のみ。size ±2px は MINOR |

### 5.3 AI UX 評価

| 観点 | 期待 |
| --- | --- |
| 第一印象 | Hero card + radial accent + serif h1 が prototype と同等 |
| 流入導線 | primary CTA「メンバー一覧を見る」 → `/members` |
| 二次導線 | 「全員見る」「会員ログイン」が混乱なく配置 |
| 空状態 | members=0 / recentMeetings=0 で EmptyState が業務文脈ある文言で表示 |
| sync badge | `badge-sync` の dot が動的に見える / static でも視認可能 |

## 6. 期待結果 / 失敗時挙動

| シナリオ | 期待 |
| --- | --- |
| 全 API 正常 | 6 section (Hero/Stats/AboutUbm/Featured/Timeline/CTA) が prototype 順に render |
| members=0 | Featured section の heading は表示、本体は EmptyState |
| recentMeetings=0 | Timeline section の heading + chip は表示、本体は EmptyState |
| API 500 | `apps/web/app/(public)/error.tsx` (issue-880) boundary に伝播 (本 PR の責務外) |

## 7. 実施手順

1. local dev server または user-gated staging preview が利用可能になったら本 Phase に着手
2. `outputs/phase-11/screenshot-plan.json` を確定
3. Playwright headed (or `playwright test --headed`) で normal シナリオ 4 枚を取得
4. mock データで empty シナリオ 2 枚を取得
5. prototype `pages-public.jsx` L4-152 と並べて Semantic/Visual/AI UX で評価
6. 差を `outputs/phase-11/manual-test-result.md` に記録

## 8. 出力 (Phase 11)

| Path | 内容 |
| --- | --- |
| `outputs/phase-11/screenshot-plan.json` | §4 |
| `outputs/phase-11/home-*.png` (6 枚) | screenshot |
| `outputs/phase-11/manual-test-result.md` | 3 層評価結果 / blocker / MINOR / VISUAL 判定 |
| `outputs/phase-11/route-200-check.md` | `/` の HTTP status 確認結果 |

## 9. テストケース

| TC-ID | 対象 | Evidence |
| --- | --- | --- |
| TC-VIS-001 | `/` home normal | `outputs/phase-11/home-*.png` (4 viewport) |
| TC-VIS-002 | `/` home empty (members=0, meetings=0) | `outputs/phase-11/home-empty-*.png` (2 viewport) |
| TC-VIS-003 | `/` HTTP status | `outputs/phase-11/route-200-check.md` |
| TC-VIS-004 | 3 layer semantic / visual / AI UX review | `outputs/phase-11/manual-test-result.md` |

## 10. 画面カバレッジマトリクス

| Screen | Desktop | Tablet | Mobile | Empty |
| --- | --- | --- | --- | --- |
| Home (`/`) | required | required | required | required (desktop/mobile) |

追加成果物:

- `outputs/phase-11/screenshot-coverage.md`
- `outputs/phase-11/phase11-capture-metadata.json`

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 11
- workflow_state: `spec_created`

## 目的

VISUAL evidence と manual checks で `/` UI alignment の受入条件を確認する。

## 実行タスク

- screenshot plan に従って 6 枚の evidence を取得する
- `/` の HTTP status と empty 表示を確認する
- semantic / visual / AI UX の 3 層評価を記録する

## 参照資料

- `phase-4-test-plan.md`
- `phase-10-final-review.md`
- `.claude/skills/task-specification-creator/references/phase-11-guide.md`

## 成果物/実行手順

- `outputs/phase-11/` 配下に screenshots、route check、manual result、coverage、metadata を配置する

## 統合テスト連携

- Phase 4 / 6 の TC-ID と Phase 11 screenshot evidence を Phase 12 compliance check で照合する

## 完了条件

- [ ] 6 枚の screenshot がすべて取得済み (canonical 名)
- [ ] `screenshot-plan.json` が確定
- [ ] `/` が staging で HTTP 200
- [ ] members=0 / meetings=0 でも `/` が 200 (EmptyState 動作確認)
- [ ] 3 層評価で blocker 0 件 (検出時は Phase 5-8 へ差し戻し)
- [ ] `manual-test-result.md` が出力されている
