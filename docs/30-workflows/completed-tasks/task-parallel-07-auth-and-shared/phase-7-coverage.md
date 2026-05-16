# Phase 7: カバレッジ確認

> Phase: 7 / 13
> 名称: カバレッジ確認
> 閾値: 行・分岐 **80%** 以上

---

## 7.1 対象ファイル

| パス | 期待カバレッジ |
|------|---------------|
| `apps/web/app/login/error.tsx` | 90%+ |
| `apps/web/app/login/loading.tsx` | 100%（分岐ほぼ無し） |
| `apps/web/app/error.tsx` | 85%+ |
| `apps/web/app/profile/loading.tsx` | 100%（分岐ほぼ無し） |

`apps/web/app/loading.tsx` と `apps/web/app/not-found.tsx` は変更なしの場合 carry-over とする（既存カバレッジに依存）。

---

## 7.2 計測コマンド

```bash
mise exec -- pnpm test -- --coverage \
  apps/web/__tests__/login-error.spec.tsx \
  apps/web/__tests__/login-loading.spec.tsx \
  apps/web/__tests__/root-error.spec.tsx \
  apps/web/__tests__/profile-loading.spec.tsx
```

---

## 7.3 期待出力

| metric | 閾値 | 期待 |
|--------|------|------|
| Lines | 80% | 90%+ |
| Branches | 80% | 80%+ |
| Functions | 80% | 100% |
| Statements | 80% | 90%+ |

---

## 7.4 例外 / 未到達分岐

- `error.digest` 不在分岐: A1 でカバー
- `reset()` throw 経路: Next.js 内部の error boundary に委譲、本タスクの spec ではカバーしない（実装側の責務）

---

## 7.5 完了判定

- 4 spec の合算で 80% 以上
- 未到達分岐は理由付きで本ドキュメントに記録
- `outputs/phase-7/coverage.md` ないし `coverage/lcov-report/` を成果物として保存

---

## 次フェーズへの引き継ぎ

Phase 8 では skeleton の重複（login/loading / profile/loading / root/loading）が再利用可能な shared util に切り出せるか判断する（過剰抽象化禁止）。
