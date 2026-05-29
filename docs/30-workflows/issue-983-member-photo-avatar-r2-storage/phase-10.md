# Phase 10: 最終レビュー

> **[実装区分: 実装仕様書]**。Phase 9 の全品質 gate PASS を前提として、受入条件（AC-1..7）の充足を最終判定する。MINOR 指摘は Phase 12 未タスク化ルールに従って処理する。blocker が 0 件であることを確認して Phase 11 へ進行可とする。

## AC 充足判定表（issue #983 受入条件と Phase 1 定義の照合）

| AC ID | 受入条件（Phase 1 定義） | 充足確認方法 | 判定 | 備考 |
|-------|------------------------|-------------|------|------|
| AC-1 | storage contract が `docs/00-getting-started-manual/specs/` に明文化（R2 bucket 名・presign TTL 300s・object key `members/{memberId}/avatar`・上限 256KB・MIME 3 種） | `ls docs/00-getting-started-manual/specs/` で storage contract doc（`08-free-database.md` 追記または `15-member-photo-storage.md` 新規）の存在確認。内容に bucket 名・TTL・key 形式・256KB・MIME 3 種が明記されているか確認 | — | Phase 12 で docs 更新の証拠として記録 |
| AC-2 | `AdminMemberDetailViewZ.photoUrl?: string`（url 形式 optional）追加で既存 parse が壊れない（`.strict()` 維持） | `grep -n "photoUrl" packages/shared/src/zod/viewmodel.ts` で `z.string().url().optional()` を確認。`pnpm typecheck` PASS（Phase 9 QA-007）を証拠とする | — | Phase 9 QA-004 で確認済みであれば転記 |
| AC-3 | `MemberAvatar` は photoUrl 有 → `<img>`、未取得/`onError` → hue placeholder | `MemberAvatar.spec.tsx` の「photoUrl 有時に `<img>` が render される」「onError 発火後に hue placeholder が render される」テストケースが PASS | — | Phase 4/5 で RED→GREEN 確認済みを記録 |
| AC-4 | 写真未登録 member の avatar は現行 hue placeholder と pixel diff ゼロ | Phase 11 の Playwright visual（`admin-member-photo-avatar.spec.ts`）で photoUrl 無し状態のスクリーンショットを取得し、既存 hue placeholder baseline と比較。diff がゼロまたは許容範囲内（Playwright threshold ≤0.05） | — | Phase 11 VISUAL_ON_EXECUTION 依存。runtime 実行まで `pending` |
| AC-5 | R2 アクセスは presigned URL のみ。bucket public list 禁止 | Phase 9 QA-006（`wrangler.toml` に `public_access = true` が存在しない）の PASS を証拠とする | — | Phase 9 QA-006 で確認済みであれば転記 |
| AC-6 | upload は admin 限定 endpoint で MIME/サイズ検証 + audit `admin.member.photo_uploaded` / 削除時 `admin.member.photo_deleted` | `member-photo.contract.spec.ts` の「256KB 超で 413」「不正 MIME で 415」「成功時に audit log が呼ばれる」テストケースが PASS | — | Phase 4/5/6 で確認済みを記録 |
| AC-7 | `apps/web` から R2/D1 直接アクセスが無い（全て `apps/api` 経由） | Phase 9 QA-001（`grep -rn "photoUrl\|R2\|MEMBER_PHOTOS" apps/web/src`）の PASS を証拠とする | — | Phase 9 QA-001 で確認済みであれば転記 |

**判定凡例**: PASS / FAIL / pending（runtime 依存で Phase 11 以降に持ち越し）

---

## MINOR 指摘の処理ルール（unassigned-task-guidelines）

最終レビュー中に発見した指摘事項は以下の基準で処理する。

| 種別 | 基準 | 処理 |
|------|------|------|
| **blocker** | AC 未充足・不変条件違反・型安全性の欠損・セキュリティ上の懸念（admin 以外からアップロード可能、等） | 即時修正（Phase 10 内で修正して再判定）。Phase 11 には進めない |
| **MINOR** | 機能に影響しない改善（コメント精度・変数名・error message の表記）・将来の拡張余地 | Phase 12 `unassigned-task-detection` セクションで未タスク化。blocker として扱わない |
| **runtime 依存** | R2 bucket provisioning 未完了・Cloudflare secret 未投入・staging での presign 実挙動未確認 | **user-gated 残課題**として本 Phase の「runtime 依存残課題」セクションに記録。AC-4（Phase 11 visual）は Phase 11 で評価 |

---

## partial_fix 確認

| 確認項目 | 確認方法 | 結果 |
|---------|---------|------|
| Phase 5 実装で「後回し」とした箇所（FIXME/TODO コメント）が残っていないか | `grep -rn "TODO\|FIXME\|HACK" apps/api/src/lib/r2/ apps/api/src/repository/memberPhotos.ts apps/api/src/routes/admin/members.ts apps/web/src/components/ui/Avatar.tsx apps/web/src/features/admin/components/_members/` | ヒット 0 件を期待。ヒットがあれば blocker か MINOR かを判断する |
| Phase 6 テスト拡充で「skip」されたテストが残っていないか | `grep -rn "\.skip\|it\.skip\|describe\.skip\|test\.skip" apps/api/src/lib/r2/__tests__/ apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts apps/web/src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx` | ヒット 0 件を期待。ヒットがあればその理由を確認し、blocker か MINOR かを判断する |
| migration 0022 が `apps/api/migrations/` に存在するか | `ls apps/api/migrations/ \| grep "0022"` | `0022_member_photos.sql` が存在することを確認 |

---

## runtime 依存残課題（user-gated）

以下は **コードの正しさとは独立した runtime ops** であり、実装完了後にユーザーが明示的に承認・実行するまで保留とする。Phase 12 の未タスク化対象には含めず、本セクションに記録する。

| 残課題 ID | 内容 | 実行コマンド / 手順 | ゲート |
|----------|------|-------------------|--------|
| RT-OPS-001 | R2 bucket `ubm-hyogo-member-photos-staging` の provisioning | Cloudflare Dashboard または `wrangler r2 bucket create ubm-hyogo-member-photos-staging` を `bash scripts/cf.sh` 経由で実行 | staging deploy 前に必須 |
| RT-OPS-002 | R2 bucket `ubm-hyogo-member-photos-prod` の provisioning | Cloudflare Dashboard または `wrangler r2 bucket create ubm-hyogo-member-photos-prod` を `bash scripts/cf.sh` 経由で実行 | production deploy 前に必須 |
| RT-OPS-003 | presign 用 Cloudflare Secret の投入（staging 環境）: `R2_ACCOUNT_ID`・`R2_ACCESS_KEY_ID`・`R2_SECRET_ACCESS_KEY` | `bash scripts/cf.sh secret put R2_ACCOUNT_ID --config apps/api/wrangler.toml --env staging`（同様に他 2 件）。値は 1Password から取得し `.env` には `op://` 参照のみ記述 | staging deploy 前に必須 |
| RT-OPS-004 | presign 用 Cloudflare Secret の投入（production 環境）: 同上 3 件 | 同上 `--env production` で実行 | production deploy 前に必須 |
| RT-OPS-005 | D1 migration 0022 の staging 環境への適用 | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env staging`（staging の D1 binding 名を確認の上実行） | staging deploy 後かつ Phase 11 visual 前に必須 |
| RT-OPS-006 | D1 migration 0022 の production 環境への適用 | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production` | production deploy 前に必須 |
| RT-OPS-007 | staging 実環境での presign URL 動作確認（aws4fetch SigV4 TTL 実測） | Phase 11 手動テストで photo upload → `<img src=presignedUrl>` が表示されること・TTL 経過後に 403 になることを確認 | Phase 11 user-gated |

> `bash scripts/cf.sh` ラッパー経由でのみ実行すること（CLAUDE.md 「Cloudflare 系 CLI 実行ルール」）。`wrangler` 直接呼び出し禁止。

---

## ブロッカー判定サマリ

| 区分 | 件数 | 備考 |
|------|------|------|
| blocker（AC 未充足・不変条件違反） | — | Phase 10 実施時に記入 |
| MINOR（Phase 12 未タスク化） | — | Phase 10 実施時に記入 |
| runtime 依存残課題（user-gated） | 7 件 | RT-OPS-001..007（上表） |

**Phase 11 進行条件**: blocker 件数が **0** であること。runtime 依存残課題は Phase 11 user-gated のため進行を妨げない。

---

## 完了条件（Phase 10）

- [ ] AC-1..7 の全判定が記録されており、FAIL が 0 件（または `pending` は全て Phase 11 runtime 依存として記録済み）
- [ ] `TODO`/`FIXME`/`.skip` の grep gate が実行済みで、blocker 件数が 0
- [ ] migration `0022_member_photos.sql` の存在確認済み
- [ ] MINOR 指摘が全て Phase 12 未タスク化対象として記録されている（または MINOR 0 件）
- [ ] runtime 依存残課題（RT-OPS-001..007）が本 Phase に記録されており、user-gated として明示されている
- [ ] blocker 0 件が確認されており Phase 11 進行可の判定が明記されている

## メタ情報
workflow_state: `spec_created` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
AC-1..7 と blocker/MINOR/runtime gate の状態を最終判定する。

## 実行タスク
- AC 充足表を埋める。
- blocker 0 件を確認する。

## 参照資料
- `phase-9.md`

## 成果物
- Phase 10 最終レビュー

## 統合テスト連携
Phase 11 は本 Phase の blocker 0 件判定を前提に実行する。
