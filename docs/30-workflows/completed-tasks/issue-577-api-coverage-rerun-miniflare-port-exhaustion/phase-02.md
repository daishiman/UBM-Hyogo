# Phase 2 — evidence 取得設計 / canonical path / log フォーマット

## 目的

rerun と triage で取得する evidence の canonical path / 命名規則 / log フォーマットを Phase 2 で固定し、Phase 11 で機械的に追記できる状態にする。

## 入力 / 前提

- Phase 1 のしきい値表
- Issue #532 既存 evidence の命名規則（参考にして整合させる）

## 手順

1. canonical path を以下に固定する:
   - rerun log: `outputs/phase-11/evidence/full-coverage-rerun.log`
   - triage summary: `outputs/phase-11/evidence/triage-summary.md`
   - matrix log: `outputs/phase-11/evidence/triage-matrix-<axis>-<value>.log`（例: `triage-matrix-pool-forks.log`）
   - 環境 snapshot: `outputs/phase-11/evidence/env-snapshot.txt`（Node / pnpm / OS / port range）
2. log フォーマットを以下で定義する:
   - 1 行目: `# rerun-id=<UTC ISO8601>` / `# host=<uname -a>` / `# node=<node -v>` / `# pnpm=<pnpm -v>`
   - 2 行目以降: vitest stdout/stderr を `2>&1` で statu コードと共に redirect
   - 末尾: `# exit_code=<N>` / `# duration_sec=<N>`
3. triage-summary.md のテンプレートを定義する（matrix 軸 / 値 / 結果 / 採用判断）。
4. evidence の保存先が `.gitignore` 対象か確認し、明示的に commit 対象として `git add -f` 必要なら Phase 13 手順に組み込む。

## 成果物

- `outputs/phase-02/main.md`（canonical path 一覧 + log フォーマット定義 + triage-summary テンプレート）

## 検証コマンド

```bash
ls -la docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-11/ 2>/dev/null || echo "evidence dir to be created in Phase 11"
cat .gitignore | grep -E "outputs|evidence|coverage" || echo "no exclusion"
```

## 完了条件（DoD）

- [ ] canonical path 一覧が固定されている。
- [ ] log フォーマット仕様が再現可能なレベルで記述されている。
- [ ] triage-summary テンプレートが Phase 11 で穴埋めできる粒度になっている。
