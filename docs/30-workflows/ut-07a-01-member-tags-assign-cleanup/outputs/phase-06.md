# Phase 6 — テスト計画

## 方針

本タスクはコメント / JSDoc 追加のみで実行時挙動を変更しない。
ただし Phase 12 再検証で `assign*` 派生 helper の検知漏れが見つかったため、既存 `memberTags.readonly.test-d.ts` に type-level gate を追加して十分性を担保する。

## 継続 PASS 対象テスト

| テストファイル | 検証内容 | 期待 |
| --- | --- | --- |
| `apps/api/src/workflows/tagQueueResolve.contract.spec.ts` | `assignTagsToMember` mock 経由の呼び出し順序 | 既存と同一の PASS |
| `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` | type-level write keyword 禁止 + allow list + `assign*` 派生禁止 | `assignTagsToMember` のみ allow list 維持で PASS |
| `apps/api/src/middleware/repository-providers.spec.ts` | `memberTagsProvider.assignTagsToMember` の関数存在検査 | PASS |

## todo / skip 残留禁止

`it.todo` / `test.todo` / `test.describe.skip` を本変更で導入しない。導入してはならない。

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- tagQueue
mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags.readonly
mise exec -- pnpm --filter @ubm-hyogo/api test -- repository-providers
```

## E2E coverage

本タスクは API repository helper の JSDoc 変更のみで、ランタイム挙動・UI 露出のいずれにも影響しない。E2E coverage gate（≥ 80%）への寄与・劣化なし。
