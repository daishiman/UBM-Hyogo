# Phase 11: before/after wall-clock evidence

## visualEvidence

NON_VISUAL（CI 時間計測のため screenshot は不要）。

## 必須 outputs

NON_VISUAL Phase 11 として次の tracked file を必ず作成する。

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | Phase 11 総括、実行コマンド、exit code、未実行理由 |
| `outputs/phase-11/manual-smoke-log.md` | CI / local の手動確認ログ。未実行時は `runtime_pending` と user gate を明記 |
| `outputs/phase-11/link-checklist.md` | evidence path、GitHub run URL、coverage artifact、port exhaustion grep のリンク確認 |
| `outputs/phase-11/before-after.md` | wall-clock / billed minutes / coverage pct / port exhaustion grep の比較 |

## 取得対象

| 観測軸 | before（現行 single job） | after（matrix + aggregate） |
| --- | --- | --- |
| ローカル `apps/api test:coverage` | 既存 (~506s 想定) | `unit` / `d1` 個別 + merge の合計 |
| CI `coverage-gate` wall-clock | `gh run view --json jobs` の `coverage-gate` job 経過時間 | matrix 各 job の最大値 + aggregate job 時間 |
| CI 全体 wall-clock | PR ビルド完了までの elapsed | 同上 |

## 計測手順

```bash
# 1. 現行 main 上で計測
gh run list --workflow ci.yml --branch dev --limit 5 \
  --json databaseId,createdAt,updatedAt,conclusion,jobs

# 2. 本仕様書実装ブランチ push 後に同コマンドで取得
# 3. before/after を outputs/phase-11/before-after.md に記録
```

## 記録項目

`outputs/phase-11/before-after.md` に以下を記録:

- before: `coverage-gate` の wall-clock（複数 run の中央値）
- after: `coverage-gate-shard (web|api-unit|api-d1|packages)` の各 wall-clock の最大値 + `coverage-gate` 集約 job の wall-clock
- billed minutes: before / after の total billed minutes
- 短縮率 = `(before - after) / before`
- merge 後 `coverage-summary.json` の lines/branches/functions/statements pct（80% 閾値達成確認）
- port exhaustion 検出（`EADDRNOTAVAIL` / `EADDRINUSE` の grep）= 0 件であること

## 完了条件

- before/after が `outputs/phase-11/before-after.md` に記録されている
- 短縮率が正（CI 時間が短縮されている）
- coverage 閾値 80% を維持
- port exhaustion 検出 0
