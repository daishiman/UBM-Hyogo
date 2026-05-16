# Phase 06: 実装手順

## 実施結果

実装は `apps/web/app/profile/_components/` 配下にコミット前差分として反映済み。`git diff --stat` で確認可能。

```text
DeleteRequestDialog.component.spec.tsx     | 59 ++++++++++++++++++++++
DeleteRequestDialog.tsx                    |  3 ++
RequestActionPanel.component.spec.tsx      | 27 ++++++++++
RequestActionPanel.tsx                     | 29 ++++++++---
VisibilityRequestDialog.component.spec.tsx | 43 +++++++++++++++-
VisibilityRequestDialog.tsx                |  3 ++
6 files changed, 157 insertions(+), 7 deletions(-)
```

## ステップ実施記録

1. `VisibilityRequestDialog.tsx` に `useRouter` import / hook / `router.refresh()` を追加（line 13, 39, 80）
2. `DeleteRequestDialog.tsx` に同様の変更を追加（line 71）
3. `RequestActionPanel.tsx` の `onSubmitted` に存在した `router.refresh()` を削除し、accepted bridge state へ移譲
4. `VisibilityRequestDialog.component.spec.tsx` に refresh 検証ケース追加（+43 行）
5. `DeleteRequestDialog.component.spec.tsx` に refresh 検証ケース追加（+59 行）
6. `RequestActionPanel.component.spec.tsx` に non-regression ケース追加（+27 行）

## 自己確認（CONST_005）

- `git status` で 6 ファイルの modified を確認
- `git diff` で `router.refresh()` 呼び出し位置を確認（`grep -n router.refresh` で dialog 2 件のみが result, panel からは消失）

## 次フェーズ前提

テスト実行は Phase 07 で評価する。
