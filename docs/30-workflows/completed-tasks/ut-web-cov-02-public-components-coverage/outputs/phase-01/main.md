# Phase 1 成果物 — ut-web-cov-02-public-components-coverage

- status: ready (spec)
- purpose: 要件定義 (scope / blocker / evidence path 確定)

## scope 確定

### 対象 (Scope In)

| # | 実装ファイル | テストファイル (新規) | 現値 | 目標 |
| --- | --- | --- | --- | --- |
| 1 | apps/web/src/components/public/Hero.tsx | apps/web/src/components/public/__tests__/Hero.test.tsx | 0% | ≥85% / Branch ≥80% |
| 2 | apps/web/src/components/public/MemberCard.tsx | apps/web/src/components/public/__tests__/MemberCard.test.tsx | 0% | 同上 |
| 3 | apps/web/src/components/public/ProfileHero.tsx | apps/web/src/components/public/__tests__/ProfileHero.test.tsx | 0% | 同上 |
| 4 | apps/web/src/components/public/StatCard.tsx | apps/web/src/components/public/__tests__/StatCard.test.tsx | 0% | 同上 |
| 5 | apps/web/src/components/public/Timeline.tsx | apps/web/src/components/public/__tests__/Timeline.test.tsx | 0% | 同上 |
| 6 | apps/web/src/components/public/FormPreviewSections.tsx | apps/web/src/components/public/__tests__/FormPreviewSections.test.tsx | 0% | 同上 |
| 7 | apps/web/src/components/feedback/EmptyState.tsx | apps/web/src/components/feedback/__tests__/EmptyState.test.tsx | 0% | 同上 |

### Scope Out

- admin component (UT-WEB-COV-01)
- UI primitives (UT-WEB-COV-04)
- production load test
- shared package の型 / Zod schema 改変

## blocker 一覧

| ID | 種別 | 内容 | 解消条件 |
| --- | --- | --- | --- |
| BL-1 | 自走禁止 | PR 作成 | Phase 13 開始時に user approval |
| BL-2 | 設計 | coverage exclude 追加禁止 | Phase 3 レビューで PASS 維持 |
| BL-3 | 不変条件 | apps/web から D1 binding を test で import 禁止 | mock マトリクスから除外済み |
| BL-4 | 環境 | `apps/web/package.json` に `test` script 不在 | Phase 5 で alias 追加 or `test -- <pattern>` 正規化 |

## evidence path 表

| 種別 | パス | 取得タイミング |
| --- | --- | --- |
| baseline coverage (起票根拠) | apps/web/coverage/coverage-summary.json | 2026-05-01 取得済み (lines=39.39%) |
| 実装後 per-file coverage | apps/web/coverage/coverage-summary.json | Phase 11 |
| テスト実行ログ | outputs/phase-11/test-run.log | Phase 11 |
| 不変条件 #6 検証ログ | outputs/phase-09/d1-import-grep.log | Phase 9 |
| snapshot 不使用検証 | outputs/phase-09/snapshot-grep.log | Phase 9 |
| shared mock 不使用検証 | outputs/phase-09/shared-mock-grep.log | Phase 9 |

## AC 対応表

| AC | 検証 evidence |
| --- | --- |
| AC-1 per-file coverage 達成 | apps/web/coverage/coverage-summary.json |
| AC-2 各 component 3 ケース以上 | 各 *.test.tsx の describe/it |
| AC-3 snapshot 非依存 | outputs/phase-09/snapshot-grep.log |
| AC-4 既存 regression なし | outputs/phase-11/test-run.log の全 suite green |
| AC-5 D1 直接アクセスなし | outputs/phase-09/d1-import-grep.log |
| AC-6 shared を mock しない | outputs/phase-09/shared-mock-grep.log (期待 0 件) |

## approval gate

| ゲート | 承認者 | タイミング |
| --- | --- | --- |
| coverage 目標達成 | user | Phase 11 後 |
| PR 作成 | user | Phase 13 開始時 |

## 引き渡し

Phase 2 設計に対して、対象ファイル一覧 / AC / blocker / evidence path / approval gate を確定。
