# Phase 7: カバレッジ確認

## 目的

カバレッジ計測を **本サイクルで変更したファイル / ブロックに限定**して確認する。
広域の `%` 目標は設定しない（BEFORE-QUIT-002: 変更範囲外の既存コードを巻き込まない）。

> **計測範囲の限定（BEFORE-QUIT-002）**: `apps/web` 全体の総合 coverage 数値は判定に使わない。
> 下表の「変更ファイル」の **変更ブロックの line / branch** が全て踏まれているかのみを判定する。
> 全件 coverage 実行は SIGKILL/OOM リスクがあるため、対象 spec を明示指定して計測する。

## 計測対象（変更ファイル / ブロック限定）

| ファイル | 計測すべきブロック | line 目標 | branch 目標 |
|---------|-------------------|----------|------------|
| `apps/web/src/lib/fetch/transport.ts` | `resolveApiFetch` の (a)〜(e) **全 5 分岐** | 100% | 100%（5 分岐 + (a) の baseUrl 有無境界） |
| `apps/web/src/lib/fetch/authed.ts` | transport 選択（binding/http の 2 分岐）+ 401/非 2xx error path + cookie 転送分岐 | 変更行 100% | binding / http / 401 / 非 2xx の各分岐 |
| `apps/web/app/api/me/[...path]/route.ts` | requireSession（401）+ transport 選択 2 分岐 + search 連結 | 変更行 100% | 認証/未認証 + binding/http |
| `apps/web/app/api/admin/[...path]/route.ts` | transport try/catch（resolve 成功/throw→500）+ binding/http | 変更行 100% | resolve 成功 / throw→500 / binding / http |
| `apps/web/app/api/auth/{magic-link,magic-link/verify,gate-state}/route.ts` | `selectTransport` の binding/http 分岐 | 変更行（local helper）踏破 | binding / http |
| `apps/web/src/lib/auth/verify-magic-link.ts` | `apiBaseUrl` override / transport binding / transport http の 3 経路 | 変更行 100% | override 有 / binding / http |
| `apps/web/src/lib/env.ts` | `getEnvironment`（local/staging/production の 3 値）+ `getTransportRuntimeIsTest`（test/非 test）+ `getPublicFetchEnv` の NEXT_PUBLIC 解決分岐 | 変更行 100% | 3 環境値 + test 真偽 + NEXT_PUBLIC 有無 |
| `apps/web/src/lib/fetch/public.ts` | `getBaseUrl` の NEXT_PUBLIC / PUBLIC fallback / local fallback / 非 local throw の 4 分岐 | 100% | NEXT_PUBLIC / PUBLIC / local / throw |
| `scripts/verify-no-localhost-bake.sh` | self-test 経由で dirty(exit1) / clean(exit0) / allowlist(exit0) / bundle(exit1) を踏む | self-test で 4 経路 | dirty / clean / allowlist / bundle |

## 計測コマンド（対象限定）

```bash
# Lane A/B（apps/web・対象 spec 明示・変更ファイルのみ collect）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/lib/fetch/transport.spec.ts src/lib/fetch/authed.spec.ts \
  src/lib/fetch/public.spec.ts src/lib/__tests__/env.spec.ts \
  app/api/me/'[...path]'/route.route.spec.ts \
  --coverage \
  --coverage.include='src/lib/fetch/transport.ts' \
  --coverage.include='src/lib/fetch/authed.ts' \
  --coverage.include='src/lib/fetch/public.ts' \
  --coverage.include='src/lib/env.ts' \
  --coverage.include='app/api/me/**'

# Lane C gate self-test
mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts
```

> `--coverage.include` で変更ファイルに絞る。これにより「広域 %」ではなく変更ブロックの踏破のみ判定できる。

## 判定基準

- 上表「変更ブロック」の line / branch が **すべて踏まれている**こと（特に transport.ts 5 分岐・public.ts 4 分岐・admin route の throw→500）。
- 未踏破の分岐があれば Phase 6 に該当ケースを追加して埋める（先送り禁止・CONST_007）。
- script（bash）は istanbul 計測対象外のため、self-test spec が 4 経路（dirty/clean/allowlist/bundle）を踏むことを以て branch 踏破とみなす。

## 計測しないもの（明示）

- `apps/web` 全体の総合 coverage 数値（変更外の既存コードを含むため判定に使わない）。
- `cf-secret-put-auth-secret.sh` / `smoke-staging-me.sh` / `diagnose-auth-secret-parity.sh` の mutation/runtime 経路（user-gated 実走部分は coverage 対象外。`--check` / `bash -n` / 引数バリデーションは Phase 9 で確認）。
