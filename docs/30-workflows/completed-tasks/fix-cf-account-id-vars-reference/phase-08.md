# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | FIX-CF-ACCT-ID-VARS-001 |
| Phase | 8 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 実行タスク

1. 本 Phase の入力と制約を確認する。
2. 本 Phase の成果物に必要な判断、手順、証跡を記録する。
3. 完了条件と artifacts ledger の整合を確認する。

## 目的

修正後の 6 箇所が重複構造を持つかを確認し、共通化（DRY 化）の必要性を判定する。


## 参照資料

- `index.md`
- `artifacts.json`
- `.github/workflows/backend-ci.yml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`

## 入力

- Phase 5 成果物（実装後の yaml 構造）

## 重複構造確認

`accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}` の参照は両 workflow に分散しているが、これは GitHub Actions の `uses: cloudflare/wrangler-action@v3` ステップ単位の入力仕様であり、重複ではなく**各ステップでの必須記述**である。

## DRY 化候補の評価

| 候補 | 内容 | 採否 | 理由 |
| --- | --- | --- | --- |
| Composite Action 化 | wrangler-action 呼び出しを共通 composite action に切り出す | 不採用 | 本タスクの scope 外（CI/CD topology drift 系のリファクタとして別タスク化）。本修正はあくまで `secrets.` → `vars.` の参照名修正に絞る |
| Reusable Workflow 化 | deploy-staging / deploy-production を `workflow_call` で共通化 | 不採用 | 同上。scope creep を避ける |
| Environment Variables 統一 | `env:` ブロックで Account ID を一度だけ宣言 | 不採用 | `wrangler-action` の `accountId:` 入力は step input であり、`env:` 経由では受け取らないため効果なし |

## navigation drift 確認

| 観点 | 結果 |
| --- | --- |
| 既存 `vars.CLOUDFLARE_PAGES_PROJECT` との命名一貫性 | OK（`CLOUDFLARE_*` プレフィックス揃い） |
| 既存 `secrets.CLOUDFLARE_API_TOKEN` との名前空間整合 | OK（資格情報は `secrets.`、識別子は `vars.` の住み分けが成立） |
| 他 workflow（`ci.yml` 等）への波及 | なし（修正対象 2 ファイルに閉じる） |


## 統合テスト連携

- 本タスクは GitHub Actions workflow の設定修正であり、アプリケーション統合テストの追加は行わない。
- 代替検証は Phase 4 / Phase 5 / Phase 11 の grep、actionlint、yamllint、GitHub API、GitHub Actions run 確認で担保する。

## 完了条件

- [ ] 重複構造が DRY 化の必要性を満たさないことが判定されている
- [ ] DRY 化候補が列挙され、scope creep を避ける根拠が明記されている

## 成果物

- `outputs/phase-08/main.md`
