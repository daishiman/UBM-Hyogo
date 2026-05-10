# Phase 7: 統合テスト — task-13-login-rebuild

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-13-login-rebuild |
| phase | 7 / 13 |
| wave | w5-par |
| mode | parallel |
| 作成日 | 2026-05-09 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

`/login` から既存 API（`/api/auth/magic-link` / `[...nextauth]` / `gate-state`）への接続経路と、URL query 駆動の state 確定が SSR で機能することを統合的に確認する。本 Phase は API surface 不変条件の最終ゲートでもある。

## 実行タスク

1. `apps/web/app/api/auth/*` 配下の git diff が 0 であることを確認する。
2. `gate-state` proxy 経由で `apps/api` の `/auth/session-resolve` を叩いていることを確認する（fetch は web→api 経由のみ、D1 直叩きなし）。
3. Magic Link 成功 / 失敗 / gate-state non-active の 3 経路を `MSW` または fetch mock で組み合わせ、`router.replace` が期待 URL に遷移することを確認する。
4. Auth.js Google OAuth の signIn 呼び出しが `callbackUrl=redirect` で実行されることを確認する。

## テストケース表

| シナリオ | mock | 期待 |
|---------|------|------|
| magic-link 200 + gate-state active | `magic-link → 200`, `gate-state → active` | `?state=sent&email=` に遷移 |
| magic-link 200 + gate-state unregistered | `gate-state → unregistered` | `?state=unregistered` に遷移（magic-link 結果を待たない） |
| magic-link 200 + gate-state deleted | `gate-state → deleted` | `?state=deleted` |
| magic-link 200 + gate-state rules_declined | `gate-state → rules_declined` | `?state=rules_declined&formUrl=...` |
| magic-link 500 + gate-state active | `magic-link → 500` | `?state=error&error=...` |
| Google OAuth click | `signIn` mock | `signIn("google", { callbackUrl: "/profile" })` 1 回 |
| redirect=/admin の保持 | `?redirect=%2Fadmin` で submit | 遷移先 URL に `redirect=%2Fadmin` が保持 |

## 参照資料

- 出典タスク §6（データフロー）, §12（API surface）
- apps/api/src/routes/auth/session-resolve.ts（参照のみ）
- Phase 5 実装結果

## 依存 Phase 成果物参照

- Phase 5: 実装ログ
- Phase 6: 単体テスト green

## 実行手順

```bash
# fetch mock + react-testing-library で integration スタイルに記述
mise exec -- pnpm --filter @ubm-hyogo/web test -- login-integration
# diff 確認
git diff --stat -- apps/web/app/api/auth/
```

## 多角的チェック観点

- D1 binding を `apps/web` から直接参照していない（grep gate）
- `Promise.all([magic-link, gate-state])` の race condition を test で再現
- redirect の open redirect 防止を integration でも検証

## 統合テスト連携

- Phase 7 は Phase 6 unit test で固定した `router.replace` 結果を、magic-link / gate-state の組み合わせで再検証する。
- Phase 9 smoke に渡す URL query 仕様（`state`, `redirect`, `email`, `error`, `gate`）を実 API surface 不変のまま確認する。
- `apps/web/app/api/auth/*` の diff 0 と D1 直叩きなし grep を Phase 10 gate に引き渡す。

## サブタスク管理

- [ ] integration test ファイル作成（または既存 spec に追記）
- [ ] 7 シナリオ × pass
- [ ] git diff -- apps/web/app/api/auth/ が 0
- [ ] grep -r 'D1Database' apps/web/src apps/web/app が既存範囲を超えない

## 成果物

- 統合テストファイル（場所は repo 慣例に合わせる：`apps/web/__tests__/login-integration.test.tsx` 等）
- outputs/phase-07/main.md（実行ログ + git diff stat）

## 完了条件

- [ ] 7 シナリオすべて green
- [ ] api/auth diff 0
- [ ] D1 直叩きなし
- [ ] redirect 保持確認

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] commit / push / PR は実行していない

## 次 Phase への引き渡し

Phase 8（a11y）へ、render 結果を渡す。
