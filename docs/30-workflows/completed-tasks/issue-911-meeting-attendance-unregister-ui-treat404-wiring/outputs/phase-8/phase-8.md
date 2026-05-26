**[実装区分: 実装仕様書]**

# Phase 8: リスクと緩和策

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `implemented_local_evidence_captured` |
| 入力 | Phase 1-7 |

## 1. リスク一覧と緩和策

| ID | リスク | 影響 | 確率 | 緩和策 | 検知手段 |
|---|---|---|---|---|---|
| R-01 | `treat404AsSuccess` を **register 側** mutation に誤適用 | 「未登録 → 登録」直後の 404 race を成功扱いし、UI が登録済みと誤表示 | 中 | mutation を 2 インスタンス分離（Phase 6 §2 不変条件 1）。register 側 404 は A6b で失敗 toast を assert | RTL spec + コードレビュー |
| R-02 | 404 success path の `trigger` 戻り値 `undefined` を caller が `.foo` access して落ちる | runtime null deref / 解除 UI 全体クラッシュ | 中 | Phase 6 §3 で resolve value を toast 分岐にのみ使う実装ルールを明文化 | typecheck + RTL B4 |
| R-03 | 新規 spec を **`*.test.tsx`** で命名し lefthook `block-test-suffix` で reject | commit 不能 / CI fail | 低 | Phase 5 §2 で `.spec.tsx` 命名強制を明文化。CLAUDE.md 不変条件 8 を引用 | lefthook pre-commit / GitHub Actions `verify-test-suffix` |
| R-04 | `@/lib/useAdminMutation` legacy への新規参照（CLAUDE.md 不変条件 10 違反） | 不変条件違反 / lint fail | 低 | Phase 6 §2 で `@/features/admin/hooks/useAdminMutation` 経由を強制 | `mise exec -- rg -n "from \"@/lib/useAdminMutation\"" apps/web` で 0 件確認 |
| R-05 | 同種 **DELETE-race caller** の見落とし（他の admin panel で同じ pattern が必要） | 別 issue として再発、本 task 範囲外で類似 race の本番障害 | 中 | Phase 9 で `mise exec -- rg -n 'useAdminMutation\([^)]*"DELETE"' apps/web` を実行し棚卸し。検出時は本 task に追加するか、followup unassigned task として記録 | grep + Phase 12 unassigned-task-detection |
| R-06 | `refreshOnSuccess: false` の効果がなく追加 refresh が走る | 連打時 race / D1 への過剰アクセス | 低 | `useAdminMutation` 既存 spec で `refreshOnSuccess: false` 経路を確認済。B3/B4 は DOM state が local 更新されることを assert | RTL spec |
| R-07 | toast 文言の重複・揺れ（「解除しました」「削除しました」など揺れる） | UX 一貫性低下 | 低 | Phase 6 §4 で文言を一覧固定 | grep + 目視 |
| R-08 | a11y 退行（解除 CTA 追加で操作対象が増える） | キーボード利用者の操作性低下 | 低 | native button + status role を維持し、既存 layout primitive を変更しない | RTL + コードレビュー |
| R-09 | API endpoint 改変への誘惑（新 DELETE route 追加） | CLAUDE.md UI prototype alignment 不変条件 1 違反 | 低 | Phase 1 / Phase 6 で「API 無改変」を強制。`git diff dev -- apps/api/` が空であることを Phase 9 で確認 | git diff |
| R-10 | mock fetch が API 側の `attended` parameter を verify せず緑になる | API contract drift の見落とし | 低 | B2 で fetch body に `attended: false` が含まれることを assert | RTL spec |

## 2. リスク重み付け

| 重要度 | リスク ID |
|---|---|
| 高（特に注視） | R-01, R-02, R-05 |
| 中 | R-03, R-04, R-09 |
| 低 | R-06, R-07, R-08, R-10 |

## 3. 緩和策の検証順序（Phase 9 と接続）

1. R-03 / R-04 → 静的解析（lint / lefthook / grep）で即時検出
2. R-01 / R-02 / R-06 / R-08 / R-10 → RTL spec 実行で検出
3. R-05 → grep 棚卸し、必要に応じ followup task 化
4. R-09 → `git diff dev -- apps/api/` 確認

## 4. Phase 8 完了条件

- [x] 10 件のリスクを表形式で列挙
- [x] 影響 / 確率 / 緩和策 / 検知手段を明示
- [x] 高重要度 3 件を抽出
- [x] Phase 9 への接続順序を明示

## 5. 次 Phase への引き継ぎ

Phase 9 では本 Phase の R-01..R-10 を踏まえ、実装後検証の具体コマンドと期待結果、Gate-B 提示を行う。
