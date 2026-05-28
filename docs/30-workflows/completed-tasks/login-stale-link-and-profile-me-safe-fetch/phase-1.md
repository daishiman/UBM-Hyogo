# Phase 1: 要件定義

[実装区分: 実装仕様書]

## P50 前提確認

| 項目 | 結果 |
|------|------|
| current branch に実装が存在する | NO（新規実装） |
| upstream にマージ済み | NO |
| 前提タスク完了済み | YES（profile-server-components-render-error 完了済、ただし `/me` 取得は未保護） |

`implementation_mode`: `"new"`（部分的に `/me/profile` の safeServerFetch 化が完了済だが、`/me` 取得には未適用）

## 受入条件

### AC-1: `/[object Object]` 404 を消滅させる
- staging 上で /login をロードした際の Network ログに `/[object%20Object]` リクエストが現れない。
- 該当のコード経路（リンク／画像 src／router.push）は **type 上 object を受け付けない** か、文字列強制 + 型ガード経由で `[object Object]` に coerce されない構造にする。
- 該当箇所を特定後、回帰用 vitest spec で「string ではない値が渡ったときに `[object Object]` が href / src に出力されない」を assert する。

### AC-2: `/profile` Server Components render error の解消
- `apps/web/app/(member)/profile/page.tsx` 内の `fetchAuthed<MeSessionResponse>("/me")` を `safeServerFetch` でラップする。
- `AuthRequiredError` は従来通り `/login?redirect=/profile` へ redirect。
- 5xx / network / FetchAuthedError は `SectionError` で UI 降下（throw しない）。
- error.tsx の digest 表示は維持（既存仕様）。

### AC-3: 回帰テスト
- 上記2点に対応する vitest spec が `apps/web/app/(member)/profile/__tests__/` および調査結果に応じた箇所に追加され、`pnpm --filter @ubm-hyogo/web test` で green。

### AC-4: PR ready
- `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` が green。

## スコープ外（先送り不可、本サイクル内で完了）

- なし（CONST_007: すべて本サイクル内で完了させる）

## inventory（既存コード命名規則）

- env 公開アクセサ: `getEnv()` / `getPublicEnv()` / `getAuthEnv()` / `getPublicFetchEnv()`
- server fetch wrapper: `safeServerFetch(thunk, { codePrefix, rethrowOn })`
- error class: `AuthRequiredError`, `FetchAuthedError`
- error code prefix 既存例: `MEMBER_FETCH`, `ADMIN_FETCH`, `SERVER_FETCH`

## 関連既存ファイル

| パス | 役割 |
|------|------|
| `apps/web/app/(member)/profile/page.tsx` | Server Component（修正対象） |
| `apps/web/src/lib/fetch/authed.ts` | fetchAuthed 実装 |
| `apps/web/src/lib/server-fetch/safe-fetch.ts` | safeServerFetch 実装 |
| `apps/web/src/lib/fetch/errors.ts` | AuthRequiredError / FetchAuthedError |
| `apps/web/app/(member)/profile/error.tsx` | error boundary（参照のみ） |
| `apps/web/app/login/page.tsx` 配下 | `[object Object]` 調査起点 |

## carry-over 確認

`git log --oneline -5` の `04c569a48 feat(auth): login UI バランス調整と internal API env accessor 統一 (#965)` で env accessor 統一が入っている。`/me/profile` の safeServerFetch 化はこの直前の完了 workflow（memory 参照）で実施済。今 task の追加点は **bare `/me` fetch** と **`[object Object]` link**。
