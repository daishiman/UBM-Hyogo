# Implementation Guide

## Part 1: 中学生レベル

なぜ必要か。公開ページにメールアドレスが出てしまったり、マイページで出した申請中の表示が次に開いた時に消えたりすると、利用者は安心して使えない。たとえば学校で、掲示板に出してはいけない連絡先が貼られたり、先生に出した申請書が次の日に見つからなくなったりするのと同じです。

何をするか。Stage 1 では、公開ページにメールらしい文字が出ていないこと、公開停止申請と退会申請の「受付中」表示がページを移動して戻っても残ることを、既存の Playwright テストで確かめます。

| 用語 | 言い換え |
| --- | --- |
| Playwright | ブラウザを自動で動かす確認係 |
| assertion | 「こうなっているはず」という確認 |
| DOM | 画面に出ている部品の集まり |
| pending banner | 申請が受付中だと知らせる表示 |
| fixture | テストで使う決まった練習用データ |

### 今回作ったもの

- 公開ページにメールアドレスが出ていないか確認するチェック。
- 申請中の表示がページ移動後も残るか確認するチェック。
- localhost 用のログイン cookie 名の修正。

## Part 2: 技術者レベル

### Target Specs

- `apps/web/playwright/tests/public-flow.spec.ts`
- `apps/web/playwright/tests/profile-visibility-request.spec.ts`
- `apps/web/playwright/tests/profile-delete-request.spec.ts`

```ts
type Stage1PendingType = "visibility_request" | "delete_request";

interface Stage1PendingAssertion {
  readonly type: Stage1PendingType;
  readonly selector: `[data-pending-type=${Stage1PendingType}]`;
  readonly route: "/api/me/visibility-request" | "/api/me/delete-request";
}
```

### CLIシグネチャ

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/public-flow.spec.ts playwright/tests/profile-visibility-request.spec.ts playwright/tests/profile-delete-request.spec.ts
```

### Assertions

- `public-flow.spec.ts`
  - `LEAK_PROBE_EMAIL = "system+responseEmail@example.test"`
  - `/`, `/members`, `/members/m-1` の body に probe email が存在しないこと。
  - email-like regex (`/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i`) が body に存在しないこと。
- `profile-visibility-request.spec.ts`
  - `POST /api/me/visibility-request` を 202 mock。
  - `GET /api/me/profile` browser route mock に `pendingRequests.visibility` を含める。
  - submit 後と `/` round-trip 後の両方で `[data-pending-type=visibility_request]` を assert。
- `profile-delete-request.spec.ts`
  - `POST /api/me/delete-request` を 202 mock。
  - `GET /api/me/profile` browser route mock に `pendingRequests.delete` を含める。
  - submit 後と `/` round-trip 後の両方で `[data-pending-type=delete_request]` を assert。

### 使用例

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/public-flow.spec.ts playwright/tests/profile-visibility-request.spec.ts playwright/tests/profile-delete-request.spec.ts
```

### エラーハンドリング

- Email leak assertion intentionally checks both a known probe value and any email-like string to reduce false negatives.
- Pending round-trip tests keep the POST mock and profile pending mock separate so optimistic UI alone is not enough to satisfy the second assertion.
- Phase 13 remains `pending_user_approval`; commit, push, and PR creation are outside this cycle.

### エッジケース

- `authjs.session-token` is used for localhost because `__Secure-authjs.session-token` is rejected over HTTP.
- Full E2E still requires the backend/API runtime; the current run records the blocker in Phase 11 evidence instead of claiming a false PASS.
- `public-flow` desktop still includes an existing axe contrast failure unrelated to the Stage 1 email leak assertion.

### 設定項目と定数一覧

| Constant | Value |
| --- | --- |
| E2E line threshold | `>= 80%` |
| visualEvidence | `NON_VISUAL` |
| coverageTier | `standard` |

### テスト構成

| Layer | Command / Evidence |
| --- | --- |
| Typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` |
| E2E inventory | `outputs/phase-11/evidence/e2e-list.txt` |
| E2E run | `outputs/phase-11/evidence/e2e-run.txt` |
| Screenshot: visibility pending | `outputs/phase-11/screenshots/visibility-pending.png` |
| Screenshot: delete pending | `outputs/phase-11/screenshots/delete-pending.png` |
| Skip count | `outputs/phase-11/evidence/e2e-skip-count.txt` |
