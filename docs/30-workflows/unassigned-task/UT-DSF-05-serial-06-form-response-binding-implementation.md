# UT-DSF-05: serial-06 Form response → MemberDetail 描画接続実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-DSF-05 |
| タスク名 | serial-06 Google Form response → /(public)/members/[id] MemberDetail 描画 |
| 優先度 | HIGH |
| 推奨Wave | Wave 2 |
| 状態 | unassigned |
| 作成日 | 2026-05-19 |
| 既存タスク組み込み | あり |
| 組み込み先 | ui-prototype-design-system-foundation / serial-06-form-response-binding |

## 目的

Google Form の実回答（`response_fields`）を `/(public)/members/[id]` の MemberDetail カードに
描画する仕組みを完成させる。UT-DSF-04（serial-05）で page skeleton まで到達した状態から、
API fetch → adapter → primitive 描画の **データ束ね層** を実装する。

API endpoint は新規追加せず、既存 `GET /public/members/:memberId` のみで完結する。
API response shape と MemberDetail 期待 props の乖離は adapter 層で吸収する。

## スコープ

### 含む

- `apps/web/app/(public)/members/[id]/page.tsx` の Server Component fetch + props 渡し
- `apps/web/src/lib/adapters/member-detail.ts` の adapter 実装（pure function）
  - `PublicMemberProfileZ`（`memberId / summary / publicSections / attendance / tags`）→ MemberDetail props 正規化
- `apps/web/src/components/public/MemberDetail.tsx` の primitive 実装（または既存 `MemberDetailSections` の wrap）
- 6 セクション（基本情報 / コンタクト / プロフィール / UBM / 興味関心 / 同意）の `SectionedFields` 構造
- `visibility === "public"` field のみ表示（UI 側防御的 filter）
- unknown field（schema 外 / 未知の `kind`）の silent skip + production console error 回避
- `notFound()` 連携（API 404 / `publishState !== "published"` 時）
- fixture seed（`apps/web/src/fixtures/public-member-profile.ts` 等）追加
- Playwright visual snapshot 1 case 取得

### 含まない

- 新規 API endpoint 追加（`GET /public/members/:memberId` 既存のみ）
- 既存 primitives の props 変更
- D1 直接アクセス / Google Form 仕様変更
- 認証必須 endpoint 追加（MemberDetail は公開のため）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 前提 | UT-DSF-04（serial-05 page routes binding） | `/(public)/members/[id]/page.tsx` skeleton + AppShell chrome 接続済み |
| 前提 | serial-00-design（完了） | adapter 設計判断（pure function / visibility filter 2重防御）の根拠 |
| 下流 | UT-DSF-06（serial-07 regression evidence） | member detail screenshot baseline 対象 |

## 苦戦箇所・知見

**API response shape ↔ MemberDetail 期待 props の乖離**: `PublicMemberProfileZ` は API 側で正規化済みだが、
プロトタイプ `pages-public.jsx` の MemberDetail は section / field 単位で描画する形状。adapter 層で
`publicSections` を 6 section（基本情報 / コンタクト / プロフィール / UBM / 興味関心 / 同意）に
group 化する責務を持たせる。adapter は **pure function**（I/O / cookie / headers 参照禁止）として
unit test 可能性を確保する。

**visibility filter の二重防御**: 正本は API 側で `visibility === "public"` のみ返却するが、UI 側でも
防御的に filter する。`visibility` 欠落時は public とみなさず skip。

**unknown field の silent skip**: Google Form 側で section / question 構造が変わると、新 `kind` が混入する
可能性。production console に error を出さず silent skip する fallback を実装。`google-form/02-result.md`
の揺らぎ吸収方針に合致。

**`notFound()` の発火条件**: API 404 / `publishState !== "published"` 相当の応答 / `memberId` 不在で
Next.js `notFound()` を呼ぶ。fetch の status 判定を Server Component 内で行い、try/catch で握り潰さない。

**fixture seed の Cloudflare Workers 互換**: `apps/web/src/fixtures/` 配下のため production bundle に
含まれてはならない。`fixtures-prod-build-exclusion`（UT-02c-followup-002 で扱う）と整合を取る。

**Server Component fetch の cache 戦略**: `fetch(url, { cache: "no-store" })` か `revalidate` を明示。
Cloudflare Workers ランタイムでの fetch は OpenNext Workers の挙動に依存する。

**MemberDetail primitive 新規 vs 既存 wrap**: 完全新規実装ではなく `MemberDetailSections`（既存）の
wrap として提供する方が新規 primitive 増加を抑えられる。Phase 2 で確定。

## 受け入れ基準

- [ ] `/(public)/members/[id]/page.tsx` が Server Component で API fetch して MemberDetail に props 渡し
- [ ] `apps/web/src/lib/adapters/member-detail.ts` が pure function として実装
- [ ] adapter の unit test（`*.spec.ts`）が green
- [ ] 6 section group 描画が `SectionedFields` 構造で機能
- [ ] `visibility === "public"` 以外の field が UI に出ない
- [ ] unknown field 出現時 production console error 0 件
- [ ] API 404 / `publishState !== "published"` で `notFound()` 発火
- [ ] fixture seed が production bundle に含まれない
- [ ] Playwright visual snapshot 1 case 取得済み
- [ ] `pnpm typecheck` / `pnpm lint` / `next build --webpack` が exit 0
- [ ] `verify-design-tokens` CI gate green

## 参照

正本仕様（Phase 1-13）:

- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-01-requirements.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-02-architecture.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-03-task-breakdown.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-04-contracts.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-05-implementation-guide.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-06-test-strategy.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-07-quality-gates.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-08-definition-of-done.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-09-risks-and-mitigations.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-10-local-verification.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-11-evidence-inventory.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-12-documentation.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-13-commit-and-pr.md`

参考:

- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`（L339-L472）
- `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx`
- `docs/00-getting-started-manual/google-form/02-result.md`
