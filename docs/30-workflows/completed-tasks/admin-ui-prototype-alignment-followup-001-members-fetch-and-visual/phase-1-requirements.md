---
spec_classification: implementation_spec
state: spec_created
phase: 1
phase_name: 要件定義
---

# Phase 1 — 要件定義

[実装区分: 実装仕様書]

親 workflow trace: `docs/30-workflows/admin-ui-prototype-alignment/`（`implemented_local_runtime_pending`）の followup-001。

## 目的

`/admin/members` 一覧 + drawer をプロトタイプ `pages-admin.jsx` (L162-366) に準拠させ、staging で発生している `ADMIN_FETCH_404` を解消し、AC を満たす admin UX を staging で確認できる状態にする。

## 前提と入力

- 観測症状: staging `/admin/members` で `読み込みに失敗 / admin api /admin/members failed: 404 / code ADMIN_FETCH_404`
- 現行実装: `apps/web/src/features/admin/components/_members/` (Table 139 行 / Filters 103 行 / Drawer 203 行 / Shell 90 行 / BulkActionBar 75 行)
- 既存 API: `GET /admin/members`（list） + `GET /admin/members/:id`（detail）。新 endpoint 禁止
- 既存 ViewModel: `AdminMemberListItem` / `AdminMemberDetailView` / `MemberProfile`
- プロトタイプ: `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L162-366
- design tokens 正本: `apps/web/src/styles/tokens.css`

## 作業手順

1. プロトタイプ抽出（page-head / filter card / table 列 / drawer body / drawer foot / primitive 依存）
2. 既存 ViewModel との gap 表を作成（occupation / ubmZone / ubmMembershipType / tags / updatedAt / hue / businessOverview / location / responseId / submittedAt）
3. 404 root cause 4 仮説を列挙し、Phase 5 T-5.1 へ転送
4. 受入条件（AC）を Gherkin で記述
5. 不変条件を CLAUDE.md から逐語転記

## 成果物

- 本 markdown
- `outputs/phase-1/requirements.md`（必要に応じ詳細化）

## 完了条件 (DoD)

- AC が 8 項目以上で定義されている
- 不変条件が CLAUDE.md から漏れなく転記されている
- 404 root cause 候補が 4 つすべて列挙されている

## 検証コマンド

```bash
mise exec -- pnpm exec node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js
mise exec -- pnpm gate-metadata:validate
```

## 想定リスク

- API レスポンスから派生する field（occupation / ubmZone 等）が `answers_json` に揃っていない場合 adapter で N/A 表記が増える → Phase 5 T-5.2 で吸収

## ロールバック

- 仕様書のみのため git revert で削除可能

## 関連 spec

- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
- プロトタイプ: `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`
- 不変条件: CLAUDE.md「UI prototype alignment / MVP recovery」「重要な不変条件」

## 不変条件（CLAUDE.md より逐語転記）

1. 既存 API endpoint surface のみ利用。新 endpoint / D1 schema 変更 / Google Form 仕様変更禁止
2. OKLch トークン正本。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（`verify-design-tokens` gate）
3. プロトタイプ正本順位（primitives + tokens + rhythm）に従う
4. D1 直接アクセスは apps/api のみ
5. 新 test は `*.spec.{ts,tsx}` のみ
6. admin form input は `FormField` 経由
7. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由

## 受入条件 (AC)

| AC | 内容 |
|----|------|
| AC-1 | staging `/admin/members` で `ADMIN_FETCH_404` が表示されず、`GET /api/admin/members` が authenticated admin session で 200 を返す |
| AC-2 | 一覧 page-head が prototype `ADMIN / MEMBERS` eyebrow、`メンバー管理` heading、説明文、CSV/Forms action row を保持する |
| AC-3 | filter card が検索 input、4 種 pill-nav（すべて / 公開中 / 非公開 / 退会済み）、件数バッジを表示する |
| AC-4 | table が avatar、氏名 + occupation、email mono、区画/status chip、tags max 2 + `+N`、最終更新、公開 switch、edit icon button を表示する |
| AC-5 | drawer head/body/footer が prototype region（avatar + identity、VISIBILITY、TAGS、FORM RESPONSE KVList、DELETED block、3 button footer）に整合する |
| AC-6 | 既存 endpoint surface のみを使い、新 API endpoint、D1 schema 変更、Google Form 仕様変更を追加しない |
| AC-7 | adapter 拡張は additive のみで、既存 `AdminMemberListItem` / `AdminMemberDetailView` consumer を破壊しない |
| AC-8 | `verify-design-tokens` が green で、HEX 直書き / Tailwind arbitrary color drift が 0 件である |
| AC-9 | Phase 11 で list + drawer の staging visual screenshot 2 枚と `/admin/members` 200 trace が `outputs/phase-11/evidence/` に `present` として配置される |
