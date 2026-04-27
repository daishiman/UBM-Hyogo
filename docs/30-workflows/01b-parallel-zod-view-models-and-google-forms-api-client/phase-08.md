# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 8 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 7 (AC マトリクス) |
| 下流 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

Before/After で重複削減（型 alias 統一 / zod helper 共通化 / Forms response mapper 共通化 / branded factory 共通化）を整理し、後続 Wave 2/3/4 が活用しやすい構造に整える。

## 実行タスク

1. Before（重複候補 4 件）抽出
2. After（DRY 案）提示
3. 再利用度評価
4. outputs/phase-08/main.md 生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/module-design.md | module 設計 |
| 必須 | outputs/phase-05/implementation-runbook.md | 実装案 |

## 統合テスト連携

| Phase | 内容 |
| --- | --- |
| 9 | secret hygiene |
| Wave 2/3/4 | DRY 利用 |

## 多角的チェック観点（不変条件参照）

- **#1**: schema 抽象化により Wave 2/3 が同じ helper を使えること

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | Before 抽出 | 8 | pending |
| 2 | After 設計 | 8 | pending |
| 3 | 再利用度 | 8 | pending |
| 4 | outputs | 8 | pending |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-08/main.md |
| メタ | artifacts.json |

## 完了条件

- [ ] 4 件 DRY 化完了

## タスク 100% 実行確認【必須】

- [ ] 全 4 サブタスク completed
- [ ] outputs/phase-08/main.md 配置
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 9
- 引き継ぎ事項: DRY 案
- ブロック条件: 未確定

## Before / After

### 1. branded type factory

| Before | After |
| --- | --- |
| 各 branded ごとに `as*` 関数を手書き | `Brand<T,B>` + `createBrand<B>()` factory で 7 種一括生成 |

```ts
// After
const createBrand = <B extends string>() => (s: string) => s as Brand<string, B>;
export const asMemberId = createBrand<"MemberId">();
export const asResponseId = createBrand<"ResponseId">();
```

### 2. zod email/datetime helper

| Before | After |
| --- | --- |
| `z.string().email()` を 5 箇所で書く | `z.string().email().brand<"ResponseEmail">()` を 1 箇所 export |

```ts
// shared/zod/primitives.ts
export const ResponseEmailZ = z.string().email().brand<"ResponseEmail">();
export const ISO8601Z = z.string().datetime();
```

### 3. Forms response mapper

| Before | After |
| --- | --- |
| getForm / listResponses で別個に変換 | mapper.ts 共通化、`mapAnswer(rawAnswer): FormResponseAnswer` を export |

### 4. fetch + backoff wrapper

| Before | After |
| --- | --- |
| Forms client 内に直接 retry 書く | `withBackoff(fn)` 関数化、後続で他 google API でも再利用可 |

```ts
// backoff.ts
export async function withBackoff<T>(fn: () => Promise<T>, opts: BackoffOpts): Promise<T>;
```

## 再利用度評価

| 改善 | 利用箇所（Wave） |
| --- | --- |
| branded factory | shared 内部のみ（7 箇所 → 1 factory） |
| email/datetime helper | shared/zod 5 箇所 + Wave 4 viewmodel parse |
| Forms response mapper | 03a / 03b |
| backoff wrapper | 03a / 03b（Forms 以外の cron でも再利用可能） |
