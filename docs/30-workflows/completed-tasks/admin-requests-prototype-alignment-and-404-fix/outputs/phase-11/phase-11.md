# Phase 11 — 手動テスト（3 層: Semantic / Visual / AI UX）

> visual_mode = VISUAL のため Phase 11 screenshot は必須。canonical 名は `<component>-<state>.png` 規約に従う（FB-LLM-MOD-05-001）。

---

## 1. Semantic（DOM / a11y）

| 項目 | 検証 |
|------|------|
| h1 単独 | `document.querySelectorAll('h1').length === 1`（page.tsx 由来のみ） |
| aria-labelledby 紐付け | section の `aria-labelledby="admin-requests-filter-h"` に対し対応する id を持つ要素が存在 |
| ボタン aria-pressed | フィルター切替で `true`/`false` 切替 |
| dialog focus trap | RequestConfirmDialog 開閉で focus が dialog 内に閉じる |

実行: `mise exec -- pnpm --filter web exec playwright test --grep="semantic"`。

---

## 2. Visual（Playwright local authenticated fixture）

| screenshot | 状態 | canonical name |
|-----------|------|----------------|
| 公開停止/再公開タブ | local fixture items=3 | `admin-requests-visibility-populated-linux.png` |

local 証跡:
`outputs/phase-11/screenshots/admin-requests-visibility-populated-linux.png`。
Playwright report:
`outputs/phase-11/playwright-report/results.json`。

staging baseline 正本（user-gated）: `*-linux.png`。

`outputs/phase-11/metadata.json`:
```json
{
  "screenshots": [
    {"file":"admin-requests-visibility-populated-linux.png","tc":"TC-B-LOCAL-01","state":"visibility_request populated local fixture"}
  ]
}
```

---

## 3. AI UX（プロトタイプ整合性レビュー）

| 観点 | 期待 |
|------|------|
| 視覚密度 | 他 admin 画面（members / meetings / schema）と同等 |
| typography rhythm | `h-section` / `h-card` で stack 整合 |
| color contrast | OKLch token のみで AA 達成 |
| affordance | 承認 / 却下 ボタンが btn-row でグループ化、destructive は color token で区別 |

---

## 4. manual-test-result.md（Phase 12 で記録）

```markdown
## /admin/requests manual test 2026-05-27
- Semantic: PASS (`page-enter.stack-lg`, `page-head`, `card`, `h-card` locator assertions)
- Visual: PASS (local authenticated desktop Chromium screenshot)
- AI UX: PASS (admin shell 整合)
- Staging baseline: pending_user_approval
```

---

## 5. フィードバックループ

Phase 11 で HIGH 問題が検出された場合は `docs/30-workflows/completed-tasks/admin-requests-prototype-alignment-and-404-fix/unassigned-task/` に自動生成する（generate-unassigned-task）。0 件想定。

---

## 6. DoD

- [x] semantic 全 pass
- [x] local visual screenshot 1 枚採取
- [x] AI UX レビュー記録
- [ ] staging visual baseline 2 枚採取 + diff = 0（user-gated）
