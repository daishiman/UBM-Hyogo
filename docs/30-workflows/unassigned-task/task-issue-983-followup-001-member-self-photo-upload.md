# Member self photo upload and identity confirmation - タスク指示書

## メタ情報

```yaml
issue_number: 1031
task_id: task-issue-983-followup-001-member-self-photo-upload
task_name: Member self photo upload and identity confirmation
category: 改善
target_feature: member profile photo self-upload
priority: 中
scale: 中規模
status: 未実施
source_phase: issue-983 Phase 12 unassigned-task-detection
created_date: 2026-05-29
dependencies: [issue-983-member-photo-avatar-r2-storage]
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-983-followup-001-member-self-photo-upload |
| タスク名 | Member self photo upload and identity confirmation |
| 分類 | 改善 |
| 対象機能 | member profile photo self-upload |
| 優先度 | 中 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/phase-12/unassigned-task-detection.md` |
| 関連 Issue | #983 |

---

## 1. なぜこのタスクが必要か

Issue #983 では admin-managed photo を D1 `member_photos` metadata、R2 private object、短期 `photoUrl` で実装した。Phase 12 implementation guide は「Google Form は写真を収集しないため、最小の完結設計は管理者が写真を登録する」ことを正本化している。

一方、member 本人による写真アップロードは、本人確認 UX、認証境界、既存 admin-managed photo との競合解決が別関心であるため Issue #983 の MVP から外した。本人が自分の写真を更新できない状態を長期化すると、管理者代行運用に依存し、写真の鮮度と本人同意の追跡が弱くなる。

## 2. 何を達成するか

member profile から本人が自分の写真をアップロード、差し替え、削除できる経路を設計・実装する。既存の `member_photos` / R2 / presigned URL 方針を再利用し、admin upload と member self-upload の所有者・監査ログ・競合ルールを明確化する。

### 受け入れ基準

- `/(member)/profile` から本人写真の upload/delete ができる
- API は認証済み member の own profile だけを mutation でき、他 memberId への書き込みを拒否する
- `member_photos` に `uploaded_by` または同等の監査情報が残る
- admin-managed photo と member self-upload photo の優先順位が仕様化されている
- R2 object key と presign TTL は Issue #983 の `members/{memberId}/avatar` / 300 seconds 方針との互換性を崩さない
- upload MIME は `image/jpeg`, `image/png`, `image/webp`、上限は Issue #983 の 256KB を基準に再評価する

## 3. 実行方針

1. Phase 1 で Issue #983 の implementation guide と `member_photos` migration を確認し、既存 contract を baseline にする
2. Phase 2 で admin upload と member self-upload の競合ルールを ADR 化する
3. Phase 4-6 で API route contract、repository、shared schema、member profile UI の focused tests を追加する
4. Phase 11 で本人 upload / delete / img error fallback の visual evidence を取得する
5. Phase 12 で aiworkflow-requirements に member self-upload boundary を同期する

## 苦戦箇所【記入必須】

- 対象: `apps/api/src/routes/admin/members.ts` と今後追加する member profile photo route
- 症状: Issue #983 では admin route が `memberId` を明示して R2/D1 を更新する設計だったが、self-upload は session の member identity と URL/body の memberId を照合する必要がある。admin route の実装を単純流用すると、本人以外の写真を書ける authorization gap を作りやすい。
- 対象: `apps/api/migrations/0022_member_photos.sql`
- 症状: 既存 migration が admin-managed MVP を前提にしているため、`uploaded_by`、`source`、`consent_at` などを後付けする場合は D1 migration の additive 変更と既存 row backfill の扱いを先に決める必要がある。
- 参照: `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/phase-12/implementation-guide.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 本人以外の member photo mutation を許す | API route は session identity から対象 memberId を解決し、request body の memberId を信用しない |
| admin upload と self-upload の上書き順序が曖昧になる | Phase 2 ADR で source priority と audit action を固定する |
| 既存 `member_photos` migration と互換性を壊す | additive migration のみ許可し、既存 row の default source を `admin` として扱う |
| R2 object key を分岐して orphan object が増える | 既存 `members/{memberId}/avatar` を原則維持し、履歴保存が必要なら別タスク化する |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @repo/api test -- member-photo
mise exec -- pnpm --filter @repo/web test -- profile
```

期待: self-upload route の authorization matrix、MIME/size validation、profile UI state が PASS。

### 統合検証

```bash
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/web typecheck
mise exec -- pnpm --filter @repo/shared test -- viewmodel
```

期待: shared schema と API/web の型契約が同期している。

### Runtime evidence

staging R2 bucket、remote D1 migration、authenticated member session が必要。実行は user approval 後に行い、raw signed URL や cookie は artifact に残さない。

## スコープ

### 含む

- member self-upload API route
- own-profile authorization check
- `member_photos` additive metadata migration
- member profile upload/delete UI
- focused tests and visual evidence

### 含まない

- public member photo display（別タスク `task-issue-983-followup-002-public-member-photo-display.md`）
- image transcode/resize pipeline（別タスク `task-issue-983-followup-003-member-photo-transcode-resize.md`）
- Google Form への写真項目追加（Issue #983 invariant と矛盾するため実施しない）

## 参照

- Issue #983: https://github.com/daishiman/UBM-Hyogo/issues/983
- `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/phase-12/unassigned-task-detection.md`
- `apps/api/migrations/0022_member_photos.sql`
- `apps/api/src/repository/memberPhotos.ts`
- `apps/web/app/(member)/profile/page.tsx`
