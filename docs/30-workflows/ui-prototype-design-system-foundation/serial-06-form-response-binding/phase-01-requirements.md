---
phase: 1
title: 要件定義 — Form Response → MemberDetail 描画の要件
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: draft
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
depends_on:
  - serial-00-design
  - serial-05-page-routes-blueprint-binding
---

# Phase 1 — 要件定義

[実装区分: 実装仕様書]

## 0. 前提（serial-05 完了が必須）

本 sub-workflow は `serial-05-page-routes-blueprint-binding` の完了を厳密な前提とする。
serial-05 が以下を提供している必要がある:

1. `apps/web/app/(public)/members/[id]/page.tsx` の **skeleton route**（dynamic segment, generateMetadata, Server Component 既定）
2. `(public)` AppShell（parallel-03）と PublicHeader / PublicFooter（既存）の chrome 接続
3. `MemberDetailSections` 等の primitive 群が組み立て可能な状態であること

serial-05 が完了していない場合、本 sub-workflow の Phase 5（実装ガイド）以降は実行不可とする。

## 1. 解決すべき要件

Google Form の実回答（`response_fields`）を `/(public)/members/[id]` の MemberDetail カードに描画する仕組みを完成させる。
serial-05 で page skeleton まで到達した状態から、API fetch → adapter → primitive 描画の **データ束ね層** を実装する。

### 1.1 機能要件

| ID | 要件 | 根拠 |
|----|------|------|
| FR-01 | `apps/web/app/(public)/members/[id]/page.tsx` が Server Component で `GET /public/members/:id` を fetch し、結果を `MemberDetail` に props 渡しする | 09e blueprint L339-L472 |
| FR-02 | API response（`PublicMemberProfileZ`: `memberId / summary / publicSections / attendance / tags`）を MemberDetail props 形状に正規化する adapter を `apps/web/src/lib/adapters/member-detail.ts` に実装する | NFR-03（既存 API endpoint surface のみ接続） |
| FR-03 | `MemberDetail` primitive を `apps/web/src/components/public/MemberDetail.tsx` に新規実装または既存 `MemberDetailSections` をラップする形で提供する | 09e L339-L472 |
| FR-04 | 6 セクション（基本情報 / コンタクト / プロフィール / UBM / 興味関心 / 同意）を `SectionedFields` 構造で section grouping して描画する | 01-api-schema.md sectionCount=6 |
| FR-05 | `visibility === "public"` の field のみ表示する。UI 側で防御的に filter を実装する（正本は API 側） | 不変条件 #5（API 経由のみで取得した shape のみ render） |
| FR-06 | unknown field（schema 外 / 未知の `kind`）出現時は **silent skip** し、production console に error を出さない fallback を実装する | google-form/02-result.md 揺らぎ吸収 |
| FR-07 | `notFound()` 連携: API が 404 を返した場合 / `publishState !== "published"` 相当の応答時は Next.js `notFound()` を呼ぶ | 09e blueprint AC-4 |
| FR-08 | fixture seed（`apps/web/src/fixtures/public-member-profile.ts` 等）を追加し、Playwright visual snapshot で 1 case を取得する | Phase 11 evidence |

### 1.2 非機能要件

| ID | 要件 |
|----|------|
| NFR-01 | OKLch トークン正本性を維持。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止 |
| NFR-02 | `apps/web` から D1 binding 直接アクセス禁止 |
| NFR-03 | 既存 API endpoint surface（`GET /public/members/:memberId`）のみ接続。新規 endpoint 追加禁止 |
| NFR-04 | 既存 primitives の props を変更しない。新規 primitive を生やさない |
| NFR-05 | Cloudflare Workers 互換 build（`next build --webpack`）が green |
| NFR-06 | `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` が exit 0 |
| NFR-07 | テスト suffix は `*.spec.{ts,tsx}` のみ |
| NFR-08 | adapter は pure function とし、I/O・cookie・headers 参照を含まない（unit test 可能性） |

### 1.3 ステークホルダー観点（要件レビュー）

| 系統 | 観点 |
|------|------|
| システム系 | API は既に動いている（serial-05 まで）が、UI から「適切な shape で受け取り適切な primitive へ流す」層が未整備。本 sub-workflow は **bridge** 層（adapter）のみを増設し、API / primitive 双方の API を変更しない |
| 戦略・価値系 | ユーザーが「自分の回答が公開ページに反映される」体験は MVP 中核体験。これが欠けると会員サイトの存在意義が成立しない |
| 問題解決系 | 真の論点は「API response shape ↔ MemberDetail 期待 props の乖離をどう吸収するか」。endpoint を新設するのではなく adapter 層で正規化する |

## 2. 不変条件

CLAUDE.md「UI prototype alignment / MVP recovery」セクションの不変条件 1〜4 を継承し、追加で以下:

1. 既存 API endpoint のみ接続
2. OKLch トークン正本化
3. プロトタイプ正本順位（claude-design-prototype/pages-public.jsx の MemberDetail を見た目の正本とする）
4. D1 直接アクセス禁止
5. visibility filter は UI 側で防御的に実装するが、正本は API 側（既存）。UI 側 filter は二重防御として配置
6. adapter は pure function（NFR-08 と同義、不変条件として再掲）

## 3. スコープ境界

### IN

- `apps/web/app/(public)/members/[id]/page.tsx` の fetch / props 配線
- `apps/web/src/components/public/MemberDetail.tsx` の新規実装または編集
- `apps/web/src/lib/adapters/member-detail.ts` 新規
- `apps/web/src/fixtures/public-member-profile.ts` 追加（fixture）
- Playwright visual spec 1 case 追加
- adapter unit spec 1 ファイル追加

### OUT

- `apps/api/` の endpoint 追加・変更
- D1 schema / migrations 変更
- 既存 primitives（`MemberDetailSections` / `MemberCard` 等）の props 変更
- Google Form schema 変更
- 認証連携（`/login` 経由の private fields 表示は対象外）

## 4. 受け入れ条件（タスク完了基準）

1. 実 Google Form 回答相当の fixture で描画確認できる
2. `visibility === "member"` / `visibility === "admin"` の field が画面に出ない（Playwright assertion）
3. unknown `kind` field 出現時に画面が壊れない（unit test）
4. 既存 API endpoint shape 変更なし
5. CI gate 群（`verify-design-tokens` / `playwright-smoke` / `verify-test-suffix`）が green

## 5. 参照

- `docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md`
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
- `packages/shared/src/zod/viewmodel.ts`（`PublicMemberProfileZ`）
- `apps/web/src/components/public/MemberDetailSections.tsx`
