# Phase 13: PR 作成

> **[実装区分: 実装仕様書]**

> **ユーザーの明示承認後のみ実施する。**
> 本 Phase（commit / push / `gh pr create`）は実装サイクル（Phase 4-12）完了後、
> ユーザーが「PR を出してください」と指示した時点で実行する。
> spec_created 段階での先行実行は禁止。
> **Issue #1031 は CLOSED のまま維持する。`Closes #1031` は使わない。**

---

## 13.1 PR 基本情報

| 項目 | 値 |
|------|-----|
| base ブランチ | `dev` |
| 作業ブランチ | `feat/issue-1031-member-self-photo-upload` |
| PR タイトル | `feat(member-photo): self-upload/delete + migration 0023 source column` |
| 関連 Issue | #1031（**CLOSED 実状態・mutation なし**。PR 文脈は `Refs #1031` のみ。`Closes #1031` 使用禁止） |
| 親 Issue | #983（参照のみ。`Related to #983`） |

---

## 13.2 PR 作成前チェックリスト

```bash
# 1. 未コミット変更がないこと
git status --porcelain

# 2. typecheck
mise exec -- pnpm typecheck

# 3. lint
mise exec -- pnpm lint

# 4. build
mise exec -- pnpm build

# 5. verify-pr-ready（Phase 12 compliance / gate-metadata / indexes drift 一括確認）
bash scripts/verify-pr-ready.sh

# 6. test suffix 確認（*.test.{ts,tsx} が存在しないこと）
find apps/ packages/ -name "*.test.ts" -o -name "*.test.tsx" | head -5

# 7. design token 確認（HEX 直書きが無いこと）
grep -rn "bg-\[#\|text-\[#\|#[0-9a-fA-F]\{3,6\}" apps/web/app/\(member\)/profile/_components/PhotoUpload.client.tsx

# 8. PR 対象ファイル一覧確認
git diff dev...HEAD --name-only
```

> 品質検証失敗時は最大 3 回自動修復し、修復差分を新規 commit でまとめる（`--amend` 禁止）。

---

## 13.3 Phase 11 screenshot の PR 本文反映ルール

- `outputs/phase-11/screenshots/` に png が存在する場合 → PR 本文の **Phase 11 Evidence** セクションに canonical 名を列挙。
- 実機撮影済みの場合は `![member-photo-upload-empty](outputs/phase-11/screenshots/member-photo-upload-empty.png)` 形式で参照。
- screenshot がない場合（VISUAL_ON_EXECUTION 未撮影）はセクション全体を省略する（空セクションを残さない）。

---

## 13.4 PR 本文テンプレート

```markdown
## Summary

- D1 migration `0023_member_photos_source.sql` を additive 追加（`source TEXT NOT NULL DEFAULT 'admin'`）。既存行は DEFAULT で backfill（Issue #1031 AC-3/AC-4）
- `POST /me/photo` / `DELETE /me/photo` endpoint 追加（sessionGuard + requireRulesConsent + rateLimitSelfRequest + own-only mutation。path に memberId を出さない）（AC-1/AC-2/AC-7/AC-8）
- `GET /me/profile` 拡張（presigned `photoUrl?` を fail-soft で同梱）（AC-5）
- `PhotoUpload.client.tsx` を profile ページに追加（avatar 表示 + file 選択 + upload/delete + 状態機械 + a11y）（AC-1）
- 既存定数（`MEMBER_PHOTO_OBJECT_KEY` / `MEMBER_PHOTO_MAX_BYTES` / `MEMBER_PHOTO_ALLOWED_MIME`）を再利用し single avatar slot last-write-wins を維持（AC-4/AC-5/AC-6）

## 受入条件（AC 照合）

| AC | 内容 | 確認方法 |
|----|------|---------|
| AC-1 | profile から upload/delete 操作可能 | `PhotoUpload.client.component.spec.tsx` PASS |
| AC-2 | own profile のみ mutation（未認証 401・他 member への書き込み不可） | `photo.route.spec.ts` PASS |
| AC-3 | `uploaded_by` + `source` の監査情報 | `memberPhotos.source.spec.ts` PASS |
| AC-4 | 優先順位: last-write-wins 仕様化済み | Phase 2 §2.4 + `INSERT OR REPLACE` |
| AC-5 | object key / presign TTL が #983 と互換（既存定数再利用） | `grep MEMBER_PHOTO_OBJECT_KEY` |
| AC-6 | MIME / 256KB server 検証 | `photo.route.spec.ts`（415/413 ケース） |
| AC-7 | upload は `requireRulesConsent` 必須 | `photo.route.spec.ts`（403 ケース） |
| AC-8 | `rateLimitSelfRequest` 適用 | middleware chain 確認 |
| AC-9 | 写真未登録時の pixel diff ゼロ | Playwright visual baseline |

## 変更概要

### apps/api
- `migrations/0023_member_photos_source.sql` 新規（additive）
- `repository/memberPhotos.ts` 拡張（`source` 列）
- `routes/admin/members.ts` 編集（upsert に `source: "admin"` 明示）
- `routes/me/index.ts` 編集（`POST /me/photo` / `DELETE /me/photo` / `GET /me/profile` 拡張）
- `routes/me/schemas.ts` 編集（`MeProfileResponseZ.photoUrl?` / `MePhotoUploadAcceptedZ`）

### apps/web
- `app/api/me/photo/route.ts` 新規（proxy）
- `src/lib/api/me-photo-client.ts` 新規
- `app/(member)/profile/_components/PhotoUpload.client.tsx` 新規
- `app/(member)/profile/page.tsx` 編集（PhotoUpload mount）
- `src/lib/api/me-types.ts` 編集（`photoUrl?`）

### docs
- `specs/08-free-database.md` 更新（`member_photos.source` 追記）
- `specs/01-api-schema.md` または `specs/02-auth.md` 更新（`/me/photo` endpoint 追記）

## D1 migration 0023 の apply 手順（user-gated）

```bash
# staging（PR マージ前の動作確認）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging

# production（PR マージ後・deploy 前）
# 適用前に必ず backup を取得する
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production \
  --output backup-before-0023-$(date +%Y%m%d).sql
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

> migration 0023 は additive（`ADD COLUMN ... DEFAULT 'admin'`）のため非破壊。既存行は DEFAULT で自動 backfill。

## R2 bucket / secret（user-gated）

- R2 bucket: #983 で `ubm-hyogo-member-photos-staging` / `ubm-hyogo-member-photos-prod` が作成済みであることを確認（未作成の場合は `bash scripts/cf.sh` 経由で作成）
- presign secret（`R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`）: #983 で投入済みの場合は継続利用。`/me` route が admin route と同じ env binding を参照するため追加投入不要のはず（staging deploy 後に `GET /me/profile` の `photoUrl` を確認）

## テスト計画

- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test -- me/photo memberPhotos`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test -- PhotoUpload me/photo`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/shared test -- viewmodel`
- [ ] `mise exec -- pnpm typecheck && mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm build`
- [ ] `bash scripts/verify-pr-ready.sh`
- [ ] staging deploy 後: `curl` で `GET /me/profile` の `photoUrl` 存在確認（user-gated）
- [ ] staging での profile ページ upload → avatar 切替確認（user-gated）

<!-- Phase 11 screenshots が存在する場合は以下のセクションを有効化する。撮影前は削除する。 -->
<!-- ## Phase 11 Evidence
  member-photo-upload-empty.png / member-photo-upload-selected.png / member-photo-uploaded.png /
  member-photo-delete-confirm.png / member-photo-upload-loading.png / member-photo-upload-error.png -->

Refs #1031
Related to #983

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 13.5 runtime ops 手順（PR マージ前後の user-gated runbook）

> **以下の操作はすべてユーザー承認後のみ実施する。**

### PR マージ前（staging 検証）

```bash
# 1. R2 bucket 確認（#983 で作成済みの場合は継続利用）
#    bucket 名: ubm-hyogo-member-photos-staging
#    未作成の場合: Cloudflare Dashboard または bash scripts/cf.sh 経由で作成

# 2. presign secret 確認（staging）
#    #983 で投入済みの場合は追加投入不要
#    未投入の場合:
bash scripts/cf.sh secret put R2_ACCOUNT_ID --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put R2_ACCESS_KEY_ID --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put R2_SECRET_ACCESS_KEY --config apps/api/wrangler.toml --env staging

# 3. D1 migration 0023 適用（staging）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging

# 4. staging deploy（api）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# 5. 動作確認（authenticated member session）
curl -H "Cookie: ..." \
  "https://ubm-hyogo-api-staging.daishimanju.workers.dev/me/profile" \
  | jq '{photoUrl}'
# → photoUrl: null（写真未登録）または presigned URL

# 6. staging web deploy
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging

# 7. staging での UI 手動確認（Phase 11 チェックリスト実施）
```

### PR マージ後（production 反映）

```bash
# 1. R2 bucket 確認（production）
#    bucket 名: ubm-hyogo-member-photos-prod
#    #983 で作成済みであることを確認。未作成の場合は作成

# 2. presign secret 確認（production）
#    #983 で投入済みの場合は追加投入不要
#    未投入の場合:
bash scripts/cf.sh secret put R2_ACCOUNT_ID --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret put R2_ACCESS_KEY_ID --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret put R2_SECRET_ACCESS_KEY --config apps/api/wrangler.toml --env production

# 3. D1 migration 0023 適用（production）
#    適用前に必ず backup を取得する
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production \
  --output backup-before-0023-$(date +%Y%m%d).sql
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production

# 4. production deploy（api）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production

# 5. production web deploy
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

### ロールバック手順（問題発生時）

```bash
# api のみロールバック（web はそのまま。photoUrl が null に戻るだけで壊れない）
bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production
# VERSION_ID は deploy 直後の wrangler tail / dashboard で確認

# D1 ロールバックは不可（migration は不可逆）
# member_photos.source 列は additive であり、既存行に影響しない。
# source 列が存在しても admin route / GET は fail-soft 設計のため問題なし。
```

---

## 13.6 Issue #1031 との関係

- PR 作成時点で Issue #1031 は **CLOSED 実状態・mutation なし**とし、PR 文脈は `Refs #1031` のみとする。
- PR 本文の最後に `Related to #983` を記載（親 issue との関係を文書化）。
- Issue #1031 は CLOSED 維持。再クローズやコメント追加はユーザー明示指示後のみ行う。
- PR 本文や commit message では `Closes #1031` を使わず、`Refs #1031` のみを使う。

---

## 13.7 CI ゲート一覧

| Gate | Job 名 |
|------|--------|
| 型チェック | `typecheck` |
| lint | `lint` |
| テスト suffix 検証 | `verify-test-suffix`（`*.test.*` が無いこと） |
| design token 検証 | `verify-design-tokens`（HEX 直書きが無いこと） |
| Phase 12 compliance | `verify-phase12-compliance` |
| indexes drift | `verify-indexes-up-to-date` |

---

## 完了条件（Phase 13）

- [ ] `git status --porcelain` が空（全変更がコミット済み）
- [ ] `git diff dev...HEAD --name-only` で PR 含有ファイル一覧を確認済み
- [ ] `bash scripts/verify-pr-ready.sh` が PASS
- [ ] `gh pr create --base dev` が成功し PR URL が発行されている
- [ ] PR 本文に `implementation-guide.md` の主要内容（変更概要・AC 対応表・migration 0023 の apply 手順）が反映されている
- [ ] R2 bucket / secret の user-gated 注記が PR 本文に含まれている
- [ ] Phase 11 screenshot が存在する場合は PR 本文に参照が含まれている（存在しない場合はセクション削除済み）
- [ ] Issue #1031 が `Refs #1031`（CLOSED 実状態・mutation なし・close しない）でリンクされている
- [ ] staging runtime ops（D1 migration 0023 apply / R2 確認 / secret 確認 / deploy）はユーザー承認後のみ実施している
- [ ] production runtime ops は PR マージ後にユーザー承認を得てから実施している

## メタ情報
workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL`

## 目的
実装・検証完了後、ユーザー承認を得て commit、push、PR を作成する。Issue #1031 は CLOSED のまま維持する。

## 実行タスク
- PR 前チェックを実行する。
- ユーザー承認後に commit、push、PR 作成を行う。

## 参照資料
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`

## 成果物
- Phase 13 PR runbook
