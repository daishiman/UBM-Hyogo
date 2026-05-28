# task-A: API 404 root cause + Web 層エラー細分化

[実装区分: 実装仕様書]
[判定根拠: ラベル指定無し。staging で `/admin/tags/queue` が 404 を返す現象を再現可能な形で原因切り分けし、Web 層に永続的な復旧ヒント表示を入れるため、コード変更が必須]

## 目的

`GET /admin/tags/queue` 404 の原因を、エンドユーザー（管理者）にとって**復旧アクションが取れる形**で識別可能にする。再発時に「どこを直せばよいか」が UI から特定できる状態にする。

## 変更対象ファイル

| パス | 種別 | 変更概要 |
|------|------|---------|
| `apps/web/src/lib/admin/server-fetch.ts` | edit | `res.ok === false && process.env.NODE_ENV !== "production"` 時に `console.warn` で `host of INTERNAL_API_BASE_URL` と `path` と `status` を出す。secret や cookie は出さない |
| `apps/web/src/features/admin/components/_shared/AdminSectionErrorClient.tsx`（実体ファイルを実装エージェントが grep で特定） | edit | props に `code` が既に渡る。`code` ごとに復旧ヒント `<p>` を分岐表示する |
| `apps/web/app/(admin)/admin/tags/page.tsx` | edit | `result.error.code` を `AdminSectionErrorClient` へ確実に渡す（既に渡っている。挙動確認のみ） |
| `apps/web/src/lib/admin/__tests__/server-fetch.spec.ts`（無ければ新規） | new/edit | `res.status===404` のときに dev だけ warn する単体テスト 1 ケース |
| `apps/web/src/features/admin/components/_shared/__tests__/AdminSectionErrorClient.spec.tsx`（実体パスを grep で特定） | edit | code=`ADMIN_FETCH_401` / `_403` / `_404` / `_500` の 4 ケース表示分岐テスト |

## 関数シグネチャ / 構造

### `AdminSectionErrorClient` 表示分岐

```ts
type RecoveryHint = { title: string; body: string };

const HINT_BY_CODE: Record<string, RecoveryHint> = {
  ADMIN_FETCH_401: {
    title: "セッションが切れています",
    body: "右上の「ログアウト」から再ログインしてください。",
  },
  ADMIN_FETCH_403: {
    title: "権限がありません",
    body: "管理者アカウントでログインしてください。",
  },
  ADMIN_FETCH_404: {
    title: "API に到達できません",
    body: "INTERNAL_API_BASE_URL の設定、または apps/api の最新デプロイをご確認ください。",
  },
  ADMIN_FETCH_500: {
    title: "サーバー設定エラー",
    body: "AUTH_SECRET / 環境変数の設定をご確認ください。",
  },
};

function resolveHint(code: string): RecoveryHint | null {
  if (HINT_BY_CODE[code]) return HINT_BY_CODE[code];
  if (/^ADMIN_FETCH_5\d\d$/.test(code)) return HINT_BY_CODE.ADMIN_FETCH_500!;
  return null;
}
```

表示要素:

```tsx
<div role="alert" aria-live="polite">
  <h2>{sectionLabel} の読み込みに失敗しました</h2>
  <p className="muted">{message}</p>
  <p className="mono small">code <code>{code}</code></p>
  {hint && (
    <div className="card-flat">
      <strong>{hint.title}</strong>
      <p>{hint.body}</p>
    </div>
  )}
  {/* 既存の再読み込み CTA は維持 */}
</div>
```

### `server-fetch.ts` dev-only debug

```ts
if (!res.ok) {
  if (
    process.env["NODE_ENV"] !== "production" &&
    res.status === 404
  ) {
    let host = "<unknown>";
    try { host = new URL(resolveApiBase()).host; } catch {}
    console.warn(`[admin/server-fetch] 404`, { host, path, status: 404 });
  }
  throw new Error(`admin api ${path} failed: ${res.status}`);
}
```

> credentials / cookie / `x-internal-auth` は絶対に出力しない（CLAUDE.md セキュリティ規約）。

## 入力 / 出力 / 副作用

- 入力: 既存 `fetchAdmin<T>(path, opts)` のシグネチャ不変
- 出力: 既存通り（成功時 `T`、失敗時 throw）
- 副作用: dev / staging で 404 時に `console.warn` を 1 行出すのみ

## テスト方針

新規 / 拡張テスト:

1. `AdminSectionErrorClient.spec.tsx` — `code` が `ADMIN_FETCH_401 | 403 | 404 | 500` のとき、それぞれ対応するヒント文の `strong` テキストが render される（4 it ブロック）
2. `server-fetch.spec.ts` — `res.status===404 && NODE_ENV!=="production"` で `console.warn` 1 回呼ばれる、production では呼ばれない（vi.spyOn）

## ローカル実行 / 検証コマンド

```bash
mise exec -- pnpm --filter web test -- AdminSectionErrorClient
mise exec -- pnpm --filter web test -- server-fetch
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## DoD

- 上記 2 spec が green
- typecheck / lint green
- `apps/web/src/components/admin/__tests__/TagQueuePanel.component.spec.tsx` 既存 8 ケースが破壊されていない
- 手動: dev で `INTERNAL_API_BASE_URL` を意図的にゴミ値に変更すると `[admin/server-fetch] 404` が console に出ること
