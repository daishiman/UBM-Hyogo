# Phase 7: 品質ゲート

[実装区分: 実装仕様書]

## メタ情報

| 項目     | 内容                                                |
| -------- | --------------------------------------------------- |
| タスクID | issue-883-adapter-dev-warn-unknown-kind             |
| 対象     | Gate-A / Gate-B / Gate-C 定義                       |
| Issue    | #883                                                |

## Gate-A: 仕様レビュー（spec_review）

| 項目                         | 期待                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| Phase 1-13 全 phase の md 存在 | 13 ファイル                                                                                          |
| `artifacts.json` 構造        | parent #827 と同等。`task_type="implementation"` / `spec_classification="implementation_spec"` 明記 |
| canonical 9 headings         | `phase-12-documentation.md` が 9 見出し厳守                                                          |
| `gate-metadata:validate`     | exit 0                                                                                              |
| `verify:phase12-compliance`  | exit 0                                                                                              |

実行:

```bash
mise exec -- pnpm gate-metadata:validate
mise exec -- pnpm verify:phase12-compliance
```

## Gate-B: 実装レビュー（implementation_review）

| 項目                                                        | コマンド                                                                                                | 期待       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------- |
| typecheck                                                   | `mise exec -- pnpm typecheck`                                                                           | exit 0     |
| lint                                                        | `mise exec -- pnpm lint`                                                                                | exit 0     |
| adapter spec (8→10 case green)                               | `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/adapters/__tests__/member-detail.spec.ts`    | green / 10 passed |
| production build                                            | `ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0     |
| **DCE 検証 (production artifact に warn 文字列 0 件)**       | `grep -R "\[member-detail\] unknown kind" apps/web/.next/server apps/web/.open-next 2>/dev/null \| wc -l` | `0`        |
| gate metadata                                               | `mise exec -- pnpm gate-metadata:validate`                                                              | ERROR: 0   |
| Phase 12 compliance                                         | `mise exec -- pnpm verify:phase12-compliance`                                                           | pass       |

`bash scripts/verify-pr-ready.sh` は Phase 13 の push 前確認で実行する。未コミット index 変更を含む作業中状態では `indexes:rebuild drift` を検出するため、本 Phase では component gate を個別実行する。

## Gate-C: 外部運用（external_ops）

| 項目                              | 期待                                            |
| --------------------------------- | ----------------------------------------------- |
| commit                            | user 明示承認後に実行                            |
| push                              | user 明示承認後に実行                            |
| `gh pr create --base dev`         | user 明示承認後に実行                            |
| Issue #883 mutation               | reopen しない（CLOSED 維持）。本文に「残実装の反映」と参照のみ |
| deploy / runtime verification     | 本タスク範囲外                                  |

## 設計トークン / branch protection

本タスクは CSS / 設計トークン変更なし。`verify-design-tokens` gate / `playwright-smoke` gate は影響対象外。

## visual snapshot

render 結果不変前提。`apps/web/playwright/tests/visual-full/` の baseline 更新は行わない（更新が必要になった場合は仕様逸脱として撤退条件発動）。

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

