# system-spec-update-summary

## Step1-A: 実装完了記録

- **C1（web UI gate）**: `(public)` 全ルートを未認証時に `LoginRequiredNotice` へ差し替え、本来コンテンツと子ページ RSC データ取得を遮断（fail-closed）。
- **C2（API gate + server-to-server）**: `/public/*` に `requirePublicAccess` を適用し「会員セッション OR 内部認証」必須化。web RSC は session cookie 転送、sitemap / OG は `X-Internal-Auth` 付与でリグレッション回避。

## Step1-B: 変更ファイルと AC 充足

| ファイル | AC |
|---------|-----|
| `LoginRequiredNotice.tsx`（新規） | AC-1, AC-2 |
| `(public)/layout.tsx`（編集） | AC-1, AC-3, AC-4, AC-5, AC-9 |
| `require-public-access.ts`（新規） | AC-6, AC-9 |
| `public/index.ts`（編集） | AC-6 |
| `fetch/public.ts`（編集） | AC-8 |
| `sitemap.ts`（編集） | AC-7 |
| `member-source.ts`（編集） | AC-7 |
| `env.ts`（編集） | AC-8, AC-12 |
| specs4（編集） | AC-11 |
| 正本 specs 追加同期（`05-pages.md` / `09e-screen-blueprints-public.md` / `13-mvp-auth.md`） | AC-11 |
| aiworkflow-requirements references / ledgers | AC-11 / Step2 |

- AC-10（`/profile`・`/admin/*` 既存ゲート不変）: 該当ファイル無変更で充足。
- AC-12（OKLch / 既存 primitive / env アクセサ / D1 直アクセス禁止 / 新規 migration 無し）: 充足。
- AC-13（1 サイクル完結・先送り無し）: 充足。

## Step1-C: 関連タスク

- 既存 `/profile`・`/admin/*` の middleware redirect ゲートはスコープ外・無変更。
- `INTERNAL_AUTH_SECRET` / `X-Internal-Auth` は既存内部認証機構（`internal-auth.ts`）を再利用。

## Step2: システム仕様 sync（新規インターフェースあり・本サイクル実施）

本タスクは新規 middleware `requirePublicAccess` = 新規インターフェース追加を含む。

- **specs 更新（AC-11・本サイクルで実施済み）**:
  - `00-overview.md`: 主要フロー「公開閲覧」と公開・会員・管理境界表を「全ルート認証必須・公開列は認証済み会員」へ是正。
  - `02-auth.md`: 「認証境界（require-auth-public-access-gate）」節を追加。
  - `06-member-auth.md`: 認証フロー図と権限モデル表に「未認証ユーザーは `/login` のみ」を追加。
  - `01-api-schema.md`: `/public/*` は `requirePublicAccess`（会員セッション or 内部認証必須・401）である旨を明記。
  - `05-pages.md` / `09e-screen-blueprints-public.md` / `13-mvp-auth.md`: 旧「未ログインで公開ページ閲覧可」記述を、`/login` 以外は案内画面・公開 API は認証必須へ補正。
- **`aiworkflow-requirements` references**:
  - `references/security-api.md`: 公開 API 分類を `requirePublicAccess` 管轄へ補正。
  - `references/api-endpoints.md`: `/public/*` の会員セッション OR `X-Internal-Auth` 必須・401 挙動を追記。
  - `references/environment-variables.md`: `INTERNAL_AUTH_SECRET` の用途を `/auth/session-resolve` だけでなく sitemap / OG / `/public/*` 内部経路にも拡張。
  - `references/task-workflow-active.md` / quick-reference / resource-map / artifact inventory / LOGS / SKILL-changelog を本 workflow と同一 wave で同期。
