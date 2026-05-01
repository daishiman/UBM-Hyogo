# Phase 5: 仕様 runbook 作成

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | sync 状態 enum / trigger enum の canonical 統一 (U-UT01-08) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 仕様 runbook 作成 |
| 作成日 | 2026-04-30 |
| 前 Phase | 4（検証戦略） |
| 次 Phase | 6（異常系） |
| 状態 | spec_created |
| タスク分類 | specification-design（runbook） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

UT-04（D1 物理スキーマ実装）/ UT-09（同期ジョブ実装）/ U-UT01-10（shared 契約型）が、本タスクで確定した canonical set とマッピング表をそのまま利用して着手できるよう、契約 runbook と書き換え対象範囲リストを文書化する。本 Phase は「実装者がブレなく 1 経路で着地できる手順書」を作るのが責務であり、本タスク自体は実装を行わない。

## 完了条件チェックリスト

- [ ] 契約 runbook（`contract-runbook.md`）に下記 4 ステップが記載されている:
  1. canonical set の参照先パス
  2. 変換 UPDATE → CHECK 制約追加の 2 段階 migration 順序
  3. 集計クエリの grep-and-replace 手順
  4. shared 型 / Zod の import パス（暫定: `@repo/shared/types/sync` 等）
- [ ] 既存実装書き換え対象範囲リスト（`rewrite-target-list.md`）に「ファイル + 推定行範囲 + 変更種別（rename / replace / add）」が表形式で揃っている
- [ ] 各書き換えが「どの後続タスクが実施するか」が紐付いている（UT-04 / UT-09 / U-UT01-10 の責務分割）
- [ ] runbook の末尾に「本タスクでは実行しない」明示がある

## 実行タスク

1. 契約 runbook の章立てを確定する（完了条件: 4 ステップ + 注意事項 + 参照リンク）。
2. 2 段階 migration の順序を擬似 SQL で記述する（完了条件: ステップ a「データ変換 UPDATE」/ ステップ b「CHECK 制約 ADD」/ ステップ c「`triggered_by` 別カラム ADD」が連続する単一 transaction としては避け、別 migration として段階適用する旨の注記）。
3. 集計クエリ grep-and-replace 手順を起草する（完了条件: Phase 4 の grep 計画から `status='success'` 等の集計用ハードコードを抽出する手順、置換時のレビュー観点）。
4. 書き換え対象範囲リストを作成する（完了条件: 下表テンプレートを成果物で埋める）。
5. 後続タスクへの引き渡し節を起草する（完了条件: UT-04 / UT-09 / U-UT01-10 が `outputs/phase-05/*.md` を参照するだけで着手可能となる粒度）。

## 契約 runbook 構成

### Step 1: canonical set の参照

| 項目 | 参照先 |
| --- | --- |
| `status` canonical 5 値 | `outputs/phase-02/canonical-set-decision.md` §status |
| `trigger_type` canonical 3 値 + `triggered_by` | 同上 §trigger |
| 値マッピング表 | `outputs/phase-02/value-mapping-table.md` |
| shared 配置判断 | `outputs/phase-02/shared-placement-decision.md` |

### Step 2: 2 段階 migration 順序（実行は UT-04 / UT-09）

```
-- migration A: データ変換（CHECK 追加前）
UPDATE sync_job_logs SET status = 'in_progress' WHERE status = 'running';
UPDATE sync_job_logs SET status = 'completed'   WHERE status = 'success';
-- 'failed' / 'skipped' は canonical と一致するため変換不要（5 値採用案の場合）
-- trigger_type 軸:
ALTER TABLE sync_job_logs ADD COLUMN triggered_by TEXT;
UPDATE sync_job_logs SET triggered_by = 'admin', trigger_type = 'manual'
  WHERE trigger_type = 'admin';

-- migration B: CHECK 制約追加（A 完了後の別ファイル）
-- SQLite は ALTER TABLE ADD CHECK 不可のため、テーブル再作成 or
-- 仮想 CHECK（INSERT 時 trigger）を採用する旨を runbook に明記
```

> 重要: SQLite/D1 は `ALTER TABLE ... ADD CHECK` を直接サポートしないため、UT-04 が採る選択肢（テーブル再作成 vs アプリ層検証）の判断は UT-04 phase-02 で行う。本 runbook では「2 段階で順序保証する」という契約のみを固定する。

### Step 3: 集計クエリ grep-and-replace 手順

| 順序 | 操作 | 対象 |
| --- | --- | --- |
| 1 | `git grep -n "status\s*=\s*'success'"` | `apps/api/**` / `apps/web/**` |
| 2 | `git grep -n "status\s*=\s*'running'"` | 同上 |
| 3 | `git grep -n "trigger_type\s*=\s*'admin'"` | 同上 |
| 4 | 各ヒットを canonical 値に置換、変更が「集計の意味を保持しているか」レビュー | 集計クエリ / 監視ダッシュボード（UT-08 連動） |
| 5 | `triggered_by='admin'` フィルタが必要な箇所を識別 | actor 軸の集計が必要な monitoring クエリ |

### Step 4: shared 型 / Zod import パス（暫定契約）

| 用途 | パス案 | 実装担当 |
| --- | --- | --- |
| 型のみ | `@repo/shared/types/sync`（`SyncStatus` / `TriggerType`） | U-UT01-10 |
| Zod schema | `@repo/shared/zod/sync`（`syncStatusSchema` 等） | U-UT01-10（採用時） |

> Phase 2 で「types のみ採用」を決定した場合、Zod 列は将来拡張枠として runbook に注記のみ残す。

## 既存実装書き換え対象範囲リスト（テンプレート）

| # | ファイル | 推定行範囲 | 現行値 | canonical 値 | 変更種別 | 担当タスク |
| - | --- | --- | --- | --- | --- | --- |
| 1 | `apps/api/src/jobs/sync-sheets-to-d1.ts` | 実装時 grep で確定 | `'running'` | `'in_progress'` | replace | UT-09 |
| 2 | `apps/api/src/jobs/sync-sheets-to-d1.ts` | 実装時 grep で確定 | `'success'` | `'completed'` | replace | UT-09 |
| 3 | `apps/api/src/jobs/sync-sheets-to-d1.ts` | 実装時 grep で確定 | `'admin'` | `'manual'` + `triggered_by='admin'` 注入 | replace + add | UT-09 |
| 4 | `apps/api/migrations/0002_sync_logs_locks.sql` | 既存 CREATE TABLE 周辺 | CHECK 句なし | `triggered_by` カラム追加 + 後続 migration で CHECK 追加 | add | UT-04 |
| 5 | `apps/api/migrations/000X_sync_enum_canonical.sql`（新規） | n/a | n/a | 変換 UPDATE | add | UT-04 |
| 6 | `packages/shared/src/types/sync.ts`（新規） | n/a | n/a | `SyncStatus` / `TriggerType` 型定義 | add | U-UT01-10 |
| 7 | `apps/api/src/**`（集計クエリ） | 実装時 grep で確定 | `status='success'` 等 | canonical 値 | replace | UT-09 |
| 8 | 監視ダッシュボード関連クエリ | UT-08 連動時に確定 | 同上 | 同上 | replace | UT-08 連動 |

> 行範囲は Phase 4 で実施する grep 結果を基に Phase 5 成果物作成時に確定する。本 Phase 仕様書ではテンプレート構造のみ固定。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-02/*` | runbook 入力 |
| 必須 | `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-04/test-strategy.md` | grep 計画 / 直交性チェック |
| 必須 | `apps/api/src/jobs/sync-sheets-to-d1.ts` | 書き換え対象 |
| 必須 | `apps/api/migrations/0002_sync_logs_locks.sql` | 書き換え対象 |
| 参考 | `docs/30-workflows/ut-04-d1-schema-design/index.md` | 後続タスク受け取り側 |
| 参考 | `docs/30-workflows/unassigned-task/U-UT01-09-*` / `U-UT01-10-*` | 引き渡し境界 |

## 成果物

| 成果物 | パス | 概要 |
| --- | --- | --- |
| 契約 runbook | `outputs/phase-05/contract-runbook.md` | 4 ステップ手順 + import パス案 |
| 書き換え対象範囲リスト | `outputs/phase-05/rewrite-target-list.md` | ファイル × 行範囲 × 変更種別 × 担当タスク |

## 次 Phase への引き渡し

- Phase 6 は本 Phase の 2 段階 migration 順序を入力として、「順序を破った場合に発生する異常」を異常系として展開する。
- Phase 7 AC マトリクスでは AC-3（マッピング表）/ AC-5（書き換え対象リスト）の根拠が本 Phase 成果物にあると確定させる。

## 多角的チェック観点

- **価値性**: 後続実装タスクが本 runbook を読むだけで着手判断できるか（独立性）
- **実現性**: SQLite/D1 の制約（ALTER TABLE ADD CHECK 不可）を踏まえた手順になっているか
- **整合性**: 書き換え対象リストが Phase 4 grep 計画と 1:1 で対応するか、Phase 2 マッピング表と矛盾しないか
- **運用性**: 担当タスク列が UT-04 / UT-09 / U-UT01-10 / UT-08 に過不足なく分配されているか

## 注意事項

- 本 Phase は **コード変更なし / commit 禁止**。書き換えは UT-04 / UT-09 / U-UT01-10 が実施する。
- runbook の末尾に「本タスクでは実行しない」「実行は後続タスク参照」を明記する。
