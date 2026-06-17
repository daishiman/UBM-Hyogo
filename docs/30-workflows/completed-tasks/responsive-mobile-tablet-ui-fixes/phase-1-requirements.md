# Phase 1: 要件定義 — 全画面レスポンシブ（携帯・タブレット）UI/UX 是正

## メタ情報

- task_id: `responsive-mobile-tablet-ui-fixes`
- 実装区分: **[実装区分: 実装仕様書]**
- taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `new`
- workflow_state: `implemented_local_visual_present_staging_pending`
- スコープ: `apps/web` 表現層（CSS / Tailwind breakpoint / レイアウト primitive）のみ。API/D1/Form 非変更。
- 共有 SSOT: [shared-context.md](shared-context.md)

## 実装区分の判定根拠（CONST_004）

本タスクは「画面の崩れ・はみ出し・要素の非表示化を改善する」=**コード変更済みでは達成不可能**な目的を持つ。
変更対象は `apps/web/src/styles/*.css` と一部レイアウト component（breakpoint・幅・オーバーレイ収納）であり、
ファイル変更・CSS 規則追加・テスト追加を伴う。よって CONST_004 デフォルトの **実装仕様書** とする（docs-only 例外には該当しない）。

## P50 前提確認チェック

| 確認項目 | 結果 |
| --- | --- |
| current branch に実装が存在する | Yes（本サイクルで `apps/web` 表現層実装を追加。implementation_mode: `new`） |
| upstream（main/dev）にマージ済み | No（新規タスク） |
| 前提タスク（依存タスク）が完了済み | 該当なし（`depends_on: []`）。既存の sidebar drawer 化（unified-sidebar-shell 系）は完了済みで土台として利用 |

## 目的

全 19 ルート（[shared-context.md](shared-context.md) §3）で、携帯（375〜390px）・タブレット（768px）サイズにおける
**レイアウト崩れ・要素はみ出し・画面外への隠れ（非表示化）・横スクロール強制**を是正し、
「どのビューポートでも内容が隠れず、崩れず、操作できる」状態にする。

## 背景（現象）

ユーザー報告: 「携帯サイズ・タブレットサイズで画面が崩れている箇所が多数ある。例えば非表示で見えなくなる、
画面から隠れて見えなくなる等。全画面で改善してほしい。」

コード調査で、崩れの大半が**共通 CSS 層**（`globals.css` / `legacy-public.css` / `tokens.css` / `auth.css`）の
固定幅・非標準メディアクエリ境界・テーブル/オーバーレイのレスポンシブ未対応に起因することを確認した。

## 根本原因（コード調査で確定）

[shared-context.md](shared-context.md) §4 の RC-1..RC-5 を正本とする。要約:

- **RC-1**: メディアクエリ境界の不統一（`max-width: 767/768/900/1024px` 混在）。タブレット帯で多カラムが詰まる。
- **RC-2**: 固定幅・最小幅起因のはみ出し（`min(1120px,…)`, drawer `17rem`, `minmax(18rem,…) minmax(22rem,…)` = 640px min 等）。
- **RC-3**: テーブルのレスポンシブ未対応（`overflow-x: auto` のみで content が横スクロールに押し出され見えない）。
- **RC-4**: popover/tooltip の絶対配置がビューポート外に出る。
- **RC-5**: 共通 3 画面・auth フォームの狭幅検証不足。

## 実行タスク

1. 19 ルート inventory を [shared-context.md](shared-context.md) §3 に確定（完了）。
2. root cause RC-1..RC-5 を実コード行番号付きで確定（完了）。
3. Acceptance Criteria AC-1..AC-10 を確定（下記）。
4. スコープ境界（apps/web 表現層のみ・1 サイクル完結）を確定（下記）。
5. 既存コードベースの命名規則を記録（下記）。

## 要件（スコープ＝apps/web 表現層のみ・不変条件 #1 #5 厳守）

### 是正の 5 本柱

1. **ブレークポイント統一**: 共通 breakpoint（base / md 768 / lg 1024 / xl 1280）を `tokens.css` にドキュメント目的の CSS 変数として固定し、`globals.css` の混在境界を統一。
2. **固定幅の流体化**: 多カラムグリッドを mobile-first 単カラム→md/lg 多カラムへ。`minmax(Nrem,…)` 最小値起因はみ出しを是正。
3. **テーブル可視性**: 管理テーブルに mobile カードフォールバック or sticky 見出し + セル `min-width` 横スクロールを付与。
4. **オーバーレイ収納**: drawer/popover/tooltip/modal をビューポート内に収める。
5. **共通画面・auth**: error/not-found/loading/login の中央寄せ・狭幅 padding を 375px で是正。

## Acceptance Criteria

| AC | 内容 | 検証 |
| --- | --- | --- |
| AC-1 | 共通ブレークポイント体系（base/md768/lg1024/xl1280）を CSS に固定し、`globals.css` の `max-width: 767/768/900/1024px` 混在境界を統一する | grep で非標準境界（900px 等）が 0、または 768/1024 へ集約されていること |
| AC-2 | 公開層 6 ルートが mobile(375)/tablet(768) で横スクロール・はみ出し・要素の隠れなし | Playwright visual + `document.scrollingElement.scrollWidth <= clientWidth` |
| AC-3 | 会員層 2 ルート（login/profile）が 375/768 で崩れなし | 同上 |
| AC-4 | 管理層 8 ルートが 375/768 でテーブル/グリッド/サイドバーが崩れず、要素が画面外に隠れない | 同上 + サイドバー drawer がビューポート内 |
| AC-5 | 共通 3 画面（error/not-found/loading）が 375/768 で中央表示を維持 | visual baseline |
| AC-6 | 全固定幅/最小幅グリッドを mobile-first 単カラム→md/lg 多カラムへ。`minmax(Nrem,…)` 最小値起因はみ出しを解消 | grep + 横スクロール 0 |
| AC-7 | 管理テーブルにモバイルフォールバック（カード積み or sticky min-width 横スクロール）を付与し content の隠れを解消 | mobile で全列 content が到達可能 |
| AC-8 | popover/tooltip/drawer/modal がビューポート内に収まる（clamp/flip/max-width） | 各オーバーレイの bounding box が viewport 内 |
| AC-9 | design token 不変条件遵守（HEX 禁止・tokens.css 正本）、API/D1/Form 非変更 | `pnpm verify:tokens` PASS / `git diff --name-only -- apps/api` 空 |
| AC-10 | Playwright visual full に横スクロール 0 guard を追加し、local runtime smoke で代表 viewport を確認 | `full-visual.spec.ts` guard + runtime smoke PASS |

## スコープ境界（CONST_007: 1 サイクル完結）

- 含む: 上記 5 本柱の CSS / breakpoint / レイアウト component 変更 + テスト。全 19 ルートを 1 実装サイクルで是正する。
- 含まない（不変条件で禁止）: API endpoint 追加・D1 schema 変更・Form 仕様変更・配色再設計・新規 primitive。
- **先送りなし**: 崩れの根本は共通 CSS 層に集中するため、route 個別の改修は限定的で 1 サイクルに収まる。「分量が多い」を理由とした別 PR / Phase 2 分離は行わない（CONST_007）。

## 既存コードベースの命名規則

- CSS クラス: BEM 風ケバブケース（`.attendance-primary-grid`, `.tag-master-grid`, `.admin-audit-table`）。
- CSS カスタムプロパティ: `--ubm-*`（色・spacing）, `--shell-*`（シェル寸法）。本タスクで追加する breakpoint 変数は `--bp-md` / `--bp-lg` / `--bp-xl`（ドキュメント目的・ケバブケース）。
- Tailwind: `md:` / `lg:` prefix を標準採用（`sm:hidden` / `hidden md:flex` パターン既存）。
- component: PascalCase（`SidebarShell.tsx`）。テスト: `*.spec.tsx`（不変条件 #8）。

## 参照資料

### システム仕様（aiworkflow-requirements）

- `ui-ux-*.md`（UI/UX 観点）, `architecture-*.md`（レイアウト境界）。
- プロジェクト: `docs/00-getting-started-manual/specs/design-tokens.md`（トークン正本）, `apps/web/src/styles/tokens.css`。
- CLAUDE.md「UI prototype alignment / MVP recovery」§不変条件 1-4。

## 成果物

- 本ファイル（要件定義）。AC-1..AC-10、root cause、19 ルート inventory、スコープ境界の確定。

## 統合テスト連携

- 下流: Phase 4（テスト計画）が AC-2..AC-10 を Playwright visual（mobile/tablet）+ jsdom 構造 spec へ落とす。
- shared schema ownership: 本タスクは shared 型を追加しない（CSS / breakpoint のみ）。並列 wave 依存なし。

## 完了条件

AC-1..AC-10 が確定し、root cause が実コード行で裏付けられ、スコープが apps/web 表現層 1 サイクルに固定されていること。
