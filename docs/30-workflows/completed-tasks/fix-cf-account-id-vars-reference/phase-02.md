# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | FIX-CF-ACCT-ID-VARS-001 |
| Phase | 2 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 実行タスク

1. 本 Phase の入力と制約を確認する。
2. 本 Phase の成果物に必要な判断、手順、証跡を記録する。
3. 完了条件と artifacts ledger の整合を確認する。

## 目的

Phase 1 で確定した要件に基づき、6 箇所の参照置換マップ・検証戦略・リスク制御方針を設計する。


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

- Phase 1 成果物（`outputs/phase-01/main.md`）
- 修正対象 yaml の現状

## 既存コンポーネント再利用判定

| 観点 | 判定 |
| --- | --- |
| 既存 yaml 構造の再利用 | 採用（yaml 構造変更は不要、参照表記のみ修正） |
| 既存 Variable 登録の再利用 | 採用（`CLOUDFLARE_ACCOUNT_ID` Variable は既に正しく登録済み） |
| 新規ファイル作成 | なし |
| 新規 Secret / Variable 導入 | なし |

## 参照置換マップ

### `.github/workflows/backend-ci.yml`（4 箇所）

| Line | Before | After | 文脈 |
| --- | --- | --- | --- |
| L42 | `accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` | `accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}` | deploy-staging / Apply D1 migrations |
| L53 | `accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` | `accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}` | deploy-staging / Deploy Workers app |
| L87 | `accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` | `accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}` | deploy-production / Apply D1 migrations |
| L98 | `accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` | `accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}` | deploy-production / Deploy Workers app |

### `.github/workflows/web-cd.yml`（2 箇所）

| Line | Before | After | 文脈 |
| --- | --- | --- | --- |
| L45 | `accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` | `accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}` | deploy-staging / Deploy web app |
| L82 | `accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` | `accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}` | deploy-production / Deploy web app |

## 修正手順設計

### 推奨手段: Edit ツールの `replace_all`

両ファイル共通の置換パターン:

- `old_string`: `${{ secrets.CLOUDFLARE_ACCOUNT_ID }}`
- `new_string`: `${{ vars.CLOUDFLARE_ACCOUNT_ID }}`
- `replace_all`: `true`（同一ファイル内の全箇所を一括置換）

### Fallback 手段: 行ピンポイント Edit

`replace_all` で意図しない箇所を変更してしまうリスクは本ケースでは皆無（`secrets.CLOUDFLARE_ACCOUNT_ID` の参照は `secrets.CLOUDFLARE_API_TOKEN` 等と完全に区別可能）だが、念のため行番号で個別 Edit する選択肢も残す。

## 検証戦略（Phase 4 へ引き継ぎ）

### Static 検証（マージ前に可能）

| 種別 | コマンド | 期待結果 |
| --- | --- | --- |
| 参照網羅 | `grep -rn 'secrets.CLOUDFLARE_ACCOUNT_ID' .github/` | 0 件 |
| 修正網羅 | `grep -rn 'vars.CLOUDFLARE_ACCOUNT_ID' .github/` | 6 件（backend-ci 4 + web-cd 2） |
| 構文 | `actionlint .github/workflows/backend-ci.yml .github/workflows/web-cd.yml` | エラーなし |
| 構文 | `yamllint .github/workflows/backend-ci.yml .github/workflows/web-cd.yml` | エラーなし |
| 設定整合 | `gh api repos/daishiman/UBM-Hyogo/actions/variables` | `CLOUDFLARE_ACCOUNT_ID` Variable が存在 |

### Runtime 検証（マージ後に必要）

deploy-production job は `if: github.ref_name == 'main'` で gate されているため、マージ後でないと実行されない。

| 種別 | 確認方法 | 期待結果 |
| --- | --- | --- |
| backend-ci | `gh run list --branch main --workflow=backend-ci --limit 1` | conclusion: success |
| web-cd | `gh run list --branch main --workflow=web-cd --limit 1` | conclusion: success |
| Authentication error 消失 | 失敗ログの `Authentication error [code: 10000]` 文字列が出ない | エラーログなし |

## リスク制御

| リスク | 対策 |
| --- | --- |
| `replace_all` で意図しない置換が起きる | 検索文字列が `secrets.CLOUDFLARE_ACCOUNT_ID` と完全一致するため副作用なし。Phase 5 で diff を目視確認 |
| `vars.CLOUDFLARE_ACCOUNT_ID` Variable が登録解除されている | Phase 5 着手前に `gh api ... /actions/variables` で再確認 |
| 修正後も別の auth error が出る | Phase 11 の Runtime 検証で初回 main push 時に確認。別エラーは別タスクへ切り出す |
| マージ前に staging で検証できない | dev ブランチ push でも `deploy-staging` job 経由で同じ `accountId` 参照が走る。マージ前 PR に対して dev ブランチ smoke を依頼することも代替案として可（本タスクでは optional） |

## 因果ループ確認

- 強化ループ: 修正適用 → deploy-production 復活 → 後続 main push の deploy 成功率 100% → 開発フローの信頼回復
- バランスループ: 修正適用 → CI ログから auth error 消失 → 監視ノイズ減 → 真のインシデント検知能力が戻る

## 状態所有権

| 状態 | 所有者 |
| --- | --- |
| `.github/workflows/*.yml` の参照表記 | 本タスク（Phase 5 で修正） |
| GitHub Repository の Variables / Secrets | UT-27（変更しない） |
| Cloudflare API Token の権限スコープ | scope out（別タスク化候補） |


## 統合テスト連携

- 本タスクは GitHub Actions workflow の設定修正であり、アプリケーション統合テストの追加は行わない。
- 代替検証は Phase 4 / Phase 5 / Phase 11 の grep、actionlint、yamllint、GitHub API、GitHub Actions run 確認で担保する。

## 完了条件

- [ ] 6 箇所の置換マップが行番号付きで確定している
- [ ] 検証戦略が static / runtime に分離されている
- [ ] リスク制御が表化されている
- [ ] 修正手段の primary / fallback が明示されている

## 成果物

- `outputs/phase-02/main.md`
