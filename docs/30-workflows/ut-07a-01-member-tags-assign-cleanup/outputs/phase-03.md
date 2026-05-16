# Phase 3 — 上位設計（変更モジュール俯瞰）

## 変更対象ファイル一覧

| パス | 変更種別 | 変更概要 |
| --- | --- | --- |
| `apps/api/src/repository/memberTags.ts` | 編集 | ファイル冒頭コメント、`assignTagsToMember` 関数定義、`MemberTagsProvider` interface 宣言の 3 箇所に JSDoc / 警告コメント追加 |

## 変更しないファイル（明示）

| パス | 理由 |
| --- | --- |
| `apps/api/src/workflows/tagQueueResolve.ts` | 唯一の正規 caller、仕様変更なし |
| `apps/api/src/workflows/tagQueueResolve.contract.spec.ts` | 既存挙動を維持 |
| `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` | allow list に加え、`assign*` 派生 helper 追加禁止 gate を同一サイクルで追加 |
| `apps/api/src/middleware/repository-providers.spec.ts` | provider 形状検査の維持 |
| D1 migrations / schema | 不変条件 #13 はコード側で担保、schema 変更不要 |

## モジュール依存関係（変更後も不変）

```
tagQueueResolve.ts (workflow)
  └─ memberTagsProvider.assignTagsToMember()   ← 正規経路（変更なし）
       └─ assignTagsToMember(c, ...)            ← INSERT/UPDATE 実体（JSDoc 追加のみ）
```

新規依存・新規 caller の追加なし。

## API surface 変更

なし。export 名・引数・戻り値型はすべて維持。
