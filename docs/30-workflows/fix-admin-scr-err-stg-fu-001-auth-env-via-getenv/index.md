# fix-admin-scr-err-stg-fu-001-auth-env-via-getenv

[実装区分: 実装仕様書]

> **判定根拠（CONST_004）**: 本タスクの目的は `apps/web/src/lib/auth.ts` に残存する `process.env.*` /
> `getCloudflareContext().env.*` 直接参照を、CLAUDE.md「apps/web env アクセス不変条件」に従い
> env モジュール (`apps/web/src/lib/env.ts`) 経由へ統一すること。`auth.ts` / `env.ts` / `auth.spec.ts`
> のコード変更なしには AC-1〜AC-5 を満たせないため、ドキュメント・調査のみで完結する余地はなく、
> デフォルト（実装仕様書）に該当する。元 issue #862 のラベルは `type:improvement` だが実態はコード変更必須。

> **issue #862 の最適化（古い記述の現行コードへの追従）**:
> 1. **対象パスのドリフト是正**: issue 記載の `apps/web/src/auth.ts` は現存しない。実体は `apps/web/src/lib/auth.ts`。
> 2. **EnvSchema 欠落キーの補完**: issue が網羅を求める `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` /
>    `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` は現行 `EnvSchema` に未定義（`AUTH_SECRET` / `INTERNAL_AUTH_SECRET` は定義済）。
> 3. **`getEnv()` throw vs auth fail-closed の設計緊張の解決**: 現行 `getEnv()` は `EnvSchema.parse()` で必須項目
>    欠落時に throw する。一方 `auth.ts` は不変条件 #11（fail-closed = 未登録扱い）に基づき env 欠落時も
>    throw せず `unregistered` を返す。issue が「getEnv() 戻り値経由」と字義どおり書く点を、現行設計に合わせ
>    **「env モジュール経由（`getAuthEnv()` safeParse partial）」へ再解釈**する。詳細は Phase 1/2 に記す。
> 4. **service binding (`API_SERVICE`) の扱い**: `getEnv()` は string schema のみ返し Fetcher binding を運べない。
>    binding 解決経路も `env.ts` 側に移譲して `auth.ts` の直接 `getCloudflareContext` 参照を 0 件にする。

## メタ情報

| 項目                  | 値                                                                          |
| --------------------- | --------------------------------------------------------------------------- |
| Task ID               | TASK-FIX-ADMIN-SCR-ERR-STG-FU-001-AUTH-ENV                                   |
| Feature 名            | fix-admin-scr-err-stg-fu-001-auth-env-via-getenv                            |
| Task type             | implementation                                                              |
| visualEvidence        | NON_VISUAL（runtime/設定境界の整流化、UI 表示物の意匠変更なし）             |
| implementation_mode   | `new`                                                                       |
| workflow_state        | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（local 実装・決定論的証跡 captured、staging runtime は user-gated） |
| 影響 surface          | apps/web 認証境界（`auth.ts`）+ public fetch 境界（`fetch/public.ts`）+ env 正本（`env.ts`）+ 関連 unit test |
| 元 issue              | #862（CLOSED のまま。本仕様書は再オープンせず作成する）                      |
| 親 task               | TASK-FIX-ADMIN-SCR-ERR-STG-001（PR #849 / #877）                            |
| 親 workflow           | `docs/30-workflows/fix-admin-server-components-render-error-stg/`           |
| 先行単一ファイル仕様   | `docs/30-workflows/completed-tasks/unassigned-task/fix-admin-scr-err-stg-followup-001-auth-env-via-getenv-migration.md`（本 workflow が phase 1-13 へ formalize） |
| 想定 1 cycle 完了     | local 実装・focused regression は完了。staging deploy / runtime smoke / commit / push / PR は user-gated |

## 背景（一次情報）

親タスク TASK-FIX-ADMIN-SCR-ERR-STG-001 は、Cloudflare Workers staging `/admin` の Server Components
render error（digest=167275886）の原因が `apps/web/src/lib/admin/server-fetch.ts` の `process.env` 直接参照と
`http://127.0.0.1:8787` localhost fallback にあると特定し、`getEnv()` 経由へ統一する修正を PR #849 / #877 で
実施した。しかし修正は `server-fetch.ts` に留まり、`apps/web/src/lib/auth.ts` は以下の 3 経路混在のまま残存:

```text
apps/web/src/lib/auth.ts:39   return getCloudflareContext().env as AuthEnv;   // AC-2 違反
apps/web/src/lib/auth.ts:59   ["ENVIRONMENT", process.env["ENVIRONMENT"]],     // AC-1 違反
apps/web/src/lib/auth.ts:60   ["AUTH_SECRET", process.env["AUTH_SECRET"]],
...
apps/web/src/lib/auth.ts:67   ["INTERNAL_AUTH_SECRET", process.env["INTERNAL_AUTH_SECRET"]],
```

`auth.ts` は admin / member 双方の認証境界に位置するため、env parse 失敗時に zod throw → error boundary
補足の規約に乗らず、同型 regression（認証境界での silent fail）を再発するリスクがある。

## 真の論点（task-specification-creator 思考法）

1. **真の論点**: 「`process.env` を機械的に置換する」ことではなく、**「`getEnv()` の throw 設計」と
   「auth 境界の fail-closed 設計（不変条件 #11）」をどう両立させ、env 参照の単一所有権を `env.ts` に
   集約するか**が主問題。字義どおり `getEnv()` を呼ぶと、無関係な必須項目（`PUBLIC_API_BASE_URL` 等）
   欠落でも throw し、既存テスト（graceful `{}` 前提）と invariant #11 を破壊する。
2. **依存関係・責務境界**: env 参照の所有権を `env.ts`（正本）へ一本化する。`auth.ts` は env を「読む」だけで
   「どこから読むか（process.env / cloudflare context / playwright override）」を知ってはならない。現状
   `auth.ts` が `processEnv()` / `cloudflareEnv()` を自前で持つのは責務境界違反。
3. **価値とコストの不均衡**: schema 拡張（4 key 追加）と `getAuthEnv()` ヘルパー 1 個の追加で AC を満たせる。
   `requestEnv()`（`x-ubm-*` ヘッダ注入）と `globalEnv()`（`__UBM_AUTH_ENV__`）は process.env/cloudflare を
   触らないテスト/ローカル機構であり AC-1/2 対象外。これらを巻き込まないことでコストを最小化する。
4. **改善優先順位**: ① EnvSchema に google 系 4 key 追加 → ② `env.ts` に `getAuthEnv()`（safeParse partial +
   service binding 同梱）と `getPublicFetchEnv()` を追加 → ③ `auth.ts` の `processEnv()`/`cloudflareEnv()`/
   `getCloudflareContext` import を撤去し `getAuthEnv()` へ委譲 → ④ `fetch/public.ts` の direct env 参照を
   `getPublicFetchEnv()` へ委譲 → ⑤ focused regression → ⑥ runtime smoke（user-gated）。
5. **4条件評価**:
   - 価値性: 認証境界の env 経路を正本化し、同型 regression を構造的に防止。後続開発者の「3 経路どれを使うか」迷いを解消。
   - 実現性: 変更は `env.ts` / `auth.ts` / `auth.spec.ts` の 3 ファイル。新 endpoint・D1 schema・Form 仕様変更なし。
   - 整合性: 既存 `getEnv()` schema・Cloudflare bindings・既存 API surface・invariant #5/#11 と整合。
   - 運用性: grep gate（AC-1/AC-2）+ unit test + runtime smoke で再発検出可能。

## Phase 構成

| Phase | 名称             | 状態         | 出力先                       |
| ----- | ---------------- | ------------ | ---------------------------- |
| 1     | 要件定義         | completed | outputs/phase-1/phase-1.md   |
| 2     | 設計             | completed | outputs/phase-2/phase-2.md   |
| 3     | 設計レビュー     | completed | outputs/phase-3/phase-3.md   |
| 4     | テスト作成       | completed | outputs/phase-4/phase-4.md   |
| 5     | 実装             | completed | outputs/phase-5/phase-5.md   |
| 6     | テスト拡充       | completed | outputs/phase-6/phase-6.md   |
| 7     | カバレッジ確認   | completed | outputs/phase-7/phase-7.md   |
| 8     | リファクタリング | completed | outputs/phase-8/phase-8.md   |
| 9     | 品質保証         | completed | outputs/phase-9/phase-9.md   |
| 10    | 最終レビュー     | completed | outputs/phase-10/phase-10.md |
| 11    | 手動テスト       | completed | outputs/phase-11/phase-11.md |
| 12    | ドキュメント更新 | completed | outputs/phase-12/phase-12.md |
| 13    | PR作成           | blocked | outputs/phase-13/phase-13.md |

## スコープ

### 含むもの

- `apps/web/src/lib/auth.ts` 内の `process.env.*` および `getCloudflareContext().env.*` 直接参照を全廃し、
  `apps/web/src/lib/env.ts` が公開する env アクセサ経由に統一する。
- `EnvSchema`（`env.ts`）へ `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
  を `.optional()` で追加し、`getAuthEnv()`（safeParse partial + `API_SERVICE` binding 同梱）を新設する。
- `apps/web/src/lib/fetch/public.ts` の `getCloudflareContext` / `process.env` 直接参照を `getPublicFetchEnv()` 経由へ統一する。
- `apps/web/src/lib/auth.spec.ts` / `apps/web/src/lib/__tests__/env.spec.ts` / `apps/web/src/lib/fetch/public.spec.ts` の env mock を新経路に整合させ、graceful `{}` フォールバックと
  fail-closed 挙動の回帰を固定する。

### 含まないもの

- 新規 OAuth provider 追加・Auth.js バージョンアップ
- D1 schema 変更・新規 API endpoint 追加・Google Form 仕様変更
- `apps/api` 側の env 参照経路（本タスクは `apps/web` 限定）
- `requestEnv()`（`x-ubm-*` ヘッダ注入）の廃止・`globalEnv()`（`__UBM_AUTH_ENV__`）の廃止（process.env/cloudflare
  非依存のためスコープ外。挙動は保持する）

## 不変条件（CLAUDE.md より）

- 不変条件 #5: D1 直接アクセスは `apps/api` に閉じる（`apps/web` から直接アクセス禁止）。`auth.ts` は fetch 経由のみ。
- 不変条件 #11: `gateReason` ありは session 不発行（fail-closed = `unregistered` 返却）。本タスクで挙動を変えない。
- apps/web env アクセス不変条件: ランタイムの env 参照は `env.ts` の公開アクセサ（`getEnv()` / `getPublicEnv()` /
  `getAuthEnv()` / `getPublicFetchEnv()`）経由のみ。`process.env.*` 直接参照を禁止。parse 失敗 throw は
  `error.tsx` で補足する設計を維持し、認証境界は fail-closed のため `getAuthEnv()` で safeParse する。
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）。本タスクは既存 `auth.spec.ts` を更新する。
- 既存 API endpoint surface のみ利用（新 endpoint 追加禁止）。
- Cloudflare Workers production build（`next build --webpack`）互換性維持。

## DoD（Definition of Done）

- **AC-1**: `apps/web/src/lib/auth.ts` に `process.env.` 直接参照が 0 件（`grep -n "process\.env" apps/web/src/lib/auth.ts` が空）。
- **AC-2**: `apps/web/src/lib/auth.ts` に `getCloudflareContext().env` 直接参照が 0 件（`getCloudflareContext` import も撤去）。
- **AC-3**: `auth.ts` の全 env 参照が `env.ts` 公開アクセサ（`getAuthEnv()`）経由。
- **AC-4**: `EnvSchema` に `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` /
  `AUTH_SECRET` / `INTERNAL_AUTH_SECRET` / `INTERNAL_API_BASE_URL` / `ENVIRONMENT` / `AUTH_URL` が揃い、staging/production の
  `wrangler.toml` 値で `getAuthEnv()` の safeParse が成功する。
- **AC-5**: `apps/web/src/lib/fetch/public.ts` に `process.env` / `getCloudflareContext` 直接参照が 0 件で、`getPublicFetchEnv()` 経由。
- **AC-6**: focused Vitest（`auth.spec.ts` / `__tests__/env.spec.ts` / `fetch/public.spec.ts`）が green。
- **AC-7**（runtime / user-gated）: staging `/login` → Google OAuth または Magic Link → `/admin` 到達まで runtime smoke pass。
- **AC-8**: CLAUDE.md「apps/web env アクセス不変条件」と完全整合（grep gate + 設計記述）。
- **AC-9**: invariant #11（fail-closed）と既存 graceful フォールバック挙動が回帰なし（`auth.spec.ts` の
  `default env()` 系テストが green を維持）。

## 検証コマンド

```bash
# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 対象 unit test（targeted run）
mise exec -- pnpm exec vitest run --root=. apps/web/src/lib/auth.spec.ts apps/web/src/lib/__tests__/env.spec.ts apps/web/src/lib/fetch/public.spec.ts

# AC-1 / AC-2 grep gate（0 件であること）
grep -n "process\.env" apps/web/src/lib/auth.ts || echo "AC-1 PASS: no process.env"
grep -n "getCloudflareContext" apps/web/src/lib/auth.ts || echo "AC-2 PASS: no getCloudflareContext"
grep -nE "process\.env|getCloudflareContext" apps/web/src/lib/fetch/public.ts || echo "AC-5 PASS: public fetch env access via env.ts"
```

## 関連リソース

| 種別             | パス / 参照                                                                       |
| ---------------- | -------------------------------------------------------------------------------- |
| 修正対象         | `apps/web/src/lib/auth.ts`, `apps/web/src/lib/fetch/public.ts`                    |
| 正本（schema）   | `apps/web/src/lib/env.ts`（`getEnv()` / `EnvSchema` / `readRawEnv()`）            |
| 参考パターン     | `apps/web/src/lib/admin/server-fetch.ts`（親タスクで適用済みの `getEnv()` 経由化）|
| テスト           | `apps/web/src/lib/auth.spec.ts`, `apps/web/src/lib/__tests__/env.spec.ts`, `apps/web/src/lib/fetch/public.spec.ts` |
| 依存             | `apps/web/src/lib/session.ts`（`getAuth()` を import。挙動変更なしを確認）        |
| error boundary   | `apps/web/src/app/error.tsx`（throw 補足先）                                      |
| 環境定義         | `apps/web/wrangler.toml`（`[vars]` / `[env.staging.vars]` / `[env.production.vars]`）|
| 認証設計正本     | `docs/00-getting-started-manual/specs/02-auth.md`                                |
| 親 workflow      | `docs/30-workflows/fix-admin-server-components-render-error-stg/`                 |
| 先行単一仕様     | `docs/30-workflows/completed-tasks/unassigned-task/fix-admin-scr-err-stg-followup-001-auth-env-via-getenv-migration.md` |
