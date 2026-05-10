# Phase 8: リファクタリング判断（task-01）

| 項目 | 値 |
|------|----|
| 入力 | `phase-7.md` 完了（結合テスト PASS） |
| 出力 | リファクタリング非対象である理由の明文化 |

---

## 1. 結論

**本 task のリファクタリング対象は無い**。Phase 5 の差分は最小スコープに閉じており、追加の構造改善は task-01 のスコープ外。

---

## 2. 検討した候補と棄却理由

| 候補 | 採否 | 理由 |
|---|---|---|
| `scripts/cf.sh` の `CF_SH_SKIP_WITH_ENV` 分岐をリファクタリングしてエラーメッセージを改善する | ✗ | 不変条件 1（cf.sh 変更禁止）に反する。task-01 の目的（secret 名整合）から逸脱 |
| `Verify CF token is present` step を composite action / reusable workflow に切り出す | ✗ | 同 step は 2 箇所のみで重複コストが低い。抽象化はオーバーエンジニアリング |
| `web-cd.yml` の `deploy-staging` / `deploy-production` を matrix job に統合 | ✗ | 環境固有の挙動差（rollback 手順 / Slack 通知等）が出てきた際に複雑化する。本 task の差分とは独立した設計判断 |
| `secrets.CLOUDFLARE_API_TOKEN` 参照を `env:` ではなく step-level `env:` に変更 | ✗ | 既存構造 (job-level env) を維持する方が差分が小さい。挙動差なし |

---

## 3. 将来的に検討する余地（informational backlog 候補）

以下は本 PR では実施しない。いずれも task-01 の受入基準を満たすために不要な改善候補であり、CONST_005 の「検出した改善点」ではなく情報整理として扱う。

| # | 内容 | 優先度 |
|---|------|-------|
| BL-01 | `web-cd.yml` の deploy step を `scripts/cf.sh` 経由ではなく `cloudflare/wrangler-action` への移行検討 | 低 |
| BL-02 | `Verify CF token is present` step の composite action 化（runtime-smoke-staging.yml task-02 にも類似 step が入るため） | 中（task-02 完了後に検討） |
| BL-03 | `cf.sh` のエラーメッセージ多言語化（現状日本語） | 低 |

formal backlog 化が必要になった場合の記録先: `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/outputs/phase-12/unassigned-task-detection.md`。今回 cycle では新規未タスク 0 件。

---

## 4. exit criteria

| # | 条件 |
|---|------|
| EX-01 | リファクタリング非対象の結論が明文化されている |
| EX-02 | 棄却した候補と理由が表で確定している |
| EX-03 | backlog 候補が記録されている |
