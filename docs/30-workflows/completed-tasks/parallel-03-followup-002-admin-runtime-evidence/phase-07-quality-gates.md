---
phase: 7
title: カバレッジ確認 — 変更範囲のカバレッジ可視化
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-followup-002-admin-runtime-evidence
status: spec_created
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: verify_existing
---

# Phase 7 — カバレッジ確認

[実装区分: 実装仕様書]

## 1. カバレッジ対象範囲（局所指定 — [Feedback BEFORE-QUIT-002]）

本タスクは production code を変更しない（verify_existing）。カバレッジ対象は **追加した scrape spec のアサーション網羅** に限定する。`apps/web/app/(admin)/layout.tsx` の line coverage は parallel-03 既存テスト（`(admin)/layout.spec.tsx` 等）が担保済みのため対象外。

## 2. concern × evidence の対応

| concern | 検証手段 | 充足 |
|---------|----------|------|
| data-theme 契約が runtime 出力される | TC-02 | ◯ |
| data-route-group 契約 | TC-03 | ◯ |
| data-route 契約 | TC-04 | ◯ |
| data-shell（topbar/sidebar）契約 | TC-05 | ◯ |
| data-testid 契約 | TC-06 | ◯ |
| OKLch 維持（HEX 非混入） | TC-07 | ◯ |
| evidence non-empty | TC-08/TC-10 | ◯ |

## 3. dependency edge

- fixture（`adminPage`）→ admin layout SSR → DOM scrape の経路が 1 本通ることを TC-01 で確認。分岐は無い（単一 happy path + 契約 assert）。

## 4. 判定

追加 spec の全 TC が pass すれば本タスクのカバレッジ目標を満たす。production code カバレッジ低下は発生しない（変更なし）。
