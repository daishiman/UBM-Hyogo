---
spec_classification: implementation_spec
state: spec_created
phase: 9
phase_name: QA
---

# Phase 9 — QA

親 workflow trace: followup-001 of `docs/30-workflows/admin-ui-prototype-alignment/`。

## 目的

Phase 5〜8 完了後の local runtime で AC-1..AC-9 のうち local で検証可能な項目を verify する。

## 前提と入力

- local dev server: `mise exec -- pnpm --filter web dev`
- staging deploy 前の状態（404 fix のみ local で検証）

## 作業手順

1. local で `/admin/members` を開き、テーブル列構成 / pill-nav / page-head / drawer 動作を目視確認
2. axe a11y 自動チェック（あれば `pnpm exec playwright test --grep @a11y`）
3. `verify-design-tokens` を local 実行

## 成果物

- `outputs/phase-9/qa-result.md`（チェックリスト記入）

## 完了条件 (DoD)

- AC-2..AC-7 が local で目視 PASS
- AC-1 / AC-8 / AC-9 は staging 後に Phase 11 で検証

## 検証コマンド

```bash
mise exec -- pnpm --filter web dev &
mise exec -- pnpm verify:design-tokens
mise exec -- pnpm --filter web test -- --run
```

## 想定リスク

- local API では `INTERNAL_API_BASE_URL` 構成が staging と異なる → AC-1 は staging 必須

## ロールバック

- なし（local verify のみ）

## 関連 spec

- `phase-1-requirements.md`（AC）
- `phase-11-manual-test.md`
