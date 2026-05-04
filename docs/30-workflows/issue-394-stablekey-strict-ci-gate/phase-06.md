# Phase 6: 異常系検証

## 故意違反 fixture 設計

`scripts/lint-stablekey-literal.test.ts` 内に既に dry-run fixture が存在する想定（Phase 7 で実体確認）。本 Phase では「strict mode で必ず fail する」ことを保証する手順を定義する。

### Fixture 実行手順

```bash
# 一時的な違反を埋め込む（commit しない）
echo 'const k = "memberType";' > /tmp/violation-fixture.ts
cp /tmp/violation-fixture.ts apps/web/src/__tmp_violation__.ts
mise exec -- pnpm lint:stablekey:strict 2>&1 | tee /tmp/strict-violation-fail.txt
echo "exit_code=$?" >> /tmp/strict-violation-fail.txt
rm apps/web/src/__tmp_violation__.ts
```

期待: exit code 非 0、stdout に violation 行が含まれる。

> 注: `memberType` 等、`packages/shared/src/zod/field.ts` の `FieldByStableKeyZ` に存在する stableKey を使うこと。存在しないキーは検出対象外。

## 確認項目

| # | 項目 | 期待 |
| --- | --- | --- |
| E1 | 故意違反 fixture で strict が exit 非 0 | PASS |
| E2 | exception パス（`__fixtures__` / `*.test.ts` 等）に違反を置いた場合 strict が PASS | PASS |
| E3 | allow-list（`packages/shared/src/zod/field.ts`）に違反を置いた場合 strict が PASS | PASS |
| E4 | required context drift 検出（`gh api` 結果に `ci` が無い） | Phase 12 unassigned-task 化 |
| E5 | bypass 試行（`continue-on-error` 付与）が PR レビューで弾かれる方針 | docs に明記 |

## 完了条件

- [ ] この Phase の判断・手順・成果物が index.md の AC と矛盾しない。
- [ ] strict 0 violations 未達時は blocking CI gate を有効化しない。
- [ ] 必要な evidence または blocker 記録が outputs 配下に保存されている。

## 出力

- outputs/phase-06/main.md
- outputs/phase-06/violation-fixture-spec.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-394-stablekey-strict-ci-gate |
| phase | 6 |
| taskType | implementation / NON_VISUAL |
| state | spec_created / blocked_by_legacy_cleanup |

## 目的

Phase 6: 異常系検証 の目的は、strict stableKey CI gate を legacy cleanup 完了後に安全に有効化できるよう、現行 blocker と実行条件を矛盾なく固定すること。

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

- 対応する `outputs/phase-06/` 配下に実測または blocked-state evidence を保存する。
- 実装前提が満たされない場合は `BLOCKED_BY_LEGACY_CLEANUP` として記録し、PASS と誤記しない。

## 統合テスト連携

NON_VISUAL。UI screenshot は不要。主な検証は `pnpm lint:stablekey:strict`、command trace、branch protection snapshot、Phase 12 strict 7 files の実体確認で行う。
