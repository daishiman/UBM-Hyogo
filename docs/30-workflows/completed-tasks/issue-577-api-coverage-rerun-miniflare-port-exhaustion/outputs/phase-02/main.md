# Phase 02 — evidence 取得設計 / canonical path / log フォーマット

Status: COMPLETED
Date: 2026-05-09

## 1. canonical path 一覧

| 種別 | path |
| --- | --- |
| baseline rerun log | `outputs/phase-11/evidence/baseline-rerun-{1,2,3}.log` |
| 採用軸 / 最終 rerun log | `outputs/phase-11/evidence/full-coverage-rerun.log` |
| triage matrix log | `outputs/phase-11/evidence/triage-matrix-<axis>-<value>.log`（例: `triage-matrix-pool-forks.log`） |
| triage summary | `outputs/phase-11/evidence/triage-summary.md` |
| 環境 snapshot | `outputs/phase-11/evidence/env-snapshot.txt` |

> path はワークフロールート（`docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/`）からの相対 path。

## 2. log フォーマット仕様

各 `*.log` の構造:

```
# rerun-id=<UTC ISO8601, e.g. 2026-05-09T07:30:00Z>
# host=<uname -a>
# node=<node -v>
# pnpm=<pnpm -v>
# port_range_first=<sysctl net.inet.ip.portrange.first>
# port_range_last=<sysctl net.inet.ip.portrange.last>
<vitest stdout / stderr (2>&1)>
...
# command_result
exit_code=<N>
duration_sec=<N>
eaddrnotavail_count=<N>
```

- ヘッダは `tee` 開始前に `printf` で書き出す。
- vitest の本文は `2>&1 | tee <log>` で append される（命令的に header の後に続く）。
- `# command_result` ブロックは `${PIPESTATUS[0]}` から exit code を捕捉し、log 末尾に追記する。

## 3. triage-summary.md テンプレート

```markdown
# triage-summary

| 軸 | 値 | exit_code | exit_reason | EADDRNOTAVAIL count | duration_sec | 採用 |
| --- | --- | --- | --- | --- | --- | --- |
| baseline | (none) | ?  | ?  | ?  | ?  | -  |
| B | maxWorkers=1/minWorkers=1 | ?  | ?  | ?  | ?  | ?  |
| A | pool=forks                 | ?  | ?  | ?  | ?  | ?  |
| C | no-file-parallelism        | ?  | ?  | ?  | ?  | ?  |
| D | shard=1/2 + 2/2            | ?  | ?  | ?  | ?  | ?  |

## 採用判断
- 採用軸: <B|A|C|D|none>
- 理由: <最小侵襲で PASS が得られた軸 / 全軸で再現せず baseline で PASS / 全軸で再現不安定>

## 30day-contract
- 30day-contract 適用: <yes|no>
- schedule feedback target: <unassigned-task path or none>
```

## 4. exit_reason 分類

| exit_reason | 検出ルール |
| --- | --- |
| `pass` | exit_code=0 かつ EADDRNOTAVAIL 0 件 |
| `eaddrnotavail` | log 内に `EADDRNOTAVAIL` を 1 件以上含む |
| `assertion_fail` | `FAIL` ヘッダかつ EADDRNOTAVAIL 0 件かつ stack に `AssertionError` |
| `timeout` | `Hook timed out` または `Test timed out` |
| `setup_error` | vitest 起動失敗（config error / module error） |
| `unknown` | 上記いずれにも該当せず exit_code≠0 |

## 5. .gitignore 確認

`.gitignore` の関連エントリ調査:

```bash
grep -E "outputs|evidence|coverage" .gitignore || echo "no exclusion"
```

- `coverage/` は ignore 対象だが、`docs/30-workflows/.../outputs/phase-11/evidence/` は ignore されない設計。
- `git add -f` 不要（追加のみで commit 可）。

## 6. 命名規則整合（Issue #532 との比較）

- Issue #532 phase-11 evidence は `main.md` 単独構成。本仕様書は `evidence/` サブディレクトリを切る点で粒度が高い。
- Issue #532 phase-11 / phase-12 への same-wave sync は **追記のみ**で、本 evidence への相対 path 参照を埋め込む（重複コピー禁止）。
