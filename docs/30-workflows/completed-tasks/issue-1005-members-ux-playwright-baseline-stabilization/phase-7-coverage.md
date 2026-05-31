<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 7 -->

[実装区分: 実装仕様書]

# Phase 7 — カバレッジ

## 1. カバレッジの位置づけ

本タスクは Playwright **visual evidence run** の安定化であり、unit line coverage の閾値達成タスクではない。
したがって coverage 指標は line/branch ではなく、**visual state matrix の全網羅**を「実行カバレッジ」として扱う。

## 2. 実行カバレッジ = 24 state matrix（4 viewport × 3 density × 2 state）

全 24 組み合わせの PNG が present であることを 100% 網羅目標とする。

| # | viewport | density | state | screenshot 名 |
|---|----------|---------|-------|----------------|
| 1 | mobile(375x800) | comfy | filtered | members-ux-clarity-comfy-filtered-mobile.png |
| 2 | mobile | comfy | empty | members-ux-clarity-comfy-empty-mobile.png |
| 3 | mobile | dense | filtered | members-ux-clarity-dense-filtered-mobile.png |
| 4 | mobile | dense | empty | members-ux-clarity-dense-empty-mobile.png |
| 5 | mobile | list | filtered | members-ux-clarity-list-filtered-mobile.png |
| 6 | mobile | list | empty | members-ux-clarity-list-empty-mobile.png |
| 7 | tablet(768x900) | comfy | filtered | members-ux-clarity-comfy-filtered-tablet.png |
| 8 | tablet | comfy | empty | members-ux-clarity-comfy-empty-tablet.png |
| 9 | tablet | dense | filtered | members-ux-clarity-dense-filtered-tablet.png |
| 10 | tablet | dense | empty | members-ux-clarity-dense-empty-tablet.png |
| 11 | tablet | list | filtered | members-ux-clarity-list-filtered-tablet.png |
| 12 | tablet | list | empty | members-ux-clarity-list-empty-tablet.png |
| 13 | desktop(1024x900) | comfy | filtered | members-ux-clarity-comfy-filtered-desktop.png |
| 14 | desktop | comfy | empty | members-ux-clarity-comfy-empty-desktop.png |
| 15 | desktop | dense | filtered | members-ux-clarity-dense-filtered-desktop.png |
| 16 | desktop | dense | empty | members-ux-clarity-dense-empty-desktop.png |
| 17 | desktop | list | filtered | members-ux-clarity-list-filtered-desktop.png |
| 18 | desktop | list | empty | members-ux-clarity-list-empty-desktop.png |
| 19 | wide(1440x1000) | comfy | filtered | members-ux-clarity-comfy-filtered-wide.png |
| 20 | wide | comfy | empty | members-ux-clarity-comfy-empty-wide.png |
| 21 | wide | dense | filtered | members-ux-clarity-dense-filtered-wide.png |
| 22 | wide | dense | empty | members-ux-clarity-dense-empty-wide.png |
| 23 | wide | list | filtered | members-ux-clarity-list-filtered-wide.png |
| 24 | wide | list | empty | members-ux-clarity-list-empty-wide.png |

> filtered = `?...&tag=ai` / empty = `?...&q=zzz_no_match_zzz`。命名は既存 spec の `members-ux-clarity-${density}-${state}-${viewport}.png` 規約に従う（baseline 互換維持）。

## 3. 網羅判定

```bash
find docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/screenshots \
  -name 'members-ux-clarity-*.png' | wc -l   # => 24 で全網羅
```

24 件揃えば実行カバレッジ 100%。1 件でも欠ける場合は cold-start race または warm-up 不足を疑い Phase 5 を再点検する。

## 4. unit coverage への影響

- config / spec の編集は **既存 flag への追加分岐のみ**で、production ソース（`apps/web/src`）の振る舞いを変えない。
- monocart coverage（playwright.config.ts 既存設定）への影響なし。flag 追加のみで coverage 集計対象・閾値は不変。
- vitest 側の line/branch 閾値は本タスクの対象外（テスト追加なし、INV-5）。

## DoD

- [ ] 本タスクが line coverage 閾値タスクでないことを明記した
- [ ] 24 state matrix（4×3×2）を一覧化し全件 present 目標を示した
- [ ] 網羅判定コマンド（PNG = 24）を提示した
- [ ] monocart / vitest coverage への影響なしを明記した
