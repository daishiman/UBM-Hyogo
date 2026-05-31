# Phase 8: リファクタリング

> **[実装区分: 実装仕様書]**。Phase 4-7 の TDD・実装・テスト拡充・カバレッジ確認完了後に、重複排除・責務明確化・保守性向上を目的とした最小差分リファクタリングを行う。**新規機能追加・振る舞い変更は禁止。** リファクタリング前後でテストが全件 PASS であることを各変更の受入基準とする。

## 対象変更一覧（FB-RT-03 テーブル形式）

### RT-001 — presign 定数を util に集約してルート/テストの重複を排除

| 項目 | 内容 |
|------|------|
| 対象ファイル | `apps/api/src/lib/r2/member-photo-presign.ts`、`apps/api/src/routes/admin/members.ts`、`apps/api/src/lib/r2/__tests__/member-photo-presign.spec.ts`、`apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts` |
| Before | `"members/" + memberId + "/avatar"` というキー生成文字列と `256 * 1024` バイト値・MIME 配列がルート実装とテストに散在する |
| After | `MEMBER_PHOTO_OBJECT_KEY(memberId)`・`MEMBER_PHOTO_MAX_BYTES`・`MEMBER_PHOTO_ALLOWED_MIME` は `member-photo-presign.ts` の export 定数のみに置き、ルートとテストはすべてそこから import する |
| 理由 | Phase 2 §6 で定数を presign util に宣言しているが、実装時にインライン書きが生じる場合に備えた事後集約。重複が無ければ本 RT はスキップ可（確認のみ行う） |
| 確認コマンド | `grep -rn '"members/"' apps/api/src/routes/ apps/api/src/lib/r2/__tests__/` — ヒット 0 件を期待 |

---

### RT-002 — `buildAdminMemberDetailView` への photoUrl 注入を route 層に明確化

| 項目 | 内容 |
|------|------|
| 対象ファイル | `apps/api/src/repository/_shared/builder.ts`、`apps/api/src/routes/admin/members.ts` |
| Before | Phase 5 実装時に presign 呼び出しが builder 内に誤混入している可能性がある（builder が R2 deps を引数で受け取る形になっている場合） |
| After | `buildAdminMemberDetailView(row, ...)` は photoUrl を引数として受け取るか、builder 完了後に route 層でマージする。builder 自体は `PresignDeps` / `R2Bucket` を一切 import しない |
| 理由 | Phase 2 §6 の設計方針「presign は route 層で注入・builder を R2 非依存に保つ」への整合。テスト容易性（builder の unit test に R2 mock が不要になる）とレイヤー責務の明確化 |
| 確認コマンド | `grep -n "presign\|R2Bucket\|MEMBER_PHOTOS" apps/api/src/repository/_shared/builder.ts` — ヒット 0 件を期待 |

---

### RT-003 — `Avatar` の hue 計算ロジックを共通ヘルパに集約

| 項目 | 内容 |
|------|------|
| 対象ファイル | `apps/web/src/components/ui/Avatar.tsx`、`apps/web/src/features/admin/components/_members/MemberAvatar.tsx` |
| Before | memberId → hue 変換（文字コード総和 % 360 等）が Avatar.tsx と MemberAvatar.tsx の両方、あるいはいずれかのインライン式に重複している場合 |
| After | hue 計算を `apps/web/src/components/ui/avatarUtils.ts`（または既存 util ファイル）の pure function `deriveHue(memberId: string): number` に抽出し、Avatar / MemberAvatar から import する |
| 理由 | Photo fallback 実装で `<img>` ブランチと hue ブランチが共存することで計算式がコピーされやすい。pure function 化でテスト・変更容易性を高める |
| 確認コマンド | `grep -n "% 360\|charCodeAt" apps/web/src/components/ui/Avatar.tsx apps/web/src/features/admin/components/_members/MemberAvatar.tsx` — 同一式が複数ファイルにヒットする場合のみ本 RT を実施 |

---

### RT-004 — MIME/サイズ検証ヘルパの共通化

| 項目 | 内容 |
|------|------|
| 対象ファイル | `apps/api/src/routes/admin/members.ts`、`apps/api/src/lib/r2/member-photo-presign.ts` |
| Before | MIME 許可リスト照合（`MEMBER_PHOTO_ALLOWED_MIME.includes(contentType)`）とサイズ上限検証（`byteLength > MEMBER_PHOTO_MAX_BYTES`）がルート handler に直書きされている |
| After | `validateMemberPhotoUpload(contentType: string, byteLength: number): { ok: true } \| { ok: false; status: 413 \| 415; message: string }` を `member-photo-presign.ts`（または専用 `member-photo-validation.ts`）に切り出し、route から呼び出す |
| 理由 | 検証ロジックをルート handler から切り離してテスト可能にする。将来 batch upload 等でルートを追加した際の重複防止 |
| 確認コマンド | `grep -n "ALLOWED_MIME\|MAX_BYTES" apps/api/src/routes/admin/members.ts` — インライン比較式がヒットする場合のみ実施 |

---

### RT-005 — navigation/import drift の除去

| 項目 | 内容 |
|------|------|
| 対象ファイル | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`、`apps/web/src/components/ui/Avatar.tsx`（およびそれらが import するファイル） |
| Before | Phase 5 実装時に unused import・型アサーション不要化・`as const` 付け忘れ等が残っている可能性がある |
| After | `pnpm lint --fix` を実行し、自動修正可能な ESLint 違反を解消。残る手動修正が必要な箇所を最小差分で修正する |
| 理由 | Phase 9 の品質ゲート（lint green）を事前に通過させ、Phase 9 での修正ループを回避する |
| 確認コマンド | `pnpm --filter @ubm-hyogo/web lint 2>&1 \| grep "error\|warning"` — リファクタリング後にエラー 0 件を確認 |

---

## リファクタリング実施順序

1. RT-001（定数集約確認）→ 重複があれば修正。変更後 `pnpm --filter @ubm-hyogo/api test:unit` PASS を確認。
2. RT-002（builder/route 責務分離）→ 変更後 `pnpm --filter @ubm-hyogo/api test:unit` PASS を確認。
3. RT-003（hue util 抽出）→ 重複が確認できた場合のみ実施。変更後 `pnpm --filter @ubm-hyogo/web test:unit` PASS を確認。
4. RT-004（検証ヘルパ切り出し）→ インライン書きが確認できた場合のみ実施。変更後 `pnpm --filter @ubm-hyogo/api test:unit` PASS を確認。
5. RT-005（import drift）→ `pnpm lint --fix` で自動修正後、手動修正。

> **注意**: RT-003/RT-004/RT-005 は「重複/drift が実際に存在する場合のみ実施」する条件付き RT。重複が無ければスキップして完了条件チェックリストに「スキップ（重複なし）」と記録する。新規ファイルを増やしてはならない場合は既存ファイル内でヘルパ関数として定義する。

---

## リファクタリング禁止事項

- API エンドポイント URL・引数・レスポンス shape の変更（振る舞い変更）
- D1 schema・R2 object key の変更
- `AdminMemberDetailViewZ` の shape 変更（photoUrl optional 以外）
- テストファイル名の変更（artifact canonical 名 = Phase 1 で確定済み）
- 新規 primitive コンポーネントの追加（invariant #3: 既存 primitive 拡張のみ）

---

## 完了条件（Phase 8）

- [ ] RT-001: `MEMBER_PHOTO_OBJECT_KEY`・`MEMBER_PHOTO_MAX_BYTES`・`MEMBER_PHOTO_ALLOWED_MIME` が `member-photo-presign.ts` にのみ定義されており、ルート/テストは import して使用している（または重複なしを確認済みでスキップ記録あり）
- [ ] RT-002: `builder.ts` に presign 関連 import が存在しない（grep ヒット 0 件）
- [ ] RT-003: hue 計算式の重複が排除されている（または重複なしを確認済みでスキップ記録あり）
- [ ] RT-004: MIME/サイズ検証がヘルパ関数に集約されている（または重複なしを確認済みでスキップ記録あり）
- [ ] RT-005: `pnpm lint` でエラー 0 件
- [ ] 全 RT 実施後に `pnpm typecheck` PASS（全 workspace）
- [ ] 全 RT 実施後に `pnpm --filter @ubm-hyogo/api test:unit` PASS
- [ ] 全 RT 実施後に `pnpm --filter @ubm-hyogo/web test:unit` PASS
- [ ] `*.test.{ts,tsx}` ファイルが増えていない（invariant #8）

## メタ情報
workflow_state: `spec_created` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
実装後の重複と責務混在を最小化し、storage/API/UI の境界を保つ。

## 実行タスク
- 定数と validation helper を集約する。
- builder と R2 依存を分離する。

## 参照資料
- `phase-5.md`
- `phase-7.md`

## 成果物
- Phase 8 リファクタリング仕様

## 統合テスト連携
Phase 4-7 のテストを維持したまま refactor を完了する。
