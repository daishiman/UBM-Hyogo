# Shared Context — admin-meetings-card-ux-clarity

> 本ファイルは全 Phase / 全 SubAgent が参照する SSOT。実装仕様書の前提・決定事項・不変条件を固定する。

## 1. タスク要旨

staging `/admin/meetings`（開催日管理）の UI/UX が「カードがくっついていて見にくい」「触りにくい」「直感的に分からない」。色は今回スコープ外（ユーザー明示）。開催日カードの分離・展開編集UIの視覚階層・出席者一覧の可読性を、UI/UX エンジニアとして直感的に改善する。

- **実装区分**: `[実装区分: 実装仕様書]`（VISUAL UI task / デフォルト・CONST_004）
- **slug / workflow_id**: `admin-meetings-card-ux-clarity`
- **branch**: `feat/admin-meetings-card-ux-clarity`
- **taskType**: implementation
- **visualEvidence**: `VISUAL_ON_EXECUTION`（staging screenshot は Phase 13 / user-gated）
- **implementation_mode**: `new`
- **implementation_status**: `implemented_local_evidence_captured`（automation-30 改善で実コード実装済。staging screenshot / commit / PR は user-gated）
- **relatedIssue**: null（ユーザー直接依頼）

## 2. 真因（root cause）

**apps/web 表現層の視覚情報設計欠如のみ。API / D1 / Google Form は無罪。**

調査で確定した事実（grounded）:

| 事実 | 根拠 |
|---|---|
| `.admin-timeline`, `.admin-timeline__row`, `.admin-timeline__heading`(base), `.admin-timeline__date`, `.admin-timeline__title`, `.admin-timeline__note` は **マークアップに存在するが CSS 実体なし**（バッジ `.admin-timeline__heading .ui-badge[data-attendance-level]` 以外） | `apps/web/src/styles/globals.css` grep（定義は 1630-1649 のバッジのみ） |
| `.ui-card--flat` 修飾子は **CSS 未定義** | globals.css に `.ui-card--flat` 規則なし |
| `.admin-meeting-drawer` は **CSS 実体なし**（inline `flex flex-col gap-3` のみ） | globals.css grep 0 件 |
| カード間隔は `.admin-timeline.flex.flex-col.gap-2`（8px）のみ | `MeetingTimeline.tsx:31` |
| 展開ドロワー内 4 セクション（編集 / 出席追加 / 一括追加 / 出席者）は弱い gap で境界・見出しなし | `MeetingAttendanceDrawer.tsx:51-169` |
| 出席者行は name + 削除 button が `flex items-center gap-2` で行 chrome なし | `MeetingAttendanceDrawer.tsx:143-164` |

→ 見出し / 展開ドロワー / 出席者行が**ブラウザ既定スタイルのまま**で視覚階層が崩壊。「くっついている」「見にくい」の直接原因。

## 3. スコープ決定（AskUser 確定）

| 論点 | 決定 |
|---|---|
| 展開方式 | **カード内インライン展開を維持**しつつ各セクションを見出し付きサブカード/区切りで整理（右ドロワー化はしない） |
| 実装範囲 | **再利用可能な admin リストカード/詳細セクションの共通 CSS primitive を新設**し、今回は `/admin/meetings` に適用して完結。他 admin 画面（members/tags/audit/schema/requests/identity）への DOM 適用は **同じ primitive を使う別タスク**として未タスク化（理由＝各画面で DOM/テストが異なり 1 PR では CONST_007 抵触） |
| 出席者表示 | **見やすい行リスト**に整える（1人1行・行区切り・削除ボタン右寄せ。チップ化はしない） |
| 色 | 今回スコープ外（既存 OKLch トークンの範囲で整える。新規色追加なし） |

## 4. 不変条件（CONST / invariant）

1. **API 不変**: `apps/api/src/routes/admin/meetings.ts` / `attendance.ts` の endpoint surface・レスポンス shape を一切変更しない（CONST: UI prototype alignment invariant #1）。`git diff dev -- apps/api` は空であること（AC で検証）。
2. **D1 直接アクセス禁止**継続。`apps/web` から binding を触らない。
3. **OKLch トークン正本**: 色・spacing・radius・shadow は `apps/web/src/styles/tokens.css` の `var(--ubm-*)` 経由のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。`pnpm verify:tokens` green（CI gate `verify-design-tokens`）。
4. **新規 primitive を増やしすぎない**（invariant #3）。原則は**既存マークアップにある BEM クラスを CSS 実体化**することが主。新設するのは汎用詳細セクション/行 primitive の最小限のみ。
5. **DOM / test contract 保持**: 既存 `data-testid` / `aria-label` / `role` / `<select>` / `<button>` / `<input>` を変更・削除しない。変更は **wrapper 要素の追加と className 付与、セクション見出しの追加、表示テキストの軽微調整**に限る。既存 vitest（下記）を破壊しない。
6. **FormField / useAdminMutation 経由維持**（invariant #9/#10）。新規 `<input>` を直書きしない。
7. commit / push / PR / staging deploy / screenshot は **Phase 13 user-gated**。実コード実装・local validation・skill 同期は本サイクル内で完了する。

## 5. 変更対象ファイル一覧

| # | path | 種別 | 概要 |
|---|------|------|------|
| F1 | `apps/web/src/styles/globals.css` | 編集 | 未定義 BEM クラスの CSS 実体化（`.admin-timeline*`, `.ui-card--flat`, `.admin-meeting-drawer`）＋汎用 primitive 新設（`.admin-detail-section*`, `.admin-attendee-row*`）。全て `var(--ubm-*)` 経由 |
| F2 | `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | 編集 | 展開内 4 セクションを `.admin-detail-section` で見出し付きサブカード化。出席者行を `.admin-attendee-row` chrome へ。出席者見出しに人数 `(N名)` を表示。data-testid/aria/role 不変、wrapper 追加のみ |
| F3 | `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx` | 編集 | heading レイアウト用の軽微な wrapper（`.admin-timeline__meta`）追加の可能性。data-testid/aria 不変 |
| T1 | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx` | 編集 | セクション見出し（編集/出席を追加/出席者）の存在・出席者人数表示の構造検証を追加。既存ケース維持 |
| T2 | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx` | 編集 | card chrome class 付与・heading 構造の構造検証を追加（role/testid 主体・脆い視覚 assert は禁止）。既存ケース維持 |

> jsdom は CSS/@media を評価しないため、テストは**構造（クラス付与・見出しテキスト・人数・role）**に限定し、視覚（色/影/余白の px）を assert しない。

## 6. 新設/実体化する CSS 契約（F1）

全て既存 token 経由。新規 HEX/色なし。

### 6.1 既存 BEM クラスの実体化

| class | 役割 | 主な宣言（token のみ） |
|---|---|---|
| `.admin-timeline` | カード列 | `display:flex; flex-direction:column; gap:var(--ubm-space-3)`（8→12px で分離強化） |
| `.admin-timeline__row` | 行ラッパー | `display:block` |
| `.ui-card--flat` | フラットカード修飾 | `box-shadow:none; border:1px solid var(--ubm-color-border-default)`（影を消し境界線で分離＝「くっつき」解消）。`data-selected` で accent border + soft bg |
| `.admin-timeline__heading` | 見出しボタン | `display:flex; align-items:center; gap:var(--ubm-space-3); width:100%; padding:var(--ubm-space-3) var(--ubm-space-4); background:transparent; border:0; cursor:pointer; text-align:left`＋`:hover`/`:focus-visible` |
| `.admin-timeline__date` | 開催日 | `font-variant-numeric:tabular-nums; color:var(--ubm-color-text-secondary); font-weight:600` |
| `.admin-timeline__title` | タイトル | `font-weight:700; flex:1 1 auto` |
| `.admin-timeline__note` | メモ | `margin:0; padding:0 var(--ubm-space-4) var(--ubm-space-3); color:var(--ubm-color-text-muted); font-size:var(--ubm-text-sm)` |
| `.admin-meeting-drawer` | 展開コンテナ | `display:flex; flex-direction:column; gap:var(--ubm-space-3); padding:var(--ubm-space-4); border-top:1px solid var(--ubm-color-border-default); background:var(--ubm-color-surface-panel-2)`（ヘッダと展開部を視覚分離） |

### 6.2 新設の汎用 primitive（再利用可能・他 admin 詳細ドロワーが将来採用可）

| class | 役割 | 主な宣言 |
|---|---|---|
| `.admin-detail-section` | 見出し付きサブカード | `display:flex; flex-direction:column; gap:var(--ubm-space-2); padding:var(--ubm-space-3); border:1px solid var(--ubm-color-border-default); border-radius:var(--ubm-radius-sm); background:var(--ubm-color-surface-panel)` |
| `.admin-detail-section__title` | セクション見出し | `margin:0; font-size:var(--ubm-text-sm); font-weight:700; color:var(--ubm-color-text-secondary)` |
| `.admin-detail-section__body` | セクション本体 | `display:flex; flex-direction:column; gap:var(--ubm-space-2)` |
| `.admin-attendee-list` | 出席者リスト | `display:flex; flex-direction:column; gap:var(--ubm-space-1)` |
| `.admin-attendee-row` | 出席者行 | `display:flex; align-items:center; justify-content:space-between; gap:var(--ubm-space-2); padding:var(--ubm-space-2) var(--ubm-space-3); border-radius:var(--ubm-radius-sm); background:var(--ubm-color-surface-bg)`（行区切り＝交互/境界で可読性） |
| `.admin-attendee-row__name` | 氏名 | `display:flex; align-items:baseline; gap:var(--ubm-space-1); min-width:0` |

> 既存 `.bulk-attendance*`（一括追加）は既にスタイル済（globals.css 198-250）。今回は触らず、`.admin-detail-section` のリズムと整合する余白のみ確認。

## 7. DOM 改修（F2/F3）詳細

### MeetingAttendanceDrawer.tsx（F2）
- 全体 `.admin-meeting-drawer`（既存）維持。
- 「編集」`<details>` を `<section class="admin-detail-section">` でラップ（`<summary>編集</summary>` は維持）。
- 「出席を追加」`<div role="group" aria-label="出席追加">` を `.admin-detail-section` 化し、`<h4 class="admin-detail-section__title">出席を追加</h4>` を追加（`role="group"`/`aria-label` 維持）。
- 「出席者」ブロックを `.admin-detail-section` 化。見出しを `出席者 (${attended.size}名)` に。`<ul class="admin-attendee-list">`、各 `<li>` に `.admin-attendee-row`、氏名を `.admin-attendee-row__name` で包む。**`data-testid="attendance-attendee-*"` / `data-member` / `data-testid="remove-attendance-*"` は li/button にそのまま残す**。
- `BulkAttendanceChecklist` / `BulkAttendanceModal` は呼び出し維持（必要なら `.admin-detail-section` で囲まず既存 `.bulk-attendance` のまま＝二重枠回避）。

### MeetingTimeline.tsx（F3）
- `article.ui-card.ui-card--flat` 構造維持。`button.admin-timeline__heading` 内の date/title/badge を `.admin-timeline__date` / `.admin-timeline__title` / 既存 badge のまま。必要なら title+badge を `<span class="admin-timeline__meta">` で軽くまとめる（任意・data-testid 不変）。
- `data-testid="meeting-row-*"` / `attendance-list-session-*` / `meeting-attendance-count-*`、`aria-label`、`aria-expanded` 全て維持。

## 8. 接続 API（不変・参照のみ）

| Method | Path | 用途 |
|---|---|---|
| GET | `/admin/meetings` | 一覧 |
| POST | `/admin/meetings` | 作成 |
| PATCH | `/admin/meetings/:id` | 更新/論理削除 |
| POST | `/admin/meetings/:sessionId/attendance` | 単体出席追加 |
| POST | `/admin/meetings/:sessionId/attendance/import?dryRun=false` | 一括追加 |
| DELETE | `/admin/meetings/:sessionId/attendance/:memberId` | 出席削除 |

いずれも**変更しない**。UI は既存 `useAdminMutation` ハンドラ経由のまま。

## 9. テスト方針（T1/T2）

既存 spec（全 PASS 維持）:
- `MeetingsClientShell.spec.tsx`（一括追加 commit / state / toast）
- `MeetingTimeline.spec.tsx`（empty state / attendance level badge / onSelect）
- `MeetingAttendanceDrawer.spec.tsx`（出席者氏名/ID 表示・候補外の memberId 表示）
- `BulkAttendanceChecklist.spec.tsx`（複数選択→一括→選択解除）

追加ケース（構造検証のみ）:
- DR-1: 展開ドロワーに「編集」「出席を追加」「出席者」の3セクション見出し（`.admin-detail-section__title` または heading role）が存在する。
- DR-2: 出席者見出しに人数 `(N名)` が表示される（`attended.size` 反映）。
- DR-3: 各出席者行に `.admin-attendee-row` が付与され、`data-testid="attendance-attendee-*"` / `remove-attendance-*` が保持される。
- TL-1: 各カードに `.ui-card--flat` が付与され、`data-testid="meeting-row-*"` / `meeting-attendance-count-*` が保持される。

実行コマンド（ローカル・worktree ルートから）:
```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/BulkAttendanceChecklist.spec.tsx
```

## 10. DoD（Definition of Done）

- [ ] `mise exec -- pnpm typecheck` green
- [ ] `mise exec -- pnpm lint` green（必要時 `--fix`）
- [ ] 上記 vitest（既存4 + 追加ケース）全 PASS
- [ ] `mise exec -- pnpm verify:tokens` green（HEX 0 / token 経由）
- [ ] `git diff dev -- apps/api` が空（API 不変・AC 検証）
- [ ] `grep -rn "bg-\[#\|text-\[#" apps/web/src/features/admin/components/_meetings apps/web/src/styles/globals.css` で新規 HEX 0
- [x] data-testid contract 保持（wrapper移動で diff 上の削除/追加は出るが、同一IDが追加後にも存在し focused tests で利用可能）
- [ ] Phase 11 local screenshot（desktop/mobile・展開/折りたたみ）は Playwright fixture で取得
- [ ] Phase 11 staging screenshot は user-gated で取得

## 11. 未タスク候補（baseline / 今回スコープ外）

| ID | 内容 | 理由 | 実施場所 |
|---|---|---|---|
| OOS-1 | 他 admin 一覧（members/tags/audit/schema/requests/identity）への共通 primitive DOM 適用 | 各画面で DOM/テストが異なり 1 PR では CONST_007 抵触 | 別タスク（同 primitive を使う follow-up） |
| OOS-2 | 開催日カードの色設計見直し（コントラスト/階調） | ユーザーが今回「色は置いておく」と明示 | 別タスク（色トークン調整） |
| OOS-3 | 右スライドドロワー化（一覧と編集の完全分離） | 今回「インライン展開維持」を選択 | 将来 UX 検討 |
| OOS-4 | 出席者のチップ/タグ集約表示 | 今回「行リスト」を選択 | 将来 UX 検討 |
| OOS-5 | 既存 globals.css が参照する `--ubm-color-border-subtle` が tokens.css に未定義 | **解消済** | automation-30 改善で既存参照を `--ubm-color-border-default` に収束。新規 token 追加は `verify:tokens` drift になるため不採用 |

> **調査メモ**: 新規 CSS でも既存 bulk attendance でも `--ubm-color-border-default`（定義済）に統一した。新規 `--ubm-color-border-subtle` 追加は 09b design-token 正本 drift のため採用しない。

## 12. 4 条件 verdict（事前）

| 条件 | 判定 | 根拠 |
|---|---|---|
| 矛盾なし | PASS | API/D1/Form 不変。表現層 CSS+wrapper のみ。token 正本に整合 |
| 漏れなし | PASS | カード分離 / 展開階層 / 出席者行の3課題を F1-F3 で網羅。DoD で検証 |
| 整合性あり | PASS | 既存 BEM 実体化 + 汎用 primitive 最小新設。invariant #3/#9/#10 準拠 |
| 依存関係整合 | PASS | apps/web 単独完結。staging/visual/commit は user-gated 分離 |
