# Implementation Guide (Phase 12 strict 7)

**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

実装の正本は **`outputs/phase-4/phase-4.md`** と **`../../shared-context.md`** を参照すること。本ファイルは PR 本文 / レビュー entry の集約ビュー（CONST_005 必須 5 項目: 背景 / 要約 / 実装ステップ / 検証コマンド / 既知制限 を充足）。

本ガイドは 2 部構成:

- **Part 1**: 中学生でも分かる説明（日常の例え話・専門用語なし・「なぜ」→「何を」の順）
- **Part 2**: 技術者向け（TypeScript 型 / CSS クラス契約 / API 例 / エラー / パラメータ一覧）

---

# Part 1 — 中学生にも分かる説明（なぜ → 何を）

## なぜ直すの？

学校の掲示板を思い浮かべてください。お知らせの紙が何枚も、**すき間なくベタベタと貼られている**と、どこからどこまでが 1 枚の紙なのか分かりにくいですよね。今の「開催日の管理ページ」がまさにこの状態です。

- 開催日のカード（1 回の集まりの情報をまとめた箱）どうしが **くっついていて**、境目が見えない。
- カードを開くと、中に「編集する場所」「出席した人を追加する場所」「出席した人の名前リスト」が出てきますが、**それぞれに見出し（タイトル）が無く**、どこが何の場所か分からない。
- 出席した人の名前が **ただ縦に並んでいるだけ**で、1 行ずつの区切りが無く読みにくい。

これは「データが間違っている」わけではありません。**見た目を整える飾り（デザインの指示書）が抜けていた**だけです。料理に例えると、材料も味も正しいのに、お皿にぐちゃっと盛りつけてあるので美味しそうに見えない、という状態です。

## 何をするの？

お皿への盛りつけ方（＝デザインの指示書）を書き足します。中身（データ）や、データを取ってくる仕組み（裏側のプログラム）は **一切さわりません**。

1. **カードとカードの間にすき間を空ける**。さらに、カードの周りに薄い線（枠）を付けて、影を消します。これで 1 枚 1 枚がはっきり分かれて見えます。
2. **カードを開いたときの中身に、見出しを付ける**。「編集」「出席を追加」「出席者」という小さなタイトルを付けて、それぞれを小さな箱（サブカード）に入れます。
3. **出席した人のリストを、1 人ずつの行に整える**。行ごとに薄い背景を付け、削除ボタンを右端にそろえます。見出しには「出席者（3名）」のように **人数** も出します。

色は今回は変えません（変えるのは別の作業にします）。すでに決まっている色のルール（OKLch トークンという「使ってよい色の一覧」）の中だけで整えます。

## どうやって確かめるの？

- 文字や名前がちゃんと表示されるか、ボタンが押せるかは、自動テスト（ロボットが自動でチェックする仕組み）で確認します。
- 「すき間が空いて見やすくなったか」「枠で分かれて見えるか」は、本番に近い環境（staging）で **画面写真（スクリーンショット）** を撮って、人の目で確認します。この写真撮りは、あなた（ユーザー）の許可をもらってから行います。

---

# Part 2 — 技術者向け

## 1. 背景

staging `/admin/meetings`（開催日管理）の UI/UX が「カードがくっついていて見にくい / 触りにくい / 直感的に分からない」と報告された。調査で確定した真因は **apps/web 表現層の視覚情報設計欠如のみ**。マークアップに存在する BEM クラス（`.admin-timeline*`, `.admin-meeting-drawer`, `.ui-card--flat`）の **CSS 実体が `apps/web/src/styles/globals.css` に存在せず**（バッジ `.admin-timeline__heading .ui-badge[data-attendance-level]` のみ定義・globals.css 1630-1649）、見出し / 展開ドロワー / 出席者行がブラウザ既定スタイルのまま描画され視覚階層が崩壊している。API（`apps/api/src/routes/admin/meetings.ts` / `attendance.ts`）/ D1 / Google Form は無罪。

## 2. 変更スコープ一行サマリー

既存マークアップにある未定義 BEM クラスを `var(--ubm-*)` トークン経由で CSS 実体化し、展開ドロワー内 4 セクションを見出し付きサブカード（汎用 primitive `.admin-detail-section`）に整理、出席者を行リスト（`.admin-attendee-row`）化する。DOM の data-testid/aria/role は不変、wrapper 追加と className 付与のみ。

## 3. ファイル変更マップ（shared-context §5 から転記）

| # | path | 種別 | 概要 |
|---|------|------|------|
| F1 | `apps/web/src/styles/globals.css` | 編集 | 未定義 BEM クラスの CSS 実体化（`.admin-timeline*`, `.ui-card--flat`, `.admin-meeting-drawer`）＋汎用 primitive 新設（`.admin-detail-section*`, `.admin-attendee-list`, `.admin-attendee-row*`）。全て `var(--ubm-*)` 経由 |
| F2 | `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | 編集 | 展開内 4 セクションを `.admin-detail-section` で見出し付きサブカード化。出席者行を `.admin-attendee-row` chrome へ。出席者見出しに人数 `(N名)` を表示。data-testid/aria/role 不変、wrapper 追加のみ |
| F3 | `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx` | 編集 | heading レイアウト用の軽微な wrapper（`.admin-timeline__meta`・任意）追加。data-testid/aria 不変 |
| T1 | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx` | 編集 | DR-1〜DR-3（セクション見出し / 人数 / 行 class）構造検証追加。既存ケース維持 |
| T2 | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx` | 編集 | TL-1（card chrome class）構造検証追加。既存ケース維持 |

## 4. CSS クラス契約（F1・全て `var(--ubm-*)` 経由・新規 HEX 0）

### 4.1 既存 BEM クラスの実体化

| class | 役割 | 主な宣言（token のみ） |
|---|---|---|
| `.admin-timeline` | カード列 | `display:flex; flex-direction:column; gap:var(--ubm-space-3)`（8→12px で分離強化） |
| `.admin-timeline__row` | 行ラッパー | `display:block` |
| `.ui-card--flat` | フラットカード修飾 | `box-shadow:none; border:1px solid var(--ubm-color-border-default)`。`[data-selected]` で accent border + soft bg |
| `.admin-timeline__heading` | 見出しボタン | `display:flex; align-items:center; gap:var(--ubm-space-3); width:100%; padding:var(--ubm-space-3) var(--ubm-space-4); background:transparent; border:0; cursor:pointer; text-align:left` ＋ `:hover` / `:focus-visible` |
| `.admin-timeline__date` | 開催日 | `font-variant-numeric:tabular-nums; color:var(--ubm-color-text-secondary); font-weight:600` |
| `.admin-timeline__title` | タイトル | `font-weight:700; flex:1 1 auto` |
| `.admin-timeline__note` | メモ | `margin:0; padding:0 var(--ubm-space-4) var(--ubm-space-3); color:var(--ubm-color-text-muted); font-size:var(--ubm-text-sm)` |
| `.admin-meeting-drawer` | 展開コンテナ | `display:flex; flex-direction:column; gap:var(--ubm-space-3); padding:var(--ubm-space-4); border-top:1px solid var(--ubm-color-border-default); background:var(--ubm-color-surface-panel-2)` |

### 4.2 新設の汎用 primitive（再利用可能・他 admin 詳細ドロワーが将来採用可・OOS-1）

| class | 役割 | 主な宣言 |
|---|---|---|
| `.admin-detail-section` | 見出し付きサブカード | `display:flex; flex-direction:column; gap:var(--ubm-space-2); padding:var(--ubm-space-3); border:1px solid var(--ubm-color-border-default); border-radius:var(--ubm-radius-sm); background:var(--ubm-color-surface-panel)` |
| `.admin-detail-section__title` | セクション見出し | `margin:0; font-size:var(--ubm-text-sm); font-weight:700; color:var(--ubm-color-text-secondary)` |
| `.admin-detail-section__body` | セクション本体 | `display:flex; flex-direction:column; gap:var(--ubm-space-2)` |
| `.admin-attendee-list` | 出席者リスト | `display:flex; flex-direction:column; gap:var(--ubm-space-1)` |
| `.admin-attendee-row` | 出席者行 | `display:flex; align-items:center; justify-content:space-between; gap:var(--ubm-space-2); padding:var(--ubm-space-2) var(--ubm-space-3); border-radius:var(--ubm-radius-sm); background:var(--ubm-color-surface-bg)` |
| `.admin-attendee-row__name` | 氏名 | `display:flex; align-items:baseline; gap:var(--ubm-space-1); min-width:0` |

> 既存 `.bulk-attendance*`（globals.css 198-250）は触らず、`.admin-detail-section` のリズムと整合する余白のみ確認。

## 5. DOM 改修（contract 保持・shared-context §7）

### MeetingAttendanceDrawer.tsx（F2）— 不変 data-testid（実コードから引用）

- `attendance-select-${meeting.sessionId}`（`<select>`・MeetingAttendanceDrawer.tsx:93）
- `add-attendance-${meeting.sessionId}`（`<button>`・:116）
- `attendance-attendee-${meeting.sessionId}`（出席者行 `<li>`・:145）
- `remove-attendance-${meeting.sessionId}`（削除 `<button>`・:157）

改修:
- 「編集」`<details>` を `<section class="admin-detail-section">` でラップ（`<summary>編集</summary>` 維持）。
- 「出席を追加」`<div role="group" aria-label="出席追加">` を `.admin-detail-section` 化し `<h4 class="admin-detail-section__title">出席を追加</h4>` を追加（`role="group"` / `aria-label` 維持）。
- 「出席者」ブロックを `.admin-detail-section` 化。見出しを `出席者 (${attended.size}名)` に。`<ul class="admin-attendee-list">`、各 `<li>` に `.admin-attendee-row`、氏名を `.admin-attendee-row__name` で包む。**上記 data-testid / data-member は li/button にそのまま残す**。
- `BulkAttendanceChecklist` / `BulkAttendanceModal` 呼び出しは維持（既存 `.bulk-attendance` のまま＝二重枠回避）。

### MeetingTimeline.tsx（F3）— 不変 data-testid（実コードから引用）

- `meeting-row-${m.sessionId}`（:40）
- `attendance-list-session-${m.sessionId}`（:44）
- `meeting-attendance-count-${m.sessionId}`（:60）

改修:
- `article.ui-card.ui-card--flat` 構造維持。`button.admin-timeline__heading` 内の date/title/badge を `.admin-timeline__date` / `.admin-timeline__title` / 既存 badge のまま。必要なら title+badge を `<span class="admin-timeline__meta">` で軽くまとめる（任意・data-testid 不変）。
- `aria-label` / `aria-expanded` 全て維持。

## 6. 接続 API（不変・参照のみ・shared-context §8）

| Method | Path | 用途 |
|---|---|---|
| GET | `/admin/meetings` | 一覧 |
| POST | `/admin/meetings` | 作成 |
| PATCH | `/admin/meetings/:id` | 更新/論理削除 |
| POST | `/admin/meetings/:sessionId/attendance` | 単体出席追加 |
| POST | `/admin/meetings/:sessionId/attendance/import?dryRun=false` | 一括追加 |
| DELETE | `/admin/meetings/:sessionId/attendance/:memberId` | 出席削除 |

いずれも **変更しない**。UI は既存 `useAdminMutation` ハンドラ経由のまま。`git diff dev -- apps/api` が空であることを AC で検証。

## 7. パラメータ / 表示テキスト一覧

| 表示テキスト | 算出元 | 備考 |
|---|---|---|
| `出席者 (${attended.size}名)` | client state `attended: Set<string>` のサイズ | 人数表示。DR-2 で検証 |
| `編集` | 静的 | `<summary>` 維持 |
| `出席を追加` | 静的 | `role="group"` aria-label と一致 |

## 8. エラー / 既知制限（CONST_005 既知制限）

- **jsdom は CSS / @media を評価しない**ため、vitest は構造（クラス付与・見出しテキスト・人数・role）のみ検証し、視覚（色 / 影 / 余白 px）を assert しない。視覚の唯一の根拠は staging screenshot。
- staging deploy + 認証後 screenshot は **user-gated**（Phase 13）であり本サイクル Phase 11 では取得しない。
- 他 admin 画面への共通 primitive DOM 適用は本 PR スコープ外（OOS-1・CONST_007）。
- 色設計の見直し（OOS-2）/ 右ドロワー化（OOS-3）/ 出席者チップ化（OOS-4）は将来タスク。

## 9. 実装ステップ

1. F1: globals.css に §4.1 既存 BEM 実体化 + §4.2 汎用 primitive を `var(--ubm-*)` 経由で追記。
2. F2: MeetingAttendanceDrawer.tsx の 4 セクションを `.admin-detail-section` でラップ、出席者を `.admin-attendee-row` 化、見出しに `(N名)` 付与。data-testid/aria 不変。
3. F3: MeetingTimeline.tsx の heading に任意 wrapper を付与（data-testid 不変）。
4. T1/T2: DR-1〜DR-3 / TL-1 構造ケースを追加。既存ケース維持。
5. local DoD コマンド（§10）を exit 0 化。
6. Phase 11 evidence（local validation summary + screenshot 5 枚）を取得（screenshot は user-gated）。
7. Phase 13 §2 の PR 前検証コマンドをすべて exit 0 化。
8. PR 作成（base=dev）→ CI green → user 承認 → merge。

## 10. ローカル DoD コマンド（CONST_005 検証コマンド）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/BulkAttendanceChecklist.spec.tsx
mise exec -- pnpm verify:tokens
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/admin-meetings-card-ux-clarity/outputs/phase-11 \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=desktop-chromium playwright/tests/admin-meetings-card-ux-clarity.spec.ts

# grep gate（新規 HEX 0 期待）
grep -rn "bg-\[#\|text-\[#" apps/web/src/features/admin/components/_meetings apps/web/src/styles/globals.css

# API 不変（空期待・AC）
git diff -- apps/api

# data-testid contract 保持（wrapper移動後も同一ID維持・AC）
git diff -- apps/web/src/features/admin/components/_meetings | grep '^[-+].*data-testid'
```

全コマンド exit 0（grep は 0 件 / diff は空）で実装 DoD クリア。

## 11. AC summary

| AC | 内容 | evidence |
|----|------|---------|
| AC-1 | カード分離（影消し + 境界線 + gap 拡大） | screenshots/meetings-list-default-desktop.png |
| AC-2 | 見出し整列（date/title/badge） | screenshots/meetings-list-default-desktop.png / -mobile.png |
| AC-3 | 展開 3 セクションがサブカード分離 | screenshots/meetings-card-expanded-desktop.png |
| AC-4 | 出席者行リスト可読化（行区切り + 削除右寄せ） | screenshots/meetings-attendees-list-desktop.png |
| AC-5 | 出席者見出し人数 `(N名)` 表示 | vitest DR-2 + screenshots/meetings-card-expanded-desktop.png |
| AC-6 | data-testid contract 保持（wrapper移動後も同一ID維持） | testid-contract.txt |
| AC-7 | HEX 直書き 0 / token 経由 | verify-tokens.txt + hex-grep.txt |
| AC-8 | API 不変（`git diff dev -- apps/api` 空） | apps-api-diff.txt |
| AC-9 | 既存 vitest（4 spec）破壊なし + 追加ケース PASS | test-web-meetings.txt |
| AC-10 | local typecheck / lint green | typecheck.txt / lint.txt |

## 視覚証跡

VISUAL タスク（`visualEvidence=VISUAL_ON_EXECUTION`）。Phase 11 screenshot-plan（`outputs/phase-11/phase-11.md` [W1-02b-1]）の canonical 命名と一致させる。local Playwright fixture では本サイクルで取得済み。staging production-equivalent screenshot は Phase 13 user-gated。

| # | screenshot canonical 名 | 対象画面 / 状態 | viewport | 検証 AC |
|---|---|---|---|---|
| 1 | `meetings-list-default-desktop.png` | 一覧・全カード折りたたみ | 1440x900 | AC-1 / AC-2 |
| 2 | `meetings-list-default-mobile.png` | 同上・モバイル幅 | 375x812 | AC-1 / AC-2 |
| 3 | `meetings-card-expanded-desktop.png` | カード 1 件展開・3 セクション | 1440x900 | AC-3 / AC-5 |
| 4 | `meetings-card-expanded-mobile.png` | 同上・モバイル幅 | 375x812 | AC-3 / AC-5 |
| 5 | `meetings-attendees-list-desktop.png` | 出席者セクション（複数名・行リスト） | 1440x900 | AC-4 / AC-5 |

保存先: `outputs/phase-11/screenshots/<component>-<state>(-<viewport>).png`。

## 12. 入口

- 実装着手者: Phase 4 → Phase 5 → §9 実装ステップ → Phase 11
- レビュー者: 本ファイル → `phase12-task-spec-compliance-check.md` → Phase 11 evidence inventory
- PR 作成者: Phase 13
