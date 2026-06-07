**[実装区分: 実装仕様書 / implementation_mode: new]**

# Phase 8 — リファクタリング

## 目的

issue #1088 の durationMs 実装（backend 計時 + schema + UI 行）に対して、重複コード・命名ドリフト・既存計時パターンとの整合を点検し、本タスクのスコープで除去すべきリファクタ対象を確定する。変更内容は `対象 / Before / After / 理由` テーブル形式で記録する（[Feedback RT-03]）。

## 8.1 計時 helper の重複点検

durationMs を返す計時パターンはコードベースに既存の前例がある。本タスクの `runResponseSync` 計時がそれらと重複・乖離していないかを確認する。

| 既存パターン | 場所 | 計時方式 | resync 経路との関係 |
|-------------|------|---------|-------------------|
| `DiffSummary.durationMs` | `apps/api/src/jobs/sync/types.ts` | sync 用 diff サマリの所要時間フィールド | resync（`runResponseSync`）は `DiffSummary` を生成しないため **非経由** |
| `withSyncMutex`（計時付き） | `apps/api/src/jobs/sync/audit.ts` | mutex 取得〜解放の計時を audit に記録 | resync は `withSyncMutex` ではなく `acquireSyncLock` / `releaseSyncLock` を使用するため **非経由** |
| `durationMs: 0`（ハードコード） | `apps/api/src/jobs/sync/manual.ts:87` | manual diff の固定 0 値 | resync 経路は `sync/manual.ts` を呼ばないため **非経由** |

### 判定: 計時 helper の共通化は本タスクでは行わない（リファクタ対象なし）

**根拠**:

1. **責務境界が独立している**: `runResponseSync`（Google Forms 回答取込ジョブ）は `sync/` 配下の diff sync 系（`DiffSummary` / `withSyncMutex` / `manual.ts`）とは別経路で、両者は計時基盤を共有していない。共通 helper（例: `withTiming()`）を新設して両系統に被せると、本タスクのスコープ（resync 結果に所要時間 1 行を出す）を超えた cross-cutting 変更となり、`sync/` 系の既存テスト・契約に影響範囲が拡大する。
2. **計時ロジックが極小**: 本タスクの計時は `const startedAt = now().getTime();` と 3 return での `now().getTime() - startedAt` のみ。helper 抽出による行数削減効果は無く、むしろ間接層が増えて可読性が下がる（[WEEKGRD-02] 防御的・最小実装の方針に整合）。
3. **`now()` 注入が既存と整合**: `runResponseSync` は既に `const now = options.now ?? (() => new Date());`（116 行）で時刻注入を持つ。計時はこの既存 `now` を再利用するため、新規の時刻源・新規 import を追加しない。テスト容易性（`options.now` で決定論的に固定）も既存パターンのまま維持される。

> したがって本 Phase 8 では「resync 経路の計時を独立実装として閉じ、`sync/` 系の計時 helper とは統合しない」を確定とする。将来 `sync/` 系と resync 系で計時メトリクスを統一する場合は別タスク（cross-cutting refactor）として切り出す（Phase 10 の scope-out 候補に記録）。

## 8.2 命名ドリフト点検

| 観点 | 確認 | 結果 |
|------|------|------|
| フィールド名 | 既存 `DiffSummary.durationMs` と同名 `durationMs` を採用 | ドリフトなし（camelCase + `Ms` サフィックス慣習に整合） |
| schema フィールド名 | `SyncResultSchema` の既存フィールド（processedCount / writeCount）と同じ camelCase | ドリフトなし |
| UI 行ラベル | `resultRows()` の既存ラベル（status / jobId / processedCount / writeCount / cursor）と同じ生フィールド名表記 | ドリフトなし（`["durationMs", ...]`） |

## 8.3 リファクタ実施テーブル（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `runResponseSync` 計時 | 所要時間を計測しない | 既存 `now()` を再利用し開始時刻 1 行 + 3 return で差分付与 | helper 抽出せず最小差分で計時を閉じる（責務独立・極小ロジック） |
| 計時 helper 共通化 | 既存 `sync/` 系に `DiffSummary.durationMs` / `withSyncMutex` 計時あり | **統合しない（現状維持）** | 経路が独立しスコープ超過のリスク。統合は別タスク化 |
| `sync/manual.ts:87` の `durationMs: 0` | ハードコード 0 | **本タスクでは触らない（現状維持）** | resync 経路と無関係。修正は別タスク（Phase 10 scope-out） |

> **結論**: 本タスクの変更面（job 計時 / schema / UI 行）に重複・命名ドリフトはなく、**新規共通化リファクタは不要**。8.1 で確定した「resync 経路の計時は独立実装で閉じる」方針を維持し、`sync/manual.ts:87` のハードコード 0 修正は scope-out として Phase 10 / Phase 12 へ引き継ぐ。

## 完了条件（Phase 8 DoD）

- [ ] 既存計時パターン（`DiffSummary.durationMs` / `withSyncMutex` / `sync/manual.ts:87`）と resync 経路の関係を点検した。
- [ ] 計時 helper を共通化しない判断とその根拠（責務独立・極小ロジック・`now()` 既存注入の再利用）を記録した。
- [ ] 命名ドリフト 0 件を確認した（`durationMs` が既存慣習に整合）。
- [ ] `対象 / Before / After / 理由` テーブルでリファクタ判断を記録した。
- [ ] scope-out（`sync/manual.ts:87` の `durationMs: 0` 修正・計時統合）を Phase 10 / 12 へ引き継ぐ旨を明記した。
