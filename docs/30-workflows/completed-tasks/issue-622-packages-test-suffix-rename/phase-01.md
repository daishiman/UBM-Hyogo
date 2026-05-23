# Phase 1 — 要件定義 / 真の論点

## 目的

Issue #622 が解決すべき「真の論点」を明文化し、Phase 2 以降の調査・設計の前提を固定する。

## 真の論点

1. **規約統一の境界**: `apps/api` / `apps/web` は `.spec.ts` に統一済み。`packages/**` が `.test.ts` のままで残ると規約が apps 側と二分する。consumer リポジトリも `.spec.ts` を期待する想定。
2. **package 単位 ADR の必要性**: `packages/shared` と `packages/integrations` は owner / publish 境界が異なる。横断ルール（`.spec.ts` 強制）と package 固有ルール（種別 prefix）を分離した 2 つの ADR が必要。
3. **vitest config 単一収斂のブロック**: ルート vitest.config の `include` が `{test,spec}` 二段階のまま固定化されている。本タスクで `.test.ts` 残存を 0 にしないと followup-003（spec 単一収斂）が動かせない。
4. **履歴保全**: `git mv` を必須化しないと blame / log --follow が分断され、テスト変更履歴が辿れなくなる。

## 要件

| 要件 ID | 内容 |
| --- | --- |
| REQ-1 | `packages/**` 配下の `*.test.ts` / `*.test.tsx` を全件 `*.spec.ts` / `*.spec.tsx` に rename する |
| REQ-2 | rename は `git mv` を使い、履歴を保全する |
| REQ-3 | packages/shared / packages/integrations 各々に suffix ADR を 1 件ずつ追加する |
| REQ-4 | rename 前後で `pnpm -r test` 実行時の test 件数が完全一致 |
| REQ-5 | typecheck / lint に新規エラーを発生させない |
| REQ-6 | ルート vitest.config の `include` glob は本タスクでは変更しない（followup-003 担当） |

## 非要件（明示的に対象外）

- テスト本体の内容変更
- import path の変更（テスト fixture 含む）
- package.json の test script 変更
- ルート vitest.config の `{test,spec}` 単一収斂
- ADR 起草に伴う既存テストカテゴリの再分類（rename のみで完結）

## 完了条件

- 本仕様書の AC-1〜AC-11 がすべて達成可能であることを Phase 2 調査で確認できる状態
