---
phase: 1
title: Requirements
workflow_id: ui-prototype-design-system-foundation
sub_workflow: issue-903-parallel-03-followup-005-member-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL
implementation_mode: code_change_plus_evidence
---

# Phase 1 — Requirements

[実装区分: 実装仕様書]

## 1.1 背景

parallel-03（AppShell layouts）は public / admin / member の 3 系統 layout を `(public)` / `(admin)` / `(member)` route group で実装した。Phase 11 evidence inventory は各系統に **DOM scrape（data-* 契約検証）** と **screenshot（visual baseline）** を取得する設計だが、member 系（EV-13 / EV-16）は parallel-03 merge 時点で `pending` のまま委譲され、followup-002 が admin 版（EV-12）のみ完遂した。

委譲先（serial-05 / serial-07 / UT-DSF-07）の current 台帳を grep した結果、いずれも EV-13 / EV-16 を取得責務として保持していない（followup-002 リスク R-07「委譲 EV の宙吊り」が顕在化）。

加えて、`(member)` route group 直下は `layout.tsx` のみで child route が存在せず、scrape 対象 route そのものが無い状態。一方 `/profile` は `apps/web/app/profile/` に既存し、内容上 member 認証画面である。

## 1.2 機能要件

- **FR-01**: `(member)` route group 配下に scrape 対象となる child route を成立させる
- **FR-02**: member shell の data-* 契約属性（`data-theme="warm"` / `data-route-group="member"` / `data-shell` / `data-route` / `data-testid="member-shell"`）が production-equivalent な runtime DOM に出力されることを Playwright で検証
- **FR-03**: 取得した DOM を `dom-scrape-member.txt` に trace header 付きで書き出し、親 `parallel-03-appshell-layouts/outputs/phase-11/` 配下に配置
- **FR-04**: member shell の 1280x800 viewport screenshot を 1 枚取得し、親 `outputs/phase-11/screenshots/member-shell.png` に配置
- **FR-05**: 親 `phase-11-evidence-inventory.md` の EV-13 / EV-16 を `present` に昇格、委譲注記を最新化

## 1.3 非機能要件

- **NFR-01**: 既存 API endpoint は無変更（不変条件#1）
- **NFR-02**: HEX 直書きを scrape 出力に含まない（不変条件#2 / OKLch）
- **NFR-03**: 新規 primitive を増やさない（不変条件#3）
- **NFR-04**: `apps/web` から D1 直接アクセス無し（不変条件#4）
- **NFR-05**: `/profile` の URL は変更しない（route group は URL に影響しないが、import パス変更が `/profile` の挙動を破壊しないこと）

## 1.4 受け入れ条件

- AC-01: `/profile` ページが従来通り SSR / 動作し、既存 component / lib 連携が壊れない
- AC-02: `parallel-03-member-shell-scrape.spec.ts` が `desktop-chromium` project で pass
- AC-03: `dom-scrape-member.txt` に `data-route-group="member"` を含む行が 1 件以上
- AC-04: `member-shell.png` が存在し、非空
- AC-05: 親台帳の EV-13 / EV-16 Status 列が `present`
- AC-06: `bash scripts/verify-pr-ready.sh` が 0 fail で pass
