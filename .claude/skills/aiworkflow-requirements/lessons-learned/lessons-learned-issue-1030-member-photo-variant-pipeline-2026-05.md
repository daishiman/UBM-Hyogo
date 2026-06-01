# Lessons Learned: issue-1030 member photo transcode/resize variant pipeline

state: `implementation_reviewed_local / implementation / VISUAL_ON_EXECUTION`

> 親 #983（member photo avatar R2 storage）の followup-003。無料枠 invariant 下で「fullsize 単一配信の非効率」を client-side Canvas variant pipeline で解消した実装の知見。

## L-I1030-001: 無料枠 invariant では server-side 画像処理を却下し client-side Canvas resize を根本解にする
- **状況**: 原 issue の 3 方式 ADR（Cloudflare Images / Workers transform / client-side pre-resize）のうち、Cloudflare Images・Image Resizing はいずれも有料。本プロジェクトは `docs/00-getting-started-manual/specs/08-free-database.md` の無料枠 invariant を持つ。
- **教訓**: 「画像処理方式の選択」ではなく「無料枠と後方互換を守る variant contract」と問題を再定義する。admin ブラウザの `<canvas>` で display(≤512px long-edge) + thumb(96×96 cover) を webp 生成し、サーバは検証して両 key を R2 put するだけにする。サーバ/外部の有料処理をゼロにし、invariant #5（D1/R2 アクセスは `apps/api` に閉じる）も `apps/web` が presigned URL 経由で multipart 送信する設計で維持できる。

## L-I1030-002: storage 拡張は ADD COLUMN のみ + 旧経路を original_fallback で受理し非破壊にする
- **状況**: 既存 `member_photos`（#983 / migration 0022）には variant メタ列がない。既存行・既存 single-file upload client を壊さず variant を足す必要がある。
- **教訓**: migration 0023 は `thumb_object_key TEXT` / `thumb_byte_size INTEGER` / `content_hash TEXT` / `processing_status TEXT NOT NULL DEFAULT 'none'` の **ADD COLUMN のみ**（既存行非破壊）。POST route は新 multipart（display 必須 + thumb 任意 + contentHash 任意）と旧 single `file` upload の両方を受理し、旧経路は `processing_status='original_fallback'` で 200 を維持する。「後方互換テーブル」（既存 R2 key 維持 / 新列 nullable / 旧 client 受理）に集約すると storage 拡張系タスクで再利用しやすい。

## L-I1030-003: 新規 repository spec の vitest hook timeout は明示的に延長する
- **状況**: 新規 `apps/api/src/repository/__tests__/memberPhotos.spec.ts` を追加したところ、初回実行で hook timeout により fail した。
- **教訓**: D1 マイグレーション適用を伴う repository spec は beforeAll/beforeEach の hook が重く、デフォルト timeout を超えうる。新規 repo spec の hook timeout を 60s に補正して green 化する。実装区分が「実装仕様書」でも、実コードを書いた時点でこの runtime チューニングは spec 上の見込みでなく実測で確定する。

## L-I1030-004: D1 route contract spec は root unit config では拾われず専用 config で実行する
- **状況**: `apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts` を追記したが、root の unit vitest config では exclude されており 0 件扱いになった。
- **教訓**: D1 binding を使う route contract spec は `vitest.d1.config.ts` で実行する（`pnpm exec vitest run --config=vitest.d1.config.ts <spec>`）。root unit run と D1 run は対象が分かれているため、photo route の検証は 2 系統（unit 39 tests + D1 contract 31 tests）を両方走らせて初めて green を主張できる。

## L-I1030-005: shared viewmodel の optional 追加は `.strict()` 維持、Avatar は size 別 src 選択で後方互換
- **状況**: MemberDetail viewmodel に thumb URL を足すと `.strict()` を壊しかねず、`photoThumbUrl` を持たない既存 consumer も壊しうる。
- **教訓**: `packages/shared/src/zod/viewmodel.ts` に `photoThumbUrl: z.string().url().optional()` を追加し `.strict()` を維持。types 側は `readonly photoThumbUrl?: string`。`MemberAvatar` は `photoThumbUrl?` prop を受け、size（sm/md は thumb、lg は display）で src を選択し、thumb 不在時は display → placeholder の 3 段 fallback に退避する。optional + fallback で旧データ・旧 props を非破壊に保つ。

## L-I1030-006: content_hash は記録のみ・R2 dedup は過剰設計として除外する
- **状況**: content hash を記録すると「同一画像なら R2 put skip（dedup）」を実装したくなる。
- **教訓**: 本タスクの受入条件は hash 記録で機能完結する。dedup を入れると R2 削除・audit・同一画像共有時の所有境界が増えて過剰設計になる。`content_hash` は記録に留め、dedup は未タスク候補（M-1）として **not now** 判定にする。retina 2x variant も over-scope として不採用。価値（64KB thumb による帯域削減）に直結しない拡張は同サイクルに入れない。

## L-I1030-007（workflow 教訓）: implementation_reviewed_local は親と同階層に置き、completed-tasks 移動を mover で先走らせない
- **状況**: 検証中に mover 系操作で workflow dir が `docs/30-workflows/completed-tasks/issue-1030-.../` へ移動し、artifacts.json の evidence_path・skill 索引（resource-map / quick-reference / task-workflow-active / inventory / changelog）が一斉に completed-tasks パスへ書き換わった。dir を戻すと内容だけが completed-tasks を指す path drift が残った。
- **教訓**: completed-tasks 移動は user-gated な close-out 動作。親 #983 が `docs/30-workflows/issue-983-.../`（非 completed-tasks）にある間は、followup の #1030 も同階層に置く。「実装をスキルに反映」フェーズで mover を走らせない。万一移動した場合は `completed-tasks/issue-1030-member-photo` → `issue-1030-member-photo` の冪等置換で dir 実体に全参照を合わせ直す。

## L-I1030-008（gate 教訓）: gate-metadata の Gate status enum は pending/passed/failed/waived のみ
- **状況**: Gate-B を `passed_local` と記録したところ `gate-metadata:validate` が `schema: 1.status — Invalid option: expected one of "pending"|"passed"|"failed"|"waived"` で ERROR を出した（`1` = gates 配列 index 1 = Gate-B）。
- **教訓**: `metadata.gates[].status` は enum `pending`/`passed`/`failed`/`waived` のみ。local nuance（passed_local 等）は `status` でなく `notes` に書き、`status` は `passed` に正規化する。top-level の `status`/`workflow_state`（`implementation_reviewed_local` 等）は別系統で enum 制約外。

## 定数（実装正本）

| 項目 | 値 | 出典 |
|---|---|---|
| display object key | `members/{memberId}/avatar`（#983 から維持） | `MEMBER_PHOTO_OBJECT_KEY` |
| thumb object key | `members/{memberId}/thumb` | `MEMBER_PHOTO_THUMB_OBJECT_KEY` |
| display max size | `256 * 1024` bytes | `MEMBER_PHOTO_MAX_BYTES` |
| thumb max size | `64 * 1024` bytes | `MEMBER_PHOTO_THUMB_MAX_BYTES` |
| display long-edge | `512` px fit | `image-resize.ts` |
| thumb | `96 × 96` cover crop | `image-resize.ts` |
| format / quality | webp @ 0.82 | `image-resize.ts` |
| MIME allowlist | `image/jpeg`, `image/png`, `image/webp` | route 検証 |
| presign TTL | `300` 秒 | `member-photo-presign.ts` |

## 関連実装ファイル

- `apps/api/migrations/0023_member_photos_variants.sql`
- `apps/api/src/lib/r2/member-photo-presign.ts`（thumb key / max bytes / variant 型）
- `apps/api/src/repository/memberPhotos.ts`（variant メタ列）
- `apps/api/src/routes/admin/members.ts`（multipart display/thumb 受領・両 key put・DELETE 両 key）
- `packages/shared/src/zod/viewmodel.ts`, `packages/shared/src/types/viewmodel/index.ts`（`photoThumbUrl?`）
- `apps/web/src/lib/admin/image-resize.ts`（`buildMemberPhotoVariants`）
- `apps/web/src/features/admin/components/_members/{MemberAvatar,MemberDrawer}.tsx`
