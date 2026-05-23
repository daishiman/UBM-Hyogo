# Phase 10: リファクタ

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 10 / 13 |
| Phase 名称 | リファクタ |
| 前 Phase | 9 (受入確認) |
| 次 Phase | 11 (Visual evidence) |
| 状態 | completed |

## 目的

実装後コードの**改善余地**を判定する。本タスクは編集 1 ファイル / +4 行のためリファクタ候補は限定的。

## 10-1. リファクタ判定マトリクス

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 重複 | NONE | layout.tsx 内に同等 wrap 重複なし |
| 命名 | OK | `ToastProvider` は既存命名のまま |
| 抽象度 | OK | 1 段 wrap で十分。HOC 化等は過剰 |
| 副作用境界 | OK | ToastProvider が state を内包し RootLayout は pure |
| 型安全 | OK | Props 型 unchanged |

## 10-2. 抽出候補と判定

候補なし。`<body><ToastProvider>{children}</ToastProvider></body>` を別 component に抽出する価値はゼロ。

## 10-3. `useAdminMutation` fallback の維持判断

`warnMissingToastProvider` fallback を残すか / 削除するか:

| 選択 | 判定 |
| --- | --- |
| 残す | ✓ defensive（テスト環境で provider 未配置でも crash しない）|
| 削除 | × Provider 未配置時に crash することで bug を早期検出できる利点はあるが、test 環境への副作用が大きい |

→ **残す**。本タスクでは `useAdminMutation` 側を変更しない。

## 10-4. 変更対象ファイル一覧（リファクタ）

なし。

## 10-5. リグレッション防止

- Phase 9 で確認した AC-1〜AC-7 が Phase 11 manual smoke 後も保たれることを再確認
- `pnpm build` で hydration warning が出ないことを Phase 11 evidence と併せて記録

## 10-6. DoD

- [x] リファクタ判定マトリクスが記録されている
- [x] 候補ゼロの根拠が明示
- [x] `useAdminMutation` fallback を残す判断が記録

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-10/refactor-summary.md | リファクタ判定結果 |

## 次 Phase

Phase 11: Visual evidence
