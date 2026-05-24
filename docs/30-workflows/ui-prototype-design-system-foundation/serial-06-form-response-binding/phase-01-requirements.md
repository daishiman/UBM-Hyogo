---
phase: 1
title: 要件定義 — Form Response → MemberDetail 描画の要件
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
depends_on:
  - serial-05-page-routes-blueprint-binding
---

# Phase 1 — 要件定義

[実装区分: 実装仕様書]

## 0. 前提（serial-05 完了が必須）

本 sub-workflow は `serial-05-page-routes-blueprint-binding` の完了を厳密な前提とする。serial-05 が以下を提供している必要がある:

1. `apps/web/app/(public)/members/[id]/page.tsx` の **skeleton route**（dynamic segment, `generateMetadata`, Server Component 既定）
2. `(public)` AppShell（parallel-03）と PublicHeader / PublicFooter（既存）の chrome 接続
3. `MemberDetailSections` 等の primitive 群が組み立て可能な状態であること
4. `apps/web/app/(public)/error.tsx` / `loading.tsx` の boundary 設置

serial-05 が完了していない場合、本 sub-workflow の Phase 5（実装ガイド）以降は実行不可とする。Phase 5 §0 に precondition check（`test -f apps/web/app/\(public\)/members/\[id\]/page.tsx`）を必ず通すこと。

## 1. 解決すべき要件

Google Form の実回答（`response_fields`）を `/(public)/members/[id]` の MemberDetail カードに描画する仕組みを完成させる。serial-05 で page skeleton まで到達した状態から、API fetch → adapter → primitive 描画の **データ束ね層** を実装する。新規 endpoint・新規 primitive・新規 D1 列は一切追加しない。

### 1.1 機能要件

| ID | 要件 | 根拠 / 参照 |
|----|------|------|
| FR-01 | `apps/web/app/(public)/members/[id]/page.tsx` が Server Component で `GET /public/members/:id` を fetch し、結果を `MemberDetail` に props として渡す | `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` L339-L472 |
| FR-02 | API response（`PublicMemberProfileZ`: `memberId / summary / publicSections / attendance / tags`）を MemberDetail props 形状に正規化する adapter を `apps/web/src/lib/adapters/member-detail.ts` に実装する | NFR-03（既存 API endpoint surface のみ接続） |
| FR-03 | `MemberDetail` primitive を `apps/web/src/components/public/MemberDetail.tsx` に新規実装または編集する。内部で既存 `ProfileHero` / `MemberTags` / `MemberDetailSections` / `MemberActivity` の 4 primitive を組み立てる | 09e L339-L472 |
| FR-04 | 6 セクション（基本情報 / コンタクト / プロフィール / UBM / 興味関心 / 同意）を `SectionedFields` 構造で section grouping して描画する | `docs/00-getting-started-manual/specs/01-api-schema.md` sectionCount=6 |
| FR-05 | `visibility === "public"` の field のみ表示する。UI 側で防御的に filter を実装する（正本は API 側の `getPublicMemberProfileUseCase`） | 不変条件 #5 / 二重防御 |
| FR-06 | unknown field（schema 外 / 未知の `kind`）出現時は **silent skip** し、production console に error / warn を出さない fallback を実装する | `docs/00-getting-started-manual/google-form/02-result.md` 揺らぎ吸収 |
| FR-07 | `notFound()` 連携: API が 404 を返した場合 / `publishState !== "published"` 相当の応答時は Next.js `notFound()` を呼ぶ。500 系は throw して `(public)/error.tsx` boundary で補足する | 09e blueprint AC-4 |
| FR-08 | fixture `samplePublicMemberProfile`（`apps/web/src/fixtures/public-member-profile.ts`）を追加し、Playwright visual snapshot で 1 case を取得する | Phase 11 evidence E-01 |
| FR-09 | adapter から `visibility` / `source` プロパティを出力に含めない（UI 描画に不要 + 防御的 sanitize） | Phase 4 contract §2.1 |

### 1.2 非機能要件

| ID | 要件 |
|----|------|
| NFR-01 | OKLch トークン正本性を維持。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（CI gate `verify-design-tokens` で grep） |
| NFR-02 | `apps/web` から D1 binding 直接アクセス禁止（CLAUDE.md 不変条件 #5） |
| NFR-03 | 既存 API endpoint surface（`GET /public/members/:memberId`）のみ接続。新規 endpoint / query parameter 追加禁止 |
| NFR-04 | 既存 primitives の props を変更しない。新規 primitive を生やさない |
| NFR-05 | Cloudflare Workers 互換 build（`next build --webpack`）が green。Turbopack を production bundle に混入させない |
| NFR-06 | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `bash scripts/verify-pr-ready.sh` が exit 0 |
| NFR-07 | テスト suffix は `*.spec.{ts,tsx}` のみ（`*.test.{ts,tsx}` 禁止。CLAUDE.md 不変条件 #8） |
| NFR-08 | adapter は pure function とし、I/O・cookie・headers 参照を含まない（unit test 容易性） |
| NFR-09 | API base URL は `getEnv().NEXT_PUBLIC_API_BASE_URL` 経由のみ（task-02 wrangler-env-injection 不変条件） |

### 1.3 ステークホルダー観点（要件レビュー）

| 系統 | 観点 |
|------|------|
| システム系 | API は serial-05 までに動作しているが、UI から「適切な shape で受け取り適切な primitive へ流す」層が未整備。本 sub-workflow は **bridge** 層（adapter）のみを増設し、API / primitive 双方を変更しない |
| 戦略・価値系 | 「自分の Google Form 回答が公開ページに反映される」体験は MVP 中核体験。これが欠けると会員サイトの存在意義が崩れる |
| 問題解決系 | 真の論点は「API response shape ↔ MemberDetail 期待 props の乖離をどう吸収するか」。endpoint を新設するのではなく adapter 層で正規化する |

## 2. 不変条件

CLAUDE.md「UI prototype alignment / MVP recovery」セクションの不変条件 1〜4 を継承し、追加で以下:

1. 既存 API endpoint のみ接続（NFR-03 再掲）
2. OKLch トークン正本化（NFR-01 再掲）
3. プロトタイプ正本順位（`docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` の MemberDetail を見た目の正本とする）
4. D1 直接アクセス禁止（NFR-02 再掲）
5. visibility filter は UI 側で防御的に実装するが、正本は API 側
6. adapter は pure function（NFR-08 再掲）
7. unknown kind は silent skip（production console 汚染禁止）

## 3. スコープ境界

### IN

- `apps/web/app/(public)/members/[id]/page.tsx` の fetch / adapter / notFound 配線（編集）
- `apps/web/src/components/public/MemberDetail.tsx` の新規実装または編集
- `apps/web/src/lib/adapters/member-detail.ts` 新規
- `apps/web/src/fixtures/public-member-profile.ts` 追加
- `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` 新規（unit）
- `apps/web/playwright/tests/serial-06-member-detail.spec.ts` 新規（Playwright visual + DOM assertion）
- Phase 11 evidence inventory 取得（`outputs/phase-11/`）
- Phase 12 compliance check（canonical 9 headings）

### OUT

- `apps/api/` の endpoint 追加・変更
- D1 schema / migrations 変更
- 既存 primitives（`MemberDetailSections` / `MemberCard` 等）の props 変更
- Google Form schema / sectionCount / questionCount 変更
- 認証連携（`/login` 経由の private fields 表示は対象外。serial-08 以降で扱う）
- 4 screens visual baseline 確定（serial-07-regression-evidence に委譲）

## 4. 受け入れ条件（タスク完了基準）

1. 実 Google Form 回答相当の fixture（6 sections × 各 visibility 混在）で描画確認できる
2. `visibility === "member"` / `visibility === "admin"` の field が画面に出ない（Playwright `toHaveCount(0)` assertion）
3. unknown `kind` field 出現時に画面が壊れない（adapter unit spec で確認）
4. 既存 API endpoint shape 変更なし（`git diff dev...HEAD -- apps/api/` が空）
5. CI gate 群（`verify-design-tokens` / `playwright-smoke / smoke (chromium)` / `verify-test-suffix`）が green
6. Phase 7 G-01〜G-10 全 green
7. Phase 11 evidence E-01〜E-07 が `outputs/phase-11/` に揃う

## 5. 参照

- `docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/index.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-00-design/phase-01-requirements.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`
- `docs/00-getting-started-manual/google-form/01-design.md`
- `docs/00-getting-started-manual/google-form/02-result.md`
- `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx`
- `apps/api/src/routes/public/member-profile.ts`
- `apps/api/src/use-cases/public/get-public-member-profile.ts`
- `apps/api/src/jobs/sync-forms-responses.ts`
- `packages/shared/src/zod/viewmodel.ts`（`PublicMemberProfileZ` L150-）
- `packages/shared/src/zod/primitives.ts`（`FieldKindZ` / `FieldVisibilityZ`）
- `apps/web/src/components/public/MemberDetailSections.tsx`
- `apps/web/src/lib/env.ts`（task-02 wrangler-env-injection）
