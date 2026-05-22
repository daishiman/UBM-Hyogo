# Phase 6: テストコード側 grep verification

## 目的

テストコード（`*.spec.ts`）側でも `assigned_via_queue_id` への参照が存在しないこと、および queue 追跡を audit_log で行う既存テストが存在することを grep で確認し、テスト変更も不要であることを evidence として記録する。

## 入力

- `apps/api/src/workflows/tagQueueResolve.contract.spec.ts`
- `apps/api/src/workflows/tagQueueResolve.integration.spec.ts`（存在すれば）
- `apps/api/src/workflows/tagQueueRetryTick.contract.spec.ts`
- `apps/api/src/db/repositories/**/*.spec.ts`
- `packages/shared/**/*.spec.ts`

## 作業手順

1. `rg "assigned_via_queue_id" '**/*.spec.ts'` 相当のコマンドでテストコード全体を grep し、0 件であることを確認する。
2. `tag_queue` を target_type に持つ audit_log assertion が test に存在することを確認する（既存 `apps/api/src/workflows/tagQueueRetryTick.contract.spec.ts:104` で `target_type: "tag_queue"` の assertion を確認済み）。
3. member_tags insert fixture に `assigned_via_queue_id` 列が含まれていないこと（= 現行 6 列のみ）を確認する。
4. `verify-test-suffix` gate（`*.spec.ts` のみ許可）に抵触する変更が無いことを念のため確認する。
5. 結果を `outputs/phase-06/test-grep-verification.md` に集約する。

## 出力成果物

- `outputs/phase-06/test-grep-verification.md`
  - 各 grep 結果と該当行抜粋
  - テスト変更不要の結論

## 検証コマンド

```bash
# (1) test 側に assigned_via_queue_id が無いこと（期待: 0 件）
rg -n "assigned_via_queue_id" apps/api/src/**/*.spec.ts packages/**/*.spec.ts 2>/dev/null || echo "OK: 0 hits"

# (2) target_type='tag_queue' assertion が test に存在
rg -n "target_type.*tag_queue|targetType.*tag_queue" apps/api/src/**/*.spec.ts

# (3) member_tags insert fixture の列構成
rg -n "member_tags|memberTags" apps/api/src/**/*.spec.ts | head -30

# (4) test suffix 規約
rg -l "\.test\.ts" apps/api/src/ packages/ 2>/dev/null || echo "OK: no forbidden .test.ts"
```

## DoD

- [ ] (1) の出力が 0 件であることを記録した
- [ ] (2) のヒット件数 ≥ 1 を記録した
- [ ] (3) で member_tags fixture に 6 列以外が無いことを確認した
- [ ] (4) で `.test.ts` 違反が無いことを確認した
- [ ] 「テスト変更不要」結論を `outputs/phase-06/test-grep-verification.md` に明記した
