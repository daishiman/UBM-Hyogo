# Phase 5: 依存グラフ / 実装着手順序 / 並列実行可否

## 1. 依存グラフ

```
B-1 (read-only 観測 H1..H5)
    └─> B-2 (root-cause 確定)
            ├─> B-3 (復旧手段選択)
            │       └─> B-4 (復旧実行 / Gate-C)
            │               └─> B-5 (回帰防止)
            └─> [H5 hit のみ] proxy-path.spec.ts 追加

A-1 (AdminPageHeader 配線)
    └─> A-2 (list wrapper card 化)
            └─> A-3 (Row primitives/tokens 置換)
                    └─> A-4 (modal surface 整合)
                            └─> A-5 (vitest 更新)
                                    └─> A-6 (playwright selector 更新)
```

## 2. 着手順序（B 先行 → A 整合）

理由:

- B の root-cause が確定しないと、A の UI 整合 PR を merge しても staging で `ADMIN_FETCH_404` が消えない可能性がある（解決感が薄れる）
- B-1 (観測) は read-only でリスクが低く、A 着手と並行可能
- B-3 / B-4 (復旧実行) は Gate-C で user-gated。A 実装と PR 作成は並行進行可

推奨順序:

1. **B-1** read-only 観測（H1..H5 全部）→ 〜30 分目安
2. **B-2** triage レポート起こし
3. **A-1 → A-2 → A-3 → A-4 → A-5 → A-6** を順次実装（A-1 と A-2 は 1 commit にまとめても可）
4. **B-3 / B-4** 復旧実行（Gate-C で user 承認後）
5. **B-5** 回帰防止（H5 hit 時のみ vitest 追加、それ以外は runbook 追記）
6. Phase 11 で local screenshot 3 枚 + staging 復旧 evidence 取得
7. Phase 12 で strict 7 + unassigned-task detection
8. Phase 13 で commit / push / PR（Gate-C）

## 3. 並列実行可否

| ペア | 並列可? | 理由 |
|---|---|---|
| B-1 観測 ∥ A-1〜A-5 実装 | ✅ 可 | B-1 は read-only、A は web 単独で B の結果に依存しない |
| B-3 (H1/H3 ops 復旧) ∥ A 全般 | ✅ 可 | ops 操作は staging 環境、A は local で完結 |
| B-3 (H2/H5 code 復旧) ∥ A-3〜A-4 | ⚠️ 注意 | 同じ apps/web に diff が乗るので merge conflict 回避のため別 commit で分離 |
| A-5 vitest 更新 ∥ A-6 playwright 更新 | ✅ 可 | テスト追加は独立 |
| Phase 11 screenshot ∥ Phase 11 staging recovery | ⚠️ 順序付き | staging 復旧 → screenshot の順（404 が消えないと list が撮れない） |

## 4. ボトルネック

| 区分 | 所要 (目安) |
|---|---|
| B-1 read-only 観測 | 30 分 |
| B-2 triage まとめ | 15 分 |
| A 実装 (A-1〜A-6) | 90 分 |
| B-3/B-4 復旧（Gate-C 待ち含む） | 30 分〜（user 承認次第） |
| Phase 11 evidence 取得 | 30 分 |
| Phase 12 strict 7 | 60 分 |
| Phase 13 commit/push/PR | 30 分 |

> 最大の不確実性は B-4 復旧（Gate-C user 承認待ち）。A 実装は user 承認に依存せず並行進行できる設計にしている。
