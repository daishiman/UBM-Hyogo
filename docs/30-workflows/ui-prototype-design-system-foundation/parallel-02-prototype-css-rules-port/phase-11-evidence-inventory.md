---
phase: 11
title: Evidence Inventory
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-02-prototype-css-rules-port
status: spec_created
visualEvidence: VISUAL
---

# Phase 11 — Evidence Inventory

[実装区分: 実装仕様書]

## 1. 概要

本サブワークフローの完了 evidence を `outputs/phase-11/` 配下に物理的に配置する。Phase 11 evidence existence validator (verify-phase11-evidence) は各 evidence の path 実在を検証するため、本一覧と完全一致させること。

## 2. Evidence 一覧

| Step | Evidence ID | path (相対) | 種別 | 取得方法 |
|------|------------|-------------|------|---------|
| G3-1 | EV-P02-G31-01 | `outputs/phase-11/tag-pill-default.png` | screenshot | Playwright visual |
| G3-1 | EV-P02-G31-02 | `outputs/phase-11/tag-pill-selected.png` | screenshot | Playwright visual |
| G3-1 | EV-P02-G31-03 | `outputs/phase-11/tag-pill-hover.png` | screenshot | Playwright visual (`hover({force:true})`) |
| G3-2 | EV-P02-G32-01 | `outputs/phase-11/member-card-default.png` | screenshot | Playwright visual |
| G3-2 | EV-P02-G32-02 | `outputs/phase-11/member-card-hover.png` | screenshot | Playwright visual (`hover({force:true})`) |
| G3-2 | EV-P02-G32-03 | `outputs/phase-11/member-card-focus.png` | screenshot | Playwright visual (`focus()`) |
| G3-3 | EV-P02-G33-01 | `outputs/phase-11/visibility-public.png` | screenshot | Playwright visual |
| G3-3 | EV-P02-G33-02 | `outputs/phase-11/visibility-member.png` | screenshot | Playwright visual (fixture seed) |
| G3-3 | EV-P02-G33-03 | `outputs/phase-11/visibility-admin.png` | screenshot | Playwright visual (fixture seed) |
| 静的 | EV-P02-LOG-01 | `outputs/phase-10/typecheck.log` | log | `pnpm typecheck` |
| 静的 | EV-P02-LOG-02 | `outputs/phase-10/lint.log` | log | `pnpm lint` |
| 静的 | EV-P02-LOG-03 | `outputs/phase-10/build.log` | log | `pnpm --filter @ubm-hyogo/web build` |
| 静的 | EV-P02-LOG-04 | `outputs/phase-10/grep-hex.log` | log | HEX 直書き grep 結果 |
| 静的 | EV-P02-LOG-05 | `outputs/phase-10/grep-markers.log` | log | parallel-02 マーカー数 grep 結果 |

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

# Playwright snapshot は test 内で screenshot save する想定。
# baseline と output の重複保持を避けたい場合は test の `attachment` 機能を使う。
```

## 5. evidence 不足時の判定

`verify-phase11-evidence` validator が次を検査する:

| 検査項目 | 失敗時の挙動 |
|---------|-------------|
| 上記 path がすべて物理存在 | validator が exit !=0 |
| png ファイルが 0 バイトでない | 同上 |
| path traversal が含まれない (`..` 不可) | 同上 |

不足が発覚した場合は Phase 10 検証を再実行し、欠けている evidence を取得する。

## 6. PR 本文への参照

`diff-to-pr.md` の Phase 13 で、本一覧の path を相対 link で PR 本文に列挙する。

> 注: PR 本文の Screenshot セクションは画像が物理存在する場合のみ生成する (CLAUDE.md「PR作成前チェック」)。
