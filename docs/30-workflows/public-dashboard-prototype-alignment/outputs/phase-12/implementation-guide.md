---
実装区分: 実装成果物
状態: implementation_reviewed
Phase: 12
作成日: 2026-05-26
task_id: public-dashboard-prototype-alignment
親: [../../phase-12-documentation.md](../../phase-12-documentation.md)
---

# Implementation Guide (Phase 12-1)

> 状態: `implementation_reviewed`。本レビューサイクルで実コード・テスト・Phase 11 evidence spec まで反映済み。PNG 生成のみローカル Next dev runtime の応答待ちで未完了。

## Part 1: 概念 (中学生レベル)

### この PR で何を変える?

ホーム画面 (`/`) の見た目を、デザインのお手本 (prototype) にきれいに合わせる。

### なぜ必要か?

お手本どおりの「説明カード (About)」や「最近の支部会一覧 (Timeline)」の見せ方が、まだ実装されていなかったため。Hero の見出しや Stats の見せ方も少しズレていた。

### どうやって直す?

- 一番上の Hero (見せ場) をカード型にして、丸い装飾を加える
- UBM の説明カードを 2 枚並べた新セクションを追加する
- 最近の支部会の一覧を、お手本どおりに見やすく整える
- 「members が 0 件」「meetings が 0 件」のときも、見出しは消えずに「まだありません」表示が出るようにする

### 例え話

本屋さんの店頭ディスプレイを、本部からもらったデザイン見本どおりに作り直す。本 (= データ) は変えず、置き方と看板だけを整える。

### 影響範囲

- 誰でも見られるトップページ (`/`) のみ
- 会員専用ページ / 管理画面には影響しない
- 認証 / 権限 / DB / API は一切変更していない

---

## Part 2: 技術詳細

### アーキテクチャ変更

- 新規 1 component: `apps/web/src/components/public/AboutUbm.tsx`
- 改修 4 component: `Hero.tsx` / `Stats.tsx` / `Timeline.tsx` / `MemberGrid.tsx`
- 新規 CSS 追加 (既存値変更なし): `apps/web/src/styles/legacy-public.css` 末尾 append
- `apps/web/app/page.tsx`: section 配線を `Hero / Stats / AboutUbm / Featured / Timeline / CTA` に変更。`ZoneIntro` は call を削除 (ファイル自体は保持)

### ファイル変更一覧

| Path | 種別 | 内容 |
| --- | --- | --- |
| `apps/web/app/page.tsx` | M | section 配線変更、Featured wrapper inline、empty fallback |
| `apps/web/src/components/public/Hero.tsx` | M | `variant="card"` 既定、radial accent 追加 |
| `apps/web/src/components/public/Stats.tsx` | M | `data-role="sub"` + `badge-sync` 構造追加 |
| `apps/web/src/components/public/AboutUbm.tsx` | A | 新規 (2-card layout) |
| `apps/web/src/components/public/Timeline.tsx` | M | `tl-row` layout、`note` / `attendees` graceful fallback |
| `apps/web/src/components/public/MemberGrid.tsx` | no-op | empty fallback は上位 `featured-members` wrapper で実装 |
| `apps/web/src/styles/legacy-public.css` | M (append only) | Hero/Stats/About/Timeline 用 selector 追加 |
| `apps/web/src/components/public/__tests__/*.spec.tsx` | A/M | component TC |
| `apps/web/playwright/tests/public-dashboard-prototype-alignment.spec.ts` | A | 4 viewport + empty state screenshot evidence |
| `scripts/e2e-mock-api.mjs` | M | Phase 11 empty/full 状態 seed 制御 |

### API 変更予定

**なし**。`apps/api/src/routes/**` への変更は 0 件に固定する。新規 endpoint 追加 0 件 (不変条件 #1 / W1)。

### DB / schema 変更予定

**なし** (CLAUDE.md #5)。

### 認証 / 権限変更予定

**なし**。`/` は public route。

### token / design system

- OKLch token 整合のみ
- `tokens.css` の **既存値変更なし**
- 不足時のみ追加候補: `--ubm-spacing-grid` / `--ubm-spacing-section` / `--ubm-font-serif` / `--ubm-color-text-muted` / `--ubm-color-border` (Phase 9 で確認し、不在かつ既存 token で吸収できない場合のみ追加)
- HEX 直書き 0 件を `verify-design-tokens` で確認する

### 不変条件遵守

| # | 条件 | 根拠 |
| --- | --- | --- |
| #1 | Form schema 不変 | API / D1 / Google Form を変更しない |
| #5 | D1 直接アクセスなし | `apps/web` から D1 binding を参照しない |
| #8 | `*.spec.*` のみ | 新規 test は `.spec.tsx` |
| W1 | API endpoint 追加禁止 | `apps/api` を変更しない |
| W2 | HEX 直書き禁止 | verify-design-tokens で確認 |
| W3 | prototype 正本順位 | pages-public.jsx L4-152 と整合 |
| W4 | API contract 拡張禁止 | `note` / `attendees` は local interface optional |

### 既知の制約 (本 PR で対応しない)

| # | 内容 | 管理 |
| --- | --- | --- |
| FU-1 | `Last sync` を relative time formatter で「数分前」表現 | scope-out。固定 label / 既存 `lastSyncLabel` の範囲で吸収 |
| FU-2 | `Meetings/yr` を API から取得 | API 拡張不可。`MEETINGS_PER_YEAR=12` の UI 定数で吸収 |
| FU-3 | Hero serif を web font で配信 | dependency 影響。system serif fallback で吸収 |
| FU-4 | `ZoneIntro.tsx` を将来削除 | call 削除のみ。物理削除は実装 wave で不要と判定 |

### 検証方法

- typecheck / verify-design-tokens / vitest / verify-phase12-compliance: 本レビューで exit 0 を確認済み
- Component unit: TC-HERO/STATS/ABOUT/TL/MG (Phase 4 §3-7)
- Page test: `app/page.spec.tsx` (TC-PAGE-*)
- Playwright smoke: evidence spec 追加済み。ローカル Next dev の初回 compile 応答待ちで PNG 生成は未完了
- Coverage: 改修ブロック line ≥ 95%
- Manual: 6 screenshots + 3 層評価 (Semantic / Visual / AI UX) — Phase 11

### Rollback 手順

DB migration / Cloudflare resource 操作なしのため `git revert <commit>` で完結。

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 12-1
