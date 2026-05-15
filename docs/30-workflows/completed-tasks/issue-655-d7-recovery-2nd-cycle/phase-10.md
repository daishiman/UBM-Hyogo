# Phase 10 — 段階デプロイ

## 目的

PR-A merge → D'+0 開始 → daily check → D'+7 集計 までの段階デプロイをタイムライン化する。

## タイムライン

| 時点 | 操作 | evidence path |
| --- | --- | --- |
| D'-1 | PR-A を `dev` に merge | (gh merge log) |
| D'-1+ε | `cf-audit-log-monitor.yml` hourly run が next schedule で起動し success することを確認 | `outputs/phase-11/evidence/recovery-d-minus-1.log` |
| D'+0 | 最初の success hourly run を確定 | `recovery-rootcause.md` frontmatter `d_prime_zero` |
| D'+1 | daily check 1 回目 | `hourly-run-daily-check-recovery.md` (D'+1 行) |
| D'+3 | daily check 2 回目 | 同上 (D'+3 行) |
| D'+5 | daily check 3 回目 | 同上 (D'+5 行) |
| D'+7 | `cf-audit-log-7day-summary.yml` を `recovery_mode=true / since=<D'+0>` で workflow_dispatch | run URL を `hourly-run-7day-recovery.md` に保存 |
| D'+7 直後 | aggregate JSON / leakage log / issue-rate 比較 を生成 | Phase 11 で詳述 |
| D'+7+ε | PR-B (evidence 追加 + SSOT 4 ファイル更新) を起こす | Phase 13 |

## 失敗時の分岐

- hourly run が D'+1〜D'+6 中に再失敗: Phase 1 に戻り root cause 再分類。max 2 周ガードに該当するか判定
- artifact retention 失効 (`gh api artifacts` で 404): retention 設定が `>= 8` であることを再確認、設定漏れなら緊急で PR を当てる (recovery window 中の唯一の許容変更)

## 完了条件

- [ ] タイムラインに沿って D'+7 集計の workflow_dispatch まで到達
- [ ] D'+7 aggregate JSON が `actualSnapshots: 168` を満たす（満たさなければ max 2 周ガード判定へ）
