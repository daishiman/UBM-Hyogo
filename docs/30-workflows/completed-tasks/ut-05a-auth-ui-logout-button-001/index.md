[実装区分: 実装仕様書]

# ut-05a-auth-ui-logout-button-001

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | Wave 5 follow-up |
| mode | parallel |
| owner | - |
| 状態 | implemented-local-runtime-evidence-blocked |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | https://github.com/daishiman/UBM-Hyogo/issues/386 (CLOSED, keep closed) |
| task_id | UT-05A-AUTH-UI-LOGOUT-BUTTON-001 |

## purpose

Google OAuth ログイン後の app shell にログアウト導線が存在しないため、Auth.js
`signOut()` の正規導線が UI 上から叩けず、`ut-05a-followup-google-oauth-completion`
Phase 11 の M-08「sign-out で session cookie 削除」を実測 PASS にできない。
本タスクは `(member)` / `(admin)` 共通の sign-out ボタンを `apps/web` に追加し、
M-08 evidence（click 前後のスクリーンショット、`/api/auth/session` の `{}` JSON）
を取得できる状態を作ることを責務とする。

## why this is not a restored old task

このタスクは 05a follow-up 本体の責務分割であり、Auth.js のサーバ側 endpoint
（既存の `apps/web/src/lib/auth.ts` および middleware）には変更を加えない。
あくまで UI 側のログアウト導線追加と E2E 経路確立だけを単一責務として持つ。

## scope in / out

### Scope In

- 新規 component: `apps/web/src/components/auth/SignOutButton.tsx`
- `(member)` 共通ヘッダ component: `apps/web/src/components/layout/MemberHeader.tsx`（新規）
- `apps/web/app/(member)/layout.tsx` の編集（共通ヘッダ + sign-out 配置）
- `apps/web/app/profile/page.tsx` の編集（`/profile` は route group 外の protected URL のため、同じ MemberHeader をページ先頭に配置）
- `apps/web/src/components/layout/AdminSidebar.tsx` の編集（フッタに sign-out 配置）
- 単体テスト: `apps/web/src/components/auth/__tests__/SignOutButton.test.tsx`
- M-08 evidence 取得経路の確立（`outputs/phase-11/` への実測保存。E2E spec 新設は認証済 storage state が整った後の任意拡張）

### Scope Out

- Auth.js `signOut` endpoint の挙動変更
- `apps/web/middleware.ts` の認可ロジック変更
- `apps/api` 側の session 仕様変更
- ログイン UI（`apps/web/app/login/`）の構造変更
- 公開 (`(public)`) ルートへのログアウトボタン配置
- ユーザー明示指示なしの commit / push / PR 作成

## dependencies

### Depends On

- 05a-followup-google-oauth-completion（既存 Auth.js v5 + GoogleProvider 実装）
- 既存 `apps/web/src/lib/session.ts`（`getSession()` 提供）
- 既存 `apps/web/middleware.ts`（cookie 検査と `/login` redirect）

### Blocks

- ut-05a-followup-google-oauth-completion Phase 11 M-08 の PASS 化
- 05a 系 evidence bundle の close-out

## refs

- docs/30-workflows/unassigned-task/task-05a-auth-ui-logout-button-001.md
- docs/30-workflows/completed-tasks/ut-05a-followup-google-oauth-completion/outputs/phase-12/unassigned-task-detection.md
- https://github.com/daishiman/UBM-Hyogo/issues/386
- apps/web/middleware.ts
- apps/web/src/lib/auth.ts
- apps/web/src/lib/session.ts
- apps/web/app/(member)/layout.tsx
- apps/web/app/(admin)/layout.tsx
- apps/web/src/components/layout/AdminSidebar.tsx
- apps/web/src/components/ui/Button.tsx

## AC

- AC-1: ログイン済の `(member)` / `(admin)` いずれの画面でも、視認可能な「ログアウト」ボタンが存在する
- AC-2: ボタン押下で Auth.js `signOut({ redirectTo: "/login" })` が呼ばれ、`/login` に遷移する
- AC-3: 遷移後 `/api/auth/session` が `{}` 相当の未認証レスポンスを返す
- AC-4: session cookie（`__Secure-authjs.session-token` 等 Auth.js 既定 cookie）が削除または無効化される
- AC-5: sign-out 後に `/profile` / `/admin` を直接叩くと middleware で `/login` に redirect される

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md

今回の改善サイクルでは実コード変更と Phase 12 strict 7 files を実体化する。
Phase 11 の visual screenshot / cookie 実測は実 OAuth session が必要なため
`runtime-evidence-blocked` として placeholder を置き、PASS とは扱わない。

## invariants touched

- Auth.js v5 (`apps/web/src/lib/auth.ts`) の設定を変更しない
- `apps/web/middleware.ts` の cookie 検査ロジックを変更しない
- `(public)` route 配下に sign-out ボタンを露出しない（未ログイン状態で表示しない）
- 認証済 shell または protected URL にのみ sign-out UI を配置する
- `signOut()` の `redirectTo` は `/login` で統一する
- session cookie / OAuth token 値を screenshot / log / spec に書き残さない
- D1 直接アクセスを `apps/web` に持ち込まない（不変条件 #5）

## completion definition

phase-01〜phase-13 仕様書が揃い、AC-1〜AC-5 が evidence path に 1 対 1 で対応し、
`apps/web` のログアウト UI 実装、focused unit test、web typecheck、Phase 12 strict 7 files、
aiworkflow discoverability 同期が完了していること。
Phase 11 runtime evidence は OAuth 認証済み local/staging session が必要なため blocked とし、
実 screenshot / cookie / session 実測を PASS 扱いしない。

## issue 連携

- Issue #386 は CLOSED のまま据え置く（再オープンしない）
- 実装済み close-out でも Issue 状態を変更しない
- commit / push / PR 作成は user 明示指示後にのみ実行する
