# Phase 2: 設計

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL**

## 1. 設計方針（既存コンポーネント再利用可否 / FB-SDK-07-1）

新規 production コードは**作らない**。`buildAuthConfig`（auth.ts:174）は既に export されており、
`resolveAuthView` / `getAuthView` も export 済（`auth-view/index.ts`）。テストは既存 export のみを
import して契約を pin する。→ **再利用優先・新規 surface ゼロ**。

## 2. テストファイル設計

### 2.1 ファイル

| 項目 | 値 |
| --- | --- |
| パス | `apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts` |
| 変更種別 | 新規作成 |
| import | `buildAuthConfig`（`@/lib/auth`）, `resolveAuthView`（`../resolveAuthView`）, `getAuthView`（`../getAuthView`）, `type SessionLike`（`../types`） |
| test runner | Vitest（`apps/web` の vitest config。jsdom 不要・node 環境で可） |

### 2.2 「実 session callback」を得る方法

`buildAuthConfig` は `providerFactories` を要求し、未指定だと build 時 throw する（`auth.spec.ts` 参照）。
`auth.spec.ts` と同じ stub factories を渡して config を得る:

```ts
const factories = {
  GoogleProvider: () => ({ id: "google" }),
  CredentialsProvider: () => ({ id: "magic-link" }),
};
const cfg = buildAuthConfig({}, vi.fn() as unknown as typeof fetch, factories);
// cfg.callbacks.session({ session, token }) が実 session 構築ロジック
```

> 注: `auth.spec.ts` は `vi.mock("@opennextjs/cloudflare", ...)` を行っている。integration spec でも
> 同 mock を先頭に置く（`getCloudflareContext` 解決のため）。これは production の session 構築ロジック
> 自体は mock せず、Cloudflare context 取得のみ stub する境界設計（実 contract は保持）。

### 2.3 契約連鎖（テストの核）

```
token fixture
  → cfg.callbacks.session({ session: { user: { email } }, token })   // 実 auth.ts ロジック
  → produced.user  (= 実 session.user shape: { memberId, isAdmin, email, name })
  → resolveAuthView(produced as SessionLike)                          // 実 resolve ロジック
  → AuthView                                                          // assertion
```

この連鎖により、`auth.ts` の session callback が field 名（`memberId`→別名等）や正規化（`isAdmin === true`）を
変えると、`resolveAuthView` の読む field とズレてテストが赤くなる。= 契約 drift 検知。

### 2.4 入力・出力・副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | token fixture（`{ memberId, isAdmin, email, name }` の組合せ） |
| 出力（観測） | `resolveAuthView(produced.user)` の `AuthView`、および `getAuthView()` 経路の `AuthView` |
| 副作用 | なし（fetch は `vi.fn()` stub、D1 アクセスなし＝不変条件 #5 適合） |
| エラー経路 | `getAuthView()` の catch fail-closed は member token を `auth()` mock 経由で AC-4 として確認 |

## 3. テストケース設計（TC）

| TC | 入力 token | 期待 `session.user`（callback 出力） | 期待 AuthView |
| --- | --- | --- | --- |
| TC-AVSC-01 | `{ memberId: "m_1", isAdmin: false, email: "u@e", name: "U" }` | `memberId:"m_1", isAdmin:false` | `{ kind:"member", profileHref:"/profile" }` |
| TC-AVSC-02 | `{ memberId: "m_1", isAdmin: true }` | `memberId:"m_1", isAdmin:true` | `{ kind:"admin", profileHref:"/profile", adminHref:"/admin" }` |
| TC-AVSC-03 | `{}`（memberId 欠落） | `memberId:"", isAdmin:false` | `{ kind:"guest" }`（fail-closed） |
| TC-AVSC-04 | member token を `getAuthView()` の `auth()` mock に注入 | — | `{ kind:"member", ... }`（end-to-end 経路） |
| TC-AVSC-05 | 実 callback 出力 shape regression: `produced.user` が `memberId`/`isAdmin` キーを持つ | キー存在 assertion | drift guard |

## 4. getAuthView() 経路の扱い（AC-4）

`getAuthView()` は `getAuth()` を import するため、`@/lib/auth` の `getAuth` を mock し、
`auth()` が「実 callbacks.session が返す shape」を返すよう設定する。これにより
「session callback 出力 → getAuthView → resolveAuthView → AuthView」の end-to-end も 1 ケースで pin する。
（既存 `getAuthView.spec.ts` の mock は捏造 shape。本ケースは callback 出力由来 shape を流す点が差別化）

## 5. 状態所有権・責務境界

| レイヤ | 所有 | テストでの扱い |
| --- | --- | --- |
| auth module（session 構築） | `buildAuthConfig().callbacks.session` | 実ロジック使用（mock しない） |
| AuthView 解決（pure） | `resolveAuthView` | 実ロジック使用 |
| async adapter | `getAuthView` | `getAuth` のみ mock し auth() 出力を注入 |
| Cloudflare context | `@opennextjs/cloudflare` | stub（境界外依存） |

## 6. 検証 path

| 種別 | コマンド |
| --- | --- |
| focused | `mise exec -- pnpm exec vitest run apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts apps/web/src/lib/auth-view/__tests__/getAuthView.spec.ts apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts apps/web/src/lib/auth.spec.ts` |
| 型 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` |
| lint | `mise exec -- pnpm lint` |

## 完了条件（Phase 2）

- [x] 新規 surface ゼロ（既存 export 再利用）確定
- [x] 実 session callback 取得方法（stub factories + cloudflare mock）確定
- [x] 契約連鎖（callback 出力 → resolveAuthView）設計
- [x] TC-AVSC-01〜05 + getAuthView 経路 設計
- [x] 責務境界（mock するのは Cloudflare context と getAuth のみ）固定
