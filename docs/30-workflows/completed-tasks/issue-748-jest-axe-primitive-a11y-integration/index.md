# issue-748 jest-axe / axe-core 実 a11y test 統合（parallel-09 primitive 5 種）

[実装区分: 実装仕様書]

> **判定根拠**: 対象タスクは `apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx` への jest-axe 統合と axe rule baseline 定義を伴う。コード変更（spec 追記・rule baseline module 新設・proxy assertion 整理）が成功条件である AC-1〜AC-6 すべての達成に不可欠であり、CONST_004 に従い実装仕様書として作成する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-748-jest-axe-primitive-a11y-integration |
| 元 issue | [#748](https://github.com/daishiman/UBM-Hyogo/issues/748)（CLOSED 維持、`Refs #748` のみで参照） |
| 親 workflow | `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/`（既に完了済み・本タスクは followup 単独実装サイクル） |
| 参照仕様書 | `docs/30-workflows/unassigned-task/parallel-09-followup-003-jest-axe-real-a11y-integration.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装対象 | `apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx`; `apps/web/src/test/axe.ts`（新規） |
| 作成日 | 2026-05-17 |
| status | implemented_local_evidence_captured |

## 現状調査結果（2026-05-17）

| 観点 | 状態 |
| --- | --- |
| `jest-axe` / `@types/jest-axe` 依存 | `apps/web/package.json` に追加済み（`jest-axe@^10.0.0`, `@types/jest-axe@^3.5.9`） |
| primitive spec の jest-axe 統合 | **統合済み**。`parallel09-primitives.component.spec.tsx` は `apps/web/src/test/axe.ts` 経由で 7 件の axe violation 0 test を実行 |
| 既存 admin component の axe 利用 | `BulkActionBar` / `MembersTable` / `RecentActionsTable` / `MembersFilters` / `KpiGrid` で `axe(container)` + `results.violations.toHaveLength(0)` の **inline pattern** が採用済み |
| `expect.extend(toHaveNoViolations)` | リポジトリ全体で未使用（admin pattern は matcher を使わず violations 長で判定） |
| `vitest.config.ts` setupFiles | 未設定 |
| axe rule baseline 共有 module | `apps/web/src/test/axe.ts` として追加済み |

→ issue は本 wave の実装で **local evidence captured**。commit / push / PR は user gate。

## 実装方針サマリ

1. 既存 admin spec の inline pattern（`results.violations.toHaveLength(0)`）に揃え、`expect.extend` を新たに導入しない。これにより `vitest.config.ts` の `setupFiles` 追加も不要となり、影響範囲を spec ファイル群と新規共有 module に閉じる。
2. axe rule baseline は `apps/web/src/test/axe.ts` に集約。`configureAxe({ rules })` で jsdom false positive 系（`color-contrast` / `region` / `landmark-one-main`）を disable し、無効化理由をコメントで記述する。
3. `parallel09-primitives.component.spec.tsx` に 5 primitive / 7 scenarios の `axe` 違反 0 件 test を追加。aria 属性 assertion は axe で代替できる proxy assertion と component 固有 contract assertion に再分類し、固有契約（例: `aria-current="page"` の値、`size` の px 算出、`role="alert"` と `aria-describedby` の id 一致）は残す。
4. ローカルで focused primitive test と `pnpm --filter web test` 全体が green になることを Phase 11 evidence として記録する。CI は Phase 13 user-gated PR 作成後の確認対象とする。

## スコープ

### 含む

- `apps/web/src/test/axe.ts` の新規作成（共有 axe runner + rule baseline）
- `parallel09-primitives.component.spec.tsx` への jest-axe 統合と proxy assertion 整理
- ローカル test 通過の evidence 取得
- Phase 1-13 設計・実装・evidence・PR 仕様の同期

### 含まない

- Playwright e2e への axe-playwright 統合（別 followup）
- parallel-09 範囲外の primitive / 画面コンポーネントへの拡大適用
- Lighthouse CI a11y score 連動
- D1 schema / API endpoint 変更
- 実装サイクルでのコミット・push・PR 作成（後続プロンプトで実施）

## Phase 一覧

| Phase | ファイル | 役割 |
| --- | --- | --- |
| 1 | `outputs/phase-01.md` | 要件定義 |
| 2 | `outputs/phase-02.md` | 現状調査・stale 確認 |
| 3 | `outputs/phase-03.md` | 設計（rule baseline / spec 統合戦略） |
| 4 | `outputs/phase-04.md` | タスク分解 |
| 5 | `outputs/phase-05.md` | テスト設計 |
| 6 | `outputs/phase-06.md` | 実装手順 |
| 7 | `outputs/phase-07.md` | 検証 |
| 8 | `outputs/phase-08.md` | ロールアウト |
| 9 | `outputs/phase-09.md` | 運用・監視 |
| 10 | `outputs/phase-10.md` | ロールバック・撤退条件 |
| 11 | `outputs/phase-11.md` | evidence |
| 12 | `outputs/phase-12/main.md` | Phase 12 strict close-out |
| 13 | `outputs/phase-13.md` | PR 作成 |

## CONST_007 スコープ充足性

- 全 Phase は単一実装サイクル内で完了可能。
- 先送り項目なし。Playwright axe / Lighthouse 連動は親 followup 仕様で既に「含まない」と明示済みで、本タスクスコープに不要。
