# Cloudflare 無料ティア考慮

## D1 制限

| 制限 | 値 |
|------|-----|
| ストレージ上限 | 5 GB |
| 読み取り | 500万行/日 |
| 書き込み | 100万行/日 |

## 本リポジトリ層での対応

1. **バッチ取得の最適化**: `listMembersByIds`, `listTagsByMemberIds` で IN クエリを使用し、N+1 を回避。
2. **ページネーション**: `listResponsesByEmail` で LIMIT/OFFSET を使用し、大量データの一括取得を防止。
3. **インデックス活用**: マイグレーションで定義済みの `idx_member_responses_email_submitted` などを活用。
4. **不要なクエリの排除**: builder.ts で `Promise.all` による並行クエリを採用し、逐次クエリを最小化。

## 注意事項

- 本番環境では D1 read replica の活用を検討（将来的なスケールアップ時）
- MVP 段階では無料ティアで十分なトラフィックに対応可能
