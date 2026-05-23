[実装区分: 実装仕様書]

# fix-verify-design-tokens-og-route-exclude

> Source PR: [#175](https://github.com/daishiman/UBM-Hyogo/pull/175)（`verify-design-tokens` CI 失敗）
> Related issue: [#806](https://github.com/daishiman/UBM-Hyogo/issues/806)（動的 member OG image route 追加元）
> Parent commit: `c10e0e39a feat(issue-806): dynamic member OG image route (#848)`（2026-05-20 merge）
> 実装区分: **実装仕様書**
> 状態: `implemented-local`
> 作成日: 2026-05-23

## 概要

PR #175 で `verify-design-tokens` GitHub Actions ジョブが失敗している。原因は `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx`（Issue #806 で追加）に含まれる HEX literal (`#1e3a8a` / `#3b82f6` / `#ffffff`) を `scripts/verify-design-tokens.ts` の color literal scan が `forbidden-color-literal` drift として検出していること。

`next/og` の `ImageResponse` は内部で satori を使用するため CSS variable (`var(--ubm-color-*)`) を解決できない。既存の `opengraph-image.tsx`（root convention）は `colorLiteralExcludes` で除外されているが、Next.js App Router の **route handler convention (`route.tsx`)** 形式は exclude pattern に含まれていない。

本タスクでは `scripts/verify-design-tokens.ts` の `colorLiteralExcludes` を route handler convention にも拡張し、false positive を解消して CI を green 化する。

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義 |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー |
| 4 | phase-4-test-plan.md | テスト計画（後続エージェント担当） |
| 5 | phase-5-implementation.md | 実装手順（後続エージェント担当） |
| 6 | phase-6-test-additions.md | テスト追加（後続エージェント担当） |
| 7 | phase-7-coverage.md | カバレッジ（後続エージェント担当） |
| 8 | phase-8-refactor.md | リファクタ（後続エージェント担当） |
| 9 | phase-9-qa.md | QA（後続エージェント担当） |
| 10 | phase-10-final-review.md | 最終レビュー（後続エージェント担当） |
| 11 | phase-11-manual-test.md | 手動テスト（後続エージェント担当） |
| 12 | phase-12-documentation.md | ドキュメント・概念説明（後続エージェント担当） |
| 13 | phase-13-pr.md | PR 作成（後続エージェント担当） |

## 変更対象ファイル

- `scripts/verify-design-tokens.ts`（修正：`colorLiteralExcludes` に route.tsx convention の 4 pattern 追加）
- `scripts/verify-design-tokens.spec.ts`（既存追記：exclude pattern の unit test）

## スコープ外

- `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` のコード変更（HEX literal は satori 制約上正当）
- 新規 design token 追加 / `tokens.css` 変更
- HEX → OKLch literal 置換による回避（drift script の精神と矛盾するため不採用。Phase 3 で根拠記述）
- 他の verify gate (`verify:phase12-compliance` / `verify-indexes-up-to-date` 等) への変更

## 不変条件

1. OKLch token 正本化方針（CLAUDE.md 「不変条件」§2）は維持する。`apps/web/src/styles/tokens.css` と `docs/00-getting-started-manual/specs/design-tokens.md` を正本とする。
2. `next/og` `ImageResponse` 配下のファイルのみを exclude 対象とする。汎用 component / route の HEX literal は引き続き drift として検出する。
3. exclude pattern は Next.js App Router の file convention（`opengraph-image` / `twitter-image` / `icon` / `apple-icon`）の `*.tsx` と `*/route.tsx` の両形式に対称に適用する。
4. `apps/web` から D1 直接アクセス禁止など、既存の他不変条件には影響しない。
