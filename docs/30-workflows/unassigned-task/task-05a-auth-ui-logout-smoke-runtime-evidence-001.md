# 05a follow-up: Auth UI Logout Button Runtime Evidence Smoke

## メタ情報

```yaml
issue_number: TBD
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-05a-auth-ui-logout-smoke-runtime-evidence-001 |
| タスク名 | ログアウトボタン Phase 11 runtime evidence (OAuth 認証済み smoke) の取得 |
| 分類 | verification |
| 対象機能 | apps/web auth UI / Auth.js v5 sign-out flow |
| 優先度 | High |
| ステータス | 未着手（runtime-evidence-blocked からの再開待ち） |
| 発見元 | `ut-05a-auth-ui-logout-button-001` Phase 11 / Phase 12 |
| 発見日 | 2026-05-03 |
| 前提 | `task-05a-auth-ui-logout-button-001` 実装 (local) 完了 |
| 親タスク | `docs/30-workflows/ut-05a-auth-ui-logout-button-001/` |

## 背景

`ut-05a-auth-ui-logout-button-001` の cycle で `SignOutButton` / `MemberHeader` / `(member)` layout / `/profile` / `AdminSidebar` の local 実装と focused unit / typecheck まで完了したが、**OAuth 認証済みブラウザ session が用意できなかった**ため Phase 11 で要求される screenshot / cookie 削除 / `/api/auth/session` redaction evidence が `runtime-evidence-blocked` のまま残った。Phase 12 boundary は「local 実装と契約は完了、runtime 視覚証跡だけが pending」と明記されており、本未タスクはその runtime 証跡だけを切り出した独立 follow-up である。

`outputs/phase-12/main.md` および `outputs/phase-12/implementation-guide.md` に列挙された未取得 evidence のみを対象とする。

## 目的

OAuth 認証済み local もしくは staging ブラウザ session を確立した上で、`SignOutButton` 押下による sign-out flow を実画面で実行し、Phase 11 M-08 を `PASS` に上げられる runtime evidence 一式を保存する。

## スコープ

含む:

- local (`pnpm dev`) または staging (`https://<staging>`) での Google OAuth 実 login
- `/profile` 画面で `MemberHeader` の `SignOutButton` 押下 → `/login` への redirect 確認
- `/admin` 画面で `AdminSidebar` footer の `SignOutButton` 押下 → `/login` への redirect 確認
- 以下 evidence の保存:
  - `outputs/phase-11/screenshots/before-signout-profile.png`
  - `outputs/phase-11/screenshots/before-signout-admin.png`
  - `outputs/phase-11/screenshots/after-signout.png`
  - `outputs/phase-11/session-after.json` (期待値: `{}`)
  - `outputs/phase-11/cookies-after.json` (Auth.js session cookie 削除 / `Max-Age=0` 証跡)
  - `outputs/phase-11/redaction-checklist.md`
- 取得後の Phase 11 `main.md` / `manual-smoke-log.md` 更新と M-08 ステータス `runtime-evidence-blocked` → `PASS` 切替

含まない:

- `SignOutButton` / `MemberHeader` / `AdminSidebar` の挙動変更（contract は確定済み）
- Auth.js config / `apps/web/middleware.ts` / API route の改修
- 新規 e2e (Playwright) shell script 化（本タスクは manual smoke が主、Playwright 拡張は別 follow-up）
- production 環境での smoke（staging で十分）

## 受け入れ条件

- 上記 6 evidence が `outputs/phase-11/` 配下に揃っている
- `/api/auth/session` レスポンスが sign-out 後 `{}` (未認証) であることが JSON で記録されている
- session cookie (`__Secure-authjs.session-token` 等) が削除済または `Max-Age=0` であることが cookie evidence で確認できる
- `/profile` / `/admin` 再アクセスで `/login` に redirect される録画 / screenshot が保存されている
- `redaction-checklist.md` で個人情報・実 OAuth ID トークン・実 email が画像と JSON 双方から伏せられていることが checked になっている
- Phase 11 `main.md` の `Status` が `runtime-evidence-blocked` から取れ、M-08 が PASS に更新される

## 検証方法

1. `mise exec -- pnpm --filter web dev` または staging URL で Google OAuth login
2. `/profile` で `before-signout-profile.png` 取得 → `SignOutButton` クリック → `/login` 着地で `after-signout.png` 取得
3. 別 session で再 login → `/admin` で `before-signout-admin.png` 取得 → footer `SignOutButton` クリック
4. DevTools で `/api/auth/session` を JSON 保存 (`session-after.json`)、Application > Cookies を JSON 保存 (`cookies-after.json`)
5. screenshot / JSON の redaction を `redaction-checklist.md` でチェック
6. Phase 11 `main.md` を更新し、M-08 を PASS に上げる

期待結果:

- `/api/auth/session` = `{}`
- session cookie の `Max-Age=0` または無存在
- `/profile`, `/admin` の保護後 redirect 302 → `/login`

失敗時の切り分け:

1. cookie が残る → `apps/web/src/lib/auth.ts` の cookie 名 / domain / path 設定確認
2. redirect が効かない → `signOut({ redirectTo: "/login" })` 引数と `apps/web/middleware.ts` matcher 確認
3. session JSON が空にならない → Auth.js v5 server runtime と client runtime の整合確認

## 関連

- `docs/30-workflows/ut-05a-auth-ui-logout-button-001/outputs/phase-11/main.md`
- `docs/30-workflows/ut-05a-auth-ui-logout-button-001/outputs/phase-12/main.md`
- `docs/30-workflows/ut-05a-auth-ui-logout-button-001/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/unassigned-task/task-05a-auth-ui-logout-button-001.md`（親未タスク・consumed）

## 苦戦箇所【記入必須】

- 対象: OAuth 認証済みブラウザ session の確保フロー（local headless / staging 双方）
- 症状: Claude Code 実行 context 内で OAuth 同意画面を通過した live session を作れず、Phase 11 M-08 を `runtime-evidence-blocked` のまま残さざるを得なかった。`signOut()` の client API は確定したが、押下する人間 / 自動化済 OAuth session が無いと screenshot 系 evidence が一切取れない構造的問題
- 教訓:
  - Phase 04 test-strategy 段階で「OAuth 認証済 session の供給経路（手動 staging login / 事前保存 storage state / Playwright `auth.setup.ts`）」を明示しないと Phase 11 で必ず blocked になる
  - 「local 実装完了 = タスク完了」ではなく、`runtime-evidence-blocked` 専用 follow-up を必ず切り出すこと（本タスクがそのテンプレート）
  - Auth.js v5 では `callbackUrl` ではなく `redirectTo` であり、これに気付くまで `signOut()` redirect 検証で 1 step 余分に hop する。リスク表 / implementation-guide も `redirectTo` に統一する
- 参照:
  - `docs/30-workflows/ut-05a-auth-ui-logout-button-001/outputs/phase-12/main.md`（boundary 記述）
  - `docs/30-workflows/ut-05a-auth-ui-logout-button-001/outputs/phase-11/main.md`（pending evidence 一覧）
  - Auth.js v5 sign-out API: `signOut({ redirectTo: "/login" })`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| OAuth 同意画面が再表示され screenshot が混入する | `prompt=none` / 既存 session reuse を確認、または redaction 対象に追加 |
| screenshot に実 email / 実名が写り込み redaction 漏れする | `redaction-checklist.md` を必須化し、PR / Issue へ raw 画像を貼らない運用を徹底 |
| staging 認証済 cookie の domain 違いで `/api/auth/session` 取得が CORS で失敗する | 同一 origin の DevTools Network から fetch し、curl での外部取得は使わない |
| local と staging で cookie 名が異なる (`__Secure-` prefix) | evidence は staging を正本とし、local は補助とする |
| evidence 取得 cycle 中に Auth.js / `redirectTo` 仕様変更が混入する | 本タスク開始時に `apps/web/src/components/auth/SignOutButton.tsx` を再 grep し contract 不変を確認 |
