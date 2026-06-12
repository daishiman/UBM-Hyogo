# Phase 10: 最終レビュー — AC 充足判定・blocker 判定

## メタ情報

- task_id: `responsive-mobile-tablet-ui-fixes`
- 前提: 全 Phase（[phase-1-requirements.md](phase-1-requirements.md) 〜 [phase-9-qa.md](phase-9-qa.md)）/ [shared-context.md](shared-context.md)
- 判定: 本タスク（実装仕様書）が 1 サイクル完結で実装可能か、blocker がないか。

## 目的

AC-1..AC-10 の各々について「どの Phase / 変更ファイル / テストで充足されるか」を最終確認し、MINOR 指摘と blocker を判定する。

## 実行タスク

1. AC-1..AC-10 の充足元（変更ファイル + テスト）を表で確定する。
2. MINOR 指摘を抽出し、Phase 12 未タスク化候補かを判定する。
3. blocker 有無を判定する。

## AC 充足判定

| AC | 充足元（変更ファイル / Phase） | 検証テスト | 判定 |
| --- | --- | --- | --- |
| AC-1 共通 breakpoint 体系・境界統一 | `tokens.css`(--bp-*) + `globals.css` 境界統一（Phase 5 §1-2） | grep（900/720 が 0）/ Phase 9 | 充足 |
| AC-2 公開層 6 ルート崩れなし | `legacy-public.css` main/stat grid + `globals.css`（Phase 5 §3-4） | TC-4-1..6（横スクロール 0 + box 内） | 充足 |
| AC-3 会員層 2 ルート崩れなし | `auth.css` padding + `globals.css` grid（Phase 5 §4,7） | TC-4-7..8 | 充足 |
| AC-4 管理層 8 ルート崩れなし | `globals.css` grid/table（Phase 5 §4-5） | TC-4-9..16 | 充足 |
| AC-5 共通 3 画面中央表示 | `apps/web/app/{error,not-found,loading}.tsx`（Phase 5 §8） | TC-4-17..19 | 充足 |
| AC-6 固定/最小幅グリッド流体化 | `legacy-public.css` + `globals.css`（minmax(0,…)）（Phase 5 §3-4） | TC-4-1,2,11,13 + grep | 充足 |
| AC-7 管理テーブル mobile フォールバック | `globals.css` `.admin-table--cards`/`.admin-table-scroll` + `data-label` additive（Phase 5 §5） | TC-4-10,11,14,15,16 / TC-6-5 | 充足 |
| AC-8 オーバーレイ収納 | `globals.css` tooltip/popover max-width + `SidebarDrawer.tsx` 幅（Phase 5 §6） | TC-4-20,21 / TC-6-2..4 / SidebarDrawer.spec TC-4-22..23 | 充足 |
| AC-9 token 不変条件・apps/api 非変更 | 新規色/HEX なし・CSS のみ（Phase 9） | `verify:tokens` / `git diff -- apps/api` 空 | 充足 |
| AC-10 Playwright visual baseline green | `full-visual.spec.ts`（新規）+ baseline（Phase 11） | playwright test PASS | 充足（baseline 撮影は Phase 11） |

## MINOR 指摘

| # | 指摘 | 判定 |
| --- | --- | --- |
| M-1 | `viewports.ts` への `mobileNarrow`(375) additive 追加は他 visual spec（`full-visual.spec.ts`）でも将来利用可能だが、本タスクでは新 spec のみ参照。横展開は不要 | 未タスク化不要（additive・既存非破壊） |
| M-2 | テーブル per-table のカード化 vs 横スクロール判断は Phase 5 の基準で機械化されているが、実装時に列数が境界（4 列前後）のテーブルは目視確認が要る | 実装時の per-table 確認で吸収。未タスク化不要 |
| M-3 | segment 別 `error/loading/not-found`（`(public)`/`(admin)`/`(member)`/`(auth)` 配下）が複数存在。共通 utility に寄せれば重複は最小だが、route 個別の文言/構造は保持 | Phase 5 §8 で方針確定済。未タスク化不要 |

> 本タスクは原則 1 サイクル完結（CONST_007）。崩れの根本は共通 CSS 層に集中するため MINOR は最小で、いずれも別 PR / 別タスク化を要さない。

## blocker 判定

- **blocker なし**。
  - 変更は CSS / breakpoint / 少量 TSX 属性に限定され、API/D1/Form 非接触（不変条件 #1 #5）。
  - 全 AC が変更ファイル + テストに 1:1 で紐付き、検証コマンドが確定（Phase 9）。
  - 既存 spec 非破壊が inventory で確認済（Phase 6）。
  - 実在パス検証済（route は `apps/web/app/`、`SidebarDrawer.spec.tsx` は既存編集、`viewports.ts` は additive）。

## 最終判定

**PASS** — AC-1..AC-10 が充足設計され、blocker なし。1 サイクルで実装可能。後続 `03.実装.md`（実装）+ Phase 11（visual baseline 撮影）へ進める。

## 参照資料

### システム仕様（aiworkflow-requirements）

- `architecture-*.md`（責務境界）, `ui-ux-*.md`（AC 充足観点）, `int-test-*.md`（検証）。
- プロジェクト: 全 Phase 仕様書・[shared-context.md](shared-context.md)。

## 成果物

- 本ファイル（最終レビュー）。AC 充足判定表・MINOR 指摘・blocker なし判定・PASS。

## 統合テスト連携

- 上流: Phase 4-9 の設計・テスト・QA。
- 下流: Phase 11（screenshot/visual baseline）・Phase 12（実装ガイド）・Phase 13（PR）。

## 完了条件

AC-1..AC-10 の充足元が確定し、MINOR が最小で別タスク化不要と判定され、blocker なしで 1 サイクル完結が裏付けられていること。
