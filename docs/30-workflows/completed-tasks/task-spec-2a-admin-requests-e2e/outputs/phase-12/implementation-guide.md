# Implementation Guide

## Part 1: 中学生レベル

なぜ必要か。管理者が申請を承認したり却下したりする画面は、間違えると会員の状態がずれます。たとえば教室で先生が提出物にハンコを押すとき、同じ提出物に二回ハンコを押したら名簿が混乱します。この画面も同じで、「もう処理済み」と分かる必要があります。

何をするか。ブラウザを自動で動かす道具を使い、管理者・普通の会員・未ログインの人として `/admin/requests` を開きます。本物のサーバーには触らず、練習用の返事を返して、画面が正しく反応するかを確認します。

### 今回作ったもの

| 作ったもの | 説明 |
|------|------|
| 2a 仕様書 | `/admin/requests` の確認手順 |
| 対象ファイル定義 | `apps/web/playwright/tests/admin-requests.spec.ts` |
| mock 方針 | 本物の API の代わりに練習用の返事を返す方針 |
| race 確認 | 同じ承認を既に処理済みの依頼を押したときの確認 |
| 認可確認 | 管理者だけが画面を使えることの確認 |

| 用語 | 言い換え |
|------|---------|
| Playwright | ブラウザを自動で動かす道具 |
| spec | 確認手順を書いたファイル |
| mock | 本物の代わりに返す練習用の返事 |
| approve | OK にする |
| reject | 理由を書いて断る |

## Part 2: 開発者向け

### TypeScript 型定義

```ts
type AdminRequestItem = {
  noteId: string;
  memberId: string;
  noteType: "visibility_request" | "delete_request";
  requestStatus: "pending";
  requestedAt: string;
  requestedReason: string | null;
  requestedPayload: { desiredState?: string } | null;
};

type ResolveRequestBody =
  | { resolution: "approve" }
  | { resolution: "reject"; resolutionNote: string };
```

### APIシグネチャ

```ts
validateAdminRequestResolve(body: ResolveRequestBody): ResolveRequestBody;
```

| API | 用途 |
|-----|------|
| `GET /admin/requests` | pending request list mock |
| `POST /admin/requests/:noteId/resolve` | approve / reject / race mock |

### 使用例

```ts
await adminPage.route("**/admin/requests/*/resolve", async (route) => {
  const body = route.request().postDataJSON() as ResolveRequestBody;
  validateAdminRequestResolve(body);
  return route.fulfill({
    status: 200,
    json: { noteId: "req_001", requestStatus: "resolved" },
  });
});
```

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts
```

### エラーハンドリング

- `approve` の二回目は `409 already_resolved` を返す。
- `reject` の理由が空なら inline error を表示し、POST しない。
- member は `/login?gate=admin_required` redirect とする。
- anonymous は `/login` redirect とする。

### エッジケース

- `test.skip` は 0 件。
- D1 / Google API / filesystem へ直接アクセスしない。
- `page.route()` の counter は test scope の closure に閉じる。
- `mergedMemberId` など Stage 2 で禁止した fixture key を使わない。

### 設定項目と定数一覧

| 定数 | 値 |
|------|----|
| Target spec | `apps/web/playwright/tests/admin-requests.spec.ts` |
| GET pattern | `**/admin/requests*` |
| SSR fixture guard | `PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE=1` + `NODE_ENV !== "production"` |
| POST pattern | `**/api/admin/requests/*/resolve` |
| Expected tests | 6 |
| Expected skips | 0 |
| visualEvidence | `NON_VISUAL` |

### テスト構成

| # | case | fixture |
|---|------|---------|
| 1 | pending list 表示 | `adminPage` |
| 2 | approve success | `adminPage` |
| 3 | reject + reason required | `adminPage` |
| 4 | double approve race 409 | `adminPage` |
| 5 | member boundary | `memberPage` |
| 6 | anonymous redirect | `anonymousPage` |
