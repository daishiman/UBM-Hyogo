# Phase 9: E2E smoke（Playwright） — task-13-login-rebuild

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-13-login-rebuild |
| phase | 9 / 13 |
| wave | w5-par |
| mode | sequential |
| 作成日 | 2026-05-09 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

`apps/web/playwright/tests/login-smoke.spec.ts` に 5 core states の smoke ケースを append し、derived `rules_declined` と `gate=admin_required` は追加ケースとして `data-state` 属性で状態確定を assert する。各ケースは `outputs/phase-11/login-*.png` へ screenshot を保存し、task-18 の Playwright + verify-design-tokens gate に渡せる状態にする。

## 実行タスク

1. `apps/web/playwright/tests/login-smoke.spec.ts` を新規作成（または task-18 が既存準備していれば追記）。
2. 5 core states URL を順番に開き、`getByTestId('login-card').toHaveAttribute('data-state', '<state>')` で状態確定を assert する。
3. screenshot 比較は採用しない（OS 差分回避）。代わりに DOM テキスト / role / link で assert する。
4. CI で安定実行できるよう、`playwright.config.ts` の baseURL に応じた相対 URL を使う。

## テストケース表（出典 §7.3）

| ケース | URL | 主要 assert |
|--------|-----|-------------|
| input | `/login` | h1 "ログイン" 表示 / `input[type=email]` 存在 / Google button 存在 / `data-state="input"` |
| sent | `/login?state=sent&email=a%40b.com` | "メールを送信しました" 表示 / `data-state="sent"` |
| unregistered | `/login?state=unregistered` | warn Banner 存在 / `/register` link / `data-state="unregistered"` |
| deleted | `/login?state=deleted` | `role=alert` / 管理者問い合わせ文言 / `data-state="deleted"` |
| error | `/login?state=error&error=送信失敗` | `role=alert` / "送信失敗" 文字列 / `data-state="error"` |
| rules_declined（derived） | `/login?state=rules_declined` | `role=alert` / 外部 form link / `data-state="rules_declined"` |
| gate=admin_required | `/login?gate=admin_required` | input 状態 + warn Banner "管理者権限が必要" |

## 参照資料

- 出典タスク §7.3, §0.7（task-18 へ渡す契約）
- Phase 5 実装結果
- Phase 8 a11y 結果

## 依存 Phase 成果物参照

- Phase 5〜8

## 実行手順

```bash
# Playwright インストール（初回のみ）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps

# E2E smoke 実行
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- login-smoke
```

## 多角的チェック観点

- baseURL は `playwright.config.ts` の既定（dev or staging）に従う
- toHaveScreenshot は使わない（OS 差分）
- 全 spec が `await page.goto(url)` → `await expect(...).toHaveAttribute(...)` の形に揃う
- network mock は不要（gate-state は dev D1 で空応答 OK）

## 統合テスト連携

- Phase 9 は Phase 3 の locator contract（`data-testid="login-card"` + `data-state`）を唯一の状態 assert とする。
- Phase 8 の role contract を E2E でも再確認し、`rules_declined` は alert として扱う。
- task-18 regression smoke はこの spec を downstream gate とし、screenshot diff ではなく DOM / role / token grep へ接続する。

## サブタスク管理

- [ ] login-smoke.spec.ts に 5 ケース append（rules_declined / gate は任意）
- [ ] CI で 5 ケース green
- [ ] 各ケースで `data-state` 属性 assert
- [ ] screenshot diff 採用しないことを spec コメントで明記

## 成果物

- `apps/web/playwright/tests/login-smoke.spec.ts`（追記または新規）
- outputs/phase-09/main.md（Playwright HTML report path）

## 完了条件

- [ ] 5 状態 smoke が green（任意 2 ケース含めて 7 でもよい）
- [ ] task-18 で `verify-design-tokens` HEX 0 を維持
- [ ] flaky run 0（連続 3 回 green）

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] commit / push / PR は実行していない

## 次 Phase への引き渡し

Phase 10（tokens / lint gate）へ、Playwright green を渡す。
