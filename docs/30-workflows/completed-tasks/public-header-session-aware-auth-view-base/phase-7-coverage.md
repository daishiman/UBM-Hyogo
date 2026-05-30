# Phase 7 — カバレッジ確認

## 1. 対象範囲（変更ファイルに限定）

| ファイル | line | branch | 目標 |
|---------|------|--------|------|
| `apps/web/src/lib/auth-view/resolveAuthView.ts` | 100% | 100% | 全分岐網羅（guest/member/admin/各 falsy） |
| `apps/web/src/lib/auth-view/getAuthView.ts` | 100% | 100% | try / catch / null 戻り の 3 path |
| `apps/web/src/lib/auth-view/types.ts` | N/A | N/A | 型定義のみ |
| `apps/web/src/lib/auth-view/index.ts` | N/A | N/A | barrel |
| `apps/web/src/components/public/PublicHeader.tsx` | 95%+ | 90%+ | 3 kind × Slot 描画分岐 |

## 2. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --coverage \
  src/lib/auth-view src/components/public
```

## 3. 確認項目

- [ ] `resolveAuthView.ts` 全行・全 branch hit
- [ ] `getAuthView.ts` catch 経路が TC-GAV-01 で hit
- [ ] `PublicHeader.tsx` の 3 分岐（guest/member/admin）が各 TC-PH-02/03/04 で hit
- [ ] 変更外ファイル（既存 nav 等）の coverage 低下なし（差分のみ評価）

## 4. 完了条件

- [ ] 変更行 line 100% / branch 100%（resolveAuthView + getAuthView）
- [ ] PublicHeader の追加分岐すべて hit
