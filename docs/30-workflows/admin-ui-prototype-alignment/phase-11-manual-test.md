---
実装区分: 実装仕様書
状態: pending_user_gate
Phase: 11
作成日: 2026-05-23
task_id: admin-ui-prototype-alignment
task_type: UI task
visual_category: VISUAL
親: [index.md](./index.md)
前: [phase-10-final-review.md](./phase-10-final-review.md)
次: [phase-12-documentation.md](./phase-12-documentation.md)
---

# Phase 11: 手動テスト (VISUAL)

## 1. task 分類確認

| 項目 | 値 |
| ---- | ---- |
| taskType | `UI task` |
| visualEvidence | `VISUAL` |
| visualMode | `screenshot` (Playwright headed + 手動目視) |
| implementationMode | `new` (一部 `verify_existing`) |
| 評価層 | Semantic + Visual + AI UX (3 層) |
| 環境 | (1) staging deploy 後 / (2) local `pnpm dev` |

## 2. 環境準備

### 2.1 Staging

| 項目 | 値 |
| ---- | ---- |
| URL | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin` |
| admin account | `manjumoto.daishi@senpai-lab.com` |
| 一般会員 (degrade 確認用) | `manju.manju.03.28@gmail.com` |
| deploy | Phase 11 は local/manual evidence を取得する。Phase 13 後の staging refresh は user-gated post-PR evidence として分離 |

### 2.2 Local

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
# http://localhost:3000/admin
```

API down 状態の検証: `apps/api` を起動しない or `apps/web/.env.local` で `API_BASE_URL` を不到達 endpoint に差し替え。

## 3. Screenshot 計画 (4 viewport × 5 key screen = 20 枚)

### 3.1 viewport

| key | width | height | device |
| ---- | ---- | ---- | ---- |
| mobile | 375 | 812 | iPhone X |
| tablet | 768 | 1024 | iPad portrait |
| laptop | 1024 | 768 | small laptop |
| desktop | 1440 | 900 | standard desktop |

### 3.2 key screen

| key | URL |
| ---- | ---- |
| dashboard | `/admin` |
| members | `/admin/members` |
| tags | `/admin/tags` |
| schema | `/admin/schema` |
| requests | `/admin/requests` |

### 3.3 canonical 名 (FB-LLM-MOD-05-001 対応)

形式: `admin-<screen>-<viewport>.png`

| # | filename |
| ---- | ---- |
| 1 | `admin-dashboard-mobile.png` |
| 2 | `admin-dashboard-tablet.png` |
| 3 | `admin-dashboard-laptop.png` |
| 4 | `admin-dashboard-desktop.png` |
| 5 | `admin-members-mobile.png` |
| 6 | `admin-members-tablet.png` |
| 7 | `admin-members-laptop.png` |
| 8 | `admin-members-desktop.png` |
| 9 | `admin-tags-mobile.png` |
| 10 | `admin-tags-tablet.png` |
| 11 | `admin-tags-laptop.png` |
| 12 | `admin-tags-desktop.png` |
| 13 | `admin-schema-mobile.png` |
| 14 | `admin-schema-tablet.png` |
| 15 | `admin-schema-laptop.png` |
| 16 | `admin-schema-desktop.png` |
| 17 | `admin-requests-mobile.png` |
| 18 | `admin-requests-tablet.png` |
| 19 | `admin-requests-laptop.png` |
| 20 | `admin-requests-desktop.png` |

### 3.4 degrade UX screenshot (追加 5 枚)

| # | filename | 状況 |
| ---- | ---- | ---- |
| 21 | `admin-dashboard-degrade-desktop.png` | dashboard API 500 |
| 22 | `admin-dashboard-degrade-mobile.png` | 同上 mobile |
| 23 | `admin-members-degrade-desktop.png` | members API 500 |
| 24 | `admin-tags-degrade-desktop.png` | tags API 500 |
| 25 | `admin-schema-degrade-desktop.png` | schema API 500 |

合計 **25 枚**。保存先 `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-11/`.

## 4. screenshot-plan.json 雛形

`outputs/phase-11/screenshot-plan.json`:

```json
{
  "taskId": "admin-ui-prototype-alignment",
  "mode": "VISUAL",
  "visualCategory": "VISUAL",
  "baseUrl": "https://ubm-hyogo-web-staging.daishimanju.workers.dev",
  "auth": {
    "type": "magic-link",
    "account": "manjumoto.daishi@senpai-lab.com",
    "storageStatePath": "apps/web/playwright/.auth/admin.json"
  },
  "viewports": [
    { "key": "mobile",  "width": 375,  "height": 812 },
    { "key": "tablet",  "width": 768,  "height": 1024 },
    { "key": "laptop",  "width": 1024, "height": 768 },
    { "key": "desktop", "width": 1440, "height": 900 }
  ],
  "screens": [
    { "key": "dashboard", "url": "/admin" },
    { "key": "members",   "url": "/admin/members" },
    { "key": "tags",      "url": "/admin/tags" },
    { "key": "schema",    "url": "/admin/schema" },
    { "key": "requests",  "url": "/admin/requests" }
  ],
  "scenarios": [
    {
      "key": "normal",
      "filenamePattern": "admin-{screen}-{viewport}.png"
    },
    {
      "key": "degrade",
      "apiMock": { "status": 500, "path": "**/admin/**" },
      "screens": ["dashboard", "members", "tags", "schema"],
      "viewports": ["desktop", "mobile"],
      "filenamePattern": "admin-{screen}-degrade-{viewport}.png"
    }
  ],
  "outputDir": "docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-11/"
}
```

## 5. 3 層評価

### 5.1 Semantic 評価

| 観点 | 期待 |
| ---- | ---- |
| heading 階層 | `h1` 1 個 (page header), `h2` per section card |
| role | sidebar = `navigation`, table = `table`, queue list = `listbox` or `list` |
| aria-label | 各 section card に title 由来の aria-labelledby |
| 文言 | プロトタイプ `pages-admin.jsx` と一致 (microcopy 差は MINOR) |

### 5.2 Visual 評価 (vs プロトタイプ)

| 観点 | 許容差 |
| ---- | ---- |
| primary color | OKLch token 完全一致 (HEX 直書きなら fail) |
| spacing | プロトタイプ rhythm ±4px |
| typography | size token / weight token 一致 |
| iconography | プロトタイプと同種 (size ±2px は MINOR) |
| layout | grid breakpoint がプロトタイプと一致 |

### 5.3 AI UX 評価

| 観点 | 期待 |
| ---- | ---- |
| degrade 時の認知負荷 | 失敗 section が **赤系 (danger tone)** で他と区別、shell は無事 |
| recovery 導線 | エラー section 内に page reload 導線。retry button は v1 では出さない |
| error ID 視認 | 文字色 token (muted) + monospace、コピー可能 |
| sidebar 操作性 | 失敗 section があってもナビ可能 |
| 空状態 | 業務文脈ある文言 (汎用 "データなし" の濫用なし) |

## 6. 期待結果 / 失敗時 degrade UX

| シナリオ | 期待 |
| ---- | ---- |
| 全 API 正常 | プロトタイプと視覚整合、4 viewport で崩れなし |
| dashboard だけ 500 | `/admin` が 200。KPI section に `AdminSectionError` 赤系。Activity / Queue は通常 render。sidebar 健全。 |
| 全 API 500 | `/admin` が 200。3 section ともに `AdminSectionError`。shell / sidebar / breadcrumb 健全。 |
| 認証失効 | 認証導線 (login link) が section に出る or middleware で `/login?from=/admin` に redirect (既存挙動を維持) |
| network down | 同上 degrade、message に "ネットワーク" 文言 |

## 7. 実施手順

1. local dev server または user-gated staging preview が利用可能になったら本 Phase に着手
2. `outputs/phase-11/screenshot-plan.json` を確定
3. Playwright headed で normal シナリオ 20 枚を取得
4. API mock で degrade シナリオ 5 枚を取得
5. プロトタイプ `pages-admin.jsx` の該当セクションと並べ Semantic/Visual/AI UX で評価
6. 差を `outputs/phase-11/manual-test-result.md` に記録

## 8. 出力 (Phase 11)

| Path | 内容 |
| ---- | ---- |
| `outputs/phase-11/screenshot-plan.json` | 上記 §4 |
| `outputs/phase-11/admin-*.png` (25 枚) | screenshot |
| `outputs/phase-11/manual-test-result.md` | 3 層評価結果 / blocker / MINOR / VISUAL 判定 |
| `outputs/phase-11/staging-route-200-check.md` | 11 route の HTTP status 確認結果 |

## 9. DoD (Phase 11)

## テストケース

| TC-ID | 対象 | Evidence |
| --- | --- | --- |
| TC-VIS-001 | `/admin` dashboard normal/degrade | `outputs/phase-11/screenshots/admin-dashboard-*.png` |
| TC-VIS-002 | `/admin/members` table/filter | `outputs/phase-11/screenshots/admin-members-*.png` |
| TC-VIS-003 | `/admin/tags` queue/drawer | `outputs/phase-11/screenshots/admin-tags-*.png` |
| TC-VIS-004 | `/admin/schema` diff/history | `outputs/phase-11/screenshots/admin-schema-*.png` |
| TC-VIS-005 | `/admin/meetings` list/detail | `outputs/phase-11/screenshots/admin-meetings-*.png` |
| TC-VIS-006 | 11 route HTTP status | `outputs/phase-11/staging-route-200-check.md` |
| TC-VIS-007 | 3 layer semantic / visual / AI UX review | `outputs/phase-11/manual-test-result.md` |

## 画面カバレッジマトリクス

| Screen | Desktop | Tablet | Mobile | Degrade |
| --- | --- | --- | --- | --- |
| Dashboard | required | required | required | required |
| Members | required | required | required | required |
| Tags | required | required | required | required |
| Schema | required | required | required | required |
| Meetings | required | required | required | required |

追加成果物:

- `outputs/phase-11/screenshot-coverage.md`
- `outputs/phase-11/manual-test-checklist.md`
- `outputs/phase-11/phase11-capture-metadata.json`

## メタ情報

- task_id: `admin-ui-prototype-alignment`
- Phase: 11
- workflow_state: `implemented_local_runtime_pending`

## 目的

VISUAL evidence と manual checks で admin UI alignment の受入条件を確認する。

## 実行タスク

- screenshot plan に従って 25 枚の evidence を取得する
- 11 route の HTTP status と degrade 表示を確認する
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

- Phase 11 evidence inventory の `present` 行に対応する物理 file が揃っている

- [ ] 25 枚の screenshot がすべて取得済み (canonical 名)
- [ ] `screenshot-plan.json` が確定
- [ ] 11 route 全て staging で HTTP 200
- [ ] dashboard 全 API 500 状態でも `/admin` が 200 (degrade 動作確認)
- [ ] 3 層評価で blocker 0 件 (検出時は Phase 5-8 へ差し戻し)
- [ ] `manual-test-result.md` が出力されている
