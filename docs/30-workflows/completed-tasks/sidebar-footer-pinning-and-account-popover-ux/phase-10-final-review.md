# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
|------|----|
| task_id | sidebar-footer-pinning-and-account-popover-ux |
| phase | 10 / 13 |
| 名称 | 最終レビュー（acceptance criteria 判定 + blocker）|
| 前提 | Phase 9 完了（QA / CI gate）|
| spec_classification | implementation_spec |
| visual_category | VISUAL |
| implementation_mode | new |
| 状態 | implemented_local_evidence_captured（AC 最終判定は確定済み）|

## 目的

AC-1〜AC-6 を 1 件ずつ最終判定し、Phase 3 で追跡した MINOR（TECH-M-01 / TECH-M-02 / TECH-M-03）の解決状況を確認する。MINOR の未タスク化対象を確定し、blocker の有無を判定して Phase 11（手動テスト）/ Phase 12（ドキュメント）/ Phase 13（PR）へ引き渡す。

## 実行タスク

### Task 10-1: acceptance criteria 最終判定（確定）

| AC | 内容 | 判定基準 | 判定 | 証跡 |
|----|------|---------|------|------|
| AC-1 | フッター固定（下部 3 要素が常時最下部・nav のみ内部スクロール）| `data-shell-block="sidebar-footer"` 内 DOM 契約 + staging 視覚（C1）| ☐（設計上 PASS 見込み）| SidebarShell.spec / Phase 11 screenshot `sidebar-footer-pinned` |
| AC-2 | collapse はみ出しゼロ（4rem 内・中央寄せ・badge ドット）| collapsed `justify-center` + `nav-badge-dot` 契約 + staging 視覚（C2）| ☐（設計上 PASS 見込み）| SidebarNavItem.spec / Phase 11 `sidebar-collapsed-no-overflow` |
| AC-3 | popover 外側クリック / Escape 閉じ（route close 維持・内側維持）| 外側/Escape で `details.open=false`、内側で open 維持（C3）| ☐（設計上 PASS 見込み）| SidebarUserMenu.spec / Phase 11 `account-popover-dismissed-by-outside-click` |
| AC-4 | main footer sticky（短コンテンツで最下部・長コンテンツで自然配置）| `<main>` flex-column + footer `margin-top:auto`（C4）| ☐（設計上 PASS 見込み）| SidebarShell.spec / Phase 11 `public-footer-sticky` |
| AC-5 | API/D1/auth/Form 不変・token 経由・HEX 禁止 | 変更は CSS + shell component のみ・HEX grep 0 件 | ☐（設計上 PASS 見込み）| Phase 9 Task 9-5 / scope_files |
| AC-6 | 既存回帰なし + 新規保護 | targeted vitest 全パス（既存 + 新規）| ☐（設計上 PASS 見込み）| Phase 9 Task 9-1/9-2 |

### Task 10-2: 不変条件 I-1〜I-8 最終確認

| 不変条件 | 確認 | 判定 |
|----------|------|------|
| I-1 hook/props 不変 | `useSidebarState` 戻り値・`SidebarShellProps` 不変 | ☐ |
| I-2 state owner 単一（`<details>.open` 正本）| React state は listener 登録用派生のみ | ☐ |
| I-3 API/D1/auth/Form 不変 | 変更ファイルに該当なし | ☐ |
| I-4 token 経由・HEX 禁止 | Phase 9 Task 9-5 で 0 件 | ☐ |
| I-5 browser API 入口 | `browserDocument()` 経由・直接 document なし | ☐ |
| I-6 hydration mismatch なし | footer 固定は CSS・JS 計測なし・初期 HTML 不変 | ☐ |
| I-7 観測契約属性維持 | 既存属性削除なし・additive のみ | ☐ |
| I-8 details ネイティブ挙動維持 | summary トグル・キーボード・aria 維持 | ☐ |

### Task 10-3: Phase 3 MINOR 解決確認

| MINOR ID | 指摘内容 | 解決予定 | 解決確認 | 判定 | 未タスク化対象か |
|----------|---------|---------|---------|------|----------------|
| TECH-M-01 | C2 badge collapsed ドットの件数を `sr-only` で残すか（a11y）| Phase 5 | Phase 9/10 | ☐（**残す方針を推奨** = 実装で対応・解決確認）| **対象外**（本タスク内で解決）|
| TECH-M-02 | C3 外側クリック listener の汎用 hook 化（`useDismissable`）| 未タスク化候補 | — | **本サイクル scope 外** | **未タスク化対象**（Phase 12 で formalize）|
| TECH-M-03 | `100dvh` 非対応ブラウザ fallback（`100vh` 併記）| Phase 5 | Phase 9 | ☐（CSS 二重宣言で対応・確認のみ）| **対象外**（本タスク内で解決）|

> **MINOR 判定 = 未タスク化対象の原則**（[unassigned ルール]）: Phase 10 の MINOR 指摘は「機能に影響なし」を理由に不要判定してはならない。本タスクでは TECH-M-01 / TECH-M-03 は **Phase 5 実装内で解決**するため未タスク化不要だが、**TECH-M-02（汎用 `useDismissable` hook 抽出）は本サイクル scope 外**であり、再利用需要が顕在化した時点で抽出する。**Phase 12 の未タスク化候補として引き継ぐ**。加えて Phase 8 で記録した「globals.css `[data-shell="sidebar"]` 2 ブロックの 1 本化」も未タスク化候補として Phase 12 へ引き継ぐ。

### Task 10-4: blocker 判定

| 項目 | 状態 |
|------|------|
| 実装 blocker | **なし**（設計 PASS・新規 endpoint/D1/auth なし）|
| commit / push / PR | **user-gated**（Phase 13 で user の明示承認後のみ。implemented_local_evidence_captured 段階では blocked）|
| Phase 11 screenshot（staging）| **user-gated**（staging 認証必須。Phase 11 two-tier 参照）|

## 参照資料

- Phase 3 設計レビュー（MINOR 追跡テーブル）/ Phase 9 QA 判定
- task-specification-creator: `unassigned-task-guidelines.md`（MINOR → 未タスク化ルール）
- 受入条件（index.md AC-1〜AC-6）/ 不変条件 I-1〜I-8

## 実行手順

1. Phase 10 レビュー前に `unassigned-task-guidelines.md` を読み、MINOR → 未タスク化ルールを確認する。
2. Task 10-1: AC-1〜AC-6 を Phase 9 証跡 + Phase 11 screenshot 参照で 1 件ずつ判定する（実装済み）。
3. Task 10-2: 不変条件 I-1〜I-8 を最終照合する。
4. Task 10-3: MINOR 3 件の解決/未タスク化を確定する（TECH-M-02 を Phase 12 引き継ぎ）。
5. Task 10-4: blocker（commit/PR・screenshot が user-gated）を記録する。

## 統合テスト連携

- Phase 11（手動テスト / staging screenshot）で AC-1〜AC-4 の視覚証跡を最終確定する前提条件（component spec PASS）を満たすこと。
- Phase 12 で TECH-M-02 と globals.css 重複統合を `unassigned-task-detection.md` へ formalize する。

## 多角的チェック観点（AIが判断）

- **整合性**: 6 AC + 8 不変条件 + 3 MINOR をトレーサブルに閉じる。AC ごとに証跡（spec / screenshot）を紐付け。
- **運用性**: MINOR の未タスク化判断を Phase 10 で確定し、Phase 12 の formalize を漏らさない。
- **戦略・価値系**: 4 件の基本可用性回復が全 AC で達成見込み。汎用 hook 抽出は将来価値であり初回スコープと分離（TECH-M-02）。

## サブタスク管理

| ID | 内容 | 判定 |
|----|------|------|
| 10-1 | AC-1〜AC-6 最終判定 | ☐（実装済み確定）|
| 10-2 | 不変条件 I-1〜I-8 確認 | ☐ |
| 10-3 | MINOR 解決/未タスク化確定 | TECH-M-02 → Phase 12 引き継ぎ |
| 10-4 | blocker 判定 | 実装 blocker なし / commit・PR・screenshot は user-gated |

## 成果物

- `outputs/phase-10/final-review.md`（本 Phase を正本とする AC 判定 + MINOR 解決サマリ。実装済みとして判定欄を確定）
- 未タスク化対象リスト: TECH-M-02（`useDismissable` 抽出）/ globals.css `[data-shell="sidebar"]` 2 ブロック統合 → Phase 12 へ

## 完了条件

- [ ] Task 10-1: AC-1〜AC-6 を 1 件ずつ判定した（確定）
- [ ] Task 10-2: 不変条件 I-1〜I-8 を最終照合した
- [x] Task 10-3: MINOR 3 件の解決/未タスク化を確定した（TECH-M-01/03 = 本タスク解決、TECH-M-02 = Phase 12 未タスク化）
- [x] Task 10-4: blocker（commit/PR/screenshot が user-gated）を記録した
- [x] MINOR 判定が未タスク化対象であることを明記した（[unassigned ルール]）

## タスク100%実行確認【必須】

- [x] 全実行タスク（10-1〜10-4）を判定枠として記述した
- [x] 必須成果物（AC 判定 + MINOR 解決サマリ）を本ファイルに記載した
- [x] Phase 11 開始条件（最終レビュー枠の確定 + blocker なし）を満たす設計を記述した

## 次Phase

[Phase 11: 手動テスト / Evidence](phase-11-manual-test.md)
