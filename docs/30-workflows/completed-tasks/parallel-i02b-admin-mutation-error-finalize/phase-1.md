# Phase 1: 分析・スコープ確定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 種別 | 分析 |
| 入力 | source spec（`parallel-i02b-admin-mutation-error-finalize/spec.md`）、現行 `apps/web` コード |
| 出力 | baseline grep ログ、隠れ参照の有無確認、AC 確定 |

## 目的

`AdminMutationError` の baseline 参照箇所を全件特定し、置換後に `FetchAuthedError.bodyText` fallback が必要な箇所を洗い出す。

## 実行タスク

1. baseline grep を実行し、`AdminMutationError` 全参照を行番号付きで取得する
2. 件数が 12 件（hook 内 class 定義 2 行 + Meeting 4 + Schema 4 + Request 3 — `name = "AdminMutationError"` の line 33 を含む 11 + class 宣言行 1 = 12）の範囲内であることを確認する
3. 3 panel の error handling block で user-facing fallback が `FetchAuthedError.bodyText` を読む必要がある箇所を確認する
4. `useAdminMutation.ts:26` で `FetchAuthedError` が re-export されていることを確認する
5. `apps/web/src/features/admin/hooks/index.ts` に `AdminMutationError` が export 列に**含まれていない**ことを確認する（含まれていたら spec の前提が崩れる）

## 実行手順

```bash
# 1. 全参照行を取得
grep -rn "AdminMutationError" apps/web --include='*.ts' --include='*.tsx'

# 2. 件数集計
grep -rn "AdminMutationError" apps/web --include='*.ts' --include='*.tsx' | wc -l

# 3. message/bodyText fallback 影響の検出
grep -n "e\.message\|err\.message\|error\.message" \
  apps/web/src/components/admin/MeetingPanel.tsx \
  apps/web/src/components/admin/SchemaDiffPanel.tsx \
  apps/web/src/components/admin/RequestQueuePanel.tsx

# 4. FetchAuthedError re-export 確認
grep -n "FetchAuthedError" apps/web/src/features/admin/hooks/useAdminMutation.ts
grep -n "AdminMutationError\|FetchAuthedError" apps/web/src/features/admin/hooks/index.ts
```

## 完了条件


- [x] Phase 1 の完了条件を満たす証跡が保存されている。
- baseline 12 箇所が source spec §変更対象ファイル と完全一致する
- 3 panel の fallback 表示が `FetchAuthedError.bodyText` で旧表示を維持できる
- `FetchAuthedError` が `useAdminMutation.ts` 経由で import 可能と確認できる

## 参照資料

- source spec §1, §6, §設計
- `apps/web/src/lib/fetch/errors.ts:1-17`

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| admin error contract | `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` | i02 client hook shared error contract |

## 統合テスト連携

- NON_VISUAL のため画面証跡ではなく、focused Vitest / typecheck / lint / grep gate のログで連携確認する。
