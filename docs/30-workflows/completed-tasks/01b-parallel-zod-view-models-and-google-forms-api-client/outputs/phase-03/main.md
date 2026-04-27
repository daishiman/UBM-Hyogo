# Phase 3: 設計レビュー — 成果物

> 仕様書: `phase-03.md` を再構成した最終版。

## 1. メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| Phase | 3 / 13 |
| 上流 | Phase 2（設計） |
| 下流 | Phase 4（テスト戦略） |
| 状態 | done |

## 2. 目的

Phase 2 設計に対して **alternative 3 案** を提示し、PASS / MINOR / MAJOR で判定。改善点を Phase 4-5 に反映する。

## 3. zod schema 配置の Alternative 3 案

### 案 A: zod schema を `packages/shared` に集約

- pros: import 1 箇所、Wave 4 で再利用容易
- cons: shared が runtime 依存（zod）を持つ
- **判定: PASS（採用）**

### 案 B: zod schema を `apps/api` に置く

- pros: shared を pure type だけに保てる
- cons: Wave 4 全タスクが `apps/api` 経由になる、再利用性低下
- **判定: MINOR**

### 案 C: zod schema をタスク 04* で各自定義

- pros: 自由度高い
- cons: 31 項目 × 3 タスクで重複、不変条件 #1（schema 抽象）違反リスク
- **判定: MAJOR**

### 採用案

**案 A**: `packages/shared/src/zod/` に集約。実装結果も同方針（`packages/shared/src/zod/{primitives,field,schema,response,identity,viewmodel}/`）。

## 4. Forms package 配置

### 案 A1: `packages/integrations/google` 配下

- pros: 後続 google サービス（Calendar / Drive 等）拡張時に統一
- **採用**（実装パッケージ名: `@ubm-hyogo/integrations-google`）

### 案 A2: `packages/forms` 単独

- cons: google 共通認証コードを再実装する未来リスク
- **不採用**

## 5. branded type 実装

### 案 B1: `type X = string & { readonly __brand: "X" }` 方式

- pros: runtime 0、tsc レベル保護
- **採用**

### 案 B2: zod `.brand<"X">()` 方式

- pros: zod parse 時に brand 付与
- cons: zod に runtime 依存
- 一部（Forms parse 出力）は B2 と併用、type 単独は B1。

## 6. 判定サマリ

| 観点 | 判定 |
| --- | --- |
| 案採用整合性 | PASS |
| 不変条件 #1 抽象化 | PASS |
| 不変条件 #5 boundary | PASS（`scripts/lint-boundaries.mjs` で補強） |
| 4 条件 | 全 HIGH |

**最終: PASS**（MINOR / MAJOR 0 件、Phase 4 へ）

## 7. Phase 4-5 への改善点伝達

- zod schema は `packages/shared/src/zod/` 内で **subpath（primitives / field / schema / response / identity / viewmodel）に分離** すること。31 項目を単一ファイルに詰めず、`field/` ディレクトリで分割する。
- branded type は B1 方式を基本とし、zod parse 出力のみ B2 を併用。
- Forms package は `@ubm-hyogo/integrations-google` 名で実装。
