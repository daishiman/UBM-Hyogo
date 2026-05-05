# Phase 1: 要件定義 — task-05a-form-preview-503-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-05a-form-preview-503-001 |
| phase | 1 / 13 |
| wave | 05a-fu |
| mode | sequential |
| 作成日 | 2026-05-05 |
| taskType | bug-fix / investigation |
| visualEvidence | NON_VISUAL（`/register` は curl による HTTP 200 確認で代替） |
| 起票元 | GitHub Issue #388（CLOSED 状態。再オープン不要、本仕様書で復活管理） |

## 目的

staging で `https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview` が **HTTP 503** を返す問題の root cause を特定し、staging / production 双方で 200 化する。`/register` ページが本エンドポイントに依存するため、UI 導線復旧も含む。

## 主要参照

- 本タスクの未割当タスク仕様（背景・苦戦箇所の正本）: `docs/30-workflows/unassigned-task/task-05a-form-preview-503-001.md`
- 503 発生コード: `apps/api/src/use-cases/public/get-form-preview.ts`（`UBM-5500` throw 箇所）
- エラーマップ: `packages/shared/src/errors.ts`（`UBM-5500` → `status: 503, title: "Service Unavailable"`）
- 既存テスト: `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts`（schema 欠落時の 503 ケース既存）
- フォーム正本: `docs/00-getting-started-manual/specs/01-api-schema.md`
- 不変条件: CLAUDE.md（schema 集約 / D1 直アクセス境界 / API 仕様変更禁止）

## 主要成果物

- `outputs/phase-01/main.md` を本 Phase の本文（AC・scope・不変条件）として作成。
- 詳細な AC・evidence path・approval gate は `outputs/phase-01/main.md` を正本とする。

## 実行タスク

1. staging 503 の症状、影響範囲、コード上の発生分岐を整理する。
2. AC-1〜AC-6 と evidence path を `outputs/phase-01/main.md` に固定する。
3. approval gate と自走禁止操作を明文化する。

## 参照資料

- `outputs/phase-01/main.md`
- `apps/api/src/use-cases/public/get-form-preview.ts`
- `packages/shared/src/errors.ts`
- `docs/30-workflows/unassigned-task/task-05a-form-preview-503-001.md`

## 実行手順

- 本 Phase では仕様作成のみ行い、D1 write / deploy / commit / push / PR は実行しない。
- 実測値は Phase 11 の NON_VISUAL evidence に記録する。

## 統合テスト連携

- 上流: GitHub Issue #388 / 既存 unassigned spec。
- 下流: Phase 2 設計、Phase 4 RED test、Phase 11 runtime evidence。

## 完了条件（簡略）

- staging / production の `/public/form-preview` が 200。
- staging `/register` が 200 で form preview が表示される。
- root cause（A/B/C 仮説のいずれか）が evidence 付きで確定。

## 次 Phase への引き渡し

Phase 2 へ、確定 AC・3 仮説（A/B/C）・evidence path・approval gate を渡す。
