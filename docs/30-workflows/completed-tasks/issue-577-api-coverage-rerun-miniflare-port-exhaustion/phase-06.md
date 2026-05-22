# Phase 6 —（該当時）`scripts/api-coverage-rerun.sh` ヘルパスクリプト実装

## 目的

baseline rerun と triage matrix を再現可能に実行するため、`scripts/api-coverage-rerun.sh` を新規追加する。本 Phase は triage 採用または matrix 実行が必要な場合にのみ Phase 11 で実行する。

## 入力 / 前提

- Phase 4 で確定した baseline / matrix シナリオ
- `mise exec --` ラップが必須（CLAUDE.md ルール）

## 想定変更ファイル

| パス | 変更種別 | 役割 |
| --- | --- | --- |
| `scripts/api-coverage-rerun.sh` | 新規 | rerun helper（baseline / matrix 軸を flag で切替） |

## 関数 / インタフェース仕様

```bash
# scripts/api-coverage-rerun.sh

# Usage:
#   bash scripts/api-coverage-rerun.sh baseline [--count=3]
#   bash scripts/api-coverage-rerun.sh matrix --axis=B --value=maxWorkers=1
#   bash scripts/api-coverage-rerun.sh matrix --axis=A --value=pool=forks
#   bash scripts/api-coverage-rerun.sh matrix --axis=C --value=no-file-parallelism
#   bash scripts/api-coverage-rerun.sh matrix --axis=D --value=shard=1/2

# 入力: subcommand (baseline | matrix), flags
# 出力:
#   - outputs/phase-11/evidence/{baseline-rerun-N.log,triage-matrix-<axis>-<value>.log}
#   - exit code: 最後の vitest run の exit code
# 副作用: log file 書き出しのみ。git 操作なし。
```

## 手順

1. shebang `#!/usr/bin/env bash` + `set -uo pipefail` で開始する。vitest failure を収集対象にするため、rerun 実行ブロックでは `set +e` と `${PIPESTATUS[0]}` で exit code を捕捉し、log に追記してから最後に集約 exit code を返す。
2. argparse: 第 1 引数で subcommand 分岐、`--count` / `--axis` / `--value` を `${flag#*=}` で抽出。
3. 環境 snapshot を冒頭で `env-snapshot.txt` に書き込む（Node / pnpm / uname / `sysctl net.inet.ip.portrange.*` / 現在時刻）。
4. baseline: `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` を `--count` 回実行し、各 log を保存。1 回 fail しても残り rerun を継続し、`exit_code` / `duration_sec` / `eaddrnotavail_count` を各 log 末尾に追記する。
5. matrix: 軸ごとに対応する vitest CLI flag を組み立てて実行。
6. 終了時に `# exit_code=N` / `# duration_sec=N` を log 末尾に追記。

## 成果物

- `outputs/phase-06/main.md`（スクリプト仕様 + 期待 log 構造 + smoke test 手順）
- 採用時のみ: `scripts/api-coverage-rerun.sh`

## 検証コマンド

```bash
shellcheck scripts/api-coverage-rerun.sh
bash scripts/api-coverage-rerun.sh baseline --count=1
ls -la docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-11/evidence/
tail -20 docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-11/evidence/baseline-rerun-1.log
```

## 完了条件（DoD）

- [ ] スクリプト仕様が flag 引数まで明文化されている。
- [ ] shellcheck clean。
- [ ] baseline `--count=1` が log を所定 path に書き出して PASS / FAIL 問わず exit する。
- [ ] fail 時も `exit_code` / `duration_sec` / `eaddrnotavail_count` が log に追記される。
