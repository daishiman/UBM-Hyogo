# Phase 8: レビュー（多角的）

[実装区分: 実装仕様書]

## メタ情報

| Phase | 8 |
| 前提 | Phase 7 完了 |
| 後続 | Phase 9 |

## 目的

a11y / セキュリティ / パフォーマンス / 不変条件 / コード品質の 5 軸でセルフレビューする。

## 実行タスク

1. **a11y**
   - `aria-checked` / `aria-disabled` / `aria-live` 正しさ
   - キーボード操作（Tab / Enter / Space で chip toggle）
   - screen reader 文言（VoiceOver で確認、もしくは axe-core）
2. **セキュリティ**
   - XSS: tag.code / tag.label をそのまま innerText / children に流すのみ（dangerouslySetInnerHTML 不使用）
   - URL injection: `MEMBERS_SEARCH_LIMITS.TAG_LIMIT` で件数制限
3. **パフォーマンス**
   - D1 集計クエリの EXPLAIN（手動）
   - SSR レスポンスタイム: `pnpm --filter @ubm-hyogo/web build` 後のサイズ差確認
4. **不変条件**
   - URL repeated `?tag=` 維持
   - `density` / `sort` / `status` / `zone` の動作変化なし（regression 無し）
   - HEX 直書き 0（`grep -rn "bg-\[#\|text-\[#" apps/web/src/components/public/`）
5. **コード品質**
   - 3 新規 component が単一責務
   - `MemberFilters` が肥大化していない（200 行以内目安）

## 成果物

- `outputs/phase-08/review-report.md`（5 軸チェックリスト）

## 完了条件

- [ ] 5 軸全てに OK / 課題 / 対応策が記述された
- [ ] 重大課題は Phase 10 で対応する旨を記録

## タスク100%実行確認【必須】

- [ ] HEX 直書き grep 結果 0 を確認
- [ ] axe-core もしくは Lighthouse a11y スコアを記録

## 次Phase

Phase 9 へ。
