# Phase 6: 静的検証（typecheck / lint / grep gate）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 種別 | 静的検証 |
| 入力 | Phase 4 実装、Phase 5 PASS |
| 出力 | typecheck / lint / grep ログ（全 PASS / 0 件） |

## 目的

mechanical 置換完了後の最終静的検証を 3 系統で実施し、`AdminMutationError` の残存が `apps/web` 配下に**0 件**であることを保証する。

## 実行手順

```bash
# 1. typecheck
mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-11/evidence/typecheck.log

# 2. lint
mise exec -- pnpm lint 2>&1 | tee outputs/phase-11/evidence/lint.log

# 3. grep gate: AdminMutationError 残存 0 件
grep -rn "AdminMutationError" apps/web --include='*.ts' --include='*.tsx' \
  | tee outputs/phase-11/evidence/grep-gate.log
test ! -s outputs/phase-11/evidence/grep-gate.log && echo "GATE PASS: 0 hits"

# 4. it.todo / test.todo 残留禁止 gate（参考）
grep -rn "it\.todo\|test\.todo" apps/web/src/components/admin/__tests__/ apps/web/src/features/admin/hooks/__tests__/ \
  || echo "todo none"
```

## 完了条件


- [x] Phase 6 の完了条件を満たす証跡が保存されている。
| Gate | 期待 |
| --- | --- |
| typecheck exit code | 0 |
| lint exit code | 0 |
| grep gate（`AdminMutationError`） | 0 件 |
| todo 新規追加 | なし |

## 失敗時の対応

- typecheck fail: Phase 4 §Step 5 を再確認（class 定義削除位置の前後 import / export が破損していないか）
- lint fail: `mise exec -- pnpm lint --fix` を試し、残る違反のみ手修正
- grep が 1 件以上: Phase 4 §Step 7 を再実行し追加置換

## 参照資料

- source spec §ローカル実行・検証コマンド
- Phase 4 §Step 7

## 実行タスク

- Phase 6 の本文に記載済みの手順を実行し、完了証跡を該当 outputs に保存する。

## 統合テスト連携

- NON_VISUAL のため画面証跡ではなく、focused Vitest / typecheck / lint / grep gate のログで連携確認する。
