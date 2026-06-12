# Phase 6: テスト追加 — fail path・回帰 guard・既存 spec 非破壊確認

## メタ情報

- task_id: `responsive-mobile-tablet-ui-fixes`
- 前提: [phase-4-test-plan.md](phase-4-test-plan.md)（TC-4-*）/ [phase-5-implementation.md](phase-5-implementation.md)（変更ファイル）/ [shared-context.md](shared-context.md)
- 注記: 本 Phase はテスト追加の設計（仕様）。テスト実行は後続実装の責務。

## 目的

Phase 4 の happy path に対し、(a) fail path / 境界ケース、(b) 既存 `*.spec.tsx` 非破壊の回帰 guard を追加し、`data-label` additive 付与・drawer 幅クラス変更が既存 query を壊さないことを担保する。

## 実行タスク

1. 境界ケース TC-6-* を追加（極小 320px・drawer 開閉・popover 収納）。
2. 既存 spec への影響 inventory を作成し非破壊を確認する。
3. fail path（横スクロール検出時の明確な失敗）の assert を確定する。

## 追加テストケース（境界・fail path）

| TC | AC | 対象 | viewport | 期待 |
| --- | --- | --- | --- | --- |
| TC-6-1 | AC-2,6 | `/`・`/(admin)/admin/members` | 320 × 720（極小ベストエフォート） | 横スクロール 0（崩れ・はみ出しは不可）。pixel 完全一致は非要求 |
| TC-6-2 | AC-8 | 管理 drawer | mobile-narrow(375) | drawer 開 → panel `boundingBox.x>=0 && x+width<=375+1`。バックドロップ tap で閉じる |
| TC-6-3 | AC-8 | user menu popover | mobile(390) | popover 開 → 右端見切れなし（`x+width<=390+1`） |
| TC-6-4 | AC-8 | shell tooltip | tablet(768) | tooltip が `max-width: min(240px, …)` で viewport 内 |
| TC-6-5 | AC-7 | MembersTable | mobile(390) | mobile カード化時に全列 content が DOM 到達可能（`td::before` data-label 表示） |
| TC-6-6 | AC-2 | 横スクロール検出 fail path | mobile | わざと overflow が出るケースで `overflow>1` → spec が **失敗する**ことを確認（assert の有効性検証） |

## 既存 spec 影響 inventory（非破壊 guard）

変更が既存テストの query を壊さないことを確認する対象（`apps/web/src/components/shell/__tests__/` 実在ファイル）:

| 既存 spec | 変更の影響 | guard 方針 |
| --- | --- | --- |
| `SidebarDrawer.spec.tsx`（55 行） | drawer 幅クラス変更 | 既存 query（role/testid）は className 非依存 → 非破壊。additive で TC-4-22..23 を足す |
| `SidebarShell.spec.tsx` | tooltip/popover max-width 追加 | className 追加のみ・構造/query 不変 → 非破壊 |
| `SidebarShell.server.spec.tsx` | aside `hidden md:flex` 不変 | 影響なし |
| `SidebarTooltip.spec.tsx` | `.ubm-shell-tooltip` max-width 追加 | jsdom は CSS 非評価 → 構造 query 不変・非破壊 |
| `SidebarUserMenu.spec.tsx` | `.ui-sidebar-user-menu-popover` max-width 追加 | 同上・非破壊 |
| `SidebarNavItem.spec.tsx` / `SidebarMobileTrigger.spec.tsx` / `SidebarCollapseToggle.spec.tsx` | 変更対象外 | 影響なし |
| `shell-config.spec.ts` / `user-menu-config.spec.ts` / `useSidebarState.spec.tsx` / `shell-collapse-cookie.spec.ts` | nav config / state ロジック | CSS 変更非依存・影響なし |

> テーブル component への `data-label` additive 付与は、既存テーブル spec（admin 配下 `*.spec.tsx`）の `getByText` / `getByRole('cell')` を破壊しない（属性追加のみ・テキスト内容不変）。実装後に当該 spec を回し非破壊を確認する。

## jsdom と CSS 評価の制約

- jsdom は CSS メディアクエリ・`clamp()`/`minmax()` を評価しない。よって**構造 spec はクラス名・属性・DOM 構造の検証に限定**する（幅クラスの文字列含有・`data-label` 属性の存在）。
- レスポンシブの**視覚的崩れ・横スクロール 0 は Playwright visual（実ブラウザ）でのみ担保**する（TC-4-* / TC-6-*）。この役割分担を Phase 7 カバレッジで明記する。

## fail path assert の有効性

横スクロール 0 assert は「常に通る空虚テスト」になってはならない。TC-6-6 で意図的 overflow を注入し spec が失敗することを一度確認してから baseline 化する（assert の生存確認）。

## 参照資料

### システム仕様（aiworkflow-requirements）

- `int-test-*.md`（回帰 guard）, `ui-ux-*.md`（境界ケース）。
- プロジェクト: `apps/web/src/components/shell/__tests__/`（既存 shell spec 群）。

## 成果物

- 本ファイル（テスト追加）。TC-6-1..TC-6-6・既存 spec 影響 inventory・jsdom 制約・fail path 有効性確認方針。

## 統合テスト連携

- 上流: Phase 4 happy path・Phase 5 変更ファイル。
- 下流: Phase 7 が本テストのカバレッジ寄与を変更ブロック限定で評価。

## 完了条件

境界・fail path TC が定義され、既存 spec の非破壊が inventory で確認され、jsdom/Playwright の役割分担が明示されていること。
