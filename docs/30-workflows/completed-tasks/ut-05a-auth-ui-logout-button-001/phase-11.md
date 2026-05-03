[実装区分: 実装仕様書]

# Phase 11: 手動 smoke / 実測 evidence — ut-05a-auth-ui-logout-button-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-auth-ui-logout-button-001 |
| phase | 11 / 13 |
| wave | Wave 5 follow-up |
| mode | parallel |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| execution_allowed | false until explicit_user_instruction |

## 目的

実装した sign-out 導線をローカル / staging で実行し、AC-1〜AC-5 と M-08 の evidence
を取得する。今回サイクルでは実コードと placeholder evidence path を作成し、
実 OAuth session が必要な visual screenshot / cookie 実測は `runtime-evidence-blocked`
として PASS 扱いしない。

## 参照資料

- apps/web/src/components/auth/SignOutButton.tsx
- apps/web/app/profile/page.tsx
- apps/web/src/components/layout/AdminSidebar.tsx
- docs/30-workflows/completed-tasks/ut-05a-followup-google-oauth-completion/

## 統合テスト連携

- Focused unit test は `signOut({ redirectTo: "/login" })` を検証する。
- Manual smoke は `/profile` と `/admin` の visual / cookie / session evidence を取得する。

## 実行タスク（user 明示指示後）

1. ローカルで Google OAuth login を完了する
2. `/profile` または `/admin` に遷移し、sign-out ボタンの存在確認 + 押下前 screenshot 取得
3. sign-out ボタン click → `/login` redirect 確認 + 押下後 screenshot 取得
4. `/api/auth/session` を fetch し body を保存
5. ブラウザ DevTools / Playwright `context.cookies()` で session cookie 削除を確認（token 値 redaction）
6. `/profile` / `/admin` を再アクセスし `/login` redirect を確認
7. evidence を `outputs/phase-11/` に集約
8. 05a-followup workflow の Phase 11 M-08 行を本タスク evidence へリンクするように更新

## 必須 evidence path（VISUAL_ON_EXECUTION）

| path | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | 実行サマリ |
| `outputs/phase-11/screenshots/before-signout-profile.png` | `/profile` sign-out 前のログイン済画面 |
| `outputs/phase-11/screenshots/before-signout-admin.png` | `/admin` sign-out 前のログイン済画面 |
| `outputs/phase-11/screenshots/after-signout.png` | sign-out 後の `/login` 画面 |
| `outputs/phase-11/session-after.json` | `/api/auth/session` の body |
| `outputs/phase-11/cookies-after.json` | redaction 済 cookie 一覧 |
| `outputs/phase-11/redaction-checklist.md` | PII / token redaction 確認結果 |
| `outputs/phase-11/playwright-report/`（任意） | Playwright report / trace |
| `outputs/phase-11/manual-smoke-log.md`（手動時） | 手動 smoke 記録 |

`redaction-checklist.md` が PASS でない場合、AC-3 / AC-4 は PASS にしない。

## ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter web typecheck
mise exec -- pnpm --filter web lint
mise exec -- pnpm --filter web dev
# 別ターミナルで Playwright
# optional after authenticated storage state is available:
# mise exec -- pnpm --filter web exec playwright test playwright/tests/auth-signout.spec.ts
```

## 05a-followup 側 M-08 更新ルール

- `docs/30-workflows/completed-tasks/ut-05a-followup-google-oauth-completion/` 配下
  Phase 11 の M-08 行を `blocked` から `completed` または `linked` に更新する場合、
  本タスク evidence への参照リンクを記載する
- 更新は workflow 整合性の責任で別タスク化する余地があるため、本タスク Phase 12 で判断

## 多角的チェック観点

- placeholder のままで PASS にしない
- session token / OAuth token を artifact / log に保存しない
- redaction checklist 不合格時は再取得

## サブタスク管理

- [ ] user から実装着手 / 実 smoke 実行の明示指示を得る
- [ ] OAuth login → sign-out → `/login` redirect の一連を実行
- [ ] redaction checklist を完了
- [ ] 05a-followup M-08 へのリンク更新方針を決定
- [ ] outputs/phase-11/main.md を作成する

## 成果物

- 上記「必須 evidence path」一式

## 完了条件

- AC-1〜AC-5 がそれぞれ PASS / FAIL いずれかで判定済み
- redaction checklist PASS
- 05a-followup M-08 への連携方針が決まっている

## タスク100%実行確認

- [ ] PII / token 漏洩がゼロ
- [ ] AC ごとに evidence path が実在
- [ ] Auth.js endpoint / middleware を変更していない

## 次 Phase への引き渡し

Phase 12 へ、実測 evidence と 05a-followup M-08 連携方針を渡す。
