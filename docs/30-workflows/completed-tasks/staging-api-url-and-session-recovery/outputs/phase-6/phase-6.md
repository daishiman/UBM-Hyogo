# Phase 6: テスト拡充（fail path / 回帰ガード）

## 目的

Phase 4 の happy-path に加え、**失敗経路（fail-closed）と回帰ガード**を追加し、
今回の根本原因（loopback 404 / localhost fallback / search 欠落 / cookie 欠落）が
再発したら必ず落ちる安全網を作る。新規テストファイルは作らず Phase 4 spec へ追記する。

> 対象 spec: `transport.spec.ts` / `authed.spec.ts` / `me route.route.spec.ts` /
> `public.spec.ts` / `verify-no-localhost-bake.spec.ts`。`*.spec.ts` のみ（不変条件 #8）。

## 追加する fail path / 回帰ガード

### 1. loopback 回避の回帰ガード（Lane A の核）

| ケース | spec | 内容 | 期待 |
|--------|------|------|------|
| RG-1 | transport.spec | binding あり時に http 分岐が選ばれない | `kind==="service-binding"` のみ・`baseUrl` キー不在 |
| RG-2 | authed.spec | staging 相当（binding あり）で **global `fetch` が一度も呼ばれない** | `expect(globalThis.fetch).not.toHaveBeenCalled()`・binding.fetch のみ呼ばれる |
| RG-3 | me route.route.spec | 同上（proxy で binding 経由） | `globalThis.fetch` 未使用・binding.fetch が `service-binding.local` host で呼ばれる |

> RG-2/RG-3 が「同一 account workers.dev への plain fetch loopback 404」を構造的に再発させない回帰ガード。

### 2. fail-closed（非 local で transport 解決不能 → throw）

| ケース | spec | 内容 | 期待 |
|--------|------|------|------|
| FC-1 | transport.spec | `{ environment:"staging" }`（全無） | `toThrow(/unresolved/)`（silent localhost 禁止） |
| FC-2 | transport.spec | `{ environment:"production" }`（全無） | `toThrow`（staging と同様 production も fail-closed） |
| FC-3 | public.spec | base URL 無 + 非 local + binding 不在 | `rejects.toThrow(/unresolved in non-local/)` |
| FC-4 | me route.route.spec | 非 test + binding 無 + 非 local | proxy が throw を 500 へマップ or throw 伝播（実装挙動に合わせ assert） |

### 3. 非 local で localhost へ到達しないこと（S3 回帰ガード）

| ケース | spec | 内容 | 期待 |
|--------|------|------|------|
| LH-1 | transport.spec | 非 local（staging/production）では返り値の `baseUrl` に `localhost` / `127.0.0.1` が**現れない** | http 分岐を取れるのは local か baseUrl 明示時のみ。`localhost` を含む返り値は local fallback (d) のみ |
| LH-2 | public.spec | `ENVIRONMENT=staging` で base URL 不在 → throw（localhost に落ちない） | FC-3 と同条件で「localhost を含む fetch が発火しない」ことを assert |

### 4. search params 保持（trailing-slash/404 修正 #1113 の回帰ガード）

| ケース | spec | 内容 | 期待 |
|--------|------|------|------|
| SP-1 | authed.spec | `fetchAuthed("/me/x?cursor=abc&limit=10")`（binding） | binding.fetch の URL に `?cursor=abc&limit=10` |
| SP-2 | authed.spec | 同上（http 分岐） | fetch の URL に query 保持 |
| SP-3 | me route.route.spec | `GET /api/me/foo?a=1&b=2` | upstream subpath に `/me/foo?a=1&b=2` |
| SP-4 | me route.route.spec | gate-state 相当の `email` query を含む経路（該当 route spec へ） | `encodeURIComponent(email)` query が subpath に保持 |

### 5. cookie / header 転送

| ケース | spec | 内容 | 期待 |
|--------|------|------|------|
| CK-1 | authed.spec | `cookies()` の全 cookie | binding / http 双方で `cookie` ヘッダに `name=value; ...` 転送 |
| CK-2 | authed.spec | `init.headers` 指定時 | マージされ accept デフォルト付与・cache no-store |
| CK-3 | me route.route.spec | req の `cookie` / `content-type` / `x-ubm-dev-session` | transport init.headers に forward |
| CK-4 | authed.spec | 401 / 非 2xx を binding.fetch が返す | `AuthRequiredError` / `FetchAuthedError` を throw（cookie 転送後でも error path が機能） |

### 6. gate self-test の fail path（Lane C）

| ケース | spec | 内容 | 期待 |
|--------|------|------|------|
| GT-1 | verify-no-localhost-bake.spec | `:8888` のみ含む fixture | exit 1（`:8888` も検出） |
| GT-2 | verify-no-localhost-bake.spec | `:8787` のみ含む fixture | exit 1（旧 gate が見逃していた範囲） |
| GT-3 | verify-no-localhost-bake.spec | bundle 相当 `.js` に localhost 混入 | exit 1（client bundle は無条件 fail） |
| GT-4 | verify-no-localhost-bake.spec | allowlist タグ付き local 分岐のみ | exit 0（誤検出しない） |

## source grep 回帰ガード（コード構造の固定）

| ケース | 内容 |
|--------|------|
| SRC-1 | `authed.ts` / `transport.ts` に `process.env[` 直参照と `127.0.0.1` が無い |
| SRC-2 | 変更後の `route.ts` 群から `FALLBACK_INTERNAL_API` / `LOCAL_DEV_FALLBACK` 定数が消滅 |
| SRC-3 | `public.ts` の localhost リテラルは `// localhost-allow:local-fallback` 付き 1 箇所のみ |

## 完了判定

上記 fail path / 回帰ガードを追加し、対象 vitest（Phase 4 §コマンド）が全緑。
fail-closed・loopback 回避・search/cookie 保持が「壊れたら落ちる」状態であること。
