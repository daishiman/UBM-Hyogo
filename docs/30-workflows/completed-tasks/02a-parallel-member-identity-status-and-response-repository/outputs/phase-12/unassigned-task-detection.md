# 未割り当てタスク検出

## 検出された未割り当てタスク

### 1. admin_member_notes テーブルの読み取り

- **内容**: `admin_member_notes` テーブルから adminNotes を取得する repository 関数
- **理由**: `buildAdminMemberDetailView` は adminNotes を引数で受け取る設計のため、呼び出し側が取得責務を担う
- **推奨担当**: 04c（admin backoffice API endpoints）タスク
- **Formal task**: `docs/30-workflows/unassigned-task/UT-02A-ADMIN-MEMBER-NOTES-REPOSITORY.md`

### 2. meeting_sessions / member_attendance の読み取り

- **内容**: `MemberProfile.attendance` フィールドの実データ取得
- **現状**: builder.ts では空配列 `[]` を返している
- **推奨担当**: 別途 attendance 管理タスク（未作成）
- **Formal task**: `docs/30-workflows/unassigned-task/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md`

### 3. tag_assignment_queue の管理

- **内容**: タグ割り当てキューの作成・更新
- **現状**: memberTags.ts は read-only のみ
- **推奨担当**: 03a（forms schema sync and stablekey alias queue）タスク
- **Formal task**: `docs/30-workflows/unassigned-task/UT-02A-TAG-ASSIGNMENT-QUEUE-MANAGEMENT.md`

### 4. section / field metadata の正規化

- **内容**: `response_fields` と `response_sections` の section membership、label、field kind を canonical schema metadata から解決する
- **現状**: builder.ts は fallback label/kind と広い section assignment を使う
- **推奨担当**: 03a schema sync または 04a/04b API contract hardening
- **Formal task**: `docs/30-workflows/unassigned-task/UT-02A-SECTION-FIELD-MAPPING-METADATA.md`

## 次フェーズへの引き継ぎ事項

後続タスク（03a, 03b, 04a, 04b, 04c）でリポジトリ層を活用する際は、
implementation-guide.md の使用方法を参照すること。
