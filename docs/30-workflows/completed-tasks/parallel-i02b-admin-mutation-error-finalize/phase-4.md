# Phase 4: 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 種別 | 実装 |
| 入力 | Phase 2 置換マッピング、Phase 3 read-only 不変条件 |
| 出力 | 4 ファイル変更 / 中間 typecheck PASS / 最終 typecheck PASS |

## 目的

Phase 2 で確定した 12 箇所の置換を、Phase 2 §実装順序に厳密に従って適用する。

## 実装手順

### Step 1: `MeetingPanel.tsx`

```text
- line 18: import の AdminMutationError → FetchAuthedError
- line 54: throw new AdminMutationError → throw new FetchAuthedError
- line 164: instanceof AdminMutationError → instanceof FetchAuthedError
- line 165: instanceof AdminMutationError → instanceof FetchAuthedError
```

### Step 2: `SchemaDiffPanel.tsx`

```text
- line 26: import の AdminMutationError → FetchAuthedError
- line 122: throw new AdminMutationError → throw new FetchAuthedError
- line 203: instanceof AdminMutationError → instanceof FetchAuthedError
- line 210: instanceof AdminMutationError → instanceof FetchAuthedError
```

### Step 3: `RequestQueuePanel.tsx`

```text
- line 11: import の AdminMutationError → FetchAuthedError
- line 68: throw new AdminMutationError → throw new FetchAuthedError
- line 130: instanceof AdminMutationError → instanceof FetchAuthedError
```

### Step 4: 中間 typecheck

```bash
mise exec -- pnpm typecheck
```

→ panel 3 件が `FetchAuthedError` re-export で型解決できることを確認。失敗時は Step 1-3 を見直す。`useAdminMutation.ts` の class 定義は**まだ残っている**ため、ここで全体 PASS する。

### Step 5: `useAdminMutation.ts` class 定義削除

```text
- line 28-36 ブロック（export class AdminMutationError extends Error { ... }）を完全削除
- 前後の `export { FetchAuthedError };`（line 26）と `const extractErrorMessage = ...`（line 38）が直接隣接する形にする
```

### Step 6: 最終 typecheck

```bash
mise exec -- pnpm typecheck
```

### Step 7: 残存確認

```bash
grep -rn "AdminMutationError" apps/web --include='*.ts' --include='*.tsx'
```

→ **0 件**であること。1 件でも残っていたら追加置換する。

## 推奨ツール

- `Edit` ツールでの mechanical 置換を推奨
- bulk 置換時は `replace_all` 不可（import 1 行 + throw / instanceof は文脈が異なるため一括 sed は事故の元）

## 完了条件


- [x] Phase 4 の完了条件を満たす証跡が保存されている。
- 12 箇所すべて置換完了
- Step 4 / 6 の typecheck PASS
- Step 7 の grep が 0 件

## 失敗時の rollback

```bash
git restore apps/web/src/features/admin/hooks/useAdminMutation.ts \
  apps/web/src/components/admin/MeetingPanel.tsx \
  apps/web/src/components/admin/SchemaDiffPanel.tsx \
  apps/web/src/components/admin/RequestQueuePanel.tsx
```

## 参照資料

- Phase 2 置換マッピング表
- Phase 2 §実装順序（順序逆転禁止）
- source spec §2-§5

## 実行タスク

- Phase 4 の本文に記載済みの手順を実行し、完了証跡を該当 outputs に保存する。

## 成果物

- Phase 4 の検証結果と関連ログ。

## 統合テスト連携

- NON_VISUAL のため画面証跡ではなく、focused Vitest / typecheck / lint / grep gate のログで連携確認する。
