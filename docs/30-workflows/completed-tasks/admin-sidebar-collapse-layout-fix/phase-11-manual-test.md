# Phase 11: 手動テスト（視覚確認計画・VISUAL）

## メタ情報

- task_id: `admin-sidebar-collapse-layout-fix`
- visualEvidence: `VISUAL`（collapsed/expanded サイドバーの見た目・中央揃え・はみ出しが変わる）
- workflow_state: `implemented_local_evidence_captured`（実装・focused vitest・local screenshot 取得済み。commit / push / PR / staging visual は user-gated）
- evidence_status: `captured_local_fixture`（local Playwright Chromium screenshot 3 PNG 取得済み）
- 本 Phase の責務: collapsed/expanded サイドバー shell の AC-1..AC-6 を 3 層（Semantic / Visual / AI UX）で評価し、local fixture screenshot、jsdom 検証境界、OOS-1（tooltip overflow clip）の確認結果、staging 認証 screenshot の user-gated 境界を記録する。

> **証跡の境界**: `outputs/phase-11/screenshots/*.png` は local fixture evidence として 3 件 present。
> `outputs/phase-11/screenshot-inventory.json` の `status: "captured_local_fixture"` と各エントリ `status: "present"` で表現する。
> staging 認証済み baseline は Phase 13 user-gated。

## 目的

jsdom（focused vitest）では検証できない「Tailwind className の効き（collapsed 時の中央揃え・水平パディング除去・固定枠でのはみ出し解消・縦中心線の一致）」を、
local fixture pixel screenshot で確認し、staging 認証済み baseline で再確認する手順と PASS 観点を確定する。
本タスクは `apps/web` の sidebar shell コンポーネント群の Tailwind className 修正が主目的の VISUAL タスクであり、
collapsed はみ出し解消（AC-2）・中央軸の一致（AC-3）・active 左ボーダー維持（AC-4）・expanded regression なし（AC-5）の
視覚的成立を local fixture で確認し、認証ゲートに守られる staging baseline の取得は user-gated とする。

## 実行タスク

### 1. 3 層評価の観点（Semantic / Visual / AI UX）

| 層 | 評価対象 | 確認手段 | 対応 AC |
| --- | --- | --- | --- |
| Semantic（意味的可視性） | collapsed 時に `displayName` / `role` が `sr-only` で読み上げ可能、expanded 時はテキスト表示。`data-shell-block` / `data-collapsed` / `data-active` 属性が保持される | focused vitest（class / 属性 assertion）+ DOM 読み上げ確認 | AC-6 |
| Visual（描画結果） | collapsed 時に icon(18px) / brand mark(32px) / avatar(36px) が 64px 幅内に収まりはみ出さない。各行のアイコン水平中心が aside 縦中心線に一致し collapse-toggle と揃う。expanded はテキスト/アイコン配置に regression なし | local fixture pixel screenshot | AC-2 / AC-3 / AC-4 / AC-5 |
| AI UX（一貫性・操作性） | collapsed/expanded のトグルで中央揃えが破綻せず、active nav の左ボーダーがどちらの状態でも視認できる。tooltip が clip されず読める | local fixture screenshot + 実機目視（OOS-1） | AC-3 / AC-4 + OOS-1 |

### 2. テストケース（local screenshot 取得済み）

> 視覚 TC（`TC-11-*`）は local fixture で代表 viewport を取得済み。staging pixel screenshot は user-gated。

| テストケース | 確認対象（AC） | 何を見れば PASS か | 想定証跡ファイル | 状態 |
| --- | --- | --- | --- | --- |
| TC-11-1 | AC-1 / AC-2 / AC-3 collapsed 中央揃え | collapsed desktop で brand / nav-item / user-menu / admin-return の水平パディングが除去され、icon/mark/avatar が 64px 内に収まり、全行のアイコン水平中心が aside 縦中心線に一致。collapse-toggle と軸が揃う | `screenshots/TC-11-1-sidebar-collapsed-desktop.png` | `present` |
| TC-11-2 | AC-5 expanded regression なし | expanded desktop で brand/nav-item/user-menu のテキストとアイコンが既存 baseline どおり整列。崩れ・余白増減なし | `screenshots/TC-11-2-sidebar-expanded-desktop.png` | `present` |
| TC-11-3 | AC-6 意味的可視性 + OOS-1 tooltip | collapsed の user-menu を open し、displayName/role が popover に表示。collapsed hover tooltip（`ubm-shell-tooltip`）が aside 右外に clip されず読めるか実機確認 | `screenshots/TC-11-3-sidebar-collapsed-user-menu-open.png` | `present` |
| TC-11-4 | AC-4 active 左ボーダー | collapsed 時にアクティブ nav-item の `border-l-2` active 表現（`data-[active=true]:border-[var(--ubm-color-accent)]`）が中央化レイアウトでも破綻せず視認できる | `screenshots/TC-11-1-sidebar-collapsed-desktop.png`（active 行を含む） | `present` |

### 3. 画面カバレッジマトリクス

| テストケース | 画面 / 状態 | viewport | 撮影セレクタ / 対象 | 対応 AC |
| --- | --- | --- | --- | --- |
| TC-11-1 | collapsed sidebar 全景 | desktop（≈1280px） | `aside[data-shell="sidebar"][data-collapsed="true"]` 全体 | AC-1 / AC-2 / AC-3 |
| TC-11-2 | expanded sidebar 全景 | desktop（≈1280px） | `aside[data-shell="sidebar"][data-collapsed="false"]` 全体 | AC-5 |
| TC-11-3 | collapsed + user-menu open | desktop（≈1280px） | `details[data-shell-block="user-menu"][open]` + tooltip 領域 | AC-6 + OOS-1 |
| TC-11-4 | collapsed active nav-item | desktop（≈1280px） | `a[data-shell-block="nav-item"][data-active="true"]` | AC-4 |

> N/A（暗黙スキップ禁止の明示記録）:
> - ダークモード: 本タスクは sidebar shell の collapsed/expanded レイアウト是正でダークテーマ対象外 → N/A。
> - モバイル drawer: collapse トグルは `md:flex` の desktop aside のみ対象。mobile は `SidebarDrawer`（常に expanded 相当）で別経路のため本サイクル screenshot 対象外 → N/A。

### 4. jsdom で確認できない CSS の「効き」と staging 実機の境界

| 視覚要素 | jsdom で確認できない理由 | 代替 evidence（jsdom / gate 側） | staging で確認する内容 |
| --- | --- | --- | --- |
| collapsed 中央揃え | `justify-center` / `w-full` / `px-0` のレイアウト結果は jsdom が算出しない | focused vitest（collapsed 時の className に `px-0` / `justify-center` / `w-full` を含むことの assertion） | 実際の中央配置・水平パディング 0 |
| icon/mark/avatar のはみ出し解消 | 64px aside − `p-3`(24px) = 40px 内に収まるかの描画結果は jsdom 非算出 | className に固定枠（`h-10 w-10` 相当の中央化）が付与されることの assertion | aside からはみ出さない描画 |
| 縦中心線の一致 | 各行のアイコン水平中心が一致するかは描画依存 | 全行が同一の collapsed 中央化 class を共有することの assertion（contract） | collapse-toggle を含む全要素の軸一致 |
| active 左ボーダー | `border-l-2` active 表現の中央化との両立は描画依存 | `data-[active=true]:border-[var(--ubm-color-accent)]` class 維持の assertion | 中央化でも左ボーダーが破綻しない |
| collapsed hover tooltip clip（OOS-1） | `[data-shell="sidebar"]{overflow:hidden}`（`globals.css:1986`）下で aside 右外 `position:absolute` の tooltip が clip されるかは描画依存 | 該当 CSS 定義の grep（観察記録） | tooltip が clip されず読めるか（実機目視で OOS-1 判定） |

代替 evidence のコマンド（Phase 8/9 で確定済を再掲・実行済み）:

```bash
# focused vitest（collapsed/expanded className / 属性の contract）
mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__

# grep gate（token / API 非変更）
mise exec -- pnpm verify:tokens
git diff --name-only -- apps/api | grep . && echo "[FAIL]" || echo "[PASS: api untouched]"
```

### 5. スクリーンショット取得・配置結果

local fixture Playwright の代表 screenshot を取得済み。ユーザー承認後、staging 認証セッションで同観点の baseline を追加取得する。

| 配置先 | 内容 | 状態（本仕様作成時点） |
| --- | --- | --- |
| `outputs/phase-11/screenshots/TC-11-1-sidebar-collapsed-desktop.png` | collapsed desktop 全景 local fixture screenshot | `present` |
| `outputs/phase-11/screenshots/TC-11-2-sidebar-expanded-desktop.png` | expanded desktop 全景 local fixture screenshot | `present` |
| `outputs/phase-11/screenshots/TC-11-3-sidebar-collapsed-user-menu-open.png` | collapsed + user-menu open local fixture screenshot | `present` |
| `outputs/phase-11/screenshot-inventory.json` | screenshot inventory（`status: "captured_local_fixture"`） | `present` |
| `outputs/phase-11/manual-test-result.md` | local visual evidence 結果・screenshot 一覧 | `present` |
| staging 認証済み baseline screenshots | 実認証環境の pixel screenshot | `pending`（Phase 13 user-gated） |

> local fixture screenshot は `screenshots/*.png` に配置済み。staging 認証済み baseline のみ Phase 13 user-gated。

### 6. Gate-B 状態

`artifacts.json` の Gate-B（evidence_path: `outputs/phase-11/manual-test-result.md`）は
`passed` である。`manual-test-result.md` は present で、focused vitest / local fixture screenshot の結果と
取得済み screenshot 一覧を記録する。staging pixel screenshot のみ Phase 13 user-gated として分離する。

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 共有設計コンテキスト | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/_shared-context.md` | 根本原因 / 修正方針 / AC 正本 / 命名規則 |
| 要件（AC 正本） | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/phase-1-requirements.md` | AC-1..AC-9 / 背景スクリーンショット現象 |
| テスト計画 | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/phase-4-test-plan.md` | jsdom 代替 evidence・shell spec contract |
| QA | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/phase-9-qa.md` | 検証コマンド・gate・AC マッピング |
| 最終レビュー | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/phase-10-final-review.md` | AC 3-state トレース |
| artifacts | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/artifacts.json` | Gate-B（evidence_path / passed） |
| テンプレート | `.claude/skills/task-specification-creator/references/phase-11-screenshot-guide.md` | 必須セクション・selector ルール |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | shell ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 状態 |
| --- | --- | --- |
| 本 Phase 11 仕様書 | 文書 | 作成済（3 層評価観点・TC-11-1..4・カバレッジマトリクス・jsdom 境界・OOS-1 確認方針） |
| `outputs/phase-11/screenshot-inventory.json` | visual inventory | `present`（`status: "captured_local_fixture"`・各エントリ `present`） |
| `outputs/phase-11/manual-test-result.md` | local visual evidence + runtime boundary | `present`（focused vitest / screenshot 結果を記録） |
| `outputs/phase-11/screenshots/*.png` | local visual evidence | `present`（3 PNG） |

## 統合テスト連携

- focused vitest（shell spec の collapsed/expanded className contract）の PASS が Phase 9 / Phase 10 の AC-1/2/3/4/6 判定根拠となる（取得済み）。
- local fixture screenshot（TC-11-1 / TC-11-2 / TC-11-3）が AC-2/3/4/5/6 の代表視覚確認を担い、Gate-B の根拠となる（取得済み）。
- staging pixel screenshot（TC-11-1..4）は認証済み baseline として Phase 13 user-gated。
- OOS-1（collapsed tooltip overflow clip）は TC-11-3 の実機確認で clip の有無を判定し、clip 確認かつ改善判断になった場合のみ別タスク化を検討（Phase 12 unassigned-task-detection の baseline に記録）。

## 完了条件

1. AC-1/2/3/4/5/6 の視覚確認観点（TC-11-1..4）と「何を見れば PASS か」が確定していること。
2. collapsed 中央揃え・expanded regression・collapsed user-menu open の 3 撮影ケースが計画され、OOS-1 の実機確認方針が含まれること。
3. jsdom で確認できない CSS の「効き」と staging 実機の境界が明記され、代替 evidence（focused vitest / grep gate）が記載されていること。
4. `outputs/phase-11/manual-test-result.md` が present で、取得済み screenshot 一覧を記録し、`outputs/phase-11/screenshot-inventory.json` が `status: "captured_local_fixture"` であること。
5. Gate-B が `passed`（実装済み）、staging 認証済み baseline screenshot が Phase 13 user-gated である旨が記載されていること。
