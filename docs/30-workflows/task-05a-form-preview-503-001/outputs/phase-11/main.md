# Phase 11 main — NON_VISUAL smoke evidence index

## テスト方式

| 項目 | 値 |
| --- | --- |
| visualEvidence | NON_VISUAL |
| 発火条件 | `artifacts.json.metadata.visualEvidence == "NON_VISUAL"` |
| 主証跡 | HTTP status / JSON shape / focused Vitest |
| screenshot | 不要。`outputs/phase-11/screenshots/` は作成しない |

## 必須 outputs

| ファイル | 役割 | 状態 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | 本 index | blocked-pending-runtime-evidence |
| `outputs/phase-11/manual-smoke-log.md` | curl / vitest smoke log | blocked-pending-runtime-evidence |
| `outputs/phase-11/link-checklist.md` | workflow / implementation / spec link checklist | present |
| `outputs/phase-11/manual-test-result.md` | 既存互換の手動テスト結果サマリ | blocked-pending-runtime-evidence |

## 実行境界

本ファイルは NON_VISUAL evidence contract であり、2026-05-05 review curl では staging / production とも 503。`manual-smoke-log.md` と `manual-test-result.md` の runtime 200 が取得されるまで PASS と扱わない。
