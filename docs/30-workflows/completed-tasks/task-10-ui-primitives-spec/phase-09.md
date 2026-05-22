# Phase 9: 品質保証

## メタ情報

| Phase | 値 |
| --- | --- |
| Phase番号 | 9 |
| 名称 | 品質保証 |
| 依存Phase | Phase 5, Phase 8 |
| 次Phase | Phase 10 |

## 目的

typecheck / lint / test / coverage / build / token gate を一括実行し、Phase 10 の final review に渡す。

## 実行タスク

- Task 9-1: `pnpm --filter @ubm-hyogo/web typecheck` を実行する。
- Task 9-2: `pnpm --filter @ubm-hyogo/web lint` を実行する。
- Task 9-3: `pnpm --filter @ubm-hyogo/web test` を実行する。
- Task 9-4: `pnpm --filter @ubm-hyogo/web test:coverage` を実行する。
- Task 9-5: `pnpm --filter @ubm-hyogo/web build:cloudflare` を実行する。
- Task 9-6: token grep gate と `'use client'` allowlist を実行する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 8 | `phase-08.md` | refactor result |
| package scripts | `apps/web/package.json` | command source |
| Phase 10 | `phase-10.md` | final review |

## 実行手順

```bash
pnpm --filter @ubm-hyogo/web typecheck 2>&1 | tee outputs/phase-09/typecheck.txt
pnpm --filter @ubm-hyogo/web lint 2>&1 | tee outputs/phase-09/lint.txt
pnpm --filter @ubm-hyogo/web test 2>&1 | tee outputs/phase-09/test.txt
pnpm --filter @ubm-hyogo/web test:coverage 2>&1 | tee outputs/phase-09/coverage.txt
pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 | tee outputs/phase-09/build.txt
```

## 統合テスト連携

Phase 9 は Phase 11 の runtime visual evidence 前の local gate である。coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% と task-local UI threshold を確認する。

## 多角的チェック観点（AIが判断）

| 観点 | 内容 |
| --- | --- |
| 垂直思考 | type / runtime / visual の前提を深掘り |
| システム思考 | build:cloudflare で Workers compatibility を確認 |

## サブタスク管理

| サブタスク | 成果物 |
| --- | --- |
| quality logs | `outputs/phase-09/*.txt` |

## 成果物

| 成果物 | パス |
| --- | --- |
| typecheck | `outputs/phase-09/typecheck.txt` |
| lint | `outputs/phase-09/lint.txt` |
| test | `outputs/phase-09/test.txt` |
| coverage | `outputs/phase-09/coverage.txt` |
| build | `outputs/phase-09/build.txt` |
| token gate | `outputs/phase-09/token-gate.txt` |

## 完了条件

- [ ] typecheck が成功している。
- [ ] lint が成功している。
- [ ] test が成功している。
- [ ] coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% を満たしている。
- [ ] build:cloudflare が成功している。
- [ ] token grep gate が 0 violation である。

## タスク100%実行確認【必須】

- [ ] Task 9-1 完了
- [ ] Task 9-2 完了
- [ ] Task 9-3 完了
- [ ] Task 9-4 完了
- [ ] Task 9-5 完了
- [ ] Task 9-6 完了

## 次Phase

Phase 10 で DoD を最終判定する。
