# Phase 1: 要件定義 — ut-web-cov-02-public-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-02-public-components-coverage |
| phase | 1 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

apps/web の public component 群と feedback/EmptyState に対して Vitest unit test を新規追加し、coverage を Stmts/Lines/Funcs ≥85% / Branches ≥80% に引き上げる。実装範囲・受入条件・依存・approval gate を確定する。

## 対象実装ファイル / 対象テストファイル一覧

| 対象実装ファイル | 追加するテストファイル | 現値 | 目標 |
| --- | --- | --- | --- |
| apps/web/src/components/public/Hero.tsx | apps/web/src/components/public/__tests__/Hero.test.tsx | 0% | ≥85% |
| apps/web/src/components/public/MemberCard.tsx | apps/web/src/components/public/__tests__/MemberCard.test.tsx | 0% | ≥85% |
| apps/web/src/components/public/ProfileHero.tsx | apps/web/src/components/public/__tests__/ProfileHero.test.tsx | 0% | ≥85% |
| apps/web/src/components/public/StatCard.tsx | apps/web/src/components/public/__tests__/StatCard.test.tsx | 0% | ≥85% |
| apps/web/src/components/public/Timeline.tsx | apps/web/src/components/public/__tests__/Timeline.test.tsx | 0% | ≥85% |
| apps/web/src/components/public/FormPreviewSections.tsx | apps/web/src/components/public/__tests__/FormPreviewSections.test.tsx | 0% | ≥85% |
| apps/web/src/components/feedback/EmptyState.tsx | apps/web/src/components/feedback/__tests__/EmptyState.test.tsx | 0% | ≥85% |

> 注: `apps/web/package.json` の workspace name は `@ubm-hyogo/web`。実行コマンドは全 Phase で `pnpm --filter @ubm-hyogo/web ...` に統一する。

## 受入条件 (AC)

| ID | 内容 | 検証方法 |
| --- | --- | --- |
| AC-1 | 7 ファイル各々で Stmts/Lines/Funcs ≥85% / Branches ≥80% | `apps/web/coverage/coverage-summary.json` の per-file 数値 |
| AC-2 | 各 component に happy / empty-or-null-data / interaction-or-prop-variant の最低 3 ケース | テストファイル内 describe/it 数 |
| AC-3 | `toMatchSnapshot()` 非依存。明示 `expect(...).toBe/toHaveTextContent/toHaveAttribute` のみ | grep -r "toMatchSnapshot" → 0 件 |
| AC-4 | 既存 web test に regression なし | `mise exec -- pnpm --filter @ubm-hyogo/web test` が green |
| AC-5 | apps/web から D1 への直接アクセスを test 内で行わない (不変条件 #6) | テスト import から `D1Database` / `getDb` 不在 |
| AC-6 | shared package を mock せず実体を import (越境テストではなく契約利用) | `vi.mock("@ubm-hyogo/shared")` 不在 |

## 依存 (Depends On / Blocks)

- Depends On: 04a-parallel-public-directory-api-endpoints (型 `PublicMemberListItemZ` / `PublicStatsViewZ` / `FormPreviewViewZ` の固定)
- Blocks: 09a-A-staging-deploy-smoke-execution (coverage gate を満たさないと smoke 前段で fail)

## blocker / 自走禁止操作

- 本タスクは implemented-local / implementation / NON_VISUAL の coverage hardening タスクであり、実装テストと Phase 11 実測 evidence まで含める。commit、push、PR 作成はユーザー明示指示後のみ実行する。
- coverage 目標未達時の `coverage.exclude` 追記による数値合わせは禁止 (Phase 3 でレビュー)。
- shared 型定義の改変は越境のため禁止 (不変条件 #5)。

## evidence path

| 種別 | パス |
| --- | --- |
| baseline coverage | apps/web/coverage/coverage-summary.json (2026-05-01 実測, lines=39.39%) |
| 実装後 coverage | apps/web/coverage/coverage-summary.json (Phase 11 実測) |
| テストランログ | outputs/phase-11/test-run.log |

## approval gate

| ゲート | タイミング | 承認者 |
| --- | --- | --- |
| coverage 目標達成確認 | Phase 11 完了時 | user |
| PR 作成 | Phase 13 開始時 | user |

## 多角的チェック観点

- 不変条件 #2: responseId/memberId separation — テスト内で混同しない (MemberCard/ProfileHero は memberId のみ使用)
- 不変条件 #5: public/member/admin boundary — public component のみ対象。member/admin は scope out
- 不変条件 #6: apps/web D1 direct access forbidden — mock も含めて DB binding を import しない
- 未実装/未実測を PASS と扱わない
- Phase 11 の実測 evidence を正本として扱う

## サブタスク管理

- [ ] 実コンポーネント API (props, exports) を Phase 2 設計に反映済み
- [ ] AC と evidence path を対応付け済み
- [ ] approval gate を明記済み
- [ ] outputs/phase-01/main.md を作成済み

## 成果物

- outputs/phase-01/main.md

## 完了条件

- 全対象 Stmts/Lines/Funcs ≥85% / Branches ≥80%
- 各 component に happy / empty-or-null-data / interaction-or-prop-variant の最低 3 ケース
- snapshot 依存ではなく明示 assertion
- 既存 web test に regression なし

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 対象 7 ファイルの存在と props 構造を実コードで確認済み
- [x] taskType=implementation と整合し、implementation evidence は Phase 11 に保存されている

## 次 Phase への引き渡し

Phase 2 へ、対象ファイル一覧、AC、依存型 (`PublicMemberListItemZ` / `PublicStatsViewZ` / `FormPreviewViewZ`)、Avatar 内部依存、approval gate を渡す。
