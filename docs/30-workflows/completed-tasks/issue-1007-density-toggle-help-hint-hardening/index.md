# issue-1007 /members DensityToggle HelpHint と ID の堅牢化

`[実装区分: 実装仕様書]`（コード変更を伴う / CONST_004 デフォルト）

| 項目 | 値 |
|------|-----|
| task_id | `issue-1007-density-toggle-help-hint-hardening` |
| source_issue | [#1007](https://github.com/daishiman/UBM-Hyogo/issues/1007)（**CLOSED のまま**仕様化） |
| category | 改善 / followup |
| priority | 低 |
| scale | 小規模 |
| task_type | implementation |
| visual_category | VISUAL（UI component 変更 / Phase 11 screenshot あり） |
| implementation_mode | new（堅牢化コードの新規追加 + 既存挙動の回帰確認） |
| workflow_state | implemented_local_runtime_pending |
| branch | `feat/issue-1007-density-toggle-help-hint-hardening` |
| scope_routes | `/members` |

---

## このタスクが「不要ではない」根拠（最新コードでの再調査結果）

`061d22bf5`（origin/dev tip）時点の現行コードを調査し、Issue #1007 の 3 要件がすべて**未実装**であることを確認した。別タスクでも解決されていない。

| 要件 | 現状 | 該当 file:line |
|------|------|----------------|
| ① `aria-describedby` description id の複数配置衝突対策 | 未対応（static id `density-${value}-desc`） | `apps/web/src/components/public/DensityToggle.client.tsx:64,79` |
| ② HelpHint の Escape / click-outside close 仕様化 | 未対応（native `<details>` のみ。Escape では閉じない） | 同 `:85-97` |
| ③ `?` の icon system 整合 | 未対応（平文 `?`。lucide は apps/web 未導入） | 同 `:87` |
| 関連テスト | 複数配置 / keyboard 操作テストなし | `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx:21-67` |

親タスク `members-list-ux-clarity / task-a-density-toggle-ux-clarity`（PR #1009, 2026-05-29 マージ済）が①②③を future candidate として #1007 に切り出した経緯。現在 `DensityToggle` は `/members` の**単一配置**のみのため①は潜在的（今は破綻していない）だが、`useId` 移行は低コストで将来の a11y バグを予防する。②は実 a11y 改善（native `<details>` は Escape で閉じない）、③は既存 Icon system への整合。

## Issue の現行コードへの最適化（root 問題の解き方）

| 当初 Issue 記述 | 最適化後の方針 | 理由 |
|------|------|------|
| ③ icon 化に「lucide 既存依存 または CSS text fallback」 | apps/web の正本 Icon system（`Icon.tsx` + `icons.ts`）に `help` glyph を追加し `<Icon name="help" />` を使う | lucide は apps/web に**未導入**。正本は独自 SVG icon system。新 primitive を生やさず「整合」を満たす（stroke=currentColor で HEX 直書きなし → design token gate PASS） |
| ② close 挙動が `<details>` 標準のみ | `<details>` は非制御のまま native summary toggle を維持し、Escape / click-outside close だけを `detailsRef` 経由で追加（cleanup でリーク防止） | `toggle` event の非同期性に依存せず、既存標準挙動と追加 close 挙動を最小差分で両立 |
| ① static id | `useId()` prefix を付与（`${uid}-density-${value}-desc`） | 既存 `Field.tsx`/`FormField.tsx`/`ConfirmDialog.tsx` の `useId` パターンに整合 |

---

## スコープ（CONST_007: 今サイクル1回で完了）

### 含む
- `DensityToggle` の description id を `useId()` ベースにし複数配置衝突を排除
- HelpHint の Escape close / click-outside close の仕様化と実装（feature-local）
- `?` を正本 Icon system の `help` glyph に置換
- 上記を固定する focused test の追加

### 含まない（先送りではなくスコープ外＝別関心ごと）
- 汎用 Popover / Tooltip primitive の新設（Issue 明示のスコープ外）
- `/members` の API / URL query 変更
- staging visual baseline 更新（Gate-C / user-gated）

> 本タスクは単一ファイル群の小規模改善であり、分割なしで 03.実装.md の1サイクル内で完了できる。未タスク分離は行わない。

---

## Phase 構成

| Phase | 出力 | 状態 |
|-------|------|------|
| 1 要件定義 | `phase-1-requirements.md` | completed |
| 2 設計 | `phase-2-design.md` | completed |
| 3 設計レビュー | `phase-3-design-review.md` | completed |
| 4 テスト計画 | `phase-4-test-plan.md` | completed |
| 5 実装手順 | `phase-5-implementation.md` | completed |
| 6 テスト拡充 | `phase-6-test-additions.md` | completed |
| 7 カバレッジ | `phase-7-coverage.md` | completed |
| 8 リファクタ | `phase-8-refactor.md` | completed |
| 9 QA | `phase-9-qa.md` | completed |
| 10 最終レビュー | `phase-10-final-review.md` | completed |
| 11 手動テスト | `outputs/phase-11/manual-test-result.md` | completed_local / visual screenshots saved |
| 12 ドキュメント同期 | `outputs/phase-12/` | completed |
| 13 PR | `phase-13-pr.md` | pending（user-gated） |

## 変更対象ファイル（実装サイクル用サマリ）

| パス | 種別 |
|------|------|
| `apps/web/src/components/public/DensityToggle.client.tsx` | 編集 |
| `apps/web/src/components/ui/icons.ts` | 編集（`help` 追加） |
| `apps/web/src/components/ui/Icon.tsx` | 編集（`case "help"` 追加） |
| `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | 編集（test 追加） |
| `apps/web/src/styles/legacy-public.css` | 編集（help-hint summary icon の限定差分・必要時のみ） |
