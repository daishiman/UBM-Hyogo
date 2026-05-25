---
phase: 3
title: 設計レビュー — Phase 4 進行可否判定とタスク分解
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-followup-002-admin-runtime-evidence
status: spec_created
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: verify_existing
---

# Phase 3 — 設計レビュー

[実装区分: 実装仕様書]

## 1. 単一責務タスク分解

| Step | 責務 | 成果物 | 並列性 |
|------|------|--------|--------|
| S-01 | scrape spec の新規作成 | `apps/web/playwright/tests/parallel-03-admin-shell-scrape.spec.ts` | 直列（後続が依存） |
| S-02 | spec 実行 → `dom-scrape-admin.txt` 取得 | 親 `outputs/phase-11/dom-scrape-admin.txt` | S-01 後 |
| S-03 | 親 `phase-11-evidence-inventory.md` の EV-12 更新（present + grep 最適化） | 親台帳差分 | S-02 後 |
| S-04 | 親台帳に EV-13/15/16 委譲注記 | 親台帳差分 | S-03 と同 wave |

## 2. 4条件評価

| 条件 | 評価 |
|------|------|
| 価値性 | admin shell の data-* 契約が runtime DOM に出力されることを grep evidence で機械検証でき、契約 regression の早期検知（pixel diff 非依存）が可能になる。コスト削減対象 = parallel-03 evidence 台帳の停滞解消 |
| 実現性 | 既存 `adminPage` fixture 再利用で新規 production code ゼロ。1 spec 追加 + 台帳更新で 1 サイクル完結 |
| 整合性 | status 語彙を validator 仕様（present/pending/n/a）に整合。委譲 EV は pending のまま残し台帳と gate が矛盾しない |
| 運用性 | `verify:phase12-compliance` で status 語彙 + present 行のファイル存在を継続検証。委譲先（serial-05/serial-07）への導線が台帳に残る |

## 3. 真の論点 / 依存・境界

- **真の論点**: 「parallel-03 の evidence 台帳が current code と乖離（status 語彙の罠 + grep パターン古い + fixture 想定古い）したまま停滞している」ことが主問題。機能不足ではなく台帳 ↔ code の整合ズレ。
- **依存関係**: 本タスクは admin route + admin fixture のみに依存し両者とも実装済み。member route（serial-05）/ screenshot baseline（serial-07）には依存しない（委譲で切断）。
- **責務境界**: layout コード（parallel-03 所有）は変更せず、evidence harness（本タスク所有）と台帳更新だけを行う。

## 4. Phase 4 進行可否

- [x] 変更対象ファイルが特定済み（新規 spec 1 + 親台帳 1）
- [x] 既存 fixture / 取得パターンが確認済み（再利用方針確定）
- [x] status 語彙の罠を回避する設計（present 固定）が確定
- [x] 委譲 EV の理由・委譲先が確定

判定: **PROCEED**（Phase 4 へ進む）。MINOR 指摘なし。
