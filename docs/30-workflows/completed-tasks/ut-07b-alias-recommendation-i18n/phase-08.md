# Phase 8: リファクタリング

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 名称 | リファクタリング |
| 想定差分 | 極小（helper 1 個 + 1 行差し替えのため発生しない見込み） |

## 目的

Phase 5-6 の変更に対し、重複・命名ドリフトがないかを確認する。リファクタは原則発生しない見込みだが、念のためチェックを行う。

## 実行タスク

1. `grep` で NFKC normalize の重複定義がないことを確認する
2. helper の命名が既存 camelCase 規則と整合することを確認する
3. JSDoc コメント内に `*/` を含む式がないことを確認する（esbuild パース問題回避）
4. typecheck / lint を再実行する
5. リファクタ不要 / 実施差分テーブルを記録する

## チェック観点

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| helper 命名 | （新規） | `normalizeLabelForCompare` | camelCase 一貫 |
| NFKC 重複 | なし | 単一定義 | grep で確認 |
| JSDoc | — | `*/` を含まない | esbuild 安全 |

## 実行コマンド

```bash
grep -rn 'normalize("NFKC")' apps/api/src
grep -rn 'normalizeLabelForCompare' apps/api/src
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 参照資料

- `outputs/phase-05/green-test-result.md`
- `apps/api/src/services/aliasRecommendation.ts`

## 統合テスト連携

- typecheck / lint PASS を Phase 9 品質保証の前提条件として渡す

## 成果物

`outputs/phase-08/refactor-notes.md` に「リファクタ不要」または実施した差分テーブルを記録。

## 完了条件

- [ ] 命名 / 重複 / JSDoc の 3 観点で問題なし
- [ ] typecheck / lint PASS
- [ ] `outputs/phase-08/refactor-notes.md` が存在する
