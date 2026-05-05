# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | FIX-CF-ACCT-ID-VARS-001 |
| Phase | 1 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 実行タスク

1. 本 Phase の入力と制約を確認する。
2. 本 Phase の成果物に必要な判断、手順、証跡を記録する。
3. 完了条件と artifacts ledger の整合を確認する。

## 目的

main ブランチの `backend-ci` / `web-cd` deploy-production job が継続的に Authentication error [code: 10000] で失敗している事象を解消するための修正要件を確定する。


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

- `.github/workflows/backend-ci.yml`（修正対象、4 箇所）
- `.github/workflows/web-cd.yml`（修正対象、2 箇所）
- 失敗ログ: GitHub Actions runs/25153872414, 25153872595
- `gh api repos/daishiman/UBM-Hyogo/actions/variables` の出力（`CLOUDFLARE_ACCOUNT_ID` が Variable として登録）
- `gh api repos/daishiman/UBM-Hyogo/actions/secrets` の出力（`CLOUDFLARE_ACCOUNT_ID` が Secret として登録**されていない**）
- aiworkflow-requirements 現行正本（`deployment-gha.md` / `deployment-secrets-management.md`）の UT-27 Secrets / Variables 配置記述

## P50 チェック（Phase 1 前提確認）

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No | 通常の実装 Phase（Phase 5 で 6 箇所置換） |
| upstream（main 等）にマージ済み | No | 未マージ |
| 前提タスク（依存タスク）が完了済み | Yes（UT-27, UT-CICD-DRIFT-001） | 依存解消タスクは追加不要 |

`implementation_mode = "new"` を採用する。

## 真の論点

> CI で Cloudflare API Token と一緒に渡している account ID が `secrets.` 名前空間から空で展開されており、wrangler が account 列挙 API を叩いて Token のスコープ外で蹴られている。

**根本原因**: GitHub 上で `CLOUDFLARE_ACCOUNT_ID` は Repository Variable として登録されているが、workflow yaml は `${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` として参照している。GitHub Actions では `secrets.X` と `vars.X` は別名前空間であり、未登録 secret は空文字に展開される。

**仕様 drift**: aiworkflow-requirements の UT-27 正本には `CLOUDFLARE_ACCOUNT_ID` を Repository Secret とする stale 記述が残っている。一方、実 GitHub 設定では `actions/variables` に `CLOUDFLARE_ACCOUNT_ID` が存在し、`actions/secrets` には存在しない。実運用事実と Account ID の非機密性を根拠に、本タスクでは workflow を `vars.` に合わせ、Phase 12 Step 2 で正本仕様を Repository Variable へ同期する。

**派生論点（scope out）**:

- API Token のスコープ最小化監査（別タスク化）
- staging / production Token 値の分離（別タスク化）
- wrangler.toml warning（vars 継承 / pages_build_output_dir）の対応（別タスク化）

## 依存関係・責務境界

- **本タスクの責務境界**: `.github/workflows/backend-ci.yml` および `.github/workflows/web-cd.yml` 内の `${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` 参照のみ。
- **触らない境界**: `CLOUDFLARE_API_TOKEN`（Secret として正しく配置されている）、`CLOUDFLARE_PAGES_PROJECT`（Variable として正しく参照されている）。
- **状態所有権**: GitHub Repository の Variables / Secrets 設定は本タスクで変更しない。yaml 側の参照表記のみ修正する。

## 価値とコストの均衡

| 項目 | 内容 |
| --- | --- |
| 初期価値 | main ブランチの本番デプロイパイプラインが green に戻る。後続の全 main push が deploy 成功する |
| 導入コスト | 6 箇所の文字列置換のみ。1 PR で完結 |
| 副次コスト | なし（参照変更によるロジック変更は皆無） |
| トレードオフ | Account ID を Secret 化する代替案は「効果ゼロ・運用コスト増」のため不採用 |

## vars vs secret 判断根拠

**判断**: `CLOUDFLARE_ACCOUNT_ID` は `vars.` のまま運用する。Secret 化はしない。

**根拠**:

1. **Cloudflare の設計**: Account ID は識別子であり資格情報ではない。dashboard URL に平文で含まれる前提の値（公式: <https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids/>）。
2. **認証チョークポイントは Token のみ**: `Authorization: Bearer <API_TOKEN>` が認証手段で、Account ID はパスパラメータ（`/accounts/{id}/...`）。Account ID 単独で認証は不可。
3. **既に CI ログで露出済み**: 失敗ログの `whoami` 出力で Account ID `b3dde7be1cd856788fc47595ac455475` が public CI ログに平文で記録済み。Secret 化しても wrangler 自身がマスクなしで出力するため隠蔽効果なし。
4. **wrangler-action 仕様**: `accountId` 入力に機密フラグなし。Cloudflare 公式サンプルも `vars` または直値を許容。
5. **運用コスト**: Secret 化すると「資格情報」と「ただの設定値」の境界が曖昧化し、レビュー・ローテーション運用の認知負荷が増える。

## 受入条件マッピング

| AC | 確認方法 |
| --- | --- |
| AC-1 | `grep -n 'CLOUDFLARE_ACCOUNT_ID' .github/workflows/backend-ci.yml` の出力が全て `vars.` |
| AC-2 | `grep -n 'CLOUDFLARE_ACCOUNT_ID' .github/workflows/web-cd.yml` の出力が全て `vars.` |
| AC-3 | `grep -rn 'secrets.CLOUDFLARE_ACCOUNT_ID' .github/` の出力が空 |
| AC-4 | `gh api repos/daishiman/UBM-Hyogo/actions/variables` で `CLOUDFLARE_ACCOUNT_ID` 確認済み、`actions/secrets` で未登録確認済み |
| AC-10 | 本ファイル（phase-01）に判断根拠が明記されている |
| AC-12 | aiworkflow-requirements の UT-27 / GitHub Secrets・Variables 正本が `CLOUDFLARE_ACCOUNT_ID` = Repository Variable に同期されている |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | main 本番デプロイの回復は priority HIGH |
| 実現性 | PASS | 6 箇所の文字列置換のみ。難易度・リスクともに最小 |
| 整合性 | PASS（Phase 12 Step 2 完了後） | 実 GitHub 設定、Cloudflare 公式、wrangler-action 公式、OSS 慣行と一致。aiworkflow-requirements の stale Secret 記述は Phase 12 で同期する |
| 運用性 | PASS | 既存 Variable 登録を活用、新規導入なし |

## 既存コード命名規則

`.github/workflows/*.yml` は既に `vars.CLOUDFLARE_PAGES_PROJECT` で `vars.` 名前空間を使用しており、本修正は既存命名規則と整合する。


## 統合テスト連携

- 本タスクは GitHub Actions workflow の設定修正であり、アプリケーション統合テストの追加は行わない。
- 代替検証は Phase 4 / Phase 5 / Phase 11 の grep、actionlint、yamllint、GitHub API、GitHub Actions run 確認で担保する。

## 完了条件

- [ ] 修正対象 6 箇所の正確な行番号と現状記述・修正後記述が表化されている
- [ ] vars vs secret 判断根拠が明記されている
- [ ] タスク品質4観点が PASS 判定され、skill 検証4条件の整合性リスクが Phase 12 同期対象になっている
- [ ] scope out 項目が列挙されている

## 成果物

- `outputs/phase-01/main.md`
