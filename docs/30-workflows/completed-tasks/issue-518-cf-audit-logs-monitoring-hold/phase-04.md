# Phase 4: 環境準備

`[実装区分: 実装仕様書]`

判定根拠: 後続実装 Phase で `pnpm typecheck` / `actionlint` を実行するため、実行環境の整合確認が必要。docs のみでは検証ステップが動かない。

---

## 目的

実装着手前にローカル環境を整え、ブランチが main 最新と整合し、必要 CLI が稼働することを確認する。

## 変更対象ファイル

なし（環境確認のみ）。

## 実行手順

```bash
# 1. ブランチ確認
git rev-parse --abbrev-ref HEAD   # → spec/issue-518-cf-audit-logs-monitoring-hold

# 2. main 最新取り込み
git fetch origin main
git merge --no-ff origin/main || (echo "コンフリクト解消後 commit"; exit 1)

# 3. Node / pnpm バージョン確認
mise install
mise exec -- node -v   # → v24.x
mise exec -- pnpm -v   # → 10.x

# 4. 依存インストール
mise exec -- pnpm install

# 5. actionlint 確認（未インストールなら brew で入れる）
which actionlint || brew install actionlint
actionlint --version

# 6. 既存 cf-audit-log workflow の現状確認
ls -la .github/workflows/cf-audit-log-monitor.yml .github/workflows/cf-audit-log-monitor-watchdog.yml
```

## 入出力

- 入力: なし
- 出力: 環境準備完了の確認ログ（`outputs/phase-04/env-check.log` に保存任意）
- 副作用: `pnpm install` による `node_modules` 更新（既存）

## テスト方針

該当なし（環境確認 Phase）。

## DoD

- ブランチが `spec/issue-518-cf-audit-logs-monitoring-hold` で main 最新と整合
- `mise exec -- pnpm install` が ERROR なく完了
- `actionlint --version` が表示される
- 2 つの workflow ファイルが想定通りに存在
