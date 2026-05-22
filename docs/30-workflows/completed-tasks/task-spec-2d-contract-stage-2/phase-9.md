# Phase 9: 品質保証

| 項目 | 値 |
|------|-----|
| workflow | task-spec-2d-contract-stage-2 |
| phase | 9 |
| 起点日 | 2026-05-11 |
| 実装区分 | 実装仕様書 |
| classification | NON_VISUAL / contract |
| coverageTier | standard |

---

## 1. 必須 gate 実行

| # | command | 期待 |
|---|---------|------|
| 1 | `mise exec -- pnpm install` | 新規 dependency 追加 0、lockfile drift 0 |
| 2 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | exit 0 |
| 3 | `mise exec -- pnpm lint` | exit 0 |
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/api test` | 全 vitest green（既存 + 本 spec） |
| 5 | `mise exec -- pnpm --filter @ubm-hyogo/api test contract-stage-2` | 7 describe pass、fail 0、skip 0 |

---

## 2. grep gate

| # | command | 期待 |
|---|---------|------|
| 1 | `grep -E 'z\\.object\\(' apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | 0 件（CONST_007） |
| 2 | `grep -E '\\b(test\|it\|describe)\\.skip' apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | 0 件 |
| 3 | `grep -E '^export ' apps/api/src/routes/admin/member-delete.ts \| grep DeleteBodyZ` | 1 件以上 |
| 4 | `grep -E 'ListRequestsQueryZ' apps/api/src/routes/admin/requests.ts` | 1 件以上 |
| 5 | `grep -E 'ListAuditQueryZ' apps/api/src/routes/admin/audit.ts` | 1 件以上 |

---

## 3. 行数 gate

| # | command | 期待 |
|---|---------|------|
| 1 | `wc -l apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | 200-260 |

---

## 4. 既存 import 非破壊確認

| # | 観点 | 検証 |
|---|------|------|
| 1 | `requests.ts` 内 既存 `ListQueryZ` 参照 | typecheck で参照解決 |
| 2 | `audit.ts` 内 既存 `QueryZ` 参照 | typecheck で参照解決 |
| 3 | `member-delete.ts` の既存 inline 参照 | export 化のみ。呼び出し側破壊なし |

---

## 5. 全項目 PASS 後に Phase 10 へ進む

---

## メタ情報

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local-runtime-pending |
| phase role | quality gate |

## 目的

focused contract test だけでなく、typecheck、lint、grep gate、line count、non-breaking export を同じ品質 gate で確認する。

## 実行タスク

1. `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` を実行する。
2. `mise exec -- pnpm lint` を実行する。
3. `mise exec -- pnpm --filter @ubm-hyogo/api test contract-stage-2` を実行する。
4. `z.object` / skip / named export / line count grep gate を実行する。

## 参照資料

- `phase-5.md`
- `phase-6.md`
- `phase-11.md`

## 成果物

- typecheck result
- lint result
- focused test result
- grep gate result

## 完了条件

- [x] typecheck exit 0
- [x] lint exit 0
- [x] focused test exit 0
- [x] grep gate すべて期待値通り
- [x] タスク100%実行確認: Phase 9 の実行タスクをすべて完了してから Phase 10 へ進む

## 統合テスト連携

Phase 9 の実測結果を Phase 11 の tracked evidence に保存する。`pnpm install` は依存追加がないため必須 gate ではなく、lockfile drift がある場合のみ確認する。
