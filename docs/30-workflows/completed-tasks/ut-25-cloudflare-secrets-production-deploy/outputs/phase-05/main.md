# Phase 5 成果物 — 実装ランブック骨格

## 1. 概要

UT-25 は手動 secret 配置オペレーション。実コード実装が無いため、本 Phase の主成果は **`outputs/phase-13/deploy-runbook.md` / `rollback-runbook.md` の骨格** を擬似コードレベルで固定することである。実 `wrangler secret put` / `secret delete` は **Phase 13 ユーザー承認後** の別オペレーションでのみ実行する。

## 2. ステップ一覧（NOT EXECUTED テンプレ）

| Step | 名称 | lane | 副作用 | 実走条件 |
| --- | --- | --- | --- | --- |
| 0 | 前提確認 | - | なし | 常時可 |
| 1 | ローカル `.dev.vars` 設定 | 1 | ローカルファイルのみ | 常時可（op 参照のみ） |
| 2 | stdin 改行保全確認 | 2 | なし（jq dry） | 常時可 |
| 3 | staging put | 2 | Cloudflare staging Secret | **Phase 13 承認後** |
| 4 | staging 確認 | 2 | evidence 生成 | Step 3 完了後 |
| 5 | production put | 3 | Cloudflare production Secret | **Step 4 PASS 後 + Phase 13 承認後** |
| 6 | production 確認 | 3 | evidence 生成 | Step 5 完了後 |
| 7 | runbook 反映 | 4 | docs 追記 | Step 6 完了後 |

## 3. Step 0 前提確認ゲート（5 項目）

| 項目 | 確認コマンド | NO-GO |
| --- | --- | --- |
| UT-03 | `grep GOOGLE_SERVICE_ACCOUNT_JSON apps/api/src/jobs/sheets-fetcher.ts` | 不在 |
| 01b env 宣言 | `grep -E '^\[env\.(staging\|production)\]' apps/api/wrangler.toml` | 片側欠落 |
| 01c SA JSON | `op read 'op://Vault/SA-JSON/credential' \| jq -e 'has("private_key")'` | parse error |
| `.gitignore` 除外 | `grep -E '^\.dev\.vars$' apps/api/.gitignore && git check-ignore apps/api/.dev.vars` | 除外漏れ |
| Phase 13 承認 | ユーザー手動承認の取得確認 | 未取得 |

**全 5 項目 PASS で Step 1 着手可。1 件でも NO-GO なら本 Phase pending 維持 → 解消後再着手。**

## 4. deploy-runbook.md 骨格

### 4.1 シェル履歴汚染防止（Step 0 末尾で固定）

```bash
export HISTFILE=/dev/null
set +o history
```

### 4.2 staging 投入（Step 3 + Step 4）

```bash
ENV_TARGET=staging
op read 'op://Vault/SA-JSON/credential' | \
  bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
    --config apps/api/wrangler.toml --env "$ENV_TARGET"

bash scripts/cf.sh secret list \
  --config apps/api/wrangler.toml --env "$ENV_TARGET" \
  | tee outputs/phase-13/secret-list-evidence-staging.txt \
  | grep -E '^GOOGLE_SERVICE_ACCOUNT_JSON\b'
```

### 4.3 production 投入（Step 5 + Step 6 / staging PASS 後のみ）

```bash
ENV_TARGET=production
op read 'op://Vault/SA-JSON/credential' | \
  bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
    --config apps/api/wrangler.toml --env "$ENV_TARGET"

bash scripts/cf.sh secret list \
  --config apps/api/wrangler.toml --env "$ENV_TARGET" \
  | tee outputs/phase-13/secret-list-evidence-production.txt \
  | grep -E '^GOOGLE_SERVICE_ACCOUNT_JSON\b'
```

### 4.4 完了記録（Step 7）

- `outputs/phase-13/deploy-runbook.md` に YYYY-MM-DD / 実行者 / staging / production の各 evidence ファイルパスを追記
- UT-03 runbook に「YYYY-MM-DD: GOOGLE_SERVICE_ACCOUNT_JSON 配置完了」を追記
- UT-26 担当に通知（unblock）

## 5. rollback-runbook.md 骨格

### 5.1 通常 rollback（誤投入の巻き戻し / E1）

```bash
ENV_TARGET=staging  # or production
bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON \
  --config apps/api/wrangler.toml --env "$ENV_TARGET"

bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env "$ENV_TARGET" \
  | grep -v GOOGLE_SERVICE_ACCOUNT_JSON

op read 'op://Vault/SA-JSON-prev/credential' | \
  bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
    --config apps/api/wrangler.toml --env "$ENV_TARGET"

bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env "$ENV_TARGET" \
  | grep -E '^GOOGLE_SERVICE_ACCOUNT_JSON\b'
```

### 5.2 緊急 rollback（production で UT-26 認証失敗時）

1. UT-26 で 401/403 検出
2. `secret delete --env production` で誤値即時除去
3. `op read 'op://Vault/SA-JSON-prev/credential' | secret put --env production` で旧 key 再投入
4. UT-26 再実行で認証成功確認
5. 担当者: solo 運用 = **実行者本人**

## 6. コミット粒度

| # | メッセージ | スコープ |
| --- | --- | --- |
| 1 | `chore(secrets): deploy GOOGLE_SERVICE_ACCOUNT_JSON to staging [UT-25]` | secret-list-evidence-staging.txt |
| 2 | `chore(secrets): deploy GOOGLE_SERVICE_ACCOUNT_JSON to production [UT-25]` | secret-list-evidence-production.txt |
| 3 | `docs(secrets): record UT-25 deploy / rollback runbook` | deploy-runbook.md / rollback-runbook.md |

## 7. T1〜T5 への対応

| Step | 対応 T |
| --- | --- |
| 0 | T2（`.gitignore`）/ T3（`--env` 宣言確認） |
| 1 | T2 |
| 2 | T4 |
| 3, 4 | T1 staging / T3 |
| 5, 6 | T1 production |
| 7 | runbook 記載確認（AC-7 / AC-8） |
| rollback 骨格 5.1 | T5 |

## 8. 引き渡し（Phase 6 へ）

- Step 0 前提確認 5 項目を異常系の発生源として Phase 6 に引き渡す
- staging-first（Step 4 → 5）ゲートを runbook の必須セクションに保つ
- `.dev.vars` 実値書き込み禁止と op 参照のみのポリシーを Phase 6 で再確認
- 実 put / delete は Phase 13 ユーザー承認後の別オペレーション
