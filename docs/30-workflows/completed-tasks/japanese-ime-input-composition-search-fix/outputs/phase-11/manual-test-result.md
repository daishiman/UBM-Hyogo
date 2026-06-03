# Phase 11: 手動テスト結果（VISUAL / local screenshot captured）

## VISUAL 宣言

- タスク種別: **VISUAL**（NON_VISUAL ではない）。検索入力の日本語入力挙動・×の単一表示・focus 維持が視覚対象。
- screenshot 状態: **local Playwright screenshot 2 枚を取得済み**。実機の日本語 IME composition 操作 + staging 認証が必要な
  composing/committed 操作 screenshot のみ Gate-C user-gated。
- 主証跡: jsdom render unit（`Search.spec.tsx` / `SelectedFiltersBar.client.spec.tsx` / `MemberFilters.client.spec.tsx`）、
  純ロジック unit（`useImeSafeInput.spec.tsx`）、local `/members` screenshot。

## 証跡メタ（[Feedback 4]）

| 項目 | 内容 |
| --- | --- |
| 証跡の主ソース | focused Vitest 5 files / 26 tests + local Playwright screenshot |
| local screenshot | `screenshots/member-search-local-overview.png`, `screenshots/member-search-local-keyword-filter.png` |
| user-gated screenshot | 実機 IME composition 操作 + staging 認証を要する `member-search-ime-composing` / `member-search-ime-committed` / `member-search-cleared` |

## 手動確認チェックリスト（実装 wave で実施）

- [ ] 「テスト」と日本語 IME 入力し、変換中（未確定）に文字が崩れない（AC-1）
- [ ] 変換確定 + debounce 後に確定文字列で検索が更新される（AC-2）
- [ ] ×アイコンがキーワードに対し 1 箇所のみ（入力欄内）（AC-3）
- [ ] ×クリックで即時クリア（debounce 待ちなし）（AC-4）
- [ ] 英数字入力が回帰しない（AC-6）

## 実行記録

- 本サイクル: local `/members` を `PUBLIC_API_BASE_URL=https://ubm-hyogo-api-staging.daishimanju.workers.dev`
  と `AUTH_SECRET` 付き dev server で起動し、Playwright CLI で screenshot 2 枚を保存。
- 実機 IME 操作: staging 認証と OS 日本語 IME 操作を要するため user-gated。
