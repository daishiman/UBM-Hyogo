---
workflow_id: mypage-prototype-alignment
workflow_state: implemented_local_evidence_captured
created_at: 2026-05-23
owner: daishiman
taskType: implementation
implementation_mode: existing-ui-alignment
visualEvidence: VISUAL
prototype_source: docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx
prototype_coverage: MyProfilePage (pages-member.jsx:219-371) + RevalidateModal
---

# マイページ（/profile）プロトタイプ整合 + 編集導線整備

## 実装区分

`[実装区分: 実装仕様書]` — `apps/web/app/profile/` 配下のコード変更を伴う。CONST_004 のデフォルト（実装仕様書）に従う。

## 真の論点（要件レビュー一次結論）

| 観点 | 結論 |
|------|------|
| 真の論点 | 「マイページの編集画面・動線がない」というユーザー認識の主因は、(a) `/profile` が prototype の視覚設計（page-head / Card / Stat grid / Avatar preview / RevalidateModal / danger-zone）を持たず bare HTML で描画されている、(b) 編集導線（Google Form 再回答 CTA）が地味で発見しづらい、(c) `/profile` への global 動線が `MemberHeader` のテキストリンク1本のみ、の3点。**インライン本文編集の不在ではない**（プロトタイプ自身も「編集 = Google Form 再回答」モデル）。 |
| 編集モデル | **プロトタイプ準拠**（ユーザー確認済 2026-05-23）。`編集 = Google Form を開いて更新`。アプリ内インライン編集・新規 PATCH endpoint は作らない。 |
| 依存・責務境界 | `apps/web` は `/me/*` の **GET（`/me`, `/me/profile`）と POST（`/me/visibility-request`, `/me/delete-request`）のみ**を消費。D1 直接アクセス・新規 endpoint・Google Form schema 変更は禁止（CLAUDE.md 不変条件 #4/#5/#7、UI prototype alignment 不変条件1）。 |
| 価値とコスト | 価値: 会員が自分の公開状態・回答内容を一目で把握し、更新導線へ迷わず到達できる。コスト最大部品: prototype の視覚再現（Card/Stat/Avatar/Modal 合成）。ただし primitives は `apps/web/src/components/ui/` に既存のため新規 primitive 実装ゼロ。 |
| 改善優先順位 | (1) page.tsx の page-head + 動線 → (2) 状態可視化（StatusBanner + VisibilitySummary Stat grid）→ (3) ProfilePreview + ProfileFields の Card/KVList 化 → (4) EditCta + RevalidateModal → (5) danger-zone styling → (6) MemberHeader 動線強化。 |
| 4条件評価 | 価値性◯（会員の自己管理コストを下げる）/ 実現性◯（既存 primitives + 既存 API で1サイクル完了）/ 整合性◯（不変条件と矛盾なし）/ 運用性◯（verify-design-tokens + Playwright smoke で回帰保護）。 |

## 目的

`docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` の `MyProfilePage`（L219-371）を正本に、`apps/web/app/profile/`（会員マイページ）を **prototype 準拠の視覚構成へ整え、編集導線（Google Form 再回答）と公開ページ確認・状態可視化を発見しやすくする**。既存 API surface（`/me/*` GET + visibility/delete-request POST）は一切変更しない。

## スコープ

| 含む | 含まない |
|------|---------|
| `page.tsx` に prototype の page-head（eyebrow / h1 / muted / btn-row）を追加 | 新規 API endpoint 追加 |
| 「公開ページを見る」(→ `/members/[id]`) / 「情報を更新する」(→ RevalidateModal) 動線追加 | D1 schema 変更 / PATCH endpoint 追加 |
| StatusSummary を status banner（Banner）+ VisibilitySummary（Stat grid-3: public/member/admin）へ整備 | アプリ内インライン本文編集 |
| ProfilePreview（Avatar hero-split）+ ProfileFields の Card/KVList グループ化 | Google Form 仕様変更 |
| EditCta を prototype の prominent button + RevalidateModal（Modal primitive）へ整備 | 既存 primitives（`ui/`）の API 変更 |
| RequestActionPanel を danger-zone Card 構成へ整備（既存 visibility/delete-request POST のまま） | プロトタイプ自身の修正 |
| `MemberHeader` の動線強化（マイページ / 公開ページ / ログアウト） | AttendanceList のページング仕様変更 |
| OKLch tokens（`apps/web/src/styles/tokens.css`）のみで配色。HEX 直書き禁止 | 新規 primitive の追加 |
| Playwright smoke（4 領域 + Modal open）+ verify-design-tokens gate への追記 | |

## 不変条件（CLAUDE.md UI prototype alignment セクションを継承）

1. **既存 API のみ接続**: `/me`, `/me/profile`（GET）, `/me/visibility-request`, `/me/delete-request`（POST）。新規 endpoint・D1 schema 変更・Google Form 仕様変更は禁止。
2. **本文編集 UI 非描画**: `apps/web/app/profile/` 配下に `<input>` / `<textarea>` による本文編集 form を置かない（EditCta はリンク / ボタン / Modal のみ）。`apps/api/src/routes/me/*` に PATCH を mount しない。
3. **OKLch トークン正本化**: 色は `apps/web/src/styles/tokens.css` と `docs/00-getting-started-manual/specs/design-tokens.md` が正本。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。
4. **プロトタイプ正本順位**: `claude-design-prototype/pages-member.jsx` MyProfilePage を視覚正本とし、既存 primitives（`apps/web/src/components/ui/`）のみで構成。新規 primitive を生やさない。
5. **D1 直接アクセス禁止**: `apps/web` から D1 binding 禁止。`fetchAuthed` 経由のみ。
6. **stableKey 経由参照のみ**: profile.sections の field 参照は `stableKey` 経由（`questionId` 依存禁止）。
7. **consent キー統一**: `publicConsent` / `rulesConsent`。
8. **新規 test ファイルは `*.spec.{ts,tsx}` のみ**。

## 正本順位（衝突時の優先度）

1. CLAUDE.md 重要な不変条件 + UI prototype alignment 不変条件
2. 本 workflow の `outputs/phase-{1,2,3}/phase-N.md`
3. `docs/00-getting-started-manual/specs/*.md`
4. プロトタイプ（`claude-design-prototype/pages-member.jsx`）

> 既存 API endpoint surface と UI 期待 shape が乖離する場合は、API を変更せず UI 側に adapter 層（`apps/web/app/profile/_lib/`）を置く。

## フェーズ構成

| Phase | 名称 | 成果物 | 状態 |
|-------|------|--------|------|
| 1 | 要件定義 | `outputs/phase-1/phase-1.md` | completed |
| 2 | 設計 | `outputs/phase-2/phase-2.md` | completed |
| 3 | 設計レビュー | `outputs/phase-3/phase-3.md` | completed |
| 4 | テスト作成 | `outputs/phase-4/phase-4.md` | completed |
| 5 | 実装 | `outputs/phase-5/phase-5.md` | completed |
| 6 | テスト拡充 | `outputs/phase-6/phase-6.md` | completed |
| 7 | カバレッジ確認 | `outputs/phase-7/phase-7.md` | completed |
| 8 | リファクタリング | `outputs/phase-8/phase-8.md` | completed |
| 9 | 品質保証 | `outputs/phase-9/phase-9.md` | completed |
| 10 | 最終レビュー | `outputs/phase-10/phase-10.md` | completed |
| 11 | 手動テスト（3層評価） | `outputs/phase-11/phase-11.md` | completed |
| 12 | ドキュメント更新 | `outputs/phase-12/phase-12.md` | completed |
| 13 | PR作成 | `outputs/phase-13/phase-13.md` | pending_user_approval |

## 実装サブタスク（1サイクル完了・CONST_007）

全サブタスクは後続実装プロンプト（03.実装.md）の **1サイクル内で完了**する。先送り・別PR分離はしない。

| ID | サブタスク | 主対象ファイル |
|----|-----------|----------------|
| ST-1 | page.tsx page-head + 動線 | `apps/web/app/profile/page.tsx` |
| ST-2 | StatusBanner + VisibilitySummary（Stat grid-3） | `_components/StatusSummary.tsx`, `_components/VisibilitySummary.tsx`(new), `_lib/visibility-counts.ts`(new) |
| ST-3 | ProfilePreview（Avatar hero）+ ProfileFields（Card/KVList） | `_components/ProfilePreview.tsx`(new), `_components/ProfileFields.tsx` |
| ST-4 | EditCta + RevalidateModal | `_components/EditCta.tsx`, `_components/RevalidateModal.tsx`(new) |
| ST-5 | RequestActionPanel danger-zone Card | `_components/RequestActionPanel.tsx` |
| ST-6 | MemberHeader 動線強化 | `apps/web/src/components/layout/MemberHeader.tsx` |

## 関連ドキュメント

- 前タスク: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/06-screens-member/task-14-w5-par-my-profile-and-requests.md`（4 領域分割の初期実装）
- 正本仕様: `docs/00-getting-started-manual/specs/01-api-schema.md`, `13-mvp-auth.md`
- design tokens: `apps/web/src/styles/tokens.css`, `docs/00-getting-started-manual/specs/design-tokens.md`
