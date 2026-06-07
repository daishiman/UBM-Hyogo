# Phase 1 — 要件定義

> 実装区分: **実装仕様書**（NON_VISUAL / implementation_mode: `new`） / issue #1105 CLOSED 維持

## 1.1 タスク分類

| 項目 | 値 |
|------|-----|
| task type | implementation（DB migration + test） |
| visual category | **NON_VISUAL**（UI/UX 変更なし。DB 内部の参照整合性ガード追加。UI には影響しない） |
| implementation_mode | **new**（新規 migration + 新規 test を RED/GREEN サイクルで実装） |
| spec classification | **implementation_spec**（CONST_004: root cause 解消にコード変更必須） |

### docs-only ではない理由（CONST_004 判定根拠）

issue の目的は「orphan の発生を DB レベルで構造的に禁止する」こと。これは新規 migration（FK 付きテーブル再構築）と有効性テストという**コード変更なしには達成不可能**。よって docs-only ではなく実装仕様書とする。

## 1.2 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|---------|------|------|
| current branch に実装が存在するか | **No**（FK 制約は現行コードに不在・grep 0 件） | 通常の実装 Phase（new）とする |
| upstream（main/dev）にマージ済みか | **No**（他タスクで未解決） | 未マージとして扱う |
| 前提タスク（依存）が完了済みか | **Yes**: backfill `0025_backfill_member_status.sql` landed 済み（orphan 解消済み） | 依存解消済みを記録。順序依存（0025 → 0026）を migration 番号で保証 |

→ `implementation_mode: new`。Phase 4 = D1 contract test 設計（TDD RED）、Phase 5 = migration + test 実装。

## 1.3 現行コード inventory（調査実測）

| 対象 | 現状 | パス |
|------|------|------|
| `member_status` 定義 | baseline は FK なし。現行10カラム（0002 の9カラム + 0020 の `notification_opt_out`） | `apps/api/migrations/0002_admin_managed.sql` L5-16 / `apps/api/migrations/0020_notification_channel_and_opt_out.sql` L12-13 |
| `member_identities` 定義 | `member_id TEXT PRIMARY KEY`（FK 参照先として有効） | `apps/api/migrations/0001_init.sql` L91-92 |
| backfill（前提） | `INSERT OR IGNORE INTO member_status (member_id) SELECT ... orphan` | `apps/api/migrations/0025_backfill_member_status.sql` |
| `member_status` 上の INDEX | `idx_member_status_public (public_consent, publish_state, is_deleted)` | `apps/api/migrations/0002_admin_managed.sql` L81-82 |
| `ensureMemberStatusRow`（予防） | ingest 時の既定行保証 | `apps/api/src/repository/status.ts` L42 |
| D1 contract test の慣習 | `@vitest-environment node` + `setupD1()` + `env.db.exec(migrationSql)` 2 回（冪等確認） | `apps/api/migrations/__tests__/0025_backfill_member_status.spec.ts` |
| migration 自動適用 | `setupD1()` が `migrations/*.sql` を昇順全件適用（`splitStatements` で `;` 分割） | `apps/api/src/repository/__tests__/_setup.ts` L29-32, 105-110 |

## 1.4 命名規約（既存コードベース分析）

| 種別 | 規約 | 本タスクでの採用 |
|------|------|----------------|
| migration ファイル名 | `NNNN_description.sql`（snake_case・連番） | `0026_member_status_fk_constraint.sql` |
| test ファイル名 | `NNNN_description.spec.ts`（`*.test.ts` 禁止・不変条件#8） | `0026_member_status_fk_constraint.spec.ts` |
| 一時テーブル名 | （前例なし）SQLite 再構築の慣例 `*_new` | `member_status_new` |
| INDEX 名 | `idx_<table>_<purpose>` | `idx_member_status_public`（既存名を維持・再作成） |

## 1.5 スコープ確定

- **対象**: `apps/api/migrations/` のみ（新規 SQL 1 + 新規 spec 1）
- **非対象**: `apps/web`（diff 0・AC-8）/ 新規 endpoint / member 作成経路統一（followup-001）/ 他テーブル FK
- **将来 UI 統合経路**: なし（DB 内部ガードのため UI 経路は発生しない）

## 1.6 受け入れ基準（AC-1〜AC-9）

`index.md` §4 を正本とする。AC-9（`idx_member_status_public` 再作成）は issue §5.2 NOTE を現行コードへ具体化した本タスク追加分。

## 1.7 単一サイクル完了性（CONST_007）

本タスクは migration 1 本 + test 1 本のみで、本サイクル内に local 実装を完了した。remote D1 apply と commit / push / PR は user-gated。`PRAGMA foreign_keys` の local 実効性は test 対象、remote binding の実機確認は user-gated evidence として分離する。
