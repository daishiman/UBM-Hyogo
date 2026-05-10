# task-12-member-detail-register-legal

[実装区分: 実装仕様書]

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | W5（05-screens-public） |
| mode | parallel（task-11 / task-13..17 と並列可、上流 task-08/09/10 完了後に着手） |
| owner | - |
| 状態 | implemented-local / implementation / runtime evidence pending_user_approval / VISUAL_ON_EXECUTION |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| dependency order | task-08 (design-tokens-doc) / task-09 (tailwind-v4-setup) / task-10 (ui-primitives) → task-12 → task-18 (regression smoke) |
| artifact ledger | root `artifacts.json` + `outputs/artifacts.json` parity（本 review cycle で実体化） |

## purpose

公開層 4 画面 `/(public)/members/[id]`（会員詳細）, `/(public)/register`（入会登録）, `/privacy`（プライバシーポリシー）, `/terms`（利用規約）を、既存 API surface（`/public/members/:memberId`, `/public/form-preview`）と Google Form responderUrl 外部リンク経路に接続したうえで、OKLch tokens / ui-primitives（task-10）/ typography utility（task-09 prose）に揃えて再構成する。詳細ページは不変条件 #1（stableKey 経由のみ field 参照）を厳守し、register 画面は不変条件 #7（Google Form 再回答が本人更新の正規経路）に従って iframe 埋め込みを採用せず外部 link 遷移で構成する。法務 2 画面は `LegalProse` primitive を新設して typography 中心の静的レイアウトに統一する。

## why this is not a restored old task

`apps/web/app/(public)/members/[id]/page.tsx` および `apps/web/app/(public)/register/page.tsx` は既存 (M) だが、ProfileHero / MemberDetailSections / MemberTags / MemberLinks / MemberActivity / RegisterCallout / LegalProse の primitives 接続および `data-stable-key` 焼き込み、OKLch tokens 整合は未実装。`apps/web/app/privacy/page.tsx` / `apps/web/app/terms/page.tsx` は LegalProse primitive 未経由の暫定状態。本タスクは task-08/09/10 完了を前提とした新規再構成であり、過去 archive の再開ではない。

## scope in / out

### Scope In
- `apps/web/app/(public)/members/[id]/page.tsx`（M）: ProfileHero + MemberDetailSections + MemberTags + MemberLinks + MemberActivity の縦積み構成、`fetchPublicOrNotFound` 経由 + `notFound()` フォールバック
- `apps/web/app/(public)/register/page.tsx`（M）: RegisterCallout + FormPreviewSections + preview 取得失敗時 fallback（`role="alert"` + FALLBACK_RESPONDER_URL）
- `apps/web/app/privacy/page.tsx`（M）: `LegalProse` primitive で typography 構造化
- `apps/web/app/terms/page.tsx`（M）: 同上
- `apps/web/src/components/public/ProfileHero.tsx`（C/M）: Avatar + 名前 + nickname + occupation + Zone/Status Chip + location
- `apps/web/src/components/public/MemberDetailSections.tsx`（C）: publicSections を `<section data-section={key}>` + `<h2>` + KVList で展開、全 row に `data-stable-key`
- `apps/web/src/components/public/MemberTags.tsx`（C）: tags の Chip 配列、空時 `null`
- `apps/web/src/components/public/MemberLinks.tsx`（C）: url kind の field のみ抽出、`target="_blank" rel="noopener noreferrer"`
- `apps/web/src/components/public/MemberActivity.tsx`（C）: `section.key === "activity"` の timeline 表示
- `apps/web/src/components/public/RegisterCallout.tsx`（C）: responderUrl 外部 CTA + publicConsent / rulesConsent 説明
- `apps/web/src/components/public/FormPreviewSections.tsx`（M）: sectionCount / fieldCount / 各 section field 概要
- `apps/web/src/components/legal/LegalProse.tsx`（C）: `<article className="prose" data-component="legal-prose">` の薄い wrapper
- vitest 単体テスト群（MemberDetailSections / MemberLinks / MemberTags / RegisterCallout / LegalProse / FormPreviewSections）
- `apps/web/playwright/tests/public-detail-register-legal.spec.ts`（C）: 4 ページ + 404 page の Playwright smoke + axe critical=0

### Scope Out
- `/`, `/(public)/members`（一覧）の再構成: **task-11 の責務**
- 認証層 / `/profile` / 会員ダッシュボード: **task-13..14**
- 管理層 8 画面: **task-15..17**
- `apps/api/**` の新 endpoint 追加・既存 endpoint shape 変更（不変条件により禁止）
- D1 schema / Google Form schema 変更
- token 定義の追加・変更（task-08 の正本）
- ui-primitives の新規追加（task-10 の正本）
- 法務文面の最終法務確認（暫定文面のレイアウト整備のみが本 task）
- 国際化 / 多言語対応
- HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 走査 gate（**task-18 verify-design-tokens.ts** で実装）
- a11y axe 自動検証 gate（**task-18 regression-smoke** で集約）

## dependencies

### Depends On
- task-08 W4-PAR design-tokens-doc（OKLch token 表 / `--ubm-color-zone-{a..e}` / `--ubm-color-status-{member,guest,academy}` / `--ubm-typography-prose-*` の正本）
- task-09 W4-PAR tailwind-v4-setup（`prose` typography utility / token 配信）
- task-10 W4-PAR ui-primitives（`Button` / `Card` / `Badge`(Chip) / `Input` / `Select` / `Avatar` / `EmptyState` / `Field` の export）

### Blocks
- task-18 W6-SER regression-smoke（HEX 直書き走査 + 19 routes a11y / token gate の対象として `apps/web/src/components/{public,legal}/**` を取り込む）

## refs

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md`（一次原典）
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1/phase-1.md` §2.2 / §4 成功条件
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-2/phase-2.md` §1 task-12 / §3 DAG
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` §4.12 / §1.2 / §2.5
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` §6 diff scope 規律
- `docs/00-getting-started-manual/specs/01-api-schema.md`（PublicMemberProfileZ / FormPreviewViewZ）
- `docs/00-getting-started-manual/specs/09-ui-ux.md`（公開層 UI 規約）
- `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx`（ProfileHero / Sections / Tags / Links 由来）
- CLAUDE.md 不変条件 #1 / #2 / #5 / #7 / OKLch tokens 必須

## AC

1. `/(public)/members/[id]` が 200 を返し、`<header data-component="profile-hero">` / `data-section={key}` を持つ section / Tags / Links が visible（存在時）。`<h1>` 1 個、Avatar + nickname + occupation + Chip 行が描画される。
2. `/(public)/members/<不在 id>` が `fetchPublicOrNotFound` 経由の `FetchPublicNotFoundError` → `notFound()` で Next.js 404 page を返す。
3. 詳細ページの全 KV row に `data-stable-key={field.stableKey}` 属性が付く（不変条件 #1 監査）。`field.kind === "url"` の field は KVList から除外され、`MemberLinks` に集約される。
4. `/(public)/register` が 200 を返し、`<a target="_blank" rel="noopener noreferrer" href={responderUrl}>` の大型 CTA が visible。`publicConsent` / `rulesConsent` の説明 2 点が含まれる。
5. `/public/form-preview` 取得失敗時も CTA は `FALLBACK_RESPONDER_URL`（`https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform`）にフォールバックして機能し、`<p role="alert" data-role="preview-error">` が visible。
6. `/privacy` / `/terms` が 200 を返し、`<article className="prose" data-component="legal-prose">` 配下に `<h1>` 1 個 + `<h2>` 5〜6 個 + `<p>`/`<ul>` が単調増加の見出し階層で描画される。末尾に `<a href="/">トップに戻る</a>` がある。
7. `apps/web/src/components/public/MemberDetailSections.test.tsx` 等の vitest 単体テストで TC-U-01〜TC-U-12 が pass する（Statement / Branch カバレッジ ≥ 80%）。
8. `apps/web/playwright/tests/public-detail-register-legal.spec.ts` の Playwright smoke が 4 ページ + 404 ページを 200/404 想定で確認し、axe critical violation = 0 を検証する。
9. `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` / `mise exec -- pnpm --filter @ubm-hyogo/web lint` / `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/public apps/web/src/components/legal` がすべて pass する。
10. HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が `apps/web/src/components/{public,legal}/**` および `apps/web/app/(public)/{members,register}/**`, `apps/web/app/{privacy,terms}/**` から **0 件**（task-18 verify-design-tokens 走査と整合）。
11. `apps/web` 内に `D1Database` の参照 0 件（不変条件 #5）、API 取得は `apps/web/src/lib/fetch/public.ts` 経由のみ。
12. 新 endpoint 追加なし、`/public/members/:memberId` / `/public/form-preview` のみ消費（不変条件 #5 / Scope Out）。
13. 後続アンカー（`data-page="member-detail|register|privacy|terms"`, `data-component="profile-hero|register-callout|legal-prose"`, `data-section`, `data-stable-key`, `data-role="back|preview-error"`）が出力されている。

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- `outputs/artifacts.json`（root `artifacts.json` mirror。`cmp -s artifacts.json outputs/artifacts.json` で一致確認）
- `outputs/phase-01..13/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `outputs/phase-13/main.md`

## invariants touched

- #1 `stableKey` 経由でのみ field を参照（詳細ページ全 KV row に `data-stable-key` 付与）
- #2 consent キーは `publicConsent` / `rulesConsent` のみ統一（RegisterCallout 説明文）
- #5 `apps/web` から D1 直接アクセス禁止（`fetchPublic` / `fetchPublicOrNotFound` 経由のみ）
- #7 MVP では Google Form 再回答が本人更新の正式な経路（外部 link 遷移、iframe 不採用、サーバ side redirect 不採用）
- #10 無料枠を意識した revalidate（member-profile=60s / form-preview=600s）
- OKLch token 正本化（HEX 直書き禁止、`var(--ubm-color-*)` / `prose` utility 経由のみ）

## completion definition

全 13 phase 仕様書、root/output `artifacts.json` parity、Phase 12 strict 7 成果物、aiworkflow 導線、`apps/web/app/(public)/members/[id]/page.tsx` / `apps/web/app/(public)/register/page.tsx` / `apps/web/app/privacy/page.tsx` / `apps/web/app/terms/page.tsx` および `apps/web/src/components/{public,legal}/**` の実装差分が揃っている。full Playwright visual evidence、staging deploy、runtime smoke、commit、push、PR 作成はユーザー承認後に完遂する。AC 正本は本 `index.md` の 13 項目であり、Phase 7 / 10 / 12 はこの 13 項目を参照する。
