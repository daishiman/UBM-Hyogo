# Phase 11: 手動 smoke test（staging 投入リハーサル — name 確認 / rollback リハーサル）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON）(ut-25-cloudflare-secrets-production-deploy) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test（staging 投入リハーサル） |
| 作成日 | 2026-04-29 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / cloudflare_secrets_deployment |
| user_approval_required | true（staging でも secret put/delete を伴うため、ユーザー承認後の別オペレーション） |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- **taskType: implementation（cloudflare secrets deployment）**
- 判定理由:
  - `wrangler secret put / list / delete` は CLI のみ。UI / Renderer / 画面遷移は発生しない。
  - 値そのものは `wrangler secret list` でも読み取り不能（name のみ表示）。スクリーンショットを取っても情報は CLI ログ以上にならない。
  - したがって screenshot は不要。`outputs/phase-11/screenshots/` ディレクトリは **作成しない**（`.gitkeep` も置かない）。
- **本 Phase のスコープは staging smoke の手順定義のみ**: production 環境の実投入は Phase 13 のユーザー承認後の別オペレーションで実施する。staging smoke も secret put/delete を伴うため、この仕様書作成時点では実走せず、ユーザー承認後に `manual-smoke-log.md` を事実へ更新する。

## 成果物

## 必須 outputs（3 点）

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-11/main.md` | Phase 11 walkthrough のトップ index。実行スコープ（staging のみ）と production スキップ理由、4 条件再確認 |
| `outputs/phase-11/manual-smoke-log.md` | staging 投入リハーサル（put → list → delete + 再 put）の実行ログテンプレート。ユーザー承認後にコマンド・実行時刻・実行結果（name のみ）・rollback 結果を記録 |
| `outputs/phase-11/link-checklist.md` | index.md / artifacts.json / phase-NN.md / outputs/* / 親仕様 間の参照リンク健全性チェック |

> evidence の secret 値・JSON key 内容は **絶対に転記しない**。`wrangler secret list` の name 行のみが evidence として有効。

## 目的

Phase 1〜10 で固定された設計（cf.sh ラッパー / staging-first / `op read` stdin / delete + 再 put rollback / `.dev.vars` gitignore 整合）に対し、**staging 環境への実投入リハーサル手順**を定義し、ユーザー承認後に確認すべき事項を固定する。

1. `bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env staging` が成功すること（put）
2. `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` の出力に `GOOGLE_SERVICE_ACCOUNT_JSON` の name が現れること（list）
3. rollback リハーサルとして `wrangler secret delete` → 旧 key 再 `put` の 2 段階が staging 上で機能すること（rollback fail-fast の構造確認）
4. `apps/api/.dev.vars` が `.gitignore` 除外されていること（MINOR UT25-M-01 の解決確認）
5. シェル履歴に SA JSON 値が一切残っていないこと（`history | grep -i "BEGIN PRIVATE KEY"` で 0 件）

依存成果物として Phase 5 実装ランブック、Phase 6 異常系（`--env` 漏れ事故）、Phase 9 品質保証結果を入力する。

## 実行タスク

1. staging 環境で `bash scripts/cf.sh` 経由の put → list → delete + 再 put リハーサル手順を定義し、`manual-smoke-log.md` にユーザー承認後の記録欄を用意する。
2. `apps/api/.dev.vars` の `.gitignore` 除外を `git check-ignore -v apps/api/.dev.vars` で確認し結果を記録する（MINOR UT25-M-01 解決確認）。
3. シェル履歴に SA JSON の片鱗（`BEGIN PRIVATE KEY` / `private_key` / プロジェクト ID 等）が残っていないことを `history | grep` で確認し結果を記録する。
4. リンクチェックリストを `link-checklist.md` に記録する（index.md ↔ artifacts.json ↔ phase-NN.md ↔ outputs/phase-NN/* ↔ 親仕様）。
5. 「production への実投入は本 Phase 範囲外」を `main.md` 冒頭で明記し、production 実投入を Phase 13 deploy-runbook に委譲する旨を記録する。
6. 保証できない範囲（Sheets API 機能疎通 = UT-26 / SA key 失効監視 / ローテーション運用）を Phase 12 申し送り候補として最低 3 項目列挙する。

## 実行手順

## staging smoke コマンド系列（ユーザー承認後の実走対象）

> **重要**: 本 Phase で実走しない。ユーザー承認後に実走する場合も対象は **staging のみ**。production には触れない。
> 値そのものは出力に転記しない。`secret-list-evidence-staging.txt`（Phase 13 成果物テンプレート）への貼付は Phase 13 で行う。

```bash
# === 前提（実走前に確認）===
# 1. 現在の作業ブランチが feature/* で main / dev でないこと
# 2. .env が op 参照のみで実値を含まないこと
# 3. apps/api/.dev.vars が .gitignore 除外されていること

# === STEP 0: 履歴汚染防止 ===
set +o history
HISTFILE=/dev/null
export HISTFILE

# === STEP 1: 投入前 list（staging に同名 secret が無いこと、または旧値があることを確認）===
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
# 期待: GOOGLE_SERVICE_ACCOUNT_JSON の有無を記録（name のみ）

# === STEP 2: op 経由 stdin 投入（staging）===
op read "op://<Vault>/<Item>/<Field>" \
  | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml --env staging
# 期待: ✨ Successfully created secret for GOOGLE_SERVICE_ACCOUNT_JSON

# === STEP 3: 投入後 list（name 確認）===
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
# 期待: GOOGLE_SERVICE_ACCOUNT_JSON が name として 1 件表示

# === STEP 4: rollback リハーサル（delete → 再 put）===
bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON \
  --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
# 期待: GOOGLE_SERVICE_ACCOUNT_JSON が一覧から消えている

op read "op://<Vault>/<Item>/<Field>" \
  | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
# 期待: GOOGLE_SERVICE_ACCOUNT_JSON が再び name として 1 件表示

# === STEP 5: .dev.vars gitignore 確認（MINOR UT25-M-01 解決確認）===
git check-ignore -v apps/api/.dev.vars
# 期待: .gitignore のいずれかの行にマッチ（ignored 判定）

# === STEP 6: 履歴汚染チェック ===
history | grep -E "BEGIN PRIVATE KEY|private_key" || echo "OK: no leak in history"
```

> **production には触れない**。STEP 1〜4 のいずれにも `--env production` は含めない。production 実投入は Phase 13 deploy-runbook 経由でユーザー承認後に実施。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | 投入経路設計（cf.sh / op stdin / staging-first） |
| 必須 | outputs/phase-03/main.md | NO-GO 条件 / MINOR 追跡 / Phase 13 blocked 条件 |
| 必須 | outputs/phase-05/main.md | 実装ランブック（コマンド系列の正本） |
| 必須 | outputs/phase-06/main.md | 異常系検証（`--env` 漏れ事故シナリオ） |
| 必須 | scripts/cf.sh | wrangler ラッパー実装 |
| 必須 | apps/api/wrangler.toml | `--env staging` / `--env production` の宣言 |
| 必須 | CLAUDE.md（Cloudflare 系 CLI / シークレット管理） | wrangler ラッパー必須・op 経由注入 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-11.md | NON_VISUAL Phase 11 構造リファレンス |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 ファイルが揃っている
- [ ] `outputs/phase-11/screenshots/` を作成していない
- [ ] staging smoke の 6 STEP が `manual-smoke-log.md` にユーザー承認後の記録欄として用意されている
- [ ] rollback リハーサル（delete → 再 put）が staging 上で成功したかを記録する欄がある
- [ ] `apps/api/.dev.vars` の `.gitignore` 除外確認欄がある（MINOR UT25-M-01 解決確認）
- [ ] シェル履歴に SA JSON 片鱗が残っていないことを確認する欄がある
- [ ] production には触れていない（`manual-smoke-log.md` に `--env production` の実行記録が一切無い）
- [ ] secret 値・JSON key 内容を一切転記していない
- [ ] 保証できない範囲が Phase 12 申し送り候補として最低 3 項目列挙

## 検証コマンド

```bash
ls docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-11/
# main.md / manual-smoke-log.md / link-checklist.md の 3 件のみ

test ! -d docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-11/screenshots && echo OK

# staging のみで実走されたことを確認（production が無いこと）
! grep -E "wrangler secret (put|delete).*--env production" \
    docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-11/manual-smoke-log.md \
  && echo OK

# 値転記が無いこと（PEM 開始マーカーが文書に存在しないこと）
! grep -E "BEGIN (PRIVATE|RSA PRIVATE) KEY" \
    docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-11/*.md \
  && echo OK
```

## 苦戦防止メモ

1. **production には触れない**: `--env production` は Phase 13 deploy-runbook の所管。本 Phase の `manual-smoke-log.md` に記録された場合は完了条件違反。
2. **値の転記禁止**: `wrangler secret list` の name 行のみ転記可能。`op read` の出力 / SA JSON 内容 / `private_key` の片鱗を文書化しない。
3. **`.dev.vars` の `.gitignore` 確認**: `git check-ignore` で確認。ignored でなければその場で修正し、修正コミットの SHA を `manual-smoke-log.md` に記録。
4. **履歴汚染チェック**: `set +o history` を STEP 0 で必ず実行。実走後に `history | grep` で 0 件確認。
5. **rollback リハーサルは必須**: delete だけで終わらない。再 put まで完了して staging が put 済み状態に戻ったことを確認。
6. **op vault path は推測しない**: `op://Vault/Item/Field` の Vault / Item は UT-03 runbook 側を正本とする。本 Phase の log にも `op://<Vault>/<Item>/<Field>` のプレースホルダのみ残し、実 path は転記しない。

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - staging smoke で確定したコマンド系列を `implementation-guide.md` Part 2 に再掲する
  - 保証できない範囲（UT-26 機能疎通 / SA key 失効監視 / ローテーション運用）を `unassigned-task-detection.md` の current 区分へ転記
  - `link-checklist.md` の Broken 項目があれば Phase 12 で同 sprint 修正
  - production への実投入は Phase 13 deploy-runbook で実施することを `system-spec-update-summary.md` の参照ルートに記載
- ブロック条件:
  - `manual-smoke-log.md` に `--env production` の実行記録が含まれている
  - secret 値 / JSON 内容 / `private_key` 片鱗が文書に転記されている
  - rollback リハーサルが delete のみで再 put が未実施
  - `.dev.vars` の `.gitignore` 除外確認結果が未記録

## 統合テスト連携

| 連携先 | 内容 |
| --- | --- |
| UT-26 | 本 Phase は secret name 確認手順までを保証し、Sheets API 実疎通は UT-26 に委譲する |
| Phase 12 | staging smoke テンプレート、保証できない範囲、リンク検証結果をドキュメント更新に渡す |
| Phase 13 | production 投入は本 Phase で実走せず、ユーザー承認後の deploy-runbook に渡す |
