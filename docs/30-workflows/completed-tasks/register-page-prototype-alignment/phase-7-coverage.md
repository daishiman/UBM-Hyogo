---
phase: 7
title: カバレッジ計画
workflow_id: register-page-prototype-alignment
status: draft
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 7 — カバレッジ計画

[実装区分: 実装仕様書]

## 1. 既存しきい値の確認

`apps/web/vitest.config.ts` の coverage thresholds を変更しない。既存値を本 PR で降下させないことを CI gate が担保する（`coverage-guard` / 既存 vitest threshold）。

## 2. 影響範囲

| ファイル | 変更前 cov | 目標 |
|---------|-----------|------|
| `RegisterHeroCallout.tsx` | 既存 (high) | 100% (lines/funcs/stmts) / branch 95%+ |
| `FormPreviewSections.tsx` | 既存 (high) | 95%+ all axes |
| `RegisterStepGrid.tsx` | N/A（新規） | 100% all axes（default prop + custom prop の両分岐）|
| `RegisterFaq.tsx` | N/A（新規） | 100% all axes |
| `RegisterBottomCTA.tsx` | N/A（新規） | 100% all axes |
| `app/(public)/register/page.tsx` | server component（測定対象外の可能性）| 既存挙動維持 |

## 3. 戦略

- 新規 component の branch は `steps`/`items` default vs custom prop の 2 分岐のみのため、Phase 6 のケースで網羅可能。
- FormPreviewSections の visibility 分岐（public / member / admin / fallback）は既存 fixture に admin field を 1 件追加するか、既存 fixture が全 visibility を含んでいることを確認する。不足する場合は spec ファイル内 local fixture を最小拡張。
- preview 取得失敗時の `previewError` 分岐は page.tsx 側の責務であり、本 PR では新規 page spec を追加せず既存 smoke がカバーする範囲に留める。

## 4. 確認コマンド

```bash
mise exec -- pnpm --filter web test:coverage -- src/components/public
```

しきい値割れが出た場合は branch 不足ケースを Phase 6 へフィードバックして追補する。
