# DB schema — issue-1030 migration 0023

## 0024_member_photos_variants.sql

```sql
-- 0024_member_photos_variants.sql
-- issue-1030: member photo display/thumb variant metadata（client-side 生成）
-- invariant #4: admin-managed として分離。後方互換 ADD COLUMN。
ALTER TABLE member_photos ADD COLUMN thumb_object_key  TEXT;
ALTER TABLE member_photos ADD COLUMN thumb_byte_size   INTEGER;
ALTER TABLE member_photos ADD COLUMN content_hash      TEXT;
ALTER TABLE member_photos ADD COLUMN processing_status TEXT NOT NULL DEFAULT 'none';
```

## 列マッピング（D1 snake_case → TS camelCase）

| D1 列 | 型 | TS（MemberPhotoRow） | 由来 |
|-------|----|----------------------|------|
| member_id | TEXT PK | memberId | 既存 |
| object_key | TEXT | objectKey（display） | 既存 |
| content_type | TEXT | contentType | 既存 |
| byte_size | INTEGER | byteSize | 既存 |
| thumb_object_key | TEXT NULL | thumbObjectKey \| null | **新規** |
| thumb_byte_size | INTEGER NULL | thumbByteSize \| null | **新規** |
| content_hash | TEXT NULL | contentHash \| null | **新規** |
| processing_status | TEXT NOT NULL DEFAULT 'none' | processingStatus | **新規** |
| uploaded_by | TEXT | uploadedBy | 既存 |
| uploaded_at | TEXT | uploadedAt | 既存 |

## 後方互換

- `ALTER TABLE ADD COLUMN` は非破壊。既存行は新列 NULL / `processing_status='none'`。
- `getMemberPhoto` の SELECT 拡張後も既存行は 200 で返る（新列は null/none）。
- migration sequence: 0022 の次として 0023 を追加。`sequence-exceptions.json` 影響なし（連番継続）。
