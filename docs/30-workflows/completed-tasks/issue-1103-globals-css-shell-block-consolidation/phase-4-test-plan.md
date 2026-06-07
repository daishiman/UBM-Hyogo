# Phase 4: テスト計画 — issue-1103 globals.css 重複 shell ブロック 1 本化

> **[実装区分: 実装仕様書 / NON_VISUAL]**
> implementation_mode: new / status: implemented_local_evidence_captured（commit・push・PR は user-gated）

## 1. 方針（CSS dedup タスクの「テスト」定義）

本タスクの code diff は `apps/web/src/styles/globals.css` における **byte 完全一致の重複ブロック（後発 1774-1904 行）の削除のみ**で、新しい振る舞い・新しい selector・新しい token は一切追加しない。CSS の純粋な重複削除は従来の Vitest unit test に乗りにくいため、本タスクの「テスト」を **検証コマンドスイート（grep / diff / build / token gate）** として設計する。

- 主戦略 = 「既存 token runtime test の回帰 PASS」+「grep / diff / build による構造検証」。
- 削除は cascade 不変（後発ブロックは先発ブロックと byte 一致 = CSS の last-wins で上書きしても結果が同一）であることを **削除前に diff で証明**してから実行する。
- NON_VISUAL のため実 UI 操作（ブラウザでの視覚比較）は本フェーズの自動コマンドでは行わず、Phase 11 の deterministic evidence（byte 一致 + cascade 文脈同一 + grep/build/token gate）で代替する。

## 2. 検証コマンドスイート（TC-1〜TC-5）

すべて worktree ルート（`apps/web` の親 monorepo ルート）からの実行を想定。対象ファイルは `apps/web/src/styles/globals.css`。

| TC | フェーズ | コマンド | 期待値 | 判定基準 |
| --- | --- | --- | --- | --- |
| **TC-1a** | 削除**前** baseline | `grep -c 'data-shell="sidebar"' apps/web/src/styles/globals.css` | `3` | `3` 以外なら現行コードが共有事実と乖離 → 中断しユーザー報告 |
| **TC-1b** | 削除**前** baseline | `grep -c '=== parallel-01 P1-1 page surface ===' apps/web/src/styles/globals.css` | `2` | ブロックが 2 回出現する重複状態であることの証明 |
| **TC-1c** | 削除**前** baseline（byte 一致証明） | `diff <(sed -n '1642,1772p' apps/web/src/styles/globals.css) <(sed -n '1774,1904p' apps/web/src/styles/globals.css)` | 空出力（exit 0） | **非空なら文脈差あり → 削除を中断しユーザー報告**。byte 一致が削除安全性の前提条件 |
| **TC-2a** | 削除**後** | `grep -c 'data-shell="sidebar"' apps/web/src/styles/globals.css` | `2` | `1708`（先発ブロック・残存）+ `2306`（admin スコープ派生・@media max-width:767px 内・削除対象外）の 2 件 |
| **TC-2b** | 削除**後** | `grep -c '=== parallel-01 P1-1 page surface ===' apps/web/src/styles/globals.css` | `1` | 重複が解消され先発 1 ブロックのみ残存 |
| **TC-2c** | 削除**後**（admin スコープ残存確認） | `grep -n '\[data-route-group="admin"\] \[data-shell="sidebar"\]' apps/web/src/styles/globals.css` | 1 行ヒット | `[data-route-group="admin"]...` のスコープ派生（元 2306）が残存していること。これを誤って消していない保証 |
| **TC-3** | token gate（既存テスト回帰） | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/__tests__/tokens.runtime.spec.ts` | 全 PASS（削除前後で不変） | = web の `verify-design-tokens` script 相当。HEX 直書き検出系が引き続き PASS |
| **TC-4** | build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0（next build --webpack 成功） | CSS パースエラー・未閉じ括弧がないこと |
| **TC-5** | 残存ブロック値スナップショット | 下記 §3 の grep で `[data-shell="sidebar"]` 直後の `height: 100dvh` / `max-height: 100dvh` / `border-right` / `background` が削除前後で不変 | 値文字列が削除前後で同一 | 残す先発ブロック（1708 由来）の宣言が一切変化していないこと |

> root 全体の token gate を使う場合は `mise exec -- pnpm verify:tokens` でも代替可（TC-3 と同等の回帰 guard）。

## 3. TC-5 残存ブロック値スナップショット（高さ / border / 背景）

削除後に残る先発 `[data-shell="sidebar"]` ブロックの宣言が削除前後で不変であることを照合する。削除前・削除後の両方で以下を取得し diff する:

```bash
# 削除前: 先発ブロック（1708 由来）の宣言だけを抽出
awk '/\[data-shell="sidebar"\] \{/{f=1} f{print} /^  \}/{if(f){f=0; print "---"}}' \
  apps/web/src/styles/globals.css | head -n 30
```

期待される先発ブロックの宣言（不変であるべき値）:

| selector | 宣言 | 期待値 |
| --- | --- | --- |
| `[data-shell="sidebar"]` | `position` | `sticky` |
| | `top` | `0` |
| | `height` | `100dvh` |
| | `max-height` | `100dvh` |
| | `overflow` | `hidden` |
| | `border-right` | `1px solid var(--ubm-color-border-default)` |
| | `background` | `var(--ubm-color-surface-panel)` |

判定: 削除前の先発ブロック（1708 由来）と削除後の `[data-shell="sidebar"]`（admin スコープ派生を除く非ネスト 1 件）の宣言群が完全一致。

## 4. 命名規則 / token 整合の確認

- selector 命名: 全て **data-attribute selector**（`[data-route]` / `[data-section]` / `[data-card]` / `[data-shell]` / `[data-text]`）。削除により命名規則は変わらず（重複の一方を消すだけ）。
- token 参照: 全宣言が `var(--ubm-*)` token を参照し、HEX 直書きが残存・新規追加されないこと（TC-3 token gate で機械検証）。
- 不変条件 #2（OKLch トークン正本化 / HEX 直書き禁止）に抵触しない: 削除のみのため新規 HEX 混入は構造的に発生しない。

## 5. 実行順序と中断条件

1. **TC-1a / TC-1b / TC-1c**（削除前）を実行。**TC-1c の diff が空でなければここで中断しユーザー報告**（想定外の文脈差 = 削除の前提崩壊）。
2. Phase 5 の手順で後発ブロックを削除。
3. **TC-2a / TC-2b / TC-2c**（削除後構造検証）を実行。1 つでも不一致なら誤削除を疑い revert。
4. **TC-5** 値スナップショット照合。
5. **TC-3 token gate** → **TC-4 build** の順で回帰 PASS を確認。
6. 視覚比較（shell sidebar / topbar / footer の表示崩れ有無）は NON_VISUAL のためスクリーンショットを作らず、Phase 11 の byte-identical 削除 + cascade 文脈同一 + grep/build/token gate で代替する。
