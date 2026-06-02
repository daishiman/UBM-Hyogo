# Workflow: issue-1031-member-self-photo-upload

> **[実装区分: 実装仕様書 (implementation)]** — コード変更を伴う（CONST_004 デフォルト）。
> 本 workflow は **implementation task の実装完了済みローカル証跡** を管理する。実コード対象は `apps/api` と `apps/web` に反映済みで、現時点の成果状態は `implemented_local_runtime_pending`（staging deploy / 実 R2 / authenticated runtime evidence はユーザー承認待ち）として扱う。
> commit・push・PR・Issue mutation はユーザー明示承認まで行わない（CONST_002）。

GitHub Issue #1031（`[task-issue-983-followup-001-member-self-photo-upload] Member self photo upload and identity confirmation`）を
**最新コードに最適化した上で**根本解決するための Phase 1-13 タスク仕様書一式。

- ブランチ: `feat/issue-1031-member-self-photo-upload`
- ベースブランチ: `dev`
- 親 workflow（発見元）: `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/`（Phase 12 unassigned-task-detection 候補。followup-001）
- Issue 状態: **CLOSED**（2026-06-01 に `gh issue view 1031 --json state` で実状態を再確認）

---

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | issue-1031-member-self-photo-upload |
| 分類 | implementation / API contract / member self-service / admin-managed data |
| 実装区分 | 実装仕様書（CONST_004 デフォルト。member 本人による photo mutation = コード変更必須） |
| implementation_mode | `new`（P50: upstream 未マージ・別タスク未解決。本ブランチでは実装済み） |
| 優先度 | 中（priority:medium）※ issue 踏襲 |
| 規模 | 中（scale:medium） |
| visualEvidence | VISUAL（profile の photo upload/delete UI を Phase 11 で撮影） |
| workflow_state | implemented_local_runtime_pending |
| implementation_state | implemented_local |
| GitHub Issue | #1031（CLOSED。2026-06-01 実確認。本 workflow では Issue state を変更しない） |
| 依存タスク | #983（admin-managed member photo / R2 storage）— 完了済み（local 実装あり） |

---

## 0. 事前調査結論（「別タスクで解決済みでないか」への回答）

> 注: 以下の表は 2026-06-01 の仕様作成時点での事前調査結果。現在の本ブランチでは Task A/B を実装済みで、workflow state は `implemented_local_runtime_pending`。

ユーザー依頼「もしかしたら別タスクでも解決しているかもしれない。問題が直っているか・コード実行が完了しているかを調査し、不要なら不要と伝える」に対する結論。

| 観点 | 調査対象 | 結果 |
|------|---------|------|
| member self-upload API route | `apps/api/src/routes/me/index.ts`（仕様作成時点） | **当時未実装**。本ブランチで `POST/DELETE /me/photo` を追加済み |
| member profile 写真 UI | `apps/web/app/(member)/profile/_components/`（仕様作成時点） | **当時未実装**。本ブランチで `PhotoUpload.client.tsx` を追加済み |
| `member_photos` source 区別 | `apps/api/migrations/0022_member_photos.sql` / `apps/api/src/repository/memberPhotos.ts`（仕様作成時点） | **当時未実装**。本ブランチで additive `0023_member_photos_source.sql` と repository source roundtrip を追加済み |
| self-upload 用 presign / put | `apps/api/src/lib/r2/member-photo-presign.ts` / `apps/api/src/routes/admin/members.ts:497-587` | admin は **server-side R2 put**（multipart）で実装済み。self 用経路は無い |
| 関連 workflow | `docs/30-workflows/`（issue-983 / issue-1030 / completed-tasks） | issue-983=admin-managed photo（実装済み）。issue-1030=variant pipeline（spec のみ）。**self-upload は未着手** |
| shared schema | `packages/shared/src/zod/viewmodel.ts` | admin detail `photoUrl?` のみ。member self-upload 用 schema 無し |

> **結論: Issue #1031 は別タスクを含めどこにも実装されていない（未解決）。よって本 issue の実行は必要であり、不要ではない。**
> admin-managed photo（#983）は完全実装済みで、仕様作成時点では member 本人による self-upload/delete が未実装だった。本ブランチの実装により `/me/photo` API、profile UI、`source` 区別、self 経路はローカル実装済みになった。

### Issue が古い点と「最新コードへの最適化」

Issue 本文は 2026-05-29 の admin-managed MVP（#983）完了直後の記述であり、以下が現行コードと乖離している。本 workflow ではこれを最新コードに最適化して根本解決する。

| Issue 本文の前提（2026-05-29） | 最新コードの実態（2026-06-01） | 最適化後の方針 |
|------|------|------|
| 「presigned URL 方針を再利用」（PUT presign 想定と読める） | admin upload は **server-side R2 put**（`c.env.MEMBER_PHOTOS.put`）。PUT presign は存在しない | self-upload も **server-side put**（multipart → Worker put）に統一。PUT presign は新設しない |
| `apps/web/app/(member)/profile/page.tsx` を参照 | 同 path 実在。Server Component(read-only) + client mutation コンポーネント（`*.client.tsx` + `/lib/api/*-client` + `/api/me/* proxy`）パターンが確立 | この確立パターンに沿って upload UI を新設 |
| `member_photos` に `uploaded_by` / `source` / `consent_at` を後付け検討 | 0022 は `uploaded_by` のみ。最新 migration は **0022** | additive **0023**（`source` 列、DEFAULT 'admin'）を追加。`consent_at` は非追加（理由は Phase 2） |
| R2 object key を分岐すると orphan が増える懸念 | object key は `members/{memberId}/avatar` の**単一スロット上書き** | 単一スロット **last-write-wins** を維持し orphan を構造的に発生させない |

---

## 1. 根本問題（最適化後の1文定義）

> member 本人が自分のプロフィール写真を更新する経路が存在せず、写真の登録・差し替え・削除がすべて admin 代行に依存している。
> その結果、写真の鮮度が運営対応速度に律速され、本人同意（自分の意思で自分の写真を載せた）という監査根拠が `source` レベルで残らない。

### 真の論点（skill「要件レビュー思考法」適用）

1. **真の論点**: 「member が own avatar を直接 mutate できる経路を、`/me` router の既存不変条件（#4 本文編集禁止・#11 path に memberId を出さない）と矛盾させずに新設できるか」。
2. **依存・境界**: `/me` の既存 self-service（visibility / delete）は **admin 承認キュー経由**。一方 photo は **admin-managed data（`member_photos`、Google Form schema 外）** であり、invariant #4 が保護する「Form profile 本文」ではない。→ photo は本人直接 mutate を許容できる（境界が異なる）。
3. **価値とコスト**: 初回価値 = 本人が即時に自分の avatar を更新でき、admin 代行を不要化。高コスト項目（public 表示 / transcode / consent ワークフロー）は初期層から分離。
4. **改善優先順位**: ①self-upload/delete endpoint（本人境界の確立）→ ②source 区別（admin/self 監査）→ ③profile UI → ④visual evidence。
5. **4 条件評価**: 価値性=admin 代行コスト削減で明確 / 実現性=既存 admin route と presign util を再利用し 1 サイクルに収まる / 整合性=invariant #4/#5/#11 と矛盾しない（Phase 2 で証明）/ 運用性=last-write-wins で R2 orphan 無し・audit 追跡可。

---

## 2. スコープ

### 含む（今回サイクル内で完了 — CONST_007）

1. D1 migration **0023**（`member_photos` に `source TEXT NOT NULL DEFAULT 'admin'` を additive 追加。既存行は DEFAULT で 'admin' backfill）
2. `memberPhotos.ts` repository 拡張（`MemberPhotoRow.source` / `upsertMemberPhoto` に `source` 引数 / `getMemberPhoto` が `source` 返却）
3. admin route（`admin/members.ts`）の upsert 呼び出しに `source: "admin"` を明示（既存挙動維持・backfill）
4. apps/api `/me` router に self-service photo endpoint 2 系統:
   - `POST /me/photo`（multipart self-upload → MIME/size 検証 → R2 put（`session.user.memberId` 由来 key）→ `member_photos` upsert `source='self'` → audit `member.photo_uploaded`）
   - `DELETE /me/photo`（own photo 削除 → R2 delete + D1 delete + audit `member.photo_deleted`）
5. `GET /me/profile` 拡張（自分の photo 行があれば presigned `photoUrl` を fail-soft で同梱。`MeProfileResponseZ.photoUrl?`）
6. shared schema（`/me/photo` の受理 response + 必要なら client 用型）
7. web: `/api/me/photo` proxy route handler（multipart POST/DELETE）+ `me-photo-client.ts` + `PhotoUpload.client.tsx`（profile の avatar 表示・file 選択・upload/delete・状態管理・a11y）+ `page.tsx` への mount
8. テスト: api route contract / repo source roundtrip / migration shape / shared schema / web component / proxy route / Playwright visual

### 含まない（別タスク化。理由・実施先を明記 — CONST_007 例外条件）

| 除外項目 | 理由（独立関心であり今回サイクルに混ぜると破綻） | 実施先 |
|---------|------|--------|
| `/(public)/members/[id]` での写真公開表示 | 公開 directory の PII / publishState 公開合意ポリシー・署名 URL 配布設計が別関心（親 #983 でも分離済み: followup-002） | 将来 followup（Phase 12 で未タスク化判定） |
| 画像 transcode / resize / variant pipeline | issue-1030（variant pipeline）が別 spec として存在。R2 静的保存で MVP 充足 | issue-1030 / followup-003 |
| Google Form への写真項目追加 | invariant #6 違反（禁止） | 実施しない |
| 本人写真の admin 承認ワークフロー化 | Issue AC は「本人が直接 upload/delete できる」を要求。承認キュー化は AC と矛盾し admin 代行依存を温存 | 採用しない（Phase 2 で設計判断を明記） |

> 上記分離は「分量が多い」ためではなく、**公開ポリシー・外部 transcode・Form 不変条件という独立関心**が今回サイクルに混ざると整合性破綻するため（CONST_007 例外 1）。今回スコープ（self-upload/delete + source 区別 + profile UI）は単独で機能完結する垂直スライス。

---

## 3. 不変条件（実装時に厳守）

1. D1 / R2 直接アクセスは `apps/api` に閉じる（`apps/web` は proxy / presigned URL のみ）— CLAUDE.md invariant #5
2. `/me` router は path に `:memberId` を含めない。対象 member は `c.get("user").memberId` のみで解決 — me/index.ts invariant #11
3. photo は admin-managed data（`member_photos`）。Google Form schema 表には触れない — invariant #4 / #6
4. 既存 migration は破壊しない。**additive のみ**（`ADD COLUMN ... DEFAULT 'admin'`）。既存行 backfill を DEFAULT で担保 — issue リスク対策
5. R2 bucket は public list 禁止。GET は presigned URL（TTL 300s）のみ。object key は `members/{memberId}/avatar` の単一スロット維持 — #983 AC-5
6. self-upload は MIME（jpeg/png/webp）+ サイズ上限 256KB を **server 側で検証**（`MEMBER_PHOTO_ALLOWED_MIME` / `MEMBER_PHOTO_MAX_BYTES` 再利用）— #983 AC-6
7. self mutation は audit `member.photo_uploaded` / `member.photo_deleted`（actor = session email）。admin 系 `admin.member.photo_*` とは別 action 名で区別
8. 色は OKLch token のみ（HEX 直書き禁止）。新規 UI は既存 primitives（Avatar / Button / Modal 等）を再利用し新規 primitive を生やさない
9. 新規 test は `*.spec.{ts,tsx}` のみ — CLAUDE.md invariant #8
10. 写真未登録 member の profile 表示は現行と pixel diff ゼロ（visual baseline 維持）

---

## 4. タスク表

| Task | スコープ | 想定ファイル | 並列 |
|------|---------|------------|------|
| Task A — storage/API layer | migration 0023 / memberPhotos repo 拡張 / admin route source 明示 / `/me/photo` POST・DELETE / `/me/profile` photoUrl 同梱 / me schemas / shared schema | apps/api + packages/shared | B が shared schema を参照（A 先行） |
| Task B — web self-service UI | `/api/me/photo` proxy / `me-photo-client.ts` / `PhotoUpload.client.tsx` / page.tsx mount / spec | apps/web | A の `/me/photo` contract + shared schema 後に着手 |

> Task A/B は本 wave で実装済み。staging deploy、remote D1 migration apply、authenticated member session での runtime screenshot、commit/push/PR はユーザー承認後の外部 gate として残す。

---

## 5. Phase 成果物マップ

| Phase | ファイル | 区分 |
|-------|---------|------|
| Phase 1 要件定義 | `phase-1.md` | 設計（直列） |
| Phase 2 設計 | `phase-2.md` | 設計（直列） |
| Phase 3 設計レビュー | `phase-3.md` | 設計（直列・ゲート） |
| Phase 4 テスト作成 | `phase-4.md` | 実装仕様 |
| Phase 5 実装 | `phase-5.md` | 実装仕様 |
| Phase 6 テスト拡充 | `phase-6.md` | 実装仕様 |
| Phase 7 カバレッジ確認 | `phase-7.md` | 実装仕様 |
| Phase 8 リファクタリング | `phase-8.md` | 実装仕様 |
| Phase 9 品質保証 | `phase-9.md` | 実装仕様 |
| Phase 10 最終レビュー | `phase-10.md` | 実装仕様 |
| Phase 11 手動テスト | `phase-11.md` | 実装仕様（VISUAL） |
| Phase 12 ドキュメント更新 | `phase-12.md` | 実装仕様 |
| Phase 13 PR作成 | `phase-13.md` | 実装仕様（user-gated） |

---

## 6. 参照

- Phase 12 close-out evidence: `outputs/phase-12/phase12-task-spec-compliance-check.md`
- Issue: https://github.com/daishiman/UBM-Hyogo/issues/1031
- 親 issue: https://github.com/daishiman/UBM-Hyogo/issues/983
- 親 workflow: `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/`
- admin photo route（再利用元）: `apps/api/src/routes/admin/members.ts:496-587`
- presign util: `apps/api/src/lib/r2/member-photo-presign.ts`
- member_photos repo: `apps/api/src/repository/memberPhotos.ts`
- migration: `apps/api/migrations/0022_member_photos.sql`
- /me router: `apps/api/src/routes/me/index.ts` / schemas: `apps/api/src/routes/me/schemas.ts`
- 既存 self-service UI パターン: `apps/web/app/(member)/profile/_components/VisibilityRequest.client.tsx` / `apps/web/src/lib/api/me-requests-client.ts` / `apps/web/app/api/me/visibility-request/route.ts`
- Avatar primitive（src 対応済み）: `apps/web/src/components/ui/Avatar.tsx`
- 無料構成制約: `docs/00-getting-started-manual/specs/08-free-database.md`
