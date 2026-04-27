# Phase 4 成果物: ロールバック手順 (rollback-procedure.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 4 / 13 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |
| 適用範囲 | Phase 5 セットアップ実行時の失敗 / 異常検出時 |

## 1. ロールバックの基本方針

- production バケット / production Token への破壊的操作は**最終手段**として実施する
- staging から先に切り戻し、影響範囲を確認してから production を切り戻す
- ロールバック後は必ず Phase 6 異常系検証で再現性を確認する

## 2. ロールバックシナリオ

### S-1: バケット作成後の切り戻し

```bash
# 1. バケット内オブジェクトを全削除（テストファイルのみ存在する想定）
wrangler r2 object delete ubm-hyogo-r2-staging/<object-key>

# 2. バケット削除
wrangler r2 bucket delete ubm-hyogo-r2-staging

# 3. 確認
wrangler r2 bucket list | grep ubm-hyogo-r2-staging || echo "OK: deleted"
```

> production バケットの削除は **一切のオブジェクトが存在しないこと** を確認してから実施する。

### S-2: wrangler.toml 追記の切り戻し

```bash
# 該当コミットを特定
git log --oneline -- apps/api/wrangler.toml

# パターン A: コミット単位で revert
git revert <commit-hash>

# パターン B: 該当セクションのみ削除（手動編集）
# [[env.staging.r2_buckets]] / [[env.production.r2_buckets]] ブロックを削除
```

### S-3: CORS 設定の解除

```bash
# CORS ルールを削除（空 JSON 適用 or 削除コマンド）
wrangler r2 bucket cors delete ubm-hyogo-r2-staging
wrangler r2 bucket cors delete ubm-hyogo-r2-prod

# 確認
wrangler r2 bucket cors get ubm-hyogo-r2-staging
# 期待: ルールが空であること
```

### S-4: API Token 削除

```
1. Cloudflare Dashboard > My Profile > API Tokens
2. ubm-hyogo-r2-token を選択 > Delete
3. GitHub Secrets から CLOUDFLARE_R2_TOKEN を削除:
   gh secret remove CLOUDFLARE_R2_TOKEN
4. 関連ジョブ（CI/CD）の停止確認
```

### S-5: 全面ロールバック（緊急時）

実行順:

1. CI/CD パイプラインを一時停止（`gh workflow disable`）
2. CORS 設定を解除（S-3）
3. wrangler.toml を revert（S-2）
4. バケットを削除（S-1）
5. Token を削除（S-4）
6. インシデント記録を Phase 12 implementation-guide のインシデント章に追記

## 3. ロールバック実行責任者

| シナリオ | 第一責任者 | 第二責任者 |
| --- | --- | --- |
| S-1 (staging) | Phase 5 実行担当者 | - |
| S-1 (production) | Phase 5 実行担当者 | プロジェクトオーナー（PR レビュアー 2 名）|
| S-2 | Phase 5 実行担当者 | - |
| S-3 | Phase 5 実行担当者 | - |
| S-4 | Phase 5 実行担当者 | - |
| S-5（緊急） | プロジェクトオーナー | - |

> 本タスクは spec_created のため、責任者の実名は記載しない。Phase 5 着手タスクで実名が確定する。

## 4. ロールバック前のチェックリスト

```
[ ] ロールバック前のリソース状態を記録（バケット内オブジェクト数 / CORS JSON / wrangler.toml diff）
[ ] 本番影響の有無を確認（staging のみで完結する場合は production を触らない）
[ ] 関連 PR / Issue がある場合は status を更新
[ ] ロールバック後の再検証計画を立てる
```

## 5. ロールバック後の検証

```bash
# wrangler.toml が元に戻っていること
git diff HEAD apps/api/wrangler.toml

# バケットが削除されていること
wrangler r2 bucket list | grep ubm-hyogo-r2-

# Token が無効化されていること
# Dashboard 上で「Revoked」表記を目視確認

# GitHub Secrets が削除されていること
gh secret list | grep CLOUDFLARE_R2_TOKEN || echo "OK: removed"
```

## 6. ロールバック試行（Phase 6 FC-06 で実施）

Phase 6 で以下を staging 限定で実行し、本書の手順が機能することを検証する:

1. テスト用バケット `ubm-hyogo-r2-staging-rollback-test` を作成
2. CORS / オブジェクト PUT
3. 上記 S-1 / S-3 を順次実行
4. 削除後の状態確認
5. 所要時間と落とし穴を Phase 6 anomaly-test-result.md に記録

## 7. リスクと注意事項

- **production バケットの削除はオブジェクト残存時に拒否される**（保護メカニズム）。残存時は手動で全削除してから再試行
- **Token 削除直後に CI が走ると失敗する**ため、CI 停止 → Token 削除の順序を守る
- **wrangler.toml の revert を忘れた状態で再 deploy するとバインディングエラー** → 必ず S-2 を S-1 の前後で確認

## 8. 完了条件チェック

- [x] S-1〜S-5 のロールバックシナリオが記載
- [x] 各シナリオの実行コマンドが記載
- [x] 責任者枠が記載
- [x] ロールバック後の検証手順が記載
- [x] Phase 6 FC-06 との連動が明示
