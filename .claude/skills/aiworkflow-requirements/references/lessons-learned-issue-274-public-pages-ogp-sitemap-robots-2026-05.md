# Issue #274 公開ページ OGP / sitemap / robots 実装の苦戦箇所

> 対象ワークフロー: `docs/30-workflows/issue-274-public-pages-ogp-sitemap-robots/`
> 同期日: 2026-05-17
> 実装範囲: `apps/web/app/{layout,page,sitemap,robots,opengraph-image}.{tsx,ts}` / `apps/web/app/(public)/{members,members/[id],register}/page.tsx` / `apps/web/src/lib/seo/site-metadata.ts` (+ `__tests__/`) / `apps/web/playwright/tests/public-metadata.spec.ts`
> 起票元 unassigned 2 件: `task-06a-followup-002-ogp-sitemap.md` / `task-11-followup-002-public-og-sitemap-robots.md`（consumed trace）

---

## L-274-001: site URL を `ENVIRONMENT` キーの SSOT に集約した

### 苦戦点

`metadataBase` / `sitemap` / `robots.txt` / OG 画像 URL がそれぞれ string literal を持つと、staging / production の host 切替時に乖離が発生する。
`apps/web/wrangler.toml` の `[vars]` と `[env.staging.vars]` / `[env.production.vars]` の `AUTH_URL` を SSOT として、metadata route 系全てを 1 箇所から引かないと組合せ爆発する。

### 採用解

`apps/web/src/lib/seo/site-metadata.ts` に `SITE_URL_MAP`（`ENVIRONMENT` キーの Record）を置き、`getSiteUrl()` を経由してのみ URL を構築する。`buildBaseMetadata()` / `buildPageMetadata()` で `metadataBase` / `openGraph.url` / `twitter` を統一する。
dev 起動時のフォールバックは `http://localhost:3000`。

### 教訓

- 公開系 metadata route（`sitemap.ts` / `robots.ts` / `opengraph-image.tsx`）は env-scoped URL registry を経由させ、host literal を route 内に書かない
- registry のキーは `wrangler.toml` の `ENVIRONMENT` var と一致させ、`getPublicEnv()`（task-02 wrangler-env-injection の不変条件）経由で読む
- 新規公開 route 追加時の checklist に「site URL registry 経由か」を runbook 化する

---

## L-274-002: sitemap の paginated 取得は失敗時に静的サブセットで縮退する

### 苦戦点

`apps/web/app/sitemap.ts` から `/public/members` を取得して member detail URL を列挙する設計だが、members API が一時不達のときに sitemap generation が 500 で死ぬと、検索エンジンの再クロールでサイト全体が落ちたように扱われる SEO リスクがある。

### 採用解

`limit=100&page=N` で最大 20 ページまでループし、fetch error / non-2xx を catch して **静的 routes のみで返す**。throw しない。
`limit=100` は public members API の現行 parser clamping に整合させたもの（artifact inventory 注記）。

### 教訓

- SEO route は **degraded mode を明示**して書く（throw せず、accumulated subset を返す）
- limit の clamping 値は API repo 側の正本（parser 実装）に合わせ、UI 側に literal を持たない
- 同パターンは将来追加する RSS / JSON feed / `/api/sitemap-index.xml` 系にも適用する

---

## L-274-003: `robots.ts` は `getPublicEnv()` 経由で env-branch する

### 苦戦点

staging 環境を検索エンジンにインデックスさせると、production と重複ドメインで SEO 評価が分散する。`process.env.ENVIRONMENT` 直参照は task-02 wrangler-env-injection の不変条件に反する。

### 採用解

`getPublicEnv().ENVIRONMENT === "production"` のみ `/` を allow、それ以外は `Disallow: /` を返す。env access は wrapper 関数経由に統一。

### 教訓

- env 依存の security-sensitive route（robots / sitemap / auth-callback など）は `process.env.*` 直参照を grep gate で禁止する
- 不変条件は CLAUDE.md §`apps/web` env アクセス不変条件 と整合させ、CI gate（`verify-design-tokens` 隣接として `verify-no-direct-process-env` 候補）に組み込む候補

---

## L-274-004: OG image route は `runtime = "edge"` を明示する

### 苦戦点

Next.js 16 の `opengraph-image.tsx`（`ImageResponse`）は Node runtime では Cloudflare Workers deploy 時に bundle size / cold-start で失敗する。runtime 指定を忘れると build は通るが deploy が壊れる。

### 採用解

`export const runtime = "edge"`、`size` / `alt` / `contentType` を named export として明示。OpenNext Workers の bundle に乗るよう Turbopack を使わず `next build --webpack` を継続採用（CLAUDE.md §`apps/web` 不変条件と整合）。

### 教訓

- metadata route の `runtime` 指定は contract として実装テンプレに含める
- `ImageResponse` を使うルートは Phase 11 evidence に `curl -I .../opengraph-image` の `content-type: image/png` 確認を含める

---

## L-274-005: 起票元 unassigned 2 件は consumed trace として保持する

### 苦戦点

`task-06a-followup-002-ogp-sitemap.md` と `task-11-followup-002-public-og-sitemap-robots.md` は本ワークフローで実装消費したが、物理削除すると過去 PR / 過去 LOGS からの逆引きが切れる。一方で active unassigned のままだと double-pick されるリスクがある。

### 採用解

両 unassigned ファイルは `docs/30-workflows/unassigned-task/` に物理保持し、メタ情報冒頭に `consumed` マーカーと `canonical_workflow: docs/30-workflows/issue-274-public-pages-ogp-sitemap-robots/` を明記。compact format（メタ情報 + 苦戦箇所 + 参照）に圧縮する。
新規 follow-up `task-issue-274-followup-001-dynamic-member-og-image.md` は full spec 構造で別立て。

### 教訓

- consumed source unassigned は **物理削除せず compact trace 化**する（過去 citation の逆引き保持）
- consumed marker は task-specification-creator skill の format に「consumed-trace template」として追加する候補
- 新規 follow-up と source trace は format を分け、grep で見分けられるようにする

---

## L-274-006: `issue-NNN` namespace は legacy-ordinal-family-register の table 行追加不要

### 苦戦点

issue-274 は `issue-NNN` 命名規約のため、`-a` / `-b` / `-c` 系の ordinal family に属さない。Current Alias Overrides / Family Summary / Task Root Path Drift Register への追加要否を毎回判断するのは認知負荷が高い。

### 採用解

過去 wave（issue-191 / issue-295 / issue-433 / issue-623 等）と同じく、`issue-NNN` namespace は ordinal family 外として **register 冒頭 NOTE 追記のみ** とし、表への新規行追加は不要と明記する。

### 教訓

- `issue-NNN` namespace は ordinal family 外 / legacy rename 対象外 / path drift 対象外 とする運用を skill の不変条件として継続
- 新規 issue ワークフローは register top NOTE に「rename / path move なし」「ordinal family 未収録のため表追加不要」を明示する 1 行のみ追加する

---

## 参照

- changelog: `.claude/skills/aiworkflow-requirements/changelog/20260517-issue274-public-pages-ogp-sitemap-robots.md`
- artifact inventory: `.claude/skills/aiworkflow-requirements/references/workflow-issue-274-public-pages-ogp-sitemap-robots-artifact-inventory.md`
- workflow root: `docs/30-workflows/issue-274-public-pages-ogp-sitemap-robots/`
- 関連 lessons: [[lessons-learned-06a-public-web-2026-04]]（route group / Promise searchParams）
