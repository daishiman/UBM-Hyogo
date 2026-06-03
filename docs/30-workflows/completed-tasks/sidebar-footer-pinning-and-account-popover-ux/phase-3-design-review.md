# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
|------|----|
| task_id | sidebar-footer-pinning-and-account-popover-ux |
| phase | 3 / 13 |
| 名称 | 設計レビュー |
| 前提 | Phase 1（要件）/ Phase 2（設計）完了 |
| 判定 | **PASS**（Phase 4 へ進行可） |

## 目的

Phase 2 設計が AC-1〜AC-6 を満たし、不変条件・後方互換・回帰リスクの観点で Phase 4 へ進めるかを判定する。PASS / MINOR / MAJOR の戻り先を明示する。

## 実行タスク

### AC ↔ 設計トレーサビリティ

| AC | 設計 concern | 充足手段 | 判定 |
|----|-------------|---------|------|
| AC-1 フッター固定 | C1 | `height:100dvh` + aside 2 段 flex（nav `flex-1 overflow-y-auto` / footer `shrink-0`）| PASS |
| AC-2 collapse はみ出し | C2 | aside `overflow-hidden` + 各行 `justify-center` + badge ドット | PASS |
| AC-3 popover 外側クリック/Escape | C3 | `browserDocument()` 経由 `pointerdown`/`keydown` listener（open 中のみ）| PASS |
| AC-4 main footer sticky | C4 | `<main>` flex-column + footer `margin-top:auto` | PASS |
| AC-5 API/token 不変 | 全 | 既存 token 使用・新 endpoint/D1/auth なし・HEX 直書きなし | PASS |
| AC-6 回帰なし + 新規保護 | 全 | 既存 spec 維持 + 新規契約追加（Phase 4）| PASS（Phase 4-9 で実証）|

### 不変条件レビュー

| 不変条件 | 設計での担保 | 判定 |
|----------|-------------|------|
| I-1 hook/props 不変 | `useSidebarState` 戻り値・`SidebarShell` props 不変。aside/main の内部 JSX のみ変更 | PASS |
| I-2 state owner 単一 | popover 開閉は `<details>.open` 正本、`details.open` は listener 登録用ミラー（派生）| PASS |
| I-3 API/D1/auth/Form 不変 | 変更ファイルは CSS + shell component のみ | PASS |
| I-4 token 経由・HEX 禁止 | `--shell-*` / `--ubm-color-*` のみ。新色なし | PASS |
| I-5 browser API 入口 | `browserDocument()` 経由。直接 `document` なし | PASS |
| I-6 hydration mismatch なし | footer 固定は CSS（margin-auto/flex/height）。JS 計測なし。`onToggle`/listener は mount 後のみで初期 HTML 不変 | PASS |
| I-7 観測契約属性維持 | 既存属性削除なし。`data-shell-block="sidebar-footer"`/`nav-badge-dot` は additive | PASS |
| I-8 details ネイティブ挙動維持 | summary トグル・キーボード・aria 維持。外側クリックは additive listener | PASS |

### simpler alternative 検討

| 案 | 内容 | 採否 | 理由 |
|----|------|------|------|
| C1 alt | aside を `position: fixed` 化 | 不採用 | sticky のままで足りる。fixed は隣接 main の幅計算へ波及しリスク大 |
| C3 alt | `<details>` を撤廃し React state + `Popover` primitive 新設 | 不採用 | I-2/I-8 違反・スコープ肥大。additive listener で最小修正可能 |
| C3 alt2 | CSS `:focus-within` で開閉 | 不採用 | 外側クリック閉じが focus 移動依存になり、非フォーカス要素クリックで閉じない |
| C4 alt | layout 側で footer を `<main>` の外へ出す | 不採用 | `(public)/layout.spec` P-5「footer は shell 配下」契約に抵触 |
| C2 alt | badge を collapsed でも Chip 描画し `max-w` で抑制 | 不採用 | Chip 内 padding で 4rem 超過リスク。ドットが確実 |

### MINOR 追跡テーブル

| MINOR ID | 指摘内容 | 解決予定Phase | 解決確認Phase | 備考 |
|----------|---------|--------------|--------------|------|
| TECH-M-01 | C2 badge collapsed ドットの件数を `sr-only` で残すか（a11y） | Phase 5 | Phase 9/10 | reviewer 判断。残す方針を推奨 |
| TECH-M-02 | C3 外側クリック listener の汎用 hook 化（`useDismissable`）| 未タスク化候補 | — | 本タスクは `SidebarUserMenu` 内に閉じる。再利用需要が出たら抽出（Phase 12 未タスク） |
| TECH-M-03 | `100dvh` 非対応ブラウザ fallback（`100vh` 併記済）| Phase 5 | Phase 9 | CSS 二重宣言で対応済。確認のみ |

### リスク評価

| リスク | 度合い | 緩和 |
|--------|--------|------|
| `SidebarShell.tsx` / `SidebarUserMenu.tsx` の複数 concern 同時編集による回帰 | 中 | Phase 5 実装を concern 順（C1→C4→C2→C3）で**直列**化。各 concern 後に targeted vitest |
| aside `overflow-hidden` で focus ring がクリップされる | 低 | nav 内部スクロール領域では focus-visible outline が見える。footer 領域は固定で全表示 |
| `<main>` flex-column 化が admin/member layout の既存レイアウトに波及 | 低 | children は単一 wrapper div（flex-1 flex-col）。Phase 9 で 3 layout を回帰確認 |
| `onToggle` イベントの jsdom 互換 | 低 | テストは `details.open = true` を直接設定 + `fireEvent` で代替（Phase 4 で明記）|

## 参照資料

- Phase 1 / Phase 2
- `(public)/layout.spec.tsx`（P-5 契約）
- `SidebarShell.spec.tsx` / `SidebarUserMenu.spec.tsx`（既存契約）

## 実行手順

1. AC ↔ 設計のトレーサビリティを確認（完了・全 PASS）。
2. 不変条件 I-1〜I-8 を 1 件ずつ照合（完了・全 PASS）。
3. simpler alternative を検討し採否を記録（完了）。
4. MINOR を追跡テーブル化（完了・3 件）。
5. ゲート判定 → PASS → Phase 4 へ。

## 統合テスト連携

- Phase 4 で C1-C4 の component spec 契約と既存 spec 回帰を設計する前提条件（PASS 判定）を満たした。

## 多角的チェック観点（AIが判断）

- **整合性**: 4 concern が同一 shell 内で閉じ、API/auth へ波及しない。状態所有権が単一。
- **運用性**: 実装直列化 + targeted vitest で回帰検知が容易。CI gate（verify-design-tokens / vitest）に乗る。
- **価値性**: 4 件すべて基本可用性の回復。実装コスト小・価値大。

## サブタスク管理

| concern | レビュー判定 | 戻り先 |
|---------|-------------|--------|
| C1 | PASS | — |
| C2 | PASS（TECH-M-01 を Phase 5 で確定）| — |
| C3 | PASS（TECH-M-02 は未タスク候補）| — |
| C4 | PASS | — |

## 成果物

- `outputs/phase-3/design-review.md`（ゲート判定サマリ。本ファイルを正本とする）
- ゲート判定: **PASS** / MINOR 3 件追跡 / MAJOR 0 件

## 完了条件

- [x] AC ↔ 設計トレーサビリティを全 AC で確認した
- [x] 不変条件 I-1〜I-8 を全件照合した
- [x] simpler alternative の採否を記録した
- [x] MINOR 追跡テーブルを作成した（3 件）
- [x] ゲート判定 PASS を確定し、Phase 4 開始条件を満たした
- [x] Phase 13 blocked 条件（commit/PR は user-gated）を確認した

## タスク100%実行確認【必須】

- [x] 全実行タスクを完了
- [x] ゲート判定成果物を本ファイルに記載
- [x] Phase 4 開始条件（Phase 1-3 完了）を満たす

## 次Phase

[Phase 4: テスト計画](phase-4-test-plan.md)
