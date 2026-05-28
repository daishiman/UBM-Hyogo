---
spec_classification: implementation_spec
state: spec_created
phase: 3
phase_name: 設計レビュー
---

# Phase 3 — 設計レビュー

親 workflow trace: followup-001 of `docs/30-workflows/admin-ui-prototype-alignment/`。

## 目的

Phase 2 設計を 4 条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）で点検し、Phase 5 実装に進める状態にする。

## 前提と入力

- `phase-2-design.md`
- 親 workflow `phase-3-design-review.md`（プロトタイプ準拠の語彙）

## 作業手順

1. 4 条件 verdict 表を作成
2. 不変条件との整合を再確認（特に `verify-design-tokens` / `FormField` / `useAdminMutation` / `*.spec.{ts,tsx}` rule）
3. Phase 2 で N/A とした項目（CSV エクスポート / Forms から取り込み が MVP 範囲外）を Phase 5 T-5.5 に明示

## 成果物

| Condition | Verdict | Evidence |
|-----------|---------|----------|
| 矛盾なし | PASS | adapter additive のみ / 既存 endpoint 維持 / D1 直接アクセスなし |
| 漏れなし | PASS | UI 5 region + 404 4 仮説 + primitive top-up を網羅 |
| 整合性あり | PASS | ViewModel 名 / file path / tokens 名が CLAUDE.md / 親 workflow と一致 |
| 依存関係整合 | PASS | 親 workflow の `admin-ui-prototype-alignment` が `implemented_local_runtime_pending` であることと矛盾なし。新規 endpoint 追加なし |

## 完了条件 (DoD)

- 4 条件すべて PASS
- FAIL がある場合は Phase 2 に差し戻し

## 検証コマンド

```bash
mise exec -- pnpm gate-metadata:validate
```

## 想定リスク

- pill-nav primitive が既存 `Segmented` で代替不能と判明した場合 T-5.7 が肥大化 → 最小 1 component に閉じる

## ロールバック

- 仕様 markdown のみのため git revert

## 関連 spec

- `phase-2-design.md`
- `phase-4-test-plan.md`
