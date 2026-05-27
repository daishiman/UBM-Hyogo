# Phase 4 — テスト計画 (members-list-prototype-alignment)

## 1. テスト戦略

対象は `/members` の表示層のみ。現行 `PublicMemberListItem` contract に存在する字段だけで、component test / Playwright visual smoke / grep gate の 3 層を確認する。

## 2. Component Test Cases

| ID | 対象 | 確認内容 |
| --- | --- | --- |
| MC-01 | `MemberCard` | `density="list"` でも詳細リンクを維持し、occupation を表示する |
| MC-02 | `MemberCard` | zone がある場合は `data-role="zone"` chip、status がある場合は `data-role="status"` chip を表示する |
| MC-03 | `MemberCard` | occupation / location に `briefcase` / `map-pin` icon を付ける |
| MG-01 | `MemberGrid` | `density="list"` で `data-role="list-head"` と `MemberCard density="list"` を描画する |
| MF-01 | `MemberFilters` | TagPicker heading「タグで絞り込み」を描画し、既存 URL 更新挙動を維持する |
| ES-01 | `EmptyState` | `variant="compact"` で `data-variant="compact"` を出力する |

## 3. Playwright Visual Smoke

既存 spec `apps/web/playwright/tests/members-prototype-alignment.spec.ts` を current workflow root に向ける。

| evidence | path |
| --- | --- |
| comfy desktop | `outputs/phase-11/screenshots/EV-1-comfy-desktop.png` |
| dense desktop | `outputs/phase-11/screenshots/EV-2-dense-desktop.png` |
| list desktop | `outputs/phase-11/screenshots/EV-3-list-desktop.png` |
| comfy mobile | `outputs/phase-11/screenshots/EV-4-comfy-mobile.png` |
| empty desktop | `outputs/phase-11/screenshots/EV-5-empty-desktop.png` |
| header focus | `outputs/phase-11/screenshots/EV-6-header-focus.png` |

## 4. 実行コマンド

```bash
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web test -- MemberCard MemberGrid MemberFilters EmptyState
PLAYWRIGHT_EVIDENCE_TASK=members-list-prototype-alignment pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/members-prototype-alignment.spec.ts --project=desktop-chromium
```

## 5. DoD

- [x] 現行 contract にない `businessOverview` / list `tags` をテスト要求にしない
- [x] list density が `MemberGrid` 経由で描画され、`MemberTable` route branch に戻らないことを確認する
- [x] compact EmptyState と TagPicker heading の regression case を持つ
- [x] Playwright visual evidence path が current workflow root を指す
