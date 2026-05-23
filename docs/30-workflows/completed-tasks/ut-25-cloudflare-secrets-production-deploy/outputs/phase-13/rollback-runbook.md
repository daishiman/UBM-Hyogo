# rollback-runbook — UT-25 secret 緊急 rollback 手順書

> **適用対象**: Cloudflare Workers Secret `GOOGLE_SERVICE_ACCOUNT_JSON` の **誤投入後の即時巻き戻し**
> **設計根拠**: Phase 3 §代替案 E（delete + 再 put / fail-fast）採用
> **特性**: deploy-runbook.md と独立した自己完結ファイル（緊急時の参照性優先）

---

## いつこの runbook を使うか

| トリガー | 適用 |
| --- | --- |
| 誤った key（旧 key / dev 用 key 等）を staging or production に投入してしまった | ✅ |
| 投入直後に Sheets API 401/403 が大量発生 | ✅ |
| 誤った環境（staging に production key、または逆）を投入 | ✅ |
| key rotation で旧 key を即時無効化したい | ✅ |
| **secret 値が PR / ログ / 履歴に流出した疑いがある** | ✅（key 自体を Google 側で revoke + 新 key 投入） |

---

## STEP 0: 履歴汚染防止（必須）

```bash
set +o history
HISTFILE=/dev/null
export HISTFILE
echo $HISTFILE
```

---

## STEP 1: 誤値の即時除去（delete）

### staging の場合

```bash
bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON \
  --config apps/api/wrangler.toml --env staging
```

### production の場合

```bash
bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON \
  --config apps/api/wrangler.toml --env production
```

### 削除後 list 確認

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <staging|production>
# 期待: GOOGLE_SERVICE_ACCOUNT_JSON が一覧から消えている
```

> この時点で `apps/api` は Sheets API への署名ができなくなる。**STEP 2 の再投入を遅延なく実施する**。

---

## STEP 2: 旧 key（または新 key）の再投入

### 旧 key で復旧する場合

```bash
op read "op://<Vault>/<Item>/<Field-OLD>" \
  | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml --env <staging|production>
```

### 新 key（rotation）で復旧する場合

1. Google Cloud Console で SA に新 key を発行（旧 key は revoke 予定）
2. 新 key を 1Password の `op://<Vault>/<Item>/<Field-NEW>` に保管
3. 投入:

```bash
op read "op://<Vault>/<Item>/<Field-NEW>" \
  | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml --env <staging|production>
```

4. 動作確認後に Google Cloud Console で **旧 key を revoke**（流出疑いがある場合は STEP 3 と並行で即 revoke）

---

## STEP 3: 投入後 list で name 確認

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <staging|production>
# 期待: GOOGLE_SERVICE_ACCOUNT_JSON が name として 1 件表示
```

evidence ファイル（`secret-list-evidence-{staging,production}.txt`）を上書きする場合:

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging \
  > docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/secret-list-evidence-staging.txt
# production も同様
```

> rollback による evidence 上書きは PR コメントで履歴を残す。

---

## STEP 4: 履歴汚染チェック

```bash
history | grep -E "BEGIN PRIVATE KEY|private_key|-----BEGIN" \
  || echo "OK: no leak in history"
```

---

## STEP 5: 影響範囲の確認

| 確認項目 | 方法 |
| --- | --- |
| `apps/api` のヘルスチェック | Cloudflare Workers logs / `apps/api/healthcheck` 系エンドポイント |
| Sheets API 呼び出し成功 | UT-26 疎通テスト or 手動 SA 認証確認 |
| 流出疑いがあれば旧 key revoke | Google Cloud Console で削除済を確認 |

---

## 完了サマリー（rollback 実走後にユーザーが記入）

| 項目 | 結果 |
| --- | --- |
| トリガー（なぜ rollback が必要だったか） | <TBD> |
| 対象環境 | <TBD: staging / production / both> |
| STEP 1: delete | <TBD> |
| STEP 2: 再投入（旧 key / 新 key どちらか明記） | <TBD> |
| STEP 3: name 確認 | <TBD> |
| STEP 4: 履歴汚染チェック | <TBD> |
| STEP 5: 影響範囲確認 | <TBD> |
| 旧 key revoke の要否 | <TBD: 不要 / 要・revoke 済> |
| 完了時刻 | <TBD: YYYY-MM-DDTHH:MM:SS+09:00> |
| 実走者 | <TBD> |

---

## 禁止事項（再掲）

- ❌ 「上書き put 単独」での rollback（旧値が一瞬でも runtime に残る）
- ❌ delete 後に再投入を遅延（apps/api が無認証状態で本番稼働してしまう）
- ❌ 流出疑いがあるのに旧 key revoke を先送り
- ❌ rollback 中の `wrangler` 直接呼び出し（必ず `bash scripts/cf.sh` 経由）

---

## 参照

- `outputs/phase-13/deploy-runbook.md`: 通常投入手順
- `outputs/phase-03/main.md` §代替案 E: rollback 設計根拠
- `scripts/cf.sh`: wrangler ラッパー
- CLAUDE.md（Cloudflare 系 CLI 実行ルール）
- 1Password 正本: `op://<Vault>/<Item>/<Field>`（実 path は UT-03 runbook を参照）
