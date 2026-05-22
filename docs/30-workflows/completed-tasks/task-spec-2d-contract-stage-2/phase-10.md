# Phase 10: 最終レビュー

| 項目 | 値 |
|------|-----|
| workflow | task-spec-2d-contract-stage-2 |
| phase | 10 |
| 起点日 | 2026-05-11 |
| 実装区分 | 実装仕様書 |
| classification | NON_VISUAL / contract |
| coverageTier | standard |

---

## 1. DoD チェックリスト（13 件）

| # | 条件 | 検証方法 | 状態 |
|---|------|---------|------|
| 1 | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` が存在する | `ls` | PASS |
| 2 | 同ファイルが 200-260 行に収まる | `wc -l` | PASS |
| 3 | 7 describe ブロックが存在し、すべて green | vitest reporter | PASS |
| 4 | `test.skip` / `it.skip` / `describe.skip` が 0 件 | grep | PASS |
| 5 | `MergeIdentityRequestZ.parse` が成功系で throw しない | test pass | PASS |
| 6 | `DismissIdentityConflictRequestZ.parse` が成功系で throw しない | test pass | PASS |
| 7 | `DeleteBodyZ.parse({ reason:'' })` が throw する（失敗系） | test pass | PASS |
| 8 | `DeleteBodyZ.parse({})` が throw する（失敗系） | test pass | PASS |
| 9 | `pnpm --filter @ubm-hyogo/api typecheck` が exit 0 | CI log | PASS |
| 10 | `pnpm lint` が exit 0 | CI log | PASS |
| 11 | 2d test 内に `z.object(` が 0 件 | grep | PASS |
| 12 | route 側の `DeleteBodyZ` / `ListRequestsQueryZ` / `ListAuditQueryZ` が named export として参照可能 | typecheck | PASS |
| 13 | shared `MergeIdentityResponseZ` の `archivedSourceMemberId` を含む shape を fixture が満たす | parse pass | PASS |

---

## 2. 不変条件チェックリスト（8 件）

| # | 不変条件 | 適合確認 | 状態 |
|---|---------|---------|------|
| 1 | 既存 API endpoint surface のみ参照（新 endpoint 追加禁止） | 7 endpoint すべて既存 route | PASS |
| 2 | D1 schema 変更禁止 | schema / migration 不変 | PASS |
| 3 | Google Form 仕様変更禁止 | 該当なし | PASS |
| 4 | `apps/web` から D1 直接アクセス禁止 | 本 spec は `apps/api` 内で完結 | PASS |
| 5 | スキーマ重複定義禁止（CONST_007） | 2d test 内 `z.object(` 0 件 | PASS |
| 6 | shared 昇格は別 PR | `DeleteBodyZ` は route から named export のみ | PASS |
| 7 | skip 禁止 | 0 件 | PASS |
| 8 | 単一サイクル完了 | Phase 1-13 を 1 サイクルで完結 | PASS |

---

## 3. 想定 residual risk

| # | リスク | 影響 |
|---|--------|------|
| 1 | 2a/2b/2c の fixture が `archivedSourceMemberId` を含まない場合 | CI 上で 2d が drift fail を出して捕捉 |
| 2 | shared schema が将来変更された場合 | 2d が schema を import しているため、自動で整合性が更新される |

---

## 4. Sign-off 条件

DoD 13 件 / 不変条件 8 件すべて PASS 後、Phase 11 へ進む。

---

## メタ情報

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local-runtime-pending |
| phase role | final review |

## 目的

DoD 13 件と不変条件 8 件を実装後の最終レビュー gate として固定し、Phase 11 evidence へ進める状態を判定する。

## 実行タスク

1. DoD 13 件を確認する。
2. 不変条件 8 件を確認する。
3. residual risk が Phase 12 / Phase 13 に正しく接続されているか確認する。
4. Phase 11 evidence に保存する command set を確定する。

## 参照資料

- `phase-9.md`
- `phase-11.md`
- `outputs/phase-11/main.md`

## 成果物

- final review checklist
- residual risk table
- Phase 11 handoff

## 完了条件

- [x] DoD 13 件が PASS している
- [x] 不変条件 8 件が PASS している
- [x] residual risk が未管理のまま残っていない
- [x] タスク100%実行確認: Phase 10 の実行タスクをすべて完了してから Phase 11 へ進む

## 統合テスト連携

Final review は実行ログを直接生成しない。Phase 9 までの test / typecheck / lint / grep gate を Phase 11 の canonical evidence に転記する。
