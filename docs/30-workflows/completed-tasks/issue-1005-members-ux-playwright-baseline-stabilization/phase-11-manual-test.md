<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 11 -->

[実装区分: 実装仕様書]

# Phase 11 — 手動テスト

## 1. 目的

- `members-ux-clarity.spec.ts` を cold start で実行し、補正後 path へ visual evidence（24 PNG）を安定生成する。
- evidence は補正後 dir `outputs/phase-11/screenshots/` に保存し、PR レビュー用 evidence とする。
- 本 Phase の実 PNG / manual-test-result.md は本サイクル内で生成済み。

## 2. matrix / 24 PNG 計画

matrix = densities[comfy / dense / list] × states[filtered / empty] × viewports[mobile 375×800 / tablet 768×900 / desktop 1024×900 / wide 1440×1000] = 12 test / 24 PNG。
URL: filtered = `/members?density=<d>&tag=ai`、empty = `/members?density=<d>&q=zzz_no_match_zzz`（いずれも comfy は `density` クエリ省略）。

| # | viewport | density | state | URL クエリ | ファイル名 |
| - | -------- | ------- | ----- | ---------- | ---------- |
| 1 | mobile | comfy | filtered | `/members?tag=ai` | `members-ux-clarity-comfy-filtered-mobile.png` |
| 2 | tablet | comfy | filtered | `/members?tag=ai` | `members-ux-clarity-comfy-filtered-tablet.png` |
| 3 | desktop | comfy | filtered | `/members?tag=ai` | `members-ux-clarity-comfy-filtered-desktop.png` |
| 4 | wide | comfy | filtered | `/members?tag=ai` | `members-ux-clarity-comfy-filtered-wide.png` |
| 5 | mobile | comfy | empty | `/members?q=zzz_no_match_zzz` | `members-ux-clarity-comfy-empty-mobile.png` |
| 6 | tablet | comfy | empty | `/members?q=zzz_no_match_zzz` | `members-ux-clarity-comfy-empty-tablet.png` |
| 7 | desktop | comfy | empty | `/members?q=zzz_no_match_zzz` | `members-ux-clarity-comfy-empty-desktop.png` |
| 8 | wide | comfy | empty | `/members?q=zzz_no_match_zzz` | `members-ux-clarity-comfy-empty-wide.png` |
| 9 | mobile | dense | filtered | `/members?density=dense&tag=ai` | `members-ux-clarity-dense-filtered-mobile.png` |
| 10 | tablet | dense | filtered | `/members?density=dense&tag=ai` | `members-ux-clarity-dense-filtered-tablet.png` |
| 11 | desktop | dense | filtered | `/members?density=dense&tag=ai` | `members-ux-clarity-dense-filtered-desktop.png` |
| 12 | wide | dense | filtered | `/members?density=dense&tag=ai` | `members-ux-clarity-dense-filtered-wide.png` |
| 13 | mobile | dense | empty | `/members?density=dense&q=zzz_no_match_zzz` | `members-ux-clarity-dense-empty-mobile.png` |
| 14 | tablet | dense | empty | `/members?density=dense&q=zzz_no_match_zzz` | `members-ux-clarity-dense-empty-tablet.png` |
| 15 | desktop | dense | empty | `/members?density=dense&q=zzz_no_match_zzz` | `members-ux-clarity-dense-empty-desktop.png` |
| 16 | wide | dense | empty | `/members?density=dense&q=zzz_no_match_zzz` | `members-ux-clarity-dense-empty-wide.png` |
| 17 | mobile | list | filtered | `/members?density=list&tag=ai` | `members-ux-clarity-list-filtered-mobile.png` |
| 18 | tablet | list | filtered | `/members?density=list&tag=ai` | `members-ux-clarity-list-filtered-tablet.png` |
| 19 | desktop | list | filtered | `/members?density=list&tag=ai` | `members-ux-clarity-list-filtered-desktop.png` |
| 20 | wide | list | filtered | `/members?density=list&tag=ai` | `members-ux-clarity-list-filtered-wide.png` |
| 21 | mobile | list | empty | `/members?density=list&q=zzz_no_match_zzz` | `members-ux-clarity-list-empty-mobile.png` |
| 22 | tablet | list | empty | `/members?density=list&q=zzz_no_match_zzz` | `members-ux-clarity-list-empty-tablet.png` |
| 23 | desktop | list | empty | `/members?density=list&q=zzz_no_match_zzz` | `members-ux-clarity-list-empty-desktop.png` |
| 24 | wide | list | empty | `/members?density=list&q=zzz_no_match_zzz` | `members-ux-clarity-list-empty-wide.png` |

## 3. cold start evidence 取得手順

cold start で evidence run を 1 回実行すると、上記 24 PNG が spec 本体で自動生成される。

```bash
# evidence flag を立てて desktop-chromium のみ 1 回実行
PLAYWRIGHT_EVIDENCE_TASK=members-ux-clarity-baseline \
  pnpm --filter @ubm-hyogo/web exec playwright test members-ux-clarity --project=desktop-chromium

# PNG 件数確認（≥24 期待）
find docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/screenshots \
  -name 'members-ux-clarity-*.png' | wc -l
```

> evidence 保存先を上書きする場合は `MEMBERS_UX_EVIDENCE_DIR=<dir>` を付与する。

## 4. 確認項目チェックリスト

- [ ] filtered 状態の PNG に絞り込み結果（`data-component="member-filters"` / `data-role="filters-summary-mobile"` / `data-role="filters-body"` 表示）が反映されている
- [ ] empty 状態の PNG に空状態（`data-component="empty-state"`）が描画されている
- [ ] mask 領域が `data-role=pagination-meta` のまま維持され、`fullPage: true` で撮影されている
- [ ] `getByRole("search", {name:"メンバー絞り込み"})` / `getByRole("status")` の marker が成立している
- [ ] 色が OKLch tokens 由来のみ（HEX 直書きなし）
- [ ] 24 PNG が命名規約 `members-ux-clarity-${density}-${state}-${viewport}.png` に一致

## 5. evidence 保存先 / 結果記録

- PNG 保存先: `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/screenshots/`
- runtime 補完不要証跡: 同 `outputs/phase-11/runtime-notes.md`（RC-4）
- 手動テスト結果: 本 workflow の `outputs/phase-11/manual-test-result.md` に 24 ファイル名一覧と確認結果を記述

> 実行環境メモ: ローカル検証では Next dev の初回 `/members` compile が 74 秒かかったため、manual run では先に `curl -I --max-time 180 http://localhost:3000/members` で route warm-up を確認した。Playwright 管理 webServer 経由では config ready URL が `/members` を待つ。

## DoD

- [ ] 24 PNG の matrix table が全 24 行で列挙されている
- [ ] cold start evidence 取得手順（1 回 run で 24 PNG）が記述されている
- [ ] 確認項目チェックリストが配置されている
- [ ] evidence 保存先パスと結果記録先が明示されている
- [ ] evidence が本サイクル内で生成済みである旨が明記されている
