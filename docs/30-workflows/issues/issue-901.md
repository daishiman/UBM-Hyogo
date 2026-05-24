# [#901] [UT-DSF-07-FU-01] 認証後 profile（ログイン済み member）/ admin dashboard（admin 権限）の production-equivalent staging-visual baseline 取得

## メタ情報

```yaml
task_id: UT-DSF-07-FU-01
task_name: 認証後 profile（ログイン済み member）/ admin dashboard（admin 権限）の production-equivalent staging-visual baseline 取得
category: 改善
target_feature: -
priority: 中
scale: 中規模
status: 未実施
source_phase: Phase 12
created_date: 2026-05-23
dependencies: []
spec_path: docs/30-workflows/unassigned-task/UT-DSF-07-FU-01-authenticated-profile-admin-staging-visual.md
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---
## 目的

UT-DSF-07 では public-top / login / profile / admin-dashboard の 4 screens を Cloudflare Workers
staging で撮影したが、**profile と admin は「未認証 guard / redirect 画面」の design system shell
描画のみ**を evidence としている（`apps/web/playwright/tests/visual-staging/profile.spec.ts` /
`admin-dashboard.spec.ts` の spec コメント参照。両者とも未認証で middleware redirect 先 `/login` 相当の
guard 描画を撮っている）。

その結果、**認証後の実画面 — ログイン済み member の `/profile`（自分のプロフィール本文・Google Form
更新導線）と admin 権限の `/admin` dashboard（members / tags / meetings / requests 等の管理 widget）—
の production-equivalent runtime visual は未検証**のまま残っている。

本タスクは、staging に認証 session を張った状態で profile / admin の認証後実画面を撮影し、
OpenNext Workers bundle が認証後画面の design system（OKLch token / `@layer` / rhythm / primitives）を
local と等価に描画することを確立する。これにより UT-DSF-07 が design system shell までしか担保できて
いなかった runtime visual coverage を、認証後画面まで拡張する。

## スコープ

### 含む

- staging に認証 session を張る方式の確立（次の 2 案いずれかを Phase 9 で確定する）:
  - (a) 既存テストアカウントを使った storageState 事前生成方式（推奨。member: `manju.manju.03.28@gmail.com` /
    admin: `manjumoto.daishi@senpai-lab.com` を staging seed に存在させ、認証フロー完走後の cookie/session を
    `storageState` JSON として保存し Playwright project に注入）
  - (b) Magic Link / Google OAuth テストアカウント方式（CI 自動化は storageState 経由に正規化）
- Playwright `staging-visual` project（または認証後専用の派生 project）への storageState 注入構成
- 認証後 profile 実画面の staging-visual baseline 取得（`/profile`・member session）
- 認証後 admin dashboard 実画面の staging-visual baseline 取得（`/admin`・admin session）
- 取得した baseline PNG（CI ubuntu-latest 生成 `-staging-visual-chromium-linux.png`）+ screenshot +
  metadata の `outputs/phase-11/` 配下への物理配置 + inventory ledger 更新
- 親 UT-DSF-07 workflow への evidence cross-ref（残留リスク R-03 / Phase 9 §5 の解消記録）

### 含まない

- 新規 API endpoint 追加 / D1 schema 変更 / Google Form 仕様変更（UI prototype alignment 不変条件 #1）
- production 環境への deploy（staging のみ）
- UT-DSF-07 で既に取得済みの未認証 guard / redirect 画面（profile / admin の現 4 spec）の取り直し
- public-top / login の未認証 baseline の取り直し（UT-DSF-07 で確立済み）
- local Playwright baseline の取り直し（UT-DSF-06 で確立済み）
- 認証後画面の API データ内容の正しさ検証（既存 E2E / API テストの責務。本タスクは design system 描画の検証）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 前提 | UT-DSF-07 完了 | `staging-visual` project / staging deploy フロー / 未認証 baseline が green 状態 |
| 前提 | staging 認証フロー（Auth.js v5）動作 | HS256 JWT cookie session（`AUTH_SECRET` sign/verify）が staging で機能（spec 13-mvp-auth §「MVP session JWT 構造」） |
| 前提 | staging seed / テストアカウント | member 条件（`responseEmail` 登録 + `rulesConsent="consented"` + `isDeleted=false`）と admin 条件（`admin_users.active`）を満たすアカウントが staging に存在 |
| 前提 | Cloudflare staging 環境（既存） | `apps/web/wrangler.toml` の `[env.staging]` 設定済み・session 関連 binding が解決 |
| 前提 | 1Password secrets（`CLOUDFLARE_API_TOKEN` / `AUTH_SECRET` 等） | `scripts/cf.sh` 経由の `op run` 動的注入が機能 |

## 苦戦箇所【記入必須】

- **SSR fetch は Playwright `page.route()` で差し替え不可**: Cloudflare Workers の SSR fetch（Worker
  サーバー側の fetch）はブラウザ fetch ではないため `page.route()` で intercept できない（親 workflow
  index.md §0.3 / Phase 9 R-07）。したがって認証後画面のデータを mock で疑似的に出すことは技術的に不可能で、
  **認証後 runtime visual には実 session が必須**。これが UT-DSF-07 で認証後画面を撮れなかった根本理由。
- **「新規 fixture/seed 追加なし」スコープとの衝突が別タスク化の経緯**: UT-DSF-07 は「新規 mock fixture /
  seed の追加なし」をスコープ外に明示していた（親 Phase 9 §2 の不採用案「staging に認証 session を張って
  profile/admin 実画面を取得＝不採用（フォロー候補）」: secrets / 認証フロー / seed を伴うため衝突）。本タスクは
  その衝突を解消するために認証 session 確立を正式スコープに含めた別タスクとして切り出している。
- **Magic Link はメール受信が絡み CI 自動化が難しい**: spec 13-mvp-auth では Google OAuth が主導線・Magic
  Link が補助導線。Magic Link は受信メールのリンク踏破が必要で CI 上の自動化が困難。**認証完了後の cookie を
  `storageState` JSON として事前生成し Playwright に注入する方式に正規化**するのが現実的（OAuth テストアカウント
  方式も最終的に storageState 経由に集約する）。
- **admin 権限判定（admin gate）を満たすテストアカウントの staging seed 存在**: session JWT の `isAdmin`
  claim は発行時に `/auth/session-resolve` が `admin_users.active` を確認した結果（spec 13-mvp-auth
  §「MVP session JWT 構造」3）。staging seed に admin アカウントが存在しないと `/admin` が guard 描画に戻り
  認証後 baseline が撮れない。member 用と admin 用の 2 種 session を分けて生成する必要がある。
- **認証 cookie/session の binding 依存**: MVP は JWT-only session（D1 `sessions` テーブル不採用 /
  spec 13-mvp-auth）。session cookie の sign/verify は `AUTH_SECRET` 共有が前提で、staging の `AUTH_SECRET`
  が `apps/web`（Auth.js cookie）と `apps/api`（`verifySessionJwt`）で一致していないと session が無効化される。
  将来 KV ベースの revocation list を導入した場合は session KV binding 解決も前提に加わる。
- **session cookie / OAuth token 値の evidence 混入禁止**: storageState JSON / screenshot / log に
  cookie 値・token 値を保存しないこと（spec 13-mvp-auth §固定ルール / CLAUDE.md シークレット管理）。storageState は
  artifact として CI 内で生成・消費し、git にコミットする場合は値のマスキング方針を Phase 7/9 で確定する。
- **将来同種課題（認証後 runtime visual）の再利用パターン**: 認証後 runtime visual を毎回 1 から組むのを避けるため、
  member / admin の storageState 生成を共通 setup（Playwright `globalSetup` or `dependencies` project）に
  切り出し、後続の認証後 visual タスクが storageState を再利用できる構成にする。これにより同種課題を簡潔に解決できる。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| storageState の cookie 失効（JWT TTL 24h）で再生成が必要 | visual 実行直前に setup project で storageState を fresh 生成する順序を固定 |
| admin seed 不在で `/admin` が guard 描画に戻る | 撮影前に admin session の `isAdmin=true` を assert（ページ内 admin 専用 widget の存在で検証）してから screenshot |
| SSR データ揺れ（件数変動）で認証後画面が flake | `maxDiffPixelRatio` を未認証 baseline と同水準に緩和 + データ非依存領域に screenshot 範囲を寄せる |
| cookie / token 値が evidence に混入 | storageState を git にコミットしない or 値マスキング。screenshot / log の Token 値 grep gate |
| AUTH_SECRET drift で session 無効 | `apps/web` / `apps/api` 双方の staging `AUTH_SECRET` 一致を `cf.sh` 経由で事前確認 |

## 検証方法

- `mise exec -- pnpm typecheck` exit 0
- `mise exec -- pnpm lint` exit 0
- staging に最新 build を `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` で配備
- member / admin の storageState を setup で生成（cookie/token 値は log 非出力）
- `staging-visual`（認証後）project を storageState 注入で実行し profile / admin 認証後 baseline を取得（diff < 5%）
- screenshot 内で認証後固有要素（profile 本文・admin 専用 widget）の描画を assert し guard 画面でないことを確認
- `outputs/phase-11/` の evidence 物理存在 + inventory ledger 整合
- `bash scripts/verify-pr-ready.sh` exit 0
- storageState / screenshot / log に cookie 値・Token 値が混入していないことを grep で確認

## 受け入れ基準

- [ ] staging に認証 session を張る方式（storageState 事前生成 or OAuth テストアカウント）が確立されている
- [ ] member session の storageState で `/profile` 認証後実画面の staging-visual baseline を取得済み
- [ ] admin session の storageState で `/admin` 認証後 dashboard の staging-visual baseline を取得済み
- [ ] 認証後画面が guard / redirect 画面ではない（profile 本文 / admin 専用 widget の存在を assert で確認）
- [ ] baseline PNG が CI ubuntu-latest 生成 `-staging-visual-chromium-linux.png` で揃っている
- [ ] screenshot / metadata が `outputs/phase-11/` に物理配置 + inventory ledger と整合
- [ ] 親 UT-DSF-07 workflow に認証後 evidence の cross-ref（Phase 9 §5 / R-03 解消記録）が反映されている
- [ ] storageState / screenshot / log に session cookie 値・OAuth token 値が混入していない（grep 0 件）
- [ ] 新規 API endpoint / D1 schema 変更 / production deploy を行っていない
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` がいずれも exit 0

## 参照

親タスク（UT-DSF-07）:

- `docs/30-workflows/unassigned-task/UT-DSF-07-visual-runtime-production-equivalent-screenshots.md`
- `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/phase-09-risks.md`（§2 不採用案 / §5 残留リスク・フォロー候補）
- `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/phase-13-commit-pr-draft.md`（§3 SSR データ制約 / §7 後続アクション）
- `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/outputs/phase-12/implementation-guide.md`（親タスクの実装契約 / `staging-visual` project 規約 / `No members-list/detail expansion` の根拠）

実装の現状:

- `apps/web/playwright/tests/visual-staging/profile.spec.ts`（未認証 guard baseline・認証後は本タスクスコープ）
- `apps/web/playwright/tests/visual-staging/admin-dashboard.spec.ts`（未認証 guard baseline・認証後は本タスクスコープ）
- `apps/web/playwright/tests/visual-staging/{public-top,login}.spec.ts`
- `apps/web/playwright.config.ts`（`staging-visual` project / `isStagingVisual` 分岐 / `PLAYWRIGHT_STAGING_BASE_URL`）

認証設計:

- `docs/00-getting-started-manual/specs/13-mvp-auth.md`（MVP ログイン条件 / session JWT 構造 / admin gate / JWT-only session）
- `docs/00-getting-started-manual/specs/02-auth.md`（Magic Link / Google OAuth 認証設計）

プロジェクト不変条件 / 運用:

- `CLAUDE.md`（apps/web env アクセス不変条件 / Cloudflare 系 CLI 実行ルール / UI prototype alignment 不変条件 / シークレット管理）
- `scripts/cf.sh`（Cloudflare CLI wrapper）
- `scripts/verify-pr-ready.sh`
- `.claude/skills/task-specification-creator/references/unassigned-task-required-sections.md`（単一ファイル proto-spec フォーマット §8）
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
