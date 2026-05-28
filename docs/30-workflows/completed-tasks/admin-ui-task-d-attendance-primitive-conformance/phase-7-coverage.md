---
実装区分: 実装仕様書
Phase: 7
状態: completed
task_id: admin-ui-task-d-attendance-primitive-conformance
親: [index.md](./index.md)
前: [phase-6-test-additions.md](./phase-6-test-additions.md)
次: [phase-8-refactor.md](./phase-8-refactor.md)
---

# Phase 7: カバレッジ

## 7.1 対象スコープ

- 変更ファイル: `attendance/page.tsx`（書き換え）+ `attendance-page.spec.tsx`（新規）
- delta coverage 影響は単一画面に限定

## 7.2 計測コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage -- attendance-page
```

## 7.3 閾値

- pre-push `scripts/coverage-guard.sh --changed` の差分閾値内に収まること
- attendance page の line / branch coverage を before / after で記録（PR 本文に貼付）

## 7.4 design-token gate

```bash
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
```

attendance page 内に HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が無いことを保証。

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 7 |
| 対象 | coverage / token gate |

## 目的

coverage と design-token gate を定義する。

## 実行タスク

- focused coverage を取得する。
- design-token gate を実行する。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| web package | `apps/web/package.json` | test / token scripts |

## 成果物

| 成果物 | パス | 内容 |
|--------|------|------|
| coverage log | `outputs/phase-7/coverage.md` | 実装時に記録 |

## 完了条件

- [ ] coverage と design-token gate の実行結果を記録する。
