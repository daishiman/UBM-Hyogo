---
phase: 1
title: 要件定義 — admin AppShell runtime evidence (EV-12) 完遂と inventory 語彙最適化
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-followup-002-admin-runtime-evidence
status: spec_created
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: verify_existing
---

# Phase 1 — 要件定義

[実装区分: 実装仕様書]

> **実装区分の判定根拠（CONST_004）**: 本タスクは「parallel-03 で実装済みの admin AppShell の data-* 契約が production-equivalent な DOM に実際に出力されるか」を runtime 取得し evidence 化する。新規 Playwright spec（実行可能コード）の追加と evidence 取得・台帳更新を伴うため、ドキュメントのみでは目的を達成できない。したがって **実装仕様書** とする。なお新規 production code（`apps/web/src` / `apps/web/app`）の変更は行わず、`implementation_mode: verify_existing`（既実装の data-* 契約を runtime evidence で確認 + 検証 harness を追加）として扱う。

## 1. 解決すべき要件

parallel-03（AppShell layouts, PR #835 merged）で 3 系統 layout（公開・管理・会員）に `data-theme` / `data-route-group` / `data-testid` / `data-shell` / `data-route` の契約属性を実装済み。しかし Phase 11 evidence inventory は admin/member の runtime evidence が `pending` のまま固定されている。本タスクは **admin AppShell の runtime DOM scrape (EV-12) を取得して inventory を `present` に更新**し、parallel-03 の evidence 台帳を current code と整合させる。

### 1.1 機能要件

| ID | 要件 | 根拠 |
|----|------|------|
| FR-01 | `apps/web/playwright/tests/parallel-03-admin-shell-scrape.spec.ts`（新規）が、既存 admin session fixture（`apps/web/playwright/fixtures/auth.ts` の `adminPage`）を使い `/admin` を開き、`page.content()` から data-* 契約属性を grep して `dom-scrape-admin.txt` に書き出す | 親 phase-11 EV-12、`task15-admin-screenshots.spec.ts` の取得パターン |
| FR-02 | scrape 出力先は親 workflow の `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt`（EV-12 の canonical path） | 親 phase-11-evidence-inventory.md L30 |
| FR-03 | 親 `phase-11-evidence-inventory.md` の EV-12 Status を `pending` → `present` に更新する | 親台帳 §1 |
| FR-04 | 親 `phase-11-evidence-inventory.md` の EV-12 取得手順と grep パターンを current code の実属性（`data-(theme\|route-group\|shell\|route\|testid)=`）に最適化する | §1.3 乖離#3 |
| FR-05 | EV-13（member DOM scrape）/ EV-15（admin screenshot）/ EV-16（member screenshot）は本タスクのスコープ外として、委譲先・委譲理由を親台帳に明記する | §2.3、CONST_007 例外 |

### 1.2 既存コードの現状（current facts / verify_existing 前提）

| 対象 | 実属性（current） | ファイル |
|------|------------------|----------|
| Admin shell ルート要素 | `data-theme="cool"` / `data-route-group="admin"` / `data-testid="admin-shell"` | `apps/web/app/(admin)/layout.tsx` L25-27 |
| Admin sidebar | `data-shell="sidebar"` | 同 L31 |
| Admin topbar | `data-shell="topbar"` | 同 L37 |
| Admin main | `data-route="admin"` / `data-section-rhythm="compact"` | 同 L47 |
| Member shell | `data-theme="warm"` / `data-route-group="member"` / `data-testid="member-shell"` / `<header data-shell="topbar">` / `<main data-route="member">` | `apps/web/app/(member)/layout.tsx` |
| admin session fixture | `adminPage` / `adminContext` / `adminLogin()`（`signSessionJwt` + `authjs.session-token` cookie 注入、内蔵 mock API port 8787） | `apps/web/playwright/fixtures/auth.ts` |
| 取得パターン参照元 | `adminPage.goto('/admin')` → `outputs/phase-11` へ出力 | `apps/web/playwright/tests/task15-admin-screenshots.spec.ts` |

> **命名規則**: spec ファイルは `*.spec.ts`（不変条件#8）。Playwright spec は `apps/web/playwright/tests/` 配下、kebab-case。

### 1.3 issue #833 と current code の乖離（最適化対象）

本タスクは issue #833（CLOSED）を current code に最適化したもの。原 issue / 旧 unassigned-task spec との主要乖離:

1. **status 語彙**: 原仕様は「status を `captured` に更新」と指示。しかし validator `scripts/lib/phase12-compliance/verify-phase11-evidence-existence.ts` の `VALID_STATUSES` は `{present, pending, n/a}` のみで、`captured` は **invalid status として gate fail を起こす**。→ 正しい terminal status は **`present`**。
2. **gate 名**: 原仕様は単独 gate `verify:phase11-evidence` を前提にするが実在しない。実体は `verify:phase12-compliance`（`package.json` L25）が内部で `verifyPhase11EvidenceExistence` を呼ぶ。
3. **grep パターン**: 原仕様は `data-(theme\|shell\|route)=` を指定し、トップレベル shell マーカーを `data-shell="appshell"` と想定。current code はトップレベルが `data-route-group` + `data-testid="admin-shell"`、`data-shell` は header/aside の `topbar`/`sidebar` 値。→ grep を `data-(theme\|route-group\|shell\|route\|testid)=` に拡張。
4. **admin session fixture**: 原仕様 §4.1 は「fixture を新規確立」とするが、`apps/web/playwright/fixtures/auth.ts` に既に `adminPage` が存在。→ 新規 fixture 作成は不要、再利用する。

### 1.4 非機能要件

- 既存 API endpoint surface のみ利用（新 endpoint / D1 schema 変更禁止）。scrape は fixture 内蔵 mock API 経由で行い、`apps/web` から D1 binding を直接呼ばない（不変条件#5 / UI 不変条件#4）。
- OKLch トークン正本化維持（HEX 直書き禁止）。本タスクは layout コードを変更しないため regression リスクは低いが、scrape 出力に `bg-[#` 等が混入していないことを確認する。
- 新規 production primitive を生やさない（UI 不変条件#3）。

## 2. スコープ

### 2.1 含むもの（今サイクルで完遂）

- 新規 Playwright spec `parallel-03-admin-shell-scrape.spec.ts` の追加
- EV-12 `dom-scrape-admin.txt` の取得（親 outputs/phase-11 へ出力）
- 親 `phase-11-evidence-inventory.md` の EV-12 Status 更新（pending→present）+ 取得手順/grep の最適化
- 親台帳への EV-13/15/16 委譲先・理由の明記

### 2.2 含まないもの（不変条件由来）

- 新規 API endpoint 追加 / D1 schema 変更
- HEX 直書き / `bg-[#xxx]`
- 新規 primitive 追加
- `apps/web` からの D1 直接 binding

### 2.3 委譲（CONST_007 例外 — ユーザー承認済みスコープ判断）

| EV | 内容 | 委譲先 | 委譲理由（技術的・整合性破綻） |
|----|------|--------|------------------------------|
| EV-13 | member DOM scrape | `serial-05-page-routes-blueprint-binding` | `apps/web/app/(member)/` 配下に child route が存在せず（`layout.tsx` + `layout.spec.tsx` のみ）、scrape 対象 route が原理的に無い。transient placeholder route を一時投入すると serial-05 完了時に削除する捨てコードとなり整合性が破綻するため、route 整備の正規担当である serial-05 に委譲する |
| EV-15 | admin screenshot (full chrome) | `serial-07-regression-evidence` / UT-DSF-07 (issue #829) | full chrome multi-screen visual baseline は serial-07 の責務。UT-DSF-07 (#829) で別途仕様書作成中であり、本タスクで重複取得すると baseline の二重管理・drift の温床になる |
| EV-16 | member screenshot | `serial-07-regression-evidence` / UT-DSF-07 (issue #829) | EV-13 と同じく member child route 欠如 + serial-07 責務重複 |

> 委譲する EV は親台帳で status を `pending`（valid status）のまま残し、委譲先と理由を注記する。`captured`/`deferred-to-serial-07` 等の invalid 文字列に置き換えない。

## 3. 受け入れ条件（DoD サマリ、詳細は phase-08）

- AC-1: `parallel-03-admin-shell-scrape.spec.ts` が pass し `dom-scrape-admin.txt` を生成する
- AC-2: `dom-scrape-admin.txt` が `data-theme=` / `data-route-group=` / `data-route=` を各 1 件以上含む（non-empty）
- AC-3: 親 `phase-11-evidence-inventory.md` の EV-12 Status が `present`、取得手順が current grep に最適化済み
- AC-4: 親台帳に EV-13/15/16 の委譲先・理由が明記済み
- AC-5: `mise exec -- pnpm verify:phase12-compliance` が 0 fail（status 語彙 valid を含む）
- AC-6: 4 不変条件（既存 API / OKLch / プロトタイプ正本 / D1 直接アクセス禁止）遵守

## 4. carry-over 確認

- 直近コミット（`git log --oneline -5`）: parallel-03 は PR #835 で merge 済み、data-* 契約はコード実装完了。本タスクは「未取得の runtime evidence 1 件（EV-12）の補完」であり、新規 feature ではない。
- 前提タスク依存: admin session fixture は実装済み（依存解消済み）。member route（serial-05）と screenshot baseline（serial-07）には依存せず、委譲で切り離す。
