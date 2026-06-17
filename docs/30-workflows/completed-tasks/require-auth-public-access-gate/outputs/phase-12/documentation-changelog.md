# documentation-changelog

## 更新ドキュメント差分要約

| ドキュメント | 変更前 | 変更後 |
|-------------|--------|--------|
| `specs/00-overview.md` | 「公開一覧・詳細は未ログインでも見られる」 | 「公開一覧・詳細の閲覧にはログインが必須。`/login` 以外の全ルートは未認証時に案内画面。`/public/*` も 401」 |
| `specs/00-overview.md`（境界表） | 「画面閲覧 = 公開ページのみ」 | 「公開ページのみ（要ログイン）」+ 未認証は `/login` のみという注記 |
| `specs/02-auth.md` | （認証境界の明示なし） | 「認証境界（require-auth-public-access-gate）」節を新設し、layout ゲート・fail-closed・API 二層防御を記載 |
| `specs/06-member-auth.md` | 「未ログイン → 公開ページはそのまま閲覧可」 | 「未ログイン → `/login` 以外で案内画面 → `/login?redirect=`」+ 権限モデル表に未認証ユーザー行追加 |
| `specs/01-api-schema.md` | 「`GET /public/members` … 認証は不要」「`:memberId` … session 不要」 | 「`requirePublicAccess` により会員セッション or 内部認証必須・401」 |
| `specs/05-pages.md` | `/members` は未ログインでも閲覧可能 | 公開レイヤはログイン済み会員向け。未認証は案内画面 |
| `specs/09e-screen-blueprints-public.md` | 公開 6 画面は public（未ログイン可） | `/login` 以外の公開画面は認証必須。未認証は `LoginRequiredNotice` |
| `specs/13-mvp-auth.md` | MVP AC「未ログインでも公開一覧・公開詳細を閲覧できる」 | MVP AC を「未認証は閲覧不可、認証済み会員は公開一覧・詳細を閲覧可」へ更新 |
| `aiworkflow-requirements` references | 公開 API は公開情報取得・認証不要扱い | `requirePublicAccess` / `X-Internal-Auth` / fail-closed / workflow 台帳を同期 |
| `outputs/phase-12/implementation-guide.md` | （新規） | Part1 例え話 + Part2 技術詳細 + テスト結果 + VISUAL 参照 |

## 意味の変化（1 行ずつ）

- 公開層 = 未ログイン可 → **全ルート（`/login` 除く）= 認証必須**。
- 公開 API = 誰でも取得可 → **会員セッション OR 内部認証必須（無ければ 401）**。
- sitemap / OG = 素の fetch → **`X-Internal-Auth` 付与の内部経路**。
