# プロトタイプ反映 実装ロードマップ

## 目的

`claude-design-prototype/` の画面体験を、本番の `apps/web` / `apps/api` / D1 / Cloudflare 構成へ落とし込むための実装順序を定義する。

この文書は「何を作ればプロトタイプが本番仕様として成立するか」を示す。画面デザインの参照元は prototype、データ・認証・インフラの正本は `specs/` とする。

---

## 成果物

| 領域 | 成果物 |
|------|--------|
| フロントエンド | Next.js App Router、公開/会員/管理画面、共通 UI コンポーネント |
| バックエンド | Hono Worker API、Google Forms 同期、D1 repository、管理操作 API |
| 共通 | `packages/shared` の型、view model、validation schema |
| インフラ | Cloudflare Workers/D1、staging/production、GitHub Actions |
| 運用 | schema diff review、sync job、seed、受け入れテスト |

---

## 実装フェーズ

### Phase 0: 基盤作成

- pnpm workspace を作る
- `apps/web`, `apps/api`, `packages/shared`, `packages/integrations` を作る
- TypeScript, ESLint, Prettier, Vitest を設定する
- `wrangler.toml` を web/api に分けて配置する
- `packages/shared` に `04-types.md` の型を移植する
- `16-component-library.md` に沿って `apps/web/src/components/ui/` を作る

monorepo ディレクトリ構成:

```
.
├── apps/
│   ├── web/                          # Cloudflare Workers + Next.js App Router via @opennextjs/cloudflare
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages
│   │   │   │   ├── page.tsx          # /
│   │   │   │   ├── members/
│   │   │   │   │   ├── page.tsx      # /members
│   │   │   │   │   └── [id]/page.tsx # /members/[id]
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── profile/page.tsx
│   │   │   │   └── admin/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── members/page.tsx
│   │   │   │       ├── tags/page.tsx
│   │   │   │       ├── schema/page.tsx
│   │   │   │       └── meetings/page.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/               # primitives（16-component-library.md）
│   │   │   │   ├── member/           # MemberCard, ProfileHero, FilterBar
│   │   │   │   └── admin/            # MemberDrawer, TagQueuePanel, etc.
│   │   │   └── lib/
│   │   │       ├── auth.ts           # Auth.js 設定
│   │   │       └── tones.ts          # zoneTone, statusTone
│   │   ├── wrangler.toml
│   │   └── next.config.ts
│   └── api/                          # Cloudflare Workers (Hono)
│       ├── src/
│       │   ├── index.ts              # Hono エントリポイント
│       │   ├── routes/
│       │   │   ├── public.ts         # GET /public/*
│       │   │   ├── member.ts         # GET/POST /me/*
│       │   │   └── admin.ts          # /admin/* (requires admin_users check)
│       │   ├── repository/           # D1 アクセス層
│       │   │   ├── members.ts
│       │   │   ├── meetings.ts
│       │   │   ├── tags.ts
│       │   │   └── schema.ts
│       │   └── sync/
│       │       ├── formSchema.ts     # forms.get 同期
│       │       └── formResponses.ts  # forms.responses.list 同期
│       ├── migrations/               # D1 マイグレーション SQL
│       └── wrangler.toml
├── packages/
│   ├── shared/                       # 型・view model・validation（04-types.md）
│   │   └── src/
│   │       ├── types.ts
│   │       ├── viewModels.ts
│   │       └── validation.ts
│   └── integrations/                 # Google Forms API クライアント
│       └── src/
│           └── googleForms.ts
└── pnpm-workspace.yaml
```

受け入れ条件:

- `pnpm install`
- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @ubm/api dev`
- `pnpm --filter @ubm/web dev`

### Phase 1: D1 schema と repository

- `08-free-database.md` のテーブルを D1 migration 化する
- repository 層を `apps/api` に作る
- seed で prototype の `data.jsx` 相当の最小データを投入できるようにする
- Pages から D1 へ直接アクセスしない構造をテストで固定する

受け入れ条件:

- local D1 に migration が通る
- public/member/admin view model を fixture から返せる
- `responseId` と `memberId` を混同しない型テストがある

### Phase 2: Google Forms 同期

- `forms.get` schema sync を実装する
- `forms.responses.list` response sync を実装する
- `stableKey` 解決、alias、unresolved field を保存する
- `member_identities.current_response_id` を最新回答へ更新する
- consent snapshot を `member_status` に反映する

受け入れ条件:

- 31 項目・6 セクションの schema を保存できる
- `responseEmail` が system field として保存される
- 同一メールの再回答で current response が切り替わる
- unknown field は `extraFields` と `/admin/schema` 用 queue に残る

### Phase 3: API 実装

公開 API:

- `GET /public/stats`
- `GET /public/members`
- `GET /public/members/:memberId`
- `GET /public/form-preview`

会員 API:

- `GET /me`
- `GET /me/profile`
- `POST /me/visibility-request`
- `POST /me/delete-request`

管理 API:

- `GET /admin/dashboard`
- `GET /admin/members`
- `GET /admin/members/:memberId`
- `PATCH /admin/members/:memberId/status`
- `POST /admin/members/:memberId/notes`
- `PATCH /admin/members/:memberId/notes/:noteId`
- `POST /admin/members/:memberId/delete`
- `POST /admin/members/:memberId/restore`
- `GET /admin/tags/queue`
- `POST /admin/tags/queue/:queueId/resolve`
- `GET /admin/schema/diff`
- `POST /admin/schema/aliases`
- `GET /admin/meetings`
- `POST /admin/meetings`
- `POST /admin/meetings/:sessionId/attendance`
- `DELETE /admin/meetings/:sessionId/attendance/:memberId`
- `POST /admin/sync/schema`
- `POST /admin/sync/responses`

受け入れ条件:

- public API は公開条件を満たす member だけ返す
- member API は session user の `memberId` 以外を返さない
- admin API は `admin_users` に登録された user のみ許可する
- API response は `packages/shared` の schema で検証する
- `POST /auth/magic-link` は `/login` から呼び、未登録・規約未同意・削除済みを `AuthGateState` として返す
- `/admin/members` の管理メモは `admin_member_notes` に保存し、public/member view model には混ぜない
- auth gate、admin member detail、admin meetings は contract test を必須にする

API response contract:

| endpoint | response schema | 備考 |
|----------|-----------------|------|
| `GET /public/stats` | `PublicStatsView` | 公開中人数、区画分布、最近の同期状態 |
| `GET /public/members` | `PublicMemberListView` | `publicConsent=consented`, `publishState=public`, `isDeleted=false` のみ |
| `GET /public/members/:memberId` | `PublicMemberProfile` | `FieldVisibility=public` のみ |
| `GET /public/form-preview` | `FormPreviewView` | section、field label、required、visibility だけを返す |
| `GET /me` | `SessionUser` | Auth.js session と D1 identity を結合 |
| `GET /me/profile` | `MemberProfile` | 自分の `public + member` field と状態サマリ |
| `GET /admin/dashboard` | `AdminDashboardView` | KPI、未タグ、schema issue、最近の開催日 |
| `GET /admin/members` | `AdminMemberListView` | admin field と管理状態を含む |
| `GET /admin/members/:memberId` | `AdminMemberDetailView` | 回答、状態、タグ、参加履歴、管理メモ |

### Phase 4: フロントエンド移植

prototype の route key を正式 URL に移す。

| prototype route | URL | 実装先 |
|-----------------|-----|--------|
| `landing` | `/` | `apps/web/app/page.tsx` |
| `members` | `/members` | `apps/web/app/members/page.tsx` |
| `member` | `/members/[id]` | `apps/web/app/members/[id]/page.tsx` |
| `member-form` | `/register` | `apps/web/app/register/page.tsx` |
| `login` | `/login` | `apps/web/app/login/page.tsx` |
| `my` | `/profile` | `apps/web/app/profile/page.tsx` |
| `admin-dashboard` | `/admin` | `apps/web/app/admin/page.tsx` |
| `admin-members` | `/admin/members` | `apps/web/app/admin/members/page.tsx` |
| `admin-tags` | `/admin/tags` | `apps/web/app/admin/tags/page.tsx` |
| `schema-diff` | `/admin/schema` | `apps/web/app/admin/schema/page.tsx` |
| prototype 未実装 | `/admin/meetings` | `apps/web/app/admin/meetings/page.tsx` |

受け入れ条件:

- prototype と同等の公開/会員/管理導線が URL ベースで動く
- `theme/nav/detailLayout/editMode` は正式ユーザー機能にしない
- `density` は `/members` の query または client state として採用する
- `localStorage` は route/session/data の正本にしない
- prototype の `MEMBERS`, `MEETINGS`, `SCHEMA_DIFF`, `SURVEY_SECTIONS` は `packages/shared` の fixture に移し、API fixture と Storybook/Playwright seed のみに使う
- `window.UBM` 参照は実装に残さず、Server Components の `fetch` または client hook 経由に置き換える

### Phase 5: 認証

- Auth.js Google OAuth を主導線にする
- Magic Link は補助導線として実装する
- `/login` は `input / sent / unregistered / rules_declined / deleted` を出し分ける
- 管理画面は session + `admin_users` で gate する

受け入れ条件:

- 未登録メールは `/register` CTA を表示する
- `rulesConsent != consented` は再回答 CTA を表示する
- `isDeleted = true` は管理者問い合わせを表示する
- `/no-access` に依存しない

### Phase 6: 管理機能

- member status の公開/非公開/削除/復元
- tag assignment queue の resolve
- schema diff の stableKey alias 割当
- meeting session と attendance の管理
- sync 実行と sync status 表示
- admin member drawer ではタグを直接編集せず、タグ割当画面への導線を出す
- meeting attendance は重複登録を禁止し、削除済み会員は追加候補から除外する

受け入れ条件:

- 管理者は他人の profile 本文を直接編集できない
- profile 本文更新は Google Form 再回答だけに誘導する
- schema 変更は `/admin/schema` に集約される

### Phase 7: テストとリリース

- API contract test
- repository test
- public/member/admin authorization test
- Playwright smoke test
- staging deploy
- production deploy

受け入れ条件:

- staging で Google Forms 同期が動く
- staging で公開一覧、ログイン、マイページ、管理画面が通る
- production deploy 前に D1 migration と secrets が確認済み
- Playwright で `09-ui-ux.md` の画面検証表を desktop/mobile で通す

---

## 実装禁止事項

1. prototype の `data.jsx` を本番データ正本にする
2. Pages から D1 に直接接続する
3. `responseEmail` をフォーム項目として扱う
4. 本人プロフィール本文を D1 override で編集する
5. GAS prototype の `localStorage` 保存を本番仕様にする
6. 管理画面で他人のプロフィール本文を直接編集する
