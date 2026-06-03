# アーキテクチャ設計 — issue-1030

## データフロー

```
[admin browser]
  File 選択
   └─ buildMemberPhotoVariants(file)  (apps/web/src/lib/admin/image-resize.ts)
        ├─ display: ≤512px webp
        ├─ thumb:   96×96 cover webp (失敗時 null)
        └─ contentHash: sha-256(display bytes)
   └─ FormData{ display, thumb?, contentHash } → POST /api/admin/members/:id/photo
        │
[apps/api (Hono)]  ── invariant #5 境界 ──
   └─ validate(MIME/size) → R2.put(display key), R2.put(thumb key?)
   └─ D1 upsertMemberPhoto(objectKey, thumbObjectKey?, contentHash?, processingStatus)
   └─ audit

[GET /api/admin/members/:id]
   └─ resolvePhotoUrl: presign(display)→photoUrl, presign(thumb?)→photoThumbUrl
        │
[admin browser]
   └─ MemberAvatar: sm/md → photoThumbUrl ?? photoUrl ; lg → photoUrl
        └─ <img onError> → hue placeholder
```

## レイヤ責務

| レイヤ | 責務 | 不変条件 |
|--------|------|----------|
| apps/web util | variant 生成・hash | 例外を投げず fallback（WEEKGRD-02） |
| apps/web UI | size→variant 選択・3 段 fallback | OKLch token / 既存 Avatar 流用 |
| apps/api route | validate / R2 put / presign / audit | R2/D1 を閉じる（#5） |
| apps/api repo | variant メタ CRUD | admin-managed 分離（#4） |
| D1 | variant 識別メタ永続化 | 後方互換 ADD COLUMN |

詳細契約は [api-specification.md](api-specification.md) / [database-schema.md](database-schema.md) と [../../phase-2.md](../../phase-2.md)。
