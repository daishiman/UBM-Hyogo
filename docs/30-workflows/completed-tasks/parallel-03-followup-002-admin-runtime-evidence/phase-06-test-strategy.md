---
phase: 6
title: テスト拡充 — fail path と回帰 guard
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-followup-002-admin-runtime-evidence
status: spec_created
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: verify_existing
---

# Phase 6 — テスト拡充

[実装区分: 実装仕様書]

## 1. fail path / 回帰 guard

| ID | ガード | 実装 |
|----|--------|------|
| TC-09 | 契約属性が 1 つでも欠けたら fail（regression guard） | Phase 5 の `expect(...).toMatch(...)` 群が担保。属性削除で即 fail |
| TC-10 | scrape が空文字（SSR 未完了 / gate redirect）で evidence が空にならない | `expect(lines.length).toBeGreaterThan(0)` |
| TC-11 | admin gate が効いて anonymous では取得できないことの間接確認 | `adminPage` fixture（admin JWT）でのみ `/admin` shell が出る前提を spec コメントに明記。anonymous 検証は既存 `auth-gate-state.spec.ts` に委ねる（重複しない） |

## 2. 既存テストとの非重複

- admin screenshot は `task15-admin-screenshots.spec.ts` が既にカバー。本 spec は **DOM scrape（text evidence）** に限定し screenshot を撮らない（責務分離）。
- admin gate redirect は `auth-gate-state.spec.ts` がカバー済み。本 spec は再実装しない。

## 3. 補助コマンド

```bash
cd apps/web
# 生成された evidence の中身確認（grep で契約属性の hit を目視）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/parallel-03-admin-shell-scrape.spec.ts --project=desktop-chromium --reporter=line
```
