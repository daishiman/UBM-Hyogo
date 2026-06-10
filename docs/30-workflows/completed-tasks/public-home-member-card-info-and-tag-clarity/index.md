# 公開ホーム メンバーカード 情報設計 & タグ明瞭化 タスク仕様書

- task_id: `public-home-member-card-info-and-tag-clarity`
- 実装区分: **[実装区分: 実装仕様書]**（CONST_004 デフォルト。判定根拠は Phase 1 参照）
- taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `edit`
- workflow_state: `implemented_local_evidence_captured`（コード実装・focused tests・local visual PNG・Phase 12 同期まで完了。staging 視覚証跡・PR は user-gated）
- relatedIssue: `null`（staging 観察起点。`https://ubm-hyogo-web-staging.daishimanju.workers.dev/` のホーム画面メンバーカードに対するユーザー報告）
- スコープ: `apps/web`（表現層）+ `apps/api`（list endpoint の field projection 拡張）+ `packages/shared`（list item zod）。**新 endpoint 追加・D1 schema 変更・Google Form 変更なし**（不変条件 #1 #5 / mvp-recovery 不変条件 #1）

## 背景（ユーザー報告の要約）

staging ホーム画面（route `/`）の「各個人の参加している事業者カード」について:

1. カードを見ても **その人が何をやっているかが分からない**。もう少し詳しく知りたいが、UI/UX として **情報過多はユーザーが見たくなくなる**ため、適切な塩梅に整えたい。
2. タグが現状 **「0 to 1」** と表示されている。正しくは **「0→1」**（矢印）。事業フェーズ **0→1 / 1→10 / 10→100** のどれかは重要情報なので表示したい。
3. **阪神などの居住地域タグはどうでもよい**。「どういうことをやっているか」が大事。
4. 一目で **名前・アイコン・何をやっているか** が分かる状態にしたい。

## 根本原因（確定 / 4 並列調査で裏取り）

| # | 症状 | 真因（表現層・データ projection） |
| --- | --- | --- |
| 1 | タグが「0 to 1」表記 | `tag_definitions` の `interest` カテゴリ label が seed 時点で `0to1`/`1to10`/`10to100`（矢印なし）。仕様正本（`01-api-schema.md` / `09b-design-tokens.md` / プロトタイプ）は一貫して **「0→1」**。**web 側に表示正規化が無く raw label を直出し**している（`TagPicker.client.tsx`）。 |
| 2 | カードで「何をやっているか」不明 | `MemberCard.tsx` が **タグを一切描画していない**（zone/status chip + occupation/location のみ）。home の `listMembers` は **`expand=tags` 未使用**。プロトタイプ（`pages-public.jsx`）は元々カードにタグ chip を slice 表示する設計だったが実装で未反映。 |
| 3 | 地域タグが事業情報と混在 | タグ表示に **category 優先度・フィルタが無い**。表示すると `region`(阪神) 等が事業情報と同列で混ざる。 |
| 4 | 事業概要がカードに無い | list endpoint の `SUMMARY_KEYS` に `businessOverview` が無く、事業概要 1 行をカードに出せない。詳細 endpoint には存在。 |

**API/D1/Form 無罪**: `expand=tags` は API 実装済み（issue-224）。businessOverview は既存 `response_fields` カラム由来で詳細 endpoint が既に返している。新 endpoint / schema / Form 変更は不要 → **表現層 + list projection 拡張で解決**。

## 方針（ユーザー AskUser 2 問で確定）

- **Q1 → web 表現層で表示変換**: `0to1→0→1` 等の矢印正規化は apps/web の表示 util で行い、API/D1/seed は非変更。
- **Q2 → タグ + 事業概要 1 行も追加**: curated タグ chip（事業フェーズ強調 + 業種/スキル数件・地域非表示）に加え、`businessOverview` の先頭 1 行をカードに表示。list endpoint の field projection に `businessSummary`（truncate）を追加（既存 endpoint・既存カラム）。

## スコープ（本サイクル完結＝AC-1..AC-9）

| Lane | 内容 | 主な変更ファイル |
| --- | --- | --- |
| A: web 表現層 | タグ表示 util（矢印正規化 + category 優先/フィルタ）/ MemberCard 改修（curated タグ chip + business summary 行 + occupation 視認性）/ TagPicker 正規化 / CSS | `apps/web/src/lib/tags/tag-display.ts`（新規）, `apps/web/src/components/public/MemberCard.tsx`, `apps/web/src/components/public/TagPicker.client.tsx`, `apps/web/src/styles/legacy-public.css` |
| A: web 接続 | home `/` と /members で `expand=tags` を有効化 | `apps/web/src/lib/url/members-search.ts`, `apps/web/app/(public)/page.tsx` |
| B: api projection | list endpoint に `businessSummary`（`businessOverview` 先頭 1 行・server cap 120 文字）追加 | `apps/api/src/use-cases/public/list-public-members.ts`, `apps/api/src/view-models/public/public-member-list-view.ts` |
| B: shared 型 | `PublicMemberListItem` に optional `businessSummary` | `packages/shared/src/zod/viewmodel.ts` |
| test | web: util / MemberCard / TagPicker / query spec。api: use-case spec | `apps/web/src/lib/tags/__tests__/tag-display.spec.ts`, `apps/web/src/components/public/__tests__/MemberCard*.spec.tsx`, `apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx`, `apps/web/src/lib/url/__tests__/members-search.spec.ts`, `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` |

## スコープ外（先送りではなく本質的に範囲外）

- タグの **category 正規分類 / master 再設計**（admin 側 tag catalog）: 既存 category で足りるため不要。
- **ubmZone chip の表記**（form field 由来。タグとは別系）: ユーザー報告は member_tags の interest label が対象。ubmZone は現行挙動を維持（Phase 1 §無罪確認で根拠を明示）。
- seed データの label 修正（Q1 で web 変換を選択したため非対象）。

## Acceptance Criteria

Phase 1 の AC-1..AC-9 を正本とする。

## Phase 構成

| Phase | 内容 | 出力 |
| --- | --- | --- |
| 1 | 要件定義 | [phase-1-requirements.md](phase-1-requirements.md) |
| 2 | 設計（util / コンポーネント / CSS / lane topology） | [phase-2-design.md](phase-2-design.md) |
| 3 | 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) |
| 4 | テスト計画 | [phase-4-test-plan.md](phase-4-test-plan.md) |
| 5 | 実装手順 | [phase-5-implementation.md](phase-5-implementation.md) |
| 6 | テスト追加 | [phase-6-test-additions.md](phase-6-test-additions.md) |
| 7 | カバレッジ | [phase-7-coverage.md](phase-7-coverage.md) |
| 8 | リファクタ | [phase-8-refactor.md](phase-8-refactor.md) |
| 9 | QA | [phase-9-qa.md](phase-9-qa.md) |
| 10 | 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) |
| 11 | 手動テスト / スクリーンショット | [phase-11-manual-test.md](phase-11-manual-test.md) |
| 12 | ドキュメント同期 | [phase-12-documentation.md](phase-12-documentation.md) |
| 13 | commit / PR / release | [phase-13-pr.md](phase-13-pr.md) |

## 完了条件

AC-1..AC-9 が全 Phase に trace され、`artifacts.json` に `taskType` / `visualEvidence` / gates が記録され、
Lane A（apps/web）と Lane B（apps/api projection + packages/shared）が 1 実装サイクルで完結し、focused tests / local visual evidence / Phase 12 正本同期が記録されていること。commit / push / PR / staging screenshot は user-gated として残す。
