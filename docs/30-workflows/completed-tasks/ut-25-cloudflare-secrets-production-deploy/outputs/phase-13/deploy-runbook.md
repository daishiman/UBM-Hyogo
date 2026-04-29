# deploy-runbook — UT-25 secret 配置実投入手順書

> **適用対象**: Cloudflare Workers Secret `GOOGLE_SERVICE_ACCOUNT_JSON` の **staging → production** 投入
> **実走者**: ユーザー本人（Claude Code は実走しない）
> **前提**: `outputs/phase-13/main.md` のユーザー承認チェックリスト全 ✅ 確認済み

---

## STEP 0: 実走前確認（前提充足）

```bash
# 1. ブランチが feature/* / dev ベース（main では作業しない）
git status
git rev-parse --abbrev-ref HEAD

# 2. mise / pnpm / Node の準備
mise install
mise exec -- node --version    # 期待: v24.x
mise exec -- pnpm --version    # 期待: 10.x

# 3. .env が op 参照のみ（実値が無い）
grep -E "^[A-Z_]+=" .env | grep -vE "op://" && echo "WARN: 実値の可能性" || echo "OK: op 参照のみ"

# 4. apps/api/.dev.vars が .gitignore 除外
git check-ignore -v apps/api/.dev.vars
# 期待: .gitignore のいずれかの行にマッチ

# 5. 1Password CLI が認証済み
op whoami

# 6. cf.sh が動作（whoami 確認）
bash scripts/cf.sh whoami
```

**STEP 0 が全て期待通りであることを確認してから STEP 1 に進む**。期待外の場合は中止し、Phase 13 blocked 条件のいずれに該当するかを `main.md` で確認する。

---

## STEP 0.5: 履歴汚染防止（必須）

```bash
set +o history
HISTFILE=/dev/null
export HISTFILE
echo $HISTFILE   # 期待: /dev/null
```

> 以降の STEP では値が一瞬でもシェル履歴に残らないようにする。

---

## STEP 1: staging への投入

### 1-A: 投入前 list（旧 secret の有無確認）

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
```

期待結果: 旧 `GOOGLE_SERVICE_ACCOUNT_JSON` の name の有無を視認。

### 1-B: op 経由 stdin 投入

```bash
op read "op://<Vault>/<Item>/<Field>" \
  | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml --env staging
```

期待結果: `✨ Successfully created secret for GOOGLE_SERVICE_ACCOUNT_JSON`

### 1-C: 投入後 list を evidence ファイルへ書き出し

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging \
  > docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/secret-list-evidence-staging.txt
```

期待結果: `secret-list-evidence-staging.txt` に `GOOGLE_SERVICE_ACCOUNT_JSON` の name 行が含まれる。

> evidence ファイルは name 行のみ（`wrangler secret list` の出力をそのまま記録）。実値・key 内容は転記しない。

### 1-D: STEP 1 完了判定

- [ ] 1-A / 1-B / 1-C 全てエラー無し
- [ ] `secret-list-evidence-staging.txt` に name 行あり
- [ ] **STEP 2（production）に進む前に必ず staging name を視認する**

---

## STEP 2: production への投入（staging 完了後）

### 2-A: 投入前 list

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
```

### 2-B: op 経由 stdin 投入

```bash
op read "op://<Vault>/<Item>/<Field>" \
  | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml --env production
```

期待結果: `✨ Successfully created secret for GOOGLE_SERVICE_ACCOUNT_JSON`

### 2-C: 投入後 list を evidence ファイルへ書き出し

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production \
  > docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/secret-list-evidence-production.txt
```

### 2-D: STEP 2 完了判定

- [ ] 2-A / 2-B / 2-C 全てエラー無し
- [ ] `secret-list-evidence-production.txt` に name 行あり

---

## STEP 3: 履歴汚染チェック

```bash
history | grep -E "BEGIN PRIVATE KEY|private_key|-----BEGIN" \
  || echo "OK: no leak in history"
```

期待結果: `OK: no leak in history`

期待外の場合: 即座にシェルセッションを閉じ、原因調査。`HISTFILE=/dev/null` が STEP 0.5 で適用されていたか確認。

---

## STEP 4: UT-26 引き渡し条件の確認

`outputs/phase-12/implementation-guide.md` Part 3 の引き渡しチェックリストを確認:

- [ ] `secret-list-evidence-staging.txt` / `secret-list-evidence-production.txt` 両方に name 行あり
- [ ] `apps/api/src/jobs/sheets-fetcher.ts` が `env.GOOGLE_SERVICE_ACCOUNT_JSON` を参照
- [ ] `apps/api/wrangler.toml` の env 宣言が想定通り
- [ ] runbook 変更のレビュー方針が決まっている（PR 作成はユーザーの明示指示後）
- [ ] UT-26 担当に引き渡し連絡

---

## 失敗時の即時 rollback

実投入で誤値・誤環境投入・想定外エラーが発生した場合は、**ただちに `rollback-runbook.md` に従う**。

```bash
# rollback-runbook.md §緊急 rollback を参照
# 1. delete
# 2. 旧 key を op read で再投入
# 3. name 確認
```

> rollback 後も履歴汚染チェックを再度実行（STEP 3）。

---

## 完了サマリー（実走後にユーザーが記入）

| 項目 | 結果 |
| --- | --- |
| STEP 0: 前提充足 | <TBD> |
| STEP 0.5: 履歴汚染防止 | <TBD> |
| STEP 1-A / 1-B / 1-C: staging 投入 | <TBD> |
| STEP 1-D: staging name 視認 | <TBD> |
| STEP 2-A / 2-B / 2-C: production 投入 | <TBD> |
| STEP 2-D: production name 視認 | <TBD> |
| STEP 3: 履歴汚染チェック | <TBD> |
| STEP 4: UT-26 引き渡し条件 | <TBD> |
| 完了時刻 | <TBD: YYYY-MM-DDTHH:MM:SS+09:00> |
| 実走者 | <TBD> |

---

## 禁止事項（再掲）

- ❌ `wrangler` を直接呼ぶ（必ず `bash scripts/cf.sh` 経由）
- ❌ `--env staging` をスキップして production 単独投入
- ❌ secret 値・JSON 内容・`private_key` 片鱗をログ・PR・コミットに転記
- ❌ `wrangler login` でローカル OAuth トークン保持
- ❌ `.env` に実値書き込み（必ず `op://` 参照）
- ❌ tty インタラクティブ入力（必ず stdin 経由）

---

## 参照

- `outputs/phase-13/rollback-runbook.md`: rollback 手順
- `outputs/phase-12/implementation-guide.md`: 概念説明 / UT-26 引き渡し
- `outputs/phase-11/manual-smoke-log.md`: staging smoke 実走済の同手順
- `scripts/cf.sh`: wrangler ラッパー
- CLAUDE.md（Cloudflare 系 CLI 実行ルール / シークレット管理）
