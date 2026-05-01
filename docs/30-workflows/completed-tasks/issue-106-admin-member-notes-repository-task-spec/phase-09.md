# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| 対象 | typecheck / lint / test / static checks |

## 目的

実装後の品質 gate を定義し、無料枠・セキュリティ・境界要件と整合させる。

## 実行タスク

1. TypeScript 型検証を実行する。
2. lint / boundary check を実行する。
3. repository test を実行する。
4. `admin_member_notes` が public/member JSON に出ないことを確認する。

## 参照資料

- `package.json`
- `apps/api/package.json`
- `scripts/lint-boundaries.mjs`

## 実行手順

候補コマンド:

```bash
pnpm --filter ./apps/api typecheck
pnpm --filter ./apps/api lint
pnpm --filter ./apps/api test -- adminNotes
pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/member-notes.test.ts apps/api/src/routes/admin/members.test.ts apps/api/src/repository/__tests__/adminNotes.test.ts
node scripts/lint-boundaries.mjs
```

## 統合テスト連携

Phase 9 で Phase 4 の test matrix と Phase 7 の AC matrix を照合し、未検証 AC を 0 件にする。

## 多角的チェック観点（AIが判断）

- D1 reads は member detail drawer 用であり、50 人規模 MVP の無料枠内。
- secret は追加しない。
- write path は 04c consumer handoff verification として扱い、本 Issue の read repository AC と混同しない。

## サブタスク管理

| ID | 内容 | 完了条件 |
| --- | --- | --- |
| P9-1 | typecheck | 実測 PASS を `outputs/phase-09/main.md` に記録。未実行は `NOT_EXECUTED` |
| P9-2 | lint/boundary | 実測 PASS を `outputs/phase-09/main.md` に記録。未実行は `NOT_EXECUTED` |
| P9-3 | vitest | 実測 PASS を `outputs/phase-09/main.md` に記録。未実行は `NOT_EXECUTED` |
| P9-4 | AC matrix | Core 未検証 0。Handoff は委譲先と証跡 path を明記 |

## 成果物

- test-output.txt
- boundary-output.txt
- quality-summary.md

## 完了条件

- [ ] Core AC は実測 PASS、Handoff AC は明示委譲済み、Guardrail AC は違反なしとして記録されている。
- [ ] secret / environment variable の追加がない。

## タスク100%実行確認【必須】

- [ ] 失敗コマンドがある場合は Phase 10 の NO-GO に回す。

## 次Phase

Phase 10: 最終レビュー。
