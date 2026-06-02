# Phase 8: リファクタリング

> `implementation_mode: verify_existing`（landed at PR #1064 / `745c95115`）。本 Phase は新規リファクタを行わず、landed 実装に適用済みのリファクタを正本記述し、duplicate / navigation drift がないことを確認する読み替えで実施する。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase 番号 | 8 |
| 名称 | リファクタリング |
| 種別 | 検証（verify_existing: 適用済みリファクタ正本記述） |
| implementation_mode | verify_existing（PR #1064 / `745c95115` landed） |
| 依存 | Phase 7（カバレッジ確認） |

## 目的

landed 実装に適用済みのリファクタ（定数集約 / `lastSyncLabel` helper 抽出 / 生 `<aside>` 化 / `formatJstDateTime` 再利用）を正本記述し、duplicate / navigation drift がないことを確認する。

## 実行タスク

- 適用済みリファクタを 対象/Before/After/理由 テーブルで記録する（§1）。
- duplicate / navigation drift なしを確認する（§2）。
- 追加リファクタ不要の判定根拠を明示する（§3）。

## 参照資料

- `apps/web/src/components/public/ReflectionTimingNote.tsx`
- `apps/web/app/(public)/members/page.tsx`
- `apps/web/app/(member)/profile/page.tsx`

## 成果物

- 本 Phase 8 検証結果（適用済みリファクタ表 / drift なし確認 / 追加不要判定）。

## 統合テスト連携

本タスクは公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt` を流用する read-only 表示で、新規 API / D1 変更を伴わない。品質担保はコンポーネント単体 spec（`ReflectionTimingNote.spec.tsx` 7 ケース）と既存 `/members`・`/profile` page 統合テスト（fail-soft 経路）で行う。

## 1. landed 実装に適用済みのリファクタ（[Feedback RT-03]）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| 反映目安の数値（15 / 30 / 45 分） | コピー文字列内にマジックナンバー散在の余地 | コンポーネント先頭に定数集約（cron 間隔 / revalidate=30 / hourly 互換が根拠） | マジックナンバー散在回避・cron/ISR 変更時の単一追随点化 |
| 最終同期時刻の表示文言 | page 側で都度整形する余地 | `lastSyncLabel` helper として抽出 | 整形ロジックの責務集約・呼び出し側の意図明確化 |
| 注記コンテナの装飾 | Banner / Card primitive 流用で primitive 増殖の余地 | 生 `<aside>` + token className（`bg-[var(--ubm-color-surface-panel)]` 等）で構成 | 不変条件3（新規 primitive を生やさない）整合・依存最小化 |
| 日時フォーマット | 独自フォーマッタ追加の余地 | `formatJstDateTime` 再利用 | 重複フォーマッタ回避・JST 表記の単一情報源化 |

## 2. duplicate / navigation drift 確認

- **duplicate**: `ReflectionTimingNote` は単一定義（`apps/web/src/components/public/ReflectionTimingNote.tsx`・52 行）。`/members` と `/profile` は同一コンポーネントを `surface` prop 差分で共有し、コピペ複製なし。
- **navigation drift**: 表示専用 Server Component で遷移・ルーティングを持たないため navigation drift の発生面なし。`data-testid="reflection-timing-{surface}"` で 2 面を一意識別。

## 3. 判定

landed 実装は SRP・定数集約・helper 抽出（`lastSyncLabel`）が適用済みで、primitive 増殖回避・フォーマッタ重複回避も達成済み。**追加リファクタ不要**。

## 完了条件

- [x] 適用済みリファクタを 対象/Before/After/理由 テーブルで記録した。
- [x] duplicate / navigation drift なしを確認した。
- [x] 追加リファクタ不要の判定根拠を明示した。
