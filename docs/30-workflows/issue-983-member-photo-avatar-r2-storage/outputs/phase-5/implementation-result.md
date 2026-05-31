# Phase 5 実装結果（実コード実装の実行記録）

> 本 workflow の index.md は「spec 作成のみ」と記載しているが、ユーザー依頼（コード実装プロンプト / CONST_006）に
> 従い、**目的達成にはコード変更が必須**（storage/API/D1/shared/UI の垂直スライス）と判断し、実コードを実装した。
> Phase 4 の RED spec を作成し、Phase 5 実装で全て GREEN に収束させた。

実行日: 2026-05-29 / ブランチ: HEAD（`feat/issue-983-member-photo-avatar-r2-storage` 相当の worktree）

---

## 1. 実装した変更（実コード）

### 新規作成
| パス | 種別 |
|------|------|
| `apps/api/migrations/0022_member_photos.sql` | D1 migration（admin-managed `member_photos` 表） |
| `apps/api/src/lib/r2/member-photo-presign.ts` | R2 SigV4 presign util + 定数（object key / max bytes / allowed MIME / TTL） |
| `apps/api/src/lib/r2/__tests__/member-photo-presign.spec.ts` | presign unit（PRESIGN-U-1..8 / E-1..3 + 定数） |
| `apps/api/src/repository/memberPhotos.ts` | `member_photos` CRUD repository |
| `apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts` | route contract（ROUTE-C-1..10 / E-1..12 相当 18 ケース） |
| `packages/shared/src/zod/__tests__/viewmodel-photo.spec.ts` | schema parse（SCHEMA-P-1..5 / E-1..3） |
| `apps/web/src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx` | Avatar/MemberAvatar render（AVATAR-R-1..6 / E-1..4） |

### 編集
| パス | 変更概要 |
|------|---------|
| `apps/api/src/env.ts` | `MEMBER_PHOTOS?: R2Bucket` + presign secret 3 件（`R2_ACCOUNT_ID/ACCESS_KEY_ID/SECRET_ACCESS_KEY`） |
| `apps/api/src/routes/admin/_shared.ts` | `AdminRouteEnv` に R2 binding + presign secret を追加 |
| `apps/api/src/routes/admin/members.ts` | `POST/DELETE /members/:id/photo` 追加 + `GET /members/:id` を photoUrl 後段マージに拡張 + `resolvePhotoUrl` helper |
| `apps/api/wrangler.toml` | staging/production に `[[r2_buckets]] binding="MEMBER_PHOTOS"` |
| `apps/api/package.json` | `aws4fetch@1.0.20` 依存追加 |
| `apps/api/.dev.vars.example` | R2 presign secret の `op://` 参照（実値なし） |
| `apps/api/src/repository/__tests__/_setup.ts` | truncate TABLES に `member_photos` 追加 |
| `packages/shared/src/zod/viewmodel.ts` | `AdminMemberDetailViewZ.photoUrl: z.string().url().optional()`（`.strict()` 維持） |
| `packages/shared/src/types/viewmodel/index.ts` | `AdminMemberDetailView.photoUrl?: string` |
| `apps/web/src/components/ui/Avatar.tsx` | `src?` 対応・`<img>` + `onError` hue fallback（client component 化） |
| `apps/web/src/features/admin/components/_members/MemberAvatar.tsx` | `photoUrl?` prop → `Avatar src` 配線 |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | `MemberAvatar photoUrl` + `PhotoUploadAffordance`（`useAdminMutation` 経由 upload/delete） |
| `apps/web/src/styles/globals.css` | `.ui-avatar--photo` / `.ui-avatar__photo`（OKLch token・HEX 直書きなし） |

---

## 2. 検証結果（ローカル実行コマンド）

| コマンド | 結果 |
|---------|------|
| `pnpm install` | OK（aws4fetch 反映） |
| `pnpm --filter @ubm-hyogo/shared build` | Done |
| `pnpm typecheck` | 全 6 package Done（`exactOptionalPropertyTypes` 対応含む） |
| `pnpm lint` | exit 0（warning は既存 `PublicConsentCallout` のみ・本タスク無関係） |
| presign unit | 17 PASS |
| shared schema | 11 PASS |
| Avatar render | 10 PASS |
| route contract（D1 config） | 18 PASS |
| 回帰: MemberDrawer / primitives / builder / members.repository | 30 + 7 = 67 PASS（全 green） |

### AC 達成状況
- AC-2: `AdminMemberDetailViewZ.photoUrl?` 追加・`.strict()` 維持・既存 parse 非破壊 → SCHEMA-P-1..5 GREEN ✅
- AC-3: photoUrl 有→`<img>` / 未取得・onError→hue placeholder → AVATAR-R-2/R-3/R-5/R-6 GREEN ✅
- AC-4: src 無/失敗時は現行 DOM（`data-hue`/`data-size`）維持 → AVATAR-R-1/R-4/E-2 GREEN ✅
- AC-5: R2 アクセスは presigned URL のみ（util は SigV4 query 署名・public list 非使用） ✅
- AC-6: upload は admin endpoint・MIME(jpeg/png/webp)+256KB 検証・audit `photo_uploaded`/`photo_deleted` → ROUTE-C-1..5/E-7/E-8 GREEN ✅
- AC-7: `apps/web` は presignedUrl を受け取るのみ・R2/D1 直アクセスなし（presign/repo は `apps/api` 内） ✅

---

## 3. user-gated runtime ops（Phase 11 / VISUAL_ON_EXECUTION）

以下はコード実装後にユーザー承認を得てから実行する runtime 操作。実 R2 bucket / scoped token が無い状態では
avatar の写真↔placeholder 切替の実画面スクリーンショットは撮影できないため、Phase 11 の visual evidence は
`VISUAL_ON_EXECUTION` として runtime gate 承認後に取得する。

```bash
# R2 bucket 作成
bash scripts/cf.sh r2 bucket create ubm-hyogo-member-photos-staging
bash scripts/cf.sh r2 bucket create ubm-hyogo-member-photos-prod

# presign 用 scoped token（Object Read and Write・対象 bucket 限定）を 1Password 保管後
bash scripts/cf.sh secret put R2_ACCOUNT_ID --env staging       # 他 2 secret も同様
bash scripts/cf.sh secret put R2_ACCOUNT_ID --env production
```

> bucket / secret は CLAUDE.md のシークレット運用ルールに従い、実値は 1Password / Cloudflare Secrets に保管し、
> リポジトリには `op://` 参照のみを記す（`.dev.vars.example` 反映済み）。

---

## 4. 別タスク化（CONST_009 例外・index.md スコープ準拠）

今回サイクルで完了したのは「admin upload + R2 presign + drawer avatar」の垂直スライス（機能完結）。
以下は **認証境界・公開ポリシー・外部サービス依存という独立関心**のため今回スコープ外（index.md §2 準拠）:
一般 member 自身の photo upload / `/(public)/members/[id]` での photo 表示 / 画像 transcode・resize。
これらは将来 followup（Phase 12 unassigned-task-detection 参照）。
