# Phase 1: 要件定義

[実装区分: 実装仕様書]

## 実行タスク

- [ ] 本 Phase の本文に記載された設計・検証・ドキュメント作業を実施する
- [ ] runtime evidence が必要な項目（vitest 実行 / Playwright smoke / staging 目視）は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md`（一次原典 §0〜8）
- `docs/00-getting-started-manual/specs/01-api-schema.md`（PublicMemberProfileZ / FormPreviewViewZ）
- `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx`（ProfileHero / Sections / Tags / Links 由来）
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-01/main.md`

## 統合テスト連携

`apps/web/playwright/tests/public-detail-register-legal.spec.ts` は本 task が新設し、`/members/{seedId}` / `/members/non-existent-id` / `/register` / `/privacy` / `/terms` の 5 ルート（4 ページ + 404）の HTTP 応答 + axe critical=0 を smoke する。seed メンバー id は既存 `apps/api/migrations` の seed が発行する固定 id を流用し、新規 seed 命令の追加は本 task 非ゴール。

## 目的

task-12 の要件を確定し、以降の Phase で扱う対象 4 画面（`/(public)/members/[id]` / `/(public)/register` / `/privacy` / `/terms`）の前提・成功条件を固める。詳細ページの `data-stable-key` 焼き込み、register の Google Form 外部リンク経路、法務 2 画面の `LegalProse` primitive 化を共通要件として明示する。

## 入力

- 一次原典 §0.1〜0.9（自己完結コンテキスト・上流シグネチャ・担当画面概念）
- ui-primitives（task-10）export: `Button` / `Card` / `Badge`(Chip) / `Avatar` / `EmptyState` / `Field`
- 既存 API: `GET /public/members/:memberId` → `PublicMemberProfileZ`、`GET /public/form-preview` → `FormPreviewViewZ`
- 既存 fetch helper: `apps/web/src/lib/fetch/public.ts` の `fetchPublic` / `fetchPublicOrNotFound` / `FetchPublicNotFoundError`
- CLAUDE.md 不変条件: #1 stableKey / #2 consent キー / #5 D1 直接アクセス禁止 / #7 Google Form 再回答 / OKLch tokens / #10 revalidate 無料枠

## 機能要件

| ID | 要件 |
| --- | --- |
| FR-01 | `/(public)/members/[id]` を `ProfileHero` + `MemberTags` + `MemberDetailSections` + `MemberLinks` + `MemberActivity` + `<a data-role="back" href="/members">` の縦積みで再構成する |
| FR-02 | 詳細ページは `fetchPublicOrNotFound("/public/members/{id}", { revalidate: 60 })` 経由で取得し、`FetchPublicNotFoundError` 捕捉時は `notFound()` を呼ぶ |
| FR-03 | `MemberDetailSections` は `publicSections` を `<section data-section={section.key}>` + `<h2>` + KVList で展開し、全 row に `data-stable-key={field.stableKey}` を付与する |
| FR-04 | `MemberDetailSections` は `field.kind === "url"` の field を除外し、`MemberLinks` に flatten 集約する。`<a target="_blank" rel="noopener noreferrer">` を必須付与する |
| FR-05 | `MemberTags` は `tags.length === 0` で `null` を返し empty section を作らない |
| FR-06 | `MemberActivity` は `section.key === "activity"` のみ timeline 描画し、なければ `null` を返す |
| FR-07 | KVList の値は `Array` の場合 `value.join(", ")`、`null` / `""` の場合 `"—"` で表示する |
| FR-08 | `/(public)/register` は `RegisterCallout`（外部 CTA + 同意説明）+ `FormPreviewSections` + ログイン誘導で構成する |
| FR-09 | `/(public)/register` は `fetchPublic("/public/form-preview", { revalidate: 600 })` を試行し、失敗時は `<p role="alert" data-role="preview-error">` を表示しつつ CTA は `FALLBACK_RESPONDER_URL` で機能させる |
| FR-10 | `RegisterCallout` の同意説明は `publicConsent` / `rulesConsent` の 2 キーのみを使い、編集 UI は置かない（外部 Google Form で回答する旨を明示） |
| FR-11 | `/privacy` / `/terms` は `LegalProse` primitive（`<article className="prose" data-component="legal-prose">`）配下に `<h1>` 1 個 + `<h2>` 5〜6 個 + `<p>` / `<ul>` を含む静的 typography で構成する |
| FR-12 | 全画面に `data-page="member-detail|register|privacy|terms"` を付与し、後続 task-18 の走査アンカーを提供する |
| FR-13 | vitest 単体テスト（MemberDetailSections / MemberLinks / MemberTags / RegisterCallout / LegalProse / FormPreviewSections）で TC-U-01〜TC-U-12 を実装する |
| FR-14 | Playwright smoke（`apps/web/playwright/tests/public-detail-register-legal.spec.ts`）で 4 ページ + 404 ページの 200/404 応答 + axe critical=0 を検証する |

## 非機能要件

| ID | 要件 |
| --- | --- |
| NFR-01 | `apps/web` から `D1Database` を import / 参照しない（不変条件 #5）。API 取得は `fetchPublic` / `fetchPublicOrNotFound` 経由のみ |
| NFR-02 | 色は `var(--ubm-color-*)` / `var(--ubm-radius-*)` / `var(--ubm-spacing-*)` / `var(--ubm-typography-*)` token 経由のみ。HEX / `bg-[#xxx]` / `text-[#xxx]` 禁止（task-18 が走査） |
| NFR-03 | revalidate は member-profile=60s, form-preview=600s。Cloudflare 無料枠を逸脱しない |
| NFR-04 | 外部リンク（Google Form responderUrl）は `target="_blank" rel="noopener noreferrer"` を必須付与（OWASP / a11y） |
| NFR-05 | iframe 埋め込みは禁止、サーバ side redirect も採用しない（不変条件 #7） |
| NFR-06 | Cloudflare Workers 上では `env.API_SERVICE.fetch(...)` を介し、ローカルでは `${PUBLIC_API_BASE_URL}` 直叩き。`apps/web/src/lib/fetch/public.ts` の既存実装を変更しない |
| NFR-07 | `<h1>` は各画面 1 個に限定、`<h2>` への階層は単調増加で skip しない |
| NFR-08 | `data-stable-key` 属性は **全 KV row** に必須付与（不変条件 #1 監査対象） |
| NFR-09 | new ui-primitive を本 task で生やさない（task-10 export のみ消費）。`LegalProse` は legal 専用 wrapper として `apps/web/src/components/legal/` に配置し、`@/components/ui` には登録しない |
| NFR-10 | `pnpm` は `mise exec -- pnpm` 経由で実行する（CLAUDE.md「よく使うコマンド」）。Cloudflare 系 CLI は `bash scripts/cf.sh` 経由（直接 wrangler 禁止） |

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| implementationStatus | implemented-local-runtime-evidence-pending |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflowState | implemented-local |

## スコープ判定

- taskType: **implementation**（4 page + 7 components + 1 primitive + 6 vitest + 1 e2e のコード変更を伴う）
- visualEvidence: **VISUAL_ON_EXECUTION**（staging 上で 4 画面を目視 + Playwright report で確認）
- 境界判定: 本ディレクトリは implementation specification。`apps/web` コード実装と focused local gate は本サイクルで反映し、full Playwright visual evidence、staging deploy、runtime smoke、commit、push、PR はユーザー承認後に完了させる。未実行 evidence を PASS と扱わない（CONST_007 先送りなし）。

## 完了条件

- [ ] 上記 FR-01〜14 / NFR-01〜10 が AC（index.md）と整合
- [ ] `taskType` / `visualEvidence` / `implementation_status` を `artifacts.json.metadata` に記録済み
- [ ] 一次原典 §0〜8 / phase-1〜3 / 09-ui-ux.md / 01-api-schema.md への参照行が記録されている
- [ ] 不変条件 #1 / #2 / #5 / #7 / #10 + OKLch tokens の遵守方法が FR / NFR 表に紐付いている
