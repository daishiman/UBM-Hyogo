# Phase 3: 設計レビュー

## メタ情報

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- 前 Phase: 2（設計） / 次 Phase: 4（テスト作成）
- 作成日: 2026-06-02

## 目的

Phase 2 設計が Phase 4 へ進める品質か（責務境界・後方互換・既存資産再利用・スコープ妥当性）を判定する。

## 実行タスク

1. 既存コンポーネント再利用可否を確認（[FB-SDK-07-1]）。
2. 命名規則一貫性を確認（[FB-SDK-07-4]）。
3. props vs internal state の所有権を確認（[VSCPKR-03]）。
4. 後方互換・URL 正本非破壊・スコープ（1 サイクル）を判定。

## レビュー結果

### 既存コンポーネント再利用可否（[FB-SDK-07-1]）

| 項目 | 判定 |
| --- | --- |
| `Search` / `Input` / `FormField` | 既存プリミティブを再利用し、新規プリミティブは生やさない（IME-safe は内部実装/フックに閉じる） |
| 新規 UI primitive | **不要**（フック新設のみ。視覚的 primitive は増やさない＝プロトタイプ正本順位を維持） |
| admin の遅延確定実装 | 方式を共有フックへ昇格して統一可能にするが、admin 側配線は本サイクル対象外（別関心） |

### 命名規則一貫性（[FB-SDK-07-4]）

- フック名 `useImeSafeInput`（`use` + PascalCase）は既存 `use*` 規約に整合。
- `commitNow` / `onCommit` / `debounceMs` は意図が一意で、`onChange`（既存公開 props）と役割が明確に分離。

### props vs internal state（[VSCPKR-03]）

| 値 | 所有者 |
| --- | --- |
| 確定値（canonical `q`） | URL（`MemberFilters` の `update` → `router.replace`） |
| draft（表示値） | `useImeSafeInput` 内部 state |
| isComposing | `useImeSafeInput` 内部 ref（再描画を起こさない） |

→ テスト（Phase 4）は「外部 value の変化」と「内部 draft の操作」を区別して設計する。

### 後方互換・非破壊

- `SearchProps` の追加は `debounceMs?` のみ（optional）。既存利用箇所は無改修で動作（AC-6）。
- `Input` の追加は `imeSafe?` / `onValueChange?` / `debounceMs?`（すべて optional・デフォルト経路不変）。
- URL 正本設計（不変条件）は維持。draft はローカル一時値で、確定後に URL へ反映するため矛盾しない。

### スコープ妥当性（CONST_007）

- 5 タスク（フック / Search / SelectedFiltersBar / MemberFilters / Input）は 1 サイクル / 1 PR で完了可能。
- 対象外（submit 型 textarea / admin filter）は「IME 破綻が発生しない別関心」であり、先送りではなく対象外。
  横展開候補として Phase 12 `unassigned-task-detection.md` に記録（必須化はしない）。

## 判定

**PASS（Phase 4 へ進行可）**。MINOR 指摘なし。BLOCKER なし。

## 参照資料

- `phase-2.md` / `outputs/phase-1/requirements.md`

## 成果物

- `phase-3.md`（本ファイル）

## 統合テスト連携

レビューで確定した「外部 value vs 内部 draft」の区別を Phase 4 テスト設計の前提とする。

## 完了条件

- [x] 既存再利用可否・命名一貫性・state 所有権を確認
- [x] 後方互換・URL 正本非破壊・スコープを判定
- [x] PASS 判定を記録
