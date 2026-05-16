# Phase 11 Evidence Index — parallel-03-prototype-ux-css

## Summary

`completed (visual_runtime_captured)`。apps/web 実装と task 固有 Playwright spec を追加し、Phase 11 runtime 実行でスクリーンショット、axe critical 0、Playwright レポートを取得した。

## Evidence Inventory

| ファイル | 状態 | 用途 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | `completed (spec evidence index)` | Phase 11 証跡索引 |
| `outputs/phase-11/evidence/command-contract.md` | `completed (command contract fixed)` | 実在 script に合わせた検証コマンド |
| `outputs/phase-11/screenshots/tag-pill-selected.png` | `completed` | tag pill selected visual |
| `outputs/phase-11/screenshots/tag-pill-default.png` | `completed` | tag pill default visual |
| `outputs/phase-11/screenshots/member-card-hover.png` | `completed` | member card hover visual |
| `outputs/phase-11/screenshots/member-card-focus.png` | `completed` | member card focus-within visual |
| `outputs/phase-11/screenshots/profile-section-public.png` | `completed` | public visibility section |
| `outputs/phase-11/screenshots/profile-section-member.png` | `completed (fixture mutation)` | member visibility fixture |
| `outputs/phase-11/screenshots/profile-section-admin.png` | `completed (fixture mutation)` | admin visibility fixture |
| `outputs/phase-11/screenshots/metadata.json` | `completed` | capture metadata |
| `outputs/phase-11/evidence/playwright-report/results.json` | `completed (5 passed)` | Playwright JSON report |
| `outputs/phase-11/evidence/monocart/index.json` | `completed (5 passed)` | Monocart summary |

## Runtime Boundary

Phase 11 完了条件は、上表の PNG と `metadata.json`、axe critical violations 0、Playwright visual smoke exit 0 が tracked evidence として揃うこと。本サイクルでは `visual-feedback.spec.ts` 5 tests passed で満たした。
