# Phase 10: 最終レビュー（受入条件突合 / blocker 判定）

> workflow: mypage-prototype-alignment
> taskType: `implementation` / VISUAL
> 目的: Phase 1 で固定した DoD（受入条件 1-9）を実装結果と突合し、Phase 12 への進行可否を判定する。MINOR 指摘は同一サイクル修正を先に検討し、修正が破綻する場合のみ Phase 12 で理由付き未タスク化する（「機能に影響なし」は不要判定の理由にならない）。

## 10.1 レビュー方針

- 本 Phase は **最終レビューゲート**。実装サイクル（後続 `03.実装.md`）完了後に本ファイルの突合表へ実測結果を埋める。本仕様書段階では各受入条件に対する確認手順・PASS 基準・証跡参照先を定義する。
- 判定区分は `PASS` / `MINOR` / `BLOCKER` の3段階とする。
  - `PASS`: 受入条件を満たし証跡あり。
  - `MINOR`: 機能要件は満たすが品質・体験・周辺整備に改善余地。**同一サイクル修正を第一選択**とし、技術的・整合性的に破綻する場合だけ Phase 12 Task 12-4 で理由付き未タスク化する。
  - `BLOCKER`: 受入条件未達。Phase 12 へ進めず実装サイクルへ差し戻す。
- 不変条件（CLAUDE.md / UI prototype alignment 不変条件 1-4）違反は無条件で `BLOCKER`。

## 10.2 受入条件突合表（Phase 1 §1.7 DoD 1-9）

| # | 受入条件（DoD） | 確認手順 | PASS 基準 | 証跡参照 | 判定 |
|---|----------------|----------|-----------|----------|------|
| 1 | `/profile` が prototype `MyProfilePage` の領域構成（page-head / status banner / visibility summary / profile preview / fields / danger zone / revalidate modal）を持つ | `apps/web/app/profile/page.tsx` と `_components/` を目視 + Playwright で 7 領域 DOM 存在確認 | 7 領域すべてが render され、prototype L219-371 の構成順と一致 | `outputs/phase-11/screenshots/profile-page-default.png` / `manual-test-result.md` | （実装後記入） |
| 2 | 編集導線が複数経路で到達可能（page-head「情報を更新する」→ RevalidateModal /「フォームを開く」、fields 近傍の inline 更新導線）。すべて既存 `editResponseUrl` / `fallbackResponderUrl` を使用 | RevalidateModal を open し「フォームを開く」リンクの `href` を検証。inline 導線も同 URL を指すか確認 | `editResponseUrl ?? fallbackResponderUrl` が `target="_blank" rel="noopener noreferrer"` で開く。新規 URL 焼き込みなし | `revalidate-modal-open.png` / `manual-test-result.md` TC-PROF-04 | （実装後記入） |
| 3 | VisibilitySummary が `profile.sections` の field visibility から public/member/admin 件数を表示 | `deriveVisibilityCounts` の unit test 結果 + Stat grid-3 の表示値突合 | 3 件数が adapter 戻り値と一致。Stat × 3 が grid で描画 | `visibility-summary.png` / `visibility-counts.spec.ts` 結果 | （実装後記入） |
| 4 | 「公開ページを見る」が `/members/[memberId]` へ遷移（publishState が hidden の場合は無効化 or 非表示） | publishState=public / member_only / hidden の 3 状態でリンク挙動確認 | public→有効リンク、member_only/hidden→`aria-disabled` + 理由 title | `status-banner-public.png` / component test | （実装後記入） |
| 5 | `MemberHeader` から マイページ / 公開ページ / ログアウト に到達できる | `MemberHeader` の nav リンク + SignOutButton を目視 + `data-testid="member-header"` 維持確認 | 3 導線すべて到達可能。既存 testid 破壊なし | `member-header-nav.png` / `MemberHeader.spec.tsx` 結果 | （実装後記入） |
| 6 | 配色は OKLch tokens のみ（HEX 直書き 0 件、`verify-design-tokens` PASS） | `mise exec -- pnpm exec ...`（verify-design-tokens gate）+ `grep -rn` で HEX/`bg-[#` 検出 | HEX 直書き 0 件、gate PASS | `documentation-changelog.md` の gate 結果 | （実装後記入） |
| 7 | 既存 `/me/*` API surface 変更 0 件（diff に `apps/api/src/routes/me/` 変更を含まない） | `git diff dev...HEAD --name-only` に `apps/api/src/routes/me/` が含まれないこと | API ファイル diff 0 件 | `outputs/phase-13/change-summary.md` | （実装後記入） |
| 8 | `pnpm typecheck` / `pnpm lint` PASS、targeted test GREEN | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / targeted test（Phase 1 §1.6） | 3 コマンドすべて PASS / GREEN | `manual-test-result.md` 実行記録 | （実装後記入） |
| 9 | Playwright smoke で 4 領域表示 + RevalidateModal open が確認できる | Playwright smoke 実行ログ + screenshot | smoke GREEN、4 領域 + Modal open キャプチャ取得 | `outputs/phase-11/screenshots/` 一式 | （実装後記入） |

> 突合の実測は実装サイクル完了後に行う。本仕様書段階では「全条件 PASS、MINOR/BLOCKER 0 件」を目標基準として固定する。

## 10.3 不変条件再確認（BLOCKER 判定の根拠）

| 不変条件 | 確認方法 | 違反時 |
|----------|----------|--------|
| 既存 API のみ接続（新 endpoint / D1 schema / Form 仕様変更禁止） | `git diff` で `apps/api/` / migrations / Form schema 変更なし | BLOCKER |
| OKLch トークン正本化（HEX 直書き禁止） | `verify-design-tokens` gate | BLOCKER |
| プロトタイプ正本順位（新規 primitive 禁止） | `apps/web/src/components/ui/` への新規 primitive 追加なし（合成 component のみ） | BLOCKER |
| D1 直接アクセス禁止（`apps/web` から binding 禁止） | `apps/web/app/profile/` 内に D1 binding 参照なし、fetchAuthed 経由のみ | BLOCKER |
| 本文編集 UI 非描画（不変条件 #2） | `<input>`/`<textarea>` による本文編集なし。編集は Form リンクのみ | BLOCKER |

## 10.4 MINOR 指摘の取り扱い（Phase 12 連携）

- Phase 10 で `MINOR` 判定した指摘は **すべて** Phase 12 Task 12-4（`unassigned-task-detection.md`）へ転記し、同一サイクルで修正可能なものは先に修正する。
- 同一サイクルで修正すると技術的・整合性的に破綻する場合だけ、理由・実施時期・配置先を明記して未タスク化する。「機能に影響なし」を理由に記録を省略しない。
- MINOR 指摘は Phase 12 の MINOR 追跡テーブルへ `MINOR ID` 付きで記録する。

## 10.5 スコープ外項目の整理（candidate registry — Phase 12 Task 12-4 で再判定）

Phase 1 §1.8 で「スコープ外」と明示した項目を、未タスク化候補ではなく **候補レジストリ** として整理する。これらは本タスクの DoD には含めず、実装後の Phase 10 実測で unresolved follow-up と判定した場合のみ Phase 12 で正式な未タスクに昇格する。

| 候補 ID | 項目 | スコープ外の理由 | 優先度目安 | 種別 |
|---------|------|-----------------|-----------|------|
| UT-MYPAGE-01 | Avatar 画像アップロード（prototype の `editable` Avatar） | 対応 API が存在しない（`/me/*` に upload endpoint なし）。MVP 非対応 | 低 | candidate_only（API/product decision 後に別仕様化） |
| UT-MYPAGE-02 | AttendanceList の視覚整備深掘り | 本タスクは「既存維持 + 最小 Card ラップ」に留める決定（Phase 3 §3.4）。出席履歴の prototype 準拠整備は別 scope | 中 | candidate_only（実装後の MINOR 実測時のみ昇格） |
| UT-MYPAGE-03 | インライン本文編集 | 不変条件 #2 により **恒久的にスコープ外**（MVP では Form 再回答が更新経路）。未タスク化は「将来方針の記録」目的に留め、実装タスク化はしない | 対象外 | 設計決定（恒久スコープ外） |

> UT-MYPAGE-03 は不変条件由来の恒久スコープ外であり、実装未タスクではない。`unassigned-task-detection.md` には「恒久スコープ外（記録のみ）」として分離記載する。

## 10.6 ゲート判定（実装サイクル後に確定）

**判定（仕様書段階の目標）: PASS — Phase 12 へ進行可（BLOCKER 0 件 / MINOR は同一サイクル修正または理由付き未タスク化）**

実装サイクル完了後、以下を満たすことを最終確認する:

- 受入条件 1-9 がすべて `PASS`。
- 不変条件違反 `BLOCKER` 0 件。
- `MINOR` 指摘が存在する場合、同一サイクル修正または Phase 12 Task 12-4 で理由付き未タスク化済み。
- スコープ外候補（UT-MYPAGE-01/02/03）が candidate_only / 記録のみとして整理済み。

## 10.7 成果物

| 成果物 | パス | 用途 |
|--------|------|------|
| 最終レビュー結果 | `outputs/phase-10/phase-10.md`（本ファイル） | DoD 突合 + blocker 判定 + MINOR 未タスク化方針 |

> 実装サイクル時に `final-review-result.md` を別出しする場合は本ファイルの突合表を正本とし、参照リンクを張る。
