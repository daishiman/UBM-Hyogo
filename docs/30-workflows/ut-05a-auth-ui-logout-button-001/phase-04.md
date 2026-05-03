[実装区分: 実装仕様書]

# Phase 4: テスト戦略 — ut-05a-auth-ui-logout-button-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-auth-ui-logout-button-001 |
| phase | 4 / 13 |
| wave | Wave 5 follow-up |
| mode | parallel |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

`SignOutButton` の単体テスト・統合テスト・E2E・手動 smoke の役割分担を確定し、
AC-1〜AC-5 が必ずいずれかの Layer で検証可能になるテスト戦略を確定する。

## 実行タスク

1. `SignOutButton` の unit test で `signOut({ redirectTo: "/login" })` を検証する。
2. `/profile` と `/admin` の両方を E2E / manual smoke の対象 URL にする。
3. Phase 11 の screenshot / session / cookie evidence path と AC を対応付ける。
4. 認証済 storage state が無い場合の runtime evidence blocked 境界を記録する。

## 参照資料

- apps/web/src/components/auth/SignOutButton.tsx
- apps/web/app/profile/page.tsx
- apps/web/src/components/layout/AdminSidebar.tsx
- apps/web/playwright/tests/

## テスト戦略

### Layer 1: Unit (Vitest)

- 対象 AC: AC-2（`signOut` 呼び出し）の関数呼び出し確認
- ファイル: `apps/web/src/components/auth/__tests__/SignOutButton.test.tsx`
- ケース:
  - レンダリング時に "ログアウト" ラベルが表示される
  - クリックで `signOut` が `{ redirectTo: "/login" }` 引数で呼ばれる
  - `signOut` 実行中は `disabled` になり多重押下されない
  - `label` / `redirectTo` props が反映される
- mock: `next-auth/react` の `signOut` を `vi.mock` でスタブする

### Layer 2: Integration (Vitest, RTL)

- 対象 AC: AC-1（layout レンダリング時に sign-out ボタンが描画される）
- 確認: `(member)` layout / `AdminSidebar` のレンダリングテスト（既存テストがあれば拡張、無ければ別途新設は本タスクで行わない）

### Layer 3: E2E / 手動 smoke

- 対象 AC: AC-1 / AC-2 / AC-3 / AC-4 / AC-5 を一気通貫で検証
- 実行形態: 認証済 storage state がある場合のみ Playwright spec を追加して実行する。今回サイクルでは手動 smoke 手順を Phase 11 に実体化し、runtime blocked として扱う
- 前提: 認証済 storage state（既存 Playwright scaffold で提供されている前提。
  未提供時は手動 smoke にフォールバック）
- フロー:
  1. 認証済 state で `/profile` または `/admin` にアクセス
  2. `data-testid="sign-out-button"` を click
  3. `/login` への redirect を待機
  4. `/api/auth/session` を fetch して body が `{}` 相当 (未認証) を確認
  5. `/profile` を再アクセスし `/login` redirect を確認
  6. session cookie が削除されていることを `context.cookies()` で確認

### Layer 4: 手動 smoke（VISUAL_ON_EXECUTION）

- 対象 AC: 全 AC の最終確認 + screenshot evidence 取得
- 取得物（Phase 11 で実体化）:
  - `outputs/phase-11/screenshots/before-signout-profile.png`（ログイン状態の `/profile` または `/admin`）
  - `outputs/phase-11/screenshots/after-signout.png`（`/login` 遷移後）
  - `outputs/phase-11/session-after.json`（`/api/auth/session` の body）
  - `outputs/phase-11/cookies-after.json`（cookie 削除確認、token 値は redaction）

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter web typecheck
mise exec -- pnpm --filter web lint
mise exec -- pnpm --filter web test -- src/components/auth/__tests__/SignOutButton.test.tsx
# optional after authenticated storage state is available:
# mise exec -- pnpm --filter web exec playwright test playwright/tests/auth-signout.spec.ts
```

## 統合テスト連携

- 08b Playwright scaffold が認証済 storage state を提供しているか前提確認
- 認証済 state が無い場合、E2E は手動 smoke fallback に切替

## 多角的チェック観点

- happy path だけで PASS にしない（cookie 削除確認まで含める）
- session token / 個人情報を screenshot に redact する
- `signOut` 失敗時のテスト（Phase 6 異常系）も Layer 1 でカバーする

## サブタスク管理

- [ ] 各 AC に Layer を割り当てる
- [ ] テストファイルパスを確定する
- [ ] mock 戦略（`vi.mock("next-auth/react")`）を確定する
- [ ] 認証済 storage state の提供状況を確認する
- [ ] outputs/phase-04/main.md を作成する

## 成果物

- outputs/phase-04/main.md

## 完了条件

- AC-1〜AC-5 が Layer 1〜4 のいずれかで検証可能
- テスト追加ファイルパスが確定
- 取得不能時の fallback が明記されている

## タスク100%実行確認

- [ ] AC ↔ Layer の割当に漏れがない
- [ ] mock / E2E / 手動の役割分担が明確
- [ ] redaction ルールが含まれている

## 次 Phase への引き渡し

Phase 5 へ、AC ↔ Layer 割当、テストファイルパス、ローカル実行コマンドを渡す。
