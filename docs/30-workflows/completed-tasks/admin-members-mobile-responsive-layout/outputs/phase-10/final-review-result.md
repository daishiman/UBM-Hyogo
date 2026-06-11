# Phase 10 最終レビュー結果 — admin-members-mobile-responsive-layout

- task_id: `admin-members-mobile-responsive-layout`
- 実装区分: `[実装区分: 実装仕様書]`（CONST_004） / visual_category: VISUAL
- 段階: **spec_created**（AC/I は実装サイクルで確定。本表は判定方法の固定）

## 1. AC-1〜AC-9 充足判定テーブル

| AC | 内容 | 判定方法 | 判定 |
| -- | ---- | -------- | ---- |
| AC-1 | 375/414/640px でカードレイアウト・横はみ出しゼロ | Phase 11 手動 + Playwright（`scrollWidth <= clientWidth + 誤差`） | pending |
| AC-2 | モバイルカードにメール/区画ステータス/タグ/最終更新/公開がラベル付き全可視 | TC-MT-22 + Phase 11 目視（`::before` ラベル） | pending |
| AC-3 | モバイルで公開トグル・編集ボタンが画面内・操作可能 | Phase 11 手動 375px（viewport 内・タップ可） | pending |
| AC-4 | デスクトップ（≥641px）テーブル・DOM・スタイル完全維持 | Phase 11 手動 1280px + `@media` 内限定 diff（Phase 9 Step 7） | pending |
| AC-5 | `MembersTable.tsx` 属性追加のみ・機械可読id/順序変更なし | F1 `git diff` レビュー + TC-MT-24 | pending |
| AC-6 | `globals.css` 追加は token 経由のみ・HEX/任意値ゼロ | Phase 9 QA-1（`verify:design-tokens` + grep） | pending |
| AC-7 | 既存 TC-MT-01〜20 緑 + 追加 TC-MT-21〜24 緑 | Phase 9 QA-2（targeted vitest） | pending |
| AC-8 | `apps/api` / migration / Form 差分ゼロ | Phase 9 QA-4（diff 空） | pending |
| AC-9 | typecheck / lint / 対象 vitest 緑 | Phase 9 QA-2/QA-3 | pending |

## 2. I-1〜I-8 不変条件遵守確認

| I | 内容 | 確認方法 | 判定 |
| - | ---- | -------- | ---- |
| I-1 | API / D1 / Form / auth 不変 | AC-8 diff 空 | pending |
| I-2 | 機械可読id 逐語不変 | AC-5 diff + TC-MT-24 | pending |
| I-3 | 行・セル DOM 順序/個数不変（属性追加のみ） | F1 diff レビュー | pending |
| I-4 | 色・寸法は `var(--ubm-*)` 経由・HEX/任意値禁止 | AC-6 token gate | pending |
| I-5 | breakpoint は CSS `@media` 正本・JS/matchMedia なし | F1/F2 diff に matchMedia 不在 | pending |
| I-6 | desktop（≥641px）完全維持 | AC-4 + `@media` 内限定 diff | pending |
| I-7 | D1 直アクセス禁止継続（apps/web 表現層のみ） | 変更ファイルが F1〜F4 のみ | pending |
| I-8 | 既存 unit test 不破壊・追加のみ | AC-7 vitest 緑 | pending |

## 3. blocker 判定

- **blocker: なし（想定）**。表現層 CSS / 属性追加のみで破壊的変更なし。
- 実装サイクルで AC が fail へ転じた場合のみ blocker 化 → Phase 5/6 差し戻し。
- 環境ブロッカー（Playwright 起動不可）は blocker ではなく Phase 11 CAPTURE_BLOCKED 扱い（AC を fail にしない）。

## 4. MINOR / OOS 未タスク化（unassigned-task-guidelines 準拠）

| ID | 内容 | 扱い |
| -- | ---- | ---- |
| TECH-M-01 | 実トークン名の実在 | Phase 9 QA で解決確認 → クローズ |
| TECH-M-02 | Playwright 起動不可時 CAPTURE_BLOCKED | Phase 11 代替証跡。環境依存で起票見送り |
| OOS-1 | 他 admin 一覧テーブル（tags/meetings/requests/audit）のモバイルカード化 | 今回スコープ外（別画面・別責務）。Phase 12 `unassigned-task-detection.md` に理由付き記録。新規 Issue 起票は user 承認後（relatedIssue=null） |

## 5. Phase 13 user-gated

- commit / push / PR / staging 反映は **ユーザー明示承認後のみ**（CONST_002）。
- local implementation 段階ではruntime screenshot・commit・PR・staging は未実施。

## 6. 総合

- 設計・受入条件・不変条件はすべて判定方法が機械コマンドまたは目視手順に紐づき、主観判定なし。
- spec 段階の最終判定: **実装準備 OK（blocker なし）**。実装サイクルで全 AC/I を PASS 確定する。
