# Phase 7: カバレッジ計測

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 7 / 13 |
| 目的 | unit ≥ 80% / integration ≥ 70% を満たす |
| 依存 | Phase 6 |

## 目的

本 Phase の目的は本ファイル冒頭メタ情報「目的」欄を参照。

## 実行タスク

以下のセクションで定義する設計・チェックリスト・コマンド・成果物リストを順に実行する。

## 計測対象とコマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test --coverage
mise exec -- pnpm test scripts/audit-log --coverage
```

## カバレッジ閾値

| layer | path | lines | branches | functions |
|-------|------|-------|----------|-----------|
| unit | `apps/api/src/lib/audit/redact.ts` | ≥ 90% | ≥ 85% | ≥ 90% |
| unit | `apps/api/src/repository/auditLog.ts`（追加分のみ） | ≥ 85% | ≥ 80% | ≥ 85% |
| integration | `scripts/audit-log/export-to-r2.ts` | ≥ 80% | ≥ 70% | ≥ 80% |

## 不足時の対応

- 未到達 branch を `outputs/phase-7/coverage-summary.md` に列挙し、追加 TC を Phase 6 に逆流させる
- istanbul/c8 の `coverage/coverage-summary.json` を evidence として保存

## 成果物

- `outputs/phase-7/coverage-summary.md`（layer 別閾値達成表 + 未到達 branch 一覧）

## 完了条件

- [ ] 全 layer 閾値達成
- [ ] coverage-summary.json が存在し evidence として参照可能

## 参照資料

- `.claude/skills/task-specification-creator/references/coverage-standards.md`
