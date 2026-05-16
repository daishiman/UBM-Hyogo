# Phase 4: タスク分解

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 4 / 13 |
| Phase 名称 | タスク分解 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装計画) |
| 状態 | completed |

## 目的

実装単位のサブタスクに分解する。本タスクは編集 1 ファイル / +2 行のため分解は最小。

## サブタスク一覧

| ID | 内容 | 担当ファイル | 種別 | 所要 |
| --- | --- | --- | --- | --- |
| ST-01 | `apps/web/app/layout.tsx` に `ToastProvider` import 追加 | app/layout.tsx | edit | 1 行 |
| ST-02 | `<body>` 直下で `<ToastProvider>` wrap | app/layout.tsx | edit | 2 行 |
| ST-03 | typecheck 実行 | - | verify | - |
| ST-04 | lint 実行 | - | verify | - |
| ST-05 | `useAdminMutation.spec.tsx` 再実行 | - | verify | - |
| ST-06 | dev server で admin route から toast を発火し目視 | - | manual | - |

## クリティカルパス

ST-01 → ST-02 → ST-03 → ST-04 → ST-05 → ST-06（順序固定。並列化なし）。

## 依存関係

外部依存なし。`Toast.tsx` の既存 export を import するだけ。

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-04/task-breakdown.md | ST-01〜ST-06 のサブタスクリスト |

## 完了条件

- [x] サブタスク 6 件すべて記載
- [x] 担当ファイル / 種別 / 所要が明示
- [x] クリティカルパス図あり

## 次 Phase

Phase 5: 実装計画
