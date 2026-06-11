# Phase 10: 最終レビュー

## メタ情報

- task_id: `admin-members-mobile-responsive-layout`
- phase: 10 / 13
- 前提: [phase-9-qa.md](phase-9-qa.md) 完了
- SSOT: [outputs/shared-context.md](outputs/shared-context.md)
- 実装区分: `[実装区分: 実装仕様書]`（CONST_004） / visual_category: VISUAL

## 目的

AC-1〜AC-9 の充足判定と I-1〜I-8 の不変条件遵守を最終確認し、blocker 有無を確定する。MINOR があれば未タスク化（OOS 記録 / 起票見送り）する。Phase 13（commit / push / PR）は user-gated（CONST_002）であることを明示する。

## 実行タスク

### Step 1: AC-1〜AC-9 充足判定テーブル

| AC | 内容 | 判定方法 | 判定（spec段階） |
| -- | ---- | -------- | ---------------- |
| AC-1 | 375/414/640px でカードレイアウト表示・横はみ出しゼロ | Phase 11 手動 375/414/640 確認 + Playwright（`scrollWidth <= clientWidth + 誤差`） | pending（実装サイクルで確定） |
| AC-2 | モバイルカードにメール/区画ステータス/タグ/最終更新/公開が各ラベル付きで全可視 | TC-MT-22（`data-label` 存在）+ Phase 11 目視（`::before` ラベル表示） | pending |
| AC-3 | モバイルで公開トグル・編集ボタンが画面内に収まり操作可能 | Phase 11 手動 375px で publish switch / 編集ボタンが viewport 内・タップ可 | pending |
| AC-4 | デスクトップ（≥641px）は現行テーブル・DOM・スタイル完全維持 | 1280px 手動確認 + `@media` 内限定 diff レビュー（Phase 9 Step 7） | pending |
| AC-5 | `MembersTable.tsx` 属性追加のみ・機械可読id / 行セル順序変更なし | `git diff dev...HEAD -- apps/web/src/features/admin/components/_members/MembersTable.tsx` レビュー + TC-MT-24 | pending |
| AC-6 | `globals.css` 追加は OKLch トークン経由のみ・HEX/任意値混入ゼロ | Phase 9 Step 1（`verify:design-tokens` + grep） | pending |
| AC-7 | 既存 TC-MT-01〜20 緑 + 追加 TC-MT-21〜24 緑 | Phase 9 Step 2（targeted vitest） | pending |
| AC-8 | `apps/api` / migration / Form 差分ゼロ | Phase 9 Step 4（`git diff dev...HEAD -- apps/api 'packages/**/migrations/**'` 空） | pending |
| AC-9 | typecheck / lint / 対象 vitest 緑 | Phase 9 Step 2-3 | pending |

> local implementation 段階では全 AC が pending。実装サイクルで Phase 9 / Phase 11 の機械・目視結果をもって PASS 確定する。各 AC は判定方法が機械コマンドまたは目視手順に 1 対 1 で紐づいており、主観判定に逃げない。

### Step 2: I-1〜I-8 不変条件遵守確認

| I | 内容 | 確認方法 | 判定（spec段階） |
| - | ---- | -------- | ---------------- |
| I-1 | API endpoint / D1 / Form / auth 不変 | AC-8 diff 空 | pending |
| I-2 | 機械可読id（`data-testid` / `aria-label` / `chip-dot` / `member-state-chip-row`）逐語不変 | AC-5 diff + TC-MT-24 | pending |
| I-3 | 行・セルの DOM 順序・個数を変えない（属性追加のみ） | F1 diff レビュー（追加属性のみ） | pending |
| I-4 | 色・寸法は `var(--ubm-*)` 経由・HEX/任意値禁止 | AC-6 token gate | pending |
| I-5 | breakpoint は CSS `@media` 正本・JS/matchMedia 分岐なし | F1/F2 diff に `matchMedia` 不在を確認 | pending |
| I-6 | desktop（≥641px）完全維持（リグレッションゼロ） | AC-4 + `@media` 内限定 diff | pending |
| I-7 | D1 直接アクセス禁止継続（`apps/web` 表現層のみ変更） | 変更ファイルが F1〜F4 のみ | pending |
| I-8 | 既存 unit test（TC-MT-01〜20）1件も壊さない・追加のみ | AC-7 vitest 緑 | pending |

### Step 3: blocker 判定

- 想定 blocker: **なし**。本タスクは表現層 CSS / 属性追加のみで、API / D1 / Form を触らず（I-1）、機械可読id を保全（I-2）するため破壊的変更がない。
- 実装サイクルで AC のいずれかが pending → fail へ転じた場合のみ blocker 化し、Phase 5/6 へ差し戻す。
- 環境ブロッカー（Playwright 起動不可）は blocker ではなく Phase 11 で CAPTURE_BLOCKED 扱い（unit PASS + 手動 screenshot 代替）。これは AC を fail にしない（TECH-M-02 既起票）。

### Step 4: MINOR 指摘の未タスク化（unassigned-task-guidelines 準拠）

| MINOR / OOS ID | 内容 | 扱い |
| -------------- | ---- | ---- |
| TECH-M-01 | 実トークン名の実在は実装時確認 | Phase 9 Step 6 で解決確認 → クローズ（未タスク化しない） |
| TECH-M-02 | Playwright 起動不可時 F4 を CAPTURE_BLOCKED | Phase 11 で代替証跡。環境依存のため起票見送り（実装サイクルで再評価） |
| OOS-1 | 他 admin 一覧テーブル（tags/meetings/requests/audit）のモバイルカード化 | **今回スコープ外**（別画面・別責務／「分量」ではない）。Phase 12 `unassigned-task-detection.md` に理由付き記録。新規 Issue 起票はユーザー承認後（relatedIssue=null のため自動起票しない） |

> MINOR はいずれも MAJOR ではなく Phase 13 を妨げない。OOS-1 は独立タスク候補として記録のみ（横展開は別 PR）。

### Step 5: Phase 13 user-gated 明示

- Phase 13（commit / push / PR 作成・staging 反映）は **ユーザー明示承認後のみ実行**（CONST_002）。
- local implementation 段階では実装・コミット・PR・staging 反映はいずれも未実施。最終レビュー PASS は「local implementation が完了し runtime evidence 境界が明確」ことを意味し、自動コミットはしない。

## 参照資料

| 参照資料 | パス |
| -------- | ---- |
| 品質レポート | `outputs/phase-9/quality-report.md` |
| SSOT | `outputs/shared-context.md` |
| 設計レビュー | `phase-3-design-review.md` |

## 実行手順

1. AC-1〜AC-9 充足判定テーブルを埋める（Step 1）。
2. I-1〜I-8 遵守確認（Step 2）。
3. blocker 判定（Step 3、なし想定）。
4. MINOR / OOS の未タスク化方針を確定（Step 4）。
5. Phase 13 user-gated を明記（Step 5）。
6. 結果を `outputs/phase-10/final-review-result.md` に記録。

## 統合テスト連携

- AC 判定方法は Phase 9（機械ゲート）と Phase 11（VISUAL 目視 / Playwright）に紐づく。本 Phase は両者の結果を統合して最終可否を出す。

## 多角的チェック観点（AIが判断）

- 価値性: 携帯で会員管理が操作可能になる（横はみ出し解消・公開トグル可視）。
- 整合性: 機械可読id・desktop が完全不変でリグレッションゼロ。
- 運用性: 既存 test 緑・token gate 緑・API 非接触で安全に landed 可能。
- 4条件すべて充足 → blocker なし。

## サブタスク管理

| ID | 内容 | status |
| -- | ---- | ------ |
| FR-1 | AC 充足判定 | pending（実装で確定） |
| FR-2 | I 遵守確認 | pending |
| FR-3 | blocker 判定 | done（なし想定） |
| FR-4 | MINOR/OOS 未タスク化 | done（記録） |

## 成果物

| 成果物 | パス |
| ------ | ---- |
| 最終レビュー結果 | `outputs/phase-10/final-review-result.md` |

## 完了条件

- [ ] AC-1〜AC-9 充足判定テーブル記載。
- [ ] I-1〜I-8 遵守確認記載。
- [ ] blocker 判定（なし想定）記載。
- [ ] MINOR / OOS の未タスク化方針記載。
- [ ] Phase 13 user-gated 明示。

## タスク100%実行確認【必須】

- [x] AC 充足判定テーブルを定義
- [x] I 遵守確認テーブルを定義
- [x] blocker 判定を記載
- [x] MINOR / OOS 未タスク化を記載
- [x] Phase 13 user-gated を明記

## 次Phase

[phase-11-manual-test.md](phase-11-manual-test.md) — 手動テスト / VISUAL Evidence。
