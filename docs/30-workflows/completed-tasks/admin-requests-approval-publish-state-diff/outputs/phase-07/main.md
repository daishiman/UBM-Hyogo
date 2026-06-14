# Phase 7 成果物: カバレッジ確認方針（確定記録）

> 状態: completed。変更ブロック限定カバレッジの計測方針と実測記録欄。実測値は実装サイクルで埋める。

## 1. カバレッジ範囲限定方針

計測対象は本タスクで変更した admin requests 関連ファイルのみに限定する。全体一律 `--coverage` 閾値は適用しない。

| 計測対象ファイル | 焦点 |
| --- | --- |
| `apps/web/src/components/admin/RequestQueueDetail.tsx`（or 別 helper） | `formatPublishStateLabel` 4 分岐 / `buildPublishStateDiff` note_type 分岐 / diff 行描画 |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | `destructiveMessage` 3 分岐 |
| `apps/web/src/components/admin/RequestConfirmDialog.tsx` | 92 行表示条件緩和 |

## 2. 計測コマンド（対象限定）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx \
  --coverage \
  --coverage.include='apps/web/src/components/admin/RequestQueueDetail.tsx' \
  --coverage.include='apps/web/src/components/admin/RequestQueuePanel.tsx' \
  --coverage.include='apps/web/src/components/admin/RequestConfirmDialog.tsx' \
  --coverage.reporter=text --coverage.reporter=json-summary
```

## 3. 変更ブロック実測記録欄（実装サイクルで転記）

| ブロック | 分岐数 | line（実測） | branch（実測） | 備考 |
| --- | --- | --- | --- | --- |
| `formatPublishStateLabel` | 4（public/member_only/hidden/未知） | （実測値） | （実測値・目標 4/4） | TC-08 / TC-E-01 |
| `buildPublishStateDiff` | 3（visibility/delete/null） | （実測値） | （実測値・目標 3/3） | TC-09/10 / TC-E-02〜06 |
| `buildPublishStateDiff` desiredState 抽出 | 正常 / 欠落 / 型不一致 | （実測値） | （実測値） | TC-E-03/04 |
| `destructiveMessage` 生成 | 3（delete/visibility/fallback） | （実測値） | （実測値・目標 3/3） | TC-11/12 / TC-E-07 |
| RequestConfirmDialog 92 行緩和 | 2（文言あり/なし） | （実測値） | （実測値） | TC-R-02 |

## 4. 既存 3 spec 追従状況（記録欄）

| spec | 既存 green 維持 | 新規 assertion |
| --- | --- | --- |
| RequestQueueDetail.spec.tsx | （確認欄） | diff 行 V01/V02/D01 |
| RequestQueuePanel.component.spec.tsx | （確認欄） | `destructiveMessage` 具体化 |
| RequestConfirmDialog.spec.tsx | （確認欄） | 92 行緩和追従 |

## 5. AC 担保区分

| 区分 | AC |
| --- | --- |
| テストで担保 | AC-1, AC-2, AC-3, AC-8, AC-9, AC-10 |
| 機械検証（gate）で担保 | AC-4（token 名実在 + verify-design-tokens）, AC-5（HEX grep / verify-design-tokens）, AC-6（primitive 差分なし）, AC-7（`git diff -- apps/api packages/shared` 空） |

## 6. 完了状態

未カバー AC が 0 件であることを ac-matrix.md で宣言する。`formatPublishStateLabel` の 4 分岐・`buildPublishStateDiff` の note_type 分岐・`destructiveMessage` の 3 分岐が TC で網羅されることを実測値で残す方針を確定。
