# テスト設計 — issue-1030

## Red 前提

本 workflow は `spec_created` であり、実装は未実行。Phase 4 は実装前に失敗するべき contract を固定する。

| 領域 | Red 理由 |
| --- | --- |
| API repository | `member_photos` variant 列と `MemberPhotoRow` 拡張が未実装 |
| admin route | `display` / `thumb` multipart と `photoThumbUrl` presign が未実装 |
| shared schema | `photoThumbUrl?` optional field が未定義 |
| web util | `buildMemberPhotoVariants()` が未作成 |
| UI | `MemberAvatar` size 別 src 選択が未実装 |

## 必須テストセット

| ID 範囲 | 対象 | 目的 |
| --- | --- | --- |
| REPO-V-1..5 | `memberPhotos.spec.ts` | `thumb_object_key` / `thumb_byte_size` / `content_hash` / `processing_status` の round-trip と後方互換 |
| ROUTE-V-1..13 | `member-photo.contract.spec.ts` | display+thumb upload、旧 `file` 後方互換、size/MIME validation、副作用ゼロ、GET fail-soft、DELETE 両 key |
| RESIZE-U-1..4 | `image-resize.spec.ts` | Canvas 正常系、`createImageBitmap` 失敗、encode 失敗、SSR guard |
| AVATAR-V-1..6 | `MemberAvatar.spec.tsx` | sm/md は thumb 優先、lg は display、欠落・onError は hue placeholder |

## 命名と実行

- 新規/追補テストは `*.spec.{ts,tsx}` のみ。
- API は `@ubm-hyogo/api`、web は `@ubm-hyogo/web`、shared は `@ubm-hyogo/shared` の既存 Vitest project を使う。
- Phase 5 実装後、Phase 4 の Red ケースを Green 化するまで Phase 6 へ進まない。

## 完了判定

Phase 4 の成果物は root [phase-4.md](../../phase-4.md) と本ファイルで一致。実装 wave では上表の全 ID が fail から pass へ遷移したことを evidence に残す。
