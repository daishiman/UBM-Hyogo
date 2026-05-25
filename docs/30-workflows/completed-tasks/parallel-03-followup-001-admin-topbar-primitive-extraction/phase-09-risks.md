---
phase: 9
title: Risks — 苦戦箇所と回避策
workflow_id: parallel-03-followup-001-admin-topbar-primitive-extraction
status: spec_created
---

# Phase 9 — Risks

[実装区分: 実装仕様書]

| ID | リスク | 影響 | 回避策 |
| --- | --- | --- | --- |
| R-01 | `data-route-group` を primitive 側に移してしまう | 既存 layout spec（L58-59）が fail | data-route-group は wrapper に残す（Phase 2 §3）。primitive には `data-shell="topbar"` のみ |
| R-02 | `aria-hidden={false}` を書き `aria-hidden="false"` が DOM に出る | a11y 契約逸脱・spec 不一致 | `aria-hidden={hasActions ? undefined : "true"}` で属性自体を出し分け（Phase 5 §2） |
| R-03 | issue 本文の `src/components/admin/` に作ってしまう | primitive 配置が siblings と非対称・import path 不整合 | `src/components/layout/` に配置（Phase 1 §0）。AdminSidebar と同ディレクトリ |
| R-04 | `"use client"` を足してしまう | admin layout 全体が client 境界に巻き込まれ RSC 利益喪失 | Server Component 維持。client 要素は呼び出し側で boundary 化し actions props で渡す（Phase 2 §2） |
| R-05 | token class を「整理」して別 class に変える | 新規 visual 仕様の混入・verify-design-tokens fail リスク | inline JSX の class を逐語移植（NFR-03 / Phase 4 §2） |
| R-06 | 既存 `layout.spec.tsx` を「ついでに」修正する | regression gate（無修正 pass）の意味が失われる | spec ファイルは触らない（AC-3） |
| R-07 | axe helper の相対 import path 誤り | spec が import error で fail | `src/components/layout/__tests__/` から `../../../test/axe`。実装時に解決確認（Phase 5 §4 注） |
| R-08 | header を grid セル外の余計な wrapper で包む | admin grid レイアウト崩れ（topbar セルがずれる） | primitive root は `<header>` 単体。余計な div で包まない（Phase 2 §4） |

## フォールバック

- axe helper が使えない場合: role / attribute ベース検証で代替（critical 相当の構造違反のみ手動チェック）。
- visual-full が差分検出した場合: 想定 visual delta なしのため、差分は実装ミス（class 改変等）のシグナル。baseline を更新せず原因を修正する。
