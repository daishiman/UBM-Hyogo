# Phase 8: リファクタリング

## メタ情報

- task_id: `admin-sidebar-collapse-layout-fix`
- 前提: Phase 1（要件・AC）/ Phase 2（設計）/ Phase 3（設計レビュー PASS）/ Phase 4〜7（テスト計画・実装手順・テスト拡充・カバレッジ）
- workflow_state: `implemented_local_evidence_captured`（実装は 03.実装.md サイクル。本 Phase は実装後に検討すべきリファクタ採否を仕様として確定する）
- 本 Phase の責務: 実装後の重複解消・命名整理・SRP 観点の整理について、`対象 / Before / After / 理由` 形式で採否を確定する。新機能追加は行わない

## リファクタリング方針

本タスクの変更対象は `apps/web/src/components/shell/` の 4 コンポーネントの Tailwind className 分岐に閉じており、範囲が限定的である。Phase 2 設計から「最小差分・新規 primitive/ヘルパー不増」を採用し、既存の `${collapsed ? "..." : "..."}` テンプレートリテラルパターンと `data-shell-block` 属性・DOM 構造を維持しているため、大規模なリファクタリングは発生しない。
以下に整理観点を `対象 / Before / After / 理由` テーブル形式で列挙し（[Feedback RT-03]）、採否と根拠を明記する。

## 実行タスク

### タスク 1: collapsed レイアウト規約クラスの重複の扱い（最重要トレードオフ）

4 コンポーネント（`SidebarNavItem` / `SidebarUserMenu` / `SidebarBrand` / `SidebarShell` の AdminPublicReturn）で、collapsed 時に **同一のレイアウト規約クラス** が現れる:

- 行の水平パディング除去 + 中央寄せ: `px-0 w-full justify-center`
- アイコン/アバター/mark の **共通 40px 角枠中央配置**（`h-10 w-10` 相当 + 中央化）

この重複の扱いについて、**共通定数化（または共通ヘルパー / 共通クラス抽出）** と **インライン重複許容** のトレードオフを評価する。

| 観点 | 共通定数化（例: `COLLAPSED_ROW = "px-0 w-full justify-center"` を export して 4 箇所で参照） | インライン重複許容（各コンポーネントの className に逐語で書く） |
| --- | --- | --- |
| DRY 性 | 高い（1 箇所変更で 4 箇所反映） | 低い（4 箇所を個別に書く） |
| 可読性 | className 文字列が定数名に隠れ、その場で全体像が読めない | className を見れば collapsed 時の見た目がその場で読める（既存 shell の全 className 直書きスタイルと一致） |
| 既存パターン整合 | shell コンポーネント群は現状 className を **直書き** しており、collapsed 規約だけ定数化すると様式がドリフトする | 既存 shell の `${collapsed ? "..." : "..."}` 直書きパターンを踏襲し、ドリフトを生まない |
| navigation drift リスク | 新規 export（定数 / ヘルパー）を増やすと、shell の API surface が広がり import 経路が増える（不変条件 #9/#10 の精神に反する方向） | 新規 export ゼロ。shell の surface 不変 |
| 抽象化コスト | 4 箇所という少数の重複に対し、共通モジュール導入は over-engineering 寄り | 抽象化コストゼロ |

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| collapsed 行規約クラス（`px-0 w-full justify-center`） | 共通定数 / ヘルパー化 する案 | **各コンポーネントの className に逐語で重複記述（最小重複を許容）** | 既存 shell の className 直書きパターンを踏襲し可読性を優先。4 箇所という少数の重複に新規 export を導入すると shell の API surface が広がり navigation drift を生む（不変条件 #9/#10 の精神に反する）。新規 primitive / ヘルパーを増やさない方針（Phase 2 §「既存コンポーネント再利用可否」）と一致 |
| 40px 角アイコン枠（`h-10 w-10` 中央化） | 共通 wrapper コンポーネント化する案 | **各コンポーネントの icon/avatar/mark wrapper span に collapsed 分岐クラスを追記（インライン）** | 同上。icon span は元々各コンポーネント固有のサイズ（nav 18px / brand 32px / avatar 36px）を内側に持ち、外枠 40px だけが共通。共通化しても内側差分が残るため抽出効果が薄い。インライン追記で十分 |

**判定**: **共通定数化・共通ヘルパー化・共通 wrapper 化はいずれも否（現状維持＝最小重複を許容）**。
**結論**: 新規 primitive / ヘルパー / 定数を増やさず、各コンポーネントに collapsed レイアウト規約クラスを **最小重複で逐語記述する**。可読性・既存パターン踏襲を優先し、shell の API surface を広げない（navigation drift を生まない）。

### タスク 2: `SidebarBrand` の collapsed 分岐新設に伴う他 3 コンポーネントとの様式統一

`SidebarBrand` には現状 collapsed 分岐が存在しない（Phase 1 / `_shared-context.md` §3.2）。本タスクで新設する分岐は、他 3 コンポーネントの既存 collapsed 分岐と **同一の表記様式**（`${collapsed ? "justify-center gap-0 px-0 w-full py-2" : "<expanded>"}`）に揃える。

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `SidebarBrand` Link className | `flex items-center gap-2 rounded-sm px-3 py-2 ...`（collapsed 分岐なし） | `${collapsed ? "justify-center gap-0 px-0 w-full py-2" : "gap-2 px-3 py-2"}` 形へ統一 | 4 コンポーネントの collapsed 分岐表記を同一様式に揃えることで、将来の保守者が 4 ファイルを横断して読む際の認知コストを下げる。これは抽象化（共通化）ではなく **表記様式の統一** であり、新規 export を増やさない |

**判定**: **採用（様式統一。ただし共通化はしない）**。expanded 側の `gap` 値は各コンポーネントの現行値（nav=gap-3 / user-menu=gap-2 / brand=gap-2 / admin-return=gap-3）を逐語保持する（Phase 3 リスク表「expanded 値取り違え」緩和）。

### タスク 3: duplicate 削減対象の有無の最終確認

本タスクで新規に生じる重複は **タスク 1 の collapsed レイアウト規約クラスのみ**。それ以外に削減すべき重複（重複関数・重複型・重複 import）は発生しない。

| 削減候補 | 有無 | 扱い |
| --- | --- | --- |
| 重複関数 / ヘルパー | **該当なし** | 本タスクは className 文字列の編集のみで、関数を追加しない |
| 重複型定義 | **該当なし** | props 型（`collapsed: boolean` 等）は既存のまま。新規型を追加しない |
| 重複 import | **該当なし** | 既存 import を流用。新規 import を増やさない |
| className 重複（collapsed 規約） | あり（タスク 1） | **抽象化せず最小重複を許容**（タスク 1 の結論） |

> **なぜ className 重複を抽象化しないか**: (1) 重複箇所は 4 ファイルと少数。(2) 既存 shell は className 直書きが一貫様式であり、collapsed 規約だけ定数化すると様式ドリフトを生む。(3) 新規 export（定数 / ヘルパー / wrapper component）は shell の API surface を広げ navigation drift につながる（不変条件 #9/#10 の精神）。(4) 40px 枠の内側アイコンサイズは各コンポーネント固有で、外枠のみ共通のため抽出効果が薄い。以上より、可読性と既存パターン踏襲を優先し最小重複を許容する。

### タスク 4: CSS 正本（globals.css）への影響なしの確認

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `globals.css` の `[data-shell="sidebar"]` surface 定義（overflow / sticky / 幅） | 既存定義 | **無変更** | レイアウト整列は各コンポーネントの className が所有し、CSS surface（overflow:hidden / height:100dvh sticky）は別責務として触らない（Phase 2 §責務境界）。CSS 正本のリファクタは本タスク対象外（OOS-1 tooltip overflow を本サイクルに含めない限り） |

**判定**: **CSS 正本は無変更（リファクタ対象なし）**。

## リファクタ後の回帰確認（実行済み）

```bash
# 型チェック（import パスの破壊がないことを確認）
mise exec -- pnpm typecheck

# リント
mise exec -- pnpm lint

# focused vitest（リファクタ対象の spec を重点確認）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__
```

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 設計正本 | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/phase-2-design.md` | className 分岐設計・新規 primitive 不増方針 |
| 共有設計 | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/_shared-context.md` | §4 修正方針・§5 変更ファイル |
| 変更対象 | `apps/web/src/components/shell/{SidebarNavItem,SidebarUserMenu,SidebarBrand,SidebarShell}.tsx` | className 分岐の編集対象 |
| 既存テスト | `apps/web/src/components/shell/__tests__/*.spec.tsx` | リファクタ影響確認 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/` 内 design tokens / UI 仕様 | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | shell ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 本 Phase 8 仕様書 | 文書 | リファクタ採否（`対象/Before/After/理由` 形式）・collapsed 規約クラス重複のトレードオフ・最小重複許容の結論 |

## 統合テスト連携

- Phase 9 QA で focused vitest を実行し、collapsed 規約クラスの逐語記述で回帰がないことを確認する。
- className 逐語重複は DOM 変更を伴わない（data 属性・構造不変）ため、既存 `data-shell-block` ベースの assertion に影響しない。
- `SidebarBrand` の collapsed 分岐新設は既存 spec（`SidebarShell.spec.tsx`）で両分岐を検証し、Phase 7 の branch カバレッジに寄与する。

## 完了条件

1. collapsed レイアウト規約クラス重複の扱いが `対象/Before/After/理由` 形式で記録され、「新規 primitive/ヘルパー/定数を増やさず最小重複を許容（可読性・既存パターン踏襲優先）」が結論として確定している。
2. 共通化を採らない理由（少数重複・既存直書き様式・navigation drift 回避・内側サイズ差分）が明記されている。
3. duplicate 削減対象（関数 / 型 / import）が「該当なし」と明記され、className 重複のみ最小許容であることが確定している。
4. CSS 正本（globals.css）が無変更（リファクタ対象なし）であることが確認されている。
5. `SidebarBrand` collapsed 分岐新設が他 3 コンポーネントと表記様式統一されること、expanded `gap` 値を逐語保持することが記録されている。
