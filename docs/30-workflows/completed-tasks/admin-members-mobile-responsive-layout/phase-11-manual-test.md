# Phase 11: 手動テスト / VISUAL Evidence

## メタ情報

- task_id: `admin-members-mobile-responsive-layout`
- phase: 11 / 13
- 前提: [phase-10-final-review.md](phase-10-final-review.md) 完了
- SSOT: [outputs/shared-context.md](outputs/shared-context.md)
- visual_category: **VISUAL**（W1-02b-1） / 実装区分: `[実装区分: 実装仕様書]`

## 目的

本タスクは VISUAL UI task である。モバイルカード化（≤640px）とデスクトップテーブル維持（≥641px）を実機/ブラウザで手動確認し、screenshot を VISUAL Evidence として取得する。現在は CSS-contract Chromium screenshot 3 点を取得済みで、authenticated `/admin/members` route screenshot は user-gated。**ダミーPNG の作成は禁止（false green 防止）**。

## 実行タスク

### Step 0: テスト方式（VISUAL である旨）

- これは VISUAL task（SSOT: visual_category=VISUAL）であり、screenshot-plan の `mode` は `"VISUAL"`（W1-02b-1 対応）。
- CSS-contract Chromium screenshot は取得済み。authenticated `/admin/members` route screenshot は **user-gated**。
- `outputs/phase-11/manual-test-result.md` の冒頭にも同趣旨の「テスト方式」セクションを記載する。

### Step 1: 手動テスト手順（viewport 別）

実機 or ブラウザ devtools（responsive mode）で `/admin/members` を開き、以下を確認する。

| viewport | 期待表示 | 確認項目 |
| -------- | -------- | -------- |
| 375px | カードレイアウト（縦積み） | ①各会員が1枚の縦積みカード ②横スクロール（横はみ出し）ゼロ ③メール/区画ステータス/タグ/最終更新/公開の各ラベル付き全可視 ④公開トグル（`MemberPublishSwitch`）が viewport 内で操作可能 ⑤編集ボタンが viewport 内 |
| 414px | カードレイアウト | 375px と同様。レイアウト崩れ・はみ出しなし |
| 640px | カードレイアウト（境界値） | `@media (max-width:640px)` の上限。カード表示が維持され、横はみ出しゼロ |
| 1280px | テーブル維持（境界外） | `<thead>` 可視・現行テーブルレイアウト・カードCSS非適用（desktop リグレッションゼロ / AC-4 / I-6） |

- 横はみ出しチェック（Playwright 利用可時）: 各 viewport で `document.documentElement.scrollWidth <= clientWidth + 許容誤差` を確認。
- 公開トグル可視チェック: 375px で publish switch が viewport の可視領域内に収まること（AC-3）。

### Step 2: screenshot canonical 名（W1-02b / FB-LLM-MOD-05 セマンティック命名）

セマンティック命名 `<component>-<state>.png` に従い、以下 **3点** を取得する。この 3 名は phase spec / `screenshot-plan.json` / `phase11-capture-metadata.json` の **3 か所で完全一致**させる（drift 厳禁）。

| # | canonical 名 | viewport | route | 状態 |
| - | ------------ | -------- | ----- | ---- |
| 1 | `admin-members-table-mobile-card-375.png` | 375px | `/admin/members` | モバイルカード表示（縦積み・横はみ出しゼロ・公開トグル可視） |
| 2 | `admin-members-table-mobile-card-640.png` | 640px | `/admin/members` | モバイルカード表示（境界値・カード維持） |
| 3 | `admin-members-table-desktop-table-1280.png` | 1280px | `/admin/members` | デスクトップテーブル維持（thead 可視・現行レイアウト） |

> 414px は手動チェック対象だが canonical screenshot には含めない（375 と 640 の間で挙動が連続するため、境界値 375/640 と desktop 1280 の 3 点を代表証跡とする）。

### Step 3: 環境ブロッカー対応（CAPTURE_BLOCKED）

- worktree / CI で Playwright / Electron 相当が起動不可（ブラウザバイナリ未配置・サンドボックス制約等）の場合、`manual-test-result.md` に **CAPTURE_BLOCKED** と記録する。
- その場合の代替証跡:
  1. unit test PASS（Phase 9 の TC-MT-21〜24 + 既存 TC-MT-01〜20 緑）。
  2. 手動スクリーンショット（実ブラウザ devtools で 375/640/1280 を撮影）を canonical 名で配置。
- **ダミーPNG（中身のない / プレースホルダ画像）の作成は禁止**（false green 防止）。撮れない場合は pending のまま正直に記録する。

### Step 4: Apple HIG 視覚観点（簡易チェック）

| 観点 | 基準 | 確認 |
| ---- | ---- | ---- |
| タップターゲット | 公開トグル・編集ボタン・チェックボックスの操作領域が最小 44×44px 相当を確保 | 375px で指タップ可能サイズか |
| カード余白 | カード内 padding / カード間 margin が token（`--ubm-space-*`）で一定・窮屈でない | 視認 |
| 可読性 | ラベル（`::before`）と値のコントラスト・文字サイズが読める（`--ubm-text-xs` ラベル / 本文サイズ） | 視認 |
| はみ出し | テキスト・Chip 群が画面右端で見切れない | 375/414/640 で確認 |

## 参照資料

| 参照資料 | パス |
| -------- | ---- |
| SSOT | `outputs/shared-context.md` |
| 最終レビュー | `phase-10-final-review.md` |
| screenshot plan | `outputs/phase-11/screenshot-plan.json` |
| capture metadata | `outputs/phase-11/phase11-capture-metadata.json` |

## 実行手順

1. テスト方式（VISUAL / CSS-contract screenshot captured / authenticated route user-gated）を記録（Step 0）。
2. 375/414/640/1280px の手動確認を実施（Step 1）。
3. canonical 3 名でスクリーンショット取得（Step 2）。実装サイクルで実施。
4. Playwright 起動不可なら CAPTURE_BLOCKED 記録 + 代替証跡（Step 3）。
5. HIG 簡易チェック（Step 4）。
6. 結果を `outputs/phase-11/manual-test-result.md` に記録。

## 統合テスト連携

- 手動テストは AC-1（横はみ出しゼロ）/ AC-2（ラベル全可視）/ AC-3（公開トグル可視）/ AC-4（desktop 維持）の VISUAL 証跡。
- Playwright（F4 `admin-members-mobile.spec.ts`）が起動可なら、Step 1 の機械版（scrollWidth 比較・thead 可視）として併用する。

## 多角的チェック観点（AIが判断）

- 価値系: 携帯で会員操作が成立するかを実機目視で最終確認（運用者視点）。
- リスク系: false green 防止のためダミーPNG禁止を明記。撮れないものは pending と正直に記録。
- 整合性系: canonical 3 名を 3 ファイルで一致させ drift をゼロ化。

## サブタスク管理

| ID | 内容 | status（spec段階） |
| -- | ---- | ------------------ |
| MT-1 | 375/414/640 手動カード確認 | CSS-contract PASS（414 は Playwright overflow、375/640 は PNG + overflow） |
| MT-2 | 1280 テーブル維持確認 | CSS-contract PASS（PNG + overflow） |
| MT-3 | canonical 3 screenshot 取得 | done（CSS-contract Chromium screenshot） |
| MT-4 | HIG 簡易チェック | done（CSS-contract visual review） |
| MT-5 | CAPTURE_BLOCKED 判定 / 記録 | not blocked（authenticated route は user-gated） |

## 成果物

| 成果物 | パス |
| ------ | ---- |
| 手動テスト結果 | `outputs/phase-11/manual-test-result.md` |
| screenshot plan | `outputs/phase-11/screenshot-plan.json` |
| capture metadata | `outputs/phase-11/phase11-capture-metadata.json` |

## 完了条件

- [x] テスト方式（VISUAL / CSS-contract screenshot captured / authenticated route user-gated）を冒頭に記載。
- [x] 375/414/640/1280 手動確認手順を定義。
- [x] canonical 3 名を 3 ファイルで一致。
- [x] CAPTURE_BLOCKED 対応（ダミーPNG禁止）を明記。
- [x] HIG 簡易チェック観点を記載。
- [x] CSS-contract screenshot captured と authenticated route user-gated を分離。

## タスク100%実行確認【必須】

- [x] テスト方式（VISUAL）を記載
- [x] viewport 別手動手順を定義
- [x] canonical 3 名を確定（3 ファイル一致）
- [x] CAPTURE_BLOCKED / ダミーPNG禁止を明記
- [x] HIG 観点を記載

## 次Phase

phase-12（ドキュメント / 未タスク検出 / changelog）。Phase 13（commit/push/PR/staging）は user-gated（CONST_002）。
