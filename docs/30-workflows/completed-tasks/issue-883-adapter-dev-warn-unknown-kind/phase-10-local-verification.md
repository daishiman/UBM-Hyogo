# Phase 10: ローカル検証

[実装区分: 実装仕様書]

## メタ情報

| 項目     | 内容                                              |
| -------- | ------------------------------------------------- |
| タスクID | issue-883-adapter-dev-warn-unknown-kind           |
| Issue    | #883                                              |

## 実行コマンド（順序通り）

```bash
# 1. 依存（必要時のみ）
mise exec -- pnpm install

# 2. 型 / lint
mise exec -- pnpm typecheck 2>&1 | tee docs/30-workflows/issue-883-adapter-dev-warn-unknown-kind/outputs/phase-11/typecheck.log
mise exec -- pnpm lint 2>&1 | tee docs/30-workflows/issue-883-adapter-dev-warn-unknown-kind/outputs/phase-11/lint.log

# 3. adapter spec (9 case 全 green)
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  src/lib/adapters/__tests__/member-detail.spec.ts \
  2>&1 | tee docs/30-workflows/issue-883-adapter-dev-warn-unknown-kind/outputs/phase-11/adapter-test.log

# 4. production build (webpack 経路)
ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 \
  mise exec -- pnpm --filter @ubm-hyogo/web build \
  2>&1 | tee docs/30-workflows/issue-883-adapter-dev-warn-unknown-kind/outputs/phase-11/build.log

# 5. DCE grep (期待: 0)。`.next/cache` は webpack cache なので production artifact 対象外。
grep -R "\[member-detail\] unknown kind" apps/web/.next/server apps/web/.open-next 2>/dev/null | wc -l \
  | tee docs/30-workflows/issue-883-adapter-dev-warn-unknown-kind/outputs/phase-11/dce-grep.txt

# 6. Phase 12 / gate metadata（PR pre-flight の主要 component）
mise exec -- pnpm gate-metadata:validate
mise exec -- pnpm verify:phase12-compliance
```

## 手動確認（任意）

```bash
# local dev で /members/[id] を開き、unknown kind を仕込んだ fixture 配信時に
# devtools console に "[member-detail] unknown kind ..." が出ることを目視。
mise exec -- pnpm --filter @ubm-hyogo/web dev
# → http://localhost:3000/members/<fixture id>
```

## 失敗時切り分け

| 症状                                                            | 切り分け                                                                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| typecheck で `ToMemberDetailPropsOptions` 関連エラー             | export 漏れ / import path 確認。`@/lib/adapters/member-detail` 経由参照のみ                                                            |
| adapter spec TC-09 が `toHaveBeenCalledTimes(1)` で fail        | tampered fixture の `kind` 改変が反映されているか確認。`structuredClone` のオブジェクト境界に注意                                      |
| spec TC-05 (既存 silent skip) が fail                           | 後方互換破壊。`options = {}` default が抜けている可能性                                                                                |
| build fail                                                      | OpenNext Workers 互換のため `next build --webpack` 経路で実行されること、`ENVIRONMENT` / `NEXT_PUBLIC_API_BASE_URL` の local build env が入っていることを確認 |
| DCE grep が 0 でない                                            | R-01 緩和策発動。`process.env.NODE_ENV === "development"` の表記揺れ / build 設定の `NODE_ENV` 未注入を疑う。`.next/cache` のみの hit は bundle 残存ではない |
| verify:phase12-compliance fail                                  | `outputs/phase-12/phase12-task-spec-compliance-check.md` の canonical 9 headings と Phase 11 evidence `present` 行の物理実在を確認 |

## CONST_005 必須項目（再掲）

| 項目                       | 本 Phase での所在                                            |
| -------------------------- | ------------------------------------------------------------ |
| 変更対象ファイル一覧       | Phase 5 §「変更対象ファイル一覧」                            |
| 関数シグネチャ             | Phase 4 §「関数シグネチャ」 / Phase 5 §「関数シグネチャ」    |
| 入出力・副作用             | Phase 4 §「adapter 動作契約」 / Phase 5 §「入出力・副作用」  |
| テストファイル/ケース      | Phase 6 §「ケース一覧」                                      |
| ローカル実行コマンド       | 本 Phase §「実行コマンド」                                   |
| DoD                        | Phase 8 §「DoD チェックリスト」                              |

## 共通骨格補足

## 目的

本 Phase の仕様観点を固定し、issue-883 の実装・検証・文書同期が後続 Phase と矛盾しない状態にする。

## 実行タスク

- 本文に記載した対象ファイル、契約、検証、証跡を確認する。
- 漏れが見つかった場合は同一サイクル内で修正する。

## 参照資料

- `artifacts.json`
- `outputs/phase-11/`
- `outputs/phase-12/`

## 実行手順

1. 既存本文の仕様・実績を確認する。
2. 実コード、証跡、正本仕様との対応を照合する。
3. 差分があれば同一サイクル内で反映する。

## 統合テスト連携

NON_VISUAL だが実装タスクのため、adapter spec / web tests / typecheck / lint / build / DCE grep を Phase 11 evidence に接続する。

## 多角的チェック観点（AIが判断）

- 矛盾なし
- 漏れなし
- 整合性あり
- 依存関係整合

## サブタスク管理

本タスクは S1-S5 を同一 workflow 内で完了する。未タスク化は検出なし。

## 成果物

- 本 Phase ファイル
- 関連する実コード / evidence / Phase 12 outputs

## 完了条件

- [x] 本 Phase の記述が実装・証跡・正本仕様と一致している。
- [x] coverage AC は adapter spec / web test / typecheck / lint / build evidence で代替確認する。

## タスク100%実行確認【必須】

- [x] この Phase に必要な確認を実施済み。

## 次Phase

次 Phase へ進む前に、本 Phase の差分と evidence を確認する。

