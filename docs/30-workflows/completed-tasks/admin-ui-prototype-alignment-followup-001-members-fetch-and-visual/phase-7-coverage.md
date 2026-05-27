---
spec_classification: implementation_spec
state: spec_created
phase: 7
phase_name: カバレッジ確認
---

# Phase 7 — カバレッジ確認

親 workflow trace: followup-001 of `docs/30-workflows/admin-ui-prototype-alignment/`。

## 目的

Phase 5 で追加した実装 + adapter のラインカバレッジが repo の閾値を満たすことを確認する。

## 前提と入力

- coverage threshold は repo `vitest.config.ts` / `.github/workflows/test-coverage.yml` 等で固定
- Phase 6 unit spec green

## 作業手順

1. `pnpm test:coverage` または `pnpm --filter web test:coverage` を実行
2. 新規ファイル（adapter / Table / Filters / Drawer / page-head / pill-nav primitive）のラインカバレッジを確認
3. 閾値割れがあれば追加 spec を Phase 6 に差し戻し

## 成果物

- `outputs/phase-7/integration-result.md`（coverage 抜粋）

## 完了条件 (DoD)

- 新規ファイル line coverage が repo 閾値以上
- changed coverage gate（pre-push）green

## 検証コマンド

```bash
mise exec -- pnpm --filter web test:coverage
bash scripts/coverage-guard.sh --changed
```

## 想定リスク

- pill-nav primitive 追加時の coverage 不足 → primitive spec を Phase 6 で追加済みとする

## ロールバック

- 追加 spec の削除のみで戻し可能

## 関連 spec

- `phase-6-test-additions.md`
