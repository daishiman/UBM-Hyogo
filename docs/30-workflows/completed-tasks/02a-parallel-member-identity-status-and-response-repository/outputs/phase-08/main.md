# Phase 8: DRY 化

## DRY 化実施内容

before-after.md 参照

## 実施した DRY 化

1. **`placeholders()` 関数の抽出**: `members.ts` と `memberTags.ts` で共通して使用する IN クエリのプレースホルダー生成を `_shared/sql.ts` に集約。

2. **`buildVisibilityMap()` の内部ヘルパー化**: builder.ts 内で繰り返し使われるマップ構築ロジックをヘルパー関数に集約。

3. **`buildSections()` の共通化**: `buildPublicMemberProfile`, `buildMemberProfile`, `buildAdminMemberDetailView` の 3 関数で使われるセクション組み立てロジックを共通ヘルパーに集約。

4. **Row 型の共有**: `MemberIdentityRow` を `members.ts` で定義し、`identities.ts` からは re-import して使用。

## DRY 化しなかった部分

- 各テーブルの SQL クエリ: テーブル固有であるため、抽象化のコストがベネフィットを上回る
- MockStore の各テーブル処理: テスト特有のコードであり、本番コードの DRY と切り離す
