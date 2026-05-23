# Implementation Guide

## Part 1: 中学生レベルの概念説明

学校の入口に先生が立っていて、「この教室に入っていい人かな」と先に確認する場面を考える。今のWebアプリでは、その入口係の名前が昔の呼び方のまま残っている。動きは同じでも、学校全体の新しい案内板では別の名前に変わったので、案内板と入口係の名前をそろえる必要がある。

今回やることは、入口係の仕事を変えることではない。`/admin` は管理者だけ、`/profile` はログイン済みの人だけ、というルールをそのまま守る。変えるのはファイル名と関数名だけで、利用者から見える動きは同じにする。

専門用語の言い換え:

| 用語 | 日常語の言い換え |
|---|---|
| middleware | ページに入る前の入口係 |
| proxy | 新しい名前の入口係 |
| redirect | 別の場所へ案内すること |
| cookie | ログイン済みかを示す入館証 |
| JWT | 入館証の中身を改ざんされていないか確かめられる印 |

## Part 2: 技術者向け実装詳細

実装対象は `apps/web/middleware.ts` から `apps/web/proxy.ts` への rename と、named/default export の `middleware` から `proxy` への変更に限定する。`SESSION_COOKIE_NAMES`、`decodeAuthSessionJwt`、`config.matcher` は既存値を保持する。

対象 API シグネチャ:

```ts
export async function proxy(req: NextRequest): Promise<NextResponse>
export default proxy
export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
}
```

自動テストは `apps/web/__tests__/proxy.spec.ts` に配置し、`@ubm-hyogo/shared` の `signSessionJwt` と `asMemberId` で valid session cookie を生成する。未ログイン admin/profile、認証済 non-admin、認証済 admin、profile query preservation、matcher の全7ケースを必須にする。

エッジケースは、cookie 不在、`isAdmin=false`、`isAdmin=true`、`/profile/edit?tab=tags` の query 付き redirect、実装側 stale `middleware.ts` 参照である。`NextResponse.redirect(url)` の既定 status は 307 なので、仕様・テスト・手動 evidence の期待値を 307 に統一する。

検証コマンド:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- proxy.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build
test ! -e apps/web/middleware.ts
rg -n "middleware\\.ts" apps/web --glob '!middleware.ts' --glob '!*.log'
```
