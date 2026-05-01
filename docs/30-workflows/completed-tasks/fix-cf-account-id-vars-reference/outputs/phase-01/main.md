# Phase 1: 要件定義

## 状態
- 開始: 2026-04-30
- 完了: 2026-04-30

## 真の論点
`.github/workflows/backend-ci.yml` と `.github/workflows/web-cd.yml` 内 6 箇所の `accountId` 参照が `${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` となっているが、GitHub 実設定では Repository **Variable**（`vars.CLOUDFLARE_ACCOUNT_ID`）として登録されている。結果として展開時に空文字となり、wrangler が無効な account に対して認証を行い、`Authentication error [code: 10000]` で deploy job が落ちる。

## 必須事前確認（実施結果）

| 項目 | コマンド | 結果 |
| --- | --- | --- |
| 参照箇所網羅 | `grep -rn 'secrets.CLOUDFLARE_ACCOUNT_ID' .github/` | 6 箇所（仕様書通り） |
| 他 workflow 影響 | 同上 | `ci.yml` / `validate-build.yml` / `verify-indexes.yml` / `pr-build-test.yml` / `pr-target-safety-gate.yml` には参照なし |
| Variable 登録 | `gh api repos/daishiman/UBM-Hyogo/actions/variables` | `CLOUDFLARE_ACCOUNT_ID` が Variable として登録済み（created_at: 2026-04-26T12:53:53Z） |
| Secret 不在 | `gh api repos/daishiman/UBM-Hyogo/actions/secrets` | `CLOUDFLARE_ACCOUNT_ID` は存在しない |

## vars vs secret 判断根拠

Cloudflare Account ID は識別子であり資格情報ではない。

1. Cloudflare 公式ドキュメント（find-account-and-zone-ids）でも account ID はダッシュボード URL に表示される public な値として扱われる。
2. `cloudflare/wrangler-action` の `accountId` 入力には機密フラグが付与されておらず、実行ログにマスクなしで露出する設計。
3. CI 失敗ログ（run 25153872414）の `whoami` 出力で account ID が既に公開されており、Secret 化による情報秘匿効果はゼロ。
4. Secret 化は運用コスト（ローテーション・他値との混同）が便益を上回るため不採用。

→ Variable を正本とし、参照側を `secrets.` から `vars.` へ修正する方針が妥当。

## 正本 drift 認識

aiworkflow-requirements の UT-27 関連正本（`deployment-gha.md` / `deployment-secrets-management.md`）には `CLOUDFLARE_ACCOUNT_ID` を Secret とする stale 記述が残存する。本タスクの Phase 12 Step 2 で Variable 表記へ同期する。

## 4 条件評価

| 条件 | 評価 |
| --- | --- |
| 矛盾なし | PASS：実 GitHub 設定と修正後 yaml が一致 |
| 漏れなし | PASS：6 箇所すべての参照を対象とし、他 workflow は参照ゼロを確認 |
| 整合性あり | PASS：Cloudflare / wrangler-action の慣行と整合 |
| 依存関係整合 | PASS：UT-27 の Variable 配備が前提として満たされている |

## 受入条件マッピング
AC-1〜AC-12 の根拠は本 phase で確立。具体的な検証手段は phase-04（テスト戦略）に展開。
