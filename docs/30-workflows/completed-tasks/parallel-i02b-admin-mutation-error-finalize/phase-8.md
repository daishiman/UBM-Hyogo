# Phase 8: 受入検証（AC 機械検証）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 種別 | 受入検証 |
| 入力 | Phase 4-7 出力 |
| 出力 | AC-1〜AC-7 の機械検証結果 |

## 目的

index.md §受け入れ条件 の AC-1〜AC-7 を、機械で再現可能なコマンドで検証する。

## AC 検証

### AC-1: `AdminMutationError` クラス定義削除

```bash
grep -n "class AdminMutationError" apps/web/src/features/admin/hooks/useAdminMutation.ts
# → 0 件を期待
```

### AC-2: 3 panel の参照置換完了

```bash
for f in \
  apps/web/src/components/admin/MeetingPanel.tsx \
  apps/web/src/components/admin/SchemaDiffPanel.tsx \
  apps/web/src/components/admin/RequestQueuePanel.tsx
do
  echo "== $f =="
  grep -n "AdminMutationError" "$f" || echo "  (clean)"
  grep -n "FetchAuthedError"   "$f"
done
```

→ 各 panel で `AdminMutationError` が 0 件、`FetchAuthedError` が import + throw + instanceof 数だけ出現する。

### AC-3: グローバル grep 0 件

```bash
grep -rn "AdminMutationError" apps/web --include='*.ts' --include='*.tsx' | wc -l
# → 0
```

### AC-4: typecheck PASS

```bash
mise exec -- pnpm typecheck && echo "AC-4 PASS"
```

### AC-5: lint PASS

```bash
mise exec -- pnpm lint && echo "AC-5 PASS"
```

### AC-6: 4 spec PASS

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run "(MeetingPanel|SchemaDiffPanel|RequestQueuePanel|useAdminMutation)" \
  && echo "AC-6 PASS"
```

### AC-7: public API signature 不変

```bash
# UseAdminMutationReturn 型に変更がないこと
grep -n "UseAdminMutationReturn" apps/web/src/features/admin/hooks/useAdminMutation.ts
git diff -- apps/web/src/features/admin/hooks/useAdminMutation.ts \
  | grep -E "^[-+].*UseAdminMutationReturn" || echo "AC-7 PASS (signature unchanged)"
```

### AC-8: integration tracker 同期

```bash
grep -n "i02.*completed locally\\|i02b.*completed locally" \
  docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md
```

→ i02 / i02b がともに `completed locally` と記録される。

## 完了条件


- [x] Phase 8 の完了条件を満たす証跡が保存されている。
- AC-1〜AC-8 すべて PASS
- 結果を `outputs/phase-11/evidence/ac-verification.log` に保存

## 参照資料

- index.md §受け入れ条件
- Phase 4-7 出力

## 実行タスク

- Phase 8 の本文に記載済みの手順を実行し、完了証跡を該当 outputs に保存する。

## 成果物

- Phase 8 の検証結果と関連ログ。

## 統合テスト連携

- NON_VISUAL のため画面証跡ではなく、focused Vitest / typecheck / lint / grep gate のログで連携確認する。
