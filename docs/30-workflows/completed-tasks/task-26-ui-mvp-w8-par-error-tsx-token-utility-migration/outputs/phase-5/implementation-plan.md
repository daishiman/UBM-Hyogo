# Phase 5 — 実装

## 実装前 0 ステップ: 現状確認（diff check）

```bash
# error.tsx 実存と内容確認
ls apps/web/app/error.tsx
rg -n 'text-\[var\(|bg-\[var\(|border-\[var\(|fg-muted|ubm-color-(primary|on-primary|border|surface-2)' apps/web/app/error.tsx

# 副次対象 grep
for f in global-error.tsx not-found.tsx loading.tsx; do
  if [ -f "apps/web/app/$f" ]; then
    echo "=== $f ==="
    rg -n 'text-\[var\(|bg-\[var\(|border-\[var\(|fg-muted|ubm-color-(primary|on-primary|border|surface-2)' "apps/web/app/$f" || echo "(no arbitrary value)"
  fi
done
```

### error.tsx 未存在の場合

task-05 がまだ未マージなら本 task は blocked。現行 worktree では `apps/web/app/error.tsx` が存在するため実装可能。

## 実装タスク

### Task 5-1: error.tsx の className 置換

`apps/web/app/error.tsx` を編集し、Phase 2 のマッピング表に従って Edit で置換する。複数行の同パターンは `replace_all` を活用。

### Task 5-2: 副次対象の同種パターン置換（存在する場合のみ）

- `apps/web/app/global-error.tsx`
- `apps/web/app/not-found.tsx`
- `apps/web/app/loading.tsx`

それぞれ Phase 2 マッピングに基づき置換。`fg-muted` は `text-text-3` 統合。

### Task 5-3: 検証コマンド実行

```bash
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web lint
pnpm --filter @ubm-hyogo/web verify-design-tokens
pnpm --filter @ubm-hyogo/web test -- apps/web/app/__tests__/error.component.spec.tsx
rg -n 'text-\[var\(|bg-\[var\(|border-\[var\(|fg-muted|ubm-color-(primary|on-primary|border|surface-2)' apps/web/app/error.tsx apps/web/app/not-found.tsx apps/web/app/loading.tsx || echo OK
```

## 新規作成 / 修正ファイル一覧（FB-RT-03）

| 種別 | パス |
|------|------|
| 修正 | `apps/web/app/error.tsx` |
| 修正（該当あり） | `apps/web/app/not-found.tsx` |
| 修正（該当あり） | `apps/web/app/loading.tsx` |
| 修正 | `apps/web/app/__tests__/error.component.spec.tsx` |

## SSOT / bridge 不変条件チェック

| ファイル | 操作 |
|---------|------|
| `apps/web/src/styles/tokens.css` | **触らない** |
| `apps/web/src/styles/globals.css` | **触らない** |
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | **触らない** |

## 自動修復（最大 3 回）

- typecheck fail: utility 名 typo を再確認（`text-text-3` vs `text-muted` 等）
- lint fail: `pnpm lint --fix` を試す
- build fail: OpenNext Workers の依存問題は本 task の範疇外 → blocked 報告
