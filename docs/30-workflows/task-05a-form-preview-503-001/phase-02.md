# Phase 2: 設計 — task-05a-form-preview-503-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-05a-form-preview-503-001 |
| phase | 2 / 13 |
| 作成日 | 2026-05-05 |
| taskType | bug-fix / investigation |

## 目的

Phase 1 で確定した AC を満たすための設計を確定する。root cause 仮説を 3 系統（A/B/C）に分解し、各々の検証手順・修正案・選定基準を明文化する。

## 主要参照

- `outputs/phase-02/main.md`（本 Phase の本文・正本）
- `apps/api/src/use-cases/public/get-form-preview.ts`
- `apps/api/src/repository/schemaVersions.ts`
- `apps/api/wrangler.toml`（D1 binding / env 変数）
- `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts`

## 完了条件（簡略）

- 3 仮説の検証手順が再現可能な形で記述されている。
- 修正対象ファイル一覧と関数シグネチャ（既存維持）が明記されている。
- テスト方針（vitest）と staging/production 検証コマンドが揃っている。
- DoD と実装ガード（API 仕様変更禁止 / D1 直アクセス境界）が明示されている。

## 実行タスク

1. root cause 仮説 A/B/C を D1 data / env / binding に分解する。
2. 実コードの `schema_versions` 契約（`form_id`, `revision_id`, `state='active'`）に沿って検証 SQL を確定する。
3. テスト方針と実装時の DoD を `outputs/phase-02/main.md` に固定する。

## 参照資料

- `outputs/phase-02/main.md`
- `apps/api/src/repository/schemaVersions.ts`
- `apps/api/migrations/0001_init.sql`
- `apps/api/src/use-cases/public/get-form-preview.ts`

## 実行手順

- 本 Phase では設計のみ行い、D1 write / deploy / commit / push / PR は実行しない。
- 実装サイクルでは A → C → B の順で検証する。

## 成果物

- `outputs/phase-02/main.md`

## 統合テスト連携

- 上流: Phase 1 AC / approval gate。
- 下流: Phase 3 設計レビュー、Phase 4 RED test。

## 次 Phase への引き渡し

Phase 3 設計レビューへ、3 仮説の検証順序・修正案・テスト方針を渡す。
