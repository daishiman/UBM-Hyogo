# u-ut01-08-sync-enum-canonicalization - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | u-ut01-08-sync-enum-canonicalization |
| GitHub Issue | #262（CLOSED のままタスク仕様書のみ作成） |
| 親タスク | UT-01（Sheets→D1 同期方式定義 / Issue #50 CLOSED） |
| 起票元 | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md` U-8 |
| 検出仕様書 | `docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md` |
| 作成日 | 2026-04-30 |
| ステータス | spec_created |
| 総 Phase 数 | 13 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| 優先度 | HIGH |

---

## 目的

UT-01 論理設計（`pending|in_progress|completed|failed` / `manual|cron|backfill`）と既存実装（`running|success|failed|skipped` / `admin|cron|backfill`）の `status` / `trigger_type` enum 差分を、shared 契約レベルで canonical set として確定する。実 migration / UI 文言更新は対象外（UT-04 / UT-09 / 別タスクへ委譲）。

## スコープ

### 含む
- `status` canonical set の確定（推奨: `pending` / `in_progress` / `completed` / `failed` / `skipped` の 5 値）
- `trigger_type` canonical set の確定（推奨: `manual` / `cron` / `backfill`、`admin` は `triggered_by` 別カラム化）
- 既存値 → canonical 値マッピング表（変換 UPDATE 疑似 SQL を含む文書記述のみ）
- shared 配置決定（`packages/shared/src/types` 単独 vs `packages/shared/src/zod` 併設）
- 既存実装書き換え対象範囲（ファイルパス + 行番号 + 変更種別）リスト
- U-UT01-07 / U-UT01-09 / U-UT01-10 との直交関係明記

### 含まない
- 実 migration ファイル作成・適用（→ UT-04 / UT-09）
- UI ラベル文言の更新・i18n リソース変更
- shared 契約型 Zod の実装コミット（→ U-UT01-10 統合 or 分離後に該当タスクで実施）
- 監視アラート閾値の改訂（→ U-UT01-04 連動）

## 受入条件（AC）

- AC-1: `status` canonical set 確定（推奨 5 値: `pending` / `in_progress` / `completed` / `failed` / `skipped`）
- AC-2: `trigger_type` canonical set 確定（推奨 3 値: `manual` / `cron` / `backfill`）+ `admin` の `triggered_by` 別カラム分離方針
- AC-3: 既存値 → canonical 値マッピング表（変換 UPDATE 疑似 SQL を含む）
- AC-4: shared 配置先決定（types only / Zod 併設 / U-UT01-10 統合 or 分離）
- AC-5: 既存実装書き換え対象範囲リスト（ファイル + 行番号 + 変更種別）
- AC-6: U-UT01-07 / U-UT01-09 / U-UT01-10 との直交関係明記
- AC-7: 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き
- AC-8: Phase 12 で 7 必須成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / main）を確認

---

## Phase 一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | spec_created |
| 2 | 設計（canonical set 決定） | [phase-02.md](phase-02.md) | spec_created |
| 3 | 設計レビューゲート | [phase-03.md](phase-03.md) | spec_created |
| 4 | 検証戦略（型テスト雛形） | [phase-04.md](phase-04.md) | spec_created |
| 5 | 仕様 runbook 作成 | [phase-05.md](phase-05.md) | spec_created |
| 6 | 異常系（migration 失敗 / 集計 silent drift） | [phase-06.md](phase-06.md) | spec_created |
| 7 | AC マトリクス | [phase-07.md](phase-07.md) | spec_created |
| 8 | DRY 化 / 仕様間整合 | [phase-08.md](phase-08.md) | spec_created |
| 9 | 品質保証 | [phase-09.md](phase-09.md) | spec_created |
| 10 | 最終レビューゲート | [phase-10.md](phase-10.md) | spec_created |
| 11 | 手動検証（NON_VISUAL 縮約） | [phase-11.md](phase-11.md) | spec_created |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | spec_created |
| 13 | PR 作成 | [phase-13.md](phase-13.md) | pending_user_approval |

---

## 実行フロー

```
Phase 1 → Phase 2 → Phase 3 (Gate) → Phase 4 → Phase 5 → Phase 6 → Phase 7
                         ↓                                      ↓
                    (MAJOR→戻り)                           (未達→戻り)
                         ↓                                      ↓
Phase 8 → Phase 9 → Phase 10 (Gate) → Phase 11 → Phase 12 → Phase 13 → 完了
```

---

## 不変条件への影響

| # | 不変条件 | 本タスクの取り扱い |
| --- | --- | --- |
| 1 | 実フォーム schema をコードに固定しすぎない | `status` / `trigger_type` は Sheets schema 起源ではないため非該当（参考のみ） |
| 4 | admin-managed data はフォーム外として分離 | `triggered_by='admin'` は admin-managed metadata として `sync_job_logs` に独立カラム化を提案 |
| 5 | D1 への直接アクセスは `apps/api` に閉じる | shared 配置は **型 / Zod のみ**で、D1 binding には触れない |

---

## 主要参照

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md` | 起票仕様（本仕様書の上位） |
| 必須 | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md` §2, §9 | UT-01 論理設計の enum 定義 |
| 必須 | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md` U-8 | 検出根拠 |
| 必須 | `apps/api/src/jobs/sync-sheets-to-d1.ts` | 既存実装の status / trigger 値リテラル |
| 必須 | `apps/api/migrations/0002_sync_logs_locks.sql` | 既存物理スキーマ |
| 参考 | `packages/shared/src/types/` / `packages/shared/src/zod/` | 配置判断の比較対象 |

---

## 注意事項

- 本タスクは **コード変更なし / コミット禁止**。決定はすべて文書化のみで完結する。
- GitHub Issue #262 は CLOSED のまま。仕様書の参照リンクとしてのみ扱う（再 OPEN しない）。
- 実 migration / UI 文言更新は本タスクのスコープ外。
- U-UT01-10（shared 契約型化）と統合する判断を採る場合は AC-4 で明記し、独立タスクとしては close する判断を Phase 2-3 で行う。

## Decision Log

Issue #262 は本仕様書作成時点で CLOSED のため、本タスクでは再 OPEN しない。U-UT01-08 は実装完了ではなく `spec_created` の正本契約化であり、後続の UT-04 / UT-09 / U-UT01-10 が実装証跡を持つ。PR 文面でも `Closes #262` は使わず、必要な場合は `Refs #262` のみを使う。
