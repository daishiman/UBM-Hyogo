# Phase 9: カバレッジ確認

[実装区分: 実装仕様書]

## メタ情報

| Phase | 9 |
| 前提 | Phase 8 完了 |
| 後続 | Phase 10 |

## 目的

coverage Statements/Branches/Functions/Lines >=80% を `apps/api` / `apps/web` / `packages/*` で達成し、`scripts/coverage-guard.sh` exit 0 を確認。

## 実行コマンド

```bash
mise exec -- pnpm test:coverage
bash scripts/coverage-guard.sh
```

出力を `outputs/phase-09/coverage-report.md` に保存。

## 完了条件

- [ ] 全 workspace で 4 指標 >=80%
- [ ] `scripts/coverage-guard.sh` exit 0
- [ ] 新規 3 component の statements coverage が 80% 以上

## タスク100%実行確認【必須】

- [ ] coverage 数値を `outputs/phase-09/main.md` に貼り付け

## 次Phase

Phase 10 へ。
