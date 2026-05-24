# [#902] [UT-DSF-07-FU-02] /members（一覧）・/members/[id]（詳細）の production-equivalent (Cloudflare Workers staging) visual baseline 取得

## メタ情報

```yaml
task_id: UT-DSF-07-FU-02
task_name: /members（一覧）・/members/[id]（詳細）の production-equivalent (Cloudflare Workers staging) visual baseline 取得
category: 改善
target_feature: -
priority: 低
scale: 小規模
status: 未実施
source_phase: Phase 12
created_date: 2026-05-23
dependencies: []
spec_path: docs/30-workflows/unassigned-task/UT-DSF-07-FU-02-members-list-detail-staging-visual.md
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---
status: unassigned
parent: UT-DSF-07
canonical_workflow: null
---

# UT-DSF-07-FU-02: public members-list / member-detail の staging-visual baseline 拡張


## 目的

UT-DSF-07 の当初 unassigned spec のスコープは **top / public members list / public member detail / admin dashboard の 4 screens** だった（証跡: `docs/30-workflows/unassigned-task/UT-DSF-07-visual-runtime-production-equivalent-screenshots.md` §スコープ「含む」L36）。しかし実装された `staging-visual` Playwright project は **public-top / login / profile / admin-dashboard の 4 screens に縮小**され、`/members` と `/members/[id]` の staging visual baseline は未取得のまま drop された（証跡: phase-12 implementation-guide「No members-list/detail expansion in this task」、phase-13 Out of scope「members-list / member-detail の staging visual」）。

本タスクはこの差分を埋め、members-list / member-detail の **production-equivalent runtime（OpenNext bundle + Workers ランタイム）での design system 描画等価性** を補完する。UT-DSF-07 と同じく、検証対象は design system 描画の等価性であって SSR データ内容ではない。

## スコープ

### 含む

- `staging-visual` project に spec を 2 件追加:
  - `apps/web/playwright/tests/visual-staging/members-list.spec.ts`（staging URL `/members`）
  - `apps/web/playwright/tests/visual-staging/member-detail.spec.ts`（staging URL `/members/[id]` の代表 ID）
- staging URL `/members`（初期表示・filter 無し 1 ページ目）と `/members/<代表ID>` の visual baseline 取得
- baseline PNG（CI ubuntu-latest 生成 `-staging-visual-chromium-linux.png`）2 枚のコミット
- 取得した screenshot の `outputs/phase-11/`（親 UT-DSF-07 canonical workflow 配下、または本タスク昇格時の新 workflow root）への evidence 追加配置 + inventory ledger 更新
- 既存 `playwright.config.ts` の `staging-visual` project（`testMatch: /visual-staging\/.*\.spec\.ts$/`）に自動マッチさせる（config 変更は原則不要、新 spec 追加のみ）
- `.github/workflows/playwright-smoke.yml` の `staging-visual` job 名（`staging-visual (chromium, 4 screens)`）の screens 数表記更新

### 含まない

- 新規 API endpoint / D1 schema 変更 / Google Form 仕様変更（CLAUDE.md UI prototype alignment 不変条件 #1）
- production 環境への deploy（staging のみ。CLAUDE.md Cloudflare CLI 実行ルールに従い `scripts/cf.sh deploy --env staging` のみ）
- 認証後画面（profile / admin の認証後実データ描画）の取得 — これは UT-DSF-07-FU-01（認証後 staging visual）の責務
- 新規 mock fixture の追加（staging 実 API データ由来で取得する）
- local Playwright baseline の取り直し（local `visual-chromium` project は据え置き）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 前提 | UT-DSF-07 完了 | `staging-visual` project 基盤・`PLAYWRIGHT_STAGING_BASE_URL` 経路・`-staging-visual-chromium-linux.png` baseline 運用が確立済み |
| 前提 | staging に member seed データが存在 | members-list が空状態でなく、member-detail の代表 ID が解決できること。visual の安定化に必須 |
| 前提 | `/members/[id]` の安定した代表 ID | 動的ルートの baseline 固定に必要（seed 変更で壊れない代表 ID） |
| 前提 | Cloudflare staging deploy 済み（最新 bundle） | 旧 bundle で baseline を取らないこと（UT-DSF-07 phase-09 R-06） |
| 参照 | 親 canonical workflow `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/` | Phase 1-13 の設計判断・SSR データ制約・risk 一覧 |

## 苦戦箇所・知見

**member-detail は動的ルート（`[id]`）で staging seed の実データに依存 → baseline が壊れやすい**: `apps/web/app/(public)/members/[id]/page.tsx` は `export const dynamic = "force-dynamic"` + `fetchPublicOrNotFound(/public/members/${id})` で SSR fetch する。代表 ID の seed が後で変更／削除されると 404（`not-found.tsx`）に落ち、baseline が guard 画面に化ける。対策として **seed-pinned 代表データ戦略** を採る:
- staging seed に「visual baseline 専用の固定代表メンバー」を 1 件用意し、ID を spec 内に定数固定する（環境変数 `PLAYWRIGHT_MEMBER_DETAIL_ID` で上書き可能にすると seed 移行に強い）。
- もしくは members-list の SSR レスポンスから 1 件目の ID を実行時に解決して詳細へ遷移する（seed ID 非依存だが list 並び順の安定が前提）。
- いずれも seed snapshot（D1 seed の固定スナップショット）と組で運用し、seed 更新時は同一 PR で baseline も更新する。

**members-list はページネーション / tag filter で描画が変動 → 初期表示に限定する設計判断**: `apps/web/app/(public)/members/page.tsx` は `searchParams` を zod parse（`density` / `sort` / `tag` / `q` / `zone` / `status`）して `listMembers` で描画する。filter / sort / ページ送りで描画が変わり diff が過剰 fail するため、**filter 無し・1 ページ目・既定 density の初期表示のみ**を baseline 対象にする。`/members?...` の query を付けずに `/members` のみへ goto する。件数変動 flake には `maxDiffPixelRatio: 0.05` 緩和（既存 4 spec と同値）を適用。

**SSR fetch は `page.route()` で差し替え不可（Worker サーバー fetch）**: members-list / member-detail の主データは SSR（Workers サーバー側 fetch）で取得され、Playwright `page.route()` はブラウザの client-side fetch のみ intercept する（UT-DSF-07 index.md §0.3 / phase-09 R-07）。よって実 staging API データ由来になる。**検証対象は design system 描画（OKLch token / `@layer` / rhythm / primitives）の local との等価性であって、API データ内容ではない**（UT-DSF-07 と同方針）。client-side 動的要素のみ `page.route('**/api/**', route => route.continue())` で安定化する。

**baseline は CI ubuntu-latest 生成の `-staging-visual-chromium-linux.png` を正本とする**: macOS local 生成の `-darwin.png` はコミットしない（UT-DSF-07 phase-09 R-05 と整合）。font hinting / antialias の OS 差で local pass / CI fail が起きるため。初回は `playwright-smoke.yml` の `update_baselines` 系 dispatch で生成 → artifact を download → commit する 2 段階フロー。

**将来同種課題（動的ルートの visual baseline）への汎用解**: `[id]` / `[slug]` 等の動的ルートを visual baseline 化する場合は、(1) seed-pinned な固定代表データを 1 件用意して ID 定数化、(2) ID は環境変数で上書き可能にして seed 移行耐性を持たせる、(3) seed snapshot と baseline を同一 PR で更新、の 3 点をテンプレ化する。これにより本タスク以降の動的ルート visual を簡潔に解決できる。

## 受け入れ基準

### 本格 spec へ昇格する条件

- [ ] staging seed に member-detail 用の安定した代表 ID（固定）が確保できることを確認した
- [ ] members-list の初期表示（filter 無し 1 ページ目）が空状態にならない seed が staging に存在することを確認した
- [ ] `members-list.spec.ts` / `member-detail.spec.ts` を追加し、`staging-visual` project の `testMatch` に自動マッチすることを確認した
- [ ] CI ubuntu-latest 生成の `-staging-visual-chromium-linux.png` baseline 2 枚を取得・コミットした（`-darwin.png` はコミットしない）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual:staging` が staging URL に対して exit 0 / diff < 5%
- [ ] screenshot 2 枚 + metadata が `outputs/phase-11/` 配下に物理配置 + inventory ledger と整合
- [ ] `apps/web/src/` 配下で `127.0.0.1:8888` / HEX 直書き / `process.env.*` 直接参照 0 件（CLAUDE.md apps/web env アクセス不変条件）
- [ ] OpenNext Workers bundle に `[project]/...` 仮想 module specifier 混入 0 件
- [ ] `bash scripts/verify-pr-ready.sh` が exit 0
- [ ] `staging-visual` job 名の screens 数表記（4 → 6）を更新した

### 破棄する条件

- members-list / member-detail の design system 描画が UT-DSF-07 取得済み 4 screens と同一 primitives 群で構成され、追加 visual evidence の費用対効果が無いと判断された場合は `status: superseded` に変更する。

## 参照

親 unassigned spec（当初 4 screens スコープの証跡）:

- `docs/30-workflows/unassigned-task/UT-DSF-07-visual-runtime-production-equivalent-screenshots.md`

親 canonical workflow（縮小経緯・SSR データ制約・risk）:

- `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/outputs/phase-12/implementation-guide.md`（"No members-list/detail expansion in this task"）
- `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/phase-13-commit-pr-draft.md`（Out of scope「members-list / member-detail の staging visual」/「設計上の重要判断（SSR データ制約）」）
- `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/phase-09-risks.md`（R-02 SSR データ揺れ / R-04 baseline drift / R-05 OS 差 / R-07 page.route 誤解）

実装:

- `apps/web/playwright/tests/visual-staging/{public-top,login,profile,admin-dashboard}.spec.ts`（既存 4 spec）
- `apps/web/playwright.config.ts`（`staging-visual` project / `isStagingVisual` 分岐 / `testMatch: /visual-staging\/.*\.spec\.ts$/`）
- `.github/workflows/playwright-smoke.yml`（`staging-visual` job）
- `apps/web/app/(public)/members/page.tsx`（一覧 Server Component / `searchParams` zod parse / `listMembers`）
- `apps/web/app/(public)/members/[id]/page.tsx`（詳細 Server Component / `dynamic = "force-dynamic"` / `fetchPublicOrNotFound`）

参考:

- `scripts/cf.sh`（Cloudflare CLI wrapper・`wrangler` 直接呼び出し禁止）
- `scripts/verify-pr-ready.sh`
- `apps/web/wrangler.toml`（`[env.staging]` 設定）
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
- `.claude/skills/task-specification-creator/references/unassigned-task-required-sections.md` §8（単一ファイル proto-spec フォーマット）
- CLAUDE.md「UI prototype alignment 不変条件（19 routes）」「apps/web env アクセス不変条件」「Cloudflare 系 CLI 実行ルール」
