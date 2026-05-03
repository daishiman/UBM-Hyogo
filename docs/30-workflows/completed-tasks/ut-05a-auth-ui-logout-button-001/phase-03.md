[実装区分: 実装仕様書]

# Phase 3: 設計レビュー — ut-05a-auth-ui-logout-button-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-auth-ui-logout-button-001 |
| phase | 3 / 13 |
| wave | Wave 5 follow-up |
| mode | parallel |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1-2 の scope / 設計が、05a-followup-google-oauth-completion で固定された
Auth.js / middleware 不変条件、CLAUDE.md コーディング規約、既存 `(public)` レイアウトと
矛盾しないことを実在パス確認 + grep ベースで保証する。

## 実行タスク

1. 既存実装の実在確認（`apps/web/src/lib/auth.ts` / `apps/web/middleware.ts` /
   `apps/web/src/lib/session.ts` / `apps/web/src/components/ui/Button.tsx`）。
2. `/profile` への適用方針が `(public)` / `(member)` / `(admin)` の責務境界を侵さないか確認。
3. 既存テスト（`apps/web/__tests__/`、`apps/web/playwright/tests/`）の命名・配置と整合するか確認。
4. `next-auth/react` のバージョン（v5 系）と `signOut` 利用シグネチャの整合確認。

## 参照資料

- apps/web/middleware.ts
- apps/web/src/lib/auth.ts
- apps/web/src/lib/session.ts
- apps/web/app/(member)/layout.tsx
- apps/web/app/(admin)/layout.tsx
- apps/web/src/components/layout/AdminSidebar.tsx
- apps/web/src/components/ui/Button.tsx
- apps/web/package.json（`next-auth` バージョン確認用）

## 統合テスト連携

- 上流: 05a-followup-google-oauth-completion の Auth.js v5 設定
- 下流: Phase 4 のテスト戦略へレビュー結果を引き継ぐ

## レビュー観点

### 整合性

- `signOut` import path: `next-auth/react`（v5 でも client API 経路はこの import で提供）
- `redirectTo: "/login"` が middleware の `/login?next=...` と衝突しない
- `(member)` layout に `<MemberHeader />` を追加しても既存の `/profile` ページの DOM 階層を破壊しない
- AdminSidebar フッタ追加が既存テスト（あれば）の selector を破壊しない

### 安全性

- session token / cookie 値を DOM に書き出さない
- `<SignOutButton />` を未認証 route で読み込まない（middleware が block しているため二重防御）
- `signOut()` 失敗時に session が中途半端に残るリスクを Phase 6 で扱う

### 実行可能性

- `pnpm --filter web typecheck` / `pnpm --filter web lint` が通る最小構成
- Vitest / Playwright の既存 scaffold（08b 以降）が利用できる
- 既存 `Button` primitive で variant が足りない場合、生 `<button>` で代替（依存追加なし）

## 多角的チェック観点

- システム系: middleware / Auth.js / UI shell の責務境界が侵されていない
- 戦略・価値系: M-08 evidence 経路の確立という最小スコープに合致
- 問題解決系: 「ログアウト UI 不在」という根本原因に対処、`/api/auth/signout` 直叩きの workaround を避ける

## サブタスク管理

- [ ] 各既存ファイルの存在を ls で確認
- [ ] `next-auth` バージョン確認
- [ ] Auth.js v5 `signOut` の `redirectTo` / redirect option 互換を確認
- [ ] `(public)` / `(member)` / `(admin)` の責務境界を確認
- [ ] outputs/phase-03/main.md を作成する
- [ ] 差し戻しが必要なら outputs/phase-03/review-findings.md

## 成果物

- outputs/phase-03/main.md
- 必要時のみ outputs/phase-03/review-findings.md

## 完了条件

- 全レビュー観点が OK
- 不整合があれば Phase 1 / 2 にフィードバック済み
- Phase 4 以降の前提として明文化されている

## タスク100%実行確認

- [ ] 仮置きパス / コマンドが消えている
- [ ] secret / 個人情報が含まれていない
- [ ] Auth.js v5 の signOut シグネチャと整合している

## 次 Phase への引き渡し

Phase 4 へ、レビュー済 scope / 設計、解消した不整合一覧、残課題を渡す。
