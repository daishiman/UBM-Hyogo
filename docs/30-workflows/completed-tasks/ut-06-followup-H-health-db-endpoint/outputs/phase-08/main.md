# Phase 8 成果物 — セキュリティ・コンプライアンス

## 1. 脅威モデル

| ID | 脅威 | 攻撃者プロファイル | 対策 |
| --- | --- | --- | --- |
| TH-1 | unauth で D1 ping を打たれる（probing / DoS の踏み台化） | 公開 IP からの探索 bot | 案 D defense in depth: WAF rule（IP allowlist + rate limit）+ `X-Health-Token` ヘッダ検証 |
| TH-2 | token 漏洩（git / Slack / log への混入） | 内部不注意 | 1Password 管理 + Cloudflare Secrets binding（環境変数注入）/ `wrangler secret put` 経路のみ / `console.error(token)` 禁止 |
| TH-3 | timing attack による token 推測 | 高度な攻撃者 | `timingSafeEqual` で定数時間比較 |
| TH-4 | error message 経由の内部実装露出 | 受動観測 | `err.name` のみ返却（`err.message` を返さない） |
| TH-5 | WAF rule 解除事故（運用ミス） | 内部不注意 | endpoint 側の token 検証で defense in depth → 401 に落ちる |
| TH-6 | token rotation 時の窓口閉鎖 | 運用上の制約 | `wrangler secret put` で逐次更新可能。短期的に旧 token を許容したい場合は環境変数を 2 つ用意（本 PR 範囲外 / future work） |

## 2. 適用済みの control

- [x] **入力検証**: `X-Health-Token` ヘッダの存在と値を必須化、定数時間比較
- [x] **fail-closed**: `HEALTH_DB_TOKEN` 未設定環境では DB に触れず 503 即返
- [x] **最小権限**: ハンドラは `prepare("SELECT 1")` 1 回のみ。書き込みクエリ無し
- [x] **error sanitization**: catch 節で `err.name` のみ JSON 化
- [x] **不変条件 #5 維持**: D1 アクセスは `apps/api` 内に閉じる
- [x] **シークレット管理**: 平文を repo にコミットしない（CLAUDE.md §シークレット管理 準拠）

## 3. 運用 control（ユーザー側で適用必要）

- [ ] **Cloudflare WAF rule**: `/health/db` への access を IP allowlist + rate limit（例: 60 req/min/IP）
- [ ] **Cloudflare Secrets**: `wrangler secret put HEALTH_DB_TOKEN --env production` / `--env staging`
- [ ] **token rotation 手順**: 90 日ごとに新値を生成し `wrangler secret put` で上書き
- [ ] **observability**: Workers tail で 401/503 出現率を監視

> 詳細手順は `outputs/phase-12/operator-runbook.md`（Phase 12 で生成）

## 4. token 生成方針

```bash
# 32 byte ランダム + base64url
openssl rand -base64 32 | tr '+/' '-_' | tr -d '='
```

- 長さ 43 文字程度（base64url の 32B）
- 1Password の `op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN` フィールドに保管
- `wrangler secret put` の prompt に貼り付ける（`op read` で出力 → pipe する）

## 5. コンプライアンス

- 個人情報を扱わない endpoint（SELECT 1 のみ）。GDPR / 個人情報保護法は該当なし
- audit log: `/health/db` の 200/503 は Workers logs に残るが、token 値は記録しない（ヘッダ全体を log に吐かない）

## 6. 残存リスク

| ID | リスク | 受容判断 |
| --- | --- | --- |
| R-1 | DoS（401/503 連発で Workers リクエスト数を消費） | WAF rate limit で緩和。Workers の Free/Paid プラン上限を超えるなら CDN 側で block |
| R-2 | token 漏洩後のなりすまし | rotation 手順 + 影響範囲は SELECT 1 のみで個人情報なし。MEDIUM で受容 |
| R-3 | UT-22 未完了 production への deploy | Phase 5 Step 0 で `cf.sh d1 migrations list` を必須化 |

## 7. 引き渡し

Phase 9 へ: SLO（成功時 latency / 503 率 / 401 率）を定義し UT-08 通知基盤の閾値合意のインプットを用意。
