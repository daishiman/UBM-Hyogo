---
spec_classification: implementation_spec
state: spec_created
phase: 6
phase_name: テスト追加
---

# Phase 6 — テスト追加

親 workflow trace: followup-001 of `docs/30-workflows/admin-ui-prototype-alignment/`。

## 目的

Phase 5 で追加した実装に対し vitest unit + playwright visual baseline spec を追加し、green を確認する。

## 前提と入力

- Phase 4 test-plan の U-1..U-6 / V-1..V-2 list
- Phase 5 完了済みコード

## 作業手順

1. U-1..U-6 spec を `*.spec.{ts,tsx}` で作成（`*.test.*` 厳禁）
2. V-1 / V-2 spec を `apps/web/playwright/tests/visual-staging/` 配下に作成
3. `pnpm --filter web test -- --run` で unit green 確認
4. `pnpm exec playwright test --project=staging-visual --list` で 2 spec が discover されることを確認

## 成果物

- U-1..U-6 spec
- V-1 / V-2 spec
- `outputs/phase-6/test-implementation-result.md`（実行ログ抜粋）

## 完了条件 (DoD)

- vitest unit 6 spec が green（個別 pass 出力あり）
- playwright `--list` に V-1 / V-2 が 1 件ずつ追加されている
- 既存 spec が継続 green

## 検証コマンド

```bash
mise exec -- pnpm --filter web test -- --run MembersTable MembersFilters MemberDrawer members-view-model safe-server-fetch route
mise exec -- pnpm exec playwright test --project=staging-visual --list 2>&1 | grep -E 'admin-members-(list|drawer)-aligned'
```

## 想定リスク

- snapshot baseline は staging deploy 後 CI で生成。local では `test.skip` あるいは `--update-snapshots` 不実行で list discovery のみ確認

## ロールバック

- spec ファイル削除で戻し可能

## 関連 spec

- `phase-4-test-plan.md`
- `phase-5-implementation.md`
