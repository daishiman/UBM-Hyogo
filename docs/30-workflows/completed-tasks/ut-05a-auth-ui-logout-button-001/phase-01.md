[実装区分: 実装仕様書]

# Phase 1: 要件定義 — ut-05a-auth-ui-logout-button-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-auth-ui-logout-button-001 |
| task_id | UT-05A-AUTH-UI-LOGOUT-BUTTON-001 |
| phase | 1 / 13 |
| wave | Wave 5 follow-up |
| mode | parallel |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | #386 (CLOSED) |
| scope | (member)/(admin) shell へ sign-out UI 追加 + M-08 evidence 経路確立。Auth.js endpoint / middleware 変更なし。commit / push / PR は user 明示指示後のみ |

## Schema / 共有コード Ownership 宣言

| 対象 | 本タスクでの編集権 | owner / 参照元 | 理由 |
| --- | --- | --- | --- |
| DB schema / migrations | no | U-04 / 03a / 03b | UI のみの変更でスキーマ非関与 |
| Auth.js 設定 (`apps/web/src/lib/auth.ts`) | no | 05a-followup-google-oauth-completion | 既存 provider / callback を変更しない |
| `apps/web/middleware.ts` | no | 05a-followup-google-oauth-completion | cookie 検査ロジック非変更 |
| `(member)` layout / 共通ヘッダ | yes | 本タスク | sign-out 導線追加が単一責務 |
| `AdminSidebar` | yes | 本タスク | sign-out 導線追加 |
| `SignOutButton` component | yes (新規) | 本タスク | 共通 sign-out primitive |

## 目的

ログイン後 UI に「ログアウト」ボタンを追加し、`signOut({ redirectTo: "/login" })`
を経由して session を確実に破棄できる UX を確立する。M-08
（sign-out で session cookie 削除）の evidence を取得できる経路を作ることで、
05a-followup の Phase 11 を PASS にできる前提を整える。

## 要件サマリ

- 機能要件:
  - ログイン済の `(member)` / `(admin)` 画面で常にログアウトボタンが視認できる
  - ボタン押下で Auth.js `signOut()` が呼ばれる
  - sign-out 完了後、`/login` に redirect される
  - sign-out 後 `/api/auth/session` が未認証 (`{}` 相当) を返す
  - sign-out 後 `/profile` / `/admin` にアクセスすると middleware で `/login` へ redirect される
- 非機能要件:
  - ボタンは Tailwind / 既存 `Button` primitive と整合した見た目
  - aria-label / role を備える（accessibility）
  - 個人情報・session token を DOM / log に露出しない
  - サーバーコンポーネント境界を尊重し client component (`"use client"`) として分離

## 実行タスク

1. 既存の `apps/web/app/(member)/layout.tsx` / `apps/web/app/(admin)/layout.tsx` /
   `apps/web/src/components/layout/AdminSidebar.tsx` の構造を確認し、sign-out 配置候補を確定する。
   完了条件: 配置先の path / コンポーネント / DOM 階層が決まっている。
2. Auth.js v5 の `signOut()` 利用方針（`next-auth/react` client component から呼ぶ）を確定する。
   完了条件: `"use client"` ディレクティブと `redirectTo` 既定値が確定。
3. AC-1〜AC-5 を Phase 7 / Phase 11 evidence path と紐付ける。
   完了条件: AC ↔ evidence path の対応表が下流フェーズに渡せる状態。
4. user 承認 gate（実装着手 / commit / push / PR）を分離する。
   完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/30-workflows/unassigned-task/task-05a-auth-ui-logout-button-001.md
- docs/30-workflows/completed-tasks/ut-05a-followup-google-oauth-completion/outputs/phase-12/unassigned-task-detection.md
- apps/web/middleware.ts
- apps/web/src/lib/auth.ts
- apps/web/src/lib/session.ts
- apps/web/app/(member)/layout.tsx
- apps/web/app/(admin)/layout.tsx
- apps/web/src/components/layout/AdminSidebar.tsx
- apps/web/src/components/ui/Button.tsx

## 実行手順

- 対象 directory: `docs/30-workflows/ut-05a-auth-ui-logout-button-001/`
- 本仕様書作成では実コード変更・実 evidence 取得・commit / push / PR を行わない
- 実装着手は Phase 5 ランブックに従い user 明示指示後

## 変更対象ファイル一覧（Phase 5 ランブックの源泉）

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `apps/web/src/components/auth/SignOutButton.tsx` | 新規 | client component。`signOut({ redirectTo: "/login" })` を呼ぶボタン |
| `apps/web/src/components/layout/MemberHeader.tsx` | 新規 | `(member)` 共通ヘッダ。`<SignOutButton />` を含む |
| `apps/web/app/(member)/layout.tsx` | 編集 | `<MemberHeader />` を `children` の上に配置 |
| `apps/web/app/profile/page.tsx` | 編集 | `/profile` は `(member)` route group 外の protected URL なので `<MemberHeader />` を直接配置 |
| `apps/web/src/components/layout/AdminSidebar.tsx` | 編集 | フッタに `<SignOutButton />` を配置 |
| `apps/web/src/components/auth/__tests__/SignOutButton.test.tsx` | 新規 | Vitest unit test |
| `outputs/phase-11/manual-smoke-log.md` | 新規 | OAuth visual smoke の runtime blocked / 実行手順を記録 |

## 統合テスト連携

- 上流: 05a-followup-google-oauth-completion（Auth.js / middleware / session util）
- 下流: 05a-followup Phase 11 M-08 の PASS 化（本タスクが evidence 経路を提供）

## 多角的チェック観点

- Auth.js の server endpoint や middleware を変更していない
- session token / OAuth token を DOM / log / spec に書き残していない
- public route 配下に sign-out ボタンを露出していない
- `signOut()` の `redirectTo` が `/login` で統一されている
- `(member)` の共通ヘッダ追加が既存 `(public)` レイアウトと衝突しない

## サブタスク管理

- [ ] 既存 layout / sidebar の構造を読み込む
- [ ] sign-out 配置先を確定する
- [ ] AC ↔ evidence path 対応表を Phase 7 へ渡す
- [ ] approval gate を明記する
- [ ] outputs/phase-01/main.md を作成する

## 成果物

- outputs/phase-01/main.md

## 完了条件

- 変更対象ファイル一覧と変更種別が確定している
- AC-1〜AC-5 と evidence path の対応関係が下流に渡せる
- approval gate（実装 / commit / push / PR）が分離されている

## タスク100%実行確認

- [ ] 必須セクションが全て埋まっている
- [ ] Auth.js endpoint / middleware を編集対象に含めていない
- [ ] secret / token 値を一切記載していない

## 次 Phase への引き渡し

Phase 2 へ、変更対象ファイル一覧、AC ↔ evidence path 対応表、approval gate、
client / server component 境界方針を渡す。
