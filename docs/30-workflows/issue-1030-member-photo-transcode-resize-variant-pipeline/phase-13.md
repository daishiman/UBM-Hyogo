# Phase 13 — PR 作成（Gate-C / user-gated）

> **実装区分: 実装仕様書**。本フェーズの PR 作成は **user の明示承認後のみ**（Gate-C）。
> commit / push / PR 作成 / migration 0023 apply / GitHub Issue mutation は **すべて user-gated**。
> base ブランチ = **dev**（既定。production リリース時のみ `dev → main`）。

## 0. 実行ゲート

| アクション | ゲート |
|------------|--------|
| git commit / push | user 明示承認後のみ |
| `gh pr create --base dev` | user 明示承認後のみ |
| migration `0024_member_photos_variants.sql` apply | user-gated（`bash scripts/cf.sh d1 migrations apply`） |
| GitHub Issue #1030 の状態変更 | **行わない**（#1030 は CLOSED 維持・reopen しない） |

## 1. 調査結論（PR 本文 冒頭に記載）

- **別タスク未解決**: variant 配信は dev / 現 branch ともに未実装（#983 基盤=PR #1038 のみ dev 済）。本タスクは #983 surface への純粋な機能追加。
- **根本解 = client-side variant**: サーバ/外部の有料画像処理（Cloudflare Images / Image Resizing）を **却下**し、admin ブラウザの Canvas で display(≤512px webp) + thumb(96px cover webp) を生成して multipart 送信（無料枠維持・ADR-1030）。
- **Issue は CLOSED 維持**: #1030 は CLOSED のまま。reopen しない。本 PR は spec 駆動で `Refs #1030` として関連付けるのみ。

## 2. PR 本文構成（`.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として反映）

1. **概要**: member photo variant pipeline（client-side Canvas 生成 + thumb/display 配信）。
2. **調査結論**: 上記 §1（未解決 → client-side variant → CLOSED 維持）。
3. **設計サマリ（Phase 2 / ADR-1030）**: 方式比較表 / variant key（`avatar`=display・`thumb`=新規兄弟 key）/ migration 0023（後方互換 ADD COLUMN）/ fallback 3 段。
4. **受入条件マッピング**: AC-1..5（Phase 1）。
5. **変更ファイル一覧**: 下記 §3。
6. **Phase 11 証跡**: local visual harness screenshot は取得済み。authenticated staging screenshot は deploy 後の user-gated。
7. **後方互換 / 無料枠 invariant**: 旧 client 受理・既存行 NULL 維持・サーバ処理ゼロ。
8. **user-gated 事項**: migration apply / staging deploy / 撮影 / Issue mutation。

> `outputs/phase-11/screenshots/member-avatar-variant-fallback-local.png` は local visual evidence として存在する。PR 本文では authenticated staging screenshot が未取得であることも併記する。

## 3. 含まれる変更ファイル一覧

| レイヤ | ファイル | 区分 |
|--------|----------|------|
| migration | `apps/api/migrations/0024_member_photos_variants.sql` | 新規 |
| presign | `apps/api/src/lib/r2/member-photo-presign.ts` | 編集（thumb key/定数/型 追加） |
| repository | `apps/api/src/repository/memberPhotos.ts` | 編集（4 列・upsert 拡張） |
| route | `apps/api/src/routes/admin/members.ts` | 編集（detail thumb presign / POST multipart 拡張 / DELETE 両 key） |
| shared | `packages/shared`（MemberDetail viewmodel） | 編集（`photoThumbUrl?`） |
| web util | `apps/web/src/lib/admin/image-resize.ts` | 新規（`buildMemberPhotoVariants`） |
| web component | `apps/web/src/features/admin/components/_members/MemberAvatar.tsx` | 編集（`photoThumbUrl?` / size→variant 選択） |
| web component | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集（`PhotoUploadAffordance` 配線） |
| tests | `member-photo.contract.spec.ts` / `image-resize.spec.ts`（新規） / `MemberAvatar.spec.tsx` | 新規/編集（`*.spec.{ts,tsx}` のみ・invariant #8） |

> 実際の差分一覧は PR 作成前に `git diff dev...HEAD --name-only` で確定し、PR 本文に漏れなく反映する。

## 4. PR 作成前チェック（実装完了後・承認後に実施）

- [ ] `git status --porcelain` が空（全変更 commit 済み）
- [ ] `git diff dev...HEAD --name-only` を PR 含有ファイル一覧として取得
- [ ] `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` 通過
- [ ] Phase 11 local screenshot と authenticated staging screenshot pending を本文に明記
- [ ] `gh pr create --base dev`（#1030 は CLOSED 維持・reopen しない）

## 完了条件（Phase 13）

- [x] PR 本文構成・調査結論・変更ファイル・Phase 11 証跡境界・user-gated 事項を定義
- [x] base=dev / Issue CLOSED 維持 / 全ミューテーション user-gated を明記
- [ ] PR 作成（**user 明示承認後のみ**・本フェーズでは未実行）
