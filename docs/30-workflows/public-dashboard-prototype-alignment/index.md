# public-dashboard-prototype-alignment

> Branch: `feat/dashboard-prototype-alignment`
> 実装区分: **実装仕様書** (CONST_004 デフォルト)
> 状態: `implementation_reviewed`
> 作成日: 2026-05-26
> task type: `UI task` / `VISUAL`
> implementation_mode: `verify_existing` (Hero / Stats / ZoneIntro / MemberGrid / Timeline 既存、About のみ新規)

## 背景

公開トップ `/` (`apps/web/app/page.tsx`) は task-11 (`ui-prototype-alignment-mvp-recovery/05-screens-public`) で `Hero / Stats / ZoneIntro / Timeline / MemberGrid / CallToActionCTA` を最小構成で導入したが、プロトタイプ正本 (`docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` 内 `LandingPage` L4-152) と比較して以下の構造的 gap が残っている。

1. Hero が blue/green gradient の panel で、プロトタイプの「card-on-canvas + radial accent + serif h1 + eyebrow」と乖離
2. Stats が `total / public / zones / sync` の 4 stat に対しプロトは `Members / Zones / Meetings/yr / Last sync` で、`stat-sub` 補足 1 行と `badge-sync` チップが欠落
3. プロトの About カード (UBM コミュニティ説明) + Three Zones row-list が **未実装**
4. Featured Members セクションが `members.items.length === 0` のとき非表示。プロトは「eyebrow + h2 + 全員見るCTA」を **件数 0 でも維持** する
5. Timeline が `eyebrow / chip / note / attendees` を持たず単純な `<ol>` 表示
6. 公開トップ用の CSS (`legacy-public.css`) に hero card / stat-sub / about-grid / featured / timeline 拡張のスタイルが不足

本ワークフローはこの 6 gap を **1 PR / 1 サイクル** で解消し、`/` の見た目をプロトタイプに整合させる。新規 API・D1 schema 変更・新 endpoint 追加は一切伴わない。

## スコープ

### スコープ内 (1 route)

| Route | プロトタイプ正本 (`pages-public.jsx`) | 現状 | 作業区分 |
| ----- | ------------------------------------- | ---- | -------- |
| `/` (Landing) | `LandingPage` L4-152 | 6 component で構成済 | `verify_existing` (整合修正 + About 1 component 新規) |

### スコープ外 (本サイクル内で対応しない)

| 項目 | 理由 |
| ---- | ---- |
| `/members` 一覧 / `/members/[id]` 詳細 | 別画面。public 公開系の整合は本サイクルでは `/` のみに限定 |
| `/login` / `/profile` / `/register` / `/privacy` / `/terms` | 本タスク対象外 |
| 新規 API endpoint 追加 / D1 schema 変更 | CLAUDE.md 不変条件 #5 / UI alignment スコープ外 |
| Google Form schema 変更 | 不変条件 #1 |
| `/public/stats` `/public/members` response shape 拡張 | API 不変が前提。`meetings/year`、`attendees`、`note` 等の追加フィールドは UI 側 fallback / placeholder で吸収 |
| `lastSync` を「数分前」相対表現にする UX | 既存 `lastSyncLabel` (`toLocaleDateString`) を維持。relative time formatter 導入は別タスク |
| `/(public)/error` `/(public)/loading` boundary 設計 | 別 workflow (`issue-880`) で完了済 |
| 新規 npm package 追加 | dependency policy に従い禁止 |

## 不変条件 (本ワークフロー固有)

1. **既存 API のみ接続**: `apps/api/src/routes/public/**` の現行 endpoint surface のみ。新 endpoint 禁止。
2. **OKLch トークン正本化**: `apps/web/src/styles/tokens.css` (`--ubm-color-*`) を正本。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。
3. **プロトタイプ正本順位**: `docs/00-getting-started-manual/claude-design-prototype/{pages-public.jsx, primitives.jsx, styles.css}` の primitive + token + spacing をデザイン言語の正本とする。
4. **D1 直接アクセス禁止**: `apps/web` から D1 binding 禁止 (CLAUDE.md #5)。
5. **env アクセス**: `apps/web/src/lib/env.ts` の `getEnv()` / `getPublicEnv()` 経由のみ。`process.env.*` 直参照禁止。
6. **テスト命名**: `*.spec.{ts,tsx}` のみ (CLAUDE.md #8)。
7. **data shape fallback**: API response に prototype 必須項目 (e.g. `note`, `attendees`, `meetingsPerYear`) が無い場合は **静的 placeholder** または **graceful omit** で吸収し、API を改変しない。
8. **新規 component は public 直下に PascalCase で配置**: `apps/web/src/components/public/AboutUbm.tsx`。`features/public/components/_shared/` は今回作らない（admin と異なり public は 1 route のため 1 階層で十分）。

## 正本順位 (衝突時)

1. このワークフローの `phase-1-requirements.md` / `phase-2-design.md`
2. `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/05-screens-public/task-11-w3-par-public-home-and-headers.md`
3. `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`
4. プロトタイプ (`docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` L4-152)
5. `apps/web/src/styles/tokens.css`

## Phase 一覧

| Phase | File | 内容 |
| ----- | ---- | ---- |
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義 (inventory・命名・P50・GAP リスト) |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計 (component contract・data fallback・CSS layout) |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー (Gate-A) |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画 (vitest / Playwright) |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順 (lane 構成) |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト拡充 |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ確認 |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ |
| 9 | [phase-9-qa.md](phase-9-qa.md) | 品質保証 (typecheck / lint / build / verify-design-tokens) |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト (3 層評価 / VISUAL) |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント同期 (strict 7) |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成 (user 明示承認後) |

## 変更対象ファイル (overview)

### 新規

- `apps/web/src/components/public/AboutUbm.tsx` (About + Three Zones row-list の 2-card セクション)
- `apps/web/src/components/public/__tests__/AboutUbm.spec.tsx`
- `apps/web/src/components/public/__tests__/Hero.spec.tsx` (追加 assertion)
- `apps/web/src/components/public/__tests__/Stats.spec.tsx` (sub line / badge-sync)
- `apps/web/src/components/public/__tests__/Timeline.spec.tsx` (eyebrow / chip / note / attendees)
- `apps/web/src/components/public/__tests__/MemberGrid.spec.tsx` (featured wrapper assertion)
- `apps/web/app/__tests__/page.spec.tsx` (route-level smoke: コピー差し替え + 新セクション順序)

### 修正

- `apps/web/app/page.tsx` (Hero copy + eyebrow / About 配線 / Featured wrapper / Timeline props 拡張)
- `apps/web/src/components/public/Hero.tsx` (card-on-canvas + radial accent + serif h1 + eyebrow / primary CTA `メンバー一覧を見る` / secondary CTA `会員ログイン`)
- `apps/web/src/components/public/Stats.tsx` (label 4 種を `Members / Zones / Meetings/yr / Last sync` に整合、各 `data-role="sub"` 1 行追加、sync は `badge-sync` チップ)
- `apps/web/src/components/public/ZoneIntro.tsx` (About と並ぶ 2 列構成に必要な props / variant 対応。または `AboutUbm` 内に row-list を吸収し `ZoneIntro` は単独 fallback として残す — Phase 2 で判定)
- `apps/web/src/components/public/MemberGrid.tsx` か 上位 wrapper (`FeaturedMembers` 化を含む) (eyebrow `FEATURED MEMBERS` + h2 + 全員見る CTA + 件数 0 でも heading 維持)
- `apps/web/src/components/public/Timeline.tsx` (eyebrow `RECENT MEETINGS` + h2 + chip `毎月第2木曜開催` + tl-row + note / attendees graceful fallback)
- `apps/web/src/styles/legacy-public.css` (hero card / stat-sub / about-grid / featured-grid / timeline tl-row のスタイル追加)

### 影響範囲

- 共通: `apps/web/src/components/public/CallToActionCTA.tsx` (流用のみ・変更禁止)
- 共通: `apps/web/src/components/public/PublicHeader.tsx` / `PublicFooter.tsx` (流用のみ)
- 既存: `apps/web/src/components/public/MemberCard.tsx` (流用のみ、density / list mode は不変)

## 完了条件 (DoD overview)

1. `/` がプロトタイプ `LandingPage` の 6 セクション (Hero / Stats / About+ThreeZones / Featured / Recent Meetings / FOR MEMBERS CTA) を視覚的に再現
2. `pnpm typecheck` / `pnpm lint` / `pnpm build` / `pnpm --filter @ubm-hyogo/web test` 全 PASS
3. `verify-design-tokens` (CI gate) が PASS (HEX 直書き 0 件)
4. Phase 11 で 4 viewport × 1 key screen = 4 枚 + empty/full 状態 2 枚 = 計 6 枚の screenshot を取得
5. Phase 12 strict 7 成果物 (`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`) が揃う

## 関連タスク

| Task | 状態 | 関連性 |
| ---- | ---- | ------ |
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/05-screens-public/task-11-w3-par-public-home-and-headers.md` | completed | `/` の前任実装 (本タスクで verify + 整合補正) |
| `docs/30-workflows/admin-ui-prototype-alignment/` | active | 同型 workflow。テンプレ的に踏襲 |
| `docs/30-workflows/ui-prototype-design-system-foundation/` | active | OKLch token / primitive 正本側 |
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/` | completed | parent workflow |

## メモ

- 本ワークフローはコード実装を含む。`apps/web` の public ホーム差分が本 branch の実装成果物である。
- Phase 1〜13 はすべて実装仕様書として作成。docs-only 例外なし。
- 仕様書作成のみで commit / push / PR 操作はすべて user-gated。
