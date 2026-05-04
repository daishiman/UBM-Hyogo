# Phase 13: PR 作成

## 承認ゲート

PR 作成は **ユーザー明示許可後にのみ実行**。本仕様書作成プロンプト内では PR 作成を行わない（CONST_002）。

## 事前 local check

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm lint:stablekey:strict
mise exec -- pnpm vitest run scripts/lint-stablekey-literal.test.ts
```

すべて PASS を確認後 `outputs/phase-13/local-check-result.md` に記録。

## change-summary.md

ci.yml に追加した step、親 workflow 更新箇所、aiworkflow-requirements 更新箇所を列挙。

## PR template

```markdown
## Summary

- `.github/workflows/ci.yml` の `ci` job に `pnpm lint:stablekey:strict` step を追加し、stableKey リテラル直書き禁止を required CI gate で blocking する
- 03a 親 workflow の AC-7 を `fully enforced` に昇格
- aiworkflow-requirements の branch protection current facts と整合

## Spec

- docs/30-workflows/issue-394-stablekey-strict-ci-gate/

## Test plan

- [ ] `pnpm lint:stablekey:strict` exit 0（local）
- [ ] 故意違反 fixture で exit 非 0（Phase 6 手順）
- [ ] `gh api .../branches/main/protection/required_status_checks` の contexts に `ci` が含まれる
- [ ] PR の `ci` required check が strict step を含めて PASS

Refs #394
```

## 完了条件

- [ ] この Phase の判断・手順・成果物が index.md の AC と矛盾しない。
- [ ] strict 0 violations 未達時は blocking CI gate を有効化しない。
- [ ] 必要な evidence または blocker 記録が outputs 配下に保存されている。

## 出力

- outputs/phase-13/main.md
- outputs/phase-13/local-check-result.md
- outputs/phase-13/change-summary.md
- outputs/phase-13/pr-template.md
- outputs/phase-13/pr-info.md
- outputs/phase-13/pr-creation-result.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-394-stablekey-strict-ci-gate |
| phase | 13 |
| taskType | implementation / NON_VISUAL |
| state | spec_created / blocked_by_legacy_cleanup |

## 目的

Phase 13: PR 作成 の目的は、strict stableKey CI gate を legacy cleanup 完了後に安全に有効化できるよう、現行 blocker と実行条件を矛盾なく固定すること。

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

- 対応する `outputs/phase-13/` 配下に実測または blocked-state evidence を保存する。
- 実装前提が満たされない場合は `BLOCKED_BY_LEGACY_CLEANUP` として記録し、PASS と誤記しない。

## 統合テスト連携

NON_VISUAL。UI screenshot は不要。主な検証は `pnpm lint:stablekey:strict`、command trace、branch protection snapshot、Phase 12 strict 7 files の実体確認で行う。
