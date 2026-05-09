# Phase 8 — runbook / Phase 11 evidence manifest / 30day-contract / 失敗率 gate

## 目的

rerun と triage を runbook 化し、再発時に同じ手順で再現できるようにする。30day-contract の対象になるかを Phase 8 で判定する。

## 入力 / 前提

- Phase 1 のしきい値表（ペンディング条件）
- Phase 11 evidence canonical path

## 手順

1. 簡易 runbook を以下に記録する:
   - 再発検知: CI または local で `EADDRNOTAVAIL` を含む test fail を観測した場合
   - 対応: TIME_WAIT 影響を避けるため各 rerun 間に 10 秒待機し、`bash scripts/api-coverage-rerun.sh baseline --count=3` → 再現したら matrix 軸 B → A → C → D の順で実行
   - 採用判断: PASS が得られた最小侵襲軸を `vitest.config.ts` に patch
   - 30day-contract: 30 日以内に再現が連続 3 回以上発生した場合は Issue を再起票し恒久対応に格上げ
2. Phase 11 evidence manifest を以下で固定:
   - `outputs/phase-11/main.md`: rerun 概要 + matrix 結果サマリ + 採用判断
   - `outputs/phase-11/evidence/full-coverage-rerun.log`: 最終採用軸 or baseline rerun 3 回目の log
   - `outputs/phase-11/evidence/triage-summary.md`: matrix 結果表
   - `outputs/phase-11/evidence/env-snapshot.txt`: 環境固定情報
3. 失敗率 gate: rerun 3 回中 1 回でも EADDRNOTAVAIL が出た場合、triage 採用フローへ強制遷移する gate を Phase 1 しきい値表と整合させて記録する。

## 成果物

- `outputs/phase-08/main.md`（runbook + evidence manifest + 30day-contract 判定 + 失敗率 gate）

## 検証コマンド

```bash
test -f docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-01/main.md
ls docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-11/ 2>/dev/null
```

## 完了条件（DoD）

- [ ] runbook が再発時手順として独立して読める粒度で書かれている。
- [ ] evidence manifest の canonical path が固定されている。
- [ ] 30day-contract 判定ロジックと失敗率 gate が記録されている。
