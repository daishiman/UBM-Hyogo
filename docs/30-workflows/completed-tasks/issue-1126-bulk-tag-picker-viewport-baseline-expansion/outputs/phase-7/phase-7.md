# Phase 7: カバレッジ確認

`[実装区分: 実装仕様書]` / `implementation_mode: edit` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

Issue #1126「bulk tag picker visual baseline の viewport 拡張（mobile/tablet/wide）」のカバレッジ確認フェーズ。
本タスクはコードロジックの行 coverage ではなく、**viewport × state matrix coverage** で評価する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1126-bulk-tag-picker-viewport-baseline-expansion` |
| issue | #1126（CLOSED 維持 / `Refs #1126`） |
| phase | 7（カバレッジ確認） |
| coverage 観点 | visual coverage（viewport × state matrix）。line/branch coverage ではない |
| 編集対象 spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` |
| 編集対象 fixture | `apps/web/playwright/fixtures/viewports.ts` |

## 目的

本タスクはアプリケーションコードのロジック分岐を追加しない（spec / fixture の変更のみ）。
したがって line/branch coverage ではなく、**bulk tag picker を観測する viewport × picker state の
matrix を coverage 指標**とし、before（desktop×2 のみ）→ after（4 viewport×2状態 = 8）の
拡張を網羅できているかで評価する。

## 1. カバレッジ観点

| 観点 | 内容 |
| --- | --- |
| 評価軸 | viewport（mobile / tablet / wide / desktop）× picker state（assign / unassign）の組み合わせ網羅 |
| 非対象 | アプリコードの行/分岐 coverage（本タスクはコードロジックを変更しないため計測しない） |
| 計測手段 | Playwright baseline ファイルの存在 + 比較 PASS（`toHaveScreenshot` の成功）を coverage セルの「埋まり」とみなす |
| 成功基準 | after の 8 セルすべてに baseline が存在し比較 PASS（既存 2 は不変、新規 6 は user-gated で生成） |

> visual regression の coverage は「どの画面状態 × どの表示幅を baseline で固定したか」で測る。
> コード coverage ツール（vitest --coverage）は本タスクでは用いない。

## 2. viewport × state coverage 表

行 = viewport、列 = picker state。セル = baseline 名 または「既存」。

### before（本タスク前）

| viewport | assign | unassign |
| --- | --- | --- |
| desktop（1280×800） | `bulk-tag-picker-assign-mode.png`（既存） | `bulk-tag-picker-unassign-mode.png`（既存） |
| mobile（390×844） | — | — |
| tablet（768×1024） | — | — |
| wide（1920×1080） | — | — |

→ 2 セル / 8 セル（desktop のみ）。

### after（本タスク後）

| viewport | assign | unassign |
| --- | --- | --- |
| desktop（1280×800） | `bulk-tag-picker-assign-mode.png`（既存・不変） | `bulk-tag-picker-unassign-mode.png`（既存・不変） |
| mobile（390×844） | `bulk-tag-picker-assign-mode-mobile.png`（新規） | `bulk-tag-picker-unassign-mode-mobile.png`（新規） |
| tablet（768×1024） | `bulk-tag-picker-assign-mode-tablet.png`（新規） | `bulk-tag-picker-unassign-mode-tablet.png`（新規） |
| wide（1920×1080） | `bulk-tag-picker-assign-mode-wide.png`（新規） | `bulk-tag-picker-unassign-mode-wide.png`（新規） |

→ 8 セル / 8 セル（4 viewport × 2状態 = 全埋め。desktop 2 既存 + 新規 6）。

## 3. coverage 漏れの確認

| 確認項目 | 判定 | 根拠 |
| --- | --- | --- |
| 4 viewport × 2状態 = 8 セル全埋め | OK | after 表が全セル baseline を持つ |
| 既存 desktop 2 枚が温存されているか | OK | viewport 切替を desktop capture 後に置く（Phase 5 §3.2）ため不変 |
| result mutation 後の状態（apply 後の結果パネル）は撮るか | **スコープ外（意図的な非カバー）** | result mutation 状態（partial-failure / skipped / notFound 等）の baseline は **issue-1125 が担当**。本タスクは read-only（apply しない）に限定し、`bulk-tag-result` は count 0 を維持する |
| picker の空状態（タグ0件）は撮るか | 非対象 | テストデータ前提（tag master ≥1）で空状態を排除済み（Phase 4 §4）。空状態 baseline は本タスクのスコープ外 |
| desktop 以外の中間 viewport（例: 1024px）は撮るか | 非対象 | mobile / tablet / wide の 3 代表幅で responsive ブレークポイントを代表。中間幅の追加は YAGNI（要件外） |

> result mutation 状態を本タスクで撮らないのは coverage 漏れではなく**スコープ分担**である。
> issue-1125 が result 2状態（assign/unassign 実行後）の staging mutation baseline を担当するため、
> issue-1126 は read-only の picker 表示状態の viewport 拡張に責務を限定する。

## 4. 回帰検出範囲の delta

| 区分 | before の検出範囲 | after の検出範囲 | delta（拡張分） |
| --- | --- | --- | --- |
| 検出可能な viewport | desktop（1280×800）のみ | desktop + mobile + tablet + wide | mobile / tablet / wide の 3 幅を追加 |
| 検出可能な状態数 | desktop × 2状態 = 2 | 4 viewport × 2状態 = 8 | +6 baseline |
| 検出できる退行例（新規） | （desktop レイアウト退行のみ） | mobile での picker 折り返し崩れ / tablet でのボタン配置ずれ / wide での余白・最大幅崩れ | responsive ブレークポイント固有のレイアウト退行 |
| read-only 不変条件 | `bulk-tag-result` count 0（desktop 1 回） | 全 viewport 通過後に count 0（1 回・ループ後集約） | mutation 副作用ゼロを全 viewport 横断で保証 |

> delta の本質は「responsive 表示幅で固有に発生するレイアウト退行」を回帰検出網に追加する点にある。
> コードロジックの新規分岐は無いため、line/branch coverage の delta は無い（spec / fixture の変更のみ）。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| 編集対象 spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` | baseline セルの実体 |
| 編集対象 fixture | `apps/web/playwright/fixtures/viewports.ts` | viewport 定義（wide 追加） |
| Phase 4 テスト計画 | `../phase-4/phase-4.md` | テストデータ前提 / read-only |
| Phase 6 テスト追加方針 | `../phase-6/phase-6.md` | visual assertion 列挙 |
| 関連（スコープ分担） | issue-1125（bulk tag result 2状態 staging mutation visual baseline） | result mutation 状態の担当 |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-7/phase-7.md` | viewport × state matrix coverage の評価観点、before（desktop×2）/ after（4 viewport×2=8）の coverage 表、coverage 漏れ確認（result mutation はスコープ外＝issue-1125 担当）、回帰検出範囲の delta（mobile/tablet/wide 固有のレイアウト退行を追加） |

## 統合テスト連携

- after の 8 セル全埋めは Phase 11 の user-gated capture（VISUAL_ON_EXECUTION）で baseline 生成後に成立する。
- 既存 desktop 2 セルの不変は Phase 6 の回帰保証（desktop baseline 不変）と整合する。
- result mutation 状態の coverage は issue-1125 へ委譲し、本タスクのスコープ外であることを明示する。
- コードロジック coverage（vitest --coverage）は本タスクでは計測対象外（spec/fixture 変更のみ）。

## 完了条件（Phase 7）

| 項目 | 基準 |
| --- | --- |
| coverage 観点 | viewport × state matrix coverage を評価軸とすること（line/branch ではない）を確定した |
| matrix 全埋め | after の 4 viewport × 2状態 = 8 セルが全 baseline を持つ（既存 2 + 新規 6）ことを表で確定した |
| 既存温存 | desktop 既存 2 セルが不変であることを確認した |
| スコープ境界 | result mutation 状態は issue-1125 担当でスコープ外であることを明記した |
| delta | mobile/tablet/wide 固有のレイアウト退行を回帰検出網に追加する delta を確定した |
