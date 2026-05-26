---
phase: 6
title: Test strategy
workflow_id: ui-prototype-design-system-foundation
sub_workflow: issue-903-parallel-03-followup-005-member-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL
implementation_mode: code_change_plus_evidence
---

# Phase 6 — Test strategy

[実装区分: 実装仕様書]

## 6.1 テストケース

| ID | 種別 | 内容 | 期待 |
|----|------|------|------|
| TC-01 | Playwright | `/profile` 描画後 `[data-testid="member-shell"]` が attach | pass |
| TC-02 | Playwright | scrape 行が 1 件以上抽出 | `lines.length > 0` |
| TC-03 | Playwright | scrape 出力に `#[0-9a-fA-F]{3,6}` 不在 | not.toMatch |
| TC-04 | unit (既存) | `apps/web/app/(member)/profile/__tests__/*.spec.tsx` が pass | 既存と同等 |
| TC-05 | unit (既存) | `static-invariants.runtime.spec.ts` の S-01/02/04/04b が新 path で pass | pass |
| TC-06 | gate | `verify-design-tokens` が `dom-scrape-member.txt` に対し HEX violation 検出無し | 0 fail |
| TC-07 | gate | `verify:phase12-compliance` が status 語彙 valid を確認 | 0 fail |
| TC-08 | smoke | `/profile` URL が 200 で返る（member セッション必須） | 200 |

## 6.2 回帰防止

- TC-04 で profile page の動作回帰を、TC-05 で profile 配下を参照する静的 invariants の path 追随を担保
- TC-01〜03 で member shell data-* 契約の runtime 出力を継続検証

## 6.3 mock / fixture

- 既存 `apps/web/playwright/fixtures/auth.ts` の member セッション mint helper を使用
- 無い場合は admin mint helper を複製し、`role: 'member'` 相当の cookie を払い出す（fixture 拡張は本タスクスコープ内）
