# Phase 3: 設計レビュー（Phase 4 進行可否判定 / Gate-A）

- Task ID: TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001

## 1. レビュー観点と判定

| 観点 | 判定 | コメント |
| --- | --- | --- |
| 責務境界 | ✅ | intra-bar focus = bar 所有、unmount fallback = 親所有。混在なし |
| 依存関係 | ✅ | `topTags`（既存 props）依存のみ。API/D1/Form 不変条件を侵さない |
| 状態所有権 | ✅ | `tagLabels` は親導出、chips は bar 純粋導出、focus ref は bar local |
| 後方互換 | ✅ | `tagLabels`/`onEmpty` は optional。未指定で現行挙動に degrade |
| a11y | ✅ | `aria-label`（removeLabel）も表示名に揃え、視覚と読み上げを一致。focus 復帰でキーボード連続性確保 |
| デザイントークン | ✅ | mobile CSS は `var(--ubm-...)` のみ。HEX 直書きなし |
| テスト容易性 | ✅ | chip label / focus 遷移 / sort 非 chip 化はすべて DOM 観測可能。`@testing-library` + `user-event` で固定可 |
| スコープ（CONST_007） | ✅ | 3 file edit + 2 spec で 1 cycle 完了。先送り項目なし |

## 2. 強化ループ / バランスループ

- **強化ループ**: 表示名解決 → ユーザーが chip の意味を理解 → フィルタ操作が増える → focus 復帰でキーボード操作が途切れない → 操作体験が向上。
- **バランスループ**: `topTags` 未登録 code は表示名に解決できない → code fallback で「壊れない」最低保証 → 将来 API 拡張（#222 系）で全 tag label 解決へ拡張可能（本タスクのスコープ外）。

## 3. リスクと対策（元 Issue リスク表に整合）

| リスク | 対策 | 反映先 |
| --- | --- | --- |
| tag label 解決のため Server Component / API contract へ過剰に踏み込む | 既存 props（`topTags`）から導出する map に限定。API schema 変更なし | Phase 2 §2/§3 |
| focus 戻しで React state / URL navigation のタイミングが競合 | `user-event` ベースの focused spec で「削除後 focus」を観測固定。`useEffect` は chips key 変化を依存に持つ | Phase 4 |
| mobile chip overflow CSS が他ページへ波及 | selector を `[data-component="selected-filters-bar"]` 配下に閉じる | Phase 2 §5 |
| `Search` が ref 転送非対応で `onEmpty` focus が実装困難 | ref 転送 or `querySelector` fallback の二択を許容。観測挙動を test で固定 | Phase 2 §4.3 / Phase 5 |
| `removeLabel` 文言変更で既存 spec が壊れる | Phase 4 で既存 spec の期待値を表示名へ更新（回帰として明記） | Phase 4/6 |

## 4. Phase 4 進行判定

**判定: 進行可（GO）**

設計は単一責務・最小差分・後方互換・不変条件遵守を満たす。Phase 4（テスト作成 / TDD RED）へ進む。命名規則（Phase 1 §4）とテストパターンの整合は Phase 4 冒頭で再確認する。

## 5. Gate-A 記録

| Gate | 状態 | evidence |
| --- | --- | --- |
| Gate-A（spec_review） | pass。Phase 4 進行可の設計レビューを根拠に実装済み。現在は `implemented_local_runtime_pending` | outputs/phase-3/phase-3.md |
