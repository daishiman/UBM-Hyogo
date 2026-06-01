# 16. Member Photo Public Exposure Policy

> 管理: issue-1029-public-member-photo-display
> 状態: implemented_local_runtime_pending（実コード配線・unit test 完了 / staging deploy・screenshot は user-gated）
> 最終更新: 2026-06-01

## 目的

公開メンバー一覧と公開プロフィールに、#983 で実装済みの admin-managed member photo を表示するための公開境界を定義する。実コード配線は `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/` の実装サイクルで行う。

## 公開条件

public `photoUrl` を返してよい条件は次の AND とする。

| 条件 | 正本 |
| --- | --- |
| member が公開同意済み | `member_status.public_consent = 'consented'` |
| member が公開状態 | `member_status.publish_state = 'public'` |
| member が削除されていない | `member_status.is_deleted = 0` |
| 写真 metadata が存在 | `member_photos.member_id = memberId` |

写真専用 consent カラムは追加しない。admin が公開対象 member に写真を登録した事実を、既存公開同意と公開状態の範囲内での写真公開意図として扱う。

## API 契約

`GET /public/members` と `GET /public/members/:memberId` は、実装サイクルで `photoUrl?: string` を optional field として追加する。写真が無い、R2 secret が無い、presign に失敗した、または公開 gate を満たさない場合は `photoUrl` を省略する。

`photoUrl` は presigned GET URL のみを返す。R2 bucket 名、object key、admin audit payload、内部 storage metadata は public response に含めない。

## Storage / Presign

| 項目 | 契約 |
| --- | --- |
| storage | private R2 binding `MEMBER_PHOTOS` |
| metadata | D1 `member_photos` |
| presign helper | `presignMemberPhotoGetUrl` |
| TTL | `MEMBER_PHOTO_PRESIGN_TTL_SECONDS = 300` |
| list query | `listMemberPhotosByIds` による 1 query batch。N+1 を禁止 |
| R2 read timing | API は presign だけを行う。実 R2 GET は browser の `<img src>` 取得時のみ |

## UI fallback

`photoUrl` が無い、または `<img>` が読めない場合、既存 `Avatar` の hue placeholder に戻す。写真表示は追加価値であり、失敗時に公開一覧・公開プロフィールを 500 にしない。

## User-gated Boundary

staging R2 bucket / secrets、staging deploy、runtime screenshot、commit、push、PR は user-gated。実コード配線（shared zod / repository batch / use-case DI / route presign / web Avatar 配線）と unit test は本実装サイクルで完了済み。staging deploy 後の visual evidence 取得は user-gated。

