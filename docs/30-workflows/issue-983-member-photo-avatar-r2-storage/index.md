# Workflow: issue-983-member-photo-avatar-r2-storage

> **[実装区分: implementation]** — コード変更を伴う。
> 本 workflow は local implementation complete / runtime pending の状態である。外部R2/D1/deploy/PR操作はユーザー指示まで行わない。

GitHub Issue #983（`[admin-members-prototype-redesign-fu-003] photo-backed avatar rendering + R2 storage contract`）を
**最新コードに最適化した上で**根本解決するためのタスク仕様書一式。

- ブランチ: `feat/issue-983-member-photo-avatar-r2-storage`
- ベースブランチ: `dev`
- 親ワークフロー（発見元）: `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/`（Phase 12 unassigned-task-detection 候補 3）
- Issue 状態: **CLOSED**（2026-05-29T09:03:39Z に GitHub 実状態を再確認。PR 文脈は `Refs #983` のみ）

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク種別 | implementation |
| workflow_state | implemented_local_runtime_pending |
| implementation_state | implemented_local |
| visualEvidence | VISUAL_ON_EXECUTION |
| Phase 12 strict 7 | `outputs/phase-12/` に implementation close-out evidence として物理配置済み |
| artifacts parity | `artifacts.json` と `outputs/artifacts.json` を同一内容で同期 |
| 正本同期 | `.claude/skills/aiworkflow-requirements/` の quick-reference / resource-map / task-workflow-active / artifact inventory に登録 |

---

## 0. 事前調査結論（実装前ベースライン）

ユーザー依頼「別タスクで既に解決していないか、コードベースで実装完了しているか調査」に対する結論。

| 観点 | 調査コマンド/対象 | 結果 |
|------|------------------|------|
| `photoUrl` / `photo_url` の実装 | `grep -rn "photoUrl\|photo_url" apps/` | **0 件（未実装）** |
| `MemberAvatar` の写真 render | `apps/web/src/features/admin/components/_members/MemberAvatar.tsx` | hue 派生 placeholder のみ。写真 render 無し |
| `Avatar` primitive の `src` 対応 | `apps/web/src/components/ui/Avatar.tsx` | initial + hue のみ。`<img>` 非対応 |
| `AdminMemberDetailViewZ` の photoUrl | `packages/shared/src/zod/viewmodel.ts` L291-312 | `.strict()`、photoUrl フィールド無し |
| R2 bucket（member photo 用） | `apps/api/wrangler.toml` / `apps/api/src/env.ts` | audit cold storage 用 2 本のみ。member photo 用バインディング無し |
| D1 migration（photo 列/表） | `apps/api/migrations/` | photo 関連 migration **無し**（最新 0021） |

> **結論: Issue #983 は別タスクを含めどこにも実装されていない（未解決）。** よって本 issue の実行は必要であり、不要ではない。
> ただし issue 本文は 2026-05-27 時点の記述で「storage は R2 / Cloudflare Images どちらか」「admin アップロード UI は任意」と
> **未決事項を残したまま**である。本 workflow ではこれを最新コード（migration 0021 / 既存 R2 binding パターン / `.strict()` schema）に
> 合わせて**根本解決可能な形に最適化**し、後続実装で 1 サイクル完了できる単一スコープへ確定させる（CONST_007）。

### Issue 状態に関する注記

初回調査時点のローカル記録は `OPEN` だったが、2026-05-29 の再確認で `gh issue view 983 --json state,closedAt` は
**`CLOSED` / `closedAt=2026-05-29T09:03:39Z`** を返した。Issue mutation は行わず、PR 文脈は `Refs #983` のみとする。

## 0.1 現在の実装状態（2026-05-29 close-out）

本ブランチでは、実装前ベースラインで未実装だった項目を local 実装済みに更新した。

| Area | State |
|---|---|
| storage/API | `0022_member_photos.sql`, `MEMBER_PHOTOS` binding, R2 presign util, upload/delete endpoint, detail `photoUrl` 同梱を実装 |
| shared schema | `AdminMemberDetailViewZ.photoUrl?: string` と型を追加し `.strict()` を維持 |
| web UI | `Avatar src?` / `MemberAvatar photoUrl?` / `MemberDrawer` upload-delete affordance を実装 |
| tests | presign unit, route contract, shared schema, avatar render tests を追加・実行 |
| visual | `outputs/phase-11/screenshots/` に canonical local static screenshot 6 件を保存 |
| runtime gate | R2 bucket 作成、secret 投入、remote D1 migration apply、staging deploy、authenticated staging screenshot、commit/push/PR、Issue #983 mutation は未実行 |

---

## 1. 根本問題（最適化後の1文定義）

> プロトタイプ正本（`claude-design-prototype/pages-admin.jsx`）は member avatar を実写真で描画する前提だが、現行実装は memberId hash 由来の hue placeholder しか持てない。
> その根本原因は「**写真の入手経路と保存契約（storage contract）が未確定**」であり、Google Form に写真項目が無い（invariant #6 で追加禁止）こと。

### 最適化された解決方針（Phase 2 で確定する設計の要旨）

| 論点 | 決定 | 根拠 |
|------|------|------|
| 写真入手経路 | **管理者アップロードのみ** | invariant #4（Google Form schema 外データ = admin-managed data 分離）/ invariant #6（Google Form 変更禁止）。member 自己 upload と public 表示はスコープ外 |
| ストレージ | **R2 + 署名付き GET URL（presigned, TTL 300s）** | Cloudflare Images は無料枠超過リスク（`08-free-database.md`）。`<img src>` がブラウザから直接取得でき、bucket public list を開けずに済む |
| D1 | admin-managed 新規表 `member_photos`（migration 0022） | Google Form schema 表（responses/sections/fields）に触れない。invariant #4 準拠 |
| shared schema | `AdminMemberDetailViewZ` に `photoUrl?: string`（top-level, `.strict()` 維持） | issue AC-2。MemberProfile は不変 |
| list への露出 | **含めない** | 署名付き URL の TTL コスト・無料枠（500k reads/day）配慮。drawer/detail のみ |

---

## 2. スコープ

### 含む（今回サイクル内で完了 — CONST_007）

1. storage contract 設計書（`docs/00-getting-started-manual/specs/` への追記）
2. D1 migration `0022_member_photos.sql`（admin-managed `member_photos` 表）
3. R2 bucket `MEMBER_PHOTOS` binding（`apps/api/wrangler.toml` staging/production + `env.ts`）
4. apps/api endpoint 3 系統:
   - `POST /admin/members/:memberId/photo`（multipart upload → R2 put + D1 upsert + audit）
   - `DELETE /admin/members/:memberId/photo`（R2 delete + D1 delete + audit）
   - `GET /admin/members/:memberId` 拡張（photo row 有時に presigned `photoUrl` を同梱）
5. `AdminMemberDetailViewZ.photoUrl?` 追加（shared）
6. `Avatar` primitive の `src` 対応 + `MemberAvatar` の photo > hue 二段 render（`onError` fallback / loading state）
7. MemberDrawer 内の管理者アップロード/削除 affordance（`useAdminMutation` 経由）
8. テスト: R2 presign unit / upload route contract / avatar render spec / Playwright visual（photo 有無）

### 含まない（別タスク化。理由・実施先を明記 — CONST_007 例外条件）

| 除外項目 | 理由 | 実施先 |
|---------|------|--------|
| Google Form への写真項目追加 | invariant #6 違反（不変条件で禁止） | 実施しない |
| 一般 member 自身の photo upload | 認証境界・本人確認 UX が別スコープ。MVP は admin 代行で価値充足 | 将来 followup（本 workflow Phase 12 で未タスク化） |
| `/(public)/members/[id]` での photo 表示 | 公開 directory の PII/公開合意ポリシー（publishState）と署名 URL 配布設計が別関心 | 将来 followup（本 workflow Phase 12 で未タスク化） |
| 画像 transcode / resize | R2 静的保存で MVP 充足。Cloudflare Images 移行は別判断 | 将来 followup |

> 上記分離は「分量が多い」ためではなく、**認証境界・公開ポリシー・外部サービス依存という独立関心**が今回サイクルに混ぜると破綻するため（CONST_007 例外 1）。今回スコープ（admin upload + R2 presign + drawer avatar）は単独で機能完結する垂直スライス。

---

## 3. 不変条件（実装時に厳守）

1. D1 直接アクセスは `apps/api` に閉じる（`apps/web` から R2/D1 直接アクセス禁止）— CLAUDE.md invariant #5
2. Google Form schema 表は不変。photo は admin-managed `member_photos` に隔離 — invariant #4
3. `AdminMemberDetailViewZ` の `.strict()` を維持（photoUrl は optional 追加のみ）
4. 色は OKLch token のみ。avatar の `<img>` 周りの枠/影も token 経由（HEX 直書き禁止）
5. R2 bucket は public list 禁止。GET は presigned URL（TTL 300s）のみ — issue AC-5 / `08-free-database.md`
6. アップロードは admin 限定 endpoint。MIME（jpeg/png/webp）+ サイズ上限 256KB を server 側で検証。audit `admin.member.photo_uploaded` / `admin.member.photo_deleted` を記録 — issue AC-6
7. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由 — CLAUDE.md invariant #10
8. 新規 test は `*.spec.{ts,tsx}` のみ — CLAUDE.md invariant #8
9. 写真未登録 member の表示は現行 hue placeholder と pixel diff ゼロ（visual baseline 維持）— issue AC-4

---

## 4. タスク表

| Task | スコープ | 想定ファイル数 | 並列 |
|------|---------|--------------|------|
| Task A — storage/API layer | migration 0022 / R2 binding / env / upload・delete・detail endpoint / shared schema / presign util | 9 | B と一部直列（shared schema を B が参照） |
| Task B — web avatar/drawer UI | `Avatar` src 対応 / `MemberAvatar` 二段 render / MemberDrawer upload affordance / spec | 5 | A の shared schema 後に着手 |

Task A/B は本ブランチで local 実装済み。remote runtime operations は user-gated として残す。

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
| Phase 11 手動テスト | `phase-11.md` | 実装仕様（VISUAL_ON_EXECUTION） |
| Phase 12 ドキュメント更新 | `phase-12.md` | 実装仕様 |
| Phase 13 PR作成 | `phase-13.md` | 実装仕様（user-gated） |

---

## 6. メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | issue-983-member-photo-avatar-r2-storage |
| 分類 | implementation / storage / API contract / admin UI |
| implementation_mode | `new`（P50: current branch 未実装・upstream 未マージ・未解決） |
| 優先度 | 低（priority:low）※ issue 踏襲 |
| 規模 | 中（scale:medium） |
| visualEvidence | VISUAL_ON_EXECUTION（avatar の写真/placeholder 切替を Phase 11 で撮影） |
| workflow_state | implemented_local_runtime_pending |
| GitHub Issue | #983（CLOSED, PR 文脈は `Refs #983` のみ） |

---

## 7. 参照

- Issue: https://github.com/daishiman/UBM-Hyogo/issues/983
- 元 unassigned spec: `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/unassigned-task-specs/admin-members-prototype-redesign-followup-003-photo-backed-avatar.md`
- プロトタイプ: `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`
- 無料構成制約: `docs/00-getting-started-manual/specs/08-free-database.md`
- 現行 hue avatar: `apps/web/src/components/ui/Avatar.tsx` / `apps/web/src/features/admin/components/_members/MemberAvatar.tsx`
- 既存 R2 binding パターン: `apps/api/src/env.ts` L29-35 / `apps/api/wrangler.toml`
