# Phase 6 成果物: 異常系テストケース (anomaly-test-cases.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 6 / 13 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |

## 1. テストケース一覧

| FC ID | カテゴリ | ケース名 | 関連 AC | 実行環境 |
| --- | --- | --- | --- | --- |
| FC-01 | CORS | 許可外 origin からの PUT | AC-5 | staging |
| FC-02 | Token | 権限不足 Token での PUT | AC-3 | staging |
| FC-03 | 無料枠 | Storage / Class A / B の超過挙動仕様確認 | AC-6 | 仕様確認のみ |
| FC-04 | バインディング | wrangler.toml typo によるエラー再現 | AC-2 / AC-7 | dry-run |
| FC-05 | 不変条件 | apps/web/wrangler.toml への R2 混入検出 | 不変条件 5 | grep |
| FC-06 | ロールバック | rollback-procedure.md 手順実行テスト | 運用性 | staging |

## 2. FC-01: CORS 違反時の挙動確認

### 目的
許可外 origin から R2 への直接 PUT が CORS preflight で拒否されることを確認。

### 手順

```bash
# 1. 偽装 Origin で curl preflight (OPTIONS) を送信
curl -X OPTIONS \
  -H "Origin: https://evil.example.com" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://<staging-bucket-endpoint>/test-key \
  -i

# 2. ブラウザ DevTools で同様の検証（手動 smoke test 内）
```

### 期待結果
- preflight レスポンスが `Access-Control-Allow-Origin` ヘッダなし、または不一致
- ステータスコード 403 または preflight 失敗
- 実 PUT は実行されない

### Mitigation

```bash
# 許可 origin を追加する場合
# cors-staging.json の AllowedOrigins に正規ドメインを追加
wrangler r2 bucket cors put ubm-hyogo-r2-staging --rules ./cors-staging.json
wrangler r2 bucket cors get ubm-hyogo-r2-staging
```

UT-16 完了後の origin 差し替えと連動。

## 3. FC-02: 権限不足 Token での挙動確認

### 目的
R2:Read のみ Token / 無効 Token での PUT が拒否されることを確認。

### 手順

```bash
# 1. テスト用 R2:Read Token を Dashboard で一時作成
# Token 名: r2-read-only-test-<日付>
# Permission: Account > Workers R2 Storage: Read

# 2. 当該 Token で wrangler に切り替え
export CLOUDFLARE_API_TOKEN=<test-read-token>

# 3. PUT 試行
echo "test" > /tmp/perm-test.txt
wrangler r2 object put ubm-hyogo-r2-staging/perm-test.txt --file /tmp/perm-test.txt

# 4. 終了後 Token を即削除
# Dashboard > API Tokens > <test token> > Delete
```

### 期待結果
- HTTP 403 / `unauthorized` / `permission denied` のいずれかが返る
- バケット内に `perm-test.txt` が作成されない

### Mitigation
専用 R2 Token に Edit 権限を付与（採用案D）。`token-scope-decision.md` 参照。

## 4. FC-03: 無料枠超過の仕様確認（実テストはしない）

### 目的
無料枠到達時の挙動を Cloudflare 公式仕様で確認。実消費は行わない。

### 手順
1. Cloudflare Dashboard > R2 > Analytics で現在の Storage / Class A / Class B を確認
2. 公式ドキュメント `https://developers.cloudflare.com/r2/pricing/` の無料枠章を引用

### 期待結果（仕様引用）
- Storage 10GB 超: 書き込みが拒否される（無料枠の場合）
- Class A 1,000 万超: throttling
- Class B 1 億超: throttling
- 課金有効化していない場合は機能停止

### Mitigation
- UT-17 で 80% 閾値の自動通知を実装
- UT-17 未着手の場合は月次手動確認（Phase 12 implementation-guide）

## 5. FC-04: バインディング誤設定時のエラー再現

### 目的
wrangler.toml の `bucket_name` typo / `binding` 名不整合を検出。

### 手順

```bash
# 1. wrangler.toml に意図的 typo を入れる（一時的に）
# 例: bucket_name = "ubm-hyogo-r2-stagng"  ← typo

# 2. dry-run
wrangler deploy --dry-run --env staging

# 期待: bucket not found / binding mismatch エラー

# 3. 修正して dry-run 再実行
```

### 期待結果
- bucket not found エラー
- もしくは binding 経由のランタイム未定義エラー（実コードからアクセスした場合）

### Mitigation
- `binding-name-registry.md` を正本として参照
- CI で `wrangler deploy --dry-run` を必須化（将来）

## 6. FC-05: apps/web 混入検出

### 目的
`apps/web/wrangler.toml` への R2 設定混入を防衛（不変条件 5）。

### 手順

```bash
# grep で検出
grep -nE "r2_buckets|R2_BUCKET" apps/web/wrangler.toml

# 期待: 何も出力されないこと（混入なし）
# 出力された場合 → 即時削除 + Phase 2 設計差し戻し
```

### 期待結果
- grep 出力なし: PASS
- grep 出力あり: BLOCKER（即修正）

### Mitigation
- Pre-commit hook で同 grep を実行（将来 / Phase 12 申し送り）
- CI で同検証を必須化（将来）

## 7. FC-06: ロールバック実行テスト（staging 限定）

### 目的
`rollback-procedure.md` の手順が実機で機能することを確認。

### 手順

```bash
# 1. テスト用バケット作成（正規と混同しない名前）
wrangler r2 bucket create ubm-hyogo-r2-staging-rollback-test

# 2. CORS 適用
wrangler r2 bucket cors put ubm-hyogo-r2-staging-rollback-test --rules ./cors-staging.json

# 3. オブジェクト PUT
echo "rollback-test" > /tmp/rb.txt
wrangler r2 object put ubm-hyogo-r2-staging-rollback-test/rb.txt --file /tmp/rb.txt

# 4. ロールバック実行（S-1 / S-3）
wrangler r2 object delete ubm-hyogo-r2-staging-rollback-test/rb.txt
wrangler r2 bucket cors delete ubm-hyogo-r2-staging-rollback-test
wrangler r2 bucket delete ubm-hyogo-r2-staging-rollback-test

# 5. 確認
wrangler r2 bucket list | grep rollback-test || echo "OK: deleted"
```

### 期待結果
- 全コマンド成功 / 最終確認で削除済
- 所要時間: 5 分以内

### Mitigation
- 失敗時は手順を rollback-procedure.md に追記

## 8. FC × AC 対応表

| FC | 関連 AC | カバー範囲 |
| --- | --- | --- |
| FC-01 | AC-5 | CORS 適用 / 違反時挙動 |
| FC-02 | AC-3 | Token スコープ |
| FC-03 | AC-6 | 無料枠監視仕様 |
| FC-04 | AC-2 / AC-7 | バインディング整合 |
| FC-05 | （不変条件 5） | apps/web 防衛 |
| FC-06 | （運用性） | ロールバック実機検証 |

## 9. 完了条件チェック

- [x] FC-01〜FC-06 のテストケース定義
- [x] 各ケースの目的・手順・期待結果・mitigation
- [x] FC × AC 対応表
- [x] 機密情報なし（プレースホルダ使用）
- [x] production への破壊的操作禁止が明示
