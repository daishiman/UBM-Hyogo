# システム仕様更新サマリー

## 本タスク（02a）で追加された仕様

### リポジトリ層の確立

- `apps/api/src/repository/` 配下にリポジトリ層を新設
- D1 アクセスを `apps/api` に閉じる設計を実装で確認

### 独自 D1 interface

- `D1Db`, `D1Stmt`, `DbCtx` interface を `_shared/db.ts` で定義
- `@cloudflare/workers-types` には非依存（テスト可能性のため）

### ビュー組み立てパターン

- `builder.ts` で ViewModel 組み立てを一元管理
- `buildPublicMemberProfile`, `buildMemberProfile`, `buildAdminMemberDetailView`, `buildPublicMemberListItems` を提供

### AdminNotes 分離パターン

- `buildAdminMemberDetailView(c, mid, adminNotes)` として adminNotes を引数で受け取る
- `PublicMemberProfile` および `MemberProfile` には adminNotes を含めない

### Review後の補正

- `buildPublicMemberListItems()` は member/status/response をバッチ取得し、公開リストのN+1を避ける
- `member_field_visibility` 未設定時の既定値は privacy first で `member`
- Phase 11 は UI変更なしの NON_VISUAL evidence として扱う
- root `pnpm test` は local secret authorization timeout でブロックされたため、targeted Vitest を証跡にする

## 後続タスクへの影響

| 後続タスク | 影響 |
|-----------|------|
| 03a, 03b | repository 関数を呼び出して使用可能 |
| 04a, 04b, 04c | API エンドポイントから builder 関数を呼び出す |
| 05a | 認証後の member_id を使って repository 関数を呼び出す |
