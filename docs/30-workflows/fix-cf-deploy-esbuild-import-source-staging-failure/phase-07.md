# Phase 7: 統合テスト方針

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 名称 | 統合テスト方針 |
| 作成日 | 2026-05-17 |
| 担当 | delivery |
| 状態 | runtime_pending |
| 前 Phase | 6 (ユニットテスト影響評価) |
| 次 Phase | 8 (ドキュメント更新) |

## 目的

本タスクの本質的な統合テストは **GitHub Actions の deploy job 緑化** そのもの。
加えて、同種の依存メタ起因事故の再発防止のため、CI に build-only ゲートを追加する余地を評価する。

## 統合テスト戦略

### Step 1: PR push → CI 自動実行

| ジョブ | 期待 |
| --- | --- |
| `web-cd / deploy-staging` | PASS（`"import-source"` エラー消失） |
| `backend-ci / deploy-staging` | PASS（同上） |
| `web-cd / deploy-production` | PR では発火しない（main マージ後に観測） |
| `backend-ci / deploy-production` | 同上 |
| 他 required status checks | regression なし |

### Step 2: CI ログ確認ポイント

- `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` ステップで esbuild エラーが出ないこと。
- `cloudflare/wrangler-action@v3` (`wranglerVersion: 4.85.0`) の deploy ステップで esbuild エラーが出ないこと。
- `update available 4.92.0` の通知は無害なので無視可。

### Step 3: production 緑化観測

- main マージ後、`web-cd / deploy-production` と `backend-ci / deploy-production` を観測。
- 失敗時は Phase 10 のロールバック手順を発動。

## CI build-only ゲート追加余地（評価）

### 候補

- `apps/api` の `wrangler deploy --dry-run` を PR 段階で実行する job を新設する案。
- `apps/web` の OpenNext build を PR 段階で実行する job を新設する案。

### 評価

| 観点 | 判定 |
| --- | --- |
| 価値 | 同種の依存メタ起因 build 失敗を deploy 直前ではなく PR 段階で検出可能 |
| コスト | 新規 workflow / job 追加・CI 時間増・secret 不要 |
| スコープ | 本 PR では out of scope（CONST_007「1 サイクル完結」に整合させるため、本タスクは緑化までで閉じる） |
| 後続化 | 新規 unassigned-task は作成しない。既存 PR build / Cloudflare build gate と本タスクの local evidence で扱う |

### 結論

本タスクでは新規 CI workflow は追加しない。既存 `.github/workflows/pr-build-test.yml` / `ci.yml` の Cloudflare build gate と Phase 11 evidence で扱い、未タスク化はしない。

## 実行タスク

- [ ] PR push 後、CI Run URL を 4 ジョブ分（staging x 2 / production x 2）取得
- [ ] 各ジョブの結果を `outputs/phase-07/integration-plan.md` に記録
- [x] build-only ゲート追加余地の評価結果を記録

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/integration-plan.md | CI 統合テスト戦略・build-only ゲート評価 |

## 完了条件

- [x] CI ジョブ別の期待結果が記載されている
- [x] build-only ゲート追加余地の判定が記録されている

## 次 Phase

- 次: 8 (ドキュメント更新)
- 引き継ぎ事項: CI Run URL（取得後に Phase 11 で canonical 化）
- ブロック条件: なし

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/` | 本 Phase の正本 |
| task-specification-creator | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase outputs / 状態語彙 / strict 7 |
| aiworkflow-requirements | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Cloudflare wrapper / esbuild SSOT |

## 統合テスト連携

| 連携先 | 扱い |
| --- | --- |
| local dependency convergence | `pnpm exec esbuild --version` / `pnpm why esbuild` で確認 |
| local static gates | typecheck / lint は Phase 11 evidence 境界で扱う |
| GitHub Actions | commit / push / PR が user-gated のため runtime_pending |
