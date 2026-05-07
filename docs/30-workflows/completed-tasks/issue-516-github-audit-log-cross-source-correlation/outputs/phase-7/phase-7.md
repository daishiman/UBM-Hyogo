# Phase 7 出力: CI/CD 統合

## 実装ファイル
- `.github/workflows/audit-correlation-verify.yml` — 新規 CI workflow
- `.github/CODEOWNERS` — `apps/api/src/audit-correlation/**` / `scripts/audit-correlation/**` / `audit-correlation-verify.yml` owner 追加

## ジョブ構成
- trigger: PR (paths: audit-correlation 関連) / push (main, dev)
- steps: checkout → mise-action → pnpm install --frozen-lockfile → typecheck → lint → vitest → bats(grep-gate) → bats(determinism) → shellcheck → actionlint(curl 経由)
- runner: ubuntu-24.04
- permissions: `contents: read`

## actionlint 戦略
仕様書では `rhysd/actionlint@v1` を想定していたが、本リポジトリで未採用 + 第三者 action の慣習なし。`download-actionlint.bash` を curl で取得して binary 実行する公式パターンを採用（ subresource 固定の必要時は follow-up で SHA pin）。

## 必須 status check
本タスクでは branch protection の値変更を行わない（solo 運用、`required_pull_request_reviews=null` 維持）。`audit-correlation-verify / verify` を将来必須化する旨を Phase 12 implementation guide に TODO として記録。

## 検証
- 手元で `actionlint` バイナリ未インストールのため、CI 上での 1 度目実行で確認する想定（local 実行は Phase 11 で `pnpm dlx @rhysd/actionlint-runner` を試みる）。
- CODEOWNERS errors 0 件は Phase 8 で `gh api repos/.../codeowners/errors` を実行して検証。
