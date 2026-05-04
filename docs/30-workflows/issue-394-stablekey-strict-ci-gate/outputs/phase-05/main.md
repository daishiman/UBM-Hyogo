# Phase 5: 実装ランブック — outputs/main

## 判定

`PASS_WITH_BLOCKER`。実装ランブック（`runbook.md`）を確定。本サイクルでは ci.yml には触れない。

## 実装スコープ（条件付き）

- legacy cleanup 完了後にのみ ci.yml に step を追加する。
- 本サイクルでは aiworkflow-requirements の関連 indexes / references を最新化済（git status で diff 確認）。

## ローカル検証手順（cleanup 後に実行）

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm lint:stablekey:strict     # exit 0 を確認
mise exec -- pnpm vitest run scripts/lint-stablekey-literal.test.ts
```

## コミット粒度（cleanup 後）

1. `ci(stablekey-strict): add blocking step to ci job`
2. `docs(03a): elevate AC-7 to fully enforced`
3. `docs(aiworkflow-requirements): align with strict ci gate`

## 完了条件チェック

- [x] AC と矛盾なし。
- [x] strict 0 violations 未達のため ci.yml は変更しない。
- [x] runbook を `outputs/phase-05/runbook.md` に保存。
