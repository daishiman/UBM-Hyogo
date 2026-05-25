---
phase: 8
title: リファクタ
workflow_id: issue-880-public-segment-error-loading-boundary
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 8 — リファクタ

[実装区分: 実装仕様書]

## 1. リファクタ対象

本 task の主目的は **「不在 → 存在」へのファイル追加** であり、既存 production code への structural refactor は伴わない。リファクタ範囲は新規追加コード内に限定する。

## 2. 適用するリファクタ原則

| 原則 | 適用 |
|------|------|
| SRP | error.tsx は「`(public)` boundary 描画 + logger 通知 + 導線提示」に限定 |
| DRY | 親 `error.tsx` との重複は許容（segment 固有文言・scope tag のため）。共通抽出は将来 boundary 数が 4 以上になった時点で検討 |
| 名前の明確さ | `PublicError` / `PublicLoading` という export 名で `(admin)` 系（`AdminError`）と対称化 |

## 3. 共通抽出の見送り判断

`error.tsx` × 3（root / public / admin）の共通骨格を `lib/boundary/createSegmentErrorBoundary.ts` に factory 化する案を検討したが、見送る:

| 抽出案 | 見送り理由 |
|-------|---------|
| factory 化 | Client Component HOC は Next.js App Router の `error.tsx` 規約（default export 必須）と衝突しやすい |
| hook 抽出（logger + focus） | 既に `useAutoFocusOnMount` / `logger` は単体 hook。さらなる抽出は YAGNI |
| 文言の i18n catalog 化 | 現在日本語のみ運用。i18n 導入時に一括対応 |

## 4. 親 `error.tsx` の二重 `useAutoFocusOnMount` 呼び出しバグ

`apps/web/app/error.tsx` L13 と L32 で `useAutoFocusOnMount(headingRef)` が二重呼び出しされている既存バグを発見。本 task のスコープ外として **修正しない**。followup issue 起票候補:

```
title: fix(error.tsx): duplicate useAutoFocusOnMount call in root error boundary
body: apps/web/app/error.tsx L13/L32 で同一 hook が二重呼び出しされている。動作上は問題ないが冗長。
```

Phase 13 PR 本文の「残課題」セクションに記載する。

## 5. リファクタ完了条件

- [ ] `PublicError` / `PublicLoading` 命名で export
- [ ] 親 `error.tsx` の二重呼び出しを継承しない
- [ ] `useAutoFocusOnMount` 呼び出しは 1 回のみ
- [ ] 共通抽出は見送り、`(admin)` パターンに対称化のみ
