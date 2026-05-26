# Phase 11: 手動テスト / NON_VISUAL 宣言

> Refs #913
> 前提: Gate-B 通過済（Phase 9 / Phase 10 全 PASS）。本フェーズの不可逆 mutation 実行は Gate-C 相当のユーザー明示承認後のみ。

## NON_VISUAL 宣言

本タスクは `apps/api` middleware + D1 schema の追加であり、UI 視覚変更を伴わない。よって `artifacts.json.visual_category = "NON_VISUAL"` を正本とし、Playwright visual baseline は不要・スクリーンショット添付なしとする。CLAUDE.md UI prototype alignment スコープ外。

## 代替証跡（NON_VISUAL の根拠付け）

視覚証跡の代わりに、以下 3 種の機械的証跡を `outputs/phase-11/` 配下へ保存し、PR description から参照する。

| # | 種別 | 保存先 | 取得方法 |
|---|---|---|---|
| 1 | contract.spec PASS ログ | `outputs/phase-11/contract-spec-pass.log` | Phase 9 #4 コマンドの stdout を tee で保存 |
| 2 | `wrangler tail` での dedupe ログ | `outputs/phase-11/wrangler-tail-dedupe.log` | staging 適用後、`bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging` で並走させた状態で下記 E2E を実施 |
| 3 | `d1 export` によるテーブル状態 snapshot | `outputs/phase-11/idempotency-keys-snapshot.sql` | `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env staging --table idempotency_keys --output outputs/phase-11/idempotency-keys-snapshot.sql` |

## 手動 E2E 手順（staging）

> 各 `bash scripts/cf.sh` コマンドはユーザー明示承認（Gate-C 相当）後にのみ実行する。承認前は read-only な `d1 migrations list` のみ取得可能。

### Step 0: 事前 read-only evidence（承認前に取得可能）

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env staging
```

期待: `0021_idempotency_keys` が未適用（pending）として一覧に出る。出力を `outputs/phase-11/migrations-list-before.txt` に保存。

### Step 1: staging migration apply（**user-gated / 不可逆**）

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env staging
```

期待: `0021_idempotency_keys` が applied になる。`bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env staging` を再実行し `outputs/phase-11/migrations-list-after.txt` に保存して diff を取る。

### Step 2: staging deploy（**user-gated / 不可逆**）

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

期待: deploy 成功。出力末尾の Version ID を `outputs/phase-11/deploy-version-id.txt` に控える（後の rollback ポインタ）。

### Step 3: 同一 Idempotency-Key を 2 回送る（再生確認）

事前に staging 用 admin session で取得した `Cookie` と `Authorization` を環境変数化した状態で、admin mutation endpoint の任意 1 件（例: tag 作成）に対して以下を 2 回送る。

```bash
KEY="$(uuidgen)"
curl -sS -X POST "https://<api-staging-host>/admin/tags" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${KEY}" \
  --cookie "<staging-cookie>" \
  -d '{"name":"idem-test-A"}' -o outputs/phase-11/curl-1.json -w "%{http_code}\n"

curl -sS -X POST "https://<api-staging-host>/admin/tags" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${KEY}" \
  --cookie "<staging-cookie>" \
  -d '{"name":"idem-test-A"}' -o outputs/phase-11/curl-2.json -w "%{http_code}\n"
```

期待: 1 回目 = 201（新規作成）、2 回目 = 同一 status + body（保存結果の再生。tag が二重作成されていないこと）。`wrangler tail` 側で 2 回目が「replay from idempotency_keys」相当の dedupe ログを出すことを確認。

### Step 4: 並行送信で 409（in_flight 衝突）

GNU `parallel` または `xargs -P 2` で同一 key の curl を 2 本同時に投げ、片方が 201、もう片方が 409（in_flight）になることを確認。

```bash
KEY="$(uuidgen)"
seq 1 2 | xargs -I{} -P 2 -- bash -c '
  curl -sS -X POST "https://<api-staging-host>/admin/tags" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: '"${KEY}"'" \
    --cookie "<staging-cookie>" \
    -d "{\"name\":\"idem-test-B\"}" -w "[parallel-{}] %{http_code}\n" -o /dev/null
' | tee outputs/phase-11/curl-parallel.log
```

期待: ログに `201` と `409` が 1 件ずつ出ること。

### Step 5: テーブル状態 snapshot

```bash
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env staging --table idempotency_keys --output outputs/phase-11/idempotency-keys-snapshot.sql
```

期待: 上記 Step 3, 4 の key が `status=completed` / `status=in_flight or completed` で記録されていること。

## evidence 保存先まとめ

| ファイル | 内容 |
|---|---|
| `outputs/phase-11/manual-test-result.md` | 本ページの実施結果サマリ（各 Step の期待結果と実測の比較。Gate-B evidence_path に指定済） |
| `outputs/phase-11/contract-spec-pass.log` | Phase 9 #4 のログ |
| `outputs/phase-11/migrations-list-before.txt` / `migrations-list-after.txt` | apply 前後の状態 |
| `outputs/phase-11/deploy-version-id.txt` | rollback 用 version pointer |
| `outputs/phase-11/curl-1.json` / `curl-2.json` / `curl-parallel.log` | 再生 / 409 の挙動 |
| `outputs/phase-11/idempotency-keys-snapshot.sql` | テーブル状態 |
| `outputs/phase-11/wrangler-tail-dedupe.log` | dedupe ログ |

## 終了条件

- Step 0 が承認前に完了済
- Step 1-5 がユーザー明示承認後に完了し、期待結果と実測が一致
- 上記 evidence が `outputs/phase-11/` 配下に揃っている
- Phase 12 documentation 作成に進める状態
