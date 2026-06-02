# Phase 8: リファクタリング

> **[実装区分: 実装仕様書]**。Phase 4-7 の TDD・実装・テスト拡充・カバレッジ確認完了後に、重複排除・責務明確化・保守性向上を目的とした最小差分リファクタリングを行う。**新規機能追加・振る舞い変更は禁止。** リファクタリング前後でテストが全件 PASS であることを各変更の受入基準とする。

## 対象変更一覧（FB-RT-03 テーブル形式）

### RT-001 — MIME/size 検証ロジックの重複確認と共通化

| 項目 | 内容 |
|------|------|
| 対象ファイル | `apps/api/src/routes/admin/members.ts`（POST /admin/members/:memberId/photo handler）、`apps/api/src/routes/me/index.ts`（POST /me/photo handler）、`apps/api/src/lib/r2/member-photo-presign.ts` |
| Before | `MEMBER_PHOTO_ALLOWED_MIME.includes(contentType)` と `byteLength > MEMBER_PHOTO_MAX_BYTES` という検証式が admin route と me route の両 handler に直書きされている場合 |
| After | `validateMemberPhotoUpload(contentType: string, byteLength: number): { ok: true } \| { ok: false; status: 413 \| 415 \| 400; message: string }` を `member-photo-presign.ts`（または新規でなく既存の `member-photo-validation.ts`）に切り出し、admin route と me route の両方から import して呼び出す。**ただし、admin route の実装と me route の実装で検証ロジックが実際に重複している場合のみ実施**（重複なし = スキップ） |
| 理由 | admin（issue-983）と self（issue-1031）で同一の検証定数・ロジックを使う設計であり、インライン重複が生じた場合に検証基準の drift を防ぐ。新規ファイルを増やさず `member-photo-presign.ts` 内にヘルパ関数として追加する |
| 確認コマンド | `grep -n "ALLOWED_MIME\|MAX_BYTES\|byteLength" apps/api/src/routes/admin/members.ts apps/api/src/routes/me/index.ts` — 同一インライン比較式が両ファイルにヒットする場合のみ本 RT を実施 |

---

### RT-002 — `resolvePhotoUrl` / `resolveMyPhotoUrl` の共通化検討

| 項目 | 内容 |
|------|------|
| 対象ファイル | `apps/api/src/routes/admin/members.ts`（`resolvePhotoUrl`）、`apps/api/src/routes/me/index.ts`（`resolveMyPhotoUrl` 相当）、`apps/api/src/lib/r2/member-photo-presign.ts` |
| Before | admin route の `resolvePhotoUrl(env, db, memberId)` と me route の `resolveMyPhotoUrl(env, db, memberId)` が実質同一ロジック（`getMemberPhoto` → `presignMemberPhotoGetUrl` → fail-soft null）を持つ場合 |
| After | 共通ロジックを `presignMemberPhotoGetUrl` ラッパーとして `member-photo-presign.ts` に `resolveMemberPhotoUrl(env, db, memberId)` という単一関数にまとめ、admin route と me route の両方から import する。**重複が存在する場合のみ実施。** 存在しない場合は「重複なし・スキップ」を記録する |
| 理由 | Phase 2 §2.6「admin の `resolvePhotoUrl` と同ロジック」を実装で体現したため、実装後に実際に重複があれば集約して保守性を高める。builder は R2 非依存を維持する |
| 確認コマンド | `grep -n "resolvePhotoUrl\|resolveMyPhotoUrl\|getMemberPhoto\|presignMember" apps/api/src/routes/admin/members.ts apps/api/src/routes/me/index.ts` — 同一パターンが両ファイルに存在する場合のみ実施 |

---

### RT-003 — presign 定数の集約確認（重複ゼロの事後検証）

| 項目 | 内容 |
|------|------|
| 対象ファイル | `apps/api/src/lib/r2/member-photo-presign.ts`、`apps/api/src/routes/admin/members.ts`、`apps/api/src/routes/me/index.ts`、各 spec ファイル |
| Before | `MEMBER_PHOTO_OBJECT_KEY`・`MEMBER_PHOTO_MAX_BYTES`・`MEMBER_PHOTO_ALLOWED_MIME` が `member-photo-presign.ts` 以外の場所にインライン定義されている可能性 |
| After | 3 定数は `member-photo-presign.ts` にのみ定義され、admin route・me route・spec は全て import して使用。インライン重複ゼロを確認する |
| 理由 | #983 設計（Phase 2 §6）が定数を presign util に宣言しているが、me route 実装時に再インライン化が起きる可能性への事後確認。重複がなければ「確認のみ（スキップ）」と記録する |
| 確認コマンド | `grep -rn '"members/"' apps/api/src/routes/ apps/api/src/lib/r2/__tests__/` — ヒット 0 件を期待 |

---

### RT-004 — `MeRouteEnv` の presign secret キー名整合（MINOR-1 解消）

| 項目 | 内容 |
|------|------|
| 対象ファイル | `apps/api/src/routes/me/index.ts`（`MeRouteEnv` 型定義）、`apps/api/src/routes/admin/members.ts`（presign secret 参照箇所） |
| Before | Phase 3 MINOR-1：`MeRouteEnv` の presign secret キー名が admin route と一致しているか未確定で実装した場合、キー名不一致でランタイム失敗する可能性がある |
| After | `grep -n "R2_ACCOUNT_ID\|R2_ACCESS_KEY_ID\|R2_SECRET_ACCESS_KEY\|MEMBER_PHOTOS_BUCKET" apps/api/src/routes/admin/members.ts apps/api/src/routes/me/index.ts` でキー名を突合し、不一致があれば me route 側を admin route に合わせる |
| 理由 | 型は合っていてもキー名が違うと runtime で `undefined` になり presign が silent fail（fail-soft で photoUrl 省略のみ）となる。静的検証で防止する |
| 確認コマンド | `grep -n "R2_ACCOUNT_ID\|R2_ACCESS_KEY_ID\|R2_SECRET_ACCESS_KEY\|MEMBER_PHOTOS" apps/api/src/routes/admin/members.ts apps/api/src/routes/me/index.ts` — 同一キー名を使っていることを確認 |

---

### RT-005 — navigation/import drift の除去

| 項目 | 内容 |
|------|------|
| 対象ファイル | `apps/api/src/routes/me/index.ts`、`apps/web/src/lib/api/me-photo-client.ts`、`apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx`、`apps/web/app/api/me/photo/route.ts` |
| Before | Phase 5 実装時に unused import・型アサーション不要化・`as const` 付け忘れ・`any` 型残留等が残っている可能性がある |
| After | `pnpm lint --fix` を実行し自動修正可能な ESLint 違反を解消。残る手動修正が必要な箇所を最小差分で修正する |
| 理由 | Phase 9 の品質ゲート（lint green）を事前に通過させ、Phase 9 での修正ループを回避する |
| 確認コマンド | `pnpm --filter @ubm-hyogo/api lint 2>&1 \| grep "error"` および `pnpm --filter @ubm-hyogo/web lint 2>&1 \| grep "error"` — リファクタリング後にエラー 0 件を確認 |

---

## リファクタリング実施順序

1. RT-003（定数集約確認）→ 重複があれば修正。変更後 `pnpm --filter @ubm-hyogo/api test:unit` PASS を確認。
2. RT-001（MIME/size 検証共通化）→ 重複が実際に存在する場合のみ実施。変更後 `pnpm --filter @ubm-hyogo/api test:unit` PASS を確認。
3. RT-002（resolvePhotoUrl 共通化）→ 重複が実際に存在する場合のみ実施。変更後 `pnpm --filter @ubm-hyogo/api test:unit` PASS を確認。
4. RT-004（presign secret キー名整合）→ キー名不一致があれば修正。変更後 `pnpm --filter @ubm-hyogo/api test:unit` PASS を確認。
5. RT-005（import drift）→ `pnpm lint --fix` で自動修正後、手動修正。

> **注意**: RT-001/RT-002/RT-003 は「重複/drift が実際に存在する場合のみ実施」する条件付き RT。重複が無ければスキップして完了条件チェックリストに「スキップ（重複なし・確認済み）」と記録する。新規ファイルを増やしてはならない場合は既存ファイル内でヘルパ関数として定義する。

---

## リファクタリング禁止事項

- API エンドポイント URL（`/me/photo`・`/admin/members/:memberId/photo`）・引数・レスポンス shape の変更（振る舞い変更）
- D1 schema・R2 object key（`members/{memberId}/avatar`）の変更
- `MeProfileResponseZ`・`MePhotoUploadAcceptedZ` の shape 変更（photoUrl optional 追加以外）
- `MemberPhotoRow.source` の値域（`"admin"` | `"self"`）変更
- テストファイル名の変更（artifact canonical 名 = Phase 1 で確定済み）
- 新規 primitive コンポーネントの追加（不変条件 #8: 既存 Avatar/Button/Modal の再利用のみ）
- audit action 名（`member.photo_uploaded` / `member.photo_deleted`）の変更

---

## 完了条件（Phase 8）

- [ ] RT-003: `MEMBER_PHOTO_OBJECT_KEY`・`MEMBER_PHOTO_MAX_BYTES`・`MEMBER_PHOTO_ALLOWED_MIME` が `member-photo-presign.ts` にのみ定義されており、admin route・me route・テストは import して使用している（または重複なしを確認済みでスキップ記録あり）
- [ ] RT-001: MIME/size 検証が共通化されている（または重複なしを確認済みでスキップ記録あり）
- [ ] RT-002: `resolvePhotoUrl` / `resolveMyPhotoUrl` の同一ロジックが統合されている（または重複なしを確認済みでスキップ記録あり）
- [ ] RT-004: `MeRouteEnv` の presign secret キー名が admin route と一致していることを grep で確認済み
- [ ] RT-005: `pnpm lint` でエラー 0 件
- [ ] 全 RT 実施後に `pnpm typecheck` PASS（全 workspace）
- [ ] 全 RT 実施後に `pnpm --filter @ubm-hyogo/api test:unit` PASS
- [ ] 全 RT 実施後に `pnpm --filter @ubm-hyogo/web test:unit` PASS
- [ ] `*.test.{ts,tsx}` ファイルが増えていない（不変条件 #9）

## メタ情報
workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL`

## 目的
admin route と me route の共通定数・検証ロジック・presign 解決の重複を最小化し、storage/API/UI の境界を保つ。

## 実行タスク
- 定数と validation helper の重複を確認・集約する。
- presign secret キー名の整合を確認する。

## 参照資料
- `phase-5.md`
- `phase-7.md`

## 成果物
- Phase 8 リファクタリング仕様

## 統合テスト連携
Phase 4-7 のテストを維持したまま refactor を完了する。
