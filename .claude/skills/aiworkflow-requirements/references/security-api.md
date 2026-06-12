# APIセキュリティ

> 本ドキュメントは統合システム設計仕様書の一部です。
> 管理: .claude/skills/aiworkflow-requirements/
>
> **親ドキュメント**: [security-api-electron.md](./security-api-electron.md)

---

## 認証・認可フロー

**APIエンドポイント分類**:

| 分類     | 認証要件     | 例                             |
| -------- | ------------ | ------------------------------ |
| 公開     | 不要         | ヘルスチェック等、情報を返さない公開生存確認 |
| 認証必須 | ログイン済み | ユーザー情報、ワークフロー操作、公開情報取得（`/public/*`） |
| 管理者   | 管理者権限   | システム設定、ユーザー管理     |
| 内部     | Agent認証 / `X-Internal-Auth` | Local Agent通信、sitemap / OG などの Worker-to-Worker 消費 |

### `/public/*` 認証境界（2026-06-10）

`require-auth-public-access-gate` 以降、`/public/stats`、`/public/members`、`/public/members/:memberId`、`/public/form-preview` は `requirePublicAccess` で保護する。外部ブラウザ/RSC 経路は Auth.js session JWT（Cookie または `Authorization: Bearer`）を必須とし、sitemap 生成と OG 画像ワーカーなどのサーバー間経路だけ `X-Internal-Auth: <INTERNAL_AUTH_SECRET>` を許可する。どちらも無い場合、または検証不能な場合は 401 で fail-closed する。

**認証チェックの実装場所**:

- Next.js Middlewareでルート全体の認証チェック
- API Routeハンドラーでの詳細な認可チェック
- データアクセス層でのオーナーシップ検証

---

## レート制限

| エンドポイント種別   | 制限値        | 単位           |
| -------------------- | ------------- | -------------- |
| 一般API              | 100リクエスト | 1分間/IP       |
| 認証API              | 10リクエスト  | 1分間/IP       |
| AI処理API            | 10リクエスト  | 1分間/ユーザー |
| ファイルアップロード | 5リクエスト   | 1分間/ユーザー |

**実装方針**:

- メモリベースのレート制限（Redis不要で開始可能）
- 429ステータスコードと Retry-After ヘッダーの返却
- レート超過のログ記録

---

## CORS設定

| 環境 | 許可オリジン                   |
| ---- | ------------------------------ |
| 開発 | localhost:3000, localhost:3001 |
| 本番 | 本番ドメインのみ               |

## apps/api Response Security Headers

`apps/api` emits API response hardening headers from `apps/api/src/middleware/security-headers.ts`, registered globally in `apps/api/src/index.ts` immediately after `new Hono<{ Bindings: Env }>()`.

| Header | Value / Rule |
| --- | --- |
| `X-Content-Type-Options` | `nosniff` on every response |
| `Referrer-Policy` | `no-referrer` on every response |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Cache-Control` | `no-store` only for `/me`, `/auth`, `/admin`, `/internal` when the route did not already set Cache-Control |

API CORS is deny-by-default. `ALLOWED_ORIGINS` is a comma-separated exact-origin allowlist in `apps/api/wrangler.toml` and `apps/api/src/env.ts`. Allowed origins receive `Access-Control-Allow-Origin: <origin>` and `Access-Control-Allow-Credentials: true`; denied origins receive no CORS allow headers. Preflight responses use fixed allow methods / headers and do not echo arbitrary requested headers.

Workflow: `docs/30-workflows/completed-tasks/issue-870-apps-api-security-headers/`.

---

## 依存関係セキュリティ

### 脆弱性管理

| ツール     | 用途                 | 実行タイミング     |
| ---------- | -------------------- | ------------------ |
| pnpm audit | 依存関係の脆弱性検出 | CI/CD、週次        |
| Dependabot | 自動PR作成           | 常時（GitHub設定） |
| Snyk       | 詳細な脆弱性分析     | 任意（無料枠あり） |

**対応フロー**:

1. 脆弱性検出時は重大度を確認する
2. Critical/Highは即時対応（24時間以内）
3. Mediumは次回リリースまでに対応
4. Lowは定期メンテナンスで対応

### lock ファイルの管理

- pnpm-lock.yamlは必ずコミットする
- lock ファイルの手動編集は禁止
- CI/CDでは`pnpm install --frozen-lockfile`を使用

---

## 関連ドキュメント

- [Electron IPCセキュリティ](./security-electron-ipc.md)
- [スキル実行セキュリティ](./security-skill-execution.md)
- [入力バリデーション](./security-input-validation.md)
