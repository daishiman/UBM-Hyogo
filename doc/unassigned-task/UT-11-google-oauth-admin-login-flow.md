# UT-11: 管理者向け Google OAuth ログインフロー実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-11 |
| タスク名 | 管理者向け Google OAuth ログインフロー実装 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |

## 目的

UBM-Hyogo の管理者（イベント運営スタッフ）が Google アカウントで管理画面にログインできる OAuth 2.0 フローを実装する。`01c-parallel-google-workspace-bootstrap` で Google Cloud Project への OAuth client 登録と `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` の Cloudflare Secrets 配置は完了しているが、Next.js（Cloudflare Pages）側のログインページ・コールバックルート・セッション管理・認証ガードの実装が残っている。本タスクでこれらを実装し、管理者が実際にブラウザから Google ログインを行い、管理機能を利用できる状態を確立する。

## スコープ

### 含む

- Google OAuth 2.0 Authorization Code Flow（PKCE 必須）の実装
- Next.js App Router での OAuth コールバックルート（`/api/auth/callback/google`）実装
- セッション管理（JWT cookie または Workers KV を使った server-side セッション）
- 管理者メールドレスによるアクセス制御（ドメイン制限またはホワイトリスト）
- 管理画面への認証ガード（未ログイン時はログインページへリダイレクト）
- ログインページ UI（Google でログインボタン）
- ログアウトエンドポイント（セッション破棄）
- CSRF 対策のための state parameter 生成・検証
- ローカル開発時の動作確認手順（`wrangler pages dev` を使用）

### 含まない

- Service Account 認証（Sheets API 用自動読み取り）→ UT-03 で実施
- 通常ユーザー（バンドマン）向け認証フロー
- Supabase Auth を使った認証基盤（本タスクは Cloudflare Pages + Hono Workers 構成で完結させる）
- Discord / GitHub 等の他プロバイダーによるログイン
- 管理者ユーザーの招待・登録フロー（アクセス制御はメールホワイトリストで代替）
- 2要素認証（2FA）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | doc/completed-tasks/01c-parallel-google-workspace-bootstrap | OAuth client の `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` が Cloudflare Secrets に配置済みであることが前提 |
| 上流 | doc/01-infrastructure-setup/02-serial-monorepo-runtime-foundation | `apps/web/` の Next.js 構成・`apps/api/` の Hono 構成が確定している必要がある |
| 上流 | doc/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync | 本番・staging への Secrets 同期が完了していると、動作確認の範囲が広がる（必須ではない） |
| 下流 | 管理画面機能全般 | 本タスク完了後に初めて「ログイン済みユーザーのみ利用可能な管理機能」が着手可能になる |
| 連携 | UT-03 (Sheets API 認証方式設定) | UT-03 の認証とは独立しているが、同一の OAuth client を参照するためシークレット名の重複確認が必要 |

## 着手タイミング

> **着手前提**: `01c-parallel-google-workspace-bootstrap` が完了し、`GOOGLE_CLIENT_ID` と `GOOGLE_CLIENT_SECRET` が Cloudflare Secrets（staging / production）に配置された後に着手すること。

| 条件 | 理由 |
| --- | --- |
| 01c-parallel-google-workspace-bootstrap 完了 | OAuth client の Client ID / Secret が確定・配置済みでないと実装が宙に浮く |
| 02-serial-monorepo-runtime-foundation 完了 | `apps/web/` の App Router 構成・`apps/api/` の Hono ルートが確定していないと実装場所が定まらない |

UT-03（Sheets API 認証方式設定）とは並列着手が可能。

## 苦戦箇所・知見

**1. PKCE の code_verifier と code_challenge の生成を Edge Runtime で実装する必要がある**

Cloudflare Pages の Server Components / Route Handlers は Node.js ではなく Edge Runtime で動作する。`crypto.subtle.digest()` を使った SHA-256 ハッシュと Base64URL エンコードの実装は Web Crypto API で行う必要があり、Node.js の `crypto.createHash()` は使えない。`next-auth` 等のライブラリも Edge Runtime 非対応の内部依存を持つことがあるため、事前に `npx wrangler pages dev` でローカル実行して確認すること。

```
PKCE フロー:
1. crypto.getRandomValues() で 32バイトの code_verifier を生成
2. crypto.subtle.digest("SHA-256", verifier) で code_challenge を計算
3. Base64URL（+ → - , / → _ , = を削除）にエンコード
4. 認証 URL に code_challenge_method=S256 と code_challenge を付与
```

**2. state parameter の保存場所に注意が必要**

OAuth の state parameter は「ログイン開始時に生成 → コールバック時に照合」する必要がある。Edge Runtime はリクエスト間でメモリを共有しないため、Next.js のサーバーサイドの変数に state を持てない。Workers KV または HttpOnly Cookie に state を一時保存し、コールバック時に取り出して検証する。Cookie に保存する場合は `SameSite=Lax; Secure; Path=/api/auth/callback` を設定して CSRF 攻撃を防ぐ。有効期限は 10 分程度に設定する。

**3. リダイレクト URI の完全一致要件で詰まりやすい**

Google Cloud Console に登録するリダイレクト URI は、本番・staging・ローカル開発の3つを別々に登録する必要がある。ローカル開発時の `http://localhost:3000` と Cloudflare Pages のプレビューデプロイ URL（`https://xxx.ubm-hyogo-web.pages.dev`）も含めないと `redirect_uri_mismatch` エラーが発生する。エラーメッセージに実際に使われた URI が表示されるので、それをそのままコンソールに貼り付けること。

**4. セッションの保存方法と Workers KV の binding 名の整合**

JWT を HttpOnly Cookie に保存する場合、署名検証用のシークレットが必要になる（`SESSION_SECRET` 等）。Workers KV を使う場合は `wrangler.toml` の `[[kv_namespaces]]` binding と `env.KV` の型定義を `apps/api/` と `apps/web/` の両方で揃える必要がある。初期実装では JWT cookie 方式（KV 不要）の方がシンプルで、失効管理が必要になった時点で KV に移行する判断もある。

**5. 管理者メールホワイトリストの管理場所**

「誰が管理者か」を Cloudflare Secret（`ADMIN_EMAIL_ALLOWLIST`）にカンマ区切りで持つか、D1 テーブルに持つかを事前に決定する必要がある。初期実装では Secret のカンマ区切り文字列が最もシンプル。D1 管理に移行する場合は別タスクとして分離する。許可リストに含まれないメールで認証が成功した場合は 403 エラー（Google 側では認証成功なので、アプリ側での拒否）になるため、ユーザーへのフィードバックメッセージを明確にする。

**6. Cloudflare Pages の環境変数スコープと Next.js の `NEXT_PUBLIC_*`**

`GOOGLE_CLIENT_ID` はフロントエンドの「Google でログイン」ボタン URL 生成に必要だが、Cloudflare Pages の Environment Variable として設定しただけでは `NEXT_PUBLIC_` プレフィックスがないと Server Component でしか読めない。OAuth 認証 URL の生成はすべて Server Component（または Route Handler）で行い、クライアントには URL 文字列だけを渡す設計にすることで、Client ID をブラウザに露出させつつも Secret はサーバー側に閉じ込められる。

## 実行概要

- Google OAuth 2.0 の認証 URL 生成エンドポイント（`/api/auth/login`）を Hono ルートまたは Next.js Route Handler で実装し、code_verifier と state を HttpOnly Cookie に一時保存した上でブラウザを Google 認証画面にリダイレクトする
- コールバックルート（`/api/auth/callback/google`）で state 検証・code_verifier 取得・Google トークンエンドポイントへの code 交換・ユーザー情報取得（メールアドレス確認）・管理者ホワイトリスト照合を順に実行し、合格した場合のみセッション Cookie を発行してダッシュボードに転送する
- 認証ガード（Next.js Middleware または HOC）を実装し、`/admin/*` 配下のルートにアクセスした際にセッション Cookie が有効でなければ `/login` にリダイレクトさせる
- ログアウトエンドポイント（`/api/auth/logout`）でセッション Cookie を即時失効させる
- `ADMIN_EMAIL_ALLOWLIST`（Cloudflare Secret）をカンマ区切りで管理し、Workers 起動時にパースして照合ロジックに注入する
- ローカル開発では `wrangler pages dev` を使い、`.dev.vars` に `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST` を配置して動作確認する（`.dev.vars` は `.gitignore` 必須）

## 完了条件

- [ ] `/api/auth/login` エンドポイントがブラウザを Google OAuth 認証画面へリダイレクトする
- [ ] PKCE（`code_challenge_method=S256`）が有効になっており、code_verifier が Cookie に一時保存されている
- [ ] コールバック時に state 検証が行われ、不一致の場合 400 エラーが返る
- [ ] 管理者ホワイトリスト以外のメールアドレスでログインした場合、403 エラー（または拒否画面）が返る
- [ ] 管理者ホワイトリストに含まれるメールで認証成功後、セッション Cookie が発行され管理画面にリダイレクトされる
- [ ] セッション Cookie は `HttpOnly; Secure; SameSite=Lax` で設定されている
- [ ] `/admin/*` 配下のルートは未認証アクセス時に `/login` にリダイレクトする（認証ガードが機能している）
- [ ] `/api/auth/logout` でセッション Cookie が失効し、ログインページに戻る
- [ ] ローカル開発（`wrangler pages dev`）で上記フロー全体が動作確認できている
- [ ] `.dev.vars` が `.gitignore` に含まれており、機密情報が git に混入しないことが確認されている
- [ ] Google Cloud Console のリダイレクト URI に、本番・staging・ローカルの3環境分が登録されている
- [ ] `ADMIN_EMAIL_ALLOWLIST` / `SESSION_SECRET` が Cloudflare Secrets（staging / production）に配置されている
- [ ] runbook（操作手順書）に「新規管理者の追加方法」（ホワイトリストへの追加 → Secrets 更新 → Workers 再デプロイ）が記載されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/completed-tasks/01c-parallel-google-workspace-bootstrap/outputs/phase-12/implementation-guide.md | OAuth client 設定済み環境変数名・運用境界の確認 |
| 必須 | doc/completed-tasks/01c-parallel-google-workspace-bootstrap/outputs/phase-12/unassigned-task-detection.md | 本 UT-11 の検出コンテキスト（impl-google-oauth-login） |
| 必須 | doc/unassigned-task/UT-03-sheets-api-auth-setup.md | Service Account 認証との責務境界・同一 OAuth client を参照するため重複確認 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets 配置方針・wrangler.toml 構成 |
| 参考 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | ローカル開発での `.dev.vars` 管理・1Password Environments 正本 |
| 参考 | .claude/skills/aiworkflow-requirements/references/csrf-state-parameter.md | state parameter 生成・検証の設計根拠（RFC 6749 Section 10.12） |
| 参考 | .claude/skills/aiworkflow-requirements/references/security-principles.md | OAuth 2.0 PKCE フロー・セッション管理設計原則 |
| 参考 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | Cloudflare Workers + Next.js のレイヤー構成・Auth Middleware パターン |
