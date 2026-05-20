---
phase: 11
title: Evidence Inventory
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-02-prototype-css-rules-port
status: runtime_pending
visualEvidence: VISUAL_RUNTIME_PENDING
---

# Phase 11 — Evidence Inventory

[実装区分: 実装仕様書]

## 1. 概要

本サブワークフローの evidence を `outputs/phase-10/` / `outputs/phase-11/` 配下に配置する。Phase 11 screenshot は local Playwright harness で取得し、production / staging runtime visual は root workflow の `VISUAL_RUNTIME_PENDING` 境界に残す。Phase 11 evidence existence validator は `Status=present` の行だけを物理実在検証対象にする。

## 2. Evidence 一覧

| Classification | Step | Evidence ID | Path | Status | 取得方法 |
|----------------|------|-------------|------|--------|----------|
| screenshot | G3-1 | EV-P02-G31-01 | `outputs/phase-11/tag-pill-default.png` | present | Playwright visual harness |
| screenshot | G3-1 | EV-P02-G31-02 | `outputs/phase-11/tag-pill-selected.png` | present | Playwright visual harness |
| screenshot | G3-1 | EV-P02-G31-03 | `outputs/phase-11/tag-pill-hover.png` | present | Playwright visual harness (`hover({force:true})`) |
| screenshot | G3-2 | EV-P02-G32-01 | `outputs/phase-11/member-card-default.png` | present | Playwright visual harness |
| screenshot | G3-2 | EV-P02-G32-02 | `outputs/phase-11/member-card-hover.png` | present | Playwright visual harness (`hover({force:true})`) |
| screenshot | G3-2 | EV-P02-G32-03 | `outputs/phase-11/member-card-focus.png` | present | Playwright visual harness (`focus()`) |
| screenshot | G3-3 | EV-P02-G33-01 | `outputs/phase-11/visibility-public.png` | present | Playwright visual harness |
| screenshot | G3-3 | EV-P02-G33-02 | `outputs/phase-11/visibility-member.png` | present | Playwright visual harness |
| screenshot | G3-3 | EV-P02-G33-03 | `outputs/phase-11/visibility-admin.png` | present | Playwright visual harness |
| log | 静的 | EV-P02-LOG-01 | `outputs/phase-10/typecheck.log` | present | `pnpm --filter @ubm-hyogo/web typecheck` |
| log | 静的 | EV-P02-LOG-02 | `outputs/phase-10/lint.log` | present | `pnpm --filter @ubm-hyogo/web lint` |
| log | 静的 | EV-P02-LOG-03 | `outputs/phase-10/build.log` | present | `pnpm --filter @ubm-hyogo/web build` |
| log | 静的 | EV-P02-LOG-04 | `outputs/phase-10/grep-hex.log` | present | HEX 直書き grep 結果 |
| log | 静的 | EV-P02-LOG-05 | `outputs/phase-10/grep-markers.log` | present | parallel-02 マーカー数 grep 結果 |

## 3. ディレクトリ構造

```
docs/30-workflows/ui-prototype-design-system-foundation/
  parallel-02-prototype-css-rules-port/
    phase-01..13-*.md
    outputs/
      phase-10/
        typecheck.log
        lint.log
        build.log
        grep-hex.log
        grep-markers.log
      phase-11/
        tag-pill-default.png
        tag-pill-selected.png
        tag-pill-hover.png
        member-card-default.png
        member-card-hover.png
        member-card-focus.png
        visibility-public.png
        visibility-member.png
        visibility-admin.png
```

## 4. evidence 取得スクリプト (参考)

```bash
mkdir -p docs/30-workflows/ui-prototype-design-system-foundation/parallel-02-prototype-css-rules-port/outputs/phase-{10,11}

mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/visual/parallel-02-css-rules.spec.ts \
  --project=visual-chromium
```

## 5. evidence 不足時の判定

`verify-phase11-evidence` validator が次を検査する:

| 検査項目 | 失敗時の挙動 |
|---------|-------------|
| `Status=present` の path がすべて物理存在 | validator が exit !=0 |
| `Status=present` の png ファイルが 0 バイトでない | 同上 |
| path traversal が含まれない (`..` 不可) | 同上 |

`present` は local Playwright harness で物理 screenshot が生成済みであることを示す。production / staging runtime visual は root workflow の `VISUAL_RUNTIME_PENDING` として残し、今回の sub-workflow は local visual evidence captured の境界で閉じる。

## 6. PR 本文への参照

`diff-to-pr.md` の Phase 13 で、本一覧の path を相対 link で PR 本文に列挙する。

> 注: PR 本文の Screenshot セクションは画像が物理存在する場合のみ生成する (CLAUDE.md「PR作成前チェック」)。
