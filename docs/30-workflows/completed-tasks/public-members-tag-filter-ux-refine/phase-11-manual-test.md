# Phase 11: Manual Test Compatibility Index

> Canonical Phase 11 is [`phase-11-evidence-inventory.md`](./phase-11-evidence-inventory.md).
> This file exists for legacy screenshot coverage validators that still expect
> `phase-11-manual-test.md`.

## テストケース

| TC-ID | 観点 | Screenshot evidence |
| --- | --- | --- |
| TC-1 | tag filter chips horizontal flex-wrap | `outputs/phase-11/screenshots/public-members-tag-filter-horizontal.png` |
| TC-2 | filter region grouping | `outputs/phase-11/screenshots/public-members-filter-region-grouped.png` |
| TC-3 | member grid spacing refined | `outputs/phase-11/screenshots/public-members-grid-spacing.png` |
| TC-4 | mobile filter expanded + tags wrap | `outputs/phase-11/screenshots/public-members-mobile-filter-tags.png` |
| TC-5 | selected tags highlighted (`aria-checked="true"`) | `outputs/phase-11/screenshots/public-members-tags-selected.png` |

## 画面カバレッジマトリクス

| TC-ID | Route | State | スクリーンショット |
| --- | --- | --- | --- |
| TC-1 | `/members` | tag filter chips horizontal flex-wrap | `outputs/phase-11/screenshots/public-members-tag-filter-horizontal.png` |
| TC-2 | `/members` | filter region grouping | `outputs/phase-11/screenshots/public-members-filter-region-grouped.png` |
| TC-3 | `/members` | member grid spacing refined | `outputs/phase-11/screenshots/public-members-grid-spacing.png` |
| TC-4 | `/members` | mobile filter expanded + tags wrap | `outputs/phase-11/screenshots/public-members-mobile-filter-tags.png` |
| TC-5 | `/members` | selected tags highlighted | `outputs/phase-11/screenshots/public-members-tags-selected.png` |

## 結果

| TC-ID | Status | Evidence |
| --- | --- | --- |
| TC-1 | present | `outputs/phase-11/screenshots/public-members-tag-filter-horizontal.png` |
| TC-2 | present | `outputs/phase-11/screenshots/public-members-filter-region-grouped.png` |
| TC-3 | present | `outputs/phase-11/screenshots/public-members-grid-spacing.png` |
| TC-4 | present | `outputs/phase-11/screenshots/public-members-mobile-filter-tags.png` |
| TC-5 | present | `outputs/phase-11/screenshots/public-members-tags-selected.png` |

Staging data-backed runtime screenshots remain user-gated.
