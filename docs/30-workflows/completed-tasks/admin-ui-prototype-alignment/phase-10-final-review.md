---
実装区分: 実装仕様書
状態: completed
Phase: 10
作成日: 2026-05-23
task_id: admin-ui-prototype-alignment
親: [index.md](./index.md)
前: [phase-9-qa.md](./phase-9-qa.md)
次: [phase-11-manual-test.md](./phase-11-manual-test.md)
---

# Phase 10: 最終レビュー

## 1. 目的

Phase 9 までで機械チェックは通っている前提で、人間視点での acceptance criteria 全件確認・blocker/MINOR 判定・今回サイクル内修正方針を確定する。Phase 11 (手動 / VISUAL) 前の最終ゲート。

## 2. Acceptance Criteria 全件チェック

| # | 条件 | 検証方法 | 判定 |
| ---- | ---- | ---- | ---- |
| AC-01 | staging で `/admin` 配下 11 route が 200 で返る | Phase 11 で実地確認 (本 Phase は code review のみ) | pending → Phase 11 |
| AC-02 | dashboard API fail 時に画面全停止せず per-section degrade | TC-PG-DASH-002 + TC-FAIL-001..005 PASS / `app/(admin)/admin/page.tsx` に `fetchAdmin` 直接 await が 0 件 | チェック対象 |
| AC-03 | プロトタイプ正本 `pages-admin.jsx` の KPI/Zone/Members/Tags/Schema と視覚整合 | Phase 11 screenshot で確認 | pending → Phase 11 |
| AC-04 | `_shared/` 6 component + barrel + helper が実装されている | `ls` で 7 ファイル + `safeServerFetch.ts` 存在 | チェック対象 |
| AC-05 | HEX 直書き 0 件 | Phase 9 §3 grep | チェック対象 |
| AC-06 | FormField / useAdminMutation 不変条件遵守 | `grep -rn "<input " apps/web/src/components/admin` で 0 件、`from "@/lib/useAdminMutation"` で 0 件 | チェック対象 |
| AC-07 | テストファイル名は `*.spec.{ts,tsx}` のみ | `find apps/web -name '*.test.*'` で 0 件 | チェック対象 |
| AC-08 | typecheck / lint / build / vitest / Playwright smoke 全 PASS | Phase 9 Q-02..06 結果 | チェック対象 |
| AC-09 | coverage 目標達成 | Phase 7 report | チェック対象 |
| AC-10 | `verify-design-tokens` / `verify-pr-ready` PASS | Phase 9 Q-07/08 結果 | チェック対象 |
| AC-11 | `_shared` への import が barrel 経由 | Phase 8 §3 grep 結果 | チェック対象 |
| AC-12 | sidebar nav と実 route の差集合が空 | Phase 8 §4.1 結果 | チェック対象 |
| AC-13 | 不変条件 (CLAUDE.md #1〜#10) に違反していない | 目視 + grep | チェック対象 |

## 3. Blocker / MINOR 判定基準

| 区分 | 定義 | 対応 |
| ---- | ---- | ---- |
| **Blocker** | AC-02, AC-05, AC-06, AC-07, AC-08, AC-10, AC-13 のいずれか fail | Phase 5/6/8 へ差し戻して本 PR 内で fix |
| **MAJOR** | AC-04, AC-09, AC-11, AC-12 fail | 本 PR 内で fix を試みる。1 サイクルで不可なら Phase 11 staging 確認後に判断 |
| **MINOR** | プロトタイプとの microcopy 差 / アイコンサイズ ±2px / token 名選択の好み | 原則として今回サイクル内で修正。採用しない場合は理由を §5 に記録 |
| **VISUAL only** | AC-01, AC-03 | Phase 11 で評価 |

## 4. レビュー観点別チェックリスト

### 4.1 設計遵守

- [ ] page.tsx 内に `try/catch` を書いていない (`safeServerFetch` で代替されている)
- [ ] `_shared` component が internal `useState` を持たない (Phase 4 §11 controlled 方針)
- [ ] `AdminSectionError` の `onRetry` を server component 側で渡していない (client wrapper 経由か未指定)
- [ ] `tokens.css` の既存トークン値を変更していない (追加のみ)

### 4.2 不変条件遵守 (CLAUDE.md)

- [ ] #5 D1 直接アクセスなし
- [ ] #8 `*.test.*` 新規 0 件
- [ ] #9 admin form input は FormField 経由
- [ ] #10 admin mutation は `@/features/admin/hooks/useAdminMutation` 経由

### 4.3 命名

- [ ] component 名 `Admin*` prefix
- [ ] props 型 `Admin*Props`
- [ ] file 名 PascalCase + `.tsx`

### 4.4 ドキュメント前提

- [ ] Phase 12 で必要となる「変更ファイル一覧」「fail path 一覧」「token 検証結果」が outputs/phase-7..9 で取れている

## 5. MINOR 今回サイクル内修正方針

MINOR 指摘は本 PR 内で fix しない。代わりに以下に追記する:

- `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-10/minor-followups.md`
  - 形式: `[ ] [path] 内容 (推定工数: XS/S/M)`
- 件数が多い (≥5) 場合は別 task として GitHub issue 起票候補リストを `outputs/phase-12/unassigned-task-detection.md` に転記

## 6. 出力 (Phase 10)

- `outputs/phase-10/review-result.md` (本表の判定結果)
- `outputs/phase-10/minor-followups.md` (MINOR 一覧、0 件でも空ファイル作成)

## 7. DoD (Phase 10)

## メタ情報

- task_id: `admin-ui-prototype-alignment`
- Phase: 10
- workflow_state: `implemented_local_runtime_pending`

## 目的

Phase 11 前に acceptance criteria、blocker、MINOR の扱いを人間視点で確認する。

## 実行タスク

- AC 全件を Phase 9 evidence と照合する
- blocker と MINOR を分類する
- MINOR は今回サイクル内修正または採用しない理由へ整理する

## 参照資料

- `phase-9-qa.md`
- `phase-11-manual-test.md`

## 成果物/実行手順

- `outputs/phase-10/review-result.md` と `outputs/phase-10/minor-followups.md` を作成する

## 統合テスト連携

- review で検出した regression risk を Phase 11 visual / manual checks へ反映する

## 完了条件

- Phase 11 に進む可否と残リスクが明示されている

- [ ] AC-02, AC-04..AC-13 全て pass
- [ ] Blocker 0 件 (検出時は Phase 5/6/8 差し戻し→再 Phase 9→再 Phase 10)
- [ ] MAJOR の判定理由が記録されている
- [ ] MINOR follow-up list が出力されている
- [ ] Phase 11 へ進む合意 (本 Phase で AC-01, AC-03 は pending のまま)
