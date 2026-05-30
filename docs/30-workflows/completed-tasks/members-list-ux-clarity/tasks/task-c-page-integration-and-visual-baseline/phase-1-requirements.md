<!-- workflow: members-list-ux-clarity / task: C / phase: 1 -->

[実装区分: 実装仕様書]

# Phase 1 — 要件定義 (Task C: page-integration-and-visual-baseline)

> 親 workflow: `docs/30-workflows/completed-tasks/members-list-ux-clarity/`
> Branch: `feat/members-list-ux-clarity`
> taskType=implementation / visualEvidence=VISUAL
> 状態: `spec_created`

## 1. 背景

親 workflow Phase 1-3 にて、`/members` 公開ページの UX 改善は 3 タスク (A/B/C) に分割された。Task A は `DensityToggle` 内部の UX 強化、Task B は `MemberFilters` の live-filter affordance と `SelectedFiltersBar` への一般化を担当する。Task A/B のみでは page.tsx 側の prop 配線（件数 propagation）と Playwright visual baseline が欠落する。

本 Task C は **page 統合と visual baseline の責務に閉じる薄い integration layer** として、Task A/B の成果物を `/members` route に乗せて UX 課題解消を完了させる。

## 2. ペルソナ・前提

- P-1 初回訪問の一般会員/見学者: 件数表示が読みやすい位置にあることを期待する
- P-2 既存会員: 適用中の絞り込み件数を一目で確認したい
- P-3 a11y 利用者 (SR / キーボード): `aria-live="polite"` で件数変化を通知してほしい
- 開発者: visual baseline で UI 退行を CI で検知したい

## 3. Goal

1. `page.tsx` から `MemberFilters` に件数 prop を渡し、Task B の `<output data-role="result-count">` で件数表示が機能する状態に到達する
2. `<p data-role="pagination-meta">` を機械可読 metadata 専用に縮退させ、二重表示を避ける
3. `page.spec.tsx` の期待値を新 UI に整合させる
4. Playwright visual baseline で 4 viewport × 3 density × 2 state の snapshots を取得し、CI で UI 退行を検知できるようにする

## 4. 受入条件 (AC) — Task C 範囲

| ID | 内容 |
| -- | ---- |
| C-AC-1 | `page.tsx` が `MemberFilters` に `totalCount={listResult.ok ? listResult.data.pagination.total : 0}` / `displayedCount={listResult.ok ? listResult.data.items.length : 0}` を渡す |
| C-AC-2 | `<p data-role="pagination-meta">` は機械可読 metadata 用に維持するが、文言を変更せずユーザー視認上は `MemberFilters` 内 `<output data-role="result-count">` に集約する（DOM 上は両方存在するが、視認用は `MemberFilters` 側のみが a11y tree に live region として乗る） |
| C-AC-3 | `page.spec.tsx` で `MemberFilters` に `totalCount` / `displayedCount` が渡っていることを検証する unit assertion がある |
| C-AC-4 | Playwright spec `members-ux-clarity.spec.ts` が新規作成され、4 viewport (375 / 768 / 1024 / 1440) × 3 density (comfy / dense / list) × 2 state (empty / filtered) で `toHaveScreenshot()` を呼ぶ |
| C-AC-5 | `members-ux-clarity.spec.ts` で時刻系・動的値の領域を `mask:` でマスクする (`time` 要素・`data-role="pagination-meta"` を mask 候補とする) |
| C-AC-6 | `members-prototype-alignment.spec.ts` が `SelectedTagsBar` selector を参照する場合、Task B の rename に追従して `SelectedFiltersBar` (または `[data-component="selected-filters-bar"]`) に更新されている |
| C-AC-7 | `verify-design-tokens` CI gate が GREEN を維持する（本 task では tokens 不変） |
| C-AC-8 | baseline PNG の commit は user-gated（CI Linux runner で初回撮影）であり、本 task の DoD は spec 配置 + 動作確認までで、baseline 確定は Gate-C で別途承認される |

## 5. Inventory (変更対象ファイル)

| 種別 | パス | 推定行数差分 | 内容 |
| ---- | ---- | ------------ | ---- |
| 編集 | `apps/web/app/(public)/members/page.tsx` | +10 / -3 | `MemberFilters` 呼び出しに `totalCount` / `displayedCount` 追加 |
| 編集 | `apps/web/app/(public)/members/page.spec.tsx` | +25 / -5 | `MemberFilters` props 検証追加、`data-role="result-count"` 出現確認 |
| 新規 | `apps/web/playwright/tests/members-ux-clarity.spec.ts` | +160 | 4×3×2 visual baseline |
| 編集 (条件付) | `apps/web/playwright/tests/members-prototype-alignment.spec.ts` | +5 / -3 | rename 追従 (Task B 完了後) |

## 6. Out-of-scope

- `MemberFilters` 内部実装 (Task B)
- `DensityToggle` 内部実装 (Task A)
- `SelectedFiltersBar` 内部実装 (Task B)
- 新 primitive 追加
- API endpoint / D1 schema / Google Form 仕様
- design tokens (OKLch) 変更
- baseline PNG の commit (user-gated, Linux runner)
- `members-filter-mobile.spec.ts` の改修 (本 task の visual baseline と分離)

## 7. リスク

| ID | リスク | 対策 |
| -- | ------ | ---- |
| C-R-1 | Task A/B 未完了で Task C 着手→ MemberFilters の prop API 不整合 | Phase 5 冒頭で Task A/B の `phase-5-implementation.md` を確認し、`MemberFilters` 公開 prop に `totalCount`/`displayedCount: number` が含まれていることを検証してから着手 |
| C-R-2 | Playwright visual baseline が CI 環境差で flaky | (a) Linux baseline のみで撮影 (D'+0 リセット運用)、(b) `mask:` で時刻系を除外、(c) `retries: 2` を project に設定 |
| C-R-3 | baseline PNG が both-or-none preflight 違反 | `members-ux-clarity.spec.ts` 追加と同時に snapshot 取得を user-gated で実施。spec のみ commit / baseline 未撮影状態の中間 commit を避ける |
| C-R-4 | `pagination-meta` と `result-count` の二重 announce で SR が cluttered になる | `pagination-meta` 側に `aria-hidden="true"` を付与する案を Phase 2 で検討（または `<output>` を一意の live region とし、`<p>` 側を data-only 化） |
| C-R-5 | `members-prototype-alignment.spec.ts` の selector 更新漏れ | Phase 5 で `git grep SelectedTagsBar` をリポジトリ全体に対して再実行し、全 import / selector の追従を確認 |

## 8. carry-over

- Task A/B が確定する `MemberFilters` の prop shape (`totalCount: number`, `displayedCount: number`) と `<output data-role="result-count">` selector を本 task で消費する
- 既存 `<p data-role="pagination-meta">` は機械可読 metadata として維持し、文言は変更しない
- visual baseline の Linux runner 撮影は user-gated (Gate-C) で実施

## 9. P50 チェック

- 推定 LOC: +200 / -11
- 新規ファイル: 1 (Playwright spec)
- spec 更新: 2 (vitest page.spec.tsx / 既存 Playwright spec)
- 工数目安: 半日 (Task A/B 完了後)

## DoD

- [ ] AC C-AC-1..C-AC-8 が列挙されている
- [ ] inventory が「種別 / パス / 推定行数差分 / 内容」を持つ
- [ ] Out-of-scope / リスク / carry-over が独立節として存在する
- [ ] `taskType=implementation` / `visualEvidence=VISUAL` を Phase 1 メタで宣言
- [ ] 親 workflow AC-4 / AC-8 / AC-9 / AC-7 への対応関係が明示されている
