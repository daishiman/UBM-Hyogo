# Phase 11: 手動テスト / Evidence

## メタ情報

| 項目 | 値 |
|------|----|
| task_id | sidebar-footer-pinning-and-account-popover-ux |
| phase | 11 / 13 |
| 名称 | 手動テスト / Evidence（VISUAL）|
| 前提 | Phase 10 完了（最終レビュー・実装 blocker なし）|
| spec_classification | implementation_spec |
| visual_category | **VISUAL** |
| implementation_mode | new |
| 状態 | implemented_local_evidence_captured（component spec が tier-1 証跡。staging screenshot は user-gated）|

## 目的

本タスクは **VISUAL**（sidebar / footer の見た目・配置・開閉挙動の修正）であり、Apple HIG 観点の視覚検証と 3 層評価（Semantic / Visual / AI UX）を行う。スクリーンショットは staging（`ubm-hyogo-web-staging`）の **認証必須**画面のため **user-gated**。two-tier 方針（tier-1 = local jsdom render の DOM 構造 present 確認、tier-2 = staging 実画面 screenshot）で証跡を分離する。

## 実行タスク

### Task 11-1: タスク種別判定の再確認（VISUAL）

| 項目 | 判定 |
|------|------|
| タスク種別 | **VISUAL**（Phase 1 で `visual_category: VISUAL` 記録済）|
| 視覚的変更 | sidebar footer 固定（C1）/ collapse はみ出し解消（C2）/ popover 開閉（C3）/ footer sticky（C4）= いずれも目視で確認すべき配置・挙動変更 |
| screenshot 要否 | **要**（ただし staging 認証必須 → user-gated） |

> Phase 1 のタスク分類（VISUAL）から変化なし。NON_VISUAL への再判定は不要。

### Task 11-2: two-tier 証跡方針

| tier | 内容 | 取得可否 | 証跡 |
|------|------|---------|------|
| **tier-1**（自動取得可）| local jsdom（vitest）で DOM 構造の present を確認。`data-shell-block="sidebar-footer"` / collapsed `justify-center` / `nav-badge-dot` / `<main>` flex-col / popover 開閉 state | **PASS** | component spec 3 files / 22 tests |
| **tier-2**（local visual）| public viewer の local screenshot。`local-public-home.png` / `local-public-privacy.png` | **PASS** | sidebar footer 固定表示を補助確認 |
| **tier-3**（user-gated）| staging で実際に 4 症状を目視 + screenshot 取得 | **pending_user_gated**：staging は管理者認証必須 | ユーザー承認後に取得（`screenshots/` へ canonical 名で保存）|

### Task 11-3: 4 症状の視覚確認チェックリスト（実装 + staging で確定）

| # | 症状 | 確認内容 | screenshot シーン名 | 確認 |
|---|------|---------|--------------------|------|
| C1 | footer 見える | admin で nav 14 項目を表示しても「公開サイトに戻る」/ user アイコン / collapse トグルが**スクロールなしで最下部に見える**。nav 領域のみ内部スクロール | `sidebar-footer-pinned` | PASS（local DOM）/ screenshot pending |
| C2 | collapse はみ出しなし | collapse 時、アイコンが 4rem 幅に収まり横にはみ出さない。badge はドット表示 | `sidebar-collapsed-no-overflow` | PASS（local DOM）/ screenshot pending |
| C3 | 外側クリックで閉じる | user メニュー popover を開き、**他の場所をクリックすると閉じる**。Escape でも閉じる | `account-popover-open` → `account-popover-dismissed-by-outside-click` | PASS（local behavior）/ screenshot pending |
| C4 | footer 最下部 | 短コンテンツの公開ページで PublicFooter（プライバシー / 利用規約 / コピーライト）が viewport 最下部に配置 | `public-footer-sticky` | PASS（local DOM/CSS contract）/ screenshot pending |

### Task 11-4: 3 層評価（Apple HIG）

| 層 | 観点 | 評価 |
|----|------|--------------------|
| **Semantic** | DOM 観測契約属性が意味的に正しい（`sidebar-footer` / `user-menu-popover` / `public-footer`）。aria（`aria-haspopup="menu"` / `aria-label`）維持 | PASS（component spec）|
| **Visual** | HIG: 固定下部領域の border-top による視覚分離、collapsed の中央寄せ整列、popover の影/角丸、footer の breathing room（padding 32px）| pending（staging screenshot・user-gated）|
| **AI UX** | 「見える・閉じる・はみ出さない」の基本可用性が満たされ、操作の予測可能性（外側クリックで閉じる = 一般的 popover 期待）が回復 | PASS（local behavior）/ staging 操作 pending |

### Task 11-5: screenshot 取得手順（user 承認後）

1. ユーザーに staging screenshot 取得の承認を得る。
2. `bash scripts/cf.sh` / staging URL（`ubm-hyogo-web-staging`）へ管理者ログイン。
3. 4 シーンを canonical 名（`<component>-<state>.png`）で `screenshots/` に保存：
   - `sidebar-footer-pinned.png`
   - `sidebar-collapsed-no-overflow.png`
   - `account-popover-open.png`
   - `account-popover-dismissed-by-outside-click.png`
   - `public-footer-sticky.png`
4. `outputs/phase-11/manual-test-result.md` の 4 症状チェックリストと screenshot 参照を確定する。
5. Phase 12 `implementation-guide.md` の視覚証跡セクションへ screenshot 参照を反映する（[FB-VISUAL-CAP-001]：phase spec / screenshot-plan.json / manual-test-result.md / implementation-guide.md の 4 か所で canonical 名一致）。

> screenshot capture script を使う場合は `try { ... } finally { browser.close(); server.close(); }` でポート解放を確実にする（[FB-MSO-003]）。

## 参照資料

- task-specification-creator: `phase-11-screenshot-guide.md` / `screenshot-verification-procedure.md`（VISUAL screenshot 取り扱い）
- Phase 10 AC 判定（AC-1〜AC-4 の証跡紐付け）
- `outputs/phase-11/screenshot-plan.json`（capture 計画 / canonical 名）
- `outputs/phase-11/manual-test-result.md`（証跡サマリ）
- 既存 component spec（tier-1 代替証跡の主ソース）

## 実行手順

1. Task 11-1: VISUAL 判定を再確認する（Phase 1 から不変）。
2. Task 11-2: two-tier 方針を確定し、tier-1（component spec）を主証跡、tier-2（staging screenshot）を user-gated と記録する。
3. Task 11-3/11-4: 4 症状チェックリストと 3 層評価枠を作成する（確定）。
4. Task 11-5: user 承認後に staging screenshot を取得し、canonical 名で保存・4 か所参照同期する。
5. `outputs/phase-11/manual-test-result.md` / `screenshot-plan.json` を本 Phase と同期する。

## 統合テスト連携

- tier-1: component spec（`SidebarShell.spec` / `SidebarUserMenu.spec` / `SidebarNavItem.spec` / `PublicFooter.spec`）が AC-1〜AC-4 の DOM/挙動契約を保護し、screenshot 未取得段階でも回帰検知が成立する。
- tier-2: staging screenshot が AC-1〜AC-4 の視覚的妥当性を最終確定する（user-gated）。

## 多角的チェック観点（AIが判断）

- **責務境界**: 自動検証（DOM 構造・開閉 state）は component spec、視覚的妥当性（配置・整列・余白）は staging screenshot。screenshot を自動テスト代替として扱わない（VISUAL task 原則）。
- **運用性**: local component evidence と staging screenshot を分離し、認証必須 screenshot の未取得を local 実装未完了と誤読させない。
- **戦略・価値系**: tier-1 を確実な main 証跡とし、tier-2 を承認後の補強とすることで、実装前でも証跡計画の妥当性を担保。

## サブタスク管理

| ID | 内容 | tier | 状態 |
|----|------|------|------|
| 11-1 | VISUAL 判定再確認 | — | ✅ |
| 11-2 | two-tier 方針確定 | — | ✅ |
| 11-3 | 4 症状チェックリスト | tier-1/2 | ✅（tier-1 PASS / tier-2 user-gated）|
| 11-4 | 3 層評価（HIG）| tier-1/2 | ✅（Semantic/AI UX local PASS / Visual user-gated）|
| 11-5 | screenshot 取得 | tier-2 | ☐（user-gated）|

## 成果物

- `outputs/phase-11/manual-test-result.md`（証跡サマリ：主ソース component spec 名/件数予定、screenshot 未取得理由、4 症状チェックリスト）
- `outputs/phase-11/screenshot-plan.json`（mode VISUAL / 5 シーンの canonical 名 / status `pending_user_gated`）
- `screenshots/.gitkeep`（VISUAL のため screenshots dir 保持。実画像は実装 + user 承認後）

## 完了条件

- [x] Task 11-1: VISUAL 判定を再確認した（Phase 1 から不変）
- [x] Task 11-2: two-tier（tier-1 component spec / tier-2 staging screenshot user-gated）を確定した
- [x] Task 11-3: 4 症状（C1-C4）チェックリストを作成した（実装済みとして埋める）
- [x] Task 11-4: 3 層評価（Semantic / Visual / AI UX）枠を作成した
- [x] Task 11-5: screenshot 取得手順と canonical 名（5 シーン）を固定した（取得は user 承認後）
- [x] `manual-test-result.md` / `screenshot-plan.json` / `screenshots/.gitkeep` を作成した

## タスク100%実行確認【必須】

- [x] 全実行タスク（11-1〜11-5）を仕様として記述した
- [x] 必須成果物（manual-test-result.md / screenshot-plan.json / .gitkeep）を作成した
- [x] Phase 12 開始条件（証跡計画の確定）を満たす設計を記述した

## 次Phase

[Phase 12: ドキュメント同期](phase-12-documentation.md)
