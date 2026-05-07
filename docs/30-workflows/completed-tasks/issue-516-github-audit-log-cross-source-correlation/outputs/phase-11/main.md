# Phase 11: NON_VISUAL evidence サマリ

## evidence ファイル一覧

| ファイル | 内容 | exit |
| --- | --- | --- |
| [typecheck.log](./typecheck.log) | `pnpm --filter @ubm-hyogo/api typecheck` | 0 |
| [lint.log](./lint.log) | `pnpm --filter @ubm-hyogo/api lint` | 0 |
| [test.log](./test.log) | `pnpm --filter @ubm-hyogo/api test src/audit-correlation` (123 files / 834 tests pass) | 0 |
| [coverage.log](./coverage.log) | coverage 数値は未収集。audit-correlation 主要分岐の test inventory | 0 |
| [build.log](./build.log) | `pnpm --filter @ubm-hyogo/api build` (`tsc -p tsconfig.build.json --noEmit`) | 0 |
| [bats.log](./bats.log) | grep-gate.bats (9/9) + runner-determinism.bats (3/3) | 0 |
| [shellcheck.log](./shellcheck.log) | `shellcheck scripts/audit-correlation/*.sh` | 0 |
| [actionlint.log](./actionlint.log) | official actionlint installer で local 実行し clean | 0 |
| [grep-gate.log](./grep-gate.log) | `grep-gate.sh outputs/phase-11/high-alert-sample.json` | 0 |
| [high-alert-sample.json](./high-alert-sample.json) | HIGH alert dry-run 出力（test salt） | severity=HIGH |

## visualEvidence
NON_VISUAL（スクリーンショットなし）。

## 検証結果
- typecheck / lint / test / build / shellcheck / grep-gate / actionlint: exit 0
- bats 12 tests: exit 0。local esbuild binary mismatch 時は `run.sh` の `pnpm dlx tsx@4.21.0` fallback で runner を検証。
- HIGH alert dry-run: `severity === "HIGH"`、events 2 件（github org.update_member + cloudflare login_fail）
- PII 検出 0 件: `grep-gate.log` で完全 IPv4 / 完全 IPv6 / 完全 email / 完全 UA / GitHub PAT / salt literal のいずれも未検出
