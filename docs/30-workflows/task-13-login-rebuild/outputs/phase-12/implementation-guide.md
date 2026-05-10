# Implementation Guide: task-13-login-rebuild

## Part 1: 中学生レベル

### なぜ必要か

ログイン画面は、たとえば学校の受付のような場所です。受付が「入っていいです」「先に手続きが必要です」「今は入れません」を分かりやすく伝えないと、来た人は次に何をすればよいか迷います。今回の仕様は、ログイン画面をその受付のように分かりやすく作り直すための設計図です。

### 何をするか

`/login` 画面を、URL に書かれた状態を見て表示を切り替えるカード型の画面にします。普通の入力画面、メール送信後、未登録、退会済み、エラーの 5 つを基本状態にし、利用規約に同意していない場合は追加の派生状態として扱います。

### 今回作ったもの

今回は設計図だけで止めず、実際のログイン画面、テストで探す目印、注意して知らせる表示、あとで確認する手順をそろえました。公開環境での確認と PR 作成は、次にユーザーが実行を許可した後に行います。

### ユーザーから見て変わること

| 状態 | 体験 |
| --- | --- |
| input | メール入力、Google ログイン、登録ページへの導線が見える |
| sent | メールを送ったことと次に見る場所が分かる |
| unregistered | 登録が必要なことと登録ページへの道筋が分かる |
| deleted | 退会済みであることと問い合わせ先が分かる |
| error | 失敗理由と再試行できることが分かる |
| rules_declined | 利用規約の同意が必要なことが強く通知される |

### 専門用語セルフチェック

| 用語 | 日常語での言い換え |
| --- | --- |
| URL query | 住所の後ろに付く小さなメモ |
| state | 今どの案内を出すかを示す合図 |
| Auth.js | ログインの番人をする仕組み |
| Magic Link | メールで届く特別な入場リンク |
| OKLch token | 色を決めるための名前付き絵の具 |
| role=alert | 読み上げ機能へ急いで知らせる札 |

## Part 2: 技術者レベル

### TypeScript Contract

```ts
export type LoginGateState =
  | "input"
  | "sent"
  | "unregistered"
  | "deleted"
  | "rules_declined"
  | "error";

export interface LoginCardProps {
  readonly state: LoginGateState;
  readonly title: string;
  readonly subtitle?: string;
  readonly footerSlot?: React.ReactNode;
  readonly children: React.ReactNode;
}

export interface LoginStatusProps {
  readonly state: Exclude<LoginGateState, "input">;
  readonly email?: string;
  readonly error?: string;
  readonly formUrl?: string;
}

export interface LoginPanelProps {
  readonly state: LoginGateState;
  readonly redirect: string;
  readonly email?: string;
  readonly error?: string;
  readonly gate?: "admin_required";
  readonly formUrl?: string;
}
```

### APIシグネチャ

```ts
parseLoginQuery(searchParams: URLSearchParams): {
  state: LoginGateState;
  redirect: string;
  email?: string;
  error?: string;
  gate?: "admin_required";
}

submitMagicLink(email: string, redirect: string): Promise<void>
signIn("google", { callbackUrl: redirect })
```

### 使用例

```tsx
const query = parseLoginQuery(searchParams);

return (
  <LoginCard state={query.state} title="ログイン">
    <LoginPanel {...query} />
  </LoginCard>
);
```

### エラーハンドリング

Magic Link が失敗した場合は `state=error` に遷移し、画面は `role="alert"` で失敗理由を表示します。未知の `state` は `input` に戻し、外部 URL の `redirect` は `/profile` に丸めます。Auth.js route は変更せず、既存 API の失敗を UI state に変換します。

### エッジケース

| Case | Handling |
| --- | --- |
| unknown `state` | fallback to `input` |
| external `redirect` | fallback to `/profile` |
| long `error` message | truncate to 200 characters |
| `rules_declined` | render `role="alert"` |
| Auth.js route | do not change `apps/web/app/api/auth/*` |
| D1 access | do not import or bind D1 from `apps/web` |

### 設定項目と定数一覧

| Item | Value |
| --- | --- |
| locator | `data-testid="login-card"` |
| state attribute | `data-state="<LoginGateState>"` |
| error max length | 200 |
| redirect fallback | `/profile` |
| package filter | `@ubm-hyogo/web` |
| visual evidence | `outputs/phase-11/login-*.png` |
| token gate | `pnpm --filter @ubm-hyogo/web verify-design-tokens` |

### テスト構成

| Layer | Command / Evidence |
| --- | --- |
| unit | `pnpm --filter @ubm-hyogo/web test -- LoginPanel` |
| integration | `pnpm --filter @ubm-hyogo/web test -- login-integration` |
| a11y | `pnpm --filter @ubm-hyogo/web test -- a11y` |
| e2e | `pnpm --filter @ubm-hyogo/web test:e2e -- login-smoke` |
| token | `pnpm --filter @ubm-hyogo/web verify-design-tokens` |

---

## 実装サイクル追記（2026-05-09）

### 実コード反映

| 種別 | パス |
| --- | --- |
| M | `apps/web/src/lib/url/login-query.ts` (`error` を `LOGIN_GATE_STATES` に追加 / `error` query を 200 文字に切り詰め) |
| A | `apps/web/app/login/_components/LoginCard.tsx` |
| A | `apps/web/app/login/_components/LoginStatus.tsx` |
| M | `apps/web/app/login/_components/LoginPanel.client.tsx` (rebuild、6 状態を input + LoginStatus に分岐) |
| M | `apps/web/app/login/page.tsx` (`<LoginCard>` で wrap、TITLES map で title/subtitle を切替) |
| A | `apps/web/app/login/_components/__tests__/LoginCard.test.tsx` (5 cases) |
| A | `apps/web/app/login/_components/__tests__/LoginPanel.test.tsx` (7 cases) |
| M | `apps/web/src/lib/url/login-query.test.ts` (+2 cases: state=error / 200 文字超過 truncate) |
| A | `apps/web/playwright/tests/login-smoke.spec.ts` |
| M | `apps/web/package.json` (`verify-design-tokens` script 追加) |

### Gate 結果

- typecheck: green
- lint: green
- focused vitest: 5 files / 41 tests passed
- full web vitest: 68 files / 510 tests passed, 1 skipped
- `verify-design-tokens`: 1 file / 9 tests passed
- Playwright login smoke: desktop Chromium 7/7 passed
- HEX 直書き grep（`apps/web/app/login`）: 0 件
- `apps/web/app/api/auth/*` diff: 0

### 残る runtime evidence

- local Playwright screenshot は `outputs/phase-11/login-*.png` に保存済み。staging smoke / production-equivalent runtime evidence は user approval 後に実施。
