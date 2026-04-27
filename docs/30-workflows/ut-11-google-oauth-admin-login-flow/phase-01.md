# Phase 1: 要件定義: 管理者向け Google OAuth ログインフロー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-11-google-oauth-admin-login-flow |
| Phase | 1 / 13 |
| Wave | 1 |
| 種別 | serial |
| 作成日 | 2026-04-27 |
| 上流 | 01c-parallel-google-workspace-bootstrap（OAuth client 配置済）／ 02-serial-monorepo-runtime-foundation（apps/web, apps/api 構成確定） |
| 下流 | phase-02（設計） |

## 目的

UBM 兵庫支部会の管理画面（`/admin/*`）にアクセスできる管理者を、Google OAuth 2.0 Authorization Code Flow + PKCE で認証する仕組みの **要件** を確定する。Cloudflare Workers + Next.js App Router via `@opennextjs/cloudflare`（`apps/web`）と Hono Workers（`apps/api`）構成のうえで、**何を session に載せ、誰を管理者と認め、どこに secret を置くか** を本 Phase で固定する。

## true issue

| 観点 | 内容 |
| --- | --- |
| 解くべき問題 | Cloudflare Workers Edge runtime 上で Google OAuth + PKCE による管理者ログインフローを成立させ、`/admin/*` を gate する |
| 解いていない問題 | 通常ユーザー（バンドマン）向けログイン、Magic Link、2FA、招待フロー UI |
| 解いてはいけない問題 | Service Account 認証（UT-03 の責務）、フォーム回答 schema 変更、GAS prototype の昇格、D1 への session 永続化 |
| 失敗時の影響 | 管理画面が無防備、または管理者がログインできず運営不能、CSRF / トークン詐取の脆弱性露出 |

## 依存境界

| 入力 | 提供元 | 内容 |
| --- | --- | --- |
| OAuth client credentials | 01c-parallel-google-workspace-bootstrap | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` が Cloudflare Secrets に配置済み |
| `apps/web` / `apps/api` 構成 | 02-serial-monorepo-runtime-foundation | App Router / Hono ルートの配置先確定 |
| Secrets 同期パイプライン | 04-serial-cicd-secrets-and-environment-sync（任意） | staging / production への自動同期 |
| UT-03 認証方式 | docs/30-workflows/unassigned-task/UT-03 | 同一 OAuth client を共有するため重複命名なし |

| 出力 | 利用先 | 内容 |
| --- | --- | --- |
| `/api/auth/login` / `/api/auth/callback/google` / `/api/auth/logout` | 後続管理画面タスク | 管理者ログインの入口・出口 |
| admin gate middleware | `/admin/*` を持つ全タスク | session Cookie 検証 + ホワイトリスト確認 |
| session JWT 構造 | 管理画面 server component | `{ email, isAdmin, iat, exp }`（profile / 個人情報は含めない） |
| runbook（ホワイトリスト追加手順） | 運営オペレーション | 新規管理者追加の正式手順 |

## 価値とコスト

| 項目 | 内容 |
| --- | --- |
| 価値 | 管理画面の安全な認証境界が成立し、後続の管理機能タスクが「ログイン済み管理者前提」で着手可能になる |
| 直接コスト | OAuth + PKCE エンドポイント spec、admin gate spec、`SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST` の Secret 配線記述、runbook |
| 間接コスト | Edge runtime 互換性（Web Crypto API 利用）、リダイレクト URI 3 環境分の整合管理 |
| やらない場合のコスト | 管理画面に認証なし → 情報漏洩・改ざんリスク、運営不可 |

## スコープ

### 含む
- Google OAuth 2.0 Authorization Code Flow + **PKCE (S256)** の spec
- `/api/auth/login` / `/api/auth/callback/google` / `/api/auth/logout` のルート設計
- HttpOnly Cookie による `state` / `code_verifier` 一時保存（10 分 TTL、`SameSite=Lax`、`Path=/api/auth/callback`）
- session JWT を `HttpOnly; Secure; SameSite=Lax` Cookie に保存（`SESSION_SECRET` 署名）
- `ADMIN_EMAIL_ALLOWLIST`（カンマ区切り Secret）によるホワイトリスト照合
- `apps/web/middleware.ts` による `/admin/*` admin gate
- `wrangler pages dev` + `.dev.vars` を使ったローカル動作確認手順
- runbook（新規管理者追加: allowlist 更新 → Secrets 更新 → 再デプロイ）

### 含まない
- **Service Account 認証（UT-03 の責務）**
- 通常ユーザー向け認証（別タスク）
- D1 を使った session 永続化 / admin テーブル
- 招待・登録 UI / 2FA
- Auth.js 系ライブラリ導入（素実装で完結。導入是非は phase-03 で評価）
- GAS prototype の認証ロジック流用

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 管理画面の前提となる認証境界、未実装では管理機能タスクが進められない |
| 実現性 | PASS | OAuth client は配置済、PKCE は Web Crypto API で Edge runtime 上に実装可能、Next.js Middleware は Workers 互換 |
| 整合性 | PASS | UT-03 と OAuth client を共有しつつ責務（ユーザー認証 vs Service Account）を分離。CLAUDE.md スタック方針に整合 |
| 運用性 | PASS | secrets は Cloudflare Secrets / 1Password 体系に乗り、ホワイトリストは Secret 1 個で運用簡素 |

## 不変条件マッピング

| # | 内容 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | apps/web から D1 直接禁止 | 本タスクは D1 を一切使わない（session は JWT Cookie、ホワイトリストは Secret）。将来 D1 化する場合は `apps/api` 経由 |
| #6 | GAS prototype を本番仕様に昇格させない | GAS の認証実装を流用せず、Cloudflare Workers 互換の Web Crypto API で PKCE / JWT を実装 |

その他の不変条件（#1〜#4, #7）はフォーム回答処理に関するもので、本タスクのスコープ外。直接抵触しないが、session JWT に `responseId` / プロフィール本文を載せない方針で潜在的な漏洩経路を断つ。

## 受入条件 (AC)

index.md の AC-1〜AC-13 を Phase 7 で全 trace。元仕様「完了条件」13 項目を 1:1 で対応させる。

## サブタスク管理

- [ ] 01c の `outputs/phase-12/implementation-guide.md` を Read し、配置済み secret 名の確認
- [ ] UT-03 の元仕様を Read し、OAuth client 共有時の名前重複が無いことを確認
- [ ] CLAUDE.md の不変条件 #5 / #6、シークレット管理セクションの確認
- [ ] session JWT claim の最小集合（`email`, `isAdmin`, `iat`, `exp`）を仮決定
- [ ] redirect URI 3 環境分（local / staging / production）のリスト化
- [ ] `.dev.vars` の `.gitignore` 既登録確認手順を残す

## 実行手順

1. `docs/30-workflows/unassigned-task/UT-11-google-oauth-admin-login-flow.md` を Read し、完了条件 13 項目を AC として転記
2. `docs/30-workflows/completed-tasks/01c-parallel-google-workspace-bootstrap/outputs/phase-12/implementation-guide.md` を Read し、既に配置されている secret 名（`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`）を確認
3. `docs/30-workflows/unassigned-task/UT-03-sheets-api-auth-setup.md` を Read し、Service Account 側で利用する secret 名と本タスクで新規追加する secret 名（`SESSION_SECRET`, `ADMIN_EMAIL_ALLOWLIST`）が衝突しないことを確認
4. CLAUDE.md「重要な不変条件」#5 / #6、「シークレット管理」セクションを Read
5. 不変条件 #5 / #6 が AC でカバーされていることを self-check
6. AC 漏れがあれば index.md を更新

## 統合テスト連携

| 並列 / 上流 / 下流 | タスク | 連携内容 |
| --- | --- | --- |
| 連携 | UT-03（Sheets API 認証） | OAuth client 共有、secret 名衝突しないことを Phase 2 で再確認 |
| 下流 | 管理画面機能タスク全般 | session Cookie + admin gate を前提に着手 |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| セキュリティ | PKCE 必須、state CSRF 対策、JWT 署名検証、Cookie HttpOnly/Secure/SameSite | - |
| privacy | session JWT に profile 本文 / 個人情報を載せない | #5（潜在） |
| 権限境界 | 認証成功 ≠ 認可成功（ホワイトリスト未登録は 403）、admin gate のバックドアを作らない | - |
| 無料枠 | session storage は JWT Cookie（D1 row 増を回避） | - |
| 観測性 | OAuth callback / ホワイトリスト拒否の監査ログを将来追加できる hook を残す | - |
| Cloudflare 互換 | Web Crypto API（`crypto.subtle.digest` / `crypto.getRandomValues`）で PKCE 実装、Node.js `crypto` を使わない | - |
| 運用性 | redirect URI が 3 環境分登録、`.dev.vars` が `.gitignore` に含まれる | - |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-11-google-oauth-admin-login-flow.md | 元タスク仕様（完了条件 13 項目） |
| 必須 | index.md | このタスクの scope / AC / 依存関係 |
| 必須 | CLAUDE.md | 不変条件・スタック・シークレット管理 |
| 参考 | docs/30-workflows/completed-tasks/01c-parallel-google-workspace-bootstrap/outputs/phase-12/implementation-guide.md | OAuth client 配置済み secret 名 |
| 参考 | docs/30-workflows/unassigned-task/UT-03-sheets-api-auth-setup.md | Service Account 側 secret との重複確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 本 phase の成果サマリ（true issue / 4 条件 / 不変条件 / AC 一覧） |
| メタ | artifacts.json | phase 1 status |

## 完了条件

- [ ] AC が 13 件以上、session JWT 最小 claim 集合が確定
- [ ] 不変条件マッピングが #5 / #6 を含む
- [ ] 上流 2 タスク（01c, 02-serial）の確定が確認できている
- [ ] scope out 項目が明確（特に UT-03 / Auth.js 導入 / D1 session）
- [ ] 4 条件すべて PASS

## タスク 100% 実行確認

- [ ] index.md の AC が 13 件以上
- [ ] スコープに **Service Account 認証が含まれていない**（UT-03 の責務）
- [ ] スコープに **D1 を使った session ストレージが含まれていない**
- [ ] 4 条件すべて PASS
- [ ] 不変条件 #5 / #6 がスコープに反映済み
- [ ] 成果物 placeholder が outputs/phase-01/ に作成

## 次 Phase

Phase 2（設計）で次を確定:
- OAuth + PKCE フローの Mermaid 図
- `/api/auth/login`・`/api/auth/callback/google`・`/api/auth/logout` の I/O contract
- session JWT 構造と Cookie 属性
- `apps/web/middleware.ts` の admin gate 責務分離
- secrets / env / redirect URI 3 環境分の表

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する
