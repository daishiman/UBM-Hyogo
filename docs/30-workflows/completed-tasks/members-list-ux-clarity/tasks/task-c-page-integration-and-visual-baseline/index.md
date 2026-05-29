<!-- workflow: members-list-ux-clarity / task: C / phase: index -->

[実装区分: 実装仕様書]

# Task C — page-integration-and-visual-baseline

> 親 workflow: `docs/30-workflows/completed-tasks/members-list-ux-clarity/`
> Branch: `feat/members-list-ux-clarity`
> 実装区分: 実装仕様書 (CONST_004) / taskType=implementation / visualEvidence=VISUAL
> 状態: `spec_created`

## 1. タスク概要

Task A (`DensityToggle` UX 強化) と Task B (`MemberFilters` live-filter affordance + `SelectedFiltersBar` 一般化) で完成した子 component を、公開 `/members` ページに統合する。具体的には:

1. `apps/web/app/(public)/members/page.tsx` から `MemberFilters` に件数 prop (`totalCount` / `displayedCount`) を受け渡しする。
2. 既存 `<p data-role="pagination-meta">` を機械可読 metadata 専用に縮退し、ユーザー向け件数表示は `MemberFilters` 内 `<output data-role="result-count">` に集約する。
3. `apps/web/app/(public)/members/page.spec.tsx`（vitest）の期待値を新 UI に合わせて修正する（見出しテキストは不変、`data-role="pagination-meta"` 期待値の縮退、`MemberFilters` props 渡し検証）。
4. Playwright visual baseline `apps/web/playwright/tests/members-ux-clarity.spec.ts` を新規追加し、4 viewport × 3 density × 2 state の baseline を取得する。
5. 既存 `members-prototype-alignment.spec.ts` を必要に応じて更新（`SelectedTagsBar` → `SelectedFiltersBar` rename / 新 microcopy 追加に伴う selector 整合）。

UI 内部実装は Task A / B が担当しており、本 task は **page integration の表面 1 ファイル + spec 2 ファイル + Playwright spec 1 ファイル** に閉じる。

## 2. 依存順序 (CONST_007: 1 サイクル完了)

| Step | 担当 | 必須前提 |
| ---- | ---- | -------- |
| Task A 実装 | 別エージェント | parent Phase 1-3 完了 |
| Task B 実装 | 別エージェント | parent Phase 1-3 完了 + Task B 側で `SelectedFiltersBar` の `totalCount` / `displayedCount` prop API 確定 |
| **Task C 実装 (本仕様書)** | 本エージェント | Task A / Task B 完了 (Task B の prop shape 凍結後) |

> Task C は Task A / B 完了後の **serial** で着手する。Task B が提供する `MemberFilters` の prop shape (`totalCount: number` / `displayedCount: number`) と、`SelectedFiltersBar` 統合後の `data-role="result-count"` selector が確定していることが前提。

## 3. スコープ (CONST_005 + Inventory)

### 3.1 変更対象ファイル (新規 / 編集 / 削除)

| 種別 | パス | 概要 |
| ---- | ---- | ---- |
| 編集 | `apps/web/app/(public)/members/page.tsx` | `MemberFilters` に `totalCount` / `displayedCount` prop を受け渡し、`<p data-role="pagination-meta">` を機械可読 metadata 用に縮退 |
| 編集 | `apps/web/app/(public)/members/page.spec.tsx` | 件数表示 selector の期待値変更、`MemberFilters` 呼び出し props 検証追加 |
| 新規 | `apps/web/playwright/tests/members-ux-clarity.spec.ts` | 4 viewport × 3 density × 2 state visual baseline |
| 編集 (必要時) | `apps/web/playwright/tests/members-prototype-alignment.spec.ts` | `SelectedTagsBar` selector を `SelectedFiltersBar` に更新（Task B での rename に追従）、`data-role="result-count"` 追加 expect |

### 3.2 非スコープ

- Task A: `DensityToggle.client.tsx` / `Segmented.tsx` / `DensityToggle.client.tsx` 実装
- Task B: `MemberFilters.client.tsx` 内部実装 / `SelectedFiltersBar.client.tsx` 内部実装
- 新 primitive 追加 (INV-3)
- API endpoint / D1 schema / Google Form 仕様変更 (INV-1)
- design tokens (OKLch) 変更 (INV-4)
- D'+0 リセット運用以外の visual baseline 運用ポリシー変更

## 4. AC (親 AC からの抜粋・本 task で検証する範囲)

| 親 AC | 本 task で検証 |
| ----- | -------------- |
| AC-4 | `page.tsx` が `totalCount` / `displayedCount` を `MemberFilters` に渡し、`<output data-role="result-count">` 領域に件数が表示される |
| AC-8 | Playwright visual baseline `members-ux-clarity.spec.ts` が 4 viewport × 3 density × 2 state で撮影され、masked region で時刻系を除外する |
| AC-9 | `aria-live=polite` 領域への announce が `page.spec.tsx` から検証可能 (Task B の component spec に加え、page 統合 spec でも getByRole("status") で確認) |
| AC-7 | `verify-design-tokens` GREEN 維持 (本 task では tokens を変更しない) |

## 5. Gate 構成 (artifacts.json)

| Gate | 内容 | evidence |
| ---- | ---- | -------- |
| Gate-A | spec_review (Phase 1-3 完了) | `phase-3-design-review.md` |
| Gate-B | implementation_review (Phase 4-11 完了) | `outputs/phase-11/manual-test-result.md` |
| Gate-C | external_ops (commit / push / PR / staging visual baseline 撮影) | `outputs/phase-13/pr-creation-result.md` |

すべて user-gated。本仕様書時点では all `pending`。

## 6. 成果物一覧

| ファイル | 役割 |
| -------- | ---- |
| `index.md` | (本書) Task C の総括 |
| `artifacts.json` | task metadata + gates A/B/C |
| `phase-1-requirements.md` | Task C 要件（親 AC から本 task 範囲を抽出） |
| `phase-2-design.md` | page 統合差分 / 件数 prop 受け渡し / visual spec 構成 / viewport 一覧 |
| `phase-3-design-review.md` | 代替案比較・採用根拠 |
| `phase-4-test-plan.md` | vitest 更新点 + Playwright spec 一覧 |
| `phase-5-implementation.md` | 実装手順 (CONST_005 必須項目を完備) |
| `phase-6-test-additions.md` | 追加テスト |
| `phase-7-coverage.md` | coverage 計画 |
| `phase-8-refactor.md` | リファクタ計画 |
| `phase-9-qa.md` | QA チェックリスト |
| `phase-10-final-review.md` | 最終レビュー |
| `phase-11-manual-test.md` | 手動テスト (4 viewport × 3 状態 screenshots) |
| `../../outputs/phase-12/main.md` | ドキュメント同期 (canonical 9 headings) |
| `outputs/phase-13/main.md` | PR 作成手順 (dev base / Task A/B/C 合流 PR) |

## 7. 不変条件再掲

- 親 INV-1〜INV-6 を遵守
- 新 primitive 0
- API / Schema / Token 変更 0
- `*.spec.ts(x)` 命名のみ（`*.test.*` 禁止）
- D1 直接アクセス禁止（本 task は web 層のみ）

## 8. DoD

- [ ] `tasks/task-c-page-integration-and-visual-baseline/` 直下に Phase 1-13 + outputs/phase-12, outputs/phase-13 が配置されている
- [ ] artifacts.json が canonical schema (gates A/B/C / passed_at null / status pending) で配置されている
- [ ] Phase 5 が CONST_005 必須項目（変更対象ファイル / 差分方針 / Playwright spec 命名 / storageState / ローカル実行コマンド / baseline 取得手順 / DoD）を完備
- [ ] Phase 11 が 4 viewport × 3 状態の screenshots 計画を含む
- [ ] Phase 12 が canonical 9 headings 準拠で outputs/phase-12/ 配下に main.md を持つ
- [ ] Phase 13 が dev base / Task A/B/C 合流 PR である旨を明記
