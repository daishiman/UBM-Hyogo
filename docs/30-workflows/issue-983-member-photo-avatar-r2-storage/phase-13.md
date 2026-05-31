# Phase 13: PR 作成

> **[実装区分: 実装仕様書]**

> **ユーザーの明示承認後のみ実施する。**
> 本 Phase（commit / push / `gh pr create`）は実装サイクル（Phase 4-12）完了後、
> ユーザーが「PR を出してください」と指示した時点で実行する。
> spec_created 段階での先行実行は禁止。

---

## 13.1 PR 基本情報

| 項目 | 値 |
|------|-----|
| base ブランチ | `dev` |
| 作業ブランチ | `feat/issue-983-member-photo-avatar-r2-storage` |
| PR タイトル | `feat(member-photo): R2-backed avatar upload + admin drawer affordance` |
| 関連 Issue | #983（CLOSED。PR 文脈は `Refs #983` のみ） |

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

# 6. PR 対象ファイル一覧確認
git diff dev...HEAD --name-only
```

> 品質検証失敗時は最大 3 回自動修復し、修復差分を新規 commit でまとめる（`--amend` 禁止）。

---

## 13.3 Phase 11 screenshot の PR 本文反映ルール

- `outputs/phase-11/screenshots/` に png が存在する場合 → PR 本文の **Phase 11 Evidence** セクションに canonical 名を列挙。
- 実機撮影済みの場合は `![member-avatar-photo](outputs/phase-11/screenshots/member-avatar-photo.png)` 形式で参照。
- screenshot がない場合（VISUAL_ON_EXECUTION 未撮影）はセクション全体を省略する（空セクションを残さない）。

---

## 13.4 PR 本文テンプレート

```markdown
## Summary

- `member_photos` D1 table (migration 0022) と R2 `MEMBER_PHOTOS` binding を追加し、admin-managed photo storage contract を確立（Issue #983 AC-1）
- `POST/DELETE /admin/members/:memberId/photo` endpoint（MIME/サイズ検証 + audit log）を追加
- `GET /admin/members/:memberId` に presigned `photoUrl?` を fail-soft で同梱（AC-2 / AC-5）
- `Avatar` primitive に `src?` + `<img>` + `onError` hue fallback を追加（AC-3 / AC-4）
- `MemberDrawer` に upload/delete affordance を追加（`useAdminMutation` 経由、AC-6）

## 受入条件（AC 照合）

| AC | 内容 | 確認方法 |
|----|------|---------|
| AC-1 | storage contract が specs に明文化 | `docs/.../specs/08-free-database.md` または `specs/15-member-photo-storage.md` 追記 |
| AC-2 | `AdminMemberDetailViewZ.photoUrl?` 追加・.strict() 維持 | `pnpm typecheck` green |
| AC-3 | photoUrl 有 → `<img>`, 無/onError → hue | `MemberAvatar.spec.tsx` |
| AC-4 | 写真未登録 avatar は現行と pixel diff ゼロ | Playwright visual baseline |
| AC-5 | R2 アクセスは presigned URL のみ | route contract spec + grep gate |
| AC-6 | upload は admin 限定 + MIME/サイズ検証 + audit | `member-photo.contract.spec.ts` |
| AC-7 | `apps/web` から R2/D1 直アクセスなし | Phase 9 grep gate |

## テスト計画

- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test -- member-photo`（presign unit + route contract）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberAvatar`（avatar render spec）
- [ ] `mise exec -- pnpm typecheck && mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm build`
- [ ] `bash scripts/verify-pr-ready.sh`
- [ ] staging deploy 後: `curl` で `photoUrl` 存在確認（user-gated）
- [ ] staging での MemberDrawer upload → avatar 切替確認（user-gated）

## Phase 11 Evidence

<!-- 実装サイクルで screenshot 撮影後、ここに canonical 名を列挙 -->
<!-- 撮影前は本セクション全体を削除する -->

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 13.5 runtime ops 手順（PR マージ前後の user-gated runbook）

> **以下の操作はすべてユーザー承認後のみ実施する。**

### PRマージ前（staging 検証）

```bash
# 1. R2 bucket 作成（staging）
#    Cloudflare Dashboard または wrangler 経由で作成:
#    bucket 名: ubm-hyogo-member-photos-staging
#    region: 自動（WNAM）/ public access: 無効

# 2. secret 投入（staging）
bash scripts/cf.sh secret put R2_ACCOUNT_ID --env staging
bash scripts/cf.sh secret put R2_ACCESS_KEY_ID --env staging
bash scripts/cf.sh secret put R2_SECRET_ACCESS_KEY --env staging
# 値は 1Password から取得。.env には op://Vault/R2/... 参照のみ記載

# 3. staging deploy（api）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# 4. D1 migration 適用（staging）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging

# 5. 動作確認
curl -H "Cookie: ..." \
  "https://ubm-hyogo-api-staging.daishimanju.workers.dev/admin/members/{testMemberId}" \
  | jq '{photoUrl}'
# → photoUrl: null (まだ写真未登録) または presigned URL

# 6. staging web deploy
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging

# 7. staging での UI 手動確認（Phase 11 チェックリスト実施）
```

### PRマージ後（production 反映）

```bash
# 1. R2 bucket 作成（production）
#    bucket 名: ubm-hyogo-member-photos-prod
#    public access: 無効

# 2. secret 投入（production）
bash scripts/cf.sh secret put R2_ACCOUNT_ID --env production
bash scripts/cf.sh secret put R2_ACCESS_KEY_ID --env production
bash scripts/cf.sh secret put R2_SECRET_ACCESS_KEY --env production

# 3. production deploy（api）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production

# 4. D1 migration 適用（production）
#    適用前に必ず backup を取得する
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production \
  --output backup-before-0022-$(date +%Y%m%d).sql

bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production

# 5. production web deploy
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

### ロールバック手順（問題発生時）

```bash
# api のみロールバック（web はそのまま。photoUrl が null に戻るだけで壊れない）
bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production
# VERSION_ID は deploy 直後の wrangler tail / dashboard で確認

# D1 ロールバックは不可（migration は不可逆）
# member_photos 表が空の状態では既存 UI に影響なし（fail-soft 設計）
```

---

## 13.6 Issue #983 との関係

- PR 作成時点で Issue #983 は **CLOSED 維持**とし、PR 文脈は `Refs #983` のみとする。
- PR 本文の最後に `Related to #983` を記載（`Closes #983` は使わない）。
- Issue #983 は CLOSED 維持。再オープンやコメント追加はユーザー明示指示後のみ行う。
- PR 本文や commit message では `Closes #983` を使わず、`Refs #983` のみを使う。

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
- [ ] PR 本文に `implementation-guide.md` の主要内容が反映されている
- [ ] Phase 11 screenshot が存在する場合は PR 本文に参照が含まれている
- [ ] Issue #983 が `Related to #983`（close しない）でリンクされている
- [ ] staging runtime ops（bucket 作成 / secret 投入 / D1 migration / deploy）はユーザー承認後のみ実施している
- [ ] production runtime ops は PR マージ後にユーザー承認を得てから実施している

## メタ情報
workflow_state: `spec_created` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
実装・検証完了後、ユーザー承認を得て commit、push、PR、Issue 連携を行う。

## 実行タスク
- PR 前チェックを実行する。
- ユーザー承認後に commit、push、PR 作成を行う。

## 参照資料
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`

## 成果物
- Phase 13 PR runbook
