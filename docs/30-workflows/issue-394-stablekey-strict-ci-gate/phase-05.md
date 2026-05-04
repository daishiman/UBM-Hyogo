# Phase 5: 実装ランブック

## 前提条件チェック

1. legacy stableKey literal cleanup 完了済み（`pnpm lint:stablekey:strict` exit 0 をローカルで確認）
2. ブランチ: `docs/issue-394-stablekey-strict-ci-gate-task-spec`（または実装用 feat ブランチ）
3. `mise exec -- pnpm install` 実行済み

## 実装手順

### Step 1: ローカル strict PASS 確認

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm lint:stablekey:strict | tee /tmp/strict-pass.txt
```

期待: exit 0、`0 violation(s)`。失敗時は本タスク着手中止し legacy cleanup を完了させる。

### Step 2: ci.yml 編集（strict 0 violations 後のみ）

`.github/workflows/ci.yml` の `ci` job、`Lint` step（line 52-54）の直後に以下を挿入:

```yaml
      - name: Lint stableKey (strict)
        if: steps.ready.outputs.value == 'true'
        run: pnpm lint:stablekey:strict
```

### Step 3: ローカル CI 同等性確認

```bash
# package.json コマンドと ci.yml コマンドが一致することを確認
grep "lint:stablekey:strict" package.json
grep "lint:stablekey:strict" .github/workflows/ci.yml
```

### Step 4: typecheck / lint / 既存 test の健全性確認

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run scripts/lint-stablekey-literal.test.ts
```

### Step 5: branch protection snapshot 取得

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection/required_status_checks \
  > docs/30-workflows/issue-394-stablekey-strict-ci-gate/outputs/phase-11/evidence/branch-protection-main.json
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection/required_status_checks \
  > docs/30-workflows/issue-394-stablekey-strict-ci-gate/outputs/phase-11/evidence/branch-protection-dev.json
```

### Step 6: evidence ファイル配置

`outputs/phase-11/evidence/` に以下を配置:

- `strict-pass.txt`（Step 1 の出力）
- `strict-violation-fail.txt`（Phase 6 fixture 実行結果）
- `ci-command-trace.md`（Step 3 の grep 結果を md 化）
- `branch-protection-main.json` / `branch-protection-dev.json`（Step 5）

## ロールバック手順

ci.yml の追加 step を削除する 1 行 revert で完結。`git revert <commit>` または手動削除可。

## DoD

- ci.yml diff が 1 step 追加 + コメント以外の変更を含まない
- ローカルで `pnpm lint:stablekey:strict` exit 0
- evidence 4 点が `outputs/phase-11/evidence/` に保存
- 既存 vitest テスト全 PASS

## 出力

- outputs/phase-05/main.md
- outputs/phase-05/runbook.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-394-stablekey-strict-ci-gate |
| phase | 5 |
| taskType | implementation / NON_VISUAL |
| state | spec_created / blocked_by_legacy_cleanup |

## 目的

Phase 5: 実装ランブック の目的は、strict stableKey CI gate を legacy cleanup 完了後に安全に有効化できるよう、現行 blocker と実行条件を矛盾なく固定すること。

## 実行タスク

- 現行 148 violations を前提に、CI を壊す変更を実行しない。
- cleanup 後に実行する作業と、今回実体化する evidence を分離する。
- AC / 依存関係 / Phase 12 strict outputs との整合を確認する。

## 参照資料

- docs/30-workflows/issue-394-stablekey-strict-ci-gate/index.md
- docs/30-workflows/completed-tasks/task-03a-stablekey-strict-ci-gate-001.md
- docs/30-workflows/completed-tasks/task-03a-stablekey-literal-legacy-cleanup-001.md
- .github/workflows/ci.yml
- package.json
- scripts/lint-stablekey-literal.mjs

## 成果物/実行手順

- 対応する `outputs/phase-05/` 配下に実測または blocked-state evidence を保存する。
- 実装前提が満たされない場合は `BLOCKED_BY_LEGACY_CLEANUP` として記録し、PASS と誤記しない。

## 統合テスト連携

NON_VISUAL。UI screenshot は不要。主な検証は `pnpm lint:stablekey:strict`、command trace、branch protection snapshot、Phase 12 strict 7 files の実体確認で行う。

## 完了条件

- [ ] strict 0 violations 到達前は ci.yml に blocking step を追加しない。
- [ ] cleanup 後は local strict PASS と branch protection contexts を確認してから実装する。
