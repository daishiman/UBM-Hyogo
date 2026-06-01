# issue-1030 — Member photo transcode/resize variant pipeline（client-side / free-tier）

> **実装区分: 実装仕様書**（CONST_004 デフォルト）。コード実装を伴う。
> 2026-06-01 実装レビューにより、現ワークツリーに Phase 5 の実コード差分が存在する（`implementation_reviewed_local`）。commit・push・PR・remote D1 migration apply・issue 状態変更は引き続き user-gated。

## メタ情報

| 項目 | 内容 |
|------|------|
| task_id | `task-issue-1030-member-photo-transcode-resize-variant-pipeline` |
| GitHub Issue | [#1030](https://github.com/daishiman/UBM-Hyogo/issues/1030)（**CLOSED 維持・reopen しない**） |
| 親 Issue / workflow | #983 [`issue-983-member-photo-avatar-r2-storage`](../issue-983-member-photo-avatar-r2-storage/) |
| 依存 | issue-983（R2 static storage contract + member_photos MVP）実装済（PR #1038 / commit `ae773ba38`） |
| category | パフォーマンス |
| priority / scale | 低 / 中規模 |
| taskType | implementation（`implementation_mode: new`） |
| visualEvidence | VISUAL_ON_EXECUTION（UI 変更あり・spec 段階では pending） |
| status | `implementation_reviewed_local`（spec_created 起点・実装レビュー反映） |
| branch | `docs/issue-1030-member-photo-transcode-resize-variant-pipeline-spec` |
| base | `dev` |

## 調査結論（issue が古いか / 別タスクで解決済みか）

- **別タスクで解決されていない**: member photo 関連コミットは #983（PR #1038 / `ae773ba38`）の 1 件のみ。`variant` / `resize` / `transcode` の実装は **ゼロ**（grep 一致は全て `invariant` の部分一致）。Cloudflare Images / Image Resizing / `cdn-cgi/image` の採用痕跡なし。
- **根本問題は現コードに実在**: `PhotoUploadAffordance`（`apps/web/src/features/admin/components/_members/MemberDrawer.tsx`）が生 `File` を無加工で送信 → サーバが 256KB 上限のみ適用し R2 単一 key `members/{memberId}/avatar` に保存 → `MemberAvatar` が sm/md/lg 全サイズで同一フル画像を配信。#1029（公開メンバー表示）稼働で帯域非効率が顕在化する。
- **issue の最適化**: 原文の 3 方式 ADR（Cloudflare Images / Workers transform / client-side pre-resize）は、本プロジェクトの**無料枠 invariant**（`docs/00-getting-started-manual/specs/08-free-database.md`）により Cloudflare Images・Image Resizing（いずれも有料）が脱落。**client-side Canvas resize（無料）** を根本解として現コードに最適化する。
- **判定: 実行が必要** → 本タスク仕様書を作成。Issue #1030 は **CLOSED のまま**。

## スコープ（CONST_007 — 03.実装.md の 1 サイクルで完了）

### 含む

1. migration `0023_member_photos_variants.sql`（後方互換 ADD COLUMN）
2. `member-photo-presign.ts` の variant key helper 拡張
3. `memberPhotos.ts` repository の variant メタデータ拡張
4. `routes/admin/members.ts` のアップロード（multipart 複数 variant 受領）・presign（display+thumb）拡張
5. `packages/shared` の MemberDetail viewmodel へ `photoThumbUrl` 追加（後方互換 optional）
6. `apps/web/src/lib/admin/image-resize.ts`（Canvas variant 生成 util・新規）+ `PhotoUploadAffordance` 配線
7. `MemberAvatar` / `MemberDrawer` の thumb variant 消費
8. テスト一式（API contract / repo / image-resize util / component）+ free-tier ADR

### 含まない（境界）

- 公開メンバー表示での thumb 露出 = #1029（followup-002）の責務。本タスクは admin 経路のみ。
- member self upload UX = #1031（followup-001 / OPEN）。
- Google Form schema 変更（#983 invariant と矛盾するため実施しない）。
- サーバサイド画像処理（Cloudflare Images / Image Resizing）= 無料枠 invariant により不採用（Phase 2 ADR で却下記録）。

## Phase 一覧

| Phase | 名称 | ファイル | status |
|------|------|---------|--------|
| 1 | 要件定義 | [phase-1.md](phase-1.md) | spec_created |
| 2 | 設計（ADR含む） | [phase-2.md](phase-2.md) | spec_created |
| 3 | 設計レビュー | [phase-3.md](phase-3.md) | spec_created |
| 4 | テスト作成 | [phase-4.md](phase-4.md) | spec_created |
| 5 | 実装 | [phase-5.md](phase-5.md) | implemented_local |
| 6 | テスト拡充 | [phase-6.md](phase-6.md) | verified_local |
| 7 | カバレッジ確認 | [phase-7.md](phase-7.md) | verified_local |
| 8 | リファクタリング | [phase-8.md](phase-8.md) | verified_local |
| 9 | 品質保証 | [phase-9.md](phase-9.md) | passed_local |
| 10 | 最終レビュー | [phase-10.md](phase-10.md) | passed_local |
| 11 | 手動テスト | [phase-11.md](phase-11.md) | local_visual_evidence_present |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | updated_local |
| 13 | PR作成 | [phase-13.md](phase-13.md) | spec_created |

## 不変条件への適合

- invariant #4: variant メタデータは Google Form schema 外 = admin-managed として `member_photos` に分離。
- invariant #5: R2 / D1 アクセスは `apps/api` に閉じる。`apps/web` は presigned URL を受け取り Canvas で生成した variant を multipart 送信するのみ。
- 無料枠 invariant: サーバ/外部の有料画像処理を採用せず、client-side Canvas で完結。
- OKLch トークン正本: UI 追加は既存 primitives（`Avatar`）流用、新規 primitive を生やさない。
