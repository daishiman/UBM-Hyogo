# Phase 6 主成果物: 異常系検証

## 異常系検証結果

### 検証済みケース
| ケース | 再現手順 | 実際の挙動 | 対処方法 |
|--------|----------|------------|----------|
| SA 未共有 | シートからSAを削除して API呼び出し | 403 PERMISSION_DENIED | シートに再共有 |
| API 無効 | Cloud ConsoleでAPI無効化後に呼び出し | 403 accessNotConfigured | APIを再有効化 |
| JSON key 無効 | Cloud ConsoleでKeyを削除後に呼び出し | 401 invalid_grant | 新しいKeyを作成し SECRET を更新 |
| SHEET_ID 誤り | 存在しないIDで呼び出し | 404 NOT_FOUND | 正しいIDをGitHub Variablesに設定 |

### Rollback 手順
| 状況 | Rollback 方法 |
|------|---------------|
| 誤ったSAをシートに共有した | シートの共有設定からSAメールを削除 |
| 誤ったSecretを投入した | `wrangler secret put [NAME]` で上書き |
| SA keyが漏洩した | Cloud Console > Keys > 該当キーを削除し新しいキーを作成 |

### Phase 7 への引き継ぎ
- 全異常系ケースの対処方法が確認済み
- Rollback手順が文書化されている
