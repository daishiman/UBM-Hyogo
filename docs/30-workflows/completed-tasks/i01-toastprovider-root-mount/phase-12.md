# Phase 12: 正本同期

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 12 / 13 |
| Phase 名称 | 正本同期 |
| 前 Phase | 11 (Visual evidence) |
| 次 Phase | 13 (PR・振り返り) |
| 状態 | completed |

## 12-0. なぜ正本同期が必要か（中学生レベル）

今回の修正は「設計図 (spec)」と「実物 (コード)」のズレを埋める作業です。
コードを 1 ファイル直したら、設計図側の「ToastProvider をルートに置く」というチェックも「済」に
更新しないと、次に設計図を読んだ人が「まだやってない」と勘違いします。
正本同期は、コードと設計図を**同じ状態に揃える**ためのフェーズです。

## 12-1. implementation-guide.md（Phase 13 PR 本文に直接転記される）

```md
## 概要

`apps/web/app/layout.tsx` の root layout に `ToastProvider` を配置し、
`useAdminMutation` 経由の toast が silent fail していた状態を解消する。

## 背景

- parallel-08-shared-foundation (#745) で `useAdminMutation` hook が `useOptionalToast()` を呼ぶ設計を導入したが、
  root layout への `ToastProvider` 配置が未完了だった
- そのため admin mutation 後の toast が表示されず、`warnMissingToastProvider` フォールバックが console に warn を出していた
- serial-05/step-01..07 (admin mutation UI) の動作前提となるため、本タスクで wiring を完了させる

## 変更内容

### apps/web/app/layout.tsx

1. `import { ToastProvider } from "@/components/ui/Toast";` を追加
2. `<body>` 直下で `<ToastProvider>{children}</ToastProvider>` に変更

## 動作確認

- `pnpm typecheck` PASS
- `pnpm lint` PASS
- `pnpm test useAdminMutation` PASS（既存テストに影響なし）
- `pnpm -F "@ubm-hyogo/web" build` PASS
- authenticated admin route での console / React DevTools / toast DOM 目視は user-session runtime gate

## 影響範囲

- 全 route で `useToast()` / `useOptionalToast()` が non-null を返す
- `useAdminMutation` の fallback (`warnMissingToastProvider`) は defensive のため維持

## リスク

- hydration mismatch: なし（ToastProvider 初期 state は空配列で SSR/client 一致）
- 既存テストへの影響: なし（spec 側で provider を別途 wrap しているため）
```

## 12-2. system-spec-update-summary.md（要点）

- `docs/00-getting-started-manual/specs/` への更新: **なし**（`docs/00-getting-started-manual/specs/09a-prototype-map.md` は既に `ToastProvider` を app shell boundary として正本化済み。本タスクはその既存正本を実装で満たす）
- `CLAUDE.md` への更新: **なし**

## 12-3. 関連 spec 更新

### parallel-08-shared-foundation/spec.md DoD

```diff
- - [ ] ToastProvider in root layout
+ - [x] ToastProvider in root layout (i01-toastprovider-root-mount で完了)
```

### integration-fixes/parallel-i01-toastprovider-root-mount/spec.md DoD

```diff
- - [ ] `apps/web/app/layout.tsx` で `ToastProvider` が children を wrap
+ - [x] `apps/web/app/layout.tsx` で `ToastProvider` が children を wrap
...
（残り DoD 項目も済 / 未済を実状態に更新）
```

### integration-fixes/index.md

```diff
- | i01 | `ToastProvider` が root layout に未配置 | p-08 DoD 未達 | ...
+ | i01 | (完了) ToastProvider 配置済み — i01-toastprovider-root-mount ワークフローで実装 | p-08 DoD 達成 | -
```

## 12-4. phase12-task-spec-compliance-check.md

CONST_005 必須項目チェック:

| 項目 | 状態 |
| --- | --- |
| 変更対象ファイル一覧 | ✓ index.md / phase-05 |
| 関数・型シグネチャ | ✓ phase-02 / phase-05（変更なしの旨記載） |
| 入出力・副作用 | ✓ phase-05 |
| テスト方針 | ✓ phase-07 |
| ローカル実行コマンド | ✓ phase-06 / phase-09 |
| DoD | ✓ index AC-1〜AC-7 + 各 Phase 完了条件 |

CONST_007 単一サイクル完了:
- Phase 1〜12 を本サイクル内で完了
- Phase 13 (commit / push / PR) は user-gated

## 12-5. unassigned-task-detection.md

新規 unassigned task: **なし**。

本タスクで `useAdminMutation` 側の fallback (`warnMissingToastProvider`) を残しており、将来的に削除する判断は不要（defensive 維持）。

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-12/main.md | 本 Phase の総まとめ |
| outputs/phase-12/implementation-guide.md | 12-1 の内容（Phase 13 PR 本文に転記） |
| outputs/phase-12/system-spec-update-summary.md | 12-2 |
| outputs/phase-12/documentation-changelog.md | ドキュメント更新履歴 |
| outputs/phase-12/unassigned-task-detection.md | 未タスク検出結果 |
| outputs/phase-12/skill-feedback-report.md | skill feedback 判定 |
| outputs/phase-12/phase12-task-spec-compliance-check.md | 12-4 |

## 完了条件

- [x] 12-1 implementation-guide.md が完成
- [x] 12-3 関連 spec / index 更新を実施
- [x] CONST_005 / CONST_007 compliance check PASS
- [x] unassigned-task なしを記録

## 次 Phase

Phase 13: PR・振り返り（user approval gate）
