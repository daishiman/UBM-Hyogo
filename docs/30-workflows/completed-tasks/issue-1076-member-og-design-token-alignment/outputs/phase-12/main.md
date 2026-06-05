`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

# Phase 12 — サマリ（main）

## 概要

| key | value |
| --- | --- |
| タスクID | `issue-1076-member-og-design-token-alignment` |
| タスク名 | member OG 画像の意匠デザイントークン整合 (FU-I1027-002) |
| workflow_state | `implemented_local_evidence_captured` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| issue | `#1076`（gh issue view 2026-06-03 再確認時点 `CLOSED`（closedAt: 2026-06-03T04:23:12Z）） |
| 判定 | **PASS** |

本 wave は Issue #1076（FU-I1027-002）の Phase 1-13 **実装仕様書**を作成し、同一サイクルで `apps/og` のローカル実装と検証まで完了した `implemented_local_evidence_captured` タスクである。
`apps/og` が生成する OG 画像のブランド配色・レイアウト・タイポグラフィを、デザイン正本
`apps/web/src/styles/tokens.css` の確定 hex と整合させ、再乖離を回帰テストで機械的に防ぐ設計を
実コードへ反映した。実PNG screenshot、staging deploy、commit、push、PR、Issue mutation は user-gated として分離する。

## strict 7 成果物一覧と状態

| # | file | Status |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | present（本ファイル） |
| 2 | `outputs/phase-12/implementation-guide.md` | present |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | present |
| 4 | `outputs/phase-12/documentation-changelog.md` | present |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | present（検出 1 件） |
| 6 | `outputs/phase-12/skill-feedback-report.md` | present（知見あり） |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | present（親エージェント作成） |

## Gate 状態

| Gate | 種別 | 状態 |
| --- | --- | --- |
| Gate-A | spec_review | **passed**（`evidence_path`: phase-12 compliance-check） |
| Gate-B | implementation_review | **passed**（apps/og 実装、focused Vitest 23/23 PASS、typecheck/lint PASS、Wrangler dry-run build PASS、size gate 718KiB/3072KiB PASS） |
| Gate-C | external_ops | **pending**（`passed_at: null`・commit/push/PR/deploy/Issue mutation は user-gated） |

## 設計核心（identifier）

- 新規 `apps/og/src/og-tokens.ts`: `OG_BRAND` / `OG_TYPO` / `OG_LAYOUT` / `titleFontSize(title: string): number`
- `render.tsx`: `BRAND` → `OG_BRAND` 置換、`buildHtml` を `OG_LAYOUT` / `OG_TYPO` 由来へ整理
- `og-tokens.spec.ts`: tokens.css を fs パースして正本 hex 一致を機械検証（ドリフトガード）

## artifacts parity

`artifacts.json`（root）/ `outputs/artifacts.json` は byte-identical。`workflow_state` は
`index.md` / root artifacts / outputs artifacts / 本 phase-12 サマリ / compliance-check で
`implemented_local_evidence_captured` に一致する。
