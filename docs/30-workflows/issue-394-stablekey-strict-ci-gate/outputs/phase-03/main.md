# Phase 3: 設計レビュー — outputs/main

## 判定

`PASS`。代替 3 案を評価し、Phase 2 採用案（既存 `ci` job への step 追加）が最小破壊・最小 drift であることを確定。

## 代替案評価

| 案 | 概要 | 判定 | 備考 |
| --- | --- | --- | --- |
| A. 既存 `ci` job 内 step 追加（Phase 2 採用） | `pnpm lint` 直後に `Lint stableKey strict` を追加 | **PASS** | required context `ci` を維持。branch protection 変更不要 |
| B. 新 lint job（`stablekey-strict`） | 新 job として独立実行 | MAJOR | 新 context 名 drift。required_status_checks の PUT が必要となり scope out に抵触 |
| C. matrix / reusable workflow 展開 | 既存 lint を matrix 化 | MAJOR | 既存 `ci` job 構造を破壊。drift 大 |

## 整合チェック

- 03a 親 workflow AC-7 昇格条件と整合: ✅
- branch protection required context (`ci` / `Validate Build`) と整合: ✅
- aiworkflow-requirements 正本との整合: ✅

## 完了条件チェック

- [x] AC と矛盾なし。
- [x] strict 0 violations 未達時は CI gate 化しない方針を維持。
- [x] 設計レビュー結果を本 Phase に保存。
