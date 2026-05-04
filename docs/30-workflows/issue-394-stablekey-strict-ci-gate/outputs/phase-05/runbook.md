# runbook（issue-394-stablekey-strict-ci-gate）

## Stage 0: 前提確認（本サイクルで実施済）

- `pnpm lint:stablekey:strict` 現状を計測（148 violations / exit 1）→ `phase-11/evidence/strict-current-blocker.txt`
- branch protection 現状を保存 → `phase-11/evidence/branch-protection-{main,dev}.json`
- aiworkflow-requirements の関連 indexes / references を更新

## Stage 1: legacy cleanup 完了確認（別タスク完了後）

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm lint:stablekey:strict
# exit 0 / 0 violations であることを確認 → strict-pass.txt として保存
```

## Stage 2: ci.yml step 追加（cleanup 完了後にのみ）

`.github/workflows/ci.yml` の `ci` job 内、`Lint` step 直後に以下を挿入:

```yaml
      - name: Lint stableKey strict
        run: pnpm lint:stablekey:strict
```

## Stage 3: ローカル検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm lint:stablekey:strict
mise exec -- pnpm vitest run scripts/lint-stablekey-literal.test.ts
```

## Stage 4: 故意違反 fixture（dry-run）

一時的に `apps/api/src/_dryrun.ts` 等に `"publicConsent"` リテラルを追加し strict が exit 非 0 になることを確認 → `strict-violation-fail.txt` として保存し fixture は破棄。

## Stage 5: 親 workflow 同期

03a の `index.md` / `outputs/phase-12/implementation-guide.md` の AC-7 を `fully enforced` に更新。

## Stage 6: PR 作成

Phase 13 に従う（user 承認後）。

## rollback 手順

問題発生時は当該 step を削除する revert PR を起票。required context 名は変更しないため branch protection 操作は不要。
