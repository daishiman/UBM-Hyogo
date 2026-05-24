---
phase: 1
title: Requirements — AdminTopbar primitive 抽出
workflow_id: parallel-03-followup-001-admin-topbar-primitive-extraction
status: spec_created
source_issue: https://github.com/daishiman/UBM-Hyogo/issues/832
---

# Phase 1 — Requirements

[実装区分: 実装仕様書]

> 本タスクは **コード実装を伴う実装仕様書**。`(admin)/layout.tsx` 内の inline `<header data-shell="topbar">` を AdminTopbar primitive に抽出するリファクタである。GitHub issue #832 のラベルは `type:improvement` だが、成果物は新規ファイル追加 + 既存ファイル編集 + spec 追加であり docs-only ではない。

## 0. issue 現状確認（2026-05-23 時点・現コードベースで検証済み）

| 確認項目 | 結果 |
| --- | --- |
| `apps/web/app/(admin)/layout.tsx` に inline `<header data-shell="topbar">` が残存 | ✅ 残存（L35-46）。未着手 |
| `AdminTopbar.tsx` が存在するか | ❌ 不在（`find apps/web -iname "AdminTopbar*"` で 0 件） |
| issue #832 は別タスクで解決済みか | ❌ 未解決。本タスクで実施が必要 |
| issue 本文の対象 path `apps/web/src/components/admin/AdminTopbar.tsx` は正しいか | ❌ **古い**。既存 layout primitive（AdminSidebar / PublicHeader / PublicFooter / MemberHeader）は `apps/web/src/components/layout/` および `apps/web/src/components/public/` 配下にあり、`src/components/admin/` には layout primitive が存在しない |

### issue を現コードに最適化した点（root-cause 修正）

issue #832 本文は対象 path を `apps/web/src/components/admin/AdminTopbar.tsx` としているが、現コードベースでは layout 系 primitive は **`apps/web/src/components/layout/`** に集約されている（`AdminSidebar.tsx` / `MemberHeader.tsx` が同ディレクトリ。`PublicHeader.tsx` / `PublicFooter.tsx` は `src/components/public/`）。AdminTopbar は admin AppShell の layout slot 部品なので、AdminSidebar と同一の **`apps/web/src/components/layout/`** に配置するのが正しい。本仕様書はこの最適化後の path を正本とする。test も既存 primitive の neighbor 慣習（`src/components/layout/__tests__/`）に合わせる。

## 1. 背景

parallel-03 (AppShell Layouts / 親 workflow `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/`) では `(public)` / `(member)` / `(admin)` の 3 route group ごとに AppShell を整備し、data-* 契約（`data-theme` / `data-route-group` / `data-shell` / `data-route`）を確立した。AdminSidebar / PublicHeader / PublicFooter / MemberHeader は primitive 化されたが、admin topbar は parallel-03 のスコープ判定で「inline JSX のまま完了形」と deferred 宣言され（`phase-13-commit-pr.md` line 192）、`(admin)/layout.tsx` 内に header 要素が直書きされている。

## 2. 解決する問題

- admin topbar だけ primitive 化されておらず、layout file がプレゼンテーション責務を持つ非対称状態。
- 将来 breadcrumb / actions slot に動的内容を流し込む際、layout.tsx に JSX が肥大化しやすい。
- AdminSidebar と並列の責務粒度に揃わず、layout primitive の一覧性・テスタビリティが下がる。
- primitive 単体 spec が無いため topbar の class / aria 不変条件を独立検証できない。

## 3. 機能要件（FR）

| ID | 要件 |
| --- | --- |
| FR-01 | `apps/web/src/components/layout/AdminTopbar.tsx` を新規追加し、`<header data-shell="topbar">` 構造を primitive として提供する |
| FR-02 | `AdminTopbar` は `breadcrumb` / `actions` の 2 slot props を受け取り、省略時は parallel-03 既定描画（breadcrumb=テキスト「管理」、actions=`aria-hidden` placeholder）を出す |
| FR-03 | `(admin)/layout.tsx` の inline `<header>`（L35-46）を `<AdminTopbar />` 呼び出しに置換する |
| FR-04 | `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` を新規追加し、slot 契約・data-* 契約・OKLch トークン class を独立検証する |
| FR-05 | 既存 `apps/web/app/(admin)/layout.spec.tsx` を**無修正**で pass させる（`data-shell="topbar"` 等の DOM 契約維持） |

## 4. 非機能要件（NFR）

| ID | 要件 |
| --- | --- |
| NFR-01 | `AdminTopbar` は **Server Component**（`"use client"` を付けない）。layout.tsx の async server component 境界を壊さない |
| NFR-02 | 配色は OKLch トークン参照（`var(--ubm-color-*)`）のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を導入しない（CLAUDE.md 不変条件2） |
| NFR-03 | 新規 design / 新規 visual 仕様を持ち込まない。既存 inline JSX のトークン参照・class を逐語移植する（CLAUDE.md 不変条件3） |
| NFR-04 | 既存 primitive（AdminSidebar 等）の API を変更しない |
| NFR-05 | テスト suffix は `*.spec.tsx` のみ（CLAUDE.md 不変条件8） |
| NFR-06 | axe critical violation 0 を維持 |
| NFR-07 | admin layout から D1 / 外部 API を直接呼ばない（既存 `getSession()` のみ。CLAUDE.md 不変条件5） |

## 5. スコープ

### 含む
- AdminTopbar primitive 新規追加（`apps/web/src/components/layout/AdminTopbar.tsx`）
- `(admin)/layout.tsx` の inline JSX 置換
- AdminTopbar 単体 spec 追加
- 既存 `(admin)/layout.spec.tsx` の pass 維持確認

### 含まない
- breadcrumb 実データ統合（slot は placeholder / props pattern のまま）
- topbar actions の具体ボタン実装（admin 機能側の別タスク）
- design token の改変
- 新規 primitive 群の追加
- 他 layout（public / member）の primitive 抽出

## 6. 成功基準

- AdminTopbar primitive が AdminSidebar と対称な props 省略可能 API を持つ。
- `(admin)/layout.tsx` から inline header が消え、`<AdminTopbar />` 1 行に置換される。
- 既存 layout spec が無修正で pass、新規 primitive spec が green。
- typecheck / lint / build / verify-design-tokens / axe critical 0 をすべて満たす。
- 単一実装サイクル（03.実装.md 1 回）で完了するスコープに収まる（CONST_007）。
