# Phase 3 — 設計レビュー

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Workflow | parallel-10-auth-session-handling |
| Phase | 03 |
| Status | spec_created |

## 目的

この Phase の目的は、下記の詳細仕様に従って `parallel-10-auth-session-handling` を spec_created から実装可能な状態へ進めることである。

## 実行タスク

- [ ] 下記の Phase 固有手順を実行する。
- [ ] 成果物と evidence path を確認する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| workflow index | docs/30-workflows/parallel-10-auth-session-handling/index.md | 全体仕様 |
| artifacts | docs/30-workflows/parallel-10-auth-session-handling/artifacts.json | 状態台帳 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase output | docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-03/ | Phase成果物 |


## レビュー観点

1. AC-1〜AC-9 が Phase 2 設計で達成可能か。
2. 不変条件（API 不変・D1 不可・OKLch・open redirect 防止）に違反していないか。
3. CONST_007: 本サイクル内で Phase 1〜13 を完了できるか。先送り項目が存在しないか。
4. 既存 `ToastProvider` API の後方互換が保たれるか。
5. SSR/CSR 境界: `"use client"` の付与漏れ・`window` 参照のサーバ実行回避。
6. test 観点: `redirector` / `toaster` / `currentPath` の DI 注入で window 依存を排除できているか。

## 判定

- GO 条件: 上記 6 観点すべて PASS。silent refresh 不採用が `outputs/phase-02/auth-session-policy.md` に明文化されている。
- NO-GO 条件: hook の DI 境界が曖昧、または Toast variant 追加が既存 test を壊す場合。

## 成果物

- `outputs/phase-03/design-review.md`（観点 / Verdict / 根拠 / 改善点 列）

## 完了条件

- design-review.md が生成され、Verdict = GO で全観点 PASS が記録されていること。
