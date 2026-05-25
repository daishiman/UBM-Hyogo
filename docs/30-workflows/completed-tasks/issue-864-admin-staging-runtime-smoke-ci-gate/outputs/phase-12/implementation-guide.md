# 実装ガイド — issue-864-admin-staging-runtime-smoke-ci-gate

## Part 1: 初学者向け（中学生レベル）

### 背景（なぜ必要か）

お店のレジ（管理画面 `/admin`）が、お店を改装する（staging へデプロイする）たびに、たまに「壊れて開かなくなる」ことがありました。前回は実際に壊れて（render error）、お客さんではなく店員さん用の画面が真っ白になりました。その壊れ自体はもう直しました。でも「次に改装したとき、また壊れていないか」を毎回人間が手で確認するのは大変で、見落とします。

### 要約（何をするか）

そこで「改装が終わった直後に、ロボットが自動で店員さん用の画面を開いてみて、ちゃんと開けたかを確認する」仕組みを作ります。これが今回の「自動チェック（CI gate）」です。ロボットは店員さんの入館証（ログイン情報＝session cookie）を一時的に作って、それを持って画面を開き、エラーのサインが出ていないかを見ます。

### 実装ステップ（順番）

1. ロボットがサーバーのログ（記録）を覗ける道具（`cf.sh tail`）を用意する。
2. 一時的な入館証を作る小さなプログラム（mint helper）を作る。
3. その入館証で `/admin` を開いて「ちゃんと開けた？エラーは出てない？」を確認する係（runner）を作る。
4. 改装作業（deploy）の直後に、この確認係を自動で呼び出すよう設定する。

### 既知の制限

入館証の「鍵」が用意されていない環境では、ロボットはチェックをお休みします（無理に失敗扱いにして作業を止めない）。また本物のサーバーで開いてみる最終確認は、人が「やっていいよ」と言ってから行います。

## Part 2: 開発者向け（技術者レベル）

### 背景

`/admin` は edge `middleware.ts`（`decodeAuthSessionJwt`）と `(admin)/layout.tsx` の `getSession()`（Auth.js `auth()`）という 2 層認証で守られる。post-deploy probe は両層を通過する session cookie を持って GET しないと render path に到達しない。既存 `runtime-smoke-staging.yml` は API 専用、`playwright-smoke.yml` は PR-time local build であり、post-deploy の web `/admin` runtime gate は存在しない。

### 要約

`web-cd.yml` に `needs: deploy-staging` の `admin-runtime-smoke` job を追加し、`runtime-admin-web.sh`（新規）が `cf.sh tail`（新規 subcommand）を先に開始してから authenticated `/admin` を GET（200 assert）し、probe 中の Workers log で `error.boundary.caught`/digest=167275886 の不在を確認する。session cookie は `mint-staging-session-cookie.mts`（新規）が短命（TTL 600s）で発行する。

### インターフェース / 型定義

```typescript
export interface MintSessionCookieInput {
  authSecret: string;
  memberId: string;
  email: string;
  isAdmin: boolean;
  ttlSeconds?: number; // default 600
}
// 返り値: "__Secure-authjs.session-token=<token>" 形式の cookie 文字列
export function mintStagingSessionCookie(input: MintSessionCookieInput): Promise<string>;
```

`cf.sh` の追加 subcommand シグネチャ:

```
bash scripts/cf.sh tail <worker-name> --env <staging|production> --format json
  env: CF_TAIL_SECONDS（capture 打ち切り秒数, default 25）
```

### 実装ステップ

1. **token 互換性確定**（分岐 A/B）: `apps/web/src/lib/auth.ts` の session strategy を確認。custom HS256 統一なら `signSessionJwt` 再利用（A）、Auth.js JWE なら `@auth/core/jwt encode`（B）。
2. `scripts/cf.sh` に `tail` case を追加（既存 op/esbuild/mise wrapper 経由、timeout で stream 打ち切り）。
3. `mint-staging-session-cookie.mts` を `mint-staging-bearers.mts` 雛形で実装（GITHUB_OUTPUT のみ、echo 禁止）。
4. `runtime-admin-web.sh` を `runtime-attendance-provider.sh` 雛形で実装（tail pre-start + 200 assert + body marker grep + tail log grep + redact + summary.json）。
5. `web-cd.yml` に graceful skip 付き gate job を追加。

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/smoke/__tests__/runtime-admin-web.test.sh
pnpm exec vitest run scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/web-cd.yml
```

### エラーハンドリングとエッジケース

- 302→`/login`: `auth-token-invalid-or-expired` で exit 1。
- 403: `auth-not-admin` で exit 1。
- body/log に render error marker / digest: `server-components-render-error` で exit 1。
- `cf.sh tail` 空出力: best-effort（`|| true`）。probe 200 なら PASS。
- secret 未設定: job skip（AC-8）。dev push をブロックしない。

### 設定可能なパラメータ / 定数

| 名前 | 既定 | 用途 |
| ---- | ---- | ---- |
| `MINT_TTL_SECONDS` | 600 | session cookie TTL |
| `CF_TAIL_SECONDS` | 25 | tail capture 打ち切り |
| `SESSION_COOKIE_NAME` | `__Secure-authjs.session-token` | cookie 名（SSOT） |
| `STAGING_WEB_HOST_ALLOW_REGEX` | `staging\|127.0.0.1\|localhost` | target allowlist |
| `DIGEST` | `167275886` | 検出対象 render error digest |

### 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡として `phase-10/phase-10.md`（最終レビュー）と `phase-11/manual-test-result.md`（runtime 確証手順・Gate-B）を参照する。
