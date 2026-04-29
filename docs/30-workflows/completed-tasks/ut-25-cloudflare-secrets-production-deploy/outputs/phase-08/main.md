# Phase 8 成果物 — DRY 化

> 状態: **NOT EXECUTED — spec_created**
> 本ワークフローは Phase 1〜13 のタスク仕様書整備に閉じる。実 `wrangler secret put` は Phase 13 ユーザー承認後の別オペレーション。本書には「リファクタ後に到達すべき SSOT 構造」を仕様レベルで固定する。

## 1. SSOT 一覧

| # | SSOT 対象 | 物理位置 | 参照する Phase | 役割 |
| --- | --- | --- | --- | --- |
| 1 | 投入コマンドテンプレ（1 行） | 本書 §2.1 | Phase 5 / 11 / 13 | `bash scripts/cf.sh secret put` 呼び出しの単一情報源 |
| 2 | staging-first ループ | 本書 §2.2 | Phase 5 / 11 / 13 | `--env` 切替の単一情報源 |
| 3 | 投入関数 `put_sa_json(env)` | 本書 §3 | Phase 5 / 11 / 13 | stdin 投入経路（op + 履歴汚染防止）の単一情報源 |
| 4 | evidence 関数 `capture_secret_list(env)` | 本書 §4 | Phase 11 / 13 | `wrangler secret list` evidence 取得の単一情報源 |
| 5 | rollback 手順（delete + 再 put） | 本書 §5 | Phase 11 / 13 | 巻き戻しの単一情報源 |
| 6 | 用語統一 | 本書 §6 | 全 Phase | staging / production / secret-list-evidence-{env}.txt |

## 2. 投入コマンド SSOT

### 2.1 1 行テンプレ

```bash
# wrangler 直叩き禁止 / op 経由 stdin / --env パラメタ化
op read "op://UBM-Hyogo/google_service_account_json/credential" \
  | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml \
      --env "${ENV}"
```

### 2.2 staging-first ループ

```bash
set +o history
HISTFILE=/dev/null

for ENV in staging production; do
  put_sa_json "${ENV}"
  capture_secret_list "${ENV}"
done
```

> Phase 11（staging のみ smoke）では `for ENV in staging` で実行。
> Phase 13（本投入）では `for ENV in staging production` で実行（ただし staging は Phase 11 で投入済みのため再 put 確認のみ、または skip）。

### 2.3 用途分離（Phase 2 設計と整合）

| Phase | ENV | 目的 |
| --- | --- | --- |
| Phase 11 | staging | smoke + name 確認、production は触らない |
| Phase 13 | staging / production | 本投入。staging-first 順序固定 |

## 3. 投入関数 `put_sa_json(env)` 擬似コード

```bash
# シェル履歴汚染防止 + JSON 改行保全 + wrangler 直叩き禁止 + --env 必須
put_sa_json() {
  local env="$1"
  : "${env:?--env 必須（UT25-M-02 防止）}"

  set +o history
  HISTFILE=/dev/null

  op read "op://UBM-Hyogo/google_service_account_json/credential" \
    | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
        --config apps/api/wrangler.toml \
        --env "${env}"
}
```

### 3.1 設計根拠（AC 対応）

| AC | 対応箇所 |
| --- | --- |
| AC-1（cf.sh 経由） | `bash scripts/cf.sh secret put ...` |
| AC-2（staging-first） | 呼び出し側ループで `staging` → `production` |
| AC-3（`private_key` 改行保全） | `op read | wrangler` の stdin パイプ（echo 禁止） |
| AC-4（履歴汚染防止） | `set +o history` / `HISTFILE=/dev/null` / op 直接 stdin |

## 4. evidence 関数 `capture_secret_list(env)` 擬似コード

```bash
capture_secret_list() {
  local env="$1"
  local phase="$2"   # 11 or 13
  : "${env:?--env 必須}"
  : "${phase:?phase 番号必須}"

  bash scripts/cf.sh secret list \
      --config apps/api/wrangler.toml \
      --env "${env}" \
      > "docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-${phase}/secret-list-evidence-${env}.txt"
}
```

### 4.1 出力先テンプレ

```
outputs/phase-{phase}/secret-list-evidence-{env}.txt
  phase ∈ {11, 13}
  env   ∈ {staging, production}
```

### 4.2 4 ファイル展開表

| phase | staging | production |
| --- | --- | --- |
| 11 | `outputs/phase-11/secret-list-evidence-staging.txt` | （Phase 11 では生成しない） |
| 13 | `outputs/phase-13/secret-list-evidence-staging.txt` | `outputs/phase-13/secret-list-evidence-production.txt` |

## 5. rollback SSOT（delete + 再 put）

```bash
rollback_sa_json() {
  local env="$1"
  : "${env:?--env 必須}"

  set +o history
  HISTFILE=/dev/null

  # ステップ 1: 既存 secret を削除（値読取不能のため delete のみ）
  bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml \
      --env "${env}"

  # ステップ 2: 旧 key を 1Password 履歴から取得して再 put
  #   注意: 新規発行ではない。旧版を履歴から復元する。
  op read "op://UBM-Hyogo/google_service_account_json/credential?revision=<旧版番号>" \
    | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
        --config apps/api/wrangler.toml \
        --env "${env}"

  # ステップ 3: 復旧確認
  capture_secret_list "${env}" 13
}
```

> 旧 key の 1Password 履歴版番号は op item の revision 機能で参照する。新規発行が必要なケースは 01c-parallel-google-workspace-bootstrap の SA key ローテーションタスクへ分岐させる。

## 6. 用語統一

| 用語 | 採用形 | 不採用形 |
| --- | --- | --- |
| Cloudflare 環境名 | `staging` / `production` | `stg` / `prd` / `prod` |
| evidence ファイル | `secret-list-evidence-{env}.txt` | `wrangler-list-{env}.txt` / `secret-list-{env}.txt` |
| 投入経路 | `bash scripts/cf.sh secret put` | `wrangler secret put`（runbook 本体での直叩き） |
| 値取り出し | `op read "op://Vault/Item/Field"` | `cat sa.json` / 値の payload 直書き |
| rollback 種別 | delete + 再 put（旧 key 1Password 履歴） | 新規発行を rollback と呼ぶこと |

## 7. Before / After 集約

### 7.1 投入コマンド

| 観点 | Before | After |
| --- | --- | --- |
| wrangler 呼び出し | `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging` のような直叩き × 2 環境 | `bash scripts/cf.sh secret put ... --env "${ENV}"` × ループ |
| stdin パイプ | echo / cat sa.json で値を渡す | `op read | bash scripts/cf.sh ...` で 1Password から直接 |
| 履歴対策 | 各環境のコマンドで個別 | ループ前に `set +o history` / `HISTFILE=/dev/null` 1 回 |

### 7.2 rollback

| 観点 | Before | After |
| --- | --- | --- |
| delete + 再 put | Phase 11 / 13 で個別記述 | `rollback_sa_json(env)` 関数 1 箇所で SSOT |
| 旧 key 取得 | runbook に op パス直書き × 重複 | op の revision 参照を 1 箇所に集約 |

### 7.3 evidence

| 観点 | Before | After |
| --- | --- | --- |
| ファイル名 | runbook ごとに異なる名称 | `secret-list-evidence-{env}.txt` で固定 |
| 出力ディレクトリ | Phase ごとに散在 | `outputs/phase-{11,13}/` で固定 |

## 8. 重複コード抽出結果

| # | 抽出元 | 抽出先 | 効果 |
| --- | --- | --- | --- |
| 1 | `bash scripts/cf.sh secret put ...` × 2 環境 | §2.1 1 行テンプレ | 手順ドリフト 0 |
| 2 | staging / production 個別ブロック | §2.2 staging-first ループ | 順序固定 |
| 3 | op + wrangler stdin パイプ | §3 `put_sa_json(env)` | UT25-M-01 / 02 同時予防 |
| 4 | `wrangler secret list` 出力保存 | §4 `capture_secret_list(env)` | evidence 命名 SSOT |
| 5 | rollback delete + 再 put | §5 `rollback_sa_json(env)` | rollback 経路 SSOT |
| 6 | `.dev.vars` gitignore 確認 | Phase 5 / 11 で 1 関数化 | UT25-M-01 受け皿 |

## 9. navigation drift チェック結果（プレースホルダ）

| チェック | 結果 |
| --- | --- |
| artifacts.json × phase-NN.md path | spec_created（Phase 4〜13 作成完了後に確認） |
| index.md × phase-NN.md ファイル名 | spec_created |
| evidence 命名統一 | SSOT §4.1 で固定 |
| wrangler 直叩き混入 | `grep -nE '^[^#>].*\bwrangler\b' phase-{05,11,13}.md | grep -vE 'scripts/cf\.sh'` で 0 件期待 |
| `--env` 値限定 | staging / production / `"${ENV}"` のみ期待 |

## 10. 残課題

- 本 Phase は spec_created。実 shell 化は Phase 5 で再評価（`scripts/cf.sh` 内部に組み込むか、別 wrapper を作るか）。
- ローテーション自動化（GitHub Actions 経由）は MVP 外。Phase 12 unassigned-task 候補へ送る判断を Phase 10 で確定。
