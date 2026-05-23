# Phase 7 — カバレッジ確認

## 対象範囲（広域 ではなく局所）

| ファイル | 種別 | カバレッジ目標 |
|---------|------|---------------|
| `apps/web/app/error.tsx` | UI render | render path 100%（render → class 解決） |
| `apps/web/app/global-error.tsx` | 該当時 | 同上 |
| `apps/web/app/not-found.tsx` | 該当時 | 同上 |
| `apps/web/app/loading.tsx` | 該当時 | 同上 |

## 変更行カバレッジ実測（FB-5）

className 置換のため新規 branch は発生しない。変更行は `class` attribute 内の文字列のみ。

- line coverage 変更箇所: 6 行（想定）
- branch coverage 変更: 0（branch 追加なし）

## 計測方法

```bash
pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/__tests__/error.component.spec.tsx --coverage
# error.tsx / not-found.tsx / loading.tsx の render coverage を確認
```

## 評価

className のみの変更のため pure render path が変わらず、既存テストでカバレッジ維持される想定。
